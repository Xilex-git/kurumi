const root = document.documentElement;
const scenes = [...document.querySelectorAll('main section')];
const links = [...document.querySelectorAll('nav a')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clock = document.querySelector('.clock');
const hourLabels = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
hourLabels.forEach((label,index) => {
  const mark = document.createElement('span');
  const angle = index * Math.PI / 6;
  mark.textContent = label;
  mark.style.left = (50 + 40 * Math.sin(angle)) + '%';
  mark.style.top = (50 - 40 * Math.cos(angle)) + '%';
  document.querySelector('.hours').append(mark);
});
let frame = 0;
function paint() {
  frame = 0;
  const height = window.innerHeight;
  const rects = scenes.map(scene => scene.getBoundingClientRect());
  const chapter = rects.reduce((current,rect,index) => rect.top <= height * .5 ? index : current, 0);
  links.forEach((link,index) => {
    if (index === chapter) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
  scenes[chapter].classList.add('arrived');
  root.style.setProperty('--progress',scrollY / Math.max(1,root.scrollHeight - height));
  if (!reduced.matches) {
    root.style.setProperty('--drift',Math.min(scrollY * .20,180) + 'px');
    clock.style.setProperty('--ring',(height * .55 - rects[1].top) * .16 + 'deg');
    root.style.setProperty('--night-drift',Math.max(-50,Math.min(50,-rects[2].top * .15)) + 'px');
  }
}
function queuePaint() { if (!frame) frame = requestAnimationFrame(paint); }
addEventListener('scroll',queuePaint,{passive:true});
addEventListener('resize',queuePaint);
paint();
const powers = {1:['Aleph','Time accelerates for the one she strikes.'],4:['Dalet','Time rewinds for the target, returning it to an earlier state.'],7:['Zayin','Time stands still for the target while the world moves on.']};
const buttons = [...document.querySelectorAll('[data-hour]')];
buttons.forEach(button => button.addEventListener('click',() => {
  const hour = button.dataset.hour;
  buttons.forEach(item => item.setAttribute('aria-pressed',String(item === button)));
  clock.style.setProperty('--hour',Number(hour) * 30 + 'deg');
  document.querySelector('.power h3').textContent = powers[hour][0];
  document.querySelector('.power p').textContent = powers[hour][1];
}));
const sound = document.querySelector('#sound');
let audio, timer, playing = false, beat = 0;
function tick() {
  if (document.hidden || !audio || audio.state !== 'running') return;
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  tone.type = 'triangle';
  tone.frequency.value = beat++ % 2 ? 1120 : 810;
  volume.gain.setValueAtTime(.045,audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(.0001,audio.currentTime + .04);
  tone.connect(volume).connect(audio.destination);
  tone.start();
  tone.stop(audio.currentTime + .05);
}
sound.addEventListener('click',async () => {
  sound.disabled = true;
  try {
    if (playing) { clearInterval(timer); playing = false; await audio.suspend(); }
    else {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      await audio.resume();
      playing = true; tick(); timer = setInterval(tick,1000);
    }
    sound.setAttribute('aria-pressed',String(playing));
    sound.querySelector('span').textContent = playing ? 'Sound on' : 'Sound off';
  } catch { sound.querySelector('span').textContent = 'Sound unavailable'; }
  finally { sound.disabled = false; }
});
