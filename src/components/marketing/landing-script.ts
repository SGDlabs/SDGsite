// Behaviour of the landing page, ported line by line from the approved prototype
// (https://claude.ai/artifact/SvwpheWa5bXpWWTwFMuNeg). Keep the numbers as they are: they are the design.
import type LenisClass from "lenis";
import type SDGLogo from "@/lib/brand/sdg-logo";
import { FEED_ICONS, LEAD_SENT_EVENT, PAL, registerSiteTheme, type FeedIcon } from "./brand";

type Engine = typeof SDGLogo;

/** Starts every effect of the landing inside `page` and returns the cleanup. */
export function startLanding(page: HTMLElement, SDGLogo: Engine, Lenis: typeof LenisClass) {
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = page) =>
    r.querySelector(s) as T;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = page) =>
    Array.from(r.querySelectorAll<T>(s));
  // Sections other than the nav, footer and page chrome may be missing (portfolio pages).
  const $opt = <T extends Element = HTMLElement>(s: string, r: ParentNode = page) =>
    r.querySelector<T>(s);
  // Ids are looked up inside this page: a hidden previous page may still be in the DOM.
  const byId = (id: string) => (id ? page.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null);

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  // Everything below registers through these, so the cleanup can undo it all.
  const abort = new AbortController();
  const signal = abort.signal;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };
  const observers: { disconnect(): void }[] = [];
  const watch = <O extends { disconnect(): void }>(observer: O) => {
    observers.push(observer);
    return observer;
  };
  let disposed = false;

  root.classList.add("js");
  if (!reduce) root.classList.add("motion");
  const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  let vh = innerHeight;
  function setPin() {
    root.classList.toggle("pin", !reduce && innerWidth >= 980 && innerHeight >= 600);
  }
  setPin();

  registerSiteTheme(SDGLogo);

  /* ---------- smooth scroll ---------- */
  let lenis: LenisClass | null = null;
  if (!reduce) {
    try {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    } catch {
      lenis = null;
    }
  }
  function goTo(target: number | HTMLElement) {
    if (lenis) lenis.scrollTo(target, { offset: -20 });
    else {
      const y =
        typeof target === "number" ? target : target.getBoundingClientRect().top + scrollY - 20;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
  }
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener(
      "click",
      (e) => {
        const id = a.getAttribute("href") ?? "";
        if (id.length < 2) return;
        const t = byId(id.slice(1));
        if (!t) return;
        e.preventDefault();
        closeMenu();
        goTo(id === "#topo" ? 0 : t);
      },
      { signal },
    );
  });

  /* ---------- nav ---------- */
  const nav = $("#nav");
  let lastY = 0;
  let menuOpen = false;
  const links = $$<HTMLAnchorElement>("#links a");
  const hl = $(".hl");
  const linksBox = $("#links");
  let activeLink: HTMLAnchorElement | null = null;
  function moveHl(a: HTMLAnchorElement | null) {
    if (!a) {
      hl.style.opacity = "0";
      return;
    }
    const r = a.getBoundingClientRect();
    const pr = linksBox.getBoundingClientRect();
    hl.style.left = r.left - pr.left + "px";
    hl.style.width = r.width + "px";
    hl.style.opacity = "1";
  }
  links.forEach((a) => {
    a.addEventListener("mouseenter", () => moveHl(a), { signal });
    a.addEventListener("focus", () => moveHl(a), { signal });
  });
  linksBox.addEventListener("mouseleave", () => moveHl(activeLink), { signal });
  const menuBtn = $<HTMLButtonElement>("#menuBtn");
  const menu = $("#mobileMenu");
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "Menu";
    lenis?.start();
    later(() => {
      if (!menuOpen) menu.hidden = true;
    }, 380);
  }
  menuBtn.addEventListener(
    "click",
    () => {
      if (menuOpen) {
        closeMenu();
        return;
      }
      menuOpen = true;
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("open")));
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.textContent = "Fechar";
      nav.classList.remove("hide");
      lenis?.stop();
    },
    { signal },
  );
  menu.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") {
        closeMenu();
        menuBtn.focus();
      }
    },
    { signal },
  );

  /* ---------- measurement ---------- */
  const fills = $$(".fill-text").map((el) => ({ el, top: 0 }));
  const sectionsForNav = links.map((a) => {
    const href = a.getAttribute("href") ?? "";
    // on other pages the nav points back to the home page, so there is nothing to track
    return { a, el: href.startsWith("#") ? byId(href.slice(1)) : null, top: 0 };
  });
  const proc = $opt("#processo");
  const slides = $$(".pslide");
  const pts = $$(".pt");
  const ptrack = $opt("#ptrack");
  let procTop = 0;
  let procH = 0;
  const device = $opt("#device");
  let devTop = 0;
  const works = $opt("#portfolio");
  const wTrack = $opt("#wTrack");
  const wVp = $opt("#wViewport");
  let wTop = 0;
  let wOver = 0;
  const wIdx = $opt("#wIdx");
  const wBar = $opt("#wBar");
  const mf = $opt("#mf");
  let mfTop = 0;
  let mfH = 0;
  const tube = $("#tube");
  let docH = 1;
  const absTop = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY;
  function measure() {
    if (disposed) return;
    vh = innerHeight;
    setPin();
    const pin = root.classList.contains("pin");
    if (works && wTrack && wVp) {
      if (pin) {
        wTrack.style.transform = "none";
        wOver = Math.max(0, wTrack.offsetWidth - wVp.clientWidth);
        works.style.height = vh + wOver + "px";
      } else {
        works.style.height = "";
        wTrack.style.transform = "";
        wOver = 0;
      }
    }
    fills.forEach((f) => (f.top = absTop(f.el)));
    sectionsForNav.forEach((s) => (s.top = s.el ? absTop(s.el) : 0));
    if (proc) {
      procTop = absTop(proc);
      procH = proc.offsetHeight;
    }
    if (device) devTop = absTop(device);
    if (works) wTop = absTop(works);
    if (mf) {
      mfTop = absTop(mf);
      mfH = mf.offsetHeight;
    }
    docH = document.documentElement.scrollHeight;
    if (!pin) {
      slides.forEach((s) => {
        s.style.transform = "";
        s.style.opacity = "";
        s.style.filter = "";
        s.style.zIndex = "";
        s.inert = false;
      });
    }
    update(scrollY, true);
  }

  /* ---------- scroll-driven updates ---------- */
  let navHidden = false;
  function update(y: number, force: boolean) {
    // nav
    nav.classList.toggle("scrolled", y > 24);
    if (Math.abs(y - lastY) > 6 || force) {
      const hide = y > lastY && y > 480 && !menuOpen;
      if (hide !== navHidden) {
        navHidden = hide;
        nav.classList.toggle("hide", hide);
      }
      lastY = y;
    }
    let cur: HTMLAnchorElement | null = null;
    sectionsForNav.forEach((s) => {
      if (s.el && s.top <= y + vh * 0.45) cur = s.a;
    });
    if (y + vh >= docH - 4) cur = null;
    if (cur !== activeLink) {
      links.forEach((a) => a.classList.toggle("active", a === cur));
      activeLink = cur;
      if (!linksBox.matches(":hover")) moveHl(cur);
    }
    // tube
    tube.style.setProperty("--p", clamp(y / Math.max(1, docH - vh)).toFixed(4));
    // headings fill like liquid
    fills.forEach((f) => {
      const p = reduce ? 1 : clamp((vh * 0.92 - (f.top - y)) / (vh * 0.42));
      f.el.style.setProperty("--p", p.toFixed(3));
    });
    // process slides
    if (proc && root.classList.contains("pin")) {
      const n = slides.length - 1;
      const p = clamp((y - procTop) / Math.max(1, procH - vh)) * n;
      slides.forEach((s, i) => {
        const d = i - p;
        const a = Math.min(Math.abs(d), 1);
        s.style.transform =
          "translate3d(" +
          (d * 64).toFixed(2) +
          "%,0,0) rotateY(" +
          (d * -9).toFixed(2) +
          "deg) scale(" +
          (1 - a * 0.1).toFixed(3) +
          ")";
        s.style.opacity = clamp(1 - Math.abs(d) * (d < 0 ? 1.3 : 0.85)).toFixed(3);
        s.style.filter = a > 0.01 ? "blur(" + (a * 6).toFixed(1) + "px)" : "none";
        s.style.zIndex = String(10 - Math.round(Math.abs(d)));
        s.inert = Math.abs(d) > 0.5;
      });
      const c = Math.round(p);
      pts.forEach((li, i) => {
        li.classList.toggle("done", i < c);
        li.classList.toggle("current", i === c);
      });
      ptrack?.style.setProperty("--fill", (p / n).toFixed(4));
    }
    // client panel tilt
    if (device && !reduce) {
      const dp = clamp((vh * 0.95 - (devTop - y)) / (vh * 0.75));
      device.style.setProperty("--rx", ((1 - dp) * 26).toFixed(2) + "deg");
      device.style.setProperty("--sc", (0.86 + 0.14 * dp).toFixed(4));
      device.style.setProperty("--ty", ((1 - dp) * 30).toFixed(1) + "px");
    }
    // portfolio horizontal
    if (wOver > 0 && wTrack) {
      const wp = clamp((y - wTop) / wOver);
      wTrack.style.transform = "translate3d(" + (-wp * wOver).toFixed(1) + "px,0,0)";
      setWorks(wp);
    }
    // manifesto words
    if (mws.length && !reduce) {
      const mp = clamp((vh * 0.85 - (mfTop - y)) / (mfH + vh * 0.3));
      const on = Math.floor(mp * mws.length + 0.0001);
      mws.forEach((s, i) => {
        const v = i < on;
        if (s.classList.contains("on") !== v) s.classList.toggle("on", v);
      });
    }
  }
  // cards plus the closing call to action (5 in the prototype)
  const worksTotal = wTrack ? wTrack.children.length : 5;
  function setWorks(p: number) {
    if (wIdx) wIdx.textContent = String(1 + Math.round(p * (worksTotal - 1))).padStart(2, "0");
    wBar?.style.setProperty("--wp", p.toFixed(4));
  }
  function syncWorksScroll() {
    if (!wVp || wOver > 0) return;
    const max = wVp.scrollWidth - wVp.clientWidth;
    setWorks(max > 0 ? wVp.scrollLeft / max : 0);
  }
  wVp?.addEventListener("scroll", syncWorksScroll, { passive: true, signal });

  // manifesto: the words are rendered as spans; arming dims the ones not reached yet
  const mws = mf ? $$(".mw", mf) : [];
  mf?.classList.add("armed");

  // process: click a step to jump to it
  pts.forEach((li, i) => {
    li.querySelector("button")?.addEventListener(
      "click",
      () => {
        const n = slides.length - 1;
        goTo(procTop + (procH - vh) * (i / n) + 2);
      },
      { signal },
    );
  });

  /* ---------- hero: pixel field ---------- */
  const field = (() => {
    const found = $opt<HTMLCanvasElement>("#field");
    const hero = $opt(".hero");
    if (!found || !hero) return null;
    const c = found;
    const ctx = c.getContext("2d")!;
    const G = 24;
    let W = 0;
    let H = 0;
    let mx = -9999;
    let my = -9999;
    let sx = -9999;
    let sy = -9999;
    let visible = true;
    const bubbles: { x: number; y: number; v: number; s: number; a: number }[] = [];
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = c.clientWidth;
      H = c.clientHeight;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(0);
    }
    function hash(i: number, j: number) {
      let h = (i * 374761393 + j * 668265263) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    hero.addEventListener(
      "pointermove",
      (e) => {
        const r = c.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
        if (sx < -9000) {
          sx = mx;
          sy = my;
        }
      },
      { passive: true, signal },
    );
    hero.addEventListener(
      "pointerleave",
      () => {
        mx = my = -9999;
      },
      { signal },
    );
    watch(new IntersectionObserver((es) => (visible = es[0]!.isIntersecting))).observe(hero);
    function draw(t: number) {
      if (!visible && !reduce) return;
      ctx.clearRect(0, 0, W, H);
      const on = mx > -9000;
      if (on) {
        sx += (mx - sx) * 0.14;
        sy += (my - sy) * 0.14;
      } else {
        sx = sy = -9999;
      }
      const cols = Math.ceil(W / G);
      const rows = Math.ceil(H / G);
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const cx = i * G + G / 2;
          const cy = j * G + G / 2;
          let f = 0;
          if (on) {
            const d = Math.hypot(cx - sx, cy - sy);
            f = Math.max(0, 1 - d / 240);
            f *= f;
          }
          const tw = reduce ? 0 : Math.sin(t * 0.0011 + hash(i, j) * 80);
          const k = Math.max(f, tw > 0.985 ? ((tw - 0.985) / 0.015) * 0.55 : 0);
          if (k > 0.02) {
            const s = Math.round(2 + k * 8);
            ctx.fillStyle = "rgba(111,168,172," + (0.12 + k * 0.75).toFixed(3) + ")";
            ctx.fillRect(Math.round(cx - s / 2), Math.round(cy - s / 2), s, s);
          } else {
            ctx.fillStyle = "rgba(217,217,217,.07)";
            ctx.fillRect(cx - 1, cy - 1, 2, 2);
          }
        }
      if (!reduce) {
        if (Math.random() < 0.05)
          bubbles.push({
            x: Math.floor(Math.random() * cols) * G + G / 2,
            y: H + 8,
            v: 0.4 + Math.random() * 0.8,
            s: Math.random() < 0.5 ? 4 : 6,
            a: 0.6,
          });
        for (let b = bubbles.length - 1; b >= 0; b--) {
          const o = bubbles[b]!;
          o.y -= o.v;
          o.a -= 0.0016;
          if (o.y < -10 || o.a <= 0) {
            bubbles.splice(b, 1);
            continue;
          }
          ctx.fillStyle = "rgba(111,168,172," + (o.a * 0.55).toFixed(3) + ")";
          ctx.fillRect(Math.round(o.x - o.s / 2), Math.round(o.y / 4) * 4, o.s, o.s);
        }
      }
    }
    size();
    watch(new ResizeObserver(size)).observe(c);
    return { draw };
  })();

  /* ---------- hero: the experiment (logo animation) ---------- */
  // The engine has no destroy(), so each run draws on a fresh copy of the canvas and the original
  // goes back on cleanup: a previous player (React's dev double mount) keeps drawing off-screen.
  const logoCanvas = $opt<HTMLCanvasElement>("#logoCanvas");
  const logoCopy = logoCanvas ? (logoCanvas.cloneNode(false) as HTMLCanvasElement) : null;
  if (logoCanvas && logoCopy) logoCanvas.replaceWith(logoCopy);
  const player = logoCopy ? SDGLogo.mount(logoCopy, { theme: "site", background: false }) : null;
  const benchTime = $opt("#benchTime");
  let benchStart = 0;
  let benchRunning = false;
  function runExperiment() {
    if (!player) return;
    player.play();
    benchStart = performance.now();
    benchRunning = !reduce;
    if (reduce && benchTime) benchTime.textContent = "t = 5,2 s";
  }
  $opt("#replay")?.addEventListener("click", runExperiment, { signal });
  function tickBench(now: number) {
    if (!benchRunning || !benchTime) return;
    const t = Math.min((now - benchStart) / 1000, SDGLogo.T_END / 1000);
    benchTime.textContent = "t = " + t.toFixed(1).replace(".", ",") + " s";
    if (t >= SDGLogo.T_END / 1000) benchRunning = false;
  }

  /* ---------- services: spotlight cards ---------- */
  const bento = $opt("#bento");
  const cards = bento ? $$(".card", bento) : [];
  if (fine && bento)
    bento.addEventListener(
      "pointermove",
      (e) => {
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty("--mx", e.clientX - r.left + "px");
          c.style.setProperty("--my", e.clientY - r.top + "px");
        });
      },
      { signal },
    );

  /* ---------- client panel: live feed ---------- */
  const feed = $opt("#feed");
  const toast = $opt("#toast");
  const toastText = $opt("#toastText");
  let showVisible = false;
  let feedI = 0;
  const NEXT: [string, FeedIcon, string][] = [
    ["Prints do painel administrativo", "print", ""],
    ["Vídeo: notificações no celular", "video", "vid"],
    ["Versão de teste 0.4 publicada", "deploy", ""],
    ["Ajustes na tela de login", "note", ""],
    ["Prints da área de pagamentos", "print", ""],
  ];
  if (device)
    watch(
      new IntersectionObserver((es) => (showVisible = es[0]!.isIntersecting), { threshold: 0.35 }),
    ).observe(device);
  function pushFeed() {
    if (!feed || !toast || !toastText) return;
    if (!showVisible || reduce || document.hidden) return;
    const it = NEXT[feedI++ % NEXT.length]!;
    const li = document.createElement("li");
    li.className = "fi new";
    const ic = document.createElement("span");
    ic.className = "fi-ic";
    ic.innerHTML = FEED_ICONS[it[1]];
    const tx = document.createElement("span");
    tx.className = "fi-tx";
    const st = document.createElement("strong");
    st.textContent = it[0];
    const sm = document.createElement("span");
    sm.textContent = "Desenvolvimento · agora";
    tx.appendChild(st);
    tx.appendChild(sm);
    const th = document.createElement("span");
    th.className = "fi-th" + (it[2] ? " " + it[2] : "");
    li.appendChild(ic);
    li.appendChild(tx);
    li.appendChild(th);
    $$(".fi-tx span", feed).forEach((s, i) => {
      if (i === 0) s.textContent = (s.textContent ?? "").replace("agora", "há 1 min");
    });
    feed.insertBefore(li, feed.firstChild);
    while (feed.children.length > 4) feed.removeChild(feed.lastChild!);
    toastText.textContent = "Nova atualização: " + it[0].charAt(0).toLowerCase() + it[0].slice(1);
    toast.classList.add("show");
    later(() => toast.classList.remove("show"), 2200);
  }
  const feedTimer = feed ? window.setInterval(pushFeed, 3400) : 0;

  /* ---------- portfolio covers (generative pixel art) ---------- */
  function drawCover(c: HTMLCanvasElement, kind: string | null) {
    const W = 64;
    const H = 48;
    c.width = W;
    c.height = H;
    const x = c.getContext("2d")!;
    const px = (i: number, j: number, col: string) => {
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    };
    x.fillStyle = PAL.ground;
    x.fillRect(0, 0, W, H);
    let i: number;
    let j: number;
    if (kind === "dither") {
      const B = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];
      for (j = 0; j < H; j++)
        for (i = 0; i < W; i++) {
          const v = ((i / W) * 0.55 + (j / H) * 0.75) / 1.3;
          const th = (B[j % 4]![i % 4]! + 0.5) / 16;
          px(i, j, v > th ? PAL.yale : v > th * 0.45 ? PAL.teal : PAL.ground);
        }
      for (i = 0; i < 14; i++) px((i * 37) % W, (i * 23) % 18, PAL.dust);
    } else if (kind === "wave") {
      for (i = 0; i < W; i++) {
        const h1 = Math.round(H * 0.42 + Math.sin(i * 0.2) * 5 + Math.sin(i * 0.07) * 4);
        const h2 = Math.round(H * 0.6 + Math.sin(i * 0.26 + 2) * 4);
        const h3 = Math.round(H * 0.8 + Math.sin(i * 0.15 + 4) * 3);
        for (j = h1; j < H; j++) px(i, j, PAL.yale);
        for (j = h2; j < H; j++) px(i, j, PAL.teal);
        px(i, h2, PAL.glow);
        for (j = h3; j < H; j++) px(i, j, PAL.raised);
      }
      for (i = 0; i < 10; i++) px((i * 29 + 5) % W, ((i * 13) % 14) + 3, PAL.glow);
    } else if (kind === "blocks") {
      const cols = [
        [PAL.raised, PAL.ground],
        [PAL.teal, PAL.ground2],
        [PAL.yale, PAL.dust],
        [PAL.dust, PAL.raised],
        [PAL.yale, PAL.ground2],
        [PAL.ground2, PAL.teal],
      ];
      for (let ty = 0; ty < 3; ty++)
        for (let tx = 0; tx < 4; tx++) {
          const n = (tx + ty * 4) % 6;
          const cp = cols[(tx * 2 + ty) % 6]!;
          const shape = n % 5;
          for (j = 0; j < 16; j++)
            for (i = 0; i < 16; i++) {
              const u = i + 0.5;
              const w = j + 0.5;
              let inside: boolean;
              if (shape === 0) inside = u * u + w * w < 256;
              else if (shape === 1) inside = Math.abs(u - 8) + Math.abs(w - 8) < 8;
              else if (shape === 2) inside = (u - 8) * (u - 8) + (w - 8) * (w - 8) < 56;
              else if (shape === 3) inside = Math.abs(u - 8) < w / 2;
              else inside = u < 8;
              px(tx * 16 + i, ty * 16 + j, inside ? cp[0]! : cp[1]!);
            }
        }
    } else if (kind === "rings") {
      const R = [PAL.teal, PAL.ground2, PAL.yale, PAL.ground, PAL.raised, PAL.ground2, PAL.glow];
      for (j = 0; j < H; j++)
        for (i = 0; i < W; i++) {
          const d = Math.max(Math.abs(i - 31.5), Math.abs(j - 23.5));
          px(i, j, R[Math.floor(d / 3.4) % R.length]!);
        }
      const ic = SDGLogo.iconCells("site", false);
      x.fillStyle = PAL.ground;
      x.fillRect(19, 10, 26, 27);
      ic.forEach((p) => px(p.x + 20, p.y + 11, p.c));
    }
  }
  $$<HTMLCanvasElement>("canvas[data-cover]").forEach((c) =>
    drawCover(c, c.getAttribute("data-cover")),
  );

  /* ---------- team: pixel initials ---------- */
  const WORD = SDGLogo.wordCells("site", 0, 0);
  $$<HTMLCanvasElement>("canvas[data-letter]").forEach((c) => {
    const L = c.getAttribute("data-letter");
    const off = L === "D" ? 6 : 12;
    c.width = 9;
    c.height = 11;
    const x = c.getContext("2d")!;
    x.fillStyle = L === "D" ? PAL.yale : PAL.teal;
    x.fillRect(0, 0, 9, 11);
    x.fillStyle = PAL.white;
    WORD.forEach((p) => {
      if (p.x >= off && p.x < off + 5) x.fillRect(p.x - off + 2, p.y + 2, 1, 1);
    });
  });
  if (fine && !reduce)
    $$(".tilt").forEach((el) => {
      el.addEventListener(
        "pointermove",
        (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transition = "transform .15s";
          el.style.transform =
            "rotateX(" +
            (-py * 10).toFixed(2) +
            "deg) rotateY(" +
            (px * 12).toFixed(2) +
            "deg) translateZ(0)";
        },
        { signal },
      );
      el.addEventListener(
        "pointerleave",
        () => {
          el.style.transition = "";
          el.style.transform = "";
        },
        { signal },
      );
    });

  /* ---------- faq ---------- */
  $$<HTMLButtonElement>(".acc-b").forEach((b) => {
    b.addEventListener(
      "click",
      () => {
        const item = b.closest(".acc-i")!;
        const open = !item.classList.contains("open");
        const panel = byId(b.getAttribute("aria-controls") ?? "");
        item.classList.toggle("open", open);
        b.setAttribute("aria-expanded", String(open));
        if (panel) panel.inert = !open;
        later(measure, 520);
      },
      { signal },
    );
  });

  /* ---------- contact form ---------- */
  // Validation and sending live in ContactForm (React Hook Form + Zod + Server Action); a sent
  // lead makes the liquid surge, as in the prototype.
  page.addEventListener(
    LEAD_SENT_EVENT,
    () => {
      liquidBoost = 1.6;
      later(() => (liquidBoost = 0), 1800);
    },
    { signal },
  );

  /* ---------- contact: liquid surface ---------- */
  let liquidBoost = 0;
  const liquid = (() => {
    const found = $opt<HTMLCanvasElement>("#liquid");
    const sec = $opt("#contato");
    if (!found || !sec) return null;
    const c = found;
    const ctx = c.getContext("2d")!;
    const G = 8;
    let W = 0;
    let H = 0;
    let visible = false;
    let level = 0;
    let target = 0;
    const bub: { x: number; y: number; v: number; a: number }[] = [];
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = c.clientWidth;
      H = c.clientHeight;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0, true);
    }
    watch(new IntersectionObserver((es) => (visible = es[0]!.isIntersecting))).observe(sec);
    const sub = $opt("#f-submit");
    sub?.addEventListener("pointerenter", () => (target = 1), { signal });
    sub?.addEventListener("pointerleave", () => (target = 0), { signal });
    function draw(t: number, force = false) {
      if (!force && (!visible || reduce)) return;
      level += (target + liquidBoost - level) * 0.05;
      ctx.clearRect(0, 0, W, H);
      const cols = Math.ceil(W / G) + 1;
      for (let i = 0; i < cols; i++) {
        const x = i * G;
        const b1 =
          H * 0.38 -
          level * 26 +
          Math.sin(i * 0.16 + t * 0.0013) * 10 +
          Math.sin(i * 0.05 - t * 0.0007) * 14;
        const b2 =
          H * 0.56 -
          level * 20 +
          Math.sin(i * 0.21 - t * 0.0016 + 1.3) * 8 +
          Math.sin(i * 0.09 + t * 0.0009) * 10;
        const y1 = Math.round(b1 / G) * G;
        const y2 = Math.round(b2 / G) * G;
        ctx.fillStyle = PAL.yale;
        ctx.fillRect(x, y1, G, H - y1);
        ctx.fillStyle = PAL.teal;
        ctx.fillRect(x, y2, G, H - y2);
        ctx.fillStyle = PAL.glow;
        ctx.fillRect(x, y2, G, G);
      }
      if (!reduce) {
        if (Math.random() < 0.12)
          bub.push({
            x: Math.floor(Math.random() * cols) * G,
            y: H,
            v: 0.5 + Math.random() * 0.9,
            a: 1,
          });
        for (let k = bub.length - 1; k >= 0; k--) {
          const o = bub[k]!;
          o.y -= o.v;
          o.a -= 0.01;
          if (o.a <= 0) {
            bub.splice(k, 1);
            continue;
          }
          ctx.fillStyle = "rgba(111,168,172," + (o.a * 0.8).toFixed(3) + ")";
          ctx.fillRect(o.x + 2, Math.round(o.y / G) * G - 4, 4, 4);
        }
      }
    }
    size();
    watch(new ResizeObserver(size)).observe(c);
    return { draw };
  })();

  /* ---------- footer: the name rises out of the liquid ---------- */
  const big = (() => {
    const found = $opt<HTMLCanvasElement>("#bigword");
    if (!found) return null;
    const c = found;
    const ctx = c.getContext("2d")!;
    let start = -1;
    const cells = SDGLogo.wordCells("site", 1, 1);
    const COLS = 46;
    const ROWS = 10;
    const FINAL_SDG = "#FFFFFF";
    const FINAL_LABS = "#1C1F20";
    const LIQ = "#284B63";
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round((c.width * ROWS) / COLS);
      draw(start < 0 ? (reduce ? 99999 : 0) : performance.now() - start, true);
    }
    const outC = (v: number) => 1 - Math.pow(1 - v, 3);
    function draw(t: number, force = false) {
      if (start < 0 && !force && !reduce) return;
      const cell = c.width / COLS;
      ctx.clearRect(0, 0, c.width, c.height);
      function rect(x: number, y: number, col: string) {
        ctx.fillStyle = col;
        const X = Math.round(x * cell);
        const Y = Math.round(y * cell);
        ctx.fillRect(X, Y, Math.round((x + 1) * cell) - X, Math.round((y + 1) * cell) - Y);
      }
      const front = 1 + 44 * outC(clamp(t / 900));
      const drain = t > 1900 ? 1 + 46 * clamp((t - 1900) / 600) : -1;
      for (let x = 1; x <= Math.floor(front) && x < 45; x++) if (x >= drain) rect(x, 8, LIQ);
      cells.forEach((p) => {
        const ct = ((p.x - 1) / 44) * 900 * 0.85;
        const k = 7 - p.y;
        if (t < ct + k * 45) return;
        const isSDG = p.c === SDGLogo.THEMES.site!.sdg;
        const settled = t >= ct + 8 * 45 + 260;
        rect(p.x, p.y, settled ? (isSDG ? FINAL_SDG : FINAL_LABS) : LIQ);
      });
    }
    if (!reduce)
      watch(
        new IntersectionObserver(
          (es) => {
            if (es[0]!.isIntersecting && start < 0) start = performance.now();
          },
          { threshold: 0.4 },
        ),
      ).observe(c);
    size();
    watch(new ResizeObserver(size)).observe(c);
    return {
      tick(now: number) {
        if (start >= 0) {
          const t = now - start;
          if (t < 3000) draw(t);
        }
      },
    };
  })();

  /* ---------- cursor + magnetic buttons ---------- */
  const cursor = $("#cursor");
  let cx = -100;
  let cy = -100;
  let tx = -100;
  let ty = -100;
  if (fine && !reduce) {
    addEventListener(
      "pointermove",
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        cursor.classList.add("on");
      },
      { passive: true, signal },
    );
    document.addEventListener("pointerleave", () => cursor.classList.remove("on"), { signal });
    document.addEventListener(
      "pointerover",
      (e) => {
        const target = e.target as Element | null;
        cursor.classList.toggle("big", !!target?.closest("a,button,label,input,textarea"));
      },
      { signal },
    );
    $$(".magnetic").forEach((b) => {
      const label = b.firstElementChild as HTMLElement;
      b.addEventListener(
        "pointermove",
        (e) => {
          const r = b.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          b.style.transform =
            "translate(" + (x * 0.16).toFixed(1) + "px," + (y * 0.3).toFixed(1) + "px)";
          label.style.transform =
            "translate(" + (x * 0.08).toFixed(1) + "px," + (y * 0.12).toFixed(1) + "px)";
        },
        { signal },
      );
      b.addEventListener(
        "pointerleave",
        () => {
          b.style.transform = "";
          label.style.transform = "";
        },
        { signal },
      );
    });
  }

  /* ---------- main loop ---------- */
  let lastScroll = -1;
  let frame = 0;
  function loop(now: number) {
    lenis?.raf(now);
    const y = window.scrollY;
    if (y !== lastScroll) {
      lastScroll = y;
      update(y, false);
    }
    if (!reduce) {
      field?.draw(now);
      liquid?.draw(now);
    }
    tickBench(now);
    big?.tick(now);
    if (fine && !reduce) {
      cx = lerp(cx, tx, 0.22);
      cy = lerp(cy, ty, 0.22);
      cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
    }
    frame = requestAnimationFrame(loop);
  }
  let resizeTimer = 0;
  addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    },
    { signal },
  );
  document.fonts?.ready.then(measure);
  addEventListener("load", measure, { signal });
  measure();
  // The browser snaps the unpinned carousel to its first card before this script runs; the
  // prototype caught that scroll event, so read the position once to start from the same place.
  syncWorksScroll();
  runExperiment();
  frame = requestAnimationFrame(loop);

  return () => {
    disposed = true;
    abort.abort();
    cancelAnimationFrame(frame);
    clearInterval(feedTimer);
    clearTimeout(resizeTimer);
    timers.forEach((id) => clearTimeout(id));
    observers.forEach((observer) => observer.disconnect());
    lenis?.destroy();
    if (logoCanvas && logoCopy) logoCopy.replaceWith(logoCanvas);
    mf?.classList.remove("armed");
    root.classList.remove("js", "motion", "pin");
  };
}
