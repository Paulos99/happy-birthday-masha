"""Base cat from traced cat_main.jpg geometry (736²). Rigged idle+walk."""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REF = 736.0
GEOM_PATH = Path("/workspace/bday/cat/measure/exact_paths.json")
_G = json.loads(GEOM_PATH.read_text())

STROKE = float(_G["stroke_w"])
HEAD = [tuple(p) for p in _G["head"]]
BODY = [tuple(p) for p in _G["body"]]
EYE_L, EYE_R = tuple(_G["eyes"][0]), tuple(_G["eyes"][1])
EYE_R_PX = float(_G["eye_r"])
BLUSH_L, BLUSH_R = tuple(_G["blush"][0]), tuple(_G["blush"][1])
BLUSH_R_PX = float(_G["blush_r"])
STRIPES = _G["stripes"]
WHISK_L = [tuple(w) for w in _G["whiskers_L"]]
WHISK_R = [tuple(w) for w in _G["whiskers_R"]]
MOUTH_C = tuple(_G["mouth_c"])
MOUTH_W = float(_G["mouth_w"])
HEAD_CX = float(_G["head_cx"])
HEAD_CY = float(_G["head_cy"])
BODY_CX = float(_G["body_cx"])
NOTCH_Y = float(_G["notch_y"])
FOOT_Y = float(_G["foot_y"])
FOOT_L_X = float(_G["foot_l_x"])
FOOT_R_X = float(_G["foot_r_x"])

OUTLINE = (18, 16, 14)
FILL = (255, 255, 255)
BLUSH = (255, 186, 170)
STRIPE = (168, 164, 166)
BG = (255, 255, 255)


def wobble(pts, amp, seed=0.0):
    if amp <= 0 or len(pts) < 4:
        return list(pts)
    out = []
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        p0 = pts[i - 1]
        p1 = pts[(i + 1) % n]
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        L = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / L, dx / L
        a = (i / n) * math.pi * 2
        j = math.sin(a * 3.0 + seed) * amp + math.sin(a * 7.0 + seed * 1.4) * amp * 0.4
        out.append((x + nx * j, y + ny * j))
    return out


def head_path(ear_L=0.0, ear_R=0.0):
    """Traced head+ears; optional ear tip twitch."""
    pts = list(HEAD)
    # Twitch: pull nearest tip neighborhood
    for tip_target, twitch, side in (
        ((247.0, 163.0), ear_L, -1),
        ((513.0, 165.0), ear_R, 1),
    ):
        if abs(twitch) < 1e-4:
            continue
        i = min(range(len(pts)), key=lambda k: (pts[k][0] - tip_target[0]) ** 2 + (pts[k][1] - tip_target[1]) ** 2)
        dx = twitch * 10 * side
        dy = -abs(twitch) * 6
        for k in range(-2, 3):
            j = (i + k) % len(pts)
            w = 1.0 - abs(k) / 3.0
            x, y = pts[j]
            pts[j] = (x + dx * w, y + dy * w)
    return pts


def body_path():
    return list(BODY)


@dataclass
class CatPose:
    breath: float = 0.0
    head_tilt: float = 0.0
    ear_L: float = 0.0
    ear_R: float = 0.0
    blink: float = 0.0
    arm_L: float = 0.0
    arm_R: float = 0.0
    leg_L: float = 0.0
    leg_R: float = 0.0
    body_bob: float = 0.0


def ease_in_out(x):
    return 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, x)))


def idle_pose(t):
    breath = (math.sin(t * 2.0) + 1) * 0.5
    bob = math.sin(t * 2.0) * 1.5
    cycle = t % 3.6
    if cycle < 0.09:
        blink = ease_in_out(cycle / 0.09)
    elif cycle < 0.16:
        blink = 1 - ease_in_out((cycle - 0.09) / 0.07)
    else:
        blink = 0.0
    et = t % 5.5
    ear_L = math.sin(ease_in_out((et - 1.5) / 0.25) * math.pi) * 0.12 if 1.5 < et < 1.75 else math.sin(t * 1.3) * 0.02
    ear_R = math.sin(ease_in_out((et - 3.6) / 0.25) * math.pi) * 0.10 if 3.6 < et < 3.85 else math.sin(t * 1.5 + 1) * 0.02
    return CatPose(
        breath=breath, head_tilt=math.sin(t * 0.7) * 0.03,
        ear_L=ear_L, ear_R=ear_R, blink=blink,
        arm_L=0.04 + math.sin(t * 1.4) * 0.03, arm_R=-0.04 + math.cos(t * 1.5) * 0.03,
        leg_L=0.02, leg_R=-0.02, body_bob=bob,
    )


def walk_pose(t, speed=2.8):
    phase = t * speed
    swing = math.sin(phase)
    bob = (abs(math.sin(phase)) ** 1.35) * 4.0
    return CatPose(
        breath=(math.sin(t * 3.5) + 1) * 0.5, head_tilt=math.sin(phase * 0.5) * 0.02,
        ear_L=swing * 0.06, ear_R=-swing * 0.06, blink=0.0,
        arm_L=swing * 0.28, arm_R=-swing * 0.28,
        leg_L=swing * 0.22, leg_R=-swing * 0.22, body_bob=bob,
    )


def rot(x, y, ang, ox, oy):
    ca, sa = math.cos(ang), math.sin(ang)
    dx, dy = x - ox, y - oy
    return ox + dx * ca - dy * sa, oy + dx * sa + dy * ca


def paint_shape(layer, pts, fill, outline, lw):
    """Filled silhouette + thick rounded outline (dilate ring)."""
    if len(pts) < 3:
        return
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    pad = int(lw) + 6
    x0 = max(0, int(min(xs)) - pad)
    y0 = max(0, int(min(ys)) - pad)
    x1 = min(layer.width, int(max(xs)) + pad + 1)
    y1 = min(layer.height, int(max(ys)) + pad + 1)
    bw, bh = max(1, x1 - x0), max(1, y1 - y0)
    local = np.array([(p[0] - x0, p[1] - y0) for p in pts], np.int32)
    mask = np.zeros((bh, bw), np.uint8)
    cv2.fillPoly(mask, [local], 255)
    # slight breath scale already applied to pts; soft edge
    mask = cv2.GaussianBlur(mask, (3, 3), 0)
    _, mask = cv2.threshold(mask, 100, 255, cv2.THRESH_BINARY)
    if outline and lw > 0:
        rad = max(1, int(round(lw)))
        ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (rad * 2 + 1, rad * 2 + 1))
        ring = cv2.subtract(cv2.dilate(mask, ker), mask)
        ol = np.zeros((bh, bw, 4), np.uint8)
        ol[ring > 0] = (*outline, 255)
        layer.alpha_composite(Image.fromarray(ol, "RGBA"), (x0, y0))
    if fill is not None:
        fl = np.zeros((bh, bw, 4), np.uint8)
        fc = fill if len(fill) == 4 else (*fill, 255)
        fl[mask > 0] = fc
        layer.alpha_composite(Image.fromarray(fl, "RGBA"), (x0, y0))


def paint_poly_stroke(layer, pts, outline, lw, closed=True):
    """Stroke centerline with round caps (matches hand-ink look)."""
    if len(pts) < 2:
        return
    d = ImageDraw.Draw(layer)
    seq = list(pts) + ([pts[0]] if closed else [])
    d.line(seq, fill=(*outline, 255), width=max(1, int(round(lw))), joint="curve")
    r = max(1, int(round(lw / 2)))
    for p in pts:
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=(*outline, 255))


def paint_stroke(layer, p0, p1, outline, lw):
    d = ImageDraw.Draw(layer)
    d.line([p0, p1], fill=(*outline, 255), width=max(1, int(round(lw))))
    r = max(1, int(round(lw / 2)))
    for p in (p0, p1):
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=(*outline, 255))


def deform_body(pts, pose: CatPose, bob: float):
    """Bob + arm/leg squash via local warps on integrated nubs/feet."""
    out = []
    for x, y in pts:
        y = y + bob
        # arm nubs: points past sides around arm height
        if 455 < y - bob < 545:
            if x > BODY_CX + 90:
                # right arm — swing
                x, y = rot(x, y, pose.arm_R * 0.35, BODY_CX + 140, 500 + bob)
                x += pose.arm_R * 6
            elif x < BODY_CX - 90:
                x, y = rot(x, y, pose.arm_L * 0.35, BODY_CX - 140, 500 + bob)
                x += pose.arm_L * 6
        # feet
        if y > NOTCH_Y + bob - 4:
            if x < BODY_CX:
                x, y = rot(x, y, pose.leg_L * 0.35, FOOT_L_X, FOOT_Y + bob)
            else:
                x, y = rot(x, y, pose.leg_R * 0.35, FOOT_R_X, FOOT_Y + bob)
        # breath: slight width
        x = BODY_CX + (x - BODY_CX) * (1 + pose.breath * 0.012)
        out.append((x, y))
    return out


def render_cat_ref(pose=None, transparent=False, bg=BG):
    pose = pose or CatPose()
    lw = STROKE
    size = int(REF)
    base = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent else (*bg, 255))
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bob = pose.body_bob
    ht = pose.head_tilt

    def xf_head(x, y):
        return rot(x, y + bob * 0.3, ht, HEAD_CX, HEAD_CY + bob * 0.3)

    # BODY (arms integrated as nubs — not detached ovals)
    bpts = deform_body(body_path(), pose, bob)
    # Fill white body then stroke outline for clean ink look
    paint_shape(layer, bpts, FILL, None, 0)
    paint_poly_stroke(layer, bpts, OUTLINE, lw, closed=True)

    # HEAD+EARS (single continuous outline)
    hpts = [xf_head(x, y) for x, y in head_path(pose.ear_L, pose.ear_R)]
    # slight breath on head
    hpts = [
        (HEAD_CX + (x - HEAD_CX) * (1 + pose.breath * 0.008),
         HEAD_CY + bob * 0.3 + (y - HEAD_CY - bob * 0.3) * (1 + pose.breath * 0.006))
        for x, y in hpts
    ]
    paint_shape(layer, hpts, FILL, None, 0)
    paint_poly_stroke(layer, hpts, OUTLINE, lw, closed=True)

    d = ImageDraw.Draw(layer)

    # STRIPES — thick rounded grey bars top-center forehead
    for s in STRIPES:
        sx, sy = s["c"]
        h, w, slant = s["h"], s["w"], s["slant"]
        x0, y0 = xf_head(sx - slant * h / 2, sy - h / 2)
        x1, y1 = xf_head(sx + slant * h / 2, sy + h / 2)
        steps = 12
        for k in range(steps + 1):
            t = k / steps
            px = x0 * (1 - t) + x1 * t
            py = y0 * (1 - t) + y1 * t
            rr = w * 0.55
            d.ellipse([px - rr, py - rr * 0.92, px + rr, py + rr * 0.92], fill=(*STRIPE, 255))

    # BLUSH outside eyes at cheek edges (under eyes)
    bl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for (bx, by) in (BLUSH_L, BLUSH_R):
        x, y = xf_head(bx, by)
        paint_shape(
            bl,
            [
                (x + math.cos(a) * BLUSH_R_PX, y + math.sin(a) * BLUSH_R_PX * 0.95)
                for a in (i / 24 * math.pi * 2 for i in range(24))
            ],
            (*BLUSH, 235),
            None,
            0,
        )
    bl = bl.filter(ImageFilter.GaussianBlur(radius=1.2))
    layer.alpha_composite(bl)
    d = ImageDraw.Draw(layer)

    # EYES on top of blush
    for (ex, ey) in (EYE_L, EYE_R):
        x, y = xf_head(ex, ey)
        if pose.blink > 0.55:
            d.line([(x - EYE_R_PX, y), (x + EYE_R_PX, y)], fill=(*OUTLINE, 255), width=max(3, int(lw * 0.5)))
        else:
            rr = EYE_R_PX * max(0.15, 1 - pose.blink)
            d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(*OUTLINE, 255))

    # ω mouth mid-head
    mx, my = xf_head(*MOUTH_C)
    mw, mh = MOUTH_W, MOUTH_W * 0.38
    wline = max(3, int(lw * 0.65))
    for cx_ in (mx - mw * 0.28, mx + mw * 0.28):
        pts = [
            (cx_ + math.cos(math.pi * k / 10) * mw * 0.28, my + math.sin(math.pi * k / 10) * mh)
            for k in range(11)
        ]
        for i in range(len(pts) - 1):
            d.line([pts[i], pts[i + 1]], fill=(*OUTLINE, 255), width=wline)
        # round caps
        r = max(1, wline // 2)
        for p in (pts[0], pts[-1]):
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=(*OUTLINE, 255))

    # WHISKERS — 2 thick per side
    for x0, y0, x1, y1 in list(WHISK_L) + list(WHISK_R):
        paint_stroke(layer, xf_head(x0, y0), xf_head(x1, y1), OUTLINE, lw * 0.9)

    out = Image.alpha_composite(base, layer)
    return out if transparent else out.convert("RGB")


def render_cat(size=800, pose=None, bg=BG, transparent=False):
    img = render_cat_ref(pose=pose, transparent=True, bg=bg)
    scaled = img.resize((size, size), Image.LANCZOS)
    if transparent:
        return scaled
    base = Image.new("RGB", (size, size), bg)
    base.paste(scaled, (0, 0), scaled)
    return base


def make_overlay(out_path="/workspace/bday/cat_compare.png", size=520):
    ref = Image.open("/workspace/bday/refs/cat_main.jpg").convert("RGB")
    cat = render_cat_ref(CatPose(), transparent=True)
    overlay = Image.new("RGBA", ref.size, (255, 255, 255, 255))
    overlay.paste(ref, (0, 0))
    ca = cat.copy()
    ca.putalpha(ca.split()[-1].point(lambda p: int(p * 0.50)))
    overlay.alpha_composite(ca)

    ours = render_cat_ref(CatPose(), transparent=False, bg=(255, 255, 255))

    def fit(im):
        im = im.convert("RGB")
        im.thumbnail((size, size), Image.LANCZOS)
        box = Image.new("RGB", (size, size), (255, 255, 255))
        box.paste(im, ((size - im.width) // 2, (size - im.height) // 2))
        return box

    strip = Image.new("RGB", (size * 3 + 60, size + 78), (30, 28, 34))
    strip.paste(fit(ref), (15, 42))
    strip.paste(fit(overlay.convert("RGB")), (size + 30, 42))
    strip.paste(fit(ours), (size * 2 + 45, 42))
    dd = ImageDraw.Draw(strip)
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    dd.text((20, 12), "reference (cat_main)", fill=(255, 230, 210), font=font)
    dd.text((size + 35, 12), "overlay 50%", fill=(255, 230, 210), font=font)
    dd.text((size * 2 + 50, 12), "vector base", fill=(255, 230, 210), font=font)
    dd.text(
        (20, size + 50),
        f"traced geom stroke={STROKE:.0f}px ears=(247,163)/(513,165) eyes=({EYE_L[0]:.0f},{EYE_L[1]:.0f})-({EYE_R[0]:.0f},{EYE_R[1]:.0f})",
        fill=(180, 170, 190),
        font=font,
    )
    strip.save(out_path, quality=95)
    overlay.convert("RGB").save("/workspace/bday/cat/measure/overlay_1to1.png")
    # ink diff for QA
    ref_a = np.array(ref.convert("L"))
    ours_a = np.array(ours.convert("L"))
    ref_ink = ref_a < 100
    ours_ink = ours_a < 100
    diff = np.zeros((*ref_a.shape, 3), np.uint8)
    diff[:] = 255
    diff[ref_ink & ~ours_ink] = (40, 200, 80)   # ref only = green
    diff[ours_ink & ~ref_ink] = (220, 60, 60)   # ours only = red
    diff[ref_ink & ours_ink] = (30, 30, 30)     # match = black
    Image.fromarray(diff).save("/workspace/bday/cat/measure/ink_diff.png")
    return out_path


def make_gif(path, size=900, fps=12):
    frames = [render_cat(size, idle_pose(i / fps)) for i in range(int(3.0 * fps))]
    frames += [render_cat(size, walk_pose(i / fps)) for i in range(int(2.4 * fps))]
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=int(1000 / fps), loop=0)
    return len(frames)


def main():
    root = Path("/workspace/bday")
    n = make_gif(root / "cat_base.gif", 900, 12)
    make_overlay(str(root / "cat_compare.png"), 520)
    render_cat(1200, idle_pose(0.2)).save(root / "cat/cat_still.png")
    print("gif_frames", n)


if __name__ == "__main__":
    main()
