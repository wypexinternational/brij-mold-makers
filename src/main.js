import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const WHATSAPP = '919530577218';
const EMAIL = 'brijmoldmakers@gmail.com';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const shot = new URLSearchParams(location.search).has('shot'); // for screenshots: skip the intro
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

$('#year').textContent = new Date().getFullYear();
if (reduced) document.documentElement.classList.add('reduced');

/* ---------- phone menu */
const navToggle = $('.nav-toggle');
const nav = $('#main-nav');
navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
nav?.addEventListener('click', (e) => {
  if (e.target.closest('a')) { nav.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }
});

/* ---------- hero mold + cycle readout */
const cyShot = $('#cyShot'), cyPhase = $('#cyPhase'), cyTime = $('#cyTime');
let lastShown = -1;
const stage = $('#moldStage');
if (stage) {
  // three.js loads in its own chunk, so the text and buttons do not wait for it
  import('./mold3d.js').then(({ initMold3D }) => initMold3D(stage, {
    onPhase: (_, name) => { cyPhase.textContent = name; },
    onShot: (n) => { cyShot.textContent = String(n).padStart(4, '0'); },
    onTick: (t) => {
      const v = Math.floor(t * 20) / 20; // update at most 20x a second
      if (v !== lastShown) { lastShown = v; cyTime.textContent = `${t.toFixed(2).padStart(5, '0')} s`; }
    },
  })).catch((err) => {
    // No WebGL: the hero still reads fine without the mold.
    $('.cycle')?.remove();
    console.warn('3D mold unavailable', err);
  });
}

/* ---------- header colour follows the section underneath */
const header = $('#siteHeader');
const setHeader = (mode) => {
  header.classList.toggle('solid', mode === 'light');
  header.classList.toggle('on-dark', mode === 'dark');
};
function headerTriggers() {
  // created after the manufacturing pin, so positions include the pin spacer
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top+=68', onLeave: () => setHeader('dark'), onEnterBack: () => setHeader('none') });
  $$('.section, .clients').forEach((sec) => {
    const mode = sec.matches('.section-dark, .clients') ? 'dark' : 'light';
    ScrollTrigger.create({ trigger: sec, start: 'top top+=68', end: 'bottom top+=68', onEnter: () => setHeader(mode), onEnterBack: () => setHeader(mode) });
  });
  ScrollTrigger.refresh();
}

/* ---------- mold flow video plays only when visible */
const video = $('.flow-video');
const vToggle = $('.video-toggle');
let userPaused = reduced;
if (video) {
  const play = () => { if (!userPaused) video.play().catch(() => {}); };
  new IntersectionObserver(([e]) => (e.isIntersecting ? play() : video.pause()), { threshold: 0.3 }).observe(video);
  vToggle.textContent = userPaused ? 'Play' : 'Pause';
  vToggle.addEventListener('click', () => {
    userPaused = !video.paused;
    userPaused ? video.pause() : video.play().catch(() => {});
    vToggle.textContent = userPaused ? 'Play' : 'Pause';
    vToggle.setAttribute('aria-pressed', String(userPaused));
  });
}

/* ---------- motion */
const fillRect = $('#fillRect'), sprueRect = $('#sprueRect');
const showFilled = () => {
  sprueRect?.setAttribute('height', '380');
  fillRect?.setAttribute('x', '180'); fillRect?.setAttribute('width', '540');
};

function intro() {
  const loader = $('#loader');
  if (reduced || shot) { loader?.remove(); return Promise.resolve(); }
  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: () => { loader.remove(); resolve(); } });
    tl.to('#loaderFill', { width: '100%', duration: 0.9, ease: 'power2.inOut' })
      .to(loader, { autoAlpha: 0, duration: 0.45, ease: 'power1.out' });
  });
}

async function motion() {
  await document.fonts.ready;
  if (reduced) { showFilled(); headerTriggers(); return; }

  // headline: lines rise from behind a mask
  const h1 = new SplitText('.split-lines', { type: 'lines', mask: 'lines', linesClass: 'line' });
  const heroTl = gsap.timeline({ paused: true });
  heroTl.from(h1.lines, { yPercent: 105, duration: 1.0, ease: 'power4.out', stagger: 0.09 })
    .from('.hero [data-rise]', { y: 18, autoAlpha: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08 }, '-=0.6')
    .from('#moldStage', { autoAlpha: 0, duration: 1.2, ease: 'power1.out' }, 0);
  await intro();
  shot ? heroTl.progress(1) : heroTl.play();

  // statements: words darken as they scroll through
  $$('[data-words]').forEach((el) => {
    const split = new SplitText(el, { type: 'words', wordsClass: 'w' });
    gsap.fromTo(split.words, { opacity: 0.16 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 45%', scrub: true },
    });
  });

  // blocks rise in once
  $$('main [data-rise]').filter((el) => !el.closest('.hero')).forEach((el) => {
    gsap.from(el, { y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // mold section fills: sprue first, then runner and cavities outward from the centre
  if (fillRect && sprueRect) {
    const p = { s: 0, f: 0 };
    gsap.timeline({
      scrollTrigger: { trigger: '.mold-section', start: 'top 75%', end: 'bottom 40%', scrub: 0.6 },
      onUpdate: () => {
        sprueRect.setAttribute('height', String(p.s * 175));
        fillRect.setAttribute('x', String(450 - p.f * 270));
        fillRect.setAttribute('width', String(p.f * 540));
      },
    }).to(p, { s: 1, duration: 0.3, ease: 'none' }).to(p, { f: 1, duration: 0.7, ease: 'none' });
  }

  // manufacturing: pin the section and slide the steps sideways (desktop)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const track = $('#hscrollTrack');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
    gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: '#hscroll', start: 'center center', end: () => `+=${distance()}`, scrub: 0.5, pin: '#manufacturing', anticipatePin: 1, invalidateOnRefresh: true },
    });
  });
  headerTriggers();
}
motion();

/* ---------- 3D gearbox, loaded on request */
const loadBtn = $('#load-model');
loadBtn?.addEventListener('click', async () => {
  loadBtn.disabled = true;
  loadBtn.textContent = 'Opening the model…';
  try {
    const { ModelViewerElement } = await import('@google/model-viewer');
    ModelViewerElement.meshoptDecoderLocation = new URL('vendor/meshopt_decoder.js', document.baseURI).href;
    const mv = document.createElement('model-viewer');
    mv.setAttribute('src', new URL('media/gearbox.glb', document.baseURI).href);
    mv.setAttribute('alt', 'Gearbox assembly 3D model. Drag to rotate.');
    mv.setAttribute('camera-orbit', '35deg 65deg auto');
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('touch-action', 'pan-y');
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('auto-rotate-delay', '0');
    mv.setAttribute('rotation-per-second', '18deg');
    mv.setAttribute('shadow-intensity', '0.6');
    mv.setAttribute('exposure', '1.05');
    mv.setAttribute('environment-image', 'neutral');
    mv.addEventListener('load', () => loadBtn.remove(), { once: true });
    mv.addEventListener('error', () => { loadBtn.disabled = false; loadBtn.textContent = 'The model did not load. Try again'; }, { once: true });
    $('#viewer-slot').append(mv);
  } catch {
    loadBtn.disabled = false;
    loadBtn.textContent = 'The model did not load. Try again';
  }
});

/* ---------- quote form: opens WhatsApp or email with the enquiry filled in */
const form = $('#quote-form');
const errorBox = $('#form-error');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const channel = event.submitter?.value || 'whatsapp';
  if (!form.checkValidity()) {
    const firstBad = form.querySelector(':invalid');
    const name = firstBad?.closest('label')?.firstChild?.textContent.trim() || 'a required field';
    errorBox.textContent = `Please fill in ${name.toLowerCase()} before sending.`;
    errorBox.hidden = false;
    firstBad?.focus();
    return;
  }
  errorBox.hidden = true;
  const data = new FormData(form);
  const needs = data.getAll('need');
  const optional = (label, key) => (data.get(key) ? `${label}: ${data.get(key)}` : null);
  const text = [
    'New enquiry from the Brij Mold Makers website', '',
    `Name: ${data.get('name')}`, `Email: ${data.get('email')}`, optional('Company', 'company'), `Country: ${data.get('country')}`,
    `Needs: ${needs.length ? needs.join(', ') : 'Not stated'}`, optional('Material', 'material'), optional('Quantity per year', 'qty'), '',
    `About the part: ${data.get('details')}`,
  ].filter((line) => line !== null).join('\n');
  if (channel === 'email') {
    const subject = `Quote request: ${needs[0] || 'part enquiry'} (${data.get('country')})`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text + '\n\n(Attach your files to this email.)')}`;
  } else {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
});
