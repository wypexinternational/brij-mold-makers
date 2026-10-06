# Brij Mold Makers website

Static site for Brij Mold Makers (mold design, flow analysis, 3D printing, toolmaking).
Built with Vite, deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

Same setup as the Wypex site (`~/Documents/Website`). Project notes, decisions and open
questions live in the vault: `~/SecondBrain/BrijMoldMakers/`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5181
npm run build      # output in dist/
npm run preview    # serve dist/ to check the production build
```

## Things that will bite you

- `base: './'` in `vite.config.js` keeps paths relative, so the same build works on the
  GitHub Pages project URL (`/brij-mold-makers/`) and on a custom domain later. Reference
  public files as `media/...`, never `/media/...`.
- `public/media/gearbox.glb` is meshopt-compressed (4.96 MB to 1.21 MB), centred, with
  instancing turned off. model-viewer cannot read meshopt without the decoder, which is
  self-hosted at `public/vendor/meshopt_decoder.js` (copied from three.js with the `export`
  line removed, because model-viewer loads it as a classic script). Without centring and
  with instancing on, the model renders tiny and off-centre.
- The 3D viewer library (about 290 KB gzipped) loads only when someone presses
  "Load the 3D model". Keep it that way.
- The mold flow animation was a 3.3 MB GIF; it is now `moldflow.webm` / `moldflow.mp4`
  (about 100 KB).
- The quote form has no server. It builds the message and opens WhatsApp or the email app.
  Nothing is stored on the site.

## Page structure (v5, 6 Oct 2026)

One page, mold-first: hero (live 3D mold cycle) → client strip → 01 Mold Design → 02 Mold
Manufacturing (pinned, steps slide sideways on desktop) → 03 Production → 04 Part Design and
3D Printing → About → Request a Quote. `mold-manufacturing.html` and `production.html` are
redirects to the matching sections (old links were shared on WhatsApp).

- `src/mold3d.js`: the procedural mold (three.js), its cycle runs on a GSAP timeline. It only
  renders while on screen. It is loaded as a separate chunk, so text and buttons do not wait for it.
- `src/main.js`: GSAP ScrollTrigger + SplitText. Header colour triggers are created after the
  manufacturing pin, otherwise their positions are wrong. `?shot` skips the intro for screenshots.
- Reduced motion: no loader, no word reveals, still mold frame, cross-section shown filled.

## Content rules

- Plain, direct English. No metaphors, no hype words.
- Never publish a number or certificate that Yuvraj has not confirmed. Pending items are
  tracked in `~/SecondBrain/BrijMoldMakers/open_questions.md`.
- Never show client work. Everything shown must be our own.
