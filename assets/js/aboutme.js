(() => {
  const canvas = document.getElementById("energy-bg");
  const ctx = canvas.getContext("2d", { alpha: true });

  // ===== Ajuste de resolução =====
  function fitCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  fitCanvas();
  addEventListener("resize", fitCanvas);

  // ===== Área segura (para não desenhar sobre o texto) =====
  const content = document.querySelector(".aboutme");
  function getSafeZone() {
    if (!content) return { left: 0, top: 0, right: 0, bottom: 0 };
    const r = content.getBoundingClientRect();
    return {
      left: r.left + 60,   // encosta mais nas laterais
      top: r.top - 40,
      right: r.right - 60,
      bottom: r.bottom + 40
    };
  }

  const inSafe = (x, y, s) => x > s.left && x < s.right && y > s.top && y < s.bottom;

  // ===== Trilhas energéticas =====
  let TRACES = [];
  function buildTraces() {
    TRACES = [];
    const rows = 9;
    for (let r = 0; r < rows; r++) {
      const y = innerHeight * (0.1 + r / (rows - 1) * 0.8);
      const angle = (Math.random() - 0.5) * 0.3;
      const segs = [], pulses = [];
      let x = -200;
      while (x < innerWidth + 200) {
        const len = 160 + Math.random() * 240;
        segs.push({ x, y, len, angle });
        x += len + 100 + Math.random() * 100;
      }
      const n = 2 + (Math.random() * 3 | 0);
      for (let i = 0; i < n; i++)
        pulses.push({ t: Math.random(), speed: 0.6 + Math.random() * 1.2 });
      TRACES.push({ segs, pulses });
    }
  }

  // ===== Cabos industriais =====
  let CABLES = [];
  function buildCables() {
    CABLES = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * innerWidth;
      const y = Math.random() * innerHeight;
      const angle = Math.random() * Math.PI * 2;
      const len = 250 + Math.random() * 350;
      const width = 2 + Math.random() * 3;
      const color = Math.random() < 0.5
        ? "rgba(255,200,120,0.06)"
        : "rgba(255,255,255,0.04)";
      const dx = Math.cos(angle), dy = Math.sin(angle);
      CABLES.push({ x, y, dx, dy, len, width, color });
    }
  }

  // ===== Faíscas =====
  let SPARKS = [];
  function buildSparks() {
    SPARKS = [];
    for (let i = 0; i < 60; i++) {
      SPARKS.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        s: 0.5 + Math.random() * 1.5,
        v: 0.3 + Math.random() * 0.8,
        o: Math.random() * 0.5 + 0.2
      });
    }
  }

  buildTraces();
  buildCables();
  buildSparks();

  // ===== Fundo =====
  function drawBackground(flicker) {
    const g = ctx.createLinearGradient(0, 0, 0, innerHeight);
    g.addColorStop(0, "#0a0a0a");
    g.addColorStop(1, "#141414");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    // leve vinheta e flicker
    ctx.fillStyle = `rgba(255,80,30,${0.03 + flicker * 0.02})`;
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }

  // ===== Cabos =====
  function drawCables(safe) {
    CABLES.forEach(c => {
      const x2 = c.x + c.dx * c.len;
      const y2 = c.y + c.dy * c.len;
      const midX = (c.x + x2) / 2;
      const midY = (c.y + y2) / 2;

      if (inSafe(midX, midY, safe)) {
        ctx.globalAlpha = 0.15;
      } else {
        ctx.globalAlpha = 1;
      }

      ctx.lineWidth = c.width;
      ctx.strokeStyle = c.color;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  // ===== Trilhas com pulsos =====
  function drawTraces(time, safe) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,230,180,.08)";

    TRACES.forEach(tr => {
      tr.segs.forEach(s => {
        const x1 = s.x, y1 = s.y;
        const x2 = x1 + Math.cos(s.angle) * s.len;
        const y2 = y1 + Math.sin(s.angle) * s.len;
        const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;

        if (inSafe(midX, midY, safe)) ctx.globalAlpha = 0.2;
        else ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Pulsos luminosos
      tr.pulses.forEach(p => {
        p.t = (p.t + p.speed * 0.002) % 1;
        const total = tr.segs.reduce((a, s) => a + s.len, 0);
        const pos = p.t * total;
        let acc = 0, seg = tr.segs[0];
        for (let i = 0; i < tr.segs.length; i++) {
          if (pos <= acc + tr.segs[i].len) { seg = tr.segs[i]; break; }
          acc += tr.segs[i].len;
        }
        const local = (pos - acc) / seg.len;
        const px = seg.x + Math.cos(seg.angle) * seg.len * local;
        const py = seg.y + Math.sin(seg.angle) * seg.len * local;
        if (inSafe(px, py, safe)) return;

        const span = 90;
        const sx = px - Math.cos(seg.angle) * span;
        const sy = py - Math.sin(seg.angle) * span;
        const grad = ctx.createLinearGradient(sx, sy, px, py);
        grad.addColorStop(0, "rgba(255,140,40,0)");
        grad.addColorStop(0.7, "rgba(255, 89, 60, 0.85)");
        grad.addColorStop(1, "rgba(255,255,255,.3)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.fillStyle = "#ff5f4aff";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff4538ff";
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    });
    ctx.globalAlpha = 1;
  }

  // ===== Faíscas =====
  function drawSparks(dt) {
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ff3838ff";
    SPARKS.forEach(s => {
      s.y -= s.v;
      if (s.y < -10) {
        s.y = innerHeight + 10;
        s.x = Math.random() * innerWidth;
      }
      ctx.fillStyle = `rgba(255,180,80,${s.o})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  // ===== Loop =====
  let lastTime = 0;
  function frame(t) {
    const time = t / 1000;
    const flicker = Math.sin(time * 10) * 0.5 + 0.5;
    const safe = getSafeZone();

    drawBackground(flicker);
    drawCables(safe);
    drawTraces(time, safe);
    drawSparks(time - lastTime);

    lastTime = time;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
