/** Rigged base cat (canvas), traced geometry (cat_base.py / exact_paths.json).
 *  drawBaseCat(ctx,{x,y,scale,t,phase,walkPhase,facing,blink}) — origin = feet-center, scale = head width / 1.08. */
(function (global) {
  const G = {"head":[[360.4,208.1],[346.7,205.7],[333.1,202.7],[320.1,197.8],[307.8,191.3],[295.7,184.3],[283.7,177.0],[264.5,168.5],[251.9,164.3],[247.0,163.0],[239.4,165.9],[226.0,172.8],[207.3,185.5],[198.2,196.2],[191.2,208.3],[186.0,221.3],[182.1,234.7],[179.1,248.3],[176.9,262.1],[175.3,276.0],[174.2,290.0],[173.6,303.9],[173.4,317.9],[173.9,331.9],[175.4,345.8],[178.0,359.5],[181.7,373.1],[187.1,386.1],[194.0,398.3],[202.5,409.5],[212.7,419.2],[224.3,427.2],[236.8,433.6],[249.8,438.9],[263.2,443.3],[276.8,446.7],[290.6,449.2],[304.5,451.2],[318.5,452.6],[332.5,453.5],[346.5,453.9],[360.5,454.0],[374.5,453.6],[388.5,453.0],[402.5,452.1],[416.4,451.0],[430.3,449.4],[444.2,447.6],[458.0,445.2],[471.6,442.1],[485.0,438.0],[498.0,432.9],[510.5,426.5],[522.0,418.6],[532.2,409.0],[540.6,397.9],[547.6,385.8],[553.1,372.8],[556.9,359.3],[559.7,345.5],[561.5,331.6],[562.3,317.5],[562.3,303.5],[561.3,289.4],[559.6,275.5],[557.3,261.6],[554.2,247.9],[550.5,234.4],[546.2,221.1],[541.1,208.1],[534.6,195.8],[522.9,179.0],[514.9,169.1],[513.0,165.0],[503.7,168.4],[488.8,174.5],[467.6,185.3],[455.7,192.5],[443.3,199.4],[430.1,204.1],[416.2,206.7],[402.3,208.7],[388.3,209.8],[374.3,209.6]],"body":[[215.5,445.8],[228.4,445.8],[241.6,445.7],[254.7,445.5],[267.8,445.3],[281.0,445.1],[294.1,445.0],[307.2,445.0],[320.3,444.9],[333.5,444.9],[346.6,444.8],[359.7,444.7],[372.9,444.5],[386.0,444.3],[399.1,444.3],[412.2,444.3],[425.4,444.4],[438.5,444.6],[451.6,444.9],[464.8,445.2],[477.9,445.4],[491.0,445.5],[504.1,445.5],[517.3,445.5],[530.2,446.0],[535.6,455.3],[533.6,466.9],[525.0,476.4],[514.3,483.1],[502.7,488.8],[492.7,494.9],[494.9,507.5],[496.2,520.0],[497.2,532.9],[496.7,545.1],[495.8,557.4],[491.8,569.4],[483.2,578.3],[470.7,582.8],[461.1,577.1],[448.2,575.2],[435.1,574.7],[421.9,574.7],[408.9,573.3],[397.2,568.2],[392.5,556.8],[380.3,552.3],[367.1,551.5],[353.9,552.9],[344.4,561.3],[337.8,570.7],[325.4,573.4],[312.3,574.4],[299.2,574.7],[286.2,575.8],[275.9,580.8],[263.6,581.7],[251.9,575.4],[245.6,564.6],[242.8,552.2],[243.5,539.9],[243.6,527.4],[243.9,514.7],[244.6,501.8],[243.9,491.6],[231.7,487.3],[220.0,481.9],[210.8,472.6],[204.4,462.0],[204.5,449.9]],"stripes":[{"c":[349,198],"w":18,"h":52,"slant":-0.06},{"c":[372,193],"w":18,"h":56,"slant":0.0},{"c":[395,198],"w":18,"h":52,"slant":0.06}]};
  const COL = {outline:'#1e1a18', fill:'#ffffff', blush:'rgba(255,170,160,0.9)', stripe:'#a8a4a6', inner:'#ffbcc0', stripeA:'#a8a4a6'};
  const REFW = 389, HEAD_CX = 367, HEAD_CY = 320, BODY_CX = 370, NOTCH_Y = 552, FOOT_Y = 575, FOOT_L = 275, FOOT_R = 465;
  const EYE_Y = 331, EYES = [245.1, 467.0], EYE_R = 14, BLUSH_Y = 356, BLUSH = [208, 508], BLUSH_R = 22;
  const MOUTH = [356, 350], MOUTH_W = 58;
  const WHISK = [[118,302,170,306],[120,316,170,320],[618,302,566,306],[622,316,566,320]];
  const OX = 370, OY = 578;
  function rot(x, y, a, ox, oy) { const c = Math.cos(a), s = Math.sin(a), dx = x - ox, dy = y - oy; return [ox + dx * c - dy * s, oy + dx * s + dy * c]; }
  function deform(pts, p, bob) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      let x = pts[i][0], y = pts[i][1]; const y0 = y; y += bob;
      if (y0 > 455 && y0 < 545) {
        if (x > BODY_CX + 90) { const r = rot(x, y, p.armR * 0.9, BODY_CX + 140, 470 + bob); x = r[0] + p.armR * 10; y = r[1]; }
        else if (x < BODY_CX - 90) { const r = rot(x, y, p.armL * 0.9, BODY_CX - 140, 470 + bob); x = r[0] + p.armL * 10; y = r[1]; }
      }
      if (y0 > NOTCH_Y - 4) {
        if (x < BODY_CX) { const r = rot(x, y, p.legL * 0.8, FOOT_L, FOOT_Y + bob); x = r[0]; y = r[1] - Math.abs(p.legL) * 18; }
        else { const r = rot(x, y, p.legR * 0.8, FOOT_R, FOOT_Y + bob); x = r[0]; y = r[1] - Math.abs(p.legR) * 18; }
      }
      x = BODY_CX + (x - BODY_CX) * (1 + p.breath * 0.012);
      out.push([x, y]);
    }
    return out;
  }
  function smoothPath(ctx, pts) {
    const n = pts.length; ctx.beginPath();
    let mx = (pts[n - 1][0] + pts[0][0]) / 2, my = (pts[n - 1][1] + pts[0][1]) / 2; ctx.moveTo(mx, my);
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.closePath();
  }
  function fillStroke(ctx, lw) { ctx.fillStyle = COL.fill; ctx.fill(); ctx.strokeStyle = COL.outline; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  function drawBaseCat(ctx, c) {
    const t = c.t || 0, S = c.scale || 80, k = 1.08 * S / REFW, ph = c.phase || 0;
    const LW = Math.max(9, 3.4 / k);          // ref-space outline so it is >= ~3.4px on screen
    const breath = (Math.sin(t * 2.1 + ph) + 1) * 0.5;
    const cycle = (t + ph) % 3.5;
    const blink = c.blink != null ? c.blink : (cycle < 0.16 ? (cycle < 0.08 ? cycle / 0.08 : 1 - (cycle - 0.08) / 0.08) : 0);
    const walk = c.walkPhase != null ? c.walkPhase : null;
    const face = c.facing >= 0 ? 1 : -1;
    const sw = walk != null ? Math.sin(walk) : 0;
    const p = { breath: walk != null ? (Math.sin(t * 3.5) + 1) * 0.5 : breath,
      armL: walk != null ? sw * 0.5 : 0.05 + Math.sin(t * 1.4 + ph) * 0.05, armR: walk != null ? -sw * 0.5 : -0.05 + Math.cos(t * 1.5 + ph) * 0.05,
      legL: walk != null ? sw * 0.35 : 0.02, legR: walk != null ? -sw * 0.35 : -0.02 };
    const bob = walk != null ? Math.pow(Math.abs(sw), 1.3) * -7 : Math.sin(t * 2.1 + ph) * 2.5;
    const tilt = walk != null ? Math.sin(walk * 0.5) * 0.03 : Math.sin(t * 0.7 + ph) * 0.03;
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(face * k, k); ctx.translate(-OX, -OY);
    // body
    const bp = deform(G.body, p, bob); smoothPath(ctx, bp); fillStroke(ctx, LW);
    // head (tilt about head center)
    ctx.save(); ctx.translate(0, bob * 0.3); ctx.translate(HEAD_CX, HEAD_CY); ctx.rotate(tilt); ctx.translate(-HEAD_CX, -HEAD_CY);
    const hs = 1 + breath * 0.006; ctx.translate(HEAD_CX, HEAD_CY); ctx.scale(1 + breath * 0.008, hs); ctx.translate(-HEAD_CX, -HEAD_CY);
    smoothPath(ctx, G.head); fillStroke(ctx, LW);
    // stripes
    ctx.fillStyle = COL.stripe; ctx.strokeStyle = COL.stripe; ctx.lineCap = 'round';
    G.stripes.forEach(function (s) { ctx.lineWidth = s.w; ctx.beginPath(); ctx.moveTo(s.c[0] - s.slant * s.h / 2, s.c[1] - s.h / 2 + s.w / 2); ctx.lineTo(s.c[0] + s.slant * s.h / 2, s.c[1] + s.h / 2 - s.w / 2); ctx.stroke(); });
    // blush (level)
    ctx.fillStyle = COL.blush;
    BLUSH.forEach(function (bx) { ctx.beginPath(); ctx.ellipse(bx, BLUSH_Y, BLUSH_R, BLUSH_R * 0.95, 0, 0, 7); ctx.fill(); });
    // eyes (same y)
    EYES.forEach(function (ex) {
      if (blink > 0.55) { ctx.strokeStyle = COL.outline; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(ex - EYE_R, EYE_Y); ctx.lineTo(ex + EYE_R, EYE_Y); ctx.stroke(); }
      else { const ry = EYE_R * Math.max(0.15, 1 - blink); ctx.fillStyle = COL.outline; ctx.beginPath(); ctx.ellipse(ex, EYE_Y, EYE_R, ry, 0, 0, 7); ctx.fill(); }
    });
    // omega mouth
    ctx.strokeStyle = COL.outline; ctx.lineWidth = 5; ctx.lineCap = 'round';
    [-0.28, 0.28].forEach(function (d) { const cx = MOUTH[0] + d * MOUTH_W; ctx.beginPath(); ctx.ellipse(cx, MOUTH[1], MOUTH_W * 0.28, MOUTH_W * 0.38, 0, 0, Math.PI); ctx.stroke(); });
    // whiskers
    ctx.lineWidth = 8; WHISK.forEach(function (w) { ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); ctx.stroke(); });
    ctx.restore();
    ctx.restore();
  }
  global.drawBaseCat = drawBaseCat;
  global.CatBase = { draw: drawBaseCat, colors: COL, geom: { headTop: -1.04, bodyTop: -0.39 } };
})(typeof window !== 'undefined' ? window : globalThis);
