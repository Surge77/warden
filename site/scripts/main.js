/* Warden site: reveals, receipt scan choreography, dial, tilt */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* scroll reveals */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
    { threshold: 0.18 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* hero receipt: pointer tilt */
  const stage = document.getElementById('stage');
  const receipt = document.getElementById('receipt');
  if (stage && receipt && matchMedia('(pointer:fine)').matches) {
    stage.addEventListener('pointermove', (e) => {
      const b = stage.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - 0.5;
      const y = (e.clientY - b.top) / b.height - 0.5;
      receipt.style.setProperty('--ry', `${-10 + x * 22}deg`);
      receipt.style.setProperty('--rx', `${6 - y * 18}deg`);
    });
    stage.addEventListener('pointerleave', () => {
      receipt.style.setProperty('--ry', '-10deg');
      receipt.style.setProperty('--rx', '6deg');
    });
  }

  /* OCR scan sequence: beam sweeps, lines flash, chips fly out */
  const SCAN_MS = 2600;
  function runScan() {
    if (!receipt) return;
    const lines = [...receipt.querySelectorAll('[data-scan]')];
    receipt.classList.add('scanning');
    lines.forEach((line, i) => {
      const at = (SCAN_MS / lines.length) * i + 200;
      setTimeout(() => {
        line.classList.add('hit');
        setTimeout(() => line.classList.remove('hit'), 420);
      }, at);
    });
    setTimeout(() => {
      receipt.classList.remove('scanning');
      stage.classList.add('done');
    }, SCAN_MS + 100);
  }
  if (reduced) {
    stage && stage.classList.add('done');
  } else {
    setTimeout(runScan, 900);
    setInterval(() => {
      stage.classList.remove('done');
      setTimeout(runScan, 500);
    }, 14000);
  }

  /* dial: tick ring, arcs, day counter */
  const ticks = document.getElementById('ticks');
  if (ticks) {
    let s = '';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const maj = i % 5 === 0;
      const r1 = maj ? 176 : 182, r2 = 190;
      s += `<line class="${maj ? 'maj' : ''}" x1="${200 + r1 * Math.cos(a)}" y1="${200 + r1 * Math.sin(a)}" x2="${200 + r2 * Math.cos(a)}" y2="${200 + r2 * Math.sin(a)}"/>`;
    }
    ticks.innerHTML = s;
  }

  const dialWrap = document.getElementById('dialwrap');
  if (dialWrap) {
    const warranty = document.getElementById('arc-warranty');
    const ret = document.getElementById('arc-return');
    const num = document.getElementById('dialnum');
    const C1 = 2 * Math.PI * 150, C2 = 2 * Math.PI * 112;
    warranty.style.strokeDasharray = C1;
    warranty.style.strokeDashoffset = C1;
    ret.style.strokeDasharray = C2;
    ret.style.strokeDashoffset = C2;

    const dio = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      dio.disconnect();
      warranty.style.strokeDashoffset = C1 * (1 - 0.68); // 68% of warranty left
      ret.style.strokeDashoffset = C2 * (1 - 0.42);      // 42% of return window left
      const TARGET = 497, T = 2000, t0 = performance.now();
      (function count(now) {
        const p = Math.min((now - t0) / T, 1);
        num.textContent = Math.round(TARGET * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(count);
      })(t0);
    }, { threshold: 0.45 });
    dio.observe(dialWrap);
  }
})();
