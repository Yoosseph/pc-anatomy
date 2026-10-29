# PC Anatomy: Go deeper

Production brief and rendered 30-second, 9:16 vertical direct-response ad.

**[Watch or download the finished MP4](media/pc-anatomy-ad-30s.mp4)**

[![PC Anatomy ad preview](media/pc-anatomy-ad-poster.png)](media/pc-anatomy-ad-30s.mp4)

The finished cut uses actual app recordings, animated titles, captions, and an
original synthesized electronic soundtrack. It has no presenter or voiceover.
The UGC script below remains an alternative production treatment. In the rendered
cut, the 14–18s scene focuses on power routes; the 18–23s scene shows real memory
selection and compatibility-check captures.

The opening request's 30-second duration takes precedence over the conflicting
25-second and 15-second durations in the supplied template.

## Reproducing the video

With dependencies installed, start `npm run dev -- --host 127.0.0.1`, then run:

```sh
node scripts/capture-ad.mjs
node scripts/capture-ad.mjs --build-only
node scripts/render-ad.mjs
node scripts/verify-ad.mjs
```

The scripts use the existing Playwright dependency and Microsoft Edge on Windows.
Set `BROWSER_EXECUTABLE` for another Chromium browser with H.264/AAC MediaRecorder
support. Intermediate captures and review frames go to ignored `outputs/ad-video/`;
the deliverable and poster go to `docs/media/`. Rendering records 30 seconds in
real time; encoding may add a small fraction of a second to the container duration.
No new runtime dependency or production app code is introduced.

## Campaign

- **Goal:** Drive visits to https://pc-anatomy.com/.
- **Audience:** Curious gamers, first-time PC builders, and hardware students
  scrolling Instagram Reels or TikTok.
- **Benefit:** Understand computer hardware by taking it apart in interactive
  3D, free in your browser.
- **Style:** An energetic UGC presenter, high-contrast lighting, actual app
  recordings, quick jump cuts, and a hook in the first two seconds.
- **Delivery:** 1080 x 1920, 30 fps, 30 seconds, with burned-in captions.

## Shot-by-shot script

| Time   | Narration                                                                  | Camera and edit direction                                                                                                | On-screen text                                |
| ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| 0-2s   | "Don't unscrew your PC."                                                   | Tight handheld selfie. Presenter raises a screwdriver; immediate punch-in. Cut to the app before two seconds.            | PUT THE SCREWDRIVER DOWN.                     |
| 2-6s   | "Take this one apart instead. This is PC Anatomy."                         | Actual screen recording: drag the disassembly slider. Tower panels separate on the beat. Brief presenter reaction inset. | PC Anatomy                                    |
| 6-10s  | "Peel back the graphics card. Then go deeper."                             | Open the RTX 5090. Jump-cut from assembled card to separated fans, heatsink, and board. Push toward the processor.       | YES, YOU CAN GO DEEPER.                       |
| 10-14s | "Explore memory, right down to a single bit."                              | Three rhythmic cuts: DDR5 module, DRAM die, then cell diagram. Hold the final diagram long enough to register.           | RAM → CHIP → ONE BIT                          |
| 14-18s | "See where air moves—and where power goes."                                | Return to the assembled tower. Show Airflow, then Power. Follow each visualization with a tight crop.                    | FOLLOW THE AIR. → FOLLOW THE POWER.           |
| 18-23s | "Pick parts. Check compatibility. Understand what actually fits together." | Open Build your own PC. Show DDR4's slot mismatch, then select DDR5 and hold on "Memory fits the slots."                 | DO THESE PARTS FIT? → CHECK BEFORE YOU BUILD. |
| 23-26s | "All free. Right in your browser."                                         | Presenter returns, pointing toward the app. Match-cut to a satisfying assembled-tower orbit.                             | FREE • IN YOUR BROWSER                        |
| 26-30s | "Visit pc-anatomy dot com. Take your first PC apart."                      | Hold a clean end card over slowly moving actual product footage. Logo, URL, and one clear CTA.                           | pc-anatomy.com / Explore free →               |

## Visual prompts

Each quoted prompt is under 40 words. Use the same character reference for
presenter footage. Product prompts describe reference-driven treatments for
Runway or Higgsfield; use actual app recordings in the final edit to preserve
hardware and UI. Generative reconstruction alone cannot guarantee consistency.

1. **Hook**

   "Vertical 9:16 handheld selfie, curious young adult at a real gaming desk,
   charcoal shirt, dramatic window light, cyan monitor glow. Raise a screwdriver,
   pause with playful urgency, lean toward camera. Authentic phone footage,
   no generated text."

2. **Tower reveal**

   "Vertical 9:16 over-shoulder gaming-desk shot, same creator and lighting,
   quick push toward a stationary monitor. Keep screen flat and unobstructed
   for supplied PC Anatomy footage replacement. Natural handheld movement,
   no generated interface or text."

3. **GPU teardown — reference treatment**

   "Vertical 9:16 close-up using supplied PC Anatomy GPU footage. Punch into
   the existing exploded graphics card, emphasize separated cooling layers
   with two rhythmic reframes. Preserve source geometry, colors, interface,
   and labels."

4. **Memory dive — reference treatment**

   "Vertical 9:16 montage using supplied PC Anatomy memory captures: DDR5
   module, DRAM die, memory-cell diagram. Three sharp match cuts with
   progressively tighter framing. Preserve diagrams exactly. No invented
   circuitry or generated labels."

5. **Air and power — reference treatment**

   "Vertical 9:16 using supplied assembled-tower recordings. Show existing
   airflow visualization, then cut to existing power routes. Subtle digital
   push-in, crisp dark background. Preserve original route colors, hardware,
   and interface."

6. **Compatibility — reference treatment**

   "Vertical 9:16 screen-focused edit using supplied PC Anatomy build-panel
   footage. Punch into the memory mismatch, then the corrected selection.
   Keep actual interface text readable and unchanged. Quick cursor-led cuts,
   no fabricated controls."

7. **Presenter payoff**

   "Vertical 9:16 handheld selfie, same creator, charcoal shirt, gaming desk,
   cyan monitor glow and strong window light. Look into camera with excited
   understanding, gesture toward monitor, finish with a small confident nod.
   No text."

8. **Closing background**

   "Vertical 9:16 end-card background using supplied assembled PC Anatomy
   tower footage. Gentle digital push-in, tower framed below center, dark
   negative space above for logo and URL added in editing. Preserve source
   appearance."

## Brand and edit direction

Use the original [chip logo](../public/favicon.svg), the exact name **PC Anatomy**,
charcoal backgrounds, and the existing cyan-to-lavender accents (#a1d9e2 to
#b497cf). Add logos, captions, and URL in editing. This is a web product; its
interface and models serve as the consistent product identity, with no packaging.
Keep the presenter's face, clothing, desk, and lighting consistent across shots.

Deliver the narration conversationally at approximately 150 words per minute.
Use a punchy licensed instrumental around 130 BPM, clicks on interactions, and
short whooshes between scales. Duck the music beneath narration. Keep essential
text clear of platform controls and review the placement in each platform's
preview. Give the closing CTA four uninterrupted seconds.

## Capture references and claim checks

Record current app interactions rather than animating old screenshots into
invented behavior. These repository images establish visual references:

- [Assembled tower](screenshots/workbench-assembled.png)
- [Exploded GPU](screenshots/gpu-exploded.png)
- [Power routes](screenshots/power-flow-on.png)
- [Build mode](screenshots/build-mode.png)

The [README](../README.md) documents disassembly, memory exploration, airflow,
power routes, and build mode. [About](../app/about-dialog.tsx) and the
[site metadata](../index.html) establish that the explorer is free.
The [build panel](../app/build-panel.tsx) and
[compatibility checks](../lib/desktop-build.ts) establish the memory-fit sequence.

The compatibility scene depends on build mode from
[PR #40](https://github.com/Yoosseph/pc-anatomy/pull/40). Capture that scene from
the build-mode branch, and confirm the feature is deployed before publishing
the ad. Show the specific memory check, not a fabricated all-green verdict:
other selected parts can still have warnings.

Keep the silicon views visibly diagrammatic. They illustrate logical
architecture, not exact transistor placement. Power arrows show direction,
not measured speed or watts. Avoid implying vendor endorsement, measured
performance gains, or compatibility with every PC part on the market.
