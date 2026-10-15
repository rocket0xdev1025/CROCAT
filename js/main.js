/* =========================================================================
   CROCAT — LANDING INTERACTIONS
   (links, CA copy, nav, live stats, pet-the-cat, memes, reveal)
   The dress-up studio lives in creator.js (+ its catalog in creator-items.js).
   ========================================================================= */
(function () {
  "use strict";
  const cfg = window.CROCAT_CONFIG || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = !!(
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : v;
      } catch (_) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, String(v));
      } catch (_) {}
    },
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val != null) el.textContent = val;
  };

  /* ---- Wire up all [data-link] anchors ---- */
  $$("[data-link]").forEach((el) => {
    const key = el.getAttribute("data-link");
    const url = cfg.links && cfg.links[key];
    if (url) {
      el.href = url;
    } else {
      // No link configured -> hide the button entirely (e.g. Telegram/Discord).
      el.remove();
    }
  });

  /* ---- Share-on-X helpers ---- */
  const siteUrl = cfg.siteUrl || location.href;
  const tweetIntent = (tpl) =>
    "https://twitter.com/intent/tweet?text=" +
    encodeURIComponent(String(tpl).replace(/\{url\}/g, siteUrl));

  const shillBtn = $("#shillBtn");
  if (shillBtn) {
    shillBtn.href = tweetIntent(
      cfg.shillText || "$CROCAT, the cat of Cronos 🐾 {url}"
    );
  }

  /* ---- Toast ---- */
  const toastEl = $("#toast");
  let toastTimer = 0;
  function toast(msg, ms = 2400) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), ms);
  }

  /* ---- Little particle effects ---- */
  function spawnFx(cls, char, vars, delay) {
    const s = document.createElement("span");
    s.className = "fx " + cls;
    s.textContent = char;
    s.setAttribute("aria-hidden", "true");
    Object.keys(vars).forEach((k) => s.style.setProperty(k, vars[k]));
    if (delay) s.style.animationDelay = delay + "s";
    s.addEventListener("animationend", () => s.remove());
    document.body.appendChild(s);
    return s;
  }
  function burst(x, y, chars = ["🐾"], n = 8) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      const d = 45 + Math.random() * 55;
      spawnFx("fx--burst", chars[i % chars.length], {
        "--x": x + "px",
        "--y": y + "px",
        "--dx": Math.cos(a) * d + "px",
        "--dy": Math.sin(a) * d - 25 + "px",
        "--rot": Math.round(Math.random() * 120 - 60) + "deg",
      });
    }
  }
  function catRain(n = 36) {
    if (reduceMotion) return;
    const chars = ["🐱", "😺", "😸", "😻", "🐾", "🐈"];
    for (let i = 0; i < n; i++) {
      const s = spawnFx(
        "fx--rain",
        pick(chars),
        {
          "--x": Math.round(Math.random() * window.innerWidth) + "px",
          "--dx": Math.round(Math.random() * 120 - 60) + "px",
          "--rot": Math.round(Math.random() * 540 - 270) + "deg",
          "--dur": (2.4 + Math.random() * 1.8).toFixed(2) + "s",
        },
        Math.random() * 1.2
      );
      s.style.fontSize = (1.2 + Math.random() * 1.4).toFixed(2) + "rem";
    }
  }
  // Center of an element, or the pointer position when the click came from a pointer
  function eventPoint(ev, el) {
    if (ev && (ev.clientX || ev.clientY)) return [ev.clientX, ev.clientY];
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  // Shared with the dress-up studio (creator.js)
  window.CROCAT_UI = { toast, burst, catRain, eventPoint, store, reduceMotion };

  /* ---- Contract address + copy ---- */
  const ca = cfg.contractAddress || "";
  const caOk = /^0x[a-fA-F0-9]{6,}$/.test(ca);
  setText("caAddr", ca || "0x50A04Df44FB512b4D6D0B189e43A512E33193174");
  $$("[data-ca-short]").forEach((el) => {
    el.textContent = caOk ? ca.slice(0, 6) + "…" + ca.slice(-4) : "0x50A04Df44FB512b4D6D0B189e43A512E33193174";
  });

  const COPY_LINES = [
    "CA copied! Paste it on VVS 🐾",
    "Copied. The cat approves 😼",
    "CA in your clipboard. Go get 'em 🐱",
  ];
  async function copyCA(btn, ev) {
    try {
      await navigator.clipboard.writeText(ca);
    } catch (_) {
      const t = document.createElement("textarea");
      t.value = ca;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    toast(pick(COPY_LINES));
    const [x, y] = eventPoint(ev, btn);
    burst(x, y, ["🐾"], 7);
    if (btn.id === "caCopy") {
      const label = $("span", btn);
      if (label) label.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        if (label) label.textContent = "Copy";
        btn.classList.remove("copied");
      }, 1600);
    }
  }
  $$("[data-copy-ca]").forEach((btn) => {
    if (!caOk) {
      btn.disabled = true;
      btn.style.opacity = ".6";
      btn.style.cursor = "not-allowed";
      if (btn.id === "caCopy") {
        const label = $("span", btn);
        if (label) label.textContent = "Soon";
      }
      return;
    }
    btn.setAttribute("title", "Copy contract address");
    btn.addEventListener("click", (ev) => copyCA(btn, ev));
  });

  /* ---- Nav: mobile menu, scrolled state, active section ---- */
  const nav = $("#nav");
  const burger = $("#navBurger");
  const links = $("#navLinks");
  function setMenu(open) {
    if (!burger || !links) return;
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (burger && links) {
    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      setMenu(!links.classList.contains("open"));
    });
    $$("a", links).forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );
    document.addEventListener("click", (e) => {
      if (links.classList.contains("open") && !e.target.closest("#nav"))
        setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
  }

  const onScroll = () => {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (links && "IntersectionObserver" in window) {
    const navMap = new Map(
      $$("a[href^='#']", links).map((a) => [a.getAttribute("href").slice(1), a])
    );
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          navMap.forEach((a) => a.classList.remove("is-active"));
          const a = navMap.get(en.target.id);
          if (a) a.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    $$("main section[id]").forEach((sec) => spy.observe(sec));
  }

  /* ---- Live market stats (DexScreener public API) ---- */
  const live = cfg.liveStats || {};
  const liveBox = $("#liveStats");
  if (liveBox) {
    if (live.enabled === false || !caOk) {
      liveBox.classList.add("hidden");
    } else {
      const usd = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumSignificantDigits: 3,
      });
      const fmtPrice = (p) => {
        if (!isFinite(p) || p <= 0) return "-";
        if (p >= 1) return "$" + p.toFixed(2);
        // keep 3 significant digits for tiny prices: 0.0009198 -> $0.000920
        return "$" + p.toFixed(Math.min(18, Math.ceil(-Math.log10(p)) + 2));
      };
      const moodFor = (ch) =>
        ch >= 10
          ? "full zoomies mode 😼"
          : ch >= 0
          ? "purring along 😺"
          : ch > -10
          ? "nap mode 😴"
          : "hiding in the box 📦";
      const chain = live.chainId || "cronos";
      const url = "https://api.dexscreener.com/latest/dex/tokens/" + ca;

      let loadedOnce = false;
      const load = async () => {
        try {
          const r = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const data = await r.json();
          const pairs = (data.pairs || []).filter(
            (p) =>
              p.chainId === chain &&
              p.baseToken &&
              String(p.baseToken.address).toLowerCase() === ca.toLowerCase()
          );
          if (!pairs.length) throw new Error("no pairs");
          pairs.sort(
            (a, b) =>
              ((b.liquidity && b.liquidity.usd) || 0) -
              ((a.liquidity && a.liquidity.usd) || 0)
          );
          const main = pairs[0];
          const liq = pairs.reduce(
            (s, p) => s + ((p.liquidity && p.liquidity.usd) || 0),
            0
          );
          const vol = pairs.reduce(
            (s, p) => s + ((p.volume && p.volume.h24) || 0),
            0
          );
          const mcap = main.marketCap || main.fdv || 0;
          const ch = Number(main.priceChange && main.priceChange.h24);

          setText("livePrice", fmtPrice(Number(main.priceUsd)));
          setText("liveMcap", mcap ? usd.format(mcap) : "-");
          setText("liveLiq", liq ? usd.format(liq) : "-");
          setText("liveVol", usd.format(vol));

          const delta = $("#liveChange");
          if (delta) {
            delta.textContent = "";
            if (isFinite(ch)) {
              const up = ch >= 0;
              delta.className = "tile__delta " + (up ? "is-up" : "is-down");
              delta.append(
                (up ? "▲ +" : "▼ −") + Math.abs(ch).toFixed(2) + "% "
              );
              const small = document.createElement("small");
              small.textContent = "24h";
              delta.append(small);
              setText("liveMood", moodFor(ch));
            }
          }
          liveBox.classList.remove("is-loading", "hidden");
          loadedOnce = true;
        } catch (_) {
          // API down / no pairs: hide the strip instead of showing broken numbers
          if (!loadedOnce) liveBox.classList.add("hidden");
        }
      };
      load();
      const every = Math.max(20, live.refreshSec || 60) * 1000;
      setInterval(() => {
        if (!document.hidden) load();
      }, every);
    }
  }

  /* ---- Pet the cat ---- */
  const pet = $("#petCat");
  const bubble = $("#petBubble");
  const hint = $("#petHint");
  const PET_KEY = "crocat_pets";
  const PET_GOAL = 9;
  const PET_LINES = [
    "purrrr…",
    "mrrp? 🐾",
    "gm fren",
    "more chin scratches pls",
    "I'd like 1 (one) treat",
    "that's the spot 😻",
    "not financial advice, just vibes",
    "*knocks your coffee off the table*",
    "lives lost today: 0",
    "zoomies in 3… 2…",
    "wen treats?",
    "ok but have you said gm yet",
  ];
  let pets = parseInt(store.get(PET_KEY, "0"), 10) || 0;
  let lastLine = -1;
  let bubbleTimer = 0;

  function renderHint() {
    if (!hint) return;
    if (pets <= 0) {
      hint.textContent = "psst… pet the cat 👆";
      return;
    }
    if (pets < PET_GOAL) {
      const b = document.createElement("b");
      b.textContent = pets + " / " + PET_GOAL;
      hint.replaceChildren(b, " pets · something happens at nine 👀");
      return;
    }
    hint.textContent = "🏆 nine lives unlocked · " + pets + " pets given";
  }
  function say(line) {
    if (!bubble) return;
    bubble.textContent = line;
    bubble.classList.add("is-on");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("is-on"), 1800);
  }
  if (pet) {
    renderHint();
    pet.addEventListener("click", (ev) => {
      pets += 1;
      store.set(PET_KEY, pets);

      let idx;
      do {
        idx = Math.floor(Math.random() * PET_LINES.length);
      } while (idx === lastLine && PET_LINES.length > 1);
      lastLine = idx;

      pet.classList.remove("is-petted");
      void pet.offsetWidth; // restart the squish animation
      pet.classList.add("is-petted");

      const [x, y] = eventPoint(ev, pet);
      burst(x, y, ["💛", "🐾", "✨"], 6);

      if (pets === PET_GOAL) {
        say("ok fine, you're my favorite 😻");
        catRain();
        toast("🏆 Nine lives unlocked! CroCat officially likes you.", 3200);
      } else if (pets > PET_GOAL && pets % 25 === 0) {
        say("you again? never stop 😻");
        catRain(20);
        toast(pets + " pets?! Absolute legend 🐾");
      } else {
        say(PET_LINES[idx]);
      }
      renderHint();
    });
  }

  /* ---- Meme lightbox ---- */
  const dlg = $("#lightbox");
  const lbImg = $("#lightboxImg");
  const lbCap = $("#lightboxCap");
  const lbDl = $("#lightboxDl");
  const lbPost = $("#lightboxPost");
  $$(".meme").forEach((m) => {
    m.addEventListener("click", () => {
      const full = m.getAttribute("data-full");
      const thumb = $("img", m);
      const caption = ($(".meme__cap", m) || {}).textContent || "";
      if (!dlg || typeof dlg.showModal !== "function") {
        window.open(full, "_blank", "noopener");
        return;
      }
      lbImg.src = full;
      lbImg.alt = thumb ? thumb.alt : "";
      lbCap.textContent = caption;
      lbDl.href = full;
      lbDl.setAttribute("download", "crocat-" + full.split("/").pop());
      lbPost.href = tweetIntent(
        caption + " 😹\n\n$CROCAT, the cat of Cronos 🐾\n{url}"
      );
      dlg.showModal();
    });
  });
  if (dlg) {
    const closeBtn = $("#lbClose");
    if (closeBtn) closeBtn.addEventListener("click", () => dlg.close());
    // Close when clicking the backdrop (outside the dialog box)
    dlg.addEventListener("click", (e) => {
      const r = dlg.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      if (e.target === dlg && !inside) dlg.close();
    });
    if (lbDl)
      lbDl.addEventListener("click", () => toast("Saved! Now go post it 😼"));
  }

  /* ---- Scroll reveal ---- */
  const revealEls = $$(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          ro.unobserve(en.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => ro.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---- Footer year ---- */
  setText("year", new Date().getFullYear());
})();
