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
const progress = document.querySelector('.progress');
const portrait = document.querySelector('.picture img');
const autumn = document.querySelector('.autumn-panorama');
const night = document.querySelector('.night-art');
let frame = 0;
function paint() {
  frame = 0;
  const height = window.innerHeight;
  const scroll = window.scrollY;
  const scrollRange = Math.max(1,root.scrollHeight - height);
  const rects = scenes.map(scene => scene.getBoundingClientRect());
  const chapter = rects.reduce((current,rect,index) => rect.top <= height * .5 ? index : current, 0);
  if (displayedLink !== links[chapter]) {
    displayedLink?.removeAttribute('aria-current');
    displayedLink = links[chapter];
    displayedLink.setAttribute('aria-current','location');
    moveChapterInk(displayedLink, true);
    scenes[chapter].classList.add('arrived');
  }
  progress.style.setProperty('--progress',scroll / scrollRange);
  if (effectsOn()) {
    if (rects[0].bottom >= 0) portrait.style.setProperty('--drift',Math.min(scroll * .20,180) + 'px');
    if (rects[2].top <= height && rects[2].bottom >= 0) {
      clock.style.setProperty('--ring',(height * .55 - rects[2].top) * .16 + 'deg');
    }
    if (rects[4].top <= height && rects[4].bottom >= 0) {
      autumn.style.setProperty('--autumn-drift',Math.max(-70,Math.min(70,-rects[4].top * .14)) + 'px');
    }
    if (rects[5].top <= height && rects[5].bottom >= 0) {
      night.style.setProperty('--night-drift',Math.max(-50,Math.min(50,-rects[5].top * .15)) + 'px');
    }
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
  full:'Kurumi\u2019s Astral Dress, from headdress to hem.',
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
  if (!image) return;
  try {
    image.loading = 'eager';
    if (image.complete && !image.naturalWidth) image.src = image.getAttribute('src');
    await image.decode();
  } catch {
    if (requestedView === view) plate.querySelector('figcaption').textContent = 'This illustration could not load. Select the detail to retry.';
    return;
  }
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
    double.src = 'assets/pixel-kurumi.png';
    double.alt = '';
    double.className = 'sprite double';
    double.style.left = positions[echoes.length] + '%';
    cast.append(double);
  }
  const total = cast.childElementCount;
  document.querySelector('#echo-count').textContent = counts[total - 1];
  summon.firstChild.textContent = total === 5 ? 'Recall the echoes ' : 'Call an echo ';
});

function watchLoadingArt(frame) {
  const image = frame.querySelector('img');
  if (image.complete) return;
  let tiles;
  const timer = setTimeout(() => {
    if (image.complete) return;
    tiles = document.createElement('div');
    tiles.className = 'tile-loader';
    tiles.setAttribute('aria-hidden','true');
    for (let i = 0; i < 12; i++) {
      const tile = document.createElement('i');
      tile.style.setProperty('--phase', ((i % 4 + Math.floor(i / 4)) * -.11) + 's');
      tiles.append(tile);
    }
    frame.prepend(tiles);
  }, 140);
  function finish() {
    clearTimeout(timer);
    tiles?.remove();
    image.removeEventListener('load',finish);
    image.removeEventListener('error',finish);
  }
  image.addEventListener('load',finish);
  image.addEventListener('error',finish);
}

const loadingFrames = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    loadingFrames.unobserve(entry.target);
    watchLoadingArt(entry.target);
  }
}, {rootMargin:'100px'});
for (const frame of document.querySelectorAll('[data-loading-art]')) loadingFrames.observe(frame);
