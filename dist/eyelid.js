// Warp the painted upper and lower lids toward their shared closed lash line.
// The clock remains live in the opening between the two painted surfaces.
(() => {
  const canvas = document.querySelector('.eyelid');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const closedFrame = new Image();
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => value * value * (3 - 2 * value);

  // Columns across the illustration: x, open upper lash, open lower lash,
  // closed lash. Both images use the same 3:2 camera framing.
  const contour = [
    [0, .72, .72, .72], [.075, .64, .76, .73], [.18, .40, .77, .77],
    [.32, .23, .83, .83], [.5, .16, .87, .855], [.68, .18, .84, .835],
    [.79, .25, .77, .78], [.91, .36, .52, .65], [1, .36, .37, .55]
  ];
  let visible = false;
  let decoded = false;
  let timeout = 0;
  let frame = 0;
  let strips = [];

  function prepareFrame() {
    const width = Math.max(1, Math.min(1200, Math.round(canvas.clientWidth * devicePixelRatio)));
    const height = Math.round(width * 2 / 3);
    canvas.width = width;
    canvas.height = height;
    strips = [];
    let segment = 0;
    for (let x = 0; x < width; x += 2) {
      const position = x / width;
      while (contour[segment + 1][0] < position) segment++;
      const a = contour[segment], b = contour[segment + 1];
      const fraction = (position - a[0]) / (b[0] - a[0]);
      const at = index => a[index] + (b[index] - a[index]) * fraction;
      strips.push({x, width:Math.min(2,width-x), upper:at(1), lower:at(2), closed:at(3)});
    }
  }
  function paintLids(amount) {
    const w = canvas.width, h = canvas.height;
    const sw = closedFrame.naturalWidth, sh = closedFrame.naturalHeight;
    ctx.clearRect(0,0,w,h);
    for (const strip of strips) {
      const {x,width,upper,lower,closed} = strip;
      const top = h * (upper + (closed - upper) * amount);
      const bottom = h * (lower + (closed - lower) * amount);
      const sx = x * sw / w, sourceWidth = width * sw / w;
      ctx.drawImage(closedFrame, sx,0,sourceWidth,closed*sh, x,0,width,top);
      ctx.drawImage(closedFrame, sx,closed*sh,sourceWidth,(1-closed)*sh, x,bottom,width,h-bottom);
    }
    canvas.style.opacity = String(clamp(amount * 5));
  }
  function allowed() { return visible && decoded && !document.hidden && !reducedMotion.matches; }
  function reset() {
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    canvas.style.opacity = '0';
  }
  function blink() {
    if (!allowed()) return;
    prepareFrame();
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      if (!allowed() || elapsed >= 400) {
        reset();
        if (allowed()) timeout = setTimeout(blink, 3700 + Math.random() * 2400);
        return;
      }
      // A quick close, a short hold, and a slower release.
      const amount = elapsed <= 152 ? ease(clamp(elapsed / 152)) : 1 - ease(clamp((elapsed - 180) / 220));
      paintLids(amount);
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
  }
  function schedule() {
    reset();
    if (allowed()) timeout = setTimeout(blink, 1400);
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !closedFrame.hasAttribute('src')) closedFrame.src = 'assets/eye-closed.webp';
    schedule();
  }, {threshold:.1});
  closedFrame.onload = () => { decoded = true; schedule(); };
  observer.observe(canvas);
  reducedMotion.addEventListener('change',schedule);
  document.addEventListener('visibilitychange',schedule);
})();
