/* Aamal Al Arab — Showroom (standalone) */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var WA = "966596475546";
  var L = function () { return root.lang === "en" ? "en" : "ar"; };
  var wa = function (text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); };

  /* ---------- language ---------- */
  function setLang(lang, save) {
    root.lang = lang; root.dir = lang === "ar" ? "rtl" : "ltr";
    if (save) { try { localStorage.setItem("aa4-lang", lang); } catch (e) {} }
    var t = $("[data-ar-title]"); if (t) document.title = t.getAttribute("data-" + lang + "-title");
    $$("[data-ar-alt]").forEach(function (el) { el.alt = el.getAttribute("data-" + lang + "-alt"); });
    $$("[data-ar-aria]").forEach(function (el) { el.setAttribute("aria-label", el.getAttribute("data-" + lang + "-aria")); });
    $$("[data-ar-ph]").forEach(function (el) { el.placeholder = el.getAttribute("data-" + lang + "-ph"); });
    // product WhatsApp links carry the product name in the page language
    $$(".prod").forEach(function (p) {
      var n = p.getAttribute("data-name-" + lang);
      $(".prod__ask a", p).href = wa(lang === "ar" ? "السلام عليكم، مهتم بـ «" + n + "» من موقع أعمال العرب. ممكن تفاصيل أكثر؟" : "Hello, I'm interested in the \"" + n + "\" from the Aamal Al Arab website. Could you share more details?");
    });
    if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 60);
  }
  $(".nav__lang").addEventListener("click", function () { setLang(L() === "ar" ? "en" : "ar", true); });

  /* ---------- before / after ---------- */
  var ba = $(".ba"), range = $(".ba input[type=range]");
  function setPos(v) { ba.style.setProperty("--pos", v + "%"); range.value = v; }
  range.addEventListener("input", function () { setPos(+range.value); });

  /* ---------- explore list: swap the big image + a small image that follows the cursor ---------- */
  var bigs = $$(".explore__big img");
  var floatEl = document.createElement("div");
  floatEl.className = "float-img"; floatEl.innerHTML = "<img alt=''>";
  document.body.appendChild(floatEl);
  var fImg = $("img", floatEl);
  $$(".explore__list a").forEach(function (a) {
    function on() {
      $$(".explore__list a").forEach(function (x) { x.classList.toggle("is-on", x === a); });
      bigs.forEach(function (im) { im.classList.toggle("is-on", im.dataset.k === a.dataset.img); });
    }
    a.addEventListener("mouseenter", function () { on(); fImg.src = "assets/img/" + a.dataset.img + ".jpg"; floatEl.classList.add("is-on"); });
    a.addEventListener("mouseleave", function () { floatEl.classList.remove("is-on"); });
    a.addEventListener("focus", on);
  });
  window.addEventListener("mousemove", function (e) {
    if (!floatEl.classList.contains("is-on")) return;
    floatEl.style.transform = "translate(" + (e.clientX + 24) + "px," + (e.clientY - 60) + "px) rotate(-8deg)";
  });

  /* ---------- CTA: phone -> WhatsApp ---------- */
  var form = $(".cta__form"), err = $(".cta .err");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = $("input", form), v = input.value.trim();
    if (v.replace(/\D/g, "").length < 9) {
      err.textContent = L() === "ar" ? "اكتب رقم جوال صحيح" : "Please enter a valid mobile number";
      input.setAttribute("aria-invalid", "true"); input.focus(); return;
    }
    err.textContent = ""; input.setAttribute("aria-invalid", "false");
    var url = wa(L() === "ar" ? "السلام عليكم، أبغى أحجز استشارة مجانية من موقع أعمال العرب. رقمي: " + v : "Hello, I'd like to book a free consultation from the Aamal Al Arab website. My number: " + v);
    if (window.matchMedia("(pointer: coarse)").matches) location.href = url; else window.open(url, "_blank", "noopener");
    err.textContent = L() === "ar" ? "فتحنا لك الواتساب — اضغط إرسال هناك." : "WhatsApp is open — press send there.";
    window.AA_LAST_WA = url;
  });

  /* ---------- sticky nav after the hero ---------- */
  var sticky = $(".sticky-nav"), hero = $(".hero");
  function onScroll() {
    var on = hero.getBoundingClientRect().bottom < 60;
    sticky.classList.toggle("is-on", on);
    sticky.setAttribute("aria-hidden", String(!on));
    $$("a", sticky).forEach(function (a) { a.tabIndex = on ? 0 : -1; });
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"), el = id === "#top" ? document.body : $(id);
      if (!el) return; e.preventDefault();
      if (window.__lenis) window.__lenis.scrollTo(el === document.body ? 0 : el, { offset: -70 });
      else window.scrollTo({ top: el === document.body ? 0 : el.getBoundingClientRect().top + scrollY - 70, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- hero card: circles slider, tap a piece for its details ---------- */
  var prods = $$(".prod").map(function (p) {
    return { el: p, img: $(".prod__img img", p).getAttribute("src"),
      name: function (l) { return p.getAttribute("data-name-" + l); },
      desc: function (l) { var d = $('p [data-l="' + l + '"]', p); return d ? d.textContent : ""; },
      ask: function () { return $(".prod__ask a", p).href; } };
  });
  var track = $(".tslider__track"), photo = $(".trust__photo"), prodImg = $(".trust__prod"), info = $(".tinfo");
  var sel = -1, step = 0, CIRCLE = 42, paused = 0, N = prods.length;
  // the list is rendered twice so the strip can loop endlessly: pieces leave on the left and come back in on the right
  var one = function (copy) {
    return prods.map(function (p, i) {
      return '<button type="button" aria-pressed="false" data-i="' + i + '"' + (copy ? ' tabindex="-1" aria-hidden="true"' : "") + '><img src="' + p.img + '" alt=""></button>';
    }).join("");
  };
  track.innerHTML = one(false) + one(true);
  var circles = $$("button", track);
  function labelCircles() { circles.forEach(function (c) { c.setAttribute("aria-label", prods[+c.dataset.i].name(L())); }); }
  function place(animate) {
    track.style.transition = animate ? "" : "none";
    track.style.transform = "translateX(" + (-step * CIRCLE) + "px)";
    if (!animate) { void track.offsetWidth; track.style.transition = ""; }
  }
  function slideTo(n) { step = n; place(true); }
  // once the first copy has fully scrolled out, jump back to the start without animating (looks seamless)
  track.addEventListener("transitionend", function (e) {
    if (e.propertyName === "transform" && step >= N) { step -= N; place(false); }
  });
  function renderInfo() {
    if (sel < 0) return;
    var p = prods[sel], l = L();
    $(".tinfo__name", info).textContent = p.name(l);
    $(".tinfo__desc", info).textContent = (l === "ar" ? "على المقاس · " : "Made to measure · ") + p.desc(l);
    $(".tinfo__ask", info).href = p.ask();
  }
  function select(i) {
    sel = i;
    circles.forEach(function (c) { c.setAttribute("aria-pressed", String(+c.dataset.i === i)); });
    prodImg.src = prods[i].img; prodImg.alt = prods[i].name(L());
    photo.classList.remove("is-on"); prodImg.classList.add("is-on"); info.classList.add("is-on");
    renderInfo();
    paused = Date.now();
  }
  function closeInfo() {
    sel = -1;
    circles.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
    prodImg.classList.remove("is-on"); info.classList.remove("is-on"); photo.classList.add("is-on");
  }
  circles.forEach(function (c) { c.addEventListener("click", function () { var i = +c.dataset.i; sel === i ? closeInfo() : select(i); }); });
  $(".tinfo__close").addEventListener("click", closeInfo);
  // the circles drift one step every 2.6 s (paused while hovered, or for 8 s after a tap)
  var hovering = false;
  $(".trust").addEventListener("mouseenter", function () { hovering = true; });
  $(".trust").addEventListener("mouseleave", function () { hovering = false; });
  if (!reduce) setInterval(function () { if (!hovering && Date.now() - paused > 8000 && !document.hidden) slideTo(step + 1); }, 2600);
  $(".nav__lang").addEventListener("click", function () { labelCircles(); renderInfo(); });
  labelCircles();

  setLang(L(), false);
  if (reduce || !window.gsap) return;

  /* ---------- motion ---------- */
  root.classList.add("js");
  var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger); var ST = window.ScrollTrigger;
  if (window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    window.__lenis = lenis; lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
  }

  // hero: image settles, headline rows rise, the inline image chip opens, trust card slides in
  var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.fromTo(".hero__img img", { scale: 1.14 }, { scale: 1, duration: 2.2, ease: "power2.out" })
    .from(".nav > *", { y: -20, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.2)
    .from(".hero__sub", { y: 20, opacity: 0, duration: 0.8 }, 0.5)
    .from(".hero__title .row > span", { yPercent: 110, duration: 1.1, stagger: 0.12, ease: "power4.out" }, 0.6)
    .from(".chip", { width: 0, opacity: 0, duration: 1, ease: "power3.inOut" }, 1.1)
    .from(".trust", { x: root.dir === "rtl" ? -40 : 40, opacity: 0, duration: 1 }, 1);
  gsap.to(".hero__img img", { yPercent: 8, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });

  // reveals
  $$("[data-up]").forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });
  // counters
  $$("[data-count]").forEach(function (el) {
    var end = +el.dataset.count, o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" }, onUpdate: function () { el.textContent = Math.round(o.v); } });
  });
  // before/after: a short demo sweep the first time it comes into view
  var o = { p: 50 };
  ST.create({ trigger: ba, start: "top 70%", once: true, onEnter: function () {
    gsap.timeline().to(o, { p: 18, duration: 1.1, ease: "power2.inOut", onUpdate: function () { setPos(o.p); } })
      .to(o, { p: 82, duration: 1.4, ease: "power2.inOut", onUpdate: function () { setPos(o.p); } })
      .to(o, { p: 50, duration: 1, ease: "power2.inOut", onUpdate: function () { setPos(o.p); } });
  } });
  // gentle image parallax
  $$(".explore__big").forEach(function (el) {
    gsap.fromTo(el, { yPercent: -3 }, { yPercent: 3, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });
})();
