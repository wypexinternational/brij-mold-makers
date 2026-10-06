const WHATSAPP = '919530577218';
const EMAIL = 'brijmoldmakers@gmail.com';

document.getElementById('year').textContent = new Date().getFullYear();

// Phone menu.
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('main-nav');
navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
nav?.addEventListener('click', (e) => {
  if (e.target.closest('a')) { nav.classList.remove('open'); navToggle?.setAttribute('aria-expanded', 'false'); }
});

// Hero video (home page only): a pause control, and no autoplay for people who asked for less motion.
const video = document.querySelector('.flow-video');
const toggle = document.querySelector('.video-toggle');
function setPlaying(playing) {
  if (playing) video.play().catch(() => {});
  else video.pause();
  toggle.textContent = playing ? 'Pause' : 'Play';
  toggle.setAttribute('aria-pressed', String(!playing));
}
if (video && toggle) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
  toggle.addEventListener('click', () => setPlaying(video.paused));
}

// 3D model: only downloaded when someone asks for it.
const loadBtn = document.getElementById('load-model');
loadBtn?.addEventListener('click', async () => {
  loadBtn.disabled = true;
  loadBtn.textContent = 'Opening the model…';
  try {
    const { ModelViewerElement } = await import('@google/model-viewer');
    // The model is meshopt-compressed (5 MB down to 1.2 MB); the decoder is self-hosted.
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
    mv.addEventListener('error', () => {
      loadBtn.disabled = false;
      loadBtn.textContent = 'The model did not load. Try again';
    }, { once: true });
    document.getElementById('viewer-slot').append(mv);
  } catch {
    loadBtn.disabled = false;
    loadBtn.textContent = 'The model did not load. Try again';
  }
});

// Quote form: builds the enquiry and opens it in WhatsApp or the email app.
// There is no server, so nothing is stored on the website.
const form = document.getElementById('quote-form');
const errorBox = document.getElementById('form-error');

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
    'New enquiry from the Brij Mold Makers website',
    '',
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    optional('Company', 'company'),
    `Country: ${data.get('country')}`,
    `Needs: ${needs.length ? needs.join(', ') : 'Not stated'}`,
    optional('Material', 'material'),
    optional('Quantity per year', 'qty'),
    '',
    `About the part: ${data.get('details')}`,
  ].filter((line) => line !== null).join('\n');

  if (channel === 'email') {
    const subject = `Quote request: ${needs[0] || 'part enquiry'} (${data.get('country')})`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text + '\n\n(Attach your files to this email.)')}`;
  } else {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
});
