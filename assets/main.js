/* =========================================================
   Mari Kawan Creative: site script
   Sections: 0 Language and dark mode, 0b Back to top, 1 Mobile menu, 2 Scroll reveal, 3 Case study slider, 4 Stacked process cards, 6 Hero slider
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* 0. Language (EN / ID / ES) and dark mode ------------------ */
  var root = document.documentElement;
  var store = {
    get: function (k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
  };
  var dict = window.MKC_I18N || {};
  var lang = "en";
  var textOriginals = new WeakMap();
  var attrOriginals = new WeakMap();
  var titleOriginal = document.title;
  var descMeta = document.querySelector('meta[name="description"]');
  var descOriginal = descMeta ? descMeta.getAttribute("content") : "";

  function norm(s) {
    return s.replace(/\s+/g, " ").trim();
  }
  function lookup(text) {
    var table = dict[lang];
    if (lang === "en" || !table) return null;
    var t = table[norm(text)];
    return t === undefined ? null : t;
  }
  // Translate any English string at runtime (used by the case study slider).
  window.mkcT = function (s) {
    var t = lookup(s);
    return t === null ? s : t;
  };
  var T = window.mkcT;

  // English is written in the HTML. Other languages replace matching text nodes.
  function applyLang(next) {
    lang = next;
    root.lang = next;
    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (n) {
          var p = n.parentNode;
          if (
            !norm(n.nodeValue) ||
            /^(SCRIPT|STYLE)$/.test(p.nodeName) ||
            p.closest("[data-cs-text], [data-modal-dyn]")
          )
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    var node;
    while ((node = walker.nextNode())) {
      if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue);
      var orig = textOriginals.get(node);
      var t = lookup(orig);
      node.nodeValue =
        t === null ? orig : orig.match(/^\s*/)[0] + t + orig.match(/\s*$/)[0];
    }
    document.querySelectorAll("[aria-label]").forEach(function (el) {
      if (!attrOriginals.has(el))
        attrOriginals.set(el, el.getAttribute("aria-label"));
      var o = attrOriginals.get(el);
      var a = lookup(o);
      el.setAttribute("aria-label", a === null ? o : a);
    });
    var tt = lookup(titleOriginal);
    document.title = tt === null ? titleOriginal : tt;
    if (descMeta) {
      var dd = lookup(descOriginal);
      descMeta.setAttribute("content", dd === null ? descOriginal : dd);
    }
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === next));
    });
    var langCur = document.querySelector("[data-lang-current]");
    if (langCur) langCur.textContent = next.toUpperCase();
    document.dispatchEvent(new Event("mkc:lang"));
  }
  document.querySelectorAll("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      store.set("mkc-lang", b.dataset.lang);
      applyLang(b.dataset.lang);
      langOpen(false);
    });
  });

  // Language dropdown: shows only the current language until it is clicked.
  var langMenu = document.querySelector("[data-lang-menu]");
  var langToggle = langMenu && langMenu.querySelector("[data-lang-toggle]");
  var langList = langMenu && langMenu.querySelector(".lang-list");
  function langOpen(open) {
    if (!langMenu) return;
    langMenu.classList.toggle("is-open", open);
    langToggle.setAttribute("aria-expanded", String(open));
  }
  if (langMenu) {
    langToggle.addEventListener("click", function () {
      langOpen(!langMenu.classList.contains("is-open"));
    });
    document.addEventListener("click", function (e) {
      if (!langMenu.contains(e.target)) langOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && langMenu.classList.contains("is-open")) {
        langOpen(false);
        langToggle.focus();
      }
    });
  }
  var savedLang = store.get("mkc-lang");
  applyLang(
    savedLang && (savedLang === "en" || dict[savedLang]) ? savedLang : "en",
  );

  var themeBtn = document.querySelector("[data-theme-toggle]");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      store.set("mkc-theme", next);
    });
  }

  /* 0b. Back to top button ------------------------------------ */
  var toTop = document.querySelector("[data-to-top]");
  if (toTop) {
    window.addEventListener(
      "scroll",
      function () {
        toTop.classList.toggle("is-visible", window.scrollY > 600);
      },
      { passive: true },
    );
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* 1. Mobile menu ------------------------------------------ */
  var menuBtn = document.getElementById("menu-btn");
  var menu = document.getElementById("mobile-menu");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      menu.hidden = !menu.hidden;
      menuBtn.setAttribute("aria-expanded", String(!menu.hidden));
    });
  }

  /* 2. Scroll reveal (.rv elements fade up once) ------------- */
  var revealItems = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );
    revealItems.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealItems.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* 3. Case study slider (case-studies.html): loops forever, with category filter -- */
  var cs = document.querySelector("[data-cs]");
  if (cs) {
    var csTrack = cs.querySelector("[data-cs-track]");
    var csAll = Array.prototype.slice.call(csTrack.children); // every real case, kept even when filtered out
    var csOriginals = csAll.slice(); // real cases shown for the current filter
    var csN = csOriginals.length;
    var csLoop = true;
    var csOff = 0; // index of the first real slide inside csSlides
    var csSlides = [];
    var csText = cs.querySelector("[data-cs-text]");
    var csTag = cs.querySelector("[data-cs-tag]");
    var csName = cs.querySelector("[data-cs-name]");
    var csDesc = cs.querySelector("[data-cs-desc]");
    var csControls = cs.querySelector(".cs-controls");
    var csChips = Array.prototype.slice.call(
      cs.querySelectorAll("[data-cs-filter]"),
    );
    var csFilter = "all";
    var csIndex = 0; // position of the centered slide in csSlides
    var csReal = -1; // which real case is shown (0 to csN - 1)
    var csSwapTimer;
    var csSettleTimer;

    // Copies of the slides are added before and after the real ones, so the
    // track never reaches an end. Layout: [copies | real slides | copies].
    function csClone(slide) {
      var copy = slide.cloneNode(true);
      copy.removeAttribute("id");
      Array.prototype.forEach.call(
        copy.querySelectorAll(".cs-gallery"),
        function (g) {
          g.remove();
        },
      );
      copy.setAttribute("aria-hidden", "true");
      return copy;
    }

    // Scroll position that centers slide i in the track.
    function csCenter(i) {
      var s = csSlides[i];
      return s.offsetLeft + s.offsetWidth / 2 - csTrack.clientWidth / 2;
    }
    function csGoTo(i) {
      i = Math.max(0, Math.min(csSlides.length - 1, i));
      csTrack.scrollTo({
        left: csCenter(i),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
    function csShowText(d) {
      csTag.textContent = T(d.tag);
      csName.textContent = T(d.name);
      csDesc.textContent = T(d.desc);
    }
    // Keeps the text block the same height for every case, so the arrows
    // never move up or down when the text changes (or wraps differently).
    function csLockHeight() {
      csText.style.minHeight = "";
      var max = 0;
      csOriginals.forEach(function (s) {
        csShowText(s.dataset);
        max = Math.max(max, csText.offsetHeight);
      });
      csText.style.minHeight = max + "px";
      var cur =
        csReal >= 0 && csSlides[csIndex] ? csSlides[csIndex] : csOriginals[0];
      csShowText(cur.dataset);
    }
    // Marks slide i active and swaps the text under the slider with a short fade.
    function csSetActive(i) {
      csIndex = i;
      csSlides.forEach(function (s, k) {
        s.classList.toggle("is-active", k === i);
      });
      var real = i % csN;
      if (real === csReal) return;
      csReal = real;
      var data = csSlides[i].dataset;
      clearTimeout(csSwapTimer);
      csText.classList.add("is-swap");
      csSwapTimer = setTimeout(
        function () {
          csShowText(data);
          csText.classList.remove("is-swap");
        },
        reduceMotion ? 0 : 180,
      );
    }
    // Instant move (no animation), used to jump from a copy to the identical real slide.
    function csJump(i) {
      csTrack.classList.add("is-jumping");
      csTrack.style.scrollBehavior = "auto";
      csTrack.scrollLeft = csCenter(i);
      csTrack.style.scrollBehavior = "";
      csSetActive(i);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          csTrack.classList.remove("is-jumping");
        });
      });
    }
    // When scrolling stops on a copy, jump to the real slide that looks the same.
    function csRecenter() {
      if (!csLoop) return;
      if (csIndex < csN) csJump(csIndex + csN);
      else if (csIndex >= 2 * csN) csJump(csIndex - csN);
    }

    // Shows only the cases of one category ("all" shows everything).
    function csBuild(filter, focusId) {
      var list = csAll.filter(function (s) {
        return filter === "all" || s.dataset.cat === filter;
      });
      if (!list.length) {
        filter = "all";
        list = csAll.slice();
      }
      csFilter = filter;
      csOriginals = list;
      csN = list.length;
      csLoop = csN > 1;
      csOff = csLoop ? csN : 0;
      csReal = -1;
      clearTimeout(csSwapTimer);

      csTrack.innerHTML = "";
      csOriginals.forEach(function (s) {
        s.classList.remove("is-active");
        csTrack.appendChild(s);
      });
      if (csLoop) {
        csOriginals.forEach(function (s) {
          csTrack.appendChild(csClone(s));
        });
        csOriginals
          .slice()
          .reverse()
          .forEach(function (s) {
            csTrack.insertBefore(csClone(s), csTrack.firstChild);
          });
      }
      csSlides = Array.prototype.slice.call(csTrack.children);
      if (csControls) csControls.hidden = !csLoop; // arrows make no sense for a single case
      csChips.forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.dataset.csFilter === filter));
      });

      var start = csOff;
      if (focusId) {
        for (var k = 0; k < csN; k++)
          if (csOriginals[k].id === focusId) start = csOff + k;
      }
      csLockHeight();
      csJump(start);
    }

    // Find the slide closest to the center (works for swipe, arrows and clicks).
    var csTicking = false;
    csTrack.addEventListener("scroll", function () {
      clearTimeout(csSettleTimer);
      csSettleTimer = setTimeout(csRecenter, 140);
      if (csTicking) return;
      csTicking = true;
      requestAnimationFrame(function () {
        var mid = csTrack.scrollLeft + csTrack.clientWidth / 2;
        var best = csIndex;
        var bestDist = Infinity;
        csSlides.forEach(function (s, k) {
          var d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
          if (d < bestDist) {
            bestDist = d;
            best = k;
          }
        });
        if (best !== csIndex) csSetActive(best);
        csTicking = false;
      });
    });

    // One listener for all slides (the slides are rebuilt when the filter changes).
    csTrack.addEventListener("click", function (e) {
      var s = e.target.closest(".cs-slide");
      var k = s ? csSlides.indexOf(s) : -1;
      if (k >= 0 && k !== csIndex) csGoTo(k);
    });
    cs.querySelector("[data-cs-prev]").addEventListener("click", function () {
      csGoTo(csIndex - 1);
    });
    cs.querySelector("[data-cs-next]").addEventListener("click", function () {
      csGoTo(csIndex + 1);
    });
    csTrack.addEventListener("keydown", function (e) {
      if (!csLoop) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        csGoTo(csIndex - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        csGoTo(csIndex + 1);
      }
    });

    // Category filter chips. The choice is kept in the address, e.g. case-studies.html?type=catalog
    csChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.csFilter;
        if (f === csFilter) return;
        try {
          history.replaceState(
            null,
            "",
            window.location.pathname + (f === "all" ? "" : "?type=" + f),
          );
        } catch (e) {}
        // Fade the slider out, swap the cases, fade back in.
        cs.classList.add("is-filtering");
        setTimeout(
          function () {
            csBuild(f);
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                cs.classList.remove("is-filtering");
              });
            });
          },
          reduceMotion ? 0 : 220,
        );
      });
    });

    // Open the slide named in the URL, e.g. case-studies.html#tubanan
    function csFromHash(first) {
      var id = window.location.hash.slice(1);
      var k = -1;
      for (var j = csOff; j < csOff + csN; j++) {
        if (csSlides[j].id === id) k = j;
      }
      if (k < 0 && id && csAll.some(function (s) { return s.id === id; })) {
        csBuild("all", id); // that case is hidden by the current filter
        return;
      }
      if (k >= 0) {
        if (first) csJump(k);
        else csGoTo(k);
      }
    }
    window.addEventListener("hashchange", function () {
      csFromHash(false);
    });

    var startType = new URLSearchParams(window.location.search).get("type");
    csBuild(startType || "all");
    csFromHash(true);
    window.addEventListener("load", function () {
      csLockHeight();
      csJump(csIndex);
    });

    // Re-translate the text under the slider when the language changes.
    document.addEventListener("mkc:lang", function () {
      csLockHeight();
    });

    // "View details" pop-up with an image gallery (native <dialog>).
    var modal = document.querySelector("[data-case-modal]");
    var detailsBtn = cs.querySelector("[data-cs-details]");
    if (modal && detailsBtn && typeof modal.showModal === "function") {
      var mTrack = modal.querySelector("[data-modal-track]");
      var mDots = modal.querySelector("[data-modal-dots]");
      var mStage = modal.querySelector("[data-modal-stage]");
      var mCaption = modal.querySelector("[data-modal-caption]");
      var mItems = [];
      var mIndex = 0;
      var mSlide = null;

      // Text that depends on the case and the language.
      function mFill() {
        var d = mSlide.dataset;
        modal.querySelector("[data-modal-tag]").textContent = T(d.tag);
        modal.querySelector("[data-modal-name]").textContent = T(d.name);
        modal.querySelector("[data-modal-desc]").textContent = T(d.desc);
        modal.querySelector("[data-modal-type]").textContent = T(d.type);
        mCaption.textContent = T(mItems[mIndex].dataset.caption);
      }
      function mShow(i) {
        mIndex = (i + mItems.length) % mItems.length;
        mTrack.style.translate = -100 * mIndex + "% 0";
        Array.prototype.forEach.call(mDots.children, function (dot, k) {
          dot.classList.toggle("is-current", k === mIndex);
        });
        mCaption.textContent = T(mItems[mIndex].dataset.caption);
      }
      function mOpen() {
        mSlide = csOriginals[csReal];
        mTrack.innerHTML = "";
        mDots.innerHTML = "";
        mItems = [];
        Array.prototype.forEach.call(
          mSlide.querySelectorAll(".cs-gallery > *"),
          function (src, k) {
            var item = src.cloneNode(true);
            mTrack.appendChild(item);
            mItems.push(item);
            var dot = document.createElement("button");
            dot.type = "button";
            dot.className = "gal-dot";
            dot.setAttribute("aria-label", "Image " + (k + 1));
            dot.addEventListener("click", function () {
              mShow(k);
            });
            mDots.appendChild(dot);
          },
        );
        mIndex = 0;
        mTrack.style.transition = "none";
        mShow(0);
        mFill();
        void mTrack.offsetWidth;
        mTrack.style.transition = "";
        root.classList.add("modal-open");
        modal.showModal();
      }
      detailsBtn.addEventListener("click", mOpen);
      modal
        .querySelector("[data-modal-close]")
        .addEventListener("click", function () {
          modal.close();
        });
      modal.addEventListener("click", function (e) {
        if (e.target === modal) modal.close();
      }); // click on the backdrop
      modal.addEventListener("close", function () {
        root.classList.remove("modal-open");
      });
      modal
        .querySelector("[data-modal-prev]")
        .addEventListener("click", function () {
          mShow(mIndex - 1);
        });
      modal
        .querySelector("[data-modal-next]")
        .addEventListener("click", function () {
          mShow(mIndex + 1);
        });
      modal.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") mShow(mIndex - 1);
        if (e.key === "ArrowRight") mShow(mIndex + 1);
      });
      // Swipe on touch screens.
      var mStartX = null;
      mStage.addEventListener("pointerdown", function (e) {
        mStartX = e.clientX;
      });
      mStage.addEventListener("pointerup", function (e) {
        if (mStartX === null) return;
        var dx = e.clientX - mStartX;
        mStartX = null;
        if (Math.abs(dx) > 50) mShow(mIndex + (dx < 0 ? 1 : -1));
      });
      document.addEventListener("mkc:lang", function () {
        if (modal.open) mFill();
      });
    }

    var csResize;
    window.addEventListener("resize", function () {
      clearTimeout(csResize);
      csResize = setTimeout(function () {
        csLockHeight();
        csJump(csIndex);
      }, 150);
    });
  }

  /* 4. Stacked process cards: a card shrinks slightly as the next one covers it */
  var stackCards = document.querySelectorAll(".stack-card");
  if (stackCards.length && !reduceMotion) {
    var stackTicking = false;
    var updateStack = function () {
      stackCards.forEach(function (card, i) {
        var next = stackCards[i + 1];
        if (!next) return;
        var overlap =
          card.getBoundingClientRect().bottom -
          next.getBoundingClientRect().top;
        var p = Math.max(0, Math.min(1, overlap / card.offsetHeight));
        card.firstElementChild.style.setProperty("--p", p.toFixed(3));
      });
      stackTicking = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!stackTicking) {
          stackTicking = true;
          requestAnimationFrame(updateStack);
        }
      },
      { passive: true },
    );
    updateStack();
  }

  /* 6. Hero slider ------------------------------------------ */
  var slider = document.querySelector("[data-slider]");
  if (!slider) return;

  var DELAY = 6000; // ms per slide. Also set --slide-ms in CSS if you change it.
  var track = slider.querySelector(".slider-track");
  var slides = Array.prototype.slice.call(track.children);
  var dots = Array.prototype.slice.call(
    slider.querySelectorAll("[data-slider-dot]"),
  );
  var toggleBtn = slider.querySelector("[data-slider-toggle]");
  var index = 0;
  var timer = null;
  var playing = !reduceMotion;

  slider.style.setProperty("--slide-ms", DELAY + "ms");
  slider.classList.toggle("is-paused", !playing);

  function goTo(i, smooth) {
    i = (i + slides.length) % slides.length;
    track.scrollTo({
      left: slides[i].offsetLeft,
      behavior: smooth === false ? "auto" : "smooth",
    });
  }

  function schedule() {
    clearTimeout(timer);
    if (playing)
      timer = setTimeout(function () {
        goTo(index + 1);
      }, DELAY);
  }

  // Marks the current slide and restarts the progress bar on its dot.
  function setActive(i) {
    index = i;
    slides.forEach(function (s, n) {
      s.classList.toggle("is-active", n === i);
    });
    dots.forEach(function (d, n) {
      d.classList.remove("is-active");
      d.setAttribute("aria-current", n === i ? "true" : "false");
    });
    void dots[i].offsetWidth; // force reflow so the CSS animation restarts
    dots[i].classList.add("is-active");
  }

  // Detect which slide is in view (works for swipe, arrows and dots).
  var ticking = false;
  track.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== index) {
        setActive(i);
        schedule();
      }
      ticking = false;
    });
  });

  dots.forEach(function (d, n) {
    d.addEventListener("click", function () {
      goTo(n);
    });
  });
  slider
    .querySelector("[data-slider-prev]")
    .addEventListener("click", function () {
      goTo(index - 1);
    });
  slider
    .querySelector("[data-slider-next]")
    .addEventListener("click", function () {
      goTo(index + 1);
    });

  toggleBtn.addEventListener("click", function () {
    playing = !playing;
    slider.classList.toggle("is-paused", !playing);
    toggleBtn.setAttribute(
      "aria-label",
      playing ? "Pause slideshow" : "Play slideshow",
    );
    setActive(index);
    schedule();
  });

  // Pause while the visitor hovers or focuses inside the slider.
  function hold() {
    slider.classList.add("is-held");
    clearTimeout(timer);
  }
  function release() {
    slider.classList.remove("is-held");
    setActive(index);
    schedule();
  }
  slider.addEventListener("mouseenter", hold);
  slider.addEventListener("mouseleave", release);
  slider.addEventListener("focusin", hold);
  slider.addEventListener("focusout", release);

  slider.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  });

  // Keep the current slide aligned when the window is resized.
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      goTo(index, false);
    }, 150);
  });

  setActive(0);
  schedule();
})();
