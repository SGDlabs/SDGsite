/* SDG Labs — pixel flask logo engine.
   Works in the browser (window.SDGLogo) and in Node (module.exports).
   Grid units are "cells"; every drawing is a list of {x, y, c} cells. */
(function (root) {
  'use strict';

  var THEMES = {
    light: { bg: '#FFFFFF', K: '#353535', H: '#284B63', W: '#FFFFFF', L: '#3C6E71', sdg: '#353535', labs: '#3C6E71', floor: '#D9D9D9' },
    dark:  { bg: '#353535', K: '#FFFFFF', H: '#D9D9D9', W: '#353535', L: '#6FA8AC', sdg: '#FFFFFF', labs: '#6FA8AC', floor: '#284B63' }
  };

  // 5x7 pixel font for the wordmark and the letters on the flask
  var FONT = {
    S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
    D: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
    G: [' ####', '#    ', '#    ', '# ###', '#   #', '#   #', ' ####'],
    L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
    A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
    B: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### ']
  };

  function textCells(str, x0, y0, tagFn) {
    var out = [], x = x0;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === ' ') { x += 3; continue; }
      var g = FONT[ch];
      for (var r = 0; r < 7; r++) for (var c = 0; c < 5; c++) {
        if (g[r][c] === '#') out.push({ x: x + c, y: y0 + r, k: 6 - r, tag: tagFn ? tagFn(i) : null });
      }
      x += 6;
    }
    return { cells: out, width: x - x0 - 1 };
  }

  // Flask sprite 24 x 25. K body, H shine, W glass/letters, L liquid
  var SW = 24, SH = 25;
  var SPRITE = (function () {
    var g = [];
    for (var y = 0; y < SH; y++) { g.push([]); for (var x = 0; x < SW; x++) g[y].push('.'); }
    function span(y, a, b, c) { for (var x = a; x <= b; x++) g[y][x] = c; }
    span(0, 7, 16, 'K'); span(1, 7, 16, 'K');
    for (var y2 = 2; y2 <= 7; y2++) { span(y2, 9, 9, 'K'); span(y2, 10, 13, 'W'); span(y2, 14, 14, 'K'); }
    g[4][13] = 'L'; g[5][12] = 'L'; g[5][13] = 'L'; span(6, 10, 12, 'L'); span(7, 10, 13, 'L');
    span(8, 8, 9, 'K'); span(8, 10, 13, 'L'); span(8, 14, 15, 'K');
    span(9, 7, 8, 'K'); span(9, 9, 14, 'L'); span(9, 15, 16, 'K');
    span(10, 6, 17, 'K'); span(11, 5, 18, 'K'); span(12, 4, 19, 'K'); span(13, 3, 20, 'K'); span(14, 2, 21, 'K');
    for (var y3 = 15; y3 <= 22; y3++) span(y3, 1, 22, 'K');
    span(23, 2, 21, 'K'); span(24, 3, 20, 'K');
    g[12][5] = 'H'; g[13][4] = 'H'; g[14][3] = 'H'; g[15][2] = 'H'; g[16][2] = 'H';
    textCells('SDG', 4, 15).cells.forEach(function (p) { g[p.y][p.x] = 'W'; });
    return g;
  })();

  // liquid cells, emptied top-first (nearest the mouth)
  var LIQ = [];
  for (var ly = 0; ly < SH; ly++) for (var lx = SW - 1; lx >= 0; lx--) if (SPRITE[ly][lx] === 'L') LIQ.push(ly * SW + lx);

  // ---------- scene ----------
  var X0 = 3, F = 30, VW = 82, VH = 31;
  var WORD_X = 58, WORD_Y = 22, END_X = 101, PUD_X = 52;
  var WORD = textCells('SDG LABS', WORD_X, WORD_Y, function (i) { return i < 3 ? 'sdg' : 'labs'; });

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  var inC = function (t) { return t * t * t; };
  var outC = function (t) { return 1 - Math.pow(1 - t, 3); };
  var io = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  function theta(t) {
    if (t < 700) return 0;
    if (t < 850) return -6 * outC(seg(t, 700, 850));
    if (t < 1450) return -6 + 96 * inC(seg(t, 850, 1450));
    if (t < 1600) return 90 - 8 * outC(seg(t, 1450, 1600));
    if (t < 1750) return 82 + 8 * inC(seg(t, 1600, 1750));
    return 90;
  }

  function rotPoint(sx, sy, deg) {
    var th = deg * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    var spx = deg < 0 ? 1 : 23, spy = 25;
    var dx = sx - spx, dy = sy - spy;
    return { x: X0 + spx + dx * c - dy * s, y: F + dx * s + dy * c, dirx: s, diry: -c };
  }

  // deterministic droplets
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var DROPS = (function () {
    var r = rng(11), out = [];
    for (var i = 0; i < 80; i++) {
      var t0 = 1340 + i * 16 + r() * 8;
      var th = theta(t0);
      if (th < 50) continue;
      var m = rotPoint(12, 0.4, th);
      var sp = 8 + 4 * r();
      var d = { t0: t0, mx: m.x, my: m.y + (r() - 0.5) * 2.5, vx: m.dirx * sp, vy: m.diry * sp + 1.5 };
      // landing time (y reaches row F-1)
      var a = 40, b = d.vy, c = d.my - (F - 1);
      d.land = d.t0 + 1000 * ((-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a));
      d.lx = d.mx + d.vx * (d.land - d.t0) / 1000;
      out.push(d);
    }
    return out;
  })();
  var T_LAND = DROPS[0].land, LX = Math.floor(DROPS[0].lx);
  var FRONT_MS = 1300;
  function frontAt(t) { return LX + (END_X - LX) * outC(seg(t, T_LAND, T_LAND + FRONT_MS)); }
  function colTime(x) {
    if (x <= LX) return T_LAND;
    var s = (x - LX) / (END_X - LX);
    return T_LAND + FRONT_MS * (1 - Math.pow(1 - s, 1 / 3));
  }
  var T_END = 5200;

  function viewX(t) { return Math.round(-26 + 48 * io(seg(t, 1000, 3200))); }

  // returns {cells:[{x,y,c}], vx, floorAlpha}
  function frame(t, themeName) {
    var th = THEMES[themeName || 'light'];
    var cells = [];
    function put(x, y, c) { cells.push({ x: x, y: y, c: c }); }

    // puddle
    if (t >= T_LAND) {
      var left = Math.max(PUD_X, LX - 4 * seg(t, T_LAND, T_LAND + 300));
      var front = frontAt(t);
      var drain = t > 3300 ? PUD_X + (END_X + 2 - PUD_X) * inC(seg(t, 3300, 4000)) : -1;
      for (var x = Math.round(left); x <= Math.floor(front); x++) if (x >= drain) put(x, F - 1, th.L);
      if (t < 2700) for (var px = LX - 1; px <= LX + 2; px++) if (px >= PUD_X) put(px, F - 2, th.L);
      if (t < T_LAND + FRONT_MS && Math.floor(front) > LX + 2) put(Math.floor(front), F - 2, th.L);
    }

    // wordmark rising out of the liquid
    WORD.cells.forEach(function (p) {
      var ct = colTime(p.x);
      if (t < ct + p.k * 45) return;
      var settled = t >= ct + 7 * 45 + 300;
      put(p.x, p.y, p.tag === 'sdg' ? (settled ? th.sdg : th.L) : th.labs);
    });

    // droplets
    DROPS.forEach(function (d) {
      if (t < d.t0 || t >= d.land) return;
      var tau = (t - d.t0) / 1000;
      put(Math.floor(d.mx + d.vx * tau), Math.floor(d.my + d.vy * tau + 40 * tau * tau), th.L);
    });

    // flask: on the grid at 0° and 90°, a rotated pixel block in between (letters stay legible)
    var deg = theta(t), rad = deg * Math.PI / 180, cs = Math.cos(rad), sn = Math.sin(rad);
    var spx = deg < 0 ? 1 : 23, spy = 25, Px = X0 + spx, Py = F;
    var hidden = Math.floor(seg(t, 1250, 2500) * LIQ.length), hide = {};
    for (var h = 0; h < hidden; h++) hide[LIQ[h]] = 1;
    var onGrid = deg === 0 || deg === 90;
    var flask = null;
    if (!onGrid) {
      var sc = [];
      for (var yy = 0; yy < SH; yy++) for (var xx = 0; xx < SW; xx++) {
        var cc = SPRITE[yy][xx];
        if (cc === '.') continue;
        if (cc === 'L' && hide[yy * SW + xx]) cc = 'W';
        sc.push({ x: xx, y: yy, c: th[cc] });
      }
      flask = { deg: deg, px: Px, py: Py, ox: spx, oy: spy, cells: sc };
    }
    if (onGrid) for (var gy = 0; gy < VH; gy++) for (var gx = X0 - 4; gx <= X0 + 56; gx++) {
      var vx = gx + 0.5 - Px, vy = gy + 0.5 - Py;
      var sx = Math.floor(vx * cs + vy * sn + spx), sy = Math.floor(-vx * sn + vy * cs + spy);
      if (sx < 0 || sy < 0 || sx >= SW || sy >= SH) continue;
      var ch = SPRITE[sy][sx];
      if (ch === '.') continue;
      if (ch === 'L' && hide[sy * SW + sx]) ch = 'W';
      put(gx, gy, th[ch]);
    }

    // bubbles: idle rise before the tip, one last bubble after
    if (t < 850) {
      var ph = Math.floor(t / 260) % 3;
      put(X0 + 13, 3 - ph, th.L);
      put(X0 + 11, 4 - ((ph + 2) % 3), th.K);
    }
    if (t > 4300 && t < 5000) {
      var b = seg(t, 4300, 5000);
      put(53 + Math.floor(b * 2), 18 - Math.floor(b * 5), th.L);
    }

    return { cells: cells, flask: flask, vx: viewX(t), floorAlpha: 1 - seg(t, 3900, 4400) };
  }

  // ---------- static compositions ----------
  function iconCells(themeName, withBubbles) {
    var th = THEMES[themeName || 'light'], out = [];
    for (var y = 0; y < SH; y++) for (var x = 0; x < SW; x++) {
      var ch = SPRITE[y][x];
      if (ch !== '.') out.push({ x: x, y: y + (withBubbles ? 5 : 0), c: th[ch] });
    }
    if (withBubbles) { out.push({ x: 13, y: 1, c: th.L }); out.push({ x: 11, y: 3, c: th.K }); }
    return out;
  }
  function wordCells(themeName, x0, y0) {
    var th = THEMES[themeName || 'light'];
    return textCells('SDG LABS', x0, y0, function (i) { return i < 3 ? 'sdg' : 'labs'; })
      .cells.map(function (p) { return { x: p.x, y: p.y, c: p.tag === 'sdg' ? th.sdg : th.labs }; });
  }
  var WORD_W = textCells('SDG LABS', 0, 0).width; // 41
  function verticalCells(themeName) {
    var icon = iconCells(themeName, true), off = Math.floor((WORD_W - SW) / 2);
    return icon.map(function (p) { return { x: p.x + off, y: p.y, c: p.c }; }).concat(wordCells(themeName, 0, 30 + 4));
  }
  function horizontalCells(themeName) { return frame(T_END + 1000, themeName).cells; }

  function bbox(cells) {
    var b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    cells.forEach(function (p) { b.x0 = Math.min(b.x0, p.x); b.y0 = Math.min(b.y0, p.y); b.x1 = Math.max(b.x1, p.x); b.y1 = Math.max(b.y1, p.y); });
    return b;
  }
  function toSVG(cells, opts) {
    opts = opts || {};
    var m = opts.margin == null ? 2 : opts.margin, b = bbox(cells), unit = opts.unit || 10;
    var w = b.x1 - b.x0 + 1 + 2 * m, h = b.y1 - b.y0 + 1 + 2 * m;
    var byColor = {};
    cells.forEach(function (p) { (byColor[p.c] = byColor[p.c] || []).push(p); });
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w * unit + '" height="' + h * unit + '" shape-rendering="crispEdges">';
    if (opts.title) s += '<title>' + opts.title + '</title>';
    if (opts.bg) s += '<rect width="' + w + '" height="' + h + '" fill="' + opts.bg + '"/>';
    Object.keys(byColor).forEach(function (c) {
      var d = '';
      byColor[c].forEach(function (p) { d += 'M' + (p.x - b.x0 + m) + ' ' + (p.y - b.y0 + m) + 'h1v1h-1z'; });
      s += '<path fill="' + c + '" d="' + d + '"/>';
    });
    return s + '</svg>';
  }

  // ---------- canvas player ----------
  function mount(canvas, opts) {
    opts = opts || {};
    var themeName = opts.theme || 'light', ctx = canvas.getContext('2d');
    var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var start = null, raf = null, loop = !!opts.loop, lastT = 0;
    function size() {
      var dpr = root.devicePixelRatio || 1, w = canvas.clientWidth || 640;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(w * dpr * VH / VW);
    }
    function draw(t) {
      lastT = t;
      var th = THEMES[themeName], f = frame(t, themeName), cell = canvas.width / VW;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (opts.background !== false) { ctx.fillStyle = th.bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      function rect(x, y) {
        var X1 = Math.round((x - f.vx) * cell), X2 = Math.round((x - f.vx + 1) * cell);
        var Y1 = Math.round(y * cell), Y2 = Math.round((y + 1) * cell);
        if (X2 > 0 && X1 < canvas.width) ctx.fillRect(X1, Y1, X2 - X1, Y2 - Y1);
      }
      if (f.floorAlpha > 0) {
        ctx.globalAlpha = f.floorAlpha; ctx.fillStyle = th.floor;
        for (var x = f.vx; x < f.vx + VW; x++) if ((x & 1) === 0) rect(x, F);
        ctx.globalAlpha = 1;
      }
      f.cells.forEach(function (p) { ctx.fillStyle = p.c; rect(p.x, p.y); });
      if (f.flask) {
        var fl = f.flask;
        ctx.save();
        ctx.translate((fl.px - f.vx) * cell, fl.py * cell);
        ctx.rotate(fl.deg * Math.PI / 180);
        fl.cells.forEach(function (p) {
          ctx.fillStyle = p.c;
          // +0.5px overlap hides hairline seams between rotated squares
          ctx.fillRect((p.x - fl.ox) * cell - 0.25, (p.y - fl.oy) * cell - 0.25, cell + 0.5, cell + 0.5);
        });
        ctx.restore();
      }
    }
    function tick(now) {
      if (start == null) start = now;
      var t = now - start;
      if (t > T_END + 1400 && loop) { start = now; t = 0; }
      draw(Math.min(t, T_END + 1000));
      if (t <= T_END + 1000 || loop) raf = root.requestAnimationFrame(tick); else raf = null;
    }
    function play() { if (raf) root.cancelAnimationFrame(raf); start = null; if (reduce) { draw(T_END + 1000); return; } raf = root.requestAnimationFrame(tick); }
    size(); draw(0);
    if (root.ResizeObserver) new root.ResizeObserver(function () { size(); if (!raf) draw(lastT); }).observe(canvas);
    return {
      play: play,
      setTheme: function (n) { themeName = n; if (!raf) draw(lastT); },
      setLoop: function (v) { loop = v; if (v && !raf) play(); },
      drawAt: draw
    };
  }

  var API = { THEMES: THEMES, frame: frame, mount: mount, toSVG: toSVG, iconCells: iconCells, verticalCells: verticalCells, horizontalCells: horizontalCells, wordCells: wordCells, T_END: T_END, VW: VW, VH: VH };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.SDGLogo = API;
})(typeof window !== 'undefined' ? window : globalThis);
