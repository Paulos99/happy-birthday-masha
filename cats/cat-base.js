/** Rigged base cat (canvas). Origin at feet-center. scale = head width px. */
(function (global) {
  const COL = {
    outline: '#261e1c', fill: '#fffcf8',
    blush: 'rgba(255,168,172,0.55)', inner: '#ffbcc0',
    stripe: 'rgba(155,150,155,0.75)',
  };
  function wobbleEllipse(ctx, cx, cy, rx, ry, amp, seed, exp) {
    amp = amp == null ? 0.028 : amp; seed = seed || 0; exp = exp || 2.5;
    const n = 48; ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      const k = Math.pow(Math.abs(c), exp) + Math.pow(Math.abs(s), exp);
      const r = Math.pow(k, -1 / exp);
      const w = 1 + Math.sin(a * 2.9 + seed) * amp + Math.cos(a * 5.3 + seed) * amp * 0.5;
      const x = cx + c * rx * r * w, y = cy + s * ry * r * w;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  function fillStroke(ctx, lw) {
    ctx.fillStyle = COL.fill; ctx.fill();
    ctx.strokeStyle = COL.outline; ctx.lineWidth = lw;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function drawBaseCat(ctx, c) {
    const t = c.t || 0, S = c.scale || 80, lw = Math.max(2.4, S * 0.055);
    const breath = (Math.sin(t * 2.1 + (c.phase || 0)) + 1) * 0.5;
    const bob = Math.sin(t * 2.1 + (c.phase || 0)) * S * 0.01;
    const cycle = t % 3.4;
    const blink = c.blink != null ? c.blink : (cycle < 0.14 ? (cycle < 0.07 ? cycle / 0.07 : 1 - (cycle - 0.07) / 0.07) : 0);
    const walk = c.walkPhase != null ? c.walkPhase : null;
    const face = c.facing >= 0 ? 1 : -1;
    ctx.save(); ctx.translate(c.x, c.y + bob); ctx.scale(face, 1);
    const bodyW = S * 0.48, bodyH = S * 0.42 * (1 + breath * 0.028), bodyCy = -bodyH * 0.68;
    const headW = S * 1.08, headH = S * 0.78;
    const headCy = bodyCy - bodyH * 0.48 - headH * 0.22;
    const headTilt = Math.sin(t * 0.85) * 0.05;
    const tailAng = walk != null ? 0.6 + Math.sin(walk * 1.3) * 0.45 : 0.55 + Math.sin(t * 2.5) * 0.4;
    const armL = walk != null ? Math.sin(walk) * 0.7 : 0.45;
    const armR = walk != null ? Math.sin(walk + Math.PI) * 0.7 : -0.25;
    const legL = walk != null ? Math.sin(walk) * 0.65 : 0.04;
    const legR = walk != null ? Math.sin(walk + Math.PI) * 0.65 : -0.04;

    ctx.save(); ctx.translate(-bodyW * 0.28, bodyCy + bodyH * 0.12); ctx.rotate(-0.9 - tailAng * 0.4);
    wobbleEllipse(ctx, -S * 0.35, -S * 0.05, S * 0.38, S * 0.11, 0.04, 2); fillStroke(ctx, lw * 0.9);
    ctx.fillStyle = COL.stripe;
    ctx.beginPath(); ctx.ellipse(-S * 0.4, -S * 0.05, S * 0.07, S * 0.03, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-S * 0.55, -S * 0.02, S * 0.06, S * 0.025, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    [[-1, legL], [1, legR]].forEach(function (p) {
      ctx.save(); ctx.translate(p[0] * bodyW * 0.3, bodyCy + bodyH * 0.42); ctx.rotate(p[1]);
      wobbleEllipse(ctx, 0, S * 0.14, S * 0.115, S * 0.1, 0.04, 4 + p[0]); fillStroke(ctx, lw * 0.85); ctx.restore();
    });
    wobbleEllipse(ctx, 0, bodyCy, bodyW, bodyH, 0.03, 1, 2.15); fillStroke(ctx, lw);
    [[-1, armL], [1, armR]].forEach(function (p) {
      ctx.save(); ctx.translate(p[0] * bodyW * 0.85, bodyCy); ctx.rotate(p[1]);
      wobbleEllipse(ctx, p[0] * S * 0.02, S * 0.14, S * 0.115, S * 0.105, 0.04, 7 + p[0]); fillStroke(ctx, lw * 0.85); ctx.restore();
    });

    ctx.save(); ctx.translate(0, headCy); ctx.rotate(headTilt);
    [[-1, Math.sin(t * 1.4) * 0.04], [1, Math.sin(t * 1.6 + 1) * 0.04]].forEach(function (p) {
      var side = p[0], tw = p[1];
      ctx.save(); ctx.translate(side * headW * 0.38, -headH * 0.32); ctx.rotate(tw + side * 0.03);
      ctx.beginPath(); ctx.moveTo(-side * S * 0.09, S * 0.04); ctx.lineTo(0, -S * 0.175); ctx.lineTo(side * S * 0.075, S * 0.05); ctx.closePath();
      fillStroke(ctx, lw);
      ctx.fillStyle = COL.inner; ctx.beginPath();
      ctx.moveTo(-side * S * 0.025, S * 0.02); ctx.lineTo(0, -S * 0.08); ctx.lineTo(side * S * 0.03, S * 0.02); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    wobbleEllipse(ctx, 0, 0, headW * 0.5, headH * 0.48, 0.022, 0.4, 2.7); fillStroke(ctx, lw);
    ctx.fillStyle = COL.stripe;
    [[-0.095, 0.1, 0.032], [0, 0.125, 0.036], [0.095, 0.1, 0.032]].forEach(function (q) {
      ctx.beginPath(); ctx.ellipse(q[0] * S, -headH * 0.18, S * q[2], S * q[1], 0, 0, Math.PI * 2); ctx.fill();
    });
    [-1, 1].forEach(function (side) {
      var ex = side * headW * 0.195, ey = headH * 0.04;
      if (blink > 0.5) {
        ctx.strokeStyle = COL.outline; ctx.lineWidth = lw * 0.65; ctx.beginPath();
        ctx.moveTo(ex, ey - S * 0.015); ctx.lineTo(ex + side * S * 0.05, ey + S * 0.006); ctx.lineTo(ex, ey + S * 0.025); ctx.stroke();
      } else {
        ctx.fillStyle = COL.outline; var r = S * 0.045 * (1 - blink * 0.9);
        ctx.beginPath(); ctx.ellipse(ex, ey, r, r * Math.max(0.12, 1 - blink), 0, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.fillStyle = COL.blush;
    [-1, 1].forEach(function (side) {
      ctx.beginPath(); ctx.ellipse(side * headW * 0.3, headH * 0.18, S * 0.088, S * 0.065, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = COL.outline; ctx.lineWidth = lw * 0.5;
    ctx.beginPath(); ctx.arc(-S * 0.038, headH * 0.22, S * 0.038, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(S * 0.038, headH * 0.22, S * 0.038, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.lineWidth = lw * 0.35;
    [-1, 1].forEach(function (side) {
      [-0.01, 0.06, 0.13].forEach(function (dy, j) {
        ctx.beginPath(); ctx.moveTo(side * headW * 0.42, headH * dy);
        ctx.lineTo(side * headW * (0.42 + 0.13 + j * 0.008), headH * dy + (j - 1) * S * 0.012); ctx.stroke();
      });
    });
    ctx.restore(); ctx.restore();
  }
  global.drawBaseCat = drawBaseCat;
  global.CatBase = { draw: drawBaseCat, colors: COL };
})(typeof window !== 'undefined' ? window : globalThis);
