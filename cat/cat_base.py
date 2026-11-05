
"""Rigged base cat — reference-style kawaii, soft dark-brown wobbly outline."""
from __future__ import annotations
import math
from dataclasses import dataclass
from typing import List
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUTLINE = (38, 30, 28)
FILL = (255, 252, 248)
BLUSH = (255, 168, 172)
INNER_EAR = (255, 188, 192)
STRIPE = (155, 150, 155)
TONGUE = (255, 145, 158)
MOUTH_IN = (55, 38, 42)


def wobble_ellipse(cx, cy, rx, ry, n=52, amp=0.028, seed=0.0, exp=2.35):
    pts = []
    for i in range(n):
        a = (i / n) * math.pi * 2
        c, s = math.cos(a), math.sin(a)
        k = abs(c) ** exp + abs(s) ** exp
        r = k ** (-1 / exp)
        w = 1 + math.sin(a * 2.9 + seed) * amp + math.cos(a * 5.3 + seed * 1.1) * amp * 0.5
        pts.append((cx + c * rx * r * w, cy + s * ry * r * w))
    return pts


def stroke_poly(draw, pts, fill, outline, lw):
    draw.polygon(pts, fill=fill)
    if not outline or lw <= 0:
        return
    n = len(pts)
    w = max(1, int(round(lw)))
    for i in range(n):
        draw.line([pts[i], pts[(i + 1) % n]], fill=outline, width=w, joint="curve")
    r = max(1, w // 2)
    for x, y in pts:
        draw.ellipse([x - r, y - r, x + r, y + r], fill=outline)


def blob(draw, cx, cy, rx, ry, fill, outline, lw, amp=0.03, seed=0.0, exp=2.35):
    stroke_poly(draw, wobble_ellipse(cx, cy, rx, ry, amp=amp, seed=seed, exp=exp), fill, outline, lw)


def rot(x, y, ang, ox, oy):
    ca, sa = math.cos(ang), math.sin(ang)
    dx, dy = x - ox, y - oy
    return ox + dx * ca - dy * sa, oy + dx * sa + dy * ca


@dataclass
class CatPose:
    breath: float = 0.0
    head_tilt: float = 0.0
    ear_L: float = 0.0
    ear_R: float = 0.0
    blink: float = 0.0
    mouth: str = "w"
    arm_L: float = 0.25
    arm_R: float = -0.25
    leg_L: float = 0.05
    leg_R: float = -0.05
    tail: float = 0.5
    body_bob: float = 0.0


def idle_pose(t: float) -> CatPose:
    breath = (math.sin(t * 2.1) + 1) * 0.5
    bob = math.sin(t * 2.1) * 0.01
    cycle = t % 3.4
    if cycle < 0.07:
        blink = cycle / 0.07
    elif cycle < 0.14:
        blink = 1 - (cycle - 0.07) / 0.07
    else:
        blink = 0.0
    et = t % 5.2
    ear_L = math.sin(et * 20) * 0.28 if 1.5 < et < 1.75 else math.sin(t * 1.4) * 0.035
    ear_R = math.sin(et * 18 + 0.7) * 0.25 if 3.4 < et < 3.65 else math.sin(t * 1.6 + 1) * 0.035
    return CatPose(
        breath=breath, head_tilt=math.sin(t * 0.85) * 0.05,
        ear_L=ear_L, ear_R=ear_R, blink=blink, mouth="w",
        arm_L=0.45 + math.sin(t * 1.7) * 0.08,
        arm_R=-0.25 + math.cos(t * 1.8) * 0.08,
        leg_L=0.04, leg_R=-0.04,
        tail=0.55 + math.sin(t * 2.5) * 0.4,
        body_bob=bob,
    )


def walk_pose(t: float, speed: float = 3.4) -> CatPose:
    phase = t * speed
    return CatPose(
        breath=(math.sin(t * 4.2) + 1) * 0.5,
        head_tilt=math.sin(phase * 0.5) * 0.04,
        ear_L=math.sin(phase) * 0.1, ear_R=-math.sin(phase) * 0.1,
        blink=0.0, mouth="w",
        arm_L=math.sin(phase) * 0.7,
        arm_R=math.sin(phase + math.pi) * 0.7,
        leg_L=math.sin(phase) * 0.65,
        leg_R=math.sin(phase + math.pi) * 0.65,
        tail=0.6 + math.sin(phase * 1.3) * 0.45,
        body_bob=abs(math.sin(phase)) * 0.035,
    )


def render_cat(size=800, pose: CatPose | None = None, bg=(242, 232, 245), scale=None):
    pose = pose or CatPose()
    S = scale if scale is not None else size * 0.42
    img = Image.new("RGBA", (size, size), (*bg, 255))
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    cx = size * 0.5
    feet_y = size * 0.88 + pose.body_bob * S
    lw = max(2.6, S * 0.055)

    body_w = S * 0.48
    body_h = S * 0.42 * (1 + pose.breath * 0.028)
    body_cy = feet_y - body_h * 0.68

    head_w = S * 1.08
    head_h = S * 0.78
    head_cx = cx
    head_cy = body_cy - body_h * 0.48 - head_h * 0.22
    ht = pose.head_tilt

    # TAIL: one continuous white sausage, single outline, grey stripes
    t0x, t0y = cx - body_w * 0.28, body_cy + body_h * 0.12
    centers, radii = [], []
    for i in range(14):
        u = i / 13
        ang = -2.4 - pose.tail * 0.55 * u
        rad = S * (0.12 + u * 0.85)
        centers.append((t0x + math.cos(ang) * rad * 0.75,
                        t0y + math.sin(ang) * rad * 0.48 - u * S * 0.05))
        radii.append(S * (0.11 - u * 0.025))
    # build left/right edge of sausage
    left, right = [], []
    for i, ((tx, ty), rr) in enumerate(zip(centers, radii)):
        if i == 0:
            dx, dy = centers[1][0] - tx, centers[1][1] - ty
        elif i == len(centers) - 1:
            dx, dy = tx - centers[i - 1][0], ty - centers[i - 1][1]
        else:
            dx = centers[i + 1][0] - centers[i - 1][0]
            dy = centers[i + 1][1] - centers[i - 1][1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        left.append((tx + nx * rr, ty + ny * rr))
        right.append((tx - nx * rr, ty - ny * rr))
    # tip cap
    tip = centers[-1]
    tip_r = radii[-1]
    dx = tip[0] - centers[-2][0]; dy = tip[1] - centers[-2][1]
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    tip_pts = []
    for k in range(7):
        a = -math.pi / 2 + math.pi * k / 6
        tip_pts.append((tip[0] + math.cos(a) * ux * tip_r - math.sin(a) * uy * tip_r,
                        tip[1] + math.cos(a) * uy * tip_r + math.sin(a) * ux * tip_r))
    sausage = left + tip_pts + list(reversed(right))
    stroke_poly(d, sausage, FILL, OUTLINE, lw * 0.9)
    for idx in (8, 11):
        tx, ty = centers[idx]; rr = radii[idx]
        blob(d, tx, ty, rr * 0.75, rr * 0.32, (*STRIPE, 190), None, 0, amp=0.015, seed=idx)

    # LEGS
    for side, ang in ((-1, pose.leg_L), (1, pose.leg_R)):
        hx = cx + side * body_w * 0.30
        hy = body_cy + body_h * 0.42
        paw = rot(hx, hy + S * 0.16, ang, hx, hy)
        blob(d, paw[0], paw[1], S * 0.115, S * 0.10, FILL, OUTLINE, lw * 0.85, seed=4 + side)

    # BODY
    blob(d, cx, body_cy, body_w, body_h, FILL, OUTLINE, lw, amp=0.03, seed=1.0, exp=2.15)

    # ARMS
    for side, ang in ((-1, pose.arm_L), (1, pose.arm_R)):
        sx_ = cx + side * body_w * 0.85
        sy_ = body_cy - body_h * 0.02
        paw = rot(sx_ + side * S * 0.02, sy_ + S * 0.16, ang, sx_, sy_)
        blob(d, paw[0], paw[1], S * 0.115, S * 0.105, FILL, OUTLINE, lw * 0.85, seed=7 + side)

    # EARS
    def draw_ear(side, twitch):
        bx = head_cx + side * head_w * 0.38
        by = head_cy - head_h * 0.32
        tip = rot(bx + side * S * 0.005, by - S * 0.175, twitch + side * 0.03, bx, by)
        p0 = rot(bx - side * S * 0.09, by + S * 0.04, ht, head_cx, head_cy)
        p1 = rot(tip[0], tip[1], ht, head_cx, head_cy)
        p2 = rot(bx + side * S * 0.075, by + S * 0.05, ht, head_cx, head_cy)
        mid01 = ((p0[0] + p1[0]) / 2 + side * S * 0.008, (p0[1] + p1[1]) / 2 - S * 0.008)
        mid12 = ((p1[0] + p2[0]) / 2 - side * S * 0.008, (p1[1] + p2[1]) / 2 - S * 0.008)
        stroke_poly(d, [p0, mid01, p1, mid12, p2], FILL, OUTLINE, lw)
        ix = (p0[0] + p1[0] + p2[0]) / 3
        iy = (p0[1] + p1[1] + p2[1]) / 3 + S * 0.015
        d.polygon([
            (ix - side * S * 0.025, iy + S * 0.028),
            (ix, iy - S * 0.04),
            (ix + side * S * 0.028, iy + S * 0.025),
        ], fill=INNER_EAR)

    draw_ear(-1, pose.ear_L)
    draw_ear(1, pose.ear_R)

    # HEAD
    hpts = wobble_ellipse(head_cx, head_cy, head_w * 0.5, head_h * 0.48, amp=0.022, seed=0.4, exp=2.7)
    hpts = [rot(x, y, ht, head_cx, head_cy) for x, y in hpts]
    stroke_poly(d, hpts, FILL, OUTLINE, lw)

    stripe_l = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stripe_l)
    for i, (dx, hh, ww) in enumerate([(-0.095, 0.10, 0.032), (0.0, 0.125, 0.036), (0.095, 0.10, 0.032)]):
        sx, sy = rot(head_cx + dx * S, head_cy - head_h * 0.18, ht, head_cx, head_cy)
        blob(sd, sx, sy, S * ww, S * hh, (*STRIPE, 175), None, 0, amp=0.012, seed=10 + i)
    layer = Image.alpha_composite(layer, stripe_l)
    d = ImageDraw.Draw(layer)

    for side in (-1, 1):
        ex, ey = rot(head_cx + side * head_w * 0.195, head_cy + head_h * 0.04, ht, head_cx, head_cy)
        if pose.blink > 0.5:
            span = S * 0.06
            s = side
            d.line([(ex, ey - span * 0.25), (ex + s * span * 0.85, ey + span * 0.1)], fill=OUTLINE, width=max(2, int(lw * 0.65)))
            d.line([(ex + s * span * 0.85, ey + span * 0.1), (ex, ey + span * 0.4)], fill=OUTLINE, width=max(2, int(lw * 0.65)))
        else:
            r = S * 0.045 * (1 - pose.blink * 0.9)
            ry = r * max(0.12, 1 - pose.blink)
            d.ellipse([ex - r, ey - ry, ex + r, ey + ry], fill=OUTLINE)

    bl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bl)
    for side in (-1, 1):
        bx, by = rot(head_cx + side * head_w * 0.30, head_cy + head_h * 0.18, ht, head_cx, head_cy)
        blob(bd, bx, by, S * 0.088, S * 0.065, (*BLUSH, 145), None, 0, amp=0.02, seed=20 + side)
    bl = bl.filter(ImageFilter.GaussianBlur(radius=max(1.5, S * 0.016)))
    layer = Image.alpha_composite(layer, bl)
    d = ImageDraw.Draw(layer)

    mx, my = rot(head_cx, head_cy + head_h * 0.22, ht, head_cx, head_cy)
    mw, mh = S * 0.07, S * 0.05
    wline = max(2, int(lw * 0.5))
    if pose.mouth == "open":
        blob(d, mx, my + S * 0.035, S * 0.085, S * 0.08, MOUTH_IN, OUTLINE, lw * 0.5, seed=30)
        blob(d, mx, my + S * 0.06, S * 0.055, S * 0.04, TONGUE, None, 0, seed=31)
        for cx_ in (mx - mw * 0.55, mx + mw * 0.55):
            pts = [(cx_ + math.cos(math.pi + math.pi * k / 8) * mw * 0.55,
                    my + math.sin(math.pi + math.pi * k / 8) * mh) for k in range(9)]
            for i in range(len(pts) - 1):
                d.line([pts[i], pts[i + 1]], fill=OUTLINE, width=wline)
    else:
        for cx_ in (mx - mw * 0.55, mx + mw * 0.55):
            pts = [(cx_ + math.cos(math.pi + math.pi * k / 8) * mw * 0.55,
                    my + math.sin(math.pi + math.pi * k / 8) * mh) for k in range(9)]
            for i in range(len(pts) - 1):
                d.line([pts[i], pts[i + 1]], fill=OUTLINE, width=wline)

    for side in (-1, 1):
        for j, dy in enumerate((-0.01, 0.06, 0.13)):
            x0, y0 = rot(head_cx + side * head_w * 0.42, head_cy + head_h * dy, ht, head_cx, head_cy)
            x1 = x0 + side * S * (0.13 + j * 0.008)
            y1 = y0 + (j - 1) * S * 0.012
            d.line([(x0, y0), (x1, y1)], fill=OUTLINE, width=max(2, int(lw * 0.35)))

    return Image.alpha_composite(img, layer).convert("RGB")


def make_gif(path, size=800, fps=12):
    frames = []
    for i in range(int(2.8 * fps)):
        frames.append(render_cat(size=size, pose=idle_pose(i / fps)))
    for i in range(int(2.2 * fps)):
        frames.append(render_cat(size=size, pose=walk_pose(i / fps)))
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=int(1000 / fps), loop=0)
    return len(frames)


def make_compare(ref_path, out_path, size=440):
    ref = Image.open(ref_path).convert("RGB")
    ours = render_cat(size=size, pose=CatPose(arm_L=0.45, arm_R=-0.3, tail=0.7), bg=(205, 180, 215))
    ref_fit = Image.new("RGB", (size, size), (205, 180, 215))
    r = ref.copy()
    r.thumbnail((size - 16, size - 16), Image.LANCZOS)
    ref_fit.paste(r, ((size - r.width) // 2, (size - r.height) // 2))
    canvas = Image.new("RGB", (size * 2 + 40, size + 64), (34, 26, 44))
    canvas.paste(ref_fit, (15, 36))
    canvas.paste(ours, (size + 25, 36))
    d = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 17)
    except Exception:
        font = ImageFont.load_default()
    d.text((20, 8), "reference", fill=(255, 230, 210), font=font)
    d.text((size + 30, 8), "vector base", fill=(255, 230, 210), font=font)
    canvas.save(out_path, quality=95)


if __name__ == "__main__":
    root = "/workspace/bday"
    print("gif", make_gif(f"{root}/cat_base.gif", 800, 12))
    make_compare(f"{root}/cat/ref_compliment.png", f"{root}/cat_compare.png")
    render_cat(800, idle_pose(0.5)).save(f"{root}/cat/cat_still.png")
