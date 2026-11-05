/* ============================================================
   drawCat — isolated doodle cat matching /refs/01M6NSR*.jpg
   Origin at feet-center. scale = head width (px).
   Flat white fill, thick wobbly marker outline, no shading.
   ============================================================ */
(function (global) {
  function roundBlob(ctx, cx, cy, rx, ry, wobble) {
    const n = 32;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      // hand wobble — irregular radius
      const w =
        1 +
        Math.sin(a * 2.7 + cx * 0.02) * (wobble || 0.04) +
        Math.cos(a * 5.1 + cy * 0.01) * (wobble || 0.04) * 0.55;
      const px = cx + Math.cos(a) * rx * w;
      const py = cy + Math.sin(a) * ry * w;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  // Squarish head: flatter top/bottom, rounder sides (ref mug-cat)
  function headPath(ctx, cx, cy, rx, ry) {
    const n = 36;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      // superellipse-ish (n~3) + wobble
      const c = Math.cos(a), s = Math.sin(a);
      const exp = 2.6;
      const k = Math.pow(Math.abs(c), exp) + Math.pow(Math.abs(s), exp);
      const r = Math.pow(k, -1 / exp);
      const w = 1 + Math.sin(a * 3.2) * 0.035 + Math.cos(a * 5.5) * 0.02;
      const px = cx + c * rx * r * w;
      const py = cy + s * ry * r * w;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function strokeFill(ctx, fill, lw) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawCat(ctx, c) {
    const t = c.t || 0;
    const S = c.scale || 60;
    const face = c.facing >= 0 ? 1 : -1;
    const bob = Math.sin(t * 2.1 + (c.phase || 0)) * S * 0.015;
    const lw = Math.max(3.5, S * 0.075); // ~7.5% head width
    const blink = c.blink || 0;

    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.scale(face, 1);

    // Head ~60% of total height, wider than body
    const headW = S;
    const headH = S * 0.88;
    const bodyW = S * 0.62;
    const bodyH = S * 0.48;
    // almost no neck — head sits on body
    const bodyCy = -bodyH * 0.42;
    const headCy = bodyCy - bodyH * 0.38 - headH * 0.22;

    // tiny stubby tail
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.28, bodyCy);
    ctx.quadraticCurveTo(
      -bodyW * 0.55,
      bodyCy - bodyH * 0.25 + Math.sin(t * 2.8 + (c.phase || 0)) * S * 0.04,
      -bodyW * 0.4,
      bodyCy - bodyH * 0.45
    );
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = lw * 0.95;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 2 stubby rounded front legs (refs show short nubs)
    const legY = bodyCy + bodyH * 0.28;
    [
      [-bodyW * 0.22, 0.05],
      [bodyW * 0.2, -0.04],
    ].forEach(([lx, rot], i) => {
      ctx.save();
      ctx.translate(lx, legY);
      const walk = c.walkPhase != null ? Math.sin(c.walkPhase + i * Math.PI) * 0.2 : 0;
      ctx.rotate(rot + walk);
      roundBlob(ctx, 0, S * 0.1, S * 0.115, S * 0.12, 0.045);
      strokeFill(ctx, '#fff', lw * 0.8);
      ctx.restore();
    });

    // compact boxy body
    roundBlob(ctx, 0, bodyCy, bodyW * 0.5, bodyH * 0.5, 0.045);
    strokeFill(ctx, '#fff', lw);

    // belly ×
    {
      ctx.strokeStyle = '#9a9a9a';
      ctx.lineWidth = Math.max(1.6, lw * 0.32);
      ctx.lineCap = 'round';
      const bx = 0, by = bodyCy + bodyH * 0.1, bs = S * 0.055;
      ctx.beginPath();
      ctx.moveTo(bx - bs, by - bs);
      ctx.lineTo(bx + bs, by + bs);
      ctx.moveTo(bx + bs, by - bs);
      ctx.lineTo(bx - bs, by + bs);
      ctx.stroke();
    }

    drawArms(ctx, c, S, lw, bodyCy, headCy, t);

    // HEAD — squarish dominant
    headPath(ctx, 0, headCy, headW * 0.5, headH * 0.48);
    strokeFill(ctx, '#fff', lw);

    // ears rounded-triangular, set wide on top corners
    drawEar(ctx, -headW * 0.34, headCy - headH * 0.36, -0.28, S, lw);
    drawEar(ctx, headW * 0.34, headCy - headH * 0.36, 0.28, S, lw);

    // 3 short grey vertical forehead stripes
    ctx.fillStyle = '#b4b4b4';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * S * 0.085, headCy - headH * 0.2, S * 0.032, S * 0.065, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // large soft pink/peach blush under eyes
    ctx.fillStyle = '#ffb6b6';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(-headW * 0.26, headCy + headH * 0.1, S * 0.12, S * 0.08, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headW * 0.26, headCy + headH * 0.1, S * 0.12, S * 0.08, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // eyes — small solid dots, wide & low
    const eyeY = headCy + headH * 0.04;
    const eyeX = headW * 0.175;
    if (blink > 0.55) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.5;
      [-eyeX, eyeX].forEach((ex) => {
        ctx.beginPath();
        ctx.moveTo(ex - S * 0.045, eyeY);
        ctx.quadraticCurveTo(ex, eyeY + S * 0.025, ex + S * 0.045, eyeY);
        ctx.stroke();
      });
    } else {
      ctx.fillStyle = '#1a1a1a';
      [-eyeX, eyeX].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, eyeY, Math.max(2.2, S * 0.042), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // mouth
    const mouth = c.mouth || 'omega';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = lw * 0.5;
    ctx.lineCap = 'round';
    const my = headCy + headH * 0.24;
    if (mouth === 'open') {
      ctx.beginPath();
      ctx.moveTo(-S * 0.09, my - S * 0.02);
      ctx.lineTo(0, my + S * 0.11);
      ctx.lineTo(S * 0.09, my - S * 0.02);
      ctx.closePath();
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, my + S * 0.065, S * 0.048, S * 0.042, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8fab';
      ctx.fill();
    } else if (mouth === 'happy') {
      ctx.beginPath();
      ctx.moveTo(-S * 0.1, my);
      ctx.lineTo(0, my + S * 0.085);
      ctx.lineTo(S * 0.1, my);
      ctx.stroke();
    } else {
      // ω
      ctx.beginPath();
      ctx.moveTo(-S * 0.095, my);
      ctx.quadraticCurveTo(-S * 0.045, my + S * 0.085, 0, my + S * 0.01);
      ctx.quadraticCurveTo(S * 0.045, my + S * 0.085, S * 0.095, my);
      ctx.stroke();
    }

    // whiskers — 2–3 short thick strokes outside head
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = lw * 0.42;
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const wy = eyeY + S * 0.05 + i * S * 0.055;
        ctx.beginPath();
        ctx.moveTo(side * headW * 0.4, wy);
        ctx.lineTo(side * (headW * 0.58 + S * 0.02), wy + (i - 1) * S * 0.028);
        ctx.stroke();
      }
    });

    if (c.hat !== false && c.hat !== null) {
      drawHat(ctx, 0, headCy - headH * 0.5, S, lw, c.hatColor || '#c5a3ff', t, c.phase || 0);
    }

    if (c.glasses) {
      ctx.fillStyle = '#1a1a1a';
      roundBlob(ctx, -eyeX, eyeY, S * 0.115, S * 0.095, 0.02);
      ctx.fill();
      roundBlob(ctx, eyeX, eyeY, S * 0.115, S * 0.095, 0.02);
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.45;
      ctx.beginPath();
      ctx.moveTo(-eyeX + S * 0.115, eyeY);
      ctx.lineTo(eyeX - S * 0.115, eyeY);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEar(ctx, x, y, tilt, S, lw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.beginPath();
    ctx.moveTo(-S * 0.11, S * 0.1);
    ctx.quadraticCurveTo(-S * 0.02, -S * 0.26, S * 0.13, S * 0.1);
    ctx.quadraticCurveTo(0, S * 0.16, -S * 0.11, S * 0.1);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-S * 0.04, S * 0.06);
    ctx.quadraticCurveTo(0.01 * S, -S * 0.1, S * 0.055, S * 0.06);
    ctx.closePath();
    ctx.fillStyle = '#ffb3c8';
    ctx.fill();
    ctx.restore();
  }

  function drawHat(ctx, x, y, S, lw, color, t, phase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 2 + phase) * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -S * 0.4);
    ctx.lineTo(S * 0.2, S * 0.08);
    ctx.lineTo(-S * 0.2, S * 0.08);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = lw * 0.85;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#fff8f0';
    ctx.lineWidth = lw * 0.5;
    ctx.beginPath();
    ctx.moveTo(-S * 0.1, -S * 0.04);
    ctx.lineTo(S * 0.1, -S * 0.04);
    ctx.stroke();
    ctx.translate(0, -S * 0.42);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? S * 0.045 : S * 0.1;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd36b';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = lw * 0.4;
    ctx.stroke();
    ctx.restore();
  }

  function drawArms(ctx, c, S, lw, bodyCy, headCy, t) {
    const prop = c.prop || null;
    function paw(x, y, rot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot || 0);
      roundBlob(ctx, 0, 0, S * 0.1, S * 0.095, 0.04);
      strokeFill(ctx, '#fff', lw * 0.8);
      ctx.restore();
    }

    if (prop === 'brush') {
      paw(-S * 0.22, bodyCy - S * 0.2, -0.5);
      ctx.save();
      ctx.translate(-S * 0.32, bodyCy - S * 0.5);
      ctx.rotate(-0.7 + Math.sin(t * 5) * 0.12);
      ctx.fillStyle = '#c4956a';
      ctx.fillRect(-S * 0.028, -S * 0.38, S * 0.055, S * 0.42);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.45;
      ctx.strokeRect(-S * 0.028, -S * 0.38, S * 0.055, S * 0.42);
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(-S * 0.05, -S * 0.48, S * 0.1, S * 0.12);
      ctx.strokeRect(-S * 0.05, -S * 0.48, S * 0.1, S * 0.12);
      // paint drip color
      ctx.fillStyle = c.paintColor || '#2a2220';
      ctx.fillRect(-S * 0.04, -S * 0.5, S * 0.08, S * 0.04);
      ctx.restore();
      paw(S * 0.2, bodyCy - S * 0.02, 0.2);
    } else if (prop === 'cloth') {
      paw(S * 0.22, bodyCy - S * 0.18, 0.3);
      ctx.save();
      ctx.translate(S * 0.3, bodyCy - S * 0.32);
      ctx.rotate(Math.sin(t * 6) * 0.25);
      ctx.fillStyle = '#e8f0ff';
      ctx.beginPath();
      ctx.moveTo(-S * 0.14, 0);
      ctx.quadraticCurveTo(0, S * 0.18, S * 0.14, 0);
      ctx.quadraticCurveTo(0, -S * 0.1, -S * 0.14, 0);
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.4;
      ctx.stroke();
      ctx.restore();
      paw(-S * 0.2, bodyCy - S * 0.02, -0.15);
    } else if (prop === 'lighter' || prop === 'candle') {
      paw(S * 0.26, bodyCy - S * 0.22, 0.4);
      ctx.save();
      ctx.translate(S * 0.36, bodyCy - S * 0.48);
      ctx.fillStyle = '#7ec8ff';
      ctx.fillRect(-S * 0.032, 0, S * 0.064, S * 0.26);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.4;
      ctx.strokeRect(-S * 0.032, 0, S * 0.064, S * 0.26);
      const flick = 0.85 + Math.sin(t * 10) * 0.15;
      ctx.beginPath();
      ctx.ellipse(0, -S * 0.07 * flick, S * 0.035, S * 0.07 * flick, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb347';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -S * 0.05 * flick, S * 0.018, S * 0.035 * flick, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff3a0';
      ctx.fill();
      ctx.restore();
      paw(-S * 0.2, bodyCy - S * 0.02, -0.1);
    } else if (prop === 'camera') {
      paw(S * 0.24, bodyCy - S * 0.18, 0.25);
      ctx.save();
      ctx.translate(S * 0.4, bodyCy - S * 0.28);
      ctx.fillStyle = '#3a3a48';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-S * 0.15, -S * 0.09, S * 0.3, S * 0.18, 3);
      else ctx.rect(-S * 0.15, -S * 0.09, S * 0.3, S * 0.18);
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, S * 0.065, 0, Math.PI * 2);
      ctx.fillStyle = '#7a9ab0';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      paw(-S * 0.2, bodyCy - S * 0.02, -0.1);
    } else if (prop === 'plate') {
      paw(-S * 0.12, bodyCy - S * 0.28, -0.2);
      paw(S * 0.12, bodyCy - S * 0.28, 0.2);
      ctx.save();
      ctx.translate(0, bodyCy - S * 0.38);
      ctx.beginPath();
      ctx.ellipse(0, 0, S * 0.22, S * 0.075, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fff8f0';
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.45;
      ctx.stroke();
      ctx.restore();
    } else if (prop === 'wine' || prop === 'bottle') {
      paw(S * 0.22, bodyCy - S * 0.2, 0.3);
      ctx.save();
      ctx.translate(S * 0.34, bodyCy - S * 0.55);
      ctx.fillStyle = '#6b1c2a';
      ctx.fillRect(-S * 0.055, S * 0.1, S * 0.11, S * 0.3);
      ctx.fillRect(-S * 0.028, 0, S * 0.056, S * 0.12);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.4;
      ctx.strokeRect(-S * 0.055, S * 0.1, S * 0.11, S * 0.3);
      ctx.strokeRect(-S * 0.028, 0, S * 0.056, S * 0.12);
      // label
      ctx.fillStyle = '#f5e0c8';
      ctx.fillRect(-S * 0.04, S * 0.2, S * 0.08, S * 0.1);
      ctx.restore();
      paw(-S * 0.2, bodyCy - S * 0.02, -0.1);
    } else if (prop === 'flowers') {
      paw(S * 0.18, bodyCy - S * 0.25, 0.2);
      ctx.save();
      ctx.translate(S * 0.22, bodyCy - S * 0.48);
      ['#ff8fab', '#ffd36b', '#c5a3ff'].forEach((col, i) => {
        ctx.beginPath();
        ctx.arc((i - 1) * S * 0.09, -i * S * 0.03, S * 0.065, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = lw * 0.35;
        ctx.stroke();
      });
      ctx.strokeStyle = '#5a8a4a';
      ctx.lineWidth = lw * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, S * 0.05);
      ctx.lineTo(0, S * 0.22);
      ctx.stroke();
      ctx.restore();
      paw(-S * 0.2, bodyCy - S * 0.02, -0.1);
    } else if (prop === 'peace' || c.pose === 'peace') {
      ctx.save();
      ctx.translate(S * 0.32, bodyCy - S * 0.38);
      ctx.rotate(0.35);
      roundBlob(ctx, 0, 0, S * 0.13, S * 0.13, 0.04);
      strokeFill(ctx, '#fff', lw * 0.8);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.65;
      ctx.beginPath();
      ctx.moveTo(-S * 0.035, -S * 0.08);
      ctx.lineTo(-S * 0.07, -S * 0.26);
      ctx.moveTo(S * 0.04, -S * 0.08);
      ctx.lineTo(S * 0.09, -S * 0.26);
      ctx.stroke();
      ctx.restore();
      paw(-S * 0.2, bodyCy - S * 0.02, -0.1);
    } else if (prop === 'mug') {
      // match mug ref
      paw(-S * 0.05, bodyCy - S * 0.15, 0);
      paw(S * 0.22, bodyCy - S * 0.2, 0.4);
      ctx.save();
      ctx.translate(S * 0.08, bodyCy - S * 0.35);
      roundBlob(ctx, 0, 0, S * 0.2, S * 0.22, 0.03);
      strokeFill(ctx, '#fff', lw * 0.7);
      ctx.fillStyle = '#8b5a3a';
      ctx.beginPath();
      ctx.ellipse(0, -S * 0.12, S * 0.14, S * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.35;
      ctx.stroke();
      // xxx on mug
      ctx.strokeStyle = '#b0b0b0';
      ctx.lineWidth = lw * 0.25;
      for (let i = 0; i < 3; i++) {
        const yy = -S * 0.02 + i * S * 0.07;
        ctx.beginPath();
        ctx.moveTo(-S * 0.04, yy - S * 0.02);
        ctx.lineTo(S * 0.04, yy + S * 0.02);
        ctx.moveTo(S * 0.04, yy - S * 0.02);
        ctx.lineTo(-S * 0.04, yy + S * 0.02);
        ctx.stroke();
      }
      // handle
      ctx.beginPath();
      ctx.arc(S * 0.2, 0, S * 0.1, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = lw * 0.7;
      ctx.stroke();
      ctx.restore();
    } else {
      // default: stubby arms tucked near chest (ref look)
      paw(-S * 0.22, bodyCy - S * 0.12, -0.35);
      paw(S * 0.22, bodyCy - S * 0.12, 0.35);
    }
  }

  global.DrawCat = { drawCat, version: 'ref-v2' };
})(typeof window !== 'undefined' ? window : globalThis);
