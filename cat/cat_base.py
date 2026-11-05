
"""Rigged base cat — reference waiter proportions, smooth near-black outline."""
from __future__ import annotations
import math
from dataclasses import dataclass
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np
import cv2

OUTLINE = (26, 22, 20)
FILL = (255, 253, 250)
BLUSH = (255, 158, 168)
INNER_EAR = (255, 188, 192)
STRIPE = (145, 140, 145)


def head_bun_pts(cx, cy, rx, ry, n=96, amp=0.007, seed=0.2):
    pts = []
    for i in range(n):
        a = (i / n) * math.pi * 2 - math.pi / 2
        c, s = math.cos(a), math.sin(a)
        exp_x, exp_y = 1.9, 3.5
        k = abs(c) ** exp_x + abs(s) ** exp_y
        r = k ** (-1 / ((exp_x + exp_y) / 2))
        cheek = 1.0 + 0.09 * (abs(c) ** 0.85) * max(0.0, 1 - abs(s + 0.1))
        if s < -0.4:
            r *= 0.90 + 0.10 * max(0, 1 + s)
        w = 1 + math.sin(a * 2.6 + seed) * amp + math.cos(a * 4.1 + seed) * amp * 0.3
        pts.append((cx + c * rx * r * cheek * w, cy + s * ry * r * w))
    return pts


def body_pts(cx, cy, rx, ry, n=64, amp=0.009, seed=1.0):
    pts = []
    for i in range(n):
        a = (i / n) * math.pi * 2
        c, s = math.cos(a), math.sin(a)
        pear = 1 + 0.15 * max(0, s)
        exp = 2.1
        k = abs(c) ** exp + abs(s) ** exp
        r = k ** (-1 / exp)
        w = 1 + math.sin(a * 2.5 + seed) * amp
        pts.append((cx + c * rx * r * pear * w, cy + s * ry * r * w))
    return pts


def paint_shape(layer: Image.Image, pts, fill, outline, lw):
    """Fast even outline via OpenCV dilate on tight bbox."""
    if len(pts) < 3:
        return
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    pad = int(lw) + 4
    x0, y0 = max(0, int(min(xs)) - pad), max(0, int(min(ys)) - pad)
    x1, y1 = min(layer.width, int(max(xs)) + pad + 1), min(layer.height, int(max(ys)) + pad + 1)
    bw, bh = max(1, x1 - x0), max(1, y1 - y0)
    local = [(p[0] - x0, p[1] - y0) for p in pts]
    mask = np.zeros((bh, bw), np.uint8)
    cv2.fillPoly(mask, [np.array(local, np.int32)], 255)
    # light smooth edge
    mask = cv2.GaussianBlur(mask, (3, 3), 0)
    _, mask = cv2.threshold(mask, 100, 255, cv2.THRESH_BINARY)
    if outline and lw > 0:
        rad = max(1, int(round(lw)))
        ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (rad * 2 + 1, rad * 2 + 1))
        dil = cv2.dilate(mask, ker)
        ring = cv2.subtract(dil, mask)
        ol = np.zeros((bh, bw, 4), np.uint8)
        ol[ring > 0] = (*outline, 255)
        layer.alpha_composite(Image.fromarray(ol, 'RGBA'), (x0, y0))
    fl = np.zeros((bh, bw, 4), np.uint8)
    fc = fill if len(fill) == 4 else (*fill, 255)
    fl[mask > 0] = fc
    layer.alpha_composite(Image.fromarray(fl, 'RGBA'), (x0, y0))


def paint_ellipse(layer, cx, cy, rx, ry, fill, outline=None, lw=0, n=48, amp=0.007, seed=0.0):
    pts = [(cx + math.cos(a) * rx * (1 + math.sin(a * 2.3 + seed) * amp),
            cy + math.sin(a) * ry * (1 + math.sin(a * 2.3 + seed) * amp))
           for a in (i / n * math.pi * 2 for i in range(n))]
    paint_shape(layer, pts, fill, outline, lw)


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
    arm_L: float = 0.0
    arm_R: float = 0.0
    leg_L: float = 0.0
    leg_R: float = 0.0
    tail: float = 0.0
    body_bob: float = 0.0


def ease_in_out(x):
    return 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, x)))


def idle_pose(t):
    breath = (math.sin(t * 2.0) + 1) * 0.5
    bob = math.sin(t * 2.0) * 0.008
    cycle = t % 3.6
    if cycle < 0.09:
        blink = ease_in_out(cycle / 0.09)
    elif cycle < 0.16:
        blink = 1 - ease_in_out((cycle - 0.09) / 0.07)
    else:
        blink = 0.0
    et = t % 5.5
    ear_L = (math.sin(ease_in_out((et - 1.5) / 0.25) * math.pi) * 0.22
             if 1.5 < et < 1.75 else math.sin(t * 1.3) * 0.02)
    ear_R = (math.sin(ease_in_out((et - 3.6) / 0.25) * math.pi) * 0.2
             if 3.6 < et < 3.85 else math.sin(t * 1.5 + 1) * 0.02)
    return CatPose(
        breath=breath, head_tilt=math.sin(t * 0.7) * 0.035,
        ear_L=ear_L, ear_R=ear_R, blink=blink, mouth="w",
        arm_L=0.04 + math.sin(t * 1.4) * 0.05,
        arm_R=-0.04 + math.cos(t * 1.5) * 0.05,
        leg_L=0.02, leg_R=-0.02,
        tail=math.sin(t * 2.1) * 0.3,
        body_bob=bob,
    )


def walk_pose(t, speed=2.8):
    phase = t * speed
    swing = math.sin(phase)
    bob = (abs(math.sin(phase)) ** 1.35) * 0.026
    return CatPose(
        breath=(math.sin(t * 3.5) + 1) * 0.5,
        head_tilt=math.sin(phase * 0.5) * 0.03,
        ear_L=swing * 0.07, ear_R=-swing * 0.07,
        blink=0.0, mouth="w",
        arm_L=swing * 0.5, arm_R=-swing * 0.5,
        leg_L=swing * 0.45, leg_R=-swing * 0.45,
        tail=math.sin(phase * 1.1) * 0.35,
        body_bob=bob,
    )


def render_cat(size=800, pose=None, bg=(236, 224, 240)):
    pose = pose or CatPose()
    char_h = size * 0.76
    head_h = char_h * 0.60
    head_w = head_h * 1.38
    S = head_w
    lw = max(2.6, S * 0.038)

    base = Image.new("RGBA", (size, size), (*bg, 255))
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    cx = size * 0.5
    top = (size - char_h) / 2 + size * 0.015
    head_cy = top + head_h * 0.50 + pose.body_bob * S
    head_cx = cx
    body_w = S * 0.40
    body_h = S * 0.34 * (1 + pose.breath * 0.022)
    body_cy = head_cy + head_h * 0.38
    ht = pose.head_tilt

    # TAIL curled up behind
    t0x = cx - body_w * 0.08
    t0y = body_cy + body_h * 0.08
    centers, radii = [], []
    for i in range(18):
        u = i / 17
        ang = math.pi * 0.75 + u * (math.pi * 1.2 + pose.tail * 0.3)
        rad = S * (0.05 + u * 0.40)
        centers.append((t0x + math.cos(ang) * rad, t0y - math.sin(ang) * rad * 0.98))
        radii.append(S * (0.088 - u * 0.018))
    left, right = [], []
    for i, ((tx, ty), rr) in enumerate(zip(centers, radii)):
        if i == 0:
            dx, dy = centers[1][0] - tx, centers[1][1] - ty
        elif i == len(centers) - 1:
            dx, dy = tx - centers[-2][0], ty - centers[-2][1]
        else:
            dx = centers[i + 1][0] - centers[i - 1][0]
            dy = centers[i + 1][1] - centers[i - 1][1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        left.append((tx + nx * rr, ty + ny * rr))
        right.append((tx - nx * rr, ty - ny * rr))
    tip = centers[-1]; tip_r = radii[-1]
    dx = tip[0] - centers[-2][0]; dy = tip[1] - centers[-2][1]
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    tip_pts = [(tip[0] + math.cos(a) * (-uy) * tip_r + math.sin(a) * ux * tip_r,
                tip[1] + math.cos(a) * ux * tip_r + math.sin(a) * uy * tip_r)
               for a in (-math.pi / 2 + math.pi * k / 8 for k in range(9))]
    paint_shape(layer, left + tip_pts + list(reversed(right)), FILL, OUTLINE, lw * 0.9)
    for idx in (7, 11, 14):
        tx, ty = centers[idx]; rr = radii[idx]
        paint_ellipse(layer, tx, ty, rr * 0.65, rr * 0.26, (*STRIPE, 200), None, 0, amp=0.004, seed=idx)

    # LEGS
    for side, ang in ((-1, pose.leg_L), (1, pose.leg_R)):
        hx = cx + side * body_w * 0.32
        hy = body_cy + body_h * 0.62
        paw = rot(hx, hy + S * 0.07, ang * 0.7, hx, hy)
        paint_ellipse(layer, paw[0], paw[1], S * 0.085, S * 0.07, FILL, OUTLINE, lw * 0.85, seed=4 + side)

    paint_shape(layer, body_pts(cx, body_cy, body_w, body_h), FILL, OUTLINE, lw)

    for side, ang in ((-1, pose.arm_L), (1, pose.arm_R)):
        ax = cx + side * body_w * 0.36
        ay = body_cy + body_h * 0.08
        paw = rot(ax, ay + S * 0.08, ang, ax, ay)
        paint_ellipse(layer, paw[0], paw[1], S * 0.09, S * 0.08, FILL, OUTLINE, lw * 0.85, seed=7 + side)

    def draw_ear(side, twitch):
        bx = head_cx + side * head_w * 0.33
        by = head_cy - head_h * 0.34
        tip = rot(bx + side * S * 0.015, by - S * 0.16, twitch + side * 0.02, bx, by)
        p0 = (bx - side * S * 0.105, by + S * 0.045)
        p2 = (bx + side * S * 0.095, by + S * 0.05)
        m01 = ((p0[0] + tip[0]) / 2 - side * S * 0.02, (p0[1] + tip[1]) / 2 - S * 0.02)
        m12 = ((tip[0] + p2[0]) / 2 + side * S * 0.02, (tip[1] + p2[1]) / 2 - S * 0.02)
        # round tip with small arc
        tip_arc = []
        for k in range(6):
            a = math.pi * 0.15 + math.pi * 0.7 * k / 5
            tip_arc.append((tip[0] + math.cos(a - math.pi / 2) * S * 0.04 * side * 0.3,
                            tip[1] + math.sin(a - math.pi / 2) * S * 0.035 - S * 0.01))
        pts_local = [p0, m01] + tip_arc + [m12, p2]
        pts = [rot(x, y, ht, head_cx, head_cy) for x, y in pts_local]
        paint_shape(layer, pts, FILL, OUTLINE, lw)
        ix = sum(p[0] for p in pts) / len(pts)
        iy = sum(p[1] for p in pts) / len(pts) + S * 0.012
        inner = [(ix - side * S * 0.032, iy + S * 0.032),
                 (ix, iy - S * 0.055),
                 (ix + side * S * 0.034, iy + S * 0.03)]
        inn = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ImageDraw.Draw(inn).polygon(inner, fill=(*INNER_EAR, 255))
        layer.alpha_composite(inn)

    draw_ear(-1, pose.ear_L)
    draw_ear(1, pose.ear_R)

    hpts = head_bun_pts(head_cx, head_cy, head_w * 0.5, head_h * 0.5, amp=0.006, seed=0.3)
    hpts = [rot(x, y, ht, head_cx, head_cy) for x, y in hpts]
    paint_shape(layer, hpts, FILL, OUTLINE, lw)

    d = ImageDraw.Draw(layer)
    for dy in (-0.12, -0.055, 0.01):
        sx, sy = rot(head_cx - S * 0.015, head_cy + head_h * (dy - 0.12), ht, head_cx, head_cy)
        hw = S * 0.06
        d.arc([sx - hw, sy - S * 0.02, sx + hw, sy + S * 0.028], 205, 335,
              fill=STRIPE, width=max(2, int(lw * 0.38)))

    for side in (-1, 1):
        ex, ey = rot(head_cx + side * head_w * 0.30, head_cy + head_h * 0.10, ht, head_cx, head_cy)
        if pose.blink > 0.55:
            span = S * 0.04
            d.line([(ex, ey - span * 0.15), (ex + side * span * 0.75, ey + span * 0.08),
                    (ex, ey + span * 0.32)], fill=OUTLINE, width=max(2, int(lw * 0.5)))
        else:
            rx, ry = S * 0.032, S * 0.033 * max(0.1, 1 - pose.blink)
            d.ellipse([ex - rx, ey - ry, ex + rx, ey + ry], fill=OUTLINE)

    bl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for side in (-1, 1):
        bx, by = rot(head_cx + side * head_w * 0.33, head_cy + head_h * 0.24, ht, head_cx, head_cy)
        paint_ellipse(bl, bx, by, S * 0.07, S * 0.05, (*BLUSH, 205), None, 0, amp=0.004, seed=20 + side)
    bl = bl.filter(ImageFilter.GaussianBlur(radius=max(0.5, S * 0.005)))
    layer.alpha_composite(bl)
    d = ImageDraw.Draw(layer)

    mx, my = rot(head_cx, head_cy + head_h * 0.22, ht, head_cx, head_cy)
    mw, mh = S * 0.042, S * 0.028
    wline = max(2, int(lw * 0.36))
    for cx_ in (mx - mw * 0.48, mx + mw * 0.48):
        pts = [(cx_ + math.cos(math.pi + math.pi * k / 7) * mw * 0.48,
                my + math.sin(math.pi + math.pi * k / 7) * mh) for k in range(8)]
        for i in range(len(pts) - 1):
            d.line([pts[i], pts[i + 1]], fill=OUTLINE, width=wline)

    for side in (-1, 1):
        for j, dy in enumerate((0.05, 0.14)):
            x0, y0 = rot(head_cx + side * head_w * 0.48, head_cy + head_h * dy, ht, head_cx, head_cy)
            d.line([(x0, y0), (x0 + side * S * 0.10, y0 + (j - 0.5) * S * 0.012)],
                   fill=OUTLINE, width=max(2, int(lw * 0.26)))

    return Image.alpha_composite(base, layer).convert("RGB")


def make_gif(path, size=800, fps=12):
    frames = [render_cat(size, idle_pose(i / fps)) for i in range(int(3.0 * fps))]
    frames += [render_cat(size, walk_pose(i / fps)) for i in range(int(2.4 * fps))]
    frames[0].save(path, save_all=True, append_images=frames[1:], duration=int(1000 / fps), loop=0)
    return len(frames)


def make_compare(ref_path, out_path, size=480):
    ref = Image.open(ref_path).convert("RGB")
    ours = render_cat(size, CatPose(arm_L=0.08, arm_R=-0.04, tail=0.05), bg=(198, 172, 208))
    ref_fit = Image.new("RGB", (size, size), (198, 172, 208))
    r = ref.copy(); r.thumbnail((int(size * 0.92), int(size * 0.92)), Image.LANCZOS)
    ref_fit.paste(r, ((size - r.width) // 2, (size - r.height) // 2))
    canvas = Image.new("RGB", (size * 2 + 50, size + 72), (30, 22, 38))
    canvas.paste(ref_fit, (18, 42)); canvas.paste(ours, (size + 32, 42))
    d = ImageDraw.Draw(canvas)
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    d.text((22, 12), "reference", fill=(255, 230, 210), font=font)
    d.text((size + 36, 12), "vector base", fill=(255, 230, 210), font=font)
    canvas.save(out_path, quality=95)


if __name__ == "__main__":
    root = "/workspace/bday"
    print("gif", make_gif(f"{root}/cat_base.gif", 800, 12))
    make_compare(f"{root}/cat/ref_waiter_tight.png", f"{root}/cat_compare.png")
    render_cat(800, idle_pose(0.35)).save(f"{root}/cat/cat_still.png")
