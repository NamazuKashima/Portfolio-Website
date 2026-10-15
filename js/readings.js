/* ===================================
   READINGS — real measurements of each still
   A vectorscope trace and a colour palette, computed in the browser from
   the cover image's own pixels (Rec.709 / BT.709 coefficients). Nothing
   here is drawn by hand: a black-and-white frame really does collapse to
   a single point, a warm frame really does lean toward the skin line.

   Needs the page to be served over http(s) (GitHub Pages, or any local
   server) — browsers refuse to let a canvas read pixels from file://, and
   in that case the scope simply shows its empty graticule.

   window.VWReadings
     analyze(src)            → Promise<reading|null>  (cached per src)
     new Scope(canvas, opts) → .set(reading, 'bloom'|'morph'|false), .clear()
     paletteHTML(reading)    → spans for a .palette strip
     swatchesHTML(reading)   → <li> swatches with hex values
     mount(root)             → fills every [data-palette] / canvas[data-scope]
=================================== */
(function () {
  'use strict';

  var SW = 128, SH = 64, N = SW * SH;   // 8,192 samples per still
  var ZOOM = 2;                         // a colourist's 2× scope: the rim sits at 50% chroma
  var RIM = 0.5 / ZOOM;                 // chroma value at the rim
  var cache = {};
  var work = null;                      // shared offscreen canvas for sampling

  // 75% colour-bar targets in Rec.709 — the hue angles a scope graticule marks
  function hueOf(r, g, b) {
    var y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return Math.atan2((r - y) / 1.5748, (b - y) / 1.8556);
  }
  var TARGETS = [
    ['R', hueOf(0.75, 0, 0)], ['Mg', hueOf(0.75, 0, 0.75)], ['B', hueOf(0, 0, 0.75)],
    ['Cy', hueOf(0, 0.75, 0.75)], ['G', hueOf(0, 0.75, 0)], ['Yl', hueOf(0.75, 0.75, 0)]
  ];
  var SKIN = 123 * Math.PI / 180;       // the skin-tone ("I") line

  // ── SAMPLING ────────────────────────────────────────────────────
  function load(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function analyze(src) {
    if (!src) return Promise.resolve(null);
    if (cache[src]) return cache[src];
    cache[src] = load(src).then(function (img) {
      if (!work) {
        work = document.createElement('canvas');
        work.width = SW; work.height = SH;
      }
      var ctx = work.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, SW, SH);
      ctx.drawImage(img, 0, 0, SW, SH);
      var data;
      try { data = ctx.getImageData(0, 0, SW, SH).data; }
      catch (e) { return null; }          // file:// or cross-origin: no reading, no fake
      return compute(data);
    }).catch(function () { return null; });
    return cache[src];
  }

  function compute(d) {
    var cb = new Float32Array(N), cr = new Float32Array(N), ang = new Float32Array(N), rad = new Float32Array(N);
    var i, p;
    for (i = 0, p = 0; i < N; i++, p += 4) {
      var r = d[p] / 255, g = d[p + 1] / 255, b = d[p + 2] / 255;
      var y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      var u = (b - y) / 1.8556, v = (r - y) / 1.5748;
      cb[i] = u; cr[i] = v;
      rad[i] = Math.sqrt(u * u + v * v);
      ang[i] = Math.atan2(v, u);
    }
    // Order samples by hue, then chroma, so two readings can morph point
    // for point: the reds of one frame flow into the reds of the next.
    var idx = new Uint32Array(N);
    for (i = 0; i < N; i++) idx[i] = i;
    idx.sort(function (a, b) { return (ang[a] - ang[b]) || (rad[a] - rad[b]); });
    var pts = new Float32Array(N * 2);
    for (i = 0; i < N; i++) { var k = idx[i]; pts[i * 2] = cb[k]; pts[i * 2 + 1] = cr[k]; }

    var sorted = Array.prototype.slice.call(rad).sort(function (a, b) { return a - b; });
    return {
      points: pts,
      palette: palette(d),
      chroma: sorted[Math.floor(N * 0.9)]   // 90th-percentile chroma
    };
  }

  // k-means palette (k = 6), weighted RGB distance, seeded on luminance quantiles
  function palette(d) {
    var K = 6, STEP = 2, i, k, it;
    var px = [];
    for (i = 0; i < N; i += STEP) px.push(i * 4);
    var lum = function (o) { return 0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]; };
    var byLum = px.slice().sort(function (a, b) { return lum(a) - lum(b); });
    var C = [];
    for (k = 0; k < K; k++) {
      var s = byLum[Math.floor((k + 0.5) / K * byLum.length)];
      C.push([d[s], d[s + 1], d[s + 2]]);
    }
    var counts = new Array(K);
    for (it = 0; it < 12; it++) {
      var sums = [];
      for (k = 0; k < K; k++) sums.push([0, 0, 0, 0]);
      for (i = 0; i < px.length; i++) {
        var o = px[i], best = 0, bd = Infinity;
        for (k = 0; k < K; k++) {
          var dr = d[o] - C[k][0], dg = d[o + 1] - C[k][1], db = d[o + 2] - C[k][2];
          var dd = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
          if (dd < bd) { bd = dd; best = k; }
        }
        var sm = sums[best];
        sm[0] += d[o]; sm[1] += d[o + 1]; sm[2] += d[o + 2]; sm[3]++;
      }
      for (k = 0; k < K; k++) {
        counts[k] = sums[k][3];
        if (sums[k][3]) C[k] = [sums[k][0] / sums[k][3], sums[k][1] / sums[k][3], sums[k][2] / sums[k][3]];
      }
    }
    var out = [];
    for (k = 0; k < K; k++) {
      var w = counts[k] / px.length;
      if (w < 0.012) continue;
      var c = C[k].map(Math.round);
      // fold near-duplicates (monochrome frames converge on the same greys)
      var twin = out.filter(function (e) { return Math.abs(e.r - c[0]) + Math.abs(e.g - c[1]) + Math.abs(e.b - c[2]) < 14; })[0];
      if (twin) { twin.w += w; continue; }
      out.push({ r: c[0], g: c[1], b: c[2], w: w });
    }
    out.forEach(function (e) {
      e.l = 0.2126 * e.r + 0.7152 * e.g + 0.0722 * e.b;
      e.hex = '#' + [e.r, e.g, e.b].map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
    });
    return out.sort(function (a, b) { return a.l - b.l; });
  }

  function paletteHTML(reading) {
    if (!reading || !reading.palette) return '';
    return reading.palette.map(function (c) {
      return '<span style="flex-grow:' + c.w.toFixed(3) + ';background:' + c.hex + '"></span>';
    }).join('');
  }
  function paletteLabel(reading) {
    if (!reading || !reading.palette) return '';
    return 'Palette measured from the frame: ' + reading.palette.map(function (c) {
      return c.hex.toUpperCase() + ' ' + Math.round(c.w * 100) + '%';
    }).join(', ');
  }
  function swatchesHTML(reading) {
    if (!reading || !reading.palette) return '';
    return reading.palette.map(function (c) {
      return '<li><i style="background:' + c.hex + '"></i><span>' + c.hex.toUpperCase()
        + ' <small>' + Math.round(c.w * 100) + '%</small></span></li>';
    }).join('');
  }

  // ── SCOPE ───────────────────────────────────────────────────────
  // The trace is accumulated like phosphor: every sample splats into a
  // density buffer, which is tone-mapped (log) to alpha and drawn soft;
  // the graticule is drawn crisp on top.
  function Scope(canvas, opts) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = Object.assign({ labels: true, gain: 1 }, opts || {});
    this.cur = null;          // Float32Array of current sample positions (chroma units)
    this.g = 1;               // graticule progress 0..1 (draw-in)
    this.raf = 0;
    this.trace = document.createElement('canvas');
    this.tctx = this.trace.getContext('2d');
    this.measure();
    var self = this;
    if (window.ResizeObserver) {
      new ResizeObserver(function () { if (self.measure()) self.draw(); }).observe(canvas);
    }
    this.draw();
  }

  Scope.prototype.measure = function () {
    var w = Math.round(this.c.clientWidth || this.c.width || 240);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === this.size && dpr === this.dpr) return false;
    this.size = w; this.dpr = dpr;
    this.c.width = Math.round(w * dpr);
    this.c.height = Math.round(w * dpr);
    this.pad = this.o.labels ? Math.max(15, w * 0.075) : 1.5;
    this.R = w / 2 - this.pad;
    // trace buffer: lower resolution on purpose — drawn back scaled-up and smoothed it reads like phosphor
    var T = Math.max(96, Math.min(300, Math.round(this.R * 2 * Math.min(dpr, 1.25))));
    this.T = T;
    this.trace.width = T; this.trace.height = T;
    this.acc = new Float32Array(T * T);
    this.img = this.tctx.createImageData(T, T);
    return true;
  };

  Scope.prototype.renderTrace = function () {
    var T = this.T, acc = this.acc, P = this.cur;
    acc.fill(0);
    if (!P) { this.tctx.clearRect(0, 0, T, T); return; }
    var c = T / 2, k = (T / 2 - 1) / RIM, lim = (T / 2 - 1) * (T / 2 - 1);
    var n = P.length / 2, i;
    for (i = 0; i < n; i++) {
      var x = c + P[2 * i] * k, y = c - P[2 * i + 1] * k;
      var dx = x - c, dy = y - c;
      if (dx * dx + dy * dy > lim) continue;
      var xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi, q = yi * T + xi;
      acc[q] += (1 - fx) * (1 - fy);
      acc[q + 1] += fx * (1 - fy);
      acc[q + T] += (1 - fx) * fy;
      acc[q + T + 1] += fx * fy;
    }
    // tone-map: density normalised to the buffer size, then log-compressed
    var norm = (T * T) / (n * 22) * this.o.gain, LOGMAX = Math.log(1 + 26);
    var data = this.img.data, j, p;
    for (j = 0, p = 0; j < acc.length; j++, p += 4) {
      var v = acc[j];
      if (v <= 0) { data[p + 3] = 0; continue; }
      var a = Math.log(1 + v * norm * 2.2) / LOGMAX;
      if (a > 1) a = 1;
      data[p] = 252; data[p + 1] = 250; data[p + 2] = 242;
      data[p + 3] = Math.round(Math.pow(a, 0.85) * 255);
    }
    this.tctx.putImageData(this.img, 0, 0);
  };

  Scope.prototype.draw = function () {
    var ctx = this.ctx, s = this.size, dpr = this.dpr, R = this.R, cx = s / 2, cy = s / 2, g = this.g;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // trace
    this.renderTrace();
    if (this.cur) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.trace, cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }

    // graticule
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(252,250,242,' + (0.08 * g) + ')';
    ctx.beginPath();
    ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(252,250,242,' + (0.06 * g) + ')';
    ctx.stroke();

    // the rim — drawn in like a single brush stroke (円相) when g < 1
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g);
    ctx.strokeStyle = 'rgba(252,250,242,0.34)';
    ctx.stroke();

    // skin-tone line, in 老竹
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(SKIN) * R * g, cy - Math.sin(SKIN) * R * g);
    ctx.strokeStyle = 'rgba(118,145,100,0.75)';
    ctx.stroke();

    // hue targets: a tick on the rim, the letter just outside it
    if (this.o.labels) {
      ctx.fillStyle = 'rgba(188,176,156,' + (0.85 * g) + ')';
      ctx.strokeStyle = 'rgba(252,250,242,' + (0.4 * g) + ')';
      ctx.font = Math.round(Math.max(9.5, s * 0.026)) + 'px "Zen Kaku Gothic New", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      TARGETS.forEach(function (t) {
        var a = t[1], ca = Math.cos(a), sa = Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(cx + ca * (R - 4), cy - sa * (R - 4));
        ctx.lineTo(cx + ca * (R + 3), cy - sa * (R + 3));
        ctx.stroke();
        var lr = R + this.pad * 0.55;
        ctx.fillText(t[0], cx + ca * lr, cy - sa * lr);
      }, this);
    }
    // centre mark
    ctx.fillStyle = 'rgba(252,250,242,' + (0.5 * g) + ')';
    ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);
  };

  // set(reading, mode): mode 'bloom' grows the trace out of the centre and
  // draws the rim in; 'morph' flows the current trace into the new one.
  Scope.prototype.set = function (reading, mode, duration) {
    var target = reading && reading.points;
    var self = this;
    cancelAnimationFrame(this.raf);
    var reduced = window.VW ? VW.reduced : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!mode || reduced) {
      this.cur = target ? new Float32Array(target) : null;
      this.g = 1;
      this.draw();
      return;
    }
    var from;
    if (mode === 'bloom' || !this.cur) {
      from = new Float32Array(target ? target.length : 0);
      if (mode === 'bloom') this.g = 0;
    } else {
      from = this.cur.slice();
    }
    if (!target) { this.cur = null; this.g = 1; this.draw(); return; }
    var len = target.length;
    if (from.length !== len) from = new Float32Array(len);
    var cur = new Float32Array(len);
    var dur = duration || (mode === 'bloom' ? 1900 : 1300);
    var gFrom = this.g, t0 = performance.now();
    var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };
    function frame(now) {
      var t = Math.min(1, (now - t0) / dur);
      var e = mode === 'bloom' ? easeOut(t) : ease(t);
      for (var i = 0; i < len; i++) cur[i] = from[i] + (target[i] - from[i]) * e;
      self.cur = cur;
      if (mode === 'bloom') self.g = gFrom + (1 - gFrom) * easeOut(Math.min(1, t * 1.25));
      self.draw();
      if (t < 1) self.raf = requestAnimationFrame(frame);
      else { self.cur = new Float32Array(target); self.g = 1; self.draw(); }
    }
    this.raf = requestAnimationFrame(frame);
  };

  Scope.prototype.clear = function () { cancelAnimationFrame(this.raf); this.cur = null; this.g = 1; this.draw(); };

  // ── MOUNT: lazy readings for palettes + small scopes ────────────
  function mount(root) {
    root = root || document;
    var els = Array.prototype.slice.call(root.querySelectorAll('[data-palette], canvas[data-scope]'))
      .filter(function (el) { return !el.__reading; });
    if (!els.length) return;
    var run = function (el) {
      el.__reading = true;
      var src = el.getAttribute('data-palette') || el.getAttribute('data-scope');
      analyze(src).then(function (r) {
        if (!r) return;
        if (el.hasAttribute('data-palette')) {
          el.innerHTML = paletteHTML(r);
          el.setAttribute('role', 'img');
          el.setAttribute('aria-label', paletteLabel(r));
        } else {
          var sc = el.__scope || (el.__scope = new Scope(el, { labels: false, gain: 0.8 }));
          el.classList.add('has-reading');
          sc.set(r, el.hasAttribute('data-bloom') && window.VW && VW.motion ? 'bloom' : false, 1600);
        }
      });
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var handler = function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        run(en.target);
      });
    };
    // palettes are filled just before they scroll in; scopes that bloom
    // wait until they are actually on screen, so the bloom is seen
    var early = new IntersectionObserver(handler, { rootMargin: '240px 0px' });
    var onScreen = new IntersectionObserver(handler, { threshold: 0.35 });
    els.forEach(function (el) {
      el.__reading = 'queued';
      (el.hasAttribute('data-bloom') ? onScreen : early).observe(el);
    });
  }

  window.VWReadings = {
    analyze: analyze,
    Scope: Scope,
    paletteHTML: paletteHTML,
    paletteLabel: paletteLabel,
    swatchesHTML: swatchesHTML,
    mount: mount
  };
})();
