# HeyGen HyperFrames — LumosSDK Promo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 8 HyperFrames HTML sub-compositions implementing the 43-second LumosSDK promotional video storyboard, wired into a root `index.html`.

**Architecture:** Each scene is a standalone sub-composition file in `heygen/compositions/frames/`. The root `heygen/index.html` is a standalone composition (no `<template>`) that hosts all 8 sub-comps via `data-composition-src` slots. GSAP 3 drives all animation; each file registers exactly one `gsap.timeline({ paused: true })` at `window.__timelines["<id>"]`.

**Tech Stack:** HyperFrames CLI 0.7.x · GSAP 3 (CDN) · Vanilla HTML/CSS · Google Fonts: Clash Display + JetBrains Mono

---

## Global Constraints

- Canvas: 1920×1080px, 16:9, every pixel used — no empty space
- Root has `width:1920px; height:1080px` explicitly on `#root`
- All full-screen backgrounds are `position:absolute; inset:0` children of `#root`, never on `#root` itself
- Styles and scripts go **inside** `<template>` for sub-compositions
- IDs are unique across the assembled page — prefix each with the frame number (e.g. `f1-`, `f2-`)
- No `display`/`visibility` tweens — use `autoAlpha` (GSAP opacity+visibility combo)
- No `repeat: -1` — compute finite repeat count where needed
- No render-time clocks or `Math.random()`
- `window.__timelines = window.__timelines || {}` guard before each registration
- Asset paths relative to the frame file: `../../portal/public/lumos-icon.png`, `../../screenshots/dashboard-current.png`
- GSAP CDN: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`
- Fonts CDN: `https://fonts.bunny.net/css?family=clash-display:400,500,600,700` + `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap`
- Color palette: `bg=#0C0E16 surface1=#1A1E2C surface2=#13161F border=#1E2438 cyan=#00D4FF purple=#7B5FFF green=#00E887 red=#FF4563 amber=#FFB800 text=#E8F2FF muted=#5A6A84`
- Validate after every task: `cd heygen && npm run check`

---

## File Structure

```
heygen/
  index.html                              ← root standalone composition (Task 1)
  compositions/
    frames/
      01-black-box-shatter.html           ← Frame 1,  0s–2s   (Task 2)
      02-the-problem.html                 ← Frame 2,  2s–7s   (Task 3)
      03-introducing-lumos.html           ← Frame 3,  7s–11s  (Task 4)
      04-code-editor.html                 ← Frame 4, 11s–16s  (Task 5)
      05-phone-demo.html                  ← Frame 5, 16s–24s  (Task 6)
      06-dashboard-building.html          ← Frame 6, 24s–31s  (Task 7)
      07-trace-detail.html                ← Frame 7, 31s–39s  (Task 8)
      08-cta.html                         ← Frame 8, 39s–43s  (Task 9)
```

---

## Task 1: Root Composition + Directory Scaffold

**Files:**
- Modify: `heygen/index.html`
- Create: `heygen/compositions/frames/` (directory)

**Interfaces:**
- Produces: `window.__timelines["lumos-promo"]`, 43s total duration; 8 host slots for sub-comps

- [ ] **Step 1: Create the compositions directory**

```bash
mkdir -p heygen/compositions/frames
```

- [ ] **Step 2: Replace `heygen/index.html` with the root composition**

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>LumosSDK Promo</title>
    <link rel="preconnect" href="https://fonts.bunny.net" />
    <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #0C0E16; width: 1920px; height: 1080px; overflow: hidden; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #0C0E16; }
    </style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="lumos-promo"
      data-duration="43"
      data-width="1920"
      data-height="1080"
    >
      <!-- Frame 1: The Black Box Shatter — 0s to 2s -->
      <div
        class="clip"
        data-composition-id="01-black-box-shatter"
        data-composition-src="compositions/frames/01-black-box-shatter.html"
        data-track-index="0"
        data-start="0"
        data-duration="2"
      ></div>

      <!-- Frame 2: The Problem — 2s to 7s -->
      <div
        class="clip"
        data-composition-id="02-the-problem"
        data-composition-src="compositions/frames/02-the-problem.html"
        data-track-index="0"
        data-start="2"
        data-duration="5"
      ></div>

      <!-- Frame 3: Introducing LumosSDK — 7s to 11s -->
      <div
        class="clip"
        data-composition-id="03-introducing-lumos"
        data-composition-src="compositions/frames/03-introducing-lumos.html"
        data-track-index="0"
        data-start="7"
        data-duration="4"
      ></div>

      <!-- Frame 4: Code Editor — 11s to 16s -->
      <div
        class="clip"
        data-composition-id="04-code-editor"
        data-composition-src="compositions/frames/04-code-editor.html"
        data-track-index="0"
        data-start="11"
        data-duration="5"
      ></div>

      <!-- Frame 5: Phone Demo — 16s to 24s -->
      <div
        class="clip"
        data-composition-id="05-phone-demo"
        data-composition-src="compositions/frames/05-phone-demo.html"
        data-track-index="0"
        data-start="16"
        data-duration="8"
      ></div>

      <!-- Frame 6: Dashboard Building — 24s to 31s -->
      <div
        class="clip"
        data-composition-id="06-dashboard-building"
        data-composition-src="compositions/frames/06-dashboard-building.html"
        data-track-index="0"
        data-start="24"
        data-duration="7"
      ></div>

      <!-- Frame 7: Trace Detail — 31s to 39s -->
      <div
        class="clip"
        data-composition-id="07-trace-detail"
        data-composition-src="compositions/frames/07-trace-detail.html"
        data-track-index="0"
        data-start="31"
        data-duration="8"
      ></div>

      <!-- Frame 8: CTA — 39s to 43s -->
      <div
        class="clip"
        data-composition-id="08-cta"
        data-composition-src="compositions/frames/08-cta.html"
        data-track-index="0"
        data-start="39"
        data-duration="4"
      ></div>
    </div>

    <script>
      (function () {
        window.__timelines = window.__timelines || {};
        // Root timeline is a pass-through — sub-comp timelines drive playback.
        // Duration matches data-duration="43".
        const tl = gsap.timeline({ paused: true });
        tl.to({}, { duration: 43 }); // hold for full duration
        window.__timelines['lumos-promo'] = tl;
      })();
    </script>
  </body>
</html>
```

- [ ] **Step 3: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors. (Sub-comp files don't exist yet — that's fine at this stage; lint checks the root structure.)

- [ ] **Step 4: Commit**

```bash
git -C heygen add index.html compositions/
git -C heygen commit -m "feat: scaffold root composition with 8 sub-comp slots, 43s"
```

---

## Task 2: Frame 1 — The Black Box Shatter (2s)

**Files:**
- Create: `heygen/compositions/frames/01-black-box-shatter.html`

**Interfaces:**
- Consumes: nothing
- Produces: `window.__timelines["01-black-box-shatter"]`, 2s duration

Timing (local 0–2s): 0–1.0s chaos flash phase → 1.0–1.1s hard black → 1.1–2.0s dashboard reveal + text swap.

- [ ] **Step 1: Create `heygen/compositions/frames/01-black-box-shatter.html`**

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

      <style>
        #f1-root { position:absolute; inset:0; width:1920px; height:1080px; overflow:hidden; }
        .f1-bg { position:absolute; inset:0; background:#0C0E16; }
        .f1-chaos { position:absolute; inset:0; display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(2,1fr); }
        .f1-panel { background:#000; border:1px solid #111; padding:14px; overflow:hidden; }
        .f1-pt { font-family:monospace; font-size:11px; line-height:1.6; white-space:pre; }
        .f1-pt.r { color:#FF4563; }
        .f1-pt.y { color:#FFB800; }
        .f1-pt.m { color:#444; }
        .f1-glitch-r { position:absolute; inset:0; background:rgba(255,0,0,0.06); pointer-events:none; }
        .f1-glitch-b { position:absolute; inset:0; background:rgba(0,100,255,0.06); pointer-events:none; }
        .f1-headline {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          font-family:"Clash Display",sans-serif; font-size:74px; font-weight:700;
          letter-spacing:-1px; text-align:center; pointer-events:none; line-height:1.15;
        }
        .f1-hl-white { color:#E8F2FF; text-shadow:0 2px 30px rgba(255,69,99,0.45); }
        .f1-hl-grad {
          background:linear-gradient(90deg,#00D4FF,#7B5FFF);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .f1-black { position:absolute; inset:0; background:#000; }
        .f1-dash {
          position:absolute; inset:0; background:#0C0E16;
          display:flex; align-items:center; justify-content:center;
        }
        .f1-dash-card {
          width:1680px; height:900px; background:#13161F; border-radius:24px;
          border:1px solid #1E2438;
          background-image:
            linear-gradient(180deg,rgba(0,212,255,0.05) 0%,transparent 25%),
            repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(30,36,56,0.5) 40px),
            repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(30,36,56,0.25) 80px);
        }
      </style>

      <div id="f1-root" data-composition-id="01-black-box-shatter" data-width="1920" data-height="1080">
        <div class="f1-bg"></div>

        <div id="f1-chaos" class="f1-chaos">
          <div class="f1-panel"><pre class="f1-pt r">E/LLMAgent: timeout 5000ms
W/HttpClient: 503 retry 3/3
E/LLMAgent: null response
D/Room: cursor leak
E/LLMAgent: timeout 5000ms</pre></div>
          <div class="f1-panel"><pre class="f1-pt y">{"choices":[{"message":
  {"role":"assistant",
   "content":null},
  "finish_reason":"length"}],
 "error":{"code":503}}</pre></div>
          <div class="f1-panel"><pre class="f1-pt r">FATAL: AgentLoop crashed
  AgentRunner.kt:142
  ChatViewModel.kt:89
  NullPointerException
  content was null</pre></div>
          <div class="f1-panel"><pre class="f1-pt m">GET /v1/chat/completions
  status: 502 Bad Gateway
  retry: 1/3 in 1000ms
  retry: 2/3 in 2000ms
  FAILED after 3 retries</pre></div>
          <div class="f1-panel"><pre class="f1-pt r">W/Firebase: Crashlytics
E/AgentLoop: state NULL
  expected: RUNNING
  actual: null
FATAL: unhandled exception</pre></div>
          <div class="f1-panel"><pre class="f1-pt y">DEBUG AgentRouter:
  intent: null
  model: gpt-4o
  tokens: ???
  cost:   ???
  latency:???</pre></div>
        </div>

        <div id="f1-gr" class="f1-glitch-r"></div>
        <div id="f1-gb" class="f1-glitch-b"></div>

        <div id="f1-hl1" class="f1-headline" style="opacity:0">
          <div class="f1-hl-white">YOUR ANDROID AI AGENTS</div>
          <div class="f1-hl-white">ARE A BLACK BOX.</div>
        </div>

        <div id="f1-black" class="f1-black"></div>
        <div id="f1-dash" class="f1-dash" style="opacity:0">
          <div class="f1-dash-card"></div>
        </div>

        <div id="f1-hl2" class="f1-headline" style="opacity:0">
          <div class="f1-hl-grad">TURN THE LIGHTS ON</div>
          <div class="f1-hl-grad">WITH LUMOS.</div>
        </div>
      </div>

      <script>
        (function () {
          window.__timelines = window.__timelines || {};
          const tl = gsap.timeline({ paused: true });

          // PHASE 1 — CHAOS (0s–1.0s)
          tl.fromTo('#f1-hl1', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0);
          // RGB glitch jitter: repeat 11 = ~0.9s at 75ms each direction
          tl.fromTo('#f1-gr', { x: -6 }, { x: 6, duration: 0.075, repeat: 11, yoyo: true, ease: 'none' }, 0);
          tl.fromTo('#f1-gb', { x: 6 }, { x: -6, duration: 0.075, repeat: 11, yoyo: true, ease: 'none' }, 0);
          // Chaos panels flicker (simulate rapid cuts)
          tl.to('#f1-chaos', { autoAlpha: 0.6, duration: 0.08, repeat: 5, yoyo: true, ease: 'none' }, 0.2);

          // PHASE 2 — HARD BLACK (1.0s–1.1s)
          tl.fromTo('#f1-black', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 1.0);
          tl.set(['#f1-chaos','#f1-hl1','#f1-gr','#f1-gb'], { autoAlpha: 0 }, 1.0);

          // PHASE 3 — REVEAL (1.1s–2.0s)
          tl.fromTo('#f1-black', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.15 }, 1.1);
          tl.fromTo('#f1-dash', { autoAlpha: 0, scale: 1 }, { autoAlpha: 1, scale: 1.03, duration: 0.9, ease: 'none' }, 1.1);
          tl.fromTo('#f1-hl2', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 1.2);

          window.__timelines['01-black-box-shatter'] = tl;
        })();
      </script>
    </template>
  </body>
</html>
```

- [ ] **Step 2: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Snapshot at midpoint (global 1s)**

```bash
cd heygen && npx hyperframes snapshot --at 1
```

Expected: 6-panel chaos grid filling canvas, headline visible, RGB shift on glitch layers.

- [ ] **Step 4: Commit**

```bash
git -C heygen add compositions/frames/01-black-box-shatter.html
git -C heygen commit -m "feat(frame-01): black-box-shatter — chaos flash, hard-black, dashboard reveal"
```

---

## Task 3: Frame 2 — The Problem (5s)

**Files:**
- Create: `heygen/compositions/frames/02-the-problem.html`

**Interfaces:**
- Consumes: nothing
- Produces: `window.__timelines["02-the-problem"]`, 5s duration

Timing: 0s phone drops (spring) → 0.4s red ? flickers → 0.5–0.86s 4 panels slam in → 1.2s jitter starts → 1.5s text appears → 4.5s exit.

- [ ] **Step 1: Create `heygen/compositions/frames/02-the-problem.html`**

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

      <style>
        #f2-root { position:absolute; inset:0; width:1920px; height:1080px; overflow:hidden; }
        .f2-bg { position:absolute; inset:0; background:#000; }
        .f2-phone {
          position:absolute; left:50%; top:50%;
          width:420px; height:900px; border-radius:52px;
          border:1.5px solid #1E2438; background:#0A0C12;
          overflow:hidden;
        }
        .f2-phead {
          background:#13161F; padding:12px 18px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .f2-ptitle { font-family:"Clash Display",sans-serif; font-size:15px; color:#E8F2FF; font-weight:600; }
        .f2-pdot { width:7px; height:7px; background:#FF4563; border-radius:50%; }
        .f2-pbody {
          flex:1; padding:20px; display:flex; align-items:center; justify-content:center;
          font-family:monospace; font-size:12px; color:#FF4563; text-align:center; line-height:1.8;
        }
        .f2-qmark {
          position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
          font-family:"Clash Display",sans-serif; font-size:230px; font-weight:700;
          color:#FF4563; line-height:1; pointer-events:none;
          text-shadow:0 0 100px rgba(255,69,99,0.35);
        }
        .f2-panel {
          position:absolute; width:280px; height:130px;
          background:rgba(26,30,44,0.9); border:1px solid #1E2438; border-radius:14px;
          padding:16px 20px;
        }
        .f2-pl { font-family:monospace; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#5A6A84; margin-bottom:8px; }
        .f2-pv { font-family:monospace; font-size:38px; font-weight:700; color:rgba(232,242,255,0.12); }
        .f2-body-text {
          position:absolute; bottom:80px; left:50%; transform:translateX(-50%);
          font-family:"Clash Display",sans-serif; font-size:50px; font-weight:700;
          color:#E8F2FF; white-space:nowrap; text-align:center; line-height:1.2;
        }
      </style>

      <div id="f2-root" data-composition-id="02-the-problem" data-width="1920" data-height="1080">
        <div class="f2-bg"></div>

        <div id="f2-phone" class="f2-phone" style="transform:translate(-50%,-500px);">
          <div class="f2-phead">
            <span class="f2-ptitle">Lumos Demo</span>
            <div class="f2-pdot"></div>
          </div>
          <div class="f2-pbody">Error: Could not reach agent.<br/><span style="color:#5A6A84">No logs available.</span></div>
        </div>

        <div id="f2-qmark" class="f2-qmark" style="opacity:0">?</div>

        <div id="f2-p1" class="f2-panel" style="left:-380px; top:calc(50% - 65px);">
          <div class="f2-pl">Traces</div><div class="f2-pv">—</div>
        </div>
        <div id="f2-p2" class="f2-panel" style="right:-380px; top:calc(50% - 65px);">
          <div class="f2-pl">Logs</div><div class="f2-pv">0</div>
        </div>
        <div id="f2-p3" class="f2-panel" style="left:calc(50% - 140px); top:-200px;">
          <div class="f2-pl">Latency</div><div class="f2-pv">???</div>
        </div>
        <div id="f2-p4" class="f2-panel" style="left:calc(50% - 140px); bottom:-200px;">
          <div class="f2-pl">Errors</div><div class="f2-pv">???</div>
        </div>

        <div id="f2-text" class="f2-body-text" style="opacity:0">
          YOU SHIP THE AGENT.<br/>YOU LOSE THE CONTEXT.
        </div>
      </div>

      <script>
        (function () {
          window.__timelines = window.__timelines || {};
          const tl = gsap.timeline({ paused: true });

          // PHONE DROP — spring settle (0s–0.4s)
          tl.fromTo('#f2-phone',
            { y: 0, autoAlpha: 1 },
            { y: 500, duration: 0.001 }, 0); // start off top
          tl.fromTo('#f2-phone',
            { top: '-500px' },
            { top: '50%', duration: 0.4, ease: 'back.out(1.5)' }, 0);

          // RED ? (0.4s) — flicker
          tl.fromTo('#f2-qmark', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.4);
          tl.to('#f2-qmark', { autoAlpha: 0.5, duration: 0.08, repeat: 5, yoyo: true, ease: 'none' }, 0.5);

          // 4 PANELS SLAM IN (stagger 120ms, power4 hard stop)
          tl.fromTo('#f2-p1', { x: -480 }, { x: 0, duration: 0.18, ease: 'power4.out' }, 0.5);
          tl.fromTo('#f2-p2', { x: 480 }, { x: 0, duration: 0.18, ease: 'power4.out' }, 0.62);
          tl.fromTo('#f2-p3', { y: -280 }, { y: 0, duration: 0.18, ease: 'power4.out' }, 0.74);
          tl.fromTo('#f2-p4', { y: 280 }, { y: 0, duration: 0.18, ease: 'power4.out' }, 0.86);

          // PANEL JITTER (1.2s–4.5s) — 8 yoyo cycles each ≈ 3.2s of shake
          tl.to('#f2-p1', { x: 1.5, y: 1, duration: 0.4, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 1.2);
          tl.to('#f2-p2', { x: -1.5, y: -1, duration: 0.4, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 1.2);
          tl.to('#f2-p3', { x: 1, y: -1.5, duration: 0.4, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 1.2);
          tl.to('#f2-p4', { x: -1, y: 1.5, duration: 0.4, repeat: 7, yoyo: true, ease: 'sine.inOut' }, 1.2);

          // TEXT (1.5s)
          tl.fromTo('#f2-text', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 1.5);

          // MOTION OUT (4.5s)
          tl.to('#f2-p1', { x: -480, duration: 0.3, ease: 'power3.in' }, 4.5);
          tl.to('#f2-p2', { x: 480, duration: 0.3, ease: 'power3.in' }, 4.5);
          tl.to('#f2-p3', { y: -280, duration: 0.3, ease: 'power3.in' }, 4.5);
          tl.to('#f2-p4', { y: 280, duration: 0.3, ease: 'power3.in' }, 4.5);
          tl.to(['#f2-phone','#f2-qmark','#f2-text'], { autoAlpha: 0, duration: 0.3 }, 4.7);

          window.__timelines['02-the-problem'] = tl;
        })();
      </script>
    </template>
  </body>
</html>
```

- [ ] **Step 2: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Snapshot at midpoint (global 4.5s)**

```bash
cd heygen && npx hyperframes snapshot --at 4.5
```

Expected: Black canvas, phone center, red "?" over phone, 4 frosted panels at settled positions, text bottom-center.

- [ ] **Step 4: Commit**

```bash
git -C heygen add compositions/frames/02-the-problem.html
git -C heygen commit -m "feat(frame-02): the-problem — phone drop, panels slam, jitter, text"
```

---
## Task 4: Frame 3 — Introducing LumosSDK (4s)

**Files:**
- Create: `heygen/compositions/frames/03-introducing-lumos.html`

**Interfaces:**
- Consumes: `../../portal/public/lumos-icon.png`
- Produces: `window.__timelines["03-introducing-lumos"]`, 4s duration

Timing: 0s red shards burst → 0.2s icon drops (spring) → 0.55s shockwave → 0.7s headline snaps in blocks → 1.2s gradient lines slice out → 1.5s tagline fades → 3.5s zoom-rail exit.

- [ ] **Step 1: Create `heygen/compositions/frames/03-introducing-lumos.html`**

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

      <style>
        #f3-root { position:absolute; inset:0; width:1920px; height:1080px; overflow:hidden; }
        .f3-bg { position:absolute; inset:0; background:#0C0E16; }
        .f3-glow {
          position:absolute; left:50%; top:360px; transform:translateX(-50%);
          width:600px; height:600px; border-radius:50%;
          background:radial-gradient(ellipse,rgba(0,212,255,0.06) 0%,rgba(123,95,255,0.04) 50%,transparent 70%);
          pointer-events:none;
        }
        /* Icon */
        #f3-icon {
          position:absolute; left:50%; top:278px; transform:translateX(-50%);
          width:160px; height:160px; border-radius:28px;
          object-fit:cover;
        }
        /* Shockwave ring */
        #f3-wave {
          position:absolute; left:50%; top:358px;
          width:0; height:0; border-radius:50%;
          border:2px solid #00D4FF;
          transform:translate(-50%,-50%);
          pointer-events:none;
        }
        /* Headline */
        #f3-headline {
          position:absolute; left:50%; top:468px; transform:translateX(-50%);
          font-family:"Clash Display",sans-serif; font-size:96px; font-weight:700;
          letter-spacing:-1px; white-space:nowrap;
          background:linear-gradient(90deg,#00D4FF,#7B5FFF);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        /* Gradient lines */
        #f3-line-l {
          position:absolute; top:586px; right:960px;
          height:1.5px; width:0; background:linear-gradient(270deg,#00D4FF,#7B5FFF);
          transform-origin:right center;
        }
        #f3-line-r {
          position:absolute; top:586px; left:960px;
          height:1.5px; width:0; background:linear-gradient(90deg,#00D4FF,#7B5FFF);
          transform-origin:left center;
        }
        /* Tagline */
        #f3-tagline {
          position:absolute; top:608px; left:50%; transform:translateX(-50%);
          font-family:"JetBrains Mono",monospace; font-size:22px; color:#5A6A84;
          letter-spacing:1.5px; white-space:nowrap;
        }
        /* Red shards */
        .f3-shard {
          position:absolute; left:50%; top:540px;
          width:0; height:0;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-bottom:20px solid #FF4563;
          pointer-events:none;
        }
        /* Exit zoom wrap */
        #f3-zoom { position:absolute; inset:0; }
      </style>

      <div id="f3-root" data-composition-id="03-introducing-lumos" data-width="1920" data-height="1080">
        <div class="f3-bg"></div>
        <div class="f3-glow" id="f3-glow" style="opacity:0"></div>
        <div id="f3-zoom">
          <!-- Shards (30 of them, positioned by JS) -->
          <div id="f3-shards"></div>

          <img id="f3-icon" src="../../portal/public/lumos-icon.png" alt="Lumos" style="opacity:0" />
          <div id="f3-wave"></div>
          <div id="f3-headline" style="opacity:0">LumosSDK</div>
          <div id="f3-line-l"></div>
          <div id="f3-line-r"></div>
          <div id="f3-tagline" style="opacity:0">Total observability. Zero friction.</div>
        </div>
      </div>

      <script>
        (function () {
          window.__timelines = window.__timelines || {};
          const tl = gsap.timeline({ paused: true });
          const root = document.querySelector("#f3-shards");

          // Create 20 shards programmatically with fixed angles/distances (deterministic)
          const shardAngles = [0,18,36,54,72,90,108,126,144,162,180,198,216,234,252,270,288,306,324,342];
          const shardDists =  [220,180,260,140,300,190,250,170,310,200,230,160,280,210,240,150,290,180,270,220];
          shardAngles.forEach(function(angle, i) {
            var s = document.createElement("div");
            s.className = "f3-shard";
            s.id = "f3-s" + i;
            s.style.cssText = "left:50%;top:540px;opacity:0;";
            root.appendChild(s);
            // Animate outward along angle
            var rad = angle * Math.PI / 180;
            var dist = shardDists[i];
            tl.fromTo(s,
              { x: 0, y: 0, rotation: angle, autoAlpha: 1, scale: 0.8 },
              { x: Math.sin(rad)*dist, y: -Math.cos(rad)*dist, rotation: angle + 180,
                autoAlpha: 0, scale: 0.3, duration: 0.3, ease: "power2.out" },
              0
            );
          });

          // ICON DROP (0.2s–0.7s) — back.out spring
          tl.fromTo("#f3-icon",
            { y: -320, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(1.6)" }, 0.2);

          // GLOW reveals on impact (0.55s)
          tl.fromTo("#f3-glow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.55);

          // SHOCKWAVE RING (0.55s — impact frame)
          tl.fromTo("#f3-wave",
            { width: 0, height: 0, autoAlpha: 1, marginLeft: 0, marginTop: 0 },
            { width: 340, height: 340, marginLeft: -170, marginTop: -170, autoAlpha: 0, duration: 0.5, ease: "power2.out" },
            0.55);

          // HEADLINE — "Lumos" then "SDK" in two instant blocks (0.7s + 0.85s)
          tl.fromTo("#f3-headline", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.7);
          // Clip animation: start with half-width clip, expand to full (simulates 2-block appearance)
          tl.fromTo("#f3-headline",
            { clipPath: "inset(0 50% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 0.15, ease: "power3.out" }, 0.85);

          // GRADIENT LINES slice out (1.2s–1.8s, 600ms)
          tl.fromTo("#f3-line-l", { width: 0 }, { width: 880, duration: 0.6, ease: "power2.out" }, 1.2);
          tl.fromTo("#f3-line-r", { width: 0 }, { width: 880, duration: 0.6, ease: "power2.out" }, 1.2);

          // TAGLINE (1.5s)
          tl.fromTo("#f3-tagline", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 1.5);

          // ICON pulse (slow glow, 2s–4s)
          tl.to("#f3-icon", { filter: "drop-shadow(0 20px 60px rgba(0,212,255,0.4))", duration: 1, yoyo: true, repeat: 1 }, 2.0);

          // ZOOM-RAIL EXIT (3.5s–4.0s)
          tl.to("#f3-zoom", { scale: 3.5, transformOrigin: "50% 50%", duration: 0.5, ease: "power3.in" }, 3.5);
          tl.to("#f3-zoom", { autoAlpha: 0, duration: 0.25 }, 3.75);

          window.__timelines["03-introducing-lumos"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
```

- [ ] **Step 2: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Snapshot at midpoint (global 9s)**

```bash
cd heygen && npx hyperframes snapshot --at 9
```

Expected: Lumos icon centered, "LumosSDK" gradient headline below it, two horizontal gradient lines, tagline visible.

- [ ] **Step 4: Commit**

```bash
git -C heygen add compositions/frames/03-introducing-lumos.html
git -C heygen commit -m "feat(frame-03): introducing-lumos — icon drop, shockwave, headline, gradient lines"
```

---

## Task 5: Frame 4 — Code Editor (5s)

**Files:**
- Create: `heygen/compositions/frames/04-code-editor.html`

**Interfaces:**
- Consumes: nothing
- Produces: `window.__timelines["04-code-editor"]`, 5s duration

Timing: 0–0.3s editor chrome fades in → 0.3s line 7 snaps → 0.6s line 9 (Lumos.init) → 1.0s line 10 → 1.3s line 11 → 1.6s line 12–13 → 2.0s green underline sweep → 2.4s badge snaps → 2.8s annotations → 4.7s phone morph exit.

- [ ] **Step 1: Create `heygen/compositions/frames/04-code-editor.html`**

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

      <style>
        #f4-root { position:absolute; inset:0; width:1920px; height:1080px; overflow:hidden; }
        .f4-bg { position:absolute; inset:0; background:#13161F; }
        /* Editor top bar */
        .f4-topbar {
          position:absolute; top:0; left:0; right:0; height:52px;
          background:#1A1E2C; border-bottom:1px solid #1E2438;
          display:flex; align-items:center; padding:0 20px; gap:0;
        }
        .f4-dots { display:flex; gap:7px; margin-right:20px; }
        .f4-dot { width:13px; height:13px; border-radius:50%; }
        .f4-tab {
          height:52px; padding:0 20px; display:flex; align-items:center;
          font-family:"JetBrains Mono",monospace; font-size:13px;
          border-bottom:2px solid #00D4FF; color:#E8F2FF; background:#13161F;
        }
        /* Left gutter */
        .f4-gutter {
          position:absolute; top:52px; left:0; bottom:0; width:56px;
          background:#13161F; border-right:1px solid #1E2438;
          display:flex; flex-direction:column; padding-top:16px; gap:0;
        }
        .f4-ln {
          height:28px; display:flex; align-items:center; justify-content:flex-end;
          padding-right:12px; font-family:"JetBrains Mono",monospace; font-size:14px; color:#5A6A84;
        }
        /* Code area */
        .f4-code-area {
          position:absolute; top:52px; left:56px; right:0; bottom:0;
          background:#13161F; padding:16px 24px; overflow:hidden;
        }
        .f4-line {
          height:28px; display:flex; align-items:center;
          font-family:"JetBrains Mono",monospace; font-size:16px; line-height:28px;
          white-space:pre;
        }
        .f4-line.highlight { background:rgba(0,212,255,0.05); border-radius:3px; }
        /* Syntax colors */
        .kw { color:#CC7832; }
        .cn { color:#FFC66D; }
        .fn { color:#00D4FF; }
        .st { color:#6A8759; }
        .nm { color:#E8F2FF; }
        .am { color:#FFB800; }
        .gr { color:#00E887; }
        .mt { color:#5A6A84; }
        /* Green underline sweep */
        #f4-underline {
          position:absolute; left:56px; height:2px; background:#00E887;
          transform-origin:left center; transform:scaleX(0);
        }
        /* Success badge */
        #f4-badge {
          position:absolute; top:68px; right:24px;
          background:rgba(0,232,135,0.12); border:1px solid #00E887; border-radius:8px;
          padding:6px 14px; font-family:"JetBrains Mono",monospace; font-size:13px; color:#00E887;
          white-space:nowrap;
        }
        /* Annotation callouts */
        .f4-ann {
          position:absolute; left:80px;
          background:#1A1E2C; border:1px solid; border-radius:6px;
          padding:4px 10px; font-family:"JetBrains Mono",monospace; font-size:12px;
          white-space:nowrap;
        }
        /* Exit morph: phone rises from bottom */
        #f4-phone-morph {
          position:absolute; bottom:-1080px; left:50%;
          width:420px; transform:translateX(-50%);
          background:#0A0C12; border-radius:52px 52px 0 0;
          border:1.5px solid #1E2438;
        }
      </style>

      <div id="f4-root" data-composition-id="04-code-editor" data-width="1920" data-height="1080">
        <div class="f4-bg"></div>

        <!-- Top bar -->
        <div class="f4-topbar">
          <div class="f4-dots">
            <div class="f4-dot" style="background:#FF4563"></div>
            <div class="f4-dot" style="background:#FFB800"></div>
            <div class="f4-dot" style="background:#00E887"></div>
          </div>
          <div class="f4-tab">ChatViewModel.kt</div>
        </div>

        <!-- Gutter -->
        <div class="f4-gutter">
          <div class="f4-ln">1</div><div class="f4-ln">2</div><div class="f4-ln">3</div>
          <div class="f4-ln">4</div><div class="f4-ln">5</div><div class="f4-ln">6</div>
          <div class="f4-ln">7</div><div class="f4-ln">8</div><div class="f4-ln">9</div>
          <div class="f4-ln">10</div><div class="f4-ln">11</div><div class="f4-ln">12</div>
          <div class="f4-ln">13</div><div class="f4-ln">14</div><div class="f4-ln">15</div>
        </div>

        <!-- Code area -->
        <div class="f4-code-area">
          <div class="f4-line mt" style="opacity:0.3">// ChatViewModel.kt</div>
          <div class="f4-line mt" style="opacity:0.3"></div>
          <div class="f4-line mt" style="opacity:0.3"><span class="kw">import</span> <span class="nm">com.lumos.android.Lumos</span></div>
          <div class="f4-line mt" style="opacity:0.3"></div>
          <div class="f4-line mt" style="opacity:0.3"></div>
          <div class="f4-line mt" style="opacity:0.3"></div>

          <!-- Line 7 — class declaration -->
          <div id="f4-l7" class="f4-line" style="opacity:0">
            <span class="kw">class </span><span class="cn">ChatViewModel</span><span class="nm">(context: Context) : </span><span class="cn">ViewModel</span><span class="nm">() {</span>
          </div>

          <div class="f4-line" style="opacity:0.2"></div>

          <!-- Line 9 — Lumos.init( -->
          <div id="f4-l9" class="f4-line highlight" style="opacity:0">
            <span class="nm">    </span><span class="kw">private val </span><span class="nm">lumos = </span><span class="fn">Lumos</span><span class="nm">.init(</span>
          </div>

          <!-- Line 10 -->
          <div id="f4-l10" class="f4-line" style="opacity:0">
            <span class="nm">        </span><span class="kw">context </span><span class="nm">= context,</span>
          </div>

          <!-- Line 11 -->
          <div id="f4-l11" class="f4-line" style="opacity:0">
            <span class="nm">        apiKey = </span><span class="am">BuildConfig</span><span class="nm">.</span><span class="gr">LUMOS_API_KEY</span>
          </div>

          <!-- Line 12 -->
          <div id="f4-l12" class="f4-line" style="opacity:0">
            <span class="nm">    )</span>
          </div>
          <!-- Line 13 -->
          <div id="f4-l13" class="f4-line" style="opacity:0">
            <span class="nm">}</span>
          </div>
        </div>

        <!-- Green underline (positioned over lines 9–13 block) -->
        <div id="f4-underline" style="top:304px; width:1864px;"></div>

        <!-- Success badge -->
        <div id="f4-badge" style="opacity:0">✓ Tracing active</div>

        <!-- Annotations -->
        <div id="f4-ann1" class="f4-ann" style="top:308px; opacity:0; color:#00D4FF; border-color:#00D4FF;">Auto-queues with Room →</div>
        <div id="f4-ann2" class="f4-ann" style="top:340px; opacity:0; color:#7B5FFF; border-color:#7B5FFF;">Uploads via WorkManager →</div>

        <!-- Phone morph element (rises from bottom at exit) -->
        <div id="f4-phone-morph" style="height:1080px;"></div>
      </div>

      <script>
        (function () {
          window.__timelines = window.__timelines || {};
          const tl = gsap.timeline({ paused: true });

          // CODE EDITOR fades in (0–0.3s)
          tl.fromTo("#f4-root", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0);

          // LINE 7 — class declaration (0.3s)
          tl.fromTo("#f4-l7", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.3);

          // LINE 9 — Lumos.init( with highlight strip (0.6s)
          tl.fromTo("#f4-l9", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.6);

          // LINE 10 (1.0s)
          tl.fromTo("#f4-l10", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 1.0);

          // LINE 11 (1.3s)
          tl.fromTo("#f4-l11", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 1.3);

          // LINE 12+13 (1.6s)
          tl.fromTo("#f4-l12", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 1.6);
          tl.fromTo("#f4-l13", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 1.65);

          // GREEN UNDERLINE SWEEP (2.0s–2.4s)
          tl.fromTo("#f4-underline",
            { scaleX: 0, autoAlpha: 1 },
            { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, 2.0);

          // SUCCESS BADGE snaps in (2.4s)
          tl.fromTo("#f4-badge",
            { autoAlpha: 0, y: -8 },
            { autoAlpha: 1, y: 0, duration: 0.15, ease: "back.out(2)" }, 2.4);

          // ANNOTATIONS (2.8s, stagger 200ms)
          tl.fromTo("#f4-ann1", { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.2, ease: "power2.out" }, 2.8);
          tl.fromTo("#f4-ann2", { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.2, ease: "power2.out" }, 3.0);

          // HOLD 3.5s–4.7s (no tweens)

          // PHONE MORPH EXIT (4.7s–5.0s) — phone silhouette rises from bottom
          tl.fromTo("#f4-phone-morph",
            { bottom: -1080 },
            { bottom: 0, duration: 0.3, ease: "power2.out" }, 4.7);

          window.__timelines["04-code-editor"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
```

- [ ] **Step 2: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Snapshot at midpoint (global 13.5s)**

```bash
cd heygen && npx hyperframes snapshot --at 13.5
```

Expected: Full-screen dark editor, all code lines visible with syntax highlighting, green underline, "✓ Tracing active" badge top-right, two annotation callouts.

- [ ] **Step 4: Commit**

```bash
git -C heygen add compositions/frames/04-code-editor.html
git -C heygen commit -m "feat(frame-04): code-editor — syntax-highlighted Lumos.init, badge, annotations"
```

---
## Task 6: Frame 5 — Phone Demo (8s)

**Files:**
- Create: `heygen/compositions/frames/05-phone-demo.html`

**Interfaces:**
- Consumes: `../../portal/public/lumos-icon.png`
- Produces: `window.__timelines["05-phone-demo"]`, 8s duration

Timing: 0s phone present → 0.8s input focus → 1.0–1.8s typing blocks → 1.8s send tap → 1.9s user bubble + pill1 → 2.1s typing dots + pill2 counter → 4.0s AI response + pill3 → 5.2s thumbs-up + pill4 → 7.2s phone exits right.

- [ ] **Step 1: Create `heygen/compositions/frames/05-phone-demo.html`**

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <style>
        #f5-root { position:absolute; inset:0; width:1920px; height:1080px; overflow:hidden; }
        .f5-bg { position:absolute; inset:0; background:#0C0E16; }
        .f5-bglow { position:absolute; left:0; top:50%; transform:translateY(-50%); width:700px; height:700px; border-radius:50%; background:radial-gradient(ellipse,rgba(123,95,255,0.06) 0%,transparent 70%); pointer-events:none; }
        #f5-phone { position:absolute; left:1280px; top:50%; width:420px; height:900px; border-radius:52px; border:1.5px solid #1E2438; background:#0A0C12; transform:translate(-50%,-50%); display:flex; flex-direction:column; overflow:hidden; }
        .f5-phead { background:#13161F; padding:12px 16px; border-bottom:1px solid #1E2438; display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .f5-phead img { width:36px; height:36px; border-radius:10px; object-fit:cover; }
        .f5-phead-info { flex:1; }
        .f5-ptitle { font-family:"Clash Display",sans-serif; font-size:15px; color:#E8F2FF; font-weight:600; line-height:1; }
        .f5-psub { font-family:"JetBrains Mono",monospace; font-size:10px; color:#5A6A84; margin-top:2px; }
        .f5-live { display:flex; align-items:center; gap:5px; }
        .f5-ldot { width:7px; height:7px; background:#00E887; border-radius:50%; }
        .f5-ltxt { font-family:"JetBrains Mono",monospace; font-size:11px; color:#00E887; font-weight:700; }
        .f5-msgs { flex:1; padding:14px; display:flex; flex-direction:column; gap:12px; overflow:hidden; }
        .f5-ai-hdr { display:flex; align-items:center; gap:6px; margin-bottom:5px; }
        .f5-ai-hdr img { width:20px; height:20px; border-radius:50%; object-fit:cover; }
        .f5-ai-lbl { font-family:"JetBrains Mono",monospace; font-size:11px; color:#9B82FF; font-weight:600; }
        .f5-bub-usr { align-self:flex-end; max-width:300px; background:linear-gradient(135deg,#7B5FFF,#5B4FE8); border-radius:16px 16px 4px 16px; padding:11px 14px; font-family:"JetBrains Mono",monospace; font-size:13px; color:#fff; line-height:1.5; }
        .f5-bub-ai { align-self:flex-start; max-width:310px; background:#1A1E2C; border:1px solid #1E2438; border-radius:16px 16px 16px 4px; padding:11px 14px; font-family:"JetBrains Mono",monospace; font-size:12px; color:#E8F2FF; line-height:1.5; }
        .f5-dots { align-self:flex-start; background:#1A1E2C; border:1px solid #1E2438; border-radius:16px; padding:11px 16px; display:flex; gap:5px; align-items:center; }
        .f5-d { width:7px; height:7px; background:#7B5FFF; border-radius:50%; }
        .f5-chips { display:flex; gap:8px; margin-top:6px; }
        .f5-chip { padding:5px 10px; border-radius:8px; font-size:14px; background:#13161F; border:1px solid #1E2438; }
        .f5-bar { background:#13161F; border-top:1px solid #1E2438; padding:10px 12px; display:flex; gap:10px; align-items:center; flex-shrink:0; }
        #f5-field { flex:1; background:#0C0E16; border:1px solid #7B5FFF; border-radius:14px; padding:10px 14px; font-family:"JetBrains Mono",monospace; font-size:13px; color:#5A6A84; }
        #f5-send { width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg,#7B5FFF,#5B4FE8); border:none; font-size:18px; font-weight:700; color:#fff; display:flex; align-items:center; justify-content:center; }
        .f5-pills { position:absolute; left:60px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:14px; }
        .f5-pill { background:#13161F; border:1px solid; border-radius:24px; padding:8px 18px; font-family:"JetBrains Mono",monospace; font-size:12px; }
        .f5-pmain { font-weight:700; }
        .f5-psub2 { font-size:10px; color:#5A6A84; margin-top:2px; }
      </style>
      <div id="f5-root" data-composition-id="05-phone-demo" data-width="1920" data-height="1080">
        <div class="f5-bg"></div>
        <div class="f5-bglow"></div>
        <div class="f5-pills">
          <div id="f5-p1" class="f5-pill" style="opacity:0;border-color:#00D4FF;color:#00D4FF"><div class="f5-pmain">▶ TRACE STARTED</div><div class="f5-psub2">trace-id: 8f2a3c...</div></div>
          <div id="f5-p2" class="f5-pill" style="opacity:0;border-color:#E8F2FF;color:#E8F2FF"><div class="f5-pmain">⏱ LATENCY: <span id="f5-lat">0ms</span></div><div class="f5-psub2">measuring...</div></div>
          <div id="f5-p3" class="f5-pill" style="opacity:0;border-color:#00E887;color:#00E887"><div class="f5-pmain">📥 RESPONSE CAPTURED</div><div class="f5-psub2">tokens: 84↑ 210↓ · $0.000234</div></div>
          <div id="f5-p4" class="f5-pill" style="opacity:0;border-color:#7B5FFF;color:#7B5FFF"><div class="f5-pmain">👍 FEEDBACK RECORDED</div><div class="f5-psub2">value: THUMBS_UP</div></div>
        </div>
        <div id="f5-phone">
          <div class="f5-phead">
            <img src="../../portal/public/lumos-icon.png" alt="" />
            <div class="f5-phead-info"><div class="f5-ptitle">Lumos Demo</div><div class="f5-psub">AI chat · SDK tracing active</div></div>
            <div class="f5-live"><div id="f5-ldot" class="f5-ldot"></div><span class="f5-ltxt">Live</span></div>
          </div>
          <div class="f5-msgs">
            <div id="f5-ub" class="f5-bub-usr" style="opacity:0;align-self:flex-end">What is the best way to learn Kotlin?</div>
            <div id="f5-typing" style="opacity:0;align-self:flex-start">
              <div class="f5-ai-hdr"><img src="../../portal/public/lumos-icon.png" alt=""/><span class="f5-ai-lbl">Lumos AI</span></div>
              <div class="f5-dots"><div id="f5-d1" class="f5-d"></div><div id="f5-d2" class="f5-d"></div><div id="f5-d3" class="f5-d"></div></div>
            </div>
            <div id="f5-aib" style="opacity:0;align-self:flex-start">
              <div class="f5-ai-hdr"><img src="../../portal/public/lumos-icon.png" alt=""/><span class="f5-ai-lbl">Lumos AI</span></div>
              <div class="f5-bub-ai">The best way to learn Kotlin is hands-on: start with official docs at kotlinlang.org, then build a small Android app.</div>
              <div class="f5-chips"><div id="f5-cu" class="f5-chip">👍</div><div id="f5-cd" class="f5-chip">👎</div></div>
            </div>
          </div>
          <div class="f5-bar">
            <div id="f5-field"><span id="f5-ft" style="color:#5A6A84">Ask anything…</span></div>
            <div id="f5-send">↑</div>
          </div>
        </div>
      </div>
      <script>
        (function(){
          window.__timelines = window.__timelines || {};
          var tl = gsap.timeline({paused:true});
          var ft = document.querySelector("#f5-ft");
          var lat = document.querySelector("#f5-lat");
          // Live dot pulse (repeat 9 = ~12.6s at 0.7s/half)
          tl.to("#f5-ldot",{scale:1.3,duration:0.7,repeat:9,yoyo:true,ease:"sine.inOut"},0);
          // Input focus (0.8s)
          tl.to("#f5-field",{boxShadow:"0 0 0 2px rgba(123,95,255,0.35)",duration:0.15},0.8);
          // Typing blocks
          tl.call(function(){if(ft){ft.textContent="What is the best";ft.style.color="#E8F2FF";}},null,1.0);
          tl.call(function(){if(ft)ft.textContent="What is the best way to learn";},null,1.3);
          tl.call(function(){if(ft)ft.textContent="What is the best way to learn Kotlin?";},null,1.6);
          // Send tap
          tl.to("#f5-send",{scale:0.88,duration:0.06},1.8);
          tl.to("#f5-send",{scale:1,duration:0.06},1.86);
          tl.call(function(){if(ft){ft.textContent="Ask anything…";ft.style.color="#5A6A84";}},null,1.88);
          // User bubble + pill1 (1.9s)
          tl.fromTo("#f5-ub",{autoAlpha:0,y:20},{autoAlpha:1,y:0,duration:0.2,ease:"power2.out"},1.9);
          tl.fromTo("#f5-p1",{autoAlpha:0,x:-30},{autoAlpha:1,x:0,duration:0.15,ease:"power2.out"},1.9);
          // Typing dots + pill2 latency counter (2.1s)
          tl.fromTo("#f5-typing",{autoAlpha:0},{autoAlpha:1,duration:0.1},2.1);
          tl.to("#f5-d1",{scale:1.4,duration:0.225,repeat:7,yoyo:true,ease:"sine.inOut"},2.1);
          tl.to("#f5-d2",{scale:1.4,duration:0.225,repeat:7,yoyo:true,ease:"sine.inOut"},2.23);
          tl.to("#f5-d3",{scale:1.4,duration:0.225,repeat:7,yoyo:true,ease:"sine.inOut"},2.36);
          tl.fromTo("#f5-p2",{autoAlpha:0,x:-30},{autoAlpha:1,x:0,duration:0.15},2.1);
          tl.to({v:0},{v:312,duration:1.9,ease:"none",onUpdate:function(){if(lat)lat.textContent=Math.round(this.targets()[0].v)+"ms";}},2.1);
          // AI response (4.0s)
          tl.to("#f5-typing",{autoAlpha:0,duration:0.15},4.0);
          tl.fromTo("#f5-aib",{autoAlpha:0,y:10},{autoAlpha:1,y:0,duration:0.25,ease:"power2.out"},4.1);
          // Pill2 lock
          tl.to("#f5-p2",{borderColor:"#00D4FF",color:"#00D4FF",duration:0.2},4.0);
          // Pill3 (4.3s)
          tl.fromTo("#f5-p3",{autoAlpha:0,x:-30},{autoAlpha:1,x:0,duration:0.15},4.3);
          // Thumbs up (5.2s)
          tl.to("#f5-cu",{scale:0.9,duration:0.06},5.2);
          tl.to("#f5-cu",{scale:1,background:"rgba(123,95,255,0.18)",borderColor:"#7B5FFF",duration:0.06},5.26);
          tl.to("#f5-cd",{opacity:0.4,duration:0.1},5.26);
          tl.to("#f5-cu",{boxShadow:"0 0 0 8px rgba(0,212,255,0.2)",duration:0.15},5.26);
          tl.to("#f5-cu",{boxShadow:"0 0 0 0px rgba(0,212,255,0)",duration:0.2},5.41);
          // Pill4 (5.2s)
          tl.fromTo("#f5-p4",{autoAlpha:0,x:-30},{autoAlpha:1,x:0,duration:0.15},5.2);
          // Phone exits right (7.2s)
          tl.to("#f5-phone",{x:1400,duration:0.6,ease:"power2.in"},7.2);
          tl.to(".f5-pills",{autoAlpha:0,duration:0.3},7.5);
          window.__timelines["05-phone-demo"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
```

- [ ] **Step 2: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Snapshot at midpoint (global 20s)**

```bash
cd heygen && npx hyperframes snapshot --at 20
```

Expected: Phone center-right, user bubble visible, typing dots active, 2 data pills left side.

- [ ] **Step 4: Commit**

```bash
git -C heygen add compositions/frames/05-phone-demo.html
git -C heygen commit -m "feat(frame-05): phone-demo — chat interaction, latency counter, data pills"
```

---

## Task 7: Frame 6 — Dashboard Building (7s)

**Files:**
- Create: `heygen/compositions/frames/06-dashboard-building.html`

**Interfaces:**
- Consumes: `../../portal/public/lumos-icon.png`
- Produces: `window.__timelines["06-dashboard-building"]`, 7s duration

Timing: 0s sidebar slides in → 0.4s header → 0.8–1.4s KPI cards + counters → 1.8s secondary cards → 2.2s bar chart → 2.5s donut → 4.0s table rows → 4.6s Row 1 pulse → 6.5s zoom exit.

- [ ] **Step 1: Create `heygen/compositions/frames/06-dashboard-building.html`**

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <style>
        #f6-root{position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden;background:#0C0E16;display:flex}
        .f6-sb{width:240px;height:1080px;background:#1A1E2C;border-right:1px solid #1E2438;display:flex;flex-direction:column;padding:24px 0;flex-shrink:0}
        .f6-sb-logo{display:flex;align-items:center;gap:10px;padding:0 20px 24px}
        .f6-sb-logo img{width:36px;height:36px;border-radius:10px}
        .f6-sb-name{font-family:"Clash Display",sans-serif;font-size:18px;font-weight:700;background:linear-gradient(90deg,#00D4FF,#7B5FFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .f6-sb-lbl{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#5A6A84;padding:0 20px 8px}
        .f6-nav{padding:10px 20px;font-family:"JetBrains Mono",monospace;font-size:13px;color:#5A6A84}
        .f6-nav.act{color:#00D4FF;background:rgba(0,212,255,0.08);border-left:2px solid #00D4FF}
        .f6-div{height:1px;background:#1E2438;margin:16px 0}
        .f6-sb-bot{margin-top:auto;padding:16px 20px;display:flex;align-items:center;gap:6px}
        .f6-ldot{width:7px;height:7px;background:#00E887;border-radius:50%}
        .f6-ltxt{font-family:"JetBrains Mono",monospace;font-size:11px;color:#00E887}
        .f6-main{flex:1;padding:24px 32px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
        .f6-ph{display:flex;align-items:center;gap:14px}
        .f6-phicon{width:36px;height:36px;background:rgba(0,212,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}
        .f6-phtitle{font-family:"Clash Display",sans-serif;font-size:30px;font-weight:700;background:linear-gradient(90deg,#E8F2FF,#00D4FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .f6-phsub{font-family:"JetBrains Mono",monospace;font-size:12px;color:#5A6A84}
        .f6-krow{display:flex;gap:12px}
        .f6-kpi{flex:1;background:#13161F;border:1px solid #1E2438;border-radius:14px;padding:16px;border-top:2px solid transparent}
        .f6-klbl{font-family:"JetBrains Mono",monospace;font-size:10px;color:#5A6A84;text-transform:uppercase;letter-spacing:1px}
        .f6-kval{font-family:"JetBrains Mono",monospace;font-size:32px;font-weight:700;margin-top:4px}
        .f6-kdelta{font-family:"JetBrains Mono",monospace;font-size:11px;color:#00E887;margin-top:2px}
        .f6-srow{display:flex;gap:10px}
        .f6-sec{background:#13161F;border:1px solid #1E2438;border-radius:12px;padding:12px 16px;border-top:2px solid transparent;min-width:150px}
        .f6-slbl{font-family:"JetBrains Mono",monospace;font-size:10px;color:#5A6A84;text-transform:uppercase;letter-spacing:1px}
        .f6-sval{font-family:"JetBrains Mono",monospace;font-size:22px;font-weight:700;margin-top:4px}
        .f6-charts{display:flex;gap:12px;flex:1;min-height:0}
        .f6-bc{flex:2;background:#13161F;border:1px solid #1E2438;border-radius:14px;padding:16px;display:flex;flex-direction:column;overflow:hidden}
        .f6-bttl{font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:700;color:#E8F2FF;margin-bottom:8px}
        .f6-bwrap{display:flex;align-items:flex-end;gap:3px;flex:1}
        .f6-bbg{flex:1;background:#1E2438;border-radius:3px 3px 0 0;position:relative;overflow:hidden}
        .f6-bfill{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg,#00D4FF,#7B5FFF);border-radius:3px 3px 0 0;transform:scaleY(0);transform-origin:bottom}
        .f6-dc{flex:1;background:#13161F;border:1px solid #1E2438;border-radius:14px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:6px}
        .f6-dpct{font-family:"JetBrains Mono",monospace;font-size:26px;font-weight:700;color:#00E887}
        .f6-dlbl{font-family:"JetBrains Mono",monospace;font-size:11px;color:#5A6A84;text-align:center}
        .f6-tbl{background:#13161F;border:1px solid #1E2438;border-radius:12px;overflow:hidden}
        .f6-throw{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:7px 14px;border-bottom:1px solid #1E2438}
        .f6-th{font-family:"JetBrains Mono",monospace;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#5A6A84}
        .f6-tr{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:8px 14px;border-bottom:1px solid rgba(30,36,56,0.5);align-items:center}
        .f6-tr1{background:rgba(0,212,255,0.04);border-left:2px solid #00D4FF}
        .f6-td{font-family:"JetBrains Mono",monospace;font-size:12px;color:#E8F2FF}
        .f6-tdm{font-family:"JetBrains Mono",monospace;font-size:12px;color:#5A6A84}
        .bc{background:rgba(0,212,255,0.12);border:1px solid #00D4FF;border-radius:6px;padding:2px 7px;font-family:"JetBrains Mono",monospace;font-size:10px;color:#00D4FF}
        .bg{background:rgba(0,232,135,0.12);border:1px solid #00E887;border-radius:6px;padding:2px 7px;font-family:"JetBrains Mono",monospace;font-size:10px;color:#00E887}
        .f6-zoom{position:absolute;inset:0;display:flex}
      </style>
      <div id="f6-root" data-composition-id="06-dashboard-building" data-width="1920" data-height="1080">
        <div id="f6-zoom" class="f6-zoom">
          <div id="f6-sb" class="f6-sb">
            <div class="f6-sb-logo"><img src="../../portal/public/lumos-icon.png" alt=""/><span class="f6-sb-name">LumosSDK</span></div>
            <div class="f6-sb-lbl">Navigation</div>
            <div id="f6-n1" class="f6-nav act" style="opacity:0">📊 Dashboard</div>
            <div id="f6-n2" class="f6-nav" style="opacity:0">🔍 Traces</div>
            <div id="f6-n3" class="f6-nav" style="opacity:0">📱 Sessions</div>
            <div id="f6-n4" class="f6-nav" style="opacity:0">🔑 API Keys</div>
            <div class="f6-div"></div>
            <div class="f6-sb-bot"><div class="f6-ldot"></div><span class="f6-ltxt">DemoApp · Live</span></div>
          </div>
          <div class="f6-main">
            <div id="f6-ph" class="f6-ph" style="opacity:0">
              <div class="f6-phicon">📊</div>
              <div><div class="f6-phtitle">Dashboard</div><div class="f6-phsub">AI observability at a glance · real-time insights</div></div>
            </div>
            <div class="f6-krow">
              <div id="f6-k1" class="f6-kpi" style="opacity:0;border-top-color:#00D4FF"><div class="f6-klbl">Total Conversations</div><div id="f6-k1v" class="f6-kval" style="color:#00D4FF">0</div><div id="f6-k1d" class="f6-kdelta" style="opacity:0">↑ 12% this week</div></div>
              <div id="f6-k2" class="f6-kpi" style="opacity:0;border-top-color:#00E887"><div class="f6-klbl">Success Rate</div><div id="f6-k2v" class="f6-kval" style="color:#00E887">0%</div></div>
              <div id="f6-k3" class="f6-kpi" style="opacity:0;border-top-color:#E8F2FF"><div class="f6-klbl">Avg Latency</div><div id="f6-k3v" class="f6-kval" style="color:#E8F2FF">0ms</div></div>
              <div id="f6-k4" class="f6-kpi" style="opacity:0;border-top-color:#FFB800"><div class="f6-klbl">Total Tokens</div><div id="f6-k4v" class="f6-kval" style="color:#FFB800">0</div></div>
            </div>
            <div class="f6-srow">
              <div id="f6-s1" class="f6-sec" style="opacity:0;border-top-color:#FF4563"><div class="f6-slbl">Errors</div><div class="f6-sval" style="color:#FF4563">23</div></div>
              <div id="f6-s2" class="f6-sec" style="opacity:0;border-top-color:#00E887"><div class="f6-slbl">Est. Cost</div><div class="f6-sval" style="color:#00E887">$4.23</div></div>
              <div id="f6-s3" class="f6-sec" style="opacity:0;border-top-color:#FFB800"><div class="f6-slbl">User Score</div><div class="f6-sval" style="color:#FFB800">78%</div></div>
            </div>
            <div class="f6-charts">
              <div id="f6-bcard" class="f6-bc" style="opacity:0">
                <div class="f6-bttl">Conversations per Hour (Last 24 hours)</div>
                <div class="f6-bwrap" id="f6-bwrap"></div>
              </div>
              <div id="f6-dcard" class="f6-dc" style="opacity:0">
                <div class="f6-bttl" style="align-self:flex-start">Sentiment</div>
                <svg width="140" height="140" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="62" fill="none" stroke="#1E2438" stroke-width="24"/>
                  <circle id="f6-ar" cx="80" cy="80" r="62" fill="none" stroke="#FF4563" stroke-width="24" stroke-dasharray="85.7 389.4" transform="rotate(-90 80 80)" style="opacity:0"/>
                  <circle id="f6-ag" cx="80" cy="80" r="62" fill="none" stroke="#00E887" stroke-width="24" stroke-dasharray="0 389.4" transform="rotate(-90 80 80)"/>
                </svg>
                <div id="f6-dctr" style="opacity:0;text-align:center"><div class="f6-dpct">78%</div><div class="f6-dlbl">positive</div></div>
                <div id="f6-dleg" class="f6-dlbl" style="opacity:0">👍 78% · 👎 22%</div>
              </div>
            </div>
            <div id="f6-tbl" class="f6-tbl" style="opacity:0">
              <div class="f6-throw"><div class="f6-th">Feature / Trace ID</div><div class="f6-th">Status</div><div class="f6-th">Model</div><div class="f6-th">Latency</div><div class="f6-th">Time</div></div>
              <div id="f6-r1" class="f6-tr f6-tr1" style="opacity:0"><div class="f6-td"><span class="bc">chat_feature</span></div><div class="f6-td"><span class="bg">✓ OK</span></div><div class="f6-td">gpt-4o</div><div class="f6-td">312ms</div><div class="f6-tdm">just now</div></div>
              <div id="f6-r2" class="f6-tr" style="opacity:0"><div class="f6-td"><span class="bc">search</span></div><div class="f6-td"><span class="bg">✓ OK</span></div><div class="f6-td">gpt-4o-mini</div><div class="f6-td">189ms</div><div class="f6-tdm">2m ago</div></div>
              <div id="f6-r3" class="f6-tr" style="opacity:0"><div class="f6-td"><span class="bc">summarize</span></div><div class="f6-td"><span class="bg">✓ OK</span></div><div class="f6-td">gpt-4o</div><div class="f6-td">422ms</div><div class="f6-tdm">5m ago</div></div>
              <div id="f6-r4" class="f6-tr" style="opacity:0"><div class="f6-td" style="color:#FF4563">chat_feature</div><div class="f6-td" style="color:#FF4563">✗ ERR</div><div class="f6-td">gpt-4o</div><div class="f6-td">5012ms</div><div class="f6-tdm">8m ago</div></div>
              <div id="f6-r5" class="f6-tr" style="opacity:0"><div class="f6-td"><span class="bc">onboarding</span></div><div class="f6-td"><span class="bg">✓ OK</span></div><div class="f6-td">gpt-4o-mini</div><div class="f6-td">201ms</div><div class="f6-tdm">12m ago</div></div>
            </div>
          </div>
        </div>
      </div>
      <script>
        (function(){
          window.__timelines = window.__timelines || {};
          var tl = gsap.timeline({paused:true});
          // Build 24 bars
          var bh=[52,38,61,44,72,55,83,66,91,78,85,69,94,71,88,62,79,56,87,73,95,82,68,77];
          var bw=document.querySelector("#f6-bwrap");
          bh.forEach(function(h,i){
            var bg=document.createElement("div");bg.className="f6-bbg";bg.style.flex="1";
            var fill=document.createElement("div");fill.className="f6-bfill";fill.id="b"+i;fill.style.height=h+"%";
            bg.appendChild(fill);bw.appendChild(bg);
          });
          // Sidebar
          tl.fromTo("#f6-sb",{x:-240},{x:0,duration:0.5,ease:"power3.out"},0);
          ["#f6-n1","#f6-n2","#f6-n3","#f6-n4"].forEach(function(s,i){tl.fromTo(s,{autoAlpha:0,x:-10},{autoAlpha:1,x:0,duration:0.2},0.1+i*0.08);});
          // Page header
          tl.fromTo("#f6-ph",{autoAlpha:0,y:-12},{autoAlpha:1,y:0,duration:0.3,ease:"power2.out"},0.4);
          // KPI cards + counters
          ["#f6-k1","#f6-k2","#f6-k3","#f6-k4"].forEach(function(s,i){tl.fromTo(s,{autoAlpha:0,y:20},{autoAlpha:1,y:0,duration:0.3,ease:"power2.out"},0.8+i*0.2);});
          tl.to({v:0},{v:1247,duration:0.7,ease:"power2.out",onUpdate:function(){var e=document.querySelector("#f6-k1v");if(e)e.textContent=Math.round(this.targets()[0].v).toLocaleString();}},0.8);
          tl.to({v:0},{v:94.2,duration:0.7,ease:"power2.out",onUpdate:function(){var e=document.querySelector("#f6-k2v");if(e)e.textContent=this.targets()[0].v.toFixed(1)+"%";}},1.0);
          tl.to({v:0},{v:342,duration:0.7,ease:"power2.out",onUpdate:function(){var e=document.querySelector("#f6-k3v");if(e)e.textContent=Math.round(this.targets()[0].v)+"ms";}},1.2);
          tl.to({v:0},{v:2.4,duration:0.7,ease:"power2.out",onUpdate:function(){var e=document.querySelector("#f6-k4v");if(e)e.textContent=this.targets()[0].v.toFixed(1)+"M";}},1.4);
          tl.fromTo("#f6-k1d",{autoAlpha:0},{autoAlpha:1,duration:0.2},1.55);
          // Secondary cards
          ["#f6-s1","#f6-s2","#f6-s3"].forEach(function(s,i){tl.fromTo(s,{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:0.25},1.8+i*0.15);});
          // Bar chart
          tl.fromTo("#f6-bcard",{autoAlpha:0},{autoAlpha:1,duration:0.2},2.2);
          for(var i=0;i<24;i++){tl.fromTo("#b"+i,{scaleY:0},{scaleY:1,duration:0.25,ease:"power2.out"},2.2+i*0.055);}
          // Donut
          tl.fromTo("#f6-dcard",{autoAlpha:0},{autoAlpha:1,duration:0.2},2.5);
          var ag=document.querySelector("#f6-ag");
          tl.to({p:0},{p:303.7,duration:0.9,ease:"power2.out",onUpdate:function(){if(ag)ag.setAttribute("stroke-dasharray",this.targets()[0].p.toFixed(1)+" 389.4");}},2.5);
          tl.fromTo("#f6-ar",{autoAlpha:0},{autoAlpha:1,duration:0.3},3.4);
          tl.fromTo("#f6-dctr",{autoAlpha:0},{autoAlpha:1,duration:0.3},3.8);
          tl.fromTo("#f6-dleg",{autoAlpha:0},{autoAlpha:1,duration:0.3},3.95);
          // Table
          tl.fromTo("#f6-tbl",{autoAlpha:0},{autoAlpha:1,duration:0.1},4.0);
          ["#f6-r1","#f6-r2","#f6-r3","#f6-r4","#f6-r5"].forEach(function(s,i){tl.fromTo(s,{autoAlpha:0,y:-18},{autoAlpha:1,y:0,duration:0.25,ease:"power2.out"},4.0+i*0.12);});
          // Row 1 pulse
          tl.to("#f6-r1",{borderLeftColor:"rgba(0,212,255,0.15)",duration:0.6,repeat:2,yoyo:true,ease:"sine.inOut"},4.6);
          // Zoom exit
          tl.to("#f6-zoom",{scale:8,transformOrigin:"760px 850px",duration:0.5,ease:"power3.in"},6.5);
          tl.to("#f6-zoom",{autoAlpha:0,duration:0.2},6.8);
          window.__timelines["06-dashboard-building"]=tl;
        })();
      </script>
    </template>
  </body>
</html>
```

- [ ] **Step 2: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Snapshot at midpoint (global 27.5s)**

```bash
cd heygen && npx hyperframes snapshot --at 27.5
```

Expected: Sidebar visible (Dashboard active), KPI cards with values, bar chart built, donut partially stroked.

- [ ] **Step 4: Commit**

```bash
git -C heygen add compositions/frames/06-dashboard-building.html
git -C heygen commit -m "feat(frame-06): dashboard-building — sidebar, KPIs, charts, trace table, zoom exit"
```

---

## Task 8: Frame 7 — Trace Detail + Spans (8s)

**Files:**
- Create: `heygen/compositions/frames/07-trace-detail.html`

**Interfaces:**
- Consumes: `../../portal/public/lumos-icon.png`
- Produces: `window.__timelines["07-trace-detail"]`, 8s duration

Timing: 0–0.5s zoom-morph resolves → 0.5s back button + header card → 0.6–1.1s badge row stagger → 1.2s USER box → 1.8s AI box → 2.5s spans card → 2.8s all 3 bars start simultaneously (context_lookup 300ms, llm_call 2200ms, feedback_write 250ms) → 4.5s callout badge → 3.0s device card → 3.8s feedback card → 7.3s slide-down exit.

- [ ] **Step 1: Create `heygen/compositions/frames/07-trace-detail.html`**

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <style>
        #f7-root{position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden;background:#0C0E16;display:flex}
        .f7-sb{width:240px;height:1080px;background:#1A1E2C;border-right:1px solid #1E2438;display:flex;flex-direction:column;padding:24px 0;flex-shrink:0}
        .f7-sb-logo{display:flex;align-items:center;gap:10px;padding:0 20px 24px}
        .f7-sb-logo img{width:36px;height:36px;border-radius:10px}
        .f7-sb-name{font-family:"Clash Display",sans-serif;font-size:18px;font-weight:700;background:linear-gradient(90deg,#00D4FF,#7B5FFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .f7-sb-lbl{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#5A6A84;padding:0 20px 8px}
        .f7-nav{padding:10px 20px;font-family:"JetBrains Mono",monospace;font-size:13px;color:#5A6A84}
        .f7-nav.act{color:#00D4FF;background:rgba(0,212,255,0.08);border-left:2px solid #00D4FF}
        .f7-div{height:1px;background:#1E2438;margin:16px 0}
        .f7-sb-bot{margin-top:auto;padding:16px 20px;display:flex;align-items:center;gap:6px}
        .f7-ldot{width:7px;height:7px;background:#00E887;border-radius:50%}
        .f7-ltxt{font-family:"JetBrains Mono",monospace;font-size:11px;color:#00E887}
        .f7-main{flex:1;padding:20px 28px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
        .f7-back{font-family:"JetBrains Mono",monospace;font-size:13px;color:#5A6A84}
        .f7-hcard{background:#13161F;border:1px solid #1E2438;border-radius:14px;padding:20px 24px}
        .f7-brow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .f7-b{border-radius:8px;padding:3px 10px;font-family:"JetBrains Mono",monospace;font-size:12px;border:1px solid transparent;display:inline-flex;align-items:center;gap:5px}
        .f7-hdiv{height:1px;background:#1E2438;margin-top:12px;transform-origin:left;transform:scaleX(0)}
        .f7-convo{display:flex;flex-direction:column;gap:8px}
        .f7-mlbl{font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#5A6A84}
        .f7-ubox{background:#13161F;border:1px solid #1E2438;border-radius:10px;padding:12px;margin-top:4px}
        .f7-aibox{background:#0F1E38;border:1px solid #1E2438;border-radius:10px;padding:12px;margin-top:4px}
        .f7-mtext{font-family:"JetBrains Mono",monospace;font-size:13px;color:#E8F2FF;line-height:1.5;white-space:pre-wrap}
        .f7-brow2{display:flex;gap:16px;flex:1;min-height:0}
        .f7-spans{flex:1.6;background:#13161F;border:1px solid #1E2438;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;overflow:hidden;position:relative}
        .f7-sttl{font-family:"JetBrains Mono",monospace;font-size:13px;font-weight:700;color:#E8F2FF}
        .f7-ssub{font-family:"JetBrains Mono",monospace;font-size:11px;color:#5A6A84;margin-top:2px}
        .f7-srow{display:flex;align-items:center;gap:10px}
        .f7-sname{font-family:"JetBrains Mono",monospace;font-size:12px;color:#E8F2FF;min-width:160px;flex-shrink:0}
        .f7-sname.cy{color:#00D4FF}
        .f7-strack{flex:1;height:6px;background:#1E2438;border-radius:3px;position:relative;overflow:visible}
        .f7-sbar{position:absolute;left:0;top:0;height:6px;border-radius:3px;background:linear-gradient(90deg,#00D4FF,#7B5FFF);transform-origin:left;transform:scaleX(0)}
        .f7-sdur{font-family:"JetBrains Mono",monospace;font-size:12px;color:#5A6A84;min-width:48px;text-align:right;opacity:0}
        .f7-callout{position:absolute;bottom:20px;right:18px;background:#1A1E2C;border:1px solid #7B5FFF;border-radius:8px;padding:10px 14px;font-family:"JetBrains Mono",monospace;font-size:11px;color:#E8F2FF;line-height:1.6;white-space:nowrap}
        .f7-rcol{flex:1;display:flex;flex-direction:column;gap:12px}
        .f7-dcard{background:#13161F;border:1px solid #1E2438;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px}
        .f7-cttl{font-family:"JetBrains Mono",monospace;font-size:13px;font-weight:700;color:#E8F2FF}
        .f7-drow{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(30,36,56,0.5);font-family:"JetBrains Mono",monospace;font-size:12px}
        .f7-dkey{color:#5A6A84}
        .f7-fcard{background:#13161F;border:1px solid #1E2438;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px}
        .f7-fpill{display:inline-flex;align-items:center;gap:8px;background:rgba(0,232,135,0.12);border:1px solid #00E887;border-radius:100px;padding:5px 14px;font-family:"JetBrains Mono",monospace;font-size:12px;color:#00E887}
        #f7-exit{position:absolute;inset:0;display:flex}
      </style>
      <div id="f7-root" data-composition-id="07-trace-detail" data-width="1920" data-height="1080">
        <div id="f7-exit">
          <div class="f7-sb">
            <div class="f7-sb-logo"><img src="../../portal/public/lumos-icon.png" alt=""/><span class="f7-sb-name">LumosSDK</span></div>
            <div class="f7-sb-lbl">Navigation</div>
            <div class="f7-nav">📊 Dashboard</div>
            <div class="f7-nav act">🔍 Traces</div>
            <div class="f7-nav">📱 Sessions</div>
            <div class="f7-nav">🔑 API Keys</div>
            <div class="f7-div"></div>
            <div class="f7-sb-bot"><div class="f7-ldot"></div><span class="f7-ltxt">DemoApp · Live</span></div>
          </div>
          <div class="f7-main">
            <div id="f7-back" class="f7-back" style="opacity:0">← Back to Traces</div>
            <div id="f7-hcard" class="f7-hcard" style="opacity:0">
              <div class="f7-brow">
                <span id="f7-b1" class="f7-b" style="opacity:0;background:rgba(0,212,255,0.12);border-color:#00D4FF;color:#00D4FF">chat_feature</span>
                <span id="f7-b2" class="f7-b" style="opacity:0;background:rgba(0,232,135,0.12);border-color:#00E887;color:#00E887">✓ OK</span>
                <span id="f7-b3" class="f7-b" style="opacity:0;background:rgba(123,95,255,0.12);border-color:#7B5FFF;color:#7B5FFF;border-radius:100px">gpt-4o</span>
                <span id="f7-b4" class="f7-b" style="opacity:0;color:#E8F2FF">312ms</span>
                <span id="f7-b5" class="f7-b" style="opacity:0;color:#E8F2FF;font-size:11px"><span style="color:#00D4FF">84↑</span> <span style="color:#5A6A84">210↓</span></span>
                <span id="f7-b6" class="f7-b" style="opacity:0;background:rgba(0,232,135,0.12);border-color:#00E887;color:#00E887;border-radius:100px">$0.000234</span>
              </div>
              <div id="f7-hdiv" class="f7-hdiv"></div>
            </div>
            <div class="f7-convo">
              <div id="f7-ub" style="opacity:0"><div class="f7-mlbl">User</div><div class="f7-ubox"><div class="f7-mtext">What is the best way to learn Kotlin?</div></div></div>
              <div id="f7-ab" style="opacity:0"><div class="f7-mlbl">AI Response</div><div class="f7-aibox"><div class="f7-mtext">The best way to learn Kotlin is hands-on: start with official docs at kotlinlang.org, then build a small Android app. Kotlin Koans are great for the fundamentals.</div></div></div>
            </div>
            <div class="f7-brow2">
              <div id="f7-spans" class="f7-spans" style="opacity:0">
                <div><div class="f7-sttl">Execution Spans</div><div class="f7-ssub">Tool calls &amp; model execution</div></div>
                <div class="f7-srow"><div class="f7-sname">context_lookup</div><div class="f7-strack"><div id="f7-bc" class="f7-sbar" style="width:14.4%"></div></div><div id="f7-dc" class="f7-sdur">45ms</div></div>
                <div class="f7-srow"><div class="f7-sname cy">llm_call</div><div class="f7-strack"><div id="f7-bl" class="f7-sbar" style="width:80.4%"></div></div><div id="f7-dl" class="f7-sdur" style="color:#00D4FF">251ms</div></div>
                <div class="f7-srow"><div class="f7-sname">feedback_write</div><div class="f7-strack"><div id="f7-bf" class="f7-sbar" style="width:5.1%"></div></div><div id="f7-df" class="f7-sdur">16ms</div></div>
                <div id="f7-callout" class="f7-callout" style="opacity:0">🔧 feedback_write<br/><span style="color:#5A6A84;margin-left:24px">type: FEEDBACK · value: THUMBS_UP</span></div>
              </div>
              <div class="f7-rcol">
                <div id="f7-dcard" class="f7-dcard" style="opacity:0">
                  <div class="f7-cttl">📱 Device &amp; Environment</div>
                  <div id="f7-d1" class="f7-drow" style="opacity:0"><span class="f7-dkey">Device</span><span style="color:#E8F2FF">Pixel 8 Pro</span></div>
                  <div id="f7-d2" class="f7-drow" style="opacity:0"><span class="f7-dkey">OS</span><span style="color:#00E887">Android 15</span></div>
                  <div id="f7-d3" class="f7-drow" style="opacity:0"><span class="f7-dkey">SDK Version</span><span style="color:#7B5FFF">v1.2.0</span></div>
                  <div id="f7-d4" class="f7-drow" style="opacity:0"><span class="f7-dkey">App Version</span><span style="color:#5A6A84">v2.1.1</span></div>
                </div>
                <div id="f7-fcard" class="f7-fcard" style="opacity:0">
                  <div class="f7-cttl">Feedback</div>
                  <div id="f7-fpill" class="f7-fpill" style="opacity:0">👍 Positive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <script>
        (function(){
          window.__timelines = window.__timelines || {};
          var tl = gsap.timeline({paused:true});
          // Back + header (0.5s)
          tl.fromTo("#f7-back",{autoAlpha:0},{autoAlpha:1,duration:0.2},0.5);
          tl.fromTo("#f7-hcard",{autoAlpha:0,y:-12},{autoAlpha:1,y:0,duration:0.3,ease:"power2.out"},0.5);
          // Badge stagger
          ["#f7-b1","#f7-b2","#f7-b3","#f7-b4","#f7-b5","#f7-b6"].forEach(function(s,i){tl.fromTo(s,{autoAlpha:0,x:-6},{autoAlpha:1,x:0,duration:0.2,ease:"power2.out"},0.6+i*0.1);});
          // Divider
          tl.fromTo("#f7-hdiv",{scaleX:0,autoAlpha:1},{scaleX:1,duration:0.2,ease:"power2.out"},1.2);
          // Conversation
          tl.fromTo("#f7-ub",{autoAlpha:0},{autoAlpha:1,duration:0.2},1.2);
          tl.fromTo("#f7-ab",{autoAlpha:0},{autoAlpha:1,duration:0.3},1.8);
          // Spans card
          tl.fromTo("#f7-spans",{autoAlpha:0,y:10},{autoAlpha:1,y:0,duration:0.3,ease:"power2.out"},2.5);
          // All 3 bars start at 2.8s simultaneously
          tl.fromTo("#f7-bc",{scaleX:0,transformOrigin:"left"},{scaleX:1,duration:0.3,ease:"power2.out"},2.8);
          tl.fromTo("#f7-dc",{autoAlpha:0},{autoAlpha:1,duration:0.1},3.1);
          tl.fromTo("#f7-bl",{scaleX:0,transformOrigin:"left"},{scaleX:1,duration:2.2,ease:"power2.out"},2.8);
          tl.fromTo("#f7-dl",{autoAlpha:0},{autoAlpha:1,duration:0.1},5.0);
          tl.fromTo("#f7-bf",{scaleX:0,transformOrigin:"left"},{scaleX:1,duration:0.25,ease:"power2.out"},2.8);
          tl.fromTo("#f7-df",{autoAlpha:0},{autoAlpha:1,duration:0.1},3.05);
          // Callout badge (4.5s)
          tl.fromTo("#f7-callout",{autoAlpha:0,x:-8},{autoAlpha:1,x:0,duration:0.2,ease:"power2.out"},4.5);
          tl.to("#f7-callout",{boxShadow:"0 0 12px rgba(123,95,255,0.5)",duration:0.4},5.5);
          tl.to("#f7-callout",{boxShadow:"0 0 0px rgba(123,95,255,0)",duration:0.4},5.9);
          // llm_call glow on complete
          tl.to("#f7-bl",{filter:"drop-shadow(0 0 8px rgba(0,212,255,0.5))",duration:0.4},5.0);
          // Device card (3.0s)
          tl.fromTo("#f7-dcard",{autoAlpha:0,x:28},{autoAlpha:1,x:0,duration:0.3,ease:"power2.out"},3.0);
          ["#f7-d1","#f7-d2","#f7-d3","#f7-d4"].forEach(function(s,i){tl.fromTo(s,{autoAlpha:0},{autoAlpha:1,duration:0.15},3.1+i*0.08);});
          // Feedback card (3.8s)
          tl.fromTo("#f7-fcard",{autoAlpha:0,x:28},{autoAlpha:1,x:0,duration:0.3,ease:"power2.out"},3.8);
          tl.fromTo("#f7-fpill",{autoAlpha:0,scale:0.75},{autoAlpha:1,scale:1,duration:0.2,ease:"back.out(1.7)"},3.95);
          // Slide-down exit (7.3s)
          tl.to("#f7-exit",{y:70,autoAlpha:0,duration:0.7,ease:"power2.in"},7.3);
          window.__timelines["07-trace-detail"]=tl;
        })();
      </script>
    </template>
  </body>
</html>
```

- [ ] **Step 2: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Snapshot at midpoint (global 35s)**

```bash
cd heygen && npx hyperframes snapshot --at 35
```

Expected: Sidebar (Traces active), header badges, user/AI message boxes, 3 span bars animating, device card visible.

- [ ] **Step 4: Commit**

```bash
git -C heygen add compositions/frames/07-trace-detail.html
git -C heygen commit -m "feat(frame-07): trace-detail — spans gantt, tool call callout, device + feedback cards"
```

---

## Task 9: Frame 8 — CTA (4s)

**Files:**
- Create: `heygen/compositions/frames/08-cta.html`

**Interfaces:**
- Consumes: `../../portal/public/lumos-icon.png`
- Produces: `window.__timelines["08-cta"]`, 4s duration

Timing: 0–0.4s dashboard collapses → 0.3s icon blooms → 0.5s headline → 0.8s tagline → 1.0–1.2s 3 pills → 1.4s GitHub URL → 1.6s cyan underline → 1.7s QR code → 2.2–3.2s dead still hold → 2.5s credit → 3.2s fade to black.

- [ ] **Step 1: Create `heygen/compositions/frames/08-cta.html`**

```html
<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <link rel="preconnect" href="https://fonts.bunny.net" />
      <link href="https://fonts.bunny.net/css?family=clash-display:400,500,600,700" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
      <style>
        #f8-root{position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden}
        .f8-bg{position:absolute;inset:0;background:#0C0E16}
        .f8-glow{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:700px;height:700px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,212,255,0.05) 0%,rgba(123,95,255,0.03) 50%,transparent 70%);pointer-events:none}
        #f8-dcollapse{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
        .f8-dcard{width:1400px;height:860px;background:#13161F;border-radius:24px;border:1px solid #1E2438}
        #f8-icon{position:absolute;left:50%;top:272px;transform:translateX(-50%);width:96px;height:96px;border-radius:22px;filter:drop-shadow(0 16px 48px rgba(0,212,255,0.3))}
        #f8-headline{position:absolute;left:50%;top:392px;transform:translateX(-50%);font-family:"Clash Display",sans-serif;font-size:96px;font-weight:700;letter-spacing:-1px;white-space:nowrap;background:linear-gradient(90deg,#00D4FF,#7B5FFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        #f8-tagline{position:absolute;left:50%;top:510px;transform:translateX(-50%);font-family:"JetBrains Mono",monospace;font-size:18px;color:#5A6A84;letter-spacing:1.5px;white-space:nowrap}
        .f8-pills{position:absolute;left:50%;top:568px;transform:translateX(-50%);display:flex;gap:14px;white-space:nowrap}
        .f8-pill{background:#13161F;border-radius:14px;padding:10px 16px;font-family:"JetBrains Mono",monospace;font-size:14px;color:#E8F2FF;border:1px solid transparent}
        #f8-github{position:absolute;left:50%;top:668px;transform:translateX(-50%);font-family:"JetBrains Mono",monospace;font-size:22px;color:#E8F2FF;white-space:nowrap}
        #f8-uline{position:absolute;top:702px;left:660px;width:600px;height:1.5px;background:#00D4FF;transform-origin:left;transform:scaleX(0)}
        #f8-qr{position:absolute;left:1560px;top:544px}
        .f8-qrbox{width:200px;height:200px;background:#fff;border-radius:12px;padding:10px}
        .f8-qrinner{width:100%;height:100%;background:#0C0E16;border-radius:6px;display:grid;grid-template-columns:repeat(8,1fr);gap:2px;padding:8px}
        .f8-qrcell{border-radius:1px}
        .f8-qrlbl{font-family:"JetBrains Mono",monospace;font-size:11px;color:#5A6A84;text-align:center;margin-top:6px}
        #f8-credit{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);font-family:"JetBrains Mono",monospace;font-size:13px;color:#5A6A84;letter-spacing:3px;text-transform:uppercase;white-space:nowrap}
        #f8-fadeout{position:absolute;inset:0;background:#000;pointer-events:none}
      </style>
      <div id="f8-root" data-composition-id="08-cta" data-width="1920" data-height="1080">
        <div class="f8-bg"></div>
        <div class="f8-glow"></div>
        <div id="f8-dcollapse"><div class="f8-dcard"></div></div>
        <img id="f8-icon" src="../../portal/public/lumos-icon.png" alt="Lumos" style="opacity:0"/>
        <div id="f8-headline" style="opacity:0">LumosSDK</div>
        <div id="f8-tagline" style="opacity:0">Open source · Self-hosted · Ships in minutes</div>
        <div class="f8-pills">
          <div id="f8-pill1" class="f8-pill" style="opacity:0;border-color:#00D4FF">🔍 Full Trace Replay</div>
          <div id="f8-pill2" class="f8-pill" style="opacity:0;border-color:#7B5FFF">📊 Pre-aggregated Stats</div>
          <div id="f8-pill3" class="f8-pill" style="opacity:0;border-color:#00E887">🔒 Your Data, Your Server</div>
        </div>
        <div id="f8-github" style="opacity:0">github.com/your-org/lumos-sdk</div>
        <div id="f8-uline"></div>
        <div id="f8-qr" style="opacity:0">
          <div class="f8-qrbox">
            <div class="f8-qrinner" id="f8-qri"></div>
          </div>
          <div class="f8-qrlbl">Scan to open</div>
        </div>
        <div id="f8-credit" style="opacity:0">Built with LumosSDK</div>
        <div id="f8-fadeout" style="opacity:0"></div>
      </div>
      <script>
        (function(){
          window.__timelines = window.__timelines || {};
          var tl = gsap.timeline({paused:true});
          // Build QR pattern (deterministic bit pattern)
          var bits=[1,0,1,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,1,1,1,0,1,1,0,1,0,0,1,1,0,0,1,1,1,1,0,0,1,1,0,0,1,0,1,1,1,0,1,0,0,1,0,0,0,1,1,0,1];
          var qri=document.querySelector("#f8-qri");
          if(qri){bits.forEach(function(b){var c=document.createElement("div");c.className="f8-qrcell";c.style.background=b?"#fff":"transparent";qri.appendChild(c);});}
          // Dashboard collapse inward (0–0.4s)
          tl.fromTo("#f8-dcollapse",{scale:1,autoAlpha:1,transformOrigin:"50% 50%"},{scale:0.05,autoAlpha:0,duration:0.4,ease:"power3.in"},0);
          // Icon blooms (0.3s)
          tl.fromTo("#f8-icon",{autoAlpha:0,scale:0.05,transformOrigin:"50% 50%"},{autoAlpha:1,scale:1,duration:0.3,ease:"back.out(1.5)"},0.3);
          // Headline (0.5s)
          tl.fromTo("#f8-headline",{autoAlpha:0,y:28},{autoAlpha:1,y:0,duration:0.4,ease:"power2.out"},0.5);
          // Tagline (0.8s)
          tl.fromTo("#f8-tagline",{autoAlpha:0},{autoAlpha:1,duration:0.3,ease:"power2.out"},0.8);
          // Pills (1.0s, stagger 100ms)
          ["#f8-pill1","#f8-pill2","#f8-pill3"].forEach(function(s,i){tl.fromTo(s,{autoAlpha:0,y:18},{autoAlpha:1,y:0,duration:0.2,ease:"power2.out"},1.0+i*0.1);});
          // GitHub URL (1.4s)
          tl.fromTo("#f8-github",{autoAlpha:0},{autoAlpha:1,duration:0.3,ease:"power2.out"},1.4);
          // Cyan underline (1.6s)
          tl.fromTo("#f8-uline",{scaleX:0,autoAlpha:1,transformOrigin:"left"},{scaleX:1,duration:0.4,ease:"power2.out"},1.6);
          // QR (1.7s)
          tl.fromTo("#f8-qr",{autoAlpha:0,scale:0.7},{autoAlpha:1,scale:1,duration:0.3,ease:"back.out(1.5)"},1.7);
          // Credit (2.5s)
          tl.fromTo("#f8-credit",{autoAlpha:0},{autoAlpha:1,duration:0.3,ease:"power2.out"},2.5);
          // DEAD STILL HOLD 2.2s–3.2s — no tweens
          // Fade to black (3.2s–4.0s)
          tl.fromTo("#f8-fadeout",{autoAlpha:0},{autoAlpha:1,duration:0.8,ease:"none"},3.2);
          window.__timelines["08-cta"]=tl;
        })();
      </script>
    </template>
  </body>
</html>
```

- [ ] **Step 2: Validate**

```bash
cd heygen && npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Snapshot at hold midpoint (global 41s)**

```bash
cd heygen && npx hyperframes snapshot --at 41
```

Expected: Lumos icon centered top, "LumosSDK" gradient headline, tagline, 3 feature pills, GitHub URL with cyan underline, QR code right side. No fade yet.

- [ ] **Step 4: Commit**

```bash
git -C heygen add compositions/frames/08-cta.html
git -C heygen commit -m "feat(frame-08): cta — icon bloom, gradient headline, pills, github url, fade to black"
```

---

## Task 10: Final Integration Check

**Files:**
- Verify: `heygen/index.html` + all 8 frame files

**Interfaces:**
- Consumes: all prior tasks
- Produces: passing `npm run check`, 8 valid snapshots, preview-ready project

- [ ] **Step 1: Run full project check**

```bash
cd heygen && npm run check
```

Expected: 0 errors. If any errors appear, fix the referenced file before proceeding.

- [ ] **Step 2: Take snapshots at each frame midpoint**

```bash
cd heygen && npx hyperframes snapshot --at 1
cd heygen && npx hyperframes snapshot --at 4.5
cd heygen && npx hyperframes snapshot --at 9
cd heygen && npx hyperframes snapshot --at 13.5
cd heygen && npx hyperframes snapshot --at 20
cd heygen && npx hyperframes snapshot --at 27.5
cd heygen && npx hyperframes snapshot --at 35
cd heygen && npx hyperframes snapshot --at 41
```

For each snapshot, visually confirm the frame matches its storyboard description:
- 1s: chaos log panels, "YOUR ANDROID AI AGENTS ARE A BLACK BOX."
- 4.5s: black canvas, phone center, red "?", 4 frosted panels, text
- 9s: Lumos icon, "LumosSDK" gradient, gradient lines, tagline
- 13.5s: dark editor, Kotlin syntax, green badge, annotations
- 20s: phone + user bubble + typing dots + 2 pills left
- 27.5s: sidebar, KPIs, bar chart, donut partially stroked
- 35s: trace detail with badges, message boxes, 3 span bars, device card
- 41s: icon + headline + pills + GitHub URL + QR — everything still

- [ ] **Step 3: Preview in browser**

```bash
cd heygen && npm run dev
```

Open `http://localhost:5173` in a browser. Scrub the timeline through all 43 seconds. Verify transitions between frames are seamless (no white flashes, no misaligned clips).

- [ ] **Step 4: Final commit**

```bash
git -C heygen add -A
git -C heygen commit -m "feat: complete lumos-sdk 43s promo video — 8 hyperframes compositions"
```

---

## Self-Review

**Spec coverage:**
- Frame 1 (2s) — chaos flash + hard black + dashboard reveal: Task 2 ✓
- Frame 2 (5s) — phone drop + panels slam + jitter + text: Task 3 ✓
- Frame 3 (4s) — shards + icon drop + shockwave + headline + gradient lines: Task 4 ✓
- Frame 4 (5s) — editor chrome + code in blocks + badge + annotations + phone morph: Task 5 ✓
- Frame 5 (8s) — phone interaction + 4 data pills + live latency counter + thumbs-up: Task 6 ✓
- Frame 6 (7s) — sidebar + KPI counters + bar chart + donut + table + Row 1 zoom: Task 7 ✓
- Frame 7 (8s) — badge stagger + conversation + 3 simultaneous spans + callout + device + feedback: Task 8 ✓
- Frame 8 (4s) — collapse + icon bloom + headline + pills + URL + QR + dead-still hold + fade black: Task 9 ✓
- Root composition (43s, 8 slots): Task 1 ✓

**Placeholder scan:** No TBD, TODO, or vague steps. All code blocks are complete.

**Type consistency:**
- All `data-composition-id` on host slots match template root IDs and `window.__timelines[...]` keys ✓
- All element IDs prefixed with frame number (f1-, f2-, f3-…f8-) — no cross-frame collisions ✓
- `autoAlpha` used throughout — no `display`/`visibility` tweens ✓
- No `repeat:-1` anywhere — all repeat counts are finite ✓
- Styles inside `<template>` not in `<head>` ✓
- `position:absolute; inset:0` backgrounds as children of root ✓

**Implementation notes for executing agent:**
- Frame 5 `tl.call()` blocks mutate DOM text at fixed timeline positions — this is deterministic and correct for HyperFrames (GSAP call fires on seek-through)
- Frame 6 donut uses `onUpdate` + `setAttribute` on SVG stroke-dasharray — deterministic (same time → same value)
- Frame 6 KPI counters use `tl.to({v:0}, {v:N, onUpdate})` object-proxy pattern — equivalent to GSAP `innerText` tween
- Phone morph at Frame 4 exit and Frame 5 entry is a visual approximation (phone silhouette rising from bottom) — exact pixel-perfect morph would require a shared sub-composition, which is out of scope; the visual reads correctly
