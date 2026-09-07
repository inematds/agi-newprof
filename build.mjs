// ============================================================================
// Gerador de composição HyperFrames — agi-newprof (4 vídeos, 2 formatos).
// Uso: node build.mjs --video principal [--vertical]   (reel1|reel2|reel3 são sempre 9:16)
// Fonte única: scripts/roteiro.json (texto) + <video>/assets/audio/durations.json (timing)
// Camadas: imagem full-bleed (Ken Burns) → clipe Agnes (herói, se existir) → scrim → texto → caption
// ============================================================================
import { writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const VID = arg("--video") || "principal";
const OUT = arg("--out") || VID;          // pasta do projeto HyperFrames (default = nome do vídeo)
const VERT = VID !== "principal" || process.argv.includes("--vertical");
const W = VERT ? 1080 : 1920, H = VERT ? 1920 : 1080;
const R = JSON.parse(readFileSync("scripts/roteiro.json", "utf8"));
const V = R[VID];
const DUR = JSON.parse(readFileSync(`${OUT}/assets/audio/durations.json`, "utf8"));
const FONT_CSS = readFileSync(`${OUT}/assets/fonts/fonts.css`, "utf8").replace(/\.\/fonts\//g, "assets/fonts/");

const LEAD = 0.5, TAIL = 0.9, FADE = 0.45;
const MUSIC = existsSync("musica/bg.mp3") ? "assets/audio/bg.mp3" : null;
const MUSIC_VOL = 0.12;
const CLIP_SEG = 8;                       // duração dos clipes Agnes

// ---------- assets por cena ----------
mkdirSync(`${OUT}/assets/img`, { recursive: true });
mkdirSync(`${OUT}/assets/clips`, { recursive: true });
mkdirSync(`${OUT}/assets/audio`, { recursive: true });
const imgId = (c) => (VID === "principal" ? (VERT ? "pv-" : "p-") + c.img : c.img);
const cenas = V.cenas.map((c, i) => {
  const id = imgId(c);
  const src = `img/${id}.png`;
  if (existsSync(src)) copyFileSync(src, `${OUT}/assets/img/${id}.png`);
  const clip = `clips/${id}.mp4`;
  const hasClip = existsSync(clip);
  if (hasClip) copyFileSync(clip, `${OUT}/assets/clips/${id}.mp4`);
  return { ...c, id, n: i + 1, hasClip };
});
if (MUSIC) copyFileSync("musica/bg.mp3", `${OUT}/assets/audio/bg.mp3`);

// ---------- timing (fonte única = durations.json) ----------
const N = cenas.length + 1; // + CTA
let t = 0;
const S = [];
for (let i = 1; i <= N; i++) {
  const a = DUR[`s${i}`];
  if (a == null) throw new Error(`falta duração de s${i} em ${VID}/assets/audio/durations.json`);
  const dur = LEAD + a + TAIL;
  S.push({ i, start: r(t), dur: r(dur), audioStart: r(t + LEAD), audioDur: r(a), end: r(t + dur) });
  t += dur;
}
const TOTAL = r(t);
function r(n) { return Math.round(n * 1000) / 1000; }
const J = (s) => JSON.stringify(s);

// ---------- vocabulário de movimento ----------
const VM = VERT ? 0.7 : 1, mv = (v) => Math.round(v * VM);
const EASE = { out: "power3.out", soft: "power2.out", back: "back.out(1.6)", expo: "expo.out" };
const M = {
  reveal(sel, at, o = {}) {
    const f = ["opacity:0"];
    if (o.x) f.push(`x:${mv(o.x)}`); if (o.y) f.push(`y:${mv(o.y)}`);
    if (o.scale != null) f.push(`scale:${o.scale}`);
    const extra = o.stagger ? `,stagger:${o.stagger}` : "";
    return `tl.from(${J(sel)},{${f.join(",")},duration:${o.d ?? 0.55},ease:"${o.ease ?? EASE.out}"${extra}},${at});`;
  },
  sweep(sel, at, o = {}) { return `tl.fromTo(${J(sel)},{scaleX:0},{scaleX:1,duration:${o.d ?? 0.7},ease:"${EASE.expo}",transformOrigin:"left center"},${at});`; },
  glow(sel, at, o = {}) { return `tl.fromTo(${J(sel)},{filter:"drop-shadow(0 0 0px rgba(255,195,0,0))"},{filter:"drop-shadow(0 0 ${o.blur ?? 26}px rgba(255,195,0,.55))",duration:1.1,repeat:${o.times ?? 4},yoyo:true,ease:"sine.inOut"},${at});`; },
  float(sel, at) { return `tl.to(${J(sel)},{y:"-=${mv(8)}",duration:1.8,repeat:3,yoyo:true,ease:"sine.inOut"},${at});`; },
  countUp(sel, at, to, o = {}) { return `tl.to({v:${o.from ?? 0}},{v:${to},duration:${o.d ?? 1.4},ease:"${EASE.soft}",onUpdate(){var e=document.querySelector(${J(sel)});if(e)e.textContent=Math.round(this.targets()[0].v)+${J(o.suffix ?? "")};}},${at});`; },
};

// ---------- HTML por cena ----------
function conteudo(c, p) {
  const k = c.kicker ? `<div class="kicker" id="${p}-k"><span class="dot"></span>${c.kicker}</div>` : "";
  const num = c.num ? `<div class="bignum" id="${p}-num">${c.num}</div>` : "";
  const h = c.tela ? `<h2 class="h2" id="${p}-h">${c.tela}</h2>` : "";
  const lista = c.lista ? `<ul class="lista">${c.lista.map((it, j) => `<li id="${p}-l${j}"><span class="bdot"></span>${it}</li>`).join("")}</ul>` : "";
  const stat = c.stat ? `<div class="stat" id="${p}-stat"><span class="stat-n" id="${p}-sn">0</span><span class="stat-l">${c.stat.label}</span></div>` : "";
  return `<div class="rule" id="${p}-rule"></div>${k}${num}${h}${lista}${stat}`;
}
function anim(c, at, p) {
  const L = [];
  L.push(M.sweep(`#${p}-rule`, at(0.25)));
  if (c.kicker) L.push(M.reveal(`#${p}-k`, at(0.35), { y: -18, d: .5, ease: EASE.soft }));
  if (c.num) L.push(M.reveal(`#${p}-num`, at(0.3), { scale: .5, d: .7, ease: EASE.back }), M.glow(`#${p}-num`, at(1.0)));
  if (c.tela) L.push(M.reveal(`#${p}-h`, at(0.55), { y: 40, d: .75, ease: "power4.out" }));
  if (c.lista) L.push(M.reveal(c.lista.map((_, j) => `#${p}-l${j}`), at(1.0), { x: -30, d: .5, stagger: .32, ease: EASE.soft }));
  if (c.stat) L.push(M.reveal(`#${p}-stat`, at(1.6), { y: 24, d: .6, ease: EASE.back }), M.countUp(`#${p}-sn`, at(1.8), c.stat.n, { d: 1.6 }));
  return L;
}
const CTA_HTML = (p) => `
      <div class="cta-eyebrow" id="${p}-eye">CONTINUA EM</div>
      <div class="cta-brand" id="${p}-brand"><span class="b1">INEMA</span><span class="bdotsep">.</span><span class="b2">CLUB</span></div>
      <div class="rule center" id="${p}-rule"></div>
      <div class="cta-url mono" id="${p}-url"><span class="cta-globe">🌐</span>inema.club</div>`;
const CTA_ANIM = (at, p, dur) => [
  M.reveal(`#${p}-eye`, at(0.2), { y: -18, d: .5, ease: EASE.soft }),
  M.reveal(`#${p}-brand`, at(0.5), { scale: .7, d: .7, ease: "back.out(1.7)" }),
  M.sweep(`#${p}-rule`, at(1.1), { d: .6 }),
  M.reveal(`#${p}-url`, at(1.3), { y: 20, d: .55, ease: EASE.soft }),
  // glow não pode ultrapassar o fim da composição (senão o render ganha cauda muda)
  M.glow(`#${p}-brand`, at(1.4), { times: Math.max(1, Math.floor((dur - 1.5) / 1.1) - 1) }),
];

// ---------- emissão ----------
const scenesHTML = S.map((s) => {
  const isCta = s.i === N; const c = cenas[s.i - 1]; const p = `s${s.i}`;
  return `
    <section id="${p}" class="scene clip${isCta ? " cta" : ""}" data-start="${s.start}" data-duration="${s.dur}" data-track-index="${s.i % 2 ? 1 : 3}">
      <div class="scene-inner" id="scene-inner-${s.i}">${isCta ? CTA_HTML(p) : conteudo(c, p)}</div>
    </section>`;
}).join("");

// imagens de fundo: sobrepõem FADE na próxima (tracks 5/6 alternados) → crossfade real
const bgHTML = S.slice(0, -1).map((s) => {
  const c = cenas[s.i - 1];
  const dur = r(s.dur + FADE);
  return `
    <div id="bg${s.i}" class="clip bgwrap" data-start="${s.start}" data-duration="${dur}" data-track-index="${s.i % 2 ? 5 : 6}">
      <img id="bgimg${s.i}" src="assets/img/${c.id}.png" alt="" data-layout-allow-overflow />
    </div>`;
}).join("");
// clipes Agnes (herói): wrapper estático (não-clip) + <video> temporizado; fade no wrapper
const vidHTML = S.slice(0, -1).filter((s) => cenas[s.i - 1].hasClip).map((s) => {
  const c = cenas[s.i - 1]; const d = Math.min(CLIP_SEG, s.dur);
  return `
    <div id="vw${s.i}" class="vidwrap">
      <video id="vid${s.i}" data-start="${s.start}" data-duration="${r(d)}" data-track-index="8" data-media-start="0" data-volume="0" muted playsinline src="assets/clips/${c.id}.mp4"></video>
    </div>`;
}).join("");
const captionsHTML = VERT ? "" : S.slice(0, -1).filter((s) => cenas[s.i - 1].caption).map((s) => `
    <div class="caption clip" id="cap-${s.i}" data-start="${s.start}" data-duration="${s.dur}" data-track-index="${s.i % 2 ? 2 : 4}">${cenas[s.i - 1].caption}</div>`).join("");
const audioHTML = S.map((s) => `
    <audio id="a${s.i}" data-start="${s.audioStart}" data-duration="${s.audioDur}" data-track-index="20" src="assets/audio/s${s.i}.wav"></audio>`).join("");
const musicHTML = MUSIC ? `
    <audio id="bgm" data-start="0" data-duration="${TOTAL}" data-track-index="21" data-volume="${MUSIC_VOL}" src="${MUSIC}"></audio>` : "";

function emitScene(s) {
  const isCta = s.i === N; const c = cenas[s.i - 1]; const p = `s${s.i}`;
  const at = (d) => r(s.start + d); const inner = `#scene-inner-${s.i}`;
  const L = [];
  // texto: fade in/out
  L.push(`tl.fromTo(${J(inner)},{opacity:0},{opacity:1,duration:${FADE},ease:"power2.out"},${s.start});`);
  L.push(`tl.to(${J(inner)},{opacity:0,duration:${FADE},ease:"power2.in"},${r(s.end - FADE)});`);
  L.push(`tl.set(${J(inner)},{opacity:0},${r(s.end)});`);
  if (!isCta) {
    // fundo: crossfade + Ken Burns (zoom lento a cena inteira)
    const img = `#bgimg${s.i}`;
    L.push(`tl.fromTo(${J(img)},{opacity:0},{opacity:1,duration:${FADE},ease:"power2.out"},${s.start});`);
    L.push(`tl.fromTo(${J(img)},{scale:1.04,xPercent:0},{scale:1.14,xPercent:${s.i % 2 ? -1.5 : 1.5},duration:${r(s.dur + FADE)},ease:"sine.inOut"},${s.start});`);
    L.push(`tl.to(${J(img)},{opacity:0,duration:${FADE},ease:"power2.in"},${r(s.end)});`);
    if (c.hasClip) {
      const d = Math.min(CLIP_SEG, s.dur);
      L.push(`tl.set("#vw${s.i}",{opacity:1},${s.start});`);
      L.push(`tl.to("#vw${s.i}",{opacity:0,duration:0.8,ease:"power2.inOut"},${r(s.start + d - 0.8)});`);
      L.push(`tl.set("#vw${s.i}",{opacity:0},${r(s.start + d)});`);
    }
    for (const x of anim(c, at, p)) L.push(x);
    if (!VERT && c.caption) {
      L.push(`tl.fromTo("#cap-${s.i}",{opacity:0,y:14},{opacity:1,y:0,duration:.5,ease:"power2.out"},${at(0.35)});`);
      L.push(`tl.to("#cap-${s.i}",{opacity:0,duration:.4,ease:"power2.in"},${r(s.end - 0.55)});`);
    }
  } else {
    L.push(`tl.fromTo("#tdip",{opacity:0},{opacity:1,duration:${FADE},ease:"power2.in"},${r(s.start - FADE)});`);
    L.push(`tl.to("#tdip",{opacity:0,duration:${FADE},ease:"power2.out"},${r(s.start + 0.05)});`);
    for (const x of CTA_ANIM(at, p, s.dur)) L.push(x);
  }
  return L.join("\n      ");
}
const animJS = S.map(emitScene).join("\n      ");
const TITLE = VERT ? V.title916 : null;

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      ${FONT_CSS}
      :root{--bg:#0D1321;--bg2:#1D2D44;--bg3:#3E5C76;--fg:#F0EBD8;--muted:#748CAB;--accent:#FFC300;--accent2:#FCA311;--code:#2EC4B6}
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
      .mono{font-family:"JetBrains Mono",ui-monospace,monospace}
      #root{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:var(--bg)}
      /* camada 1: imagem full-bleed */
      .bgwrap{position:absolute;inset:0;z-index:2;overflow:hidden}
      .bgwrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;will-change:transform}
      .vidwrap{position:absolute;inset:0;z-index:3;opacity:0;pointer-events:none}
      .vidwrap video{width:100%;height:100%;object-fit:cover}
      /* scrim permanente (legibilidade) */
      #scrim{position:absolute;inset:0;z-index:4;pointer-events:none;
        background:linear-gradient(90deg,rgba(13,19,33,.94) 0%,rgba(13,19,33,.82) 38%,rgba(13,19,33,.30) 70%,rgba(13,19,33,.15) 100%),
                   linear-gradient(180deg,rgba(13,19,33,.25),rgba(13,19,33,0) 30%,rgba(13,19,33,.55) 100%)}
      #grain{position:absolute;inset:0;z-index:5;opacity:.06;mix-blend-mode:overlay;pointer-events:none;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
      #progress{position:absolute;left:0;bottom:0;height:6px;width:100%;transform:scaleX(0);transform-origin:left center;background:linear-gradient(90deg,var(--accent),var(--accent2));z-index:40;box-shadow:0 0 18px rgba(255,195,0,.5)}
      #tdip{position:absolute;inset:0;background:#000;opacity:0;z-index:38;pointer-events:none}
      /* cena (texto) */
      .scene{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;justify-content:center;padding:120px 150px 150px}
      .scene-inner{position:relative;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;opacity:0}
      .scene:not(.cta) .scene-inner{max-width:1040px}
      .rule{height:7px;width:220px;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:6px;margin:0 0 28px;transform:scaleX(0);transform-origin:left center}
      .rule.center{margin:34px auto;width:420px}
      .kicker{display:inline-flex;align-items:center;gap:14px;font-family:"JetBrains Mono",monospace;font-size:24px;letter-spacing:.24em;color:var(--accent);text-transform:uppercase;margin-bottom:26px;font-weight:600}
      .kicker .dot{width:12px;height:12px;border-radius:50%;background:var(--accent);box-shadow:0 0 14px var(--accent);flex:none}
      .h2{font-family:Sora,sans-serif;font-weight:800;font-size:76px;line-height:1.08;letter-spacing:-.02em;text-shadow:0 4px 30px rgba(0,0,0,.7)}
      .h2 b{color:var(--accent)}
      .h2 .dim{color:var(--muted)}
      .h2 .small{display:block;font-family:Inter,sans-serif;font-weight:500;font-size:34px;color:var(--muted);letter-spacing:0;margin-top:22px;line-height:1.3}
      .lista{list-style:none;margin:10px 0 0;display:flex;flex-direction:column;gap:22px}
      .lista li{display:flex;align-items:center;gap:22px;font-family:Sora,sans-serif;font-weight:700;font-size:44px;color:var(--fg);text-shadow:0 3px 20px rgba(0,0,0,.7)}
      .bdot{width:16px;height:16px;flex:none;border-radius:4px;background:var(--accent);box-shadow:0 0 12px var(--accent);transform:rotate(45deg)}
      .stat{display:flex;align-items:baseline;gap:26px;margin-top:40px}
      .stat-n{font-family:Sora,sans-serif;font-weight:800;font-size:150px;line-height:1;color:var(--accent);text-shadow:0 0 40px rgba(255,195,0,.35)}
      .stat-l{font-size:34px;color:var(--fg);max-width:620px;line-height:1.3}
      .bignum{font-family:Sora,sans-serif;font-weight:800;font-size:220px;line-height:.9;color:var(--accent);margin-bottom:18px;text-shadow:0 0 40px rgba(255,195,0,.35)}
      /* CTA */
      .scene.cta{justify-content:center;align-items:center;text-align:center}
      .cta-eyebrow{text-align:center;font-family:"JetBrains Mono",monospace;font-size:26px;letter-spacing:.36em;color:var(--muted);text-transform:uppercase;margin-bottom:30px}
      .cta-brand{text-align:center;font-family:Sora;font-weight:800;font-size:150px;line-height:.95;letter-spacing:-.02em}
      .cta-brand .b1{color:var(--fg)}.cta-brand .b2{color:var(--accent)}.cta-brand .bdotsep{color:var(--accent)}
      .cta-url{display:flex;align-items:center;justify-content:center;gap:16px;font-size:46px;color:var(--muted);margin-top:32px}
      /* caption 16:9 */
      .caption{position:absolute;left:50%;transform:translateX(-50%);bottom:64px;z-index:30;max-width:1500px;text-align:center;font-size:34px;font-weight:600;color:var(--fg);
        background:rgba(10,18,30,.72);border:1px solid var(--bg3);border-radius:14px;padding:16px 38px;backdrop-filter:blur(6px)}
      /* título persistente 9:16 */
      #toptitle{position:absolute;top:0;left:0;right:0;z-index:34;display:none;flex-direction:column;align-items:center;gap:12px;padding:150px 60px 0;pointer-events:none;text-align:center}
      #toptitle .tt-l1{font-family:Sora,sans-serif;font-weight:800;font-size:64px;letter-spacing:.02em;line-height:1;text-transform:uppercase;color:var(--fg);text-shadow:0 4px 26px rgba(0,0,0,.85)}
      #toptitle .tt-l2{font-family:Sora,sans-serif;font-weight:700;font-size:40px;line-height:1.1;color:var(--fg);text-shadow:0 3px 22px rgba(0,0,0,.9)}
      #toptitle b{color:var(--accent)}
      #toptitle .tt-l2::before{content:"";display:block;width:74px;height:5px;margin:0 auto 14px;border-radius:4px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
      body.v #toptitle{display:flex}
      /* ===== 9:16 (safe zones: topo título, miolo mensagem, base ~420px e direita livres) ===== */
      body.v #scrim{background:linear-gradient(180deg,rgba(13,19,33,.80) 0%,rgba(13,19,33,.35) 22%,rgba(13,19,33,.10) 40%,rgba(13,19,33,.72) 62%,rgba(13,19,33,.96) 100%)}
      body.v .scene{padding:0 130px 380px 80px;justify-content:flex-end}
      body.v .scene:not(.cta) .scene-inner{max-width:900px;justify-content:flex-end;height:auto}
      body.v .h2{font-size:64px}
      body.v .h2 .small{font-size:30px}
      body.v .kicker{font-size:20px;margin-bottom:20px}
      body.v .lista li{font-size:36px;gap:18px}
      body.v .lista{gap:16px}
      body.v .stat-n{font-size:120px}
      body.v .stat-l{font-size:28px;max-width:520px}
      body.v .bignum{font-size:170px}
      body.v .scene.cta{padding:0 80px 420px;justify-content:center}
      body.v .cta-brand{font-size:116px}
      body.v .cta-url{font-size:42px}
    </style>
  </head>
  <body class="${VERT ? "v" : ""}">
    <div id="root" data-composition-id="main" data-start="0" data-width="${W}" data-height="${H}">
${bgHTML}
${vidHTML}
      <div id="scrim" data-layout-ignore></div><div id="grain" data-layout-ignore></div>
      ${TITLE ? `<div id="toptitle" data-layout-ignore><span class="tt-l1">${TITLE.l1}</span>${TITLE.l2 ? `<span class="tt-l2">${TITLE.l2}</span>` : ""}</div>` : ""}
${scenesHTML}
${captionsHTML}
      <div id="progress"></div>
      <div id="tdip"></div>
${audioHTML}${musicHTML}
      <script>
        window.__timelines = window.__timelines || {};
        const tl = gsap.timeline({ paused: true });
        const TOTAL = ${TOTAL};
        tl.fromTo("#progress",{scaleX:0},{scaleX:1,duration:TOTAL,ease:"none"},0);
        ${TITLE ? `tl.fromTo("#toptitle",{opacity:0,y:-18},{opacity:1,y:0,duration:.6,ease:"power2.out"},0.35);
        tl.to("#toptitle",{opacity:0,y:-18,duration:.5,ease:"power2.in"},${r(S[N - 1].start - 0.3)});` : ""}
      ${animJS}
        tl.set({}, {}, TOTAL);
        window.__timelines["main"] = tl;
      </script>
    </div>
  </body>
</html>
`;
writeFileSync(`${OUT}/index.html`, html);
console.log(`${OUT}/index.html · ${W}x${H} · TOTAL=${TOTAL}s · ${N} cenas (${N - 1} + CTA) · clipes: ${cenas.filter(c => c.hasClip).map(c => c.id).join(",") || "nenhum"} · música: ${MUSIC ? "sim" : "não"}`);
S.forEach((s) => console.log(`  s${s.i}: ${s.start}→${s.end} (${s.audioDur}s voz)`));
