const root = document.documentElement;
const scenes = [...document.querySelectorAll('main section')];
const links = [...document.querySelectorAll('nav a')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const effectsOn = () => !reduced.matches;
const chapterNav = document.querySelector('nav[aria-label="Chapters"]');
let displayedLink;
function moveChapterInk(link, centerLink = false) {
  chapterNav.style.setProperty('--tab-x', link.offsetLeft + 'px');
  chapterNav.style.setProperty('--tab-width', link.offsetWidth + 'px');
  if (centerLink && chapterNav.scrollWidth > chapterNav.clientWidth) {
    chapterNav.scrollTo({left: link.offsetLeft - (chapterNav.clientWidth - link.offsetWidth) / 2, behavior: effectsOn() ? 'smooth' : 'instant'});
  }
}
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
  if (displayedLink !== links[chapter]) {
    displayedLink = links[chapter];
    moveChapterInk(displayedLink, true);
  }
  scenes[chapter].classList.add('arrived');
  root.style.setProperty('--progress',scrollY / Math.max(1,root.scrollHeight - height));
  if (effectsOn()) {
    root.style.setProperty('--drift',Math.min(scrollY * .20,180) + 'px');
    clock.style.setProperty('--ring',(height * .55 - rects[2].top) * .16 + 'deg');
    root.style.setProperty('--autumn-drift',Math.max(-70,Math.min(70,-rects[4].top * .14)) + 'px');
    root.style.setProperty('--night-drift',Math.max(-50,Math.min(50,-rects[5].top * .15)) + 'px');
  }
}
function queuePaint() { if (!frame) frame = requestAnimationFrame(paint); }
addEventListener('scroll',queuePaint,{passive:true});
new ResizeObserver(() => {
  if (displayedLink) moveChapterInk(displayedLink, true);
  queuePaint();
}).observe(chapterNav);
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

const loader = document.querySelector('.prologue');
const finishIntro = () => loader.remove();
loader.addEventListener('animationend', event => {
  if (event.target === loader) finishIntro();
});
setTimeout(finishIntro, 1600);

const weather = document.querySelector('.weather');
for (let i = 0; i < 21; i++) {
  const fall = document.createElement('i');
  fall.append(document.createElement('b'));
  fall.style.left = ((i * 37) % 103) + '%';
  fall.style.setProperty('--fall', (9 + i % 8) + 's');
  fall.style.setProperty('--delay', (-i * 2.87) + 's');
  fall.style.setProperty('--size', (13 + (i * 7) % 17) + 'px');
  fall.style.setProperty('--hue', ((i % 4) * 8 - 10) + 'deg');
  fall.style.setProperty('--wind', (i % 2 ? 60 : -45) + 'px');
  weather.append(fall);
}
reduced.addEventListener('change',queuePaint);

const effects = document.querySelector('.ink-effects');
function burst(x,y) {
  if (!effectsOn()) return;
  if (effects.children.length >= 6) effects.firstElementChild.remove();
  const mark = document.createElement('div');
  mark.className = 'sigil';
  mark.style.left = x + 'px';
  mark.style.top = y + 'px';
  for (let i = 0; i < 9; i++) {
    const shard = document.createElement('i');
    shard.style.setProperty('--angle',(i * 40 + 10) + 'deg');
    shard.style.setProperty('--reach',(27 + i % 3 * 8) + 'px');
    mark.append(shard);
  }
  effects.append(mark);
  setTimeout(() => mark.remove(),660);
}
document.addEventListener('click',event => {
  if (event.detail > 0) burst(event.clientX,event.clientY);
});
const plate = document.querySelector('.detail-plate');
const descriptions = {
  full:'Kurumi’s Astral Dress, from headdress to hem.',
  ribbon:'Scarlet ribbons trace the crown of her head.',
  clock:'Gold hands and a ring of numerals fill her left iris.',
  lace:'Black scalloped lace follows the folds of crimson fabric.'
};
const detailButtons = [...document.querySelectorAll('[data-detail]')];
const illustrations = [...plate.querySelectorAll('[data-art]')];
let requestedView = plate.dataset.view;

async function selectDetail(view) {
  requestedView = view;
  const image = illustrations.find(item => item.dataset.art === view);
  try {
    image.loading = 'eager';
    await image.decode();
  } catch {
    if (requestedView === view) plate.querySelector('figcaption').textContent = 'This illustration could not load. Select the detail to retry.';
    return;
  }
  // A slower image must not replace the reader’s most recent selection.
  if (view !== requestedView) return;
  plate.dataset.view = view;
  for (const item of illustrations) {
    item.classList.toggle('is-visible',item === image);
    item.setAttribute('aria-hidden',String(item !== image));
  }
  plate.querySelector('figcaption').textContent = descriptions[view];
  for (const button of detailButtons) {
    button.setAttribute('aria-pressed',String(button.dataset.detail === view));
  }
}
for (const button of detailButtons) {
  button.addEventListener('click',() => selectDetail(button.dataset.detail));
}
const cast = document.querySelector('.pixel-cast');
const summon = document.querySelector('#summon');
const positions = [33,66,20,78];
const counts = ['One silhouette','Two silhouettes','Three silhouettes','Four silhouettes','Five silhouettes'];
summon.addEventListener('click',() => {
  const echoes = [...cast.querySelectorAll('.double')];
  if (echoes.length === positions.length) echoes.forEach(echo => echo.remove());
  else {
    const double = document.createElement('img');
    double.src = cast.querySelector('.original').src;
    double.alt = '';
    double.className = 'sprite double';
    double.style.left = positions[echoes.length] + '%';
    cast.append(double);
  }
  const total = cast.childElementCount;
  document.querySelector('#echo-count').textContent = counts[total - 1];
  summon.firstChild.textContent = total === 5 ? 'Recall the echoes ' : 'Call an echo ';
});
