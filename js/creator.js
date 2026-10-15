/* =========================================================================
   CROCAT — CREATE YOUR CROCAT (dress-up studio)
   Live preview = stacked <img> layers · export = the same layers on a canvas
   (clean PFP download + branded share card for X).
   ========================================================================= */
(function () {
  "use strict";
  const data = window.CROCAT_CREATOR;
  const root = document.getElementById("create");
  if (!data || !root || !Array.isArray(data.categories)) return;

  const cfg = window.CROCAT_CONFIG || {};
  const ui = window.CROCAT_UI || {};
  const toast = ui.toast || (() => {});
  const burst = ui.burst || (() => {});
  const catRain = ui.catRain || (() => {});
  const eventPoint =
    ui.eventPoint ||
    ((ev, el) => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    });
  const store = ui.store || {
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
  const $ = (sel) => root.querySelector(sel);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const SIZE = 1024; // asset canvas (px)
  const OUT = 1080; // exported PFP / card size (px)
  const OUTFIT_KEY = "crocat_outfit";
  const SECRETS_KEY = "crocat_secrets";

  const cats = data.categories;
  const byId = Object.fromEntries(cats.map((c) => [c.id, c]));
  // Wearables, in draw order over the base cat (their "-back" layers go under it)
  const WEAR = ["pants", "top", "hat"].filter((id) => byId[id]);
  const LAYERS = ["bg", ...WEAR.map((id) => id + "-back"), "base", ...WEAR];
  const secrets = Array.isArray(data.secrets) ? data.secrets : [];
  const TOTAL = cats.reduce((n, c) => n * c.items.length, 1);
  const DIGITS = String(TOTAL - 1).length;
  // Rounded down for display: 14,641 → "10,000+"
  const ROUND = 10 ** Math.floor(Math.log10(TOTAL));
  const TOTAL_LABEL =
    TOTAL % ROUND
      ? (Math.floor(TOTAL / ROUND) * ROUND).toLocaleString("en-US") + "+"
      : TOTAL.toLocaleString("en-US");

  const PET_LINES = [
    "purrrr…",
    "rate my fit 1-10 😼",
    "fit check ✅",
    "do I look expensive?",
    "mrrp? 🐾",
    "I'd like 1 (one) treat",
    "new PFP material right here",
  ];

  /* ---------- Paths ---------- */
  // ext: item → category → global (so final assets can replace placeholders bit by bit)
  const fileUrl = (path, ext) =>
    data.dir +
    path +
    (/\.\w+$/.test(path) ? "" : "." + (ext || data.ext || "png"));
  // variant: "back" (layer behind the cat) or "cut" (mask of what the item hides on the base cat)
  const layerUrl = (cat, item, variant) =>
    item.none
      ? null
      : fileUrl(
          cat.id + "/" + item.id + (variant ? "-" + variant : ""),
          item.ext || cat.ext
        );
  // Masks of the items worn right now (only items with cut: true have one)
  const cutsNow = () =>
    WEAR.map((cid) => {
      const it = current(cid);
      return it.cut
        ? {
            cut: layerUrl(byId[cid], it, "cut"),
            layer: layerUrl(byId[cid], it),
          }
        : null;
    }).filter(Boolean);

  /* ---------- State ---------- */
  const findItem = (cid, id) => byId[cid].items.find((it) => it.id === id);
  const current = (cid) => findItem(cid, outfit[cid]) || byId[cid].items[0];

  function normalize(src) {
    const out = {};
    cats.forEach((c) => {
      const want = src && src[c.id];
      const def = data.defaults && data.defaults[c.id];
      out[c.id] = findItem(c.id, want)
        ? want
        : findItem(c.id, def)
        ? def
        : c.items[0].id;
    });
    return out;
  }
  const lookCode = () => cats.map((c) => outfit[c.id]).join(".");
  function parseLook(code) {
    if (!code) return null;
    const ids = String(code).split(".");
    if (ids.length !== cats.length) return null;
    const o = {};
    cats.forEach((c, i) => {
      o[c.id] = ids[i];
    });
    return cats.every((c) => findItem(c.id, o[c.id])) ? o : null;
  }

  const sharedLook = parseLook(
    new URLSearchParams(location.search).get("look")
  );
  let saved = null;
  try {
    saved = JSON.parse(store.get(OUTFIT_KEY, "null"));
  } catch (_) {}
  let outfit = normalize(sharedLook || saved || data.defaults);
  let catName = cleanName((saved && saved.name) || "");
  let found = new Set();
  try {
    found = new Set(JSON.parse(store.get(SECRETS_KEY, "[]")));
  } catch (_) {}
  // Forget ids of secrets that no longer exist (so the counter stays right)
  found = new Set([...found].filter((id) => secrets.some((s) => s.id === id)));

  function save() {
    store.set(
      OUTFIT_KEY,
      JSON.stringify(Object.assign({ name: catName }, outfit))
    );
  }
  function cleanName(s) {
    return String(s)
      .replace(/[^\p{L}\p{N} _.'!-]/gu, "")
      .slice(0, 18);
  }

  function lookNumber() {
    let n = 0;
    cats.forEach((c) => {
      n =
        n * c.items.length +
        Math.max(
          0,
          c.items.findIndex((it) => it.id === outfit[c.id])
        );
    });
    return "#" + String(n).padStart(DIGITS, "0");
  }
  const displayName = () => catName.trim() || "CroCat " + lookNumber();
  const matches = (s) =>
    Object.keys(s.need).every((k) => [].concat(s.need[k]).includes(outfit[k]));
  const activeSecret = () => secrets.find(matches) || null;

  function shareUrl() {
    let u;
    try {
      u = new URL(cfg.siteUrl || location.href);
    } catch (_) {
      u = new URL(location.href);
    }
    u.search = "";
    u.searchParams.set("look", lookCode());
    u.hash = "create";
    return u.toString();
  }

  /* ---------- DOM ---------- */
  const el = {
    stage: $("#ccStage"),
    bubble: $("#ccBubble"),
    ribbon: $("#ccRibbon"),
    caption: $("#ccCaption"),
    number: $("#ccNumber"),
    desc: $("#ccDesc"),
    tabs: $("#ccTabs"),
    options: $("#ccOptions"),
    name: $("#ccName"),
    random: $("#ccRandom"),
    reset: $("#ccReset"),
    download: $("#ccDownload"),
    share: $("#ccShare"),
    copy: $("#ccCopyLink"),
    hint: $("#ccShareHint"),
    secrets: $("#ccSecrets"),
    secretCount: $("#ccSecretCount"),
  };
  const layers = {};
  const tabs = {};
  let catBtn = null;
  let activeCat = cats[0].id;

  function buildStage() {
    catBtn = document.createElement("button");
    catBtn.type = "button";
    catBtn.className = "studio__cat";
    catBtn.setAttribute("aria-label", "Pet your CroCat");
    LAYERS.forEach((key) => {
      const img = document.createElement("img");
      img.alt = "";
      img.draggable = false;
      img.decoding = "async";
      img.hidden = true;
      img.dataset.layer = key;
      layers[key] = img;
      (key === "bg" ? el.stage : catBtn).appendChild(img);
    });
    el.stage.appendChild(catBtn);
    catBtn.addEventListener("click", petCat);
  }

  function setLayer(key, url, fit, animate) {
    const img = layers[key];
    img.style.transform = fit
      ? `translate(${((fit.x || 0) / SIZE) * 100}%, ${
          ((fit.y || 0) / SIZE) * 100
        }%) scale(${fit.scale || 1})`
      : "";
    img.dataset.want = url || "";
    if (!url) {
      img.hidden = true;
      img.removeAttribute("src");
      return;
    }
    if (img.getAttribute("src") === url) {
      img.hidden = false;
      return;
    }
    // Preload first so the old layer stays put until the new one is ready
    const pre = new Image();
    pre.onload = () => {
      if (img.dataset.want !== url) return; // a newer pick already replaced it
      img.src = url;
      img.hidden = false;
      if (animate) {
        img.classList.remove("is-new");
        void img.offsetWidth;
        img.classList.add("is-new");
      }
    };
    pre.onerror = () => {
      if (img.dataset.want !== url) return;
      img.hidden = true;
      console.warn("[creator] missing layer:", url);
    };
    pre.src = url;
  }

  // Masks the base cat with the "-cut" of each item worn (CSS mask, intersected).
  // Waits for the masks and their items to load, so the base never loses its ears
  // before the hat shows up. A missing mask is skipped (a broken mask would hide the whole cat).
  let cutToken = 0;
  function setCuts(list) {
    const token = ++cutToken;
    const img = layers.base;
    const apply = (urls) => {
      if (token !== cutToken) return;
      const v = urls.map((u) => `url("${u}")`).join(", ");
      img.style.webkitMaskImage = v;
      img.style.maskImage = v;
    };
    if (!list.length) {
      apply([]);
      return;
    }
    Promise.all(
      list.map((c) =>
        Promise.all([loadImg(c.cut), loadImg(c.layer).catch(() => null)]).then(
          () => c.cut,
          () => {
            console.warn("[creator] missing cut mask:", c.cut);
            return null;
          }
        )
      )
    ).then((urls) => apply(urls.filter(Boolean)));
  }

  // changed: category id, "all" (animate everything) or nothing (no animation)
  function render(changed) {
    const anim = (cid) => changed === "all" || changed === cid;
    if (byId.bg) {
      const bg = current("bg");
      setLayer("bg", layerUrl(byId.bg, bg), bg.fit, anim("bg"));
    }
    setLayer("base", fileUrl(data.base), null, false);
    WEAR.forEach((cid) => {
      const it = current(cid);
      setLayer(cid, layerUrl(byId[cid], it), it.fit, anim(cid));
      setLayer(
        cid + "-back",
        it.back ? layerUrl(byId[cid], it, "back") : null,
        it.fit,
        anim(cid)
      );
    });
    setCuts(cutsNow());
    renderMeta();
  }

  function renderMeta() {
    const num = lookNumber();
    el.caption.textContent = displayName();
    el.number.textContent = catName.trim()
      ? "CroCat " + num + " · 1 of " + TOTAL_LABEL
      : "1 of " + TOTAL_LABEL + " possible cats";
    const sec = activeSecret();
    el.ribbon.textContent = sec ? "✨ " + sec.name : "";
    el.ribbon.classList.toggle("hidden", !sec);
    if (el.desc) {
      el.desc.textContent =
        "Your CroCat: " +
        WEAR.map((cid) => current(cid).name).join(", ") +
        (byId.bg ? ", on " + current("bg").name : "") +
        ".";
    }
    cats.forEach((c) => {
      const t = tabs[c.id];
      if (t) t.querySelector("small").textContent = current(c.id).name;
    });
    el.options.querySelectorAll(".opt").forEach((b) => {
      b.setAttribute(
        "aria-pressed",
        String(outfit[activeCat] === b.dataset.id)
      );
    });
  }

  /* ---------- Tabs + options ---------- */
  function buildTabs() {
    cats.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "studio__tab";
      b.id = "ccTab-" + c.id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", "ccOptions");
      const icon = document.createElement("span");
      icon.className = "studio__tabIcon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = c.icon || "";
      const label = document.createElement("b");
      label.textContent = c.label;
      b.append(icon, label, document.createElement("small"));
      b.addEventListener("click", () => showCat(c.id));
      b.addEventListener("keydown", (e) => {
        const k = e.key;
        let j =
          k === "ArrowRight"
            ? i + 1
            : k === "ArrowLeft"
            ? i - 1
            : k === "Home"
            ? 0
            : k === "End"
            ? cats.length - 1
            : null;
        if (j == null) return;
        e.preventDefault();
        j = (j + cats.length) % cats.length;
        showCat(cats[j].id);
        tabs[cats[j].id].focus();
      });
      tabs[c.id] = b;
      el.tabs.appendChild(b);
    });
  }

  // Background-position (%) that centers fraction f of the image at zoom z
  const focusPos = (f, z) =>
    z <= 1 ? 50 : Math.min(100, Math.max(0, ((f * z - 0.5) / (z - 1)) * 100));

  function optionButton(cat, it, i) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "opt";
    b.dataset.id = it.id;
    b.style.setProperty("--i", i);
    const pic = document.createElement("span");
    pic.className = "opt__img" + (it.none ? " opt__img--none" : "");
    pic.setAttribute("aria-hidden", "true");
    if (!it.none) {
      const th = cat.thumb || {};
      const z = th.zoom || 1;
      const urls = [layerUrl(cat, it)];
      if (it.back) urls.push(layerUrl(cat, it, "back"));
      pic.style.backgroundImage = urls.map((u) => `url("${u}")`).join(", ");
      pic.style.backgroundSize = z * 100 + "%";
      pic.style.backgroundPosition =
        focusPos(th.x == null ? 0.5 : th.x, z) +
        "% " +
        focusPos(th.y == null ? 0.5 : th.y, z) +
        "%";
    }
    const name = document.createElement("span");
    name.className = "opt__name";
    name.textContent = it.name;
    b.append(pic, name);
    b.addEventListener("click", () => choose(cat.id, it.id));
    return b;
  }

  function showCat(cid) {
    activeCat = cid;
    cats.forEach((c) => {
      const on = c.id === cid;
      tabs[c.id].setAttribute("aria-selected", String(on));
      tabs[c.id].tabIndex = on ? 0 : -1;
    });
    el.options.setAttribute("aria-labelledby", "ccTab-" + cid);
    el.options.replaceChildren(
      ...byId[cid].items.map((it, i) => optionButton(byId[cid], it, i))
    );
    renderMeta();
  }

  /* ---------- Actions ---------- */
  let bubbleTimer = 0;
  function say(line) {
    if (!line || !el.bubble) return;
    el.bubble.textContent = line;
    el.bubble.classList.add("is-on");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => el.bubble.classList.remove("is-on"), 2400);
  }

  function choose(cid, id) {
    const changed = outfit[cid] !== id;
    outfit[cid] = id;
    if (changed) {
      save();
      render(cid);
    }
    say(current(cid).line);
    if (changed) checkSecrets();
  }

  function randomize(ev) {
    const before = lookCode();
    for (let i = 0; i < 5 && lookCode() === before; i++)
      cats.forEach((c) => {
        outfit[c.id] = pick(c.items).id;
      });
    save();
    render("all");
    el.stage.classList.remove("is-shuffled");
    void el.stage.offsetWidth;
    el.stage.classList.add("is-shuffled");
    const [x, y] = eventPoint(ev, el.random);
    burst(x, y, ["✨", "🎲", "🐾"], 8);
    say(
      pick([
        "new fit, who dis? ✨",
        "ooh, spicy 🌶️",
        "the dice have spoken 🎲",
        "I can work with this",
      ])
    );
    checkSecrets();
  }

  function reset() {
    outfit = normalize(data.defaults);
    save();
    render("all");
    say("back to basics 🐾");
  }

  function petCat(ev) {
    catBtn.classList.remove("is-petted");
    void catBtn.offsetWidth;
    catBtn.classList.add("is-petted");
    const [x, y] = eventPoint(ev, catBtn);
    burst(x, y, ["💛", "🐾", "✨"], 6);
    const lines = PET_LINES.concat(
      WEAR.map((cid) => current(cid).line).filter(Boolean)
    );
    say(pick(lines));
  }

  /* ---------- Secret looks ---------- */
  function renderSecrets() {
    if (!el.secrets) return;
    el.secretCount.textContent = found.size + "/" + secrets.length;
    el.secrets.replaceChildren(
      ...secrets.map((s) => {
        const li = document.createElement("li");
        const b = document.createElement("button");
        b.type = "button";
        const got = found.has(s.id);
        b.className = "secret" + (got ? " is-found" : "");
        b.textContent = got ? "🏆 " + s.name : "🔒 ???";
        b.title = got ? "Wear it again" : "Hint: " + s.hint;
        b.addEventListener("click", () => {
          if (!got) {
            toast("💡 Hint: " + s.hint);
            return;
          }
          Object.keys(s.need).forEach((k) => {
            outfit[k] = [].concat(s.need[k])[0];
          });
          save();
          render("all");
          say(s.name + " is back 😼");
        });
        li.appendChild(b);
        return li;
      })
    );
  }

  function checkSecrets() {
    // A look can match more than one secret: unlock them all at once
    const fresh = secrets.filter((s) => matches(s) && !found.has(s.id));
    if (!fresh.length) return;
    fresh.forEach((s) => found.add(s.id));
    store.set(SECRETS_KEY, JSON.stringify([...found]));
    renderSecrets();
    toast(
      "🏆 Secret look" +
        (fresh.length > 1 ? "s" : "") +
        " unlocked: " +
        fresh.map((s) => s.name).join(" + ") +
        "!",
      3200
    );
    catRain(found.size === secrets.length ? 40 : 22);
    if (found.size === secrets.length)
      setTimeout(
        () => toast("👑 All secret looks found. Absolute fashion icon.", 3600),
        3400
      );
  }

  /* ---------- Export (canvas) ---------- */
  const loadImg = (url) =>
    new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });

  // Draws the current look into a size×size square at (x, y)
  async function drawLook(ctx, x, y, size) {
    const list = [];
    const add = (url, fit, cuts) => {
      if (url) list.push({ url, fit, cuts });
    };
    if (byId.bg) add(layerUrl(byId.bg, current("bg")), current("bg").fit);
    WEAR.forEach((cid) => {
      const it = current(cid);
      if (it.back) add(layerUrl(byId[cid], it, "back"), it.fit);
    });
    add(
      fileUrl(data.base),
      null,
      cutsNow().map((c) => c.cut)
    );
    WEAR.forEach((cid) =>
      add(layerUrl(byId[cid], current(cid)), current(cid).fit)
    );
    const load = (url) => loadImg(url).catch(() => null);
    const imgs = await Promise.all(
      list.map(async (l) => ({
        img: await load(l.url),
        fit: l.fit || {},
        cuts: (await Promise.all((l.cuts || []).map(load))).filter(Boolean),
      }))
    );
    const k = size / SIZE;
    imgs.forEach((o) => {
      if (!o.img) return;
      let src = o.img;
      if (o.cuts.length) {
        // same as the CSS mask of the live preview
        const n = Math.ceil(size);
        const c = makeCanvas(n, n);
        const cx = c.getContext("2d");
        cx.drawImage(o.img, 0, 0, n, n);
        cx.globalCompositeOperation = "destination-in";
        o.cuts.forEach((m) => cx.drawImage(m, 0, 0, n, n));
        src = c;
      }
      const w = size * (o.fit.scale || 1);
      ctx.drawImage(
        src,
        x + (size - w) / 2 + (o.fit.x || 0) * k,
        y + (size - w) / 2 + (o.fit.y || 0) * k,
        w,
        w
      );
    });
  }

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  const toBlob = (c) =>
    new Promise((res, rej) =>
      c.toBlob(
        (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
        "image/png"
      )
    );

  async function fontsReady() {
    if (!document.fonts) return;
    try {
      await Promise.all(
        ["64px 'Gochi Hand'", "700 36px 'Fredoka'", "600 28px 'Fredoka'"].map(
          (f) => document.fonts.load(f)
        )
      );
    } catch (_) {}
  }

  function roundPath(c2d, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c2d.beginPath();
    c2d.moveTo(x + r, y);
    c2d.arcTo(x + w, y, x + w, y + h, r);
    c2d.arcTo(x + w, y + h, x, y + h, r);
    c2d.arcTo(x, y + h, x, y, r);
    c2d.arcTo(x, y, x + w, y, r);
    c2d.closePath();
  }
  function hexPath(c2d, cx, cy, r) {
    c2d.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      c2d[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    c2d.closePath();
  }
  // Shrinks the font until the text fits the width (weight e.g. "600 " or "")
  function fitFont(c2d, text, weight, family, max, min, width) {
    let fs = max;
    c2d.font = weight + fs + "px " + family;
    while (fs > min && c2d.measureText(text).width > width) {
      fs -= 2;
      c2d.font = weight + fs + "px " + family;
    }
  }

  async function buildPfp() {
    const c = makeCanvas(OUT, OUT);
    await drawLook(c.getContext("2d"), 0, 0, OUT);
    return c;
  }

  // 1080×1080 card: tilted polaroid with the cat + name + branding
  async function buildCard() {
    await fontsReady();
    const W = OUT;
    const c = makeCanvas(W, W);
    const x = c.getContext("2d");

    const g = x.createLinearGradient(0, 0, 0, W);
    g.addColorStop(0, "#1a5fd6");
    g.addColorStop(0.55, "#1446b0");
    g.addColorStop(1, "#0a1e5e");
    x.fillStyle = g;
    x.fillRect(0, 0, W, W);
    x.strokeStyle = "rgba(255,255,255,.08)";
    x.lineWidth = 18;
    hexPath(x, W / 2, 460, 560);
    x.stroke();
    x.lineWidth = 12;
    hexPath(x, W / 2, 460, 450);
    x.stroke();

    const fw = 720,
      fh = 830,
      fx = (W - fw) / 2,
      fy = 44,
      pad = 28,
      side = fw - pad * 2;
    x.save();
    x.translate(W / 2, fy + fh / 2);
    x.rotate((-2.2 * Math.PI) / 180);
    x.translate(-W / 2, -(fy + fh / 2));
    x.fillStyle = "#0a1130";
    roundPath(x, fx, fy + 12, fw, fh, 16);
    x.fill();
    x.fillStyle = "#ffffff";
    roundPath(x, fx, fy, fw, fh, 16);
    x.fill();
    x.lineWidth = 6;
    x.strokeStyle = "#0a1130";
    x.stroke();
    x.save();
    roundPath(x, fx + pad, fy + pad, side, side, 6);
    x.clip();
    x.fillStyle = "#e3f1ff";
    x.fillRect(fx + pad, fy + pad, side, side);
    await drawLook(x, fx + pad, fy + pad, side);
    x.restore();
    x.lineWidth = 4;
    roundPath(x, fx + pad, fy + pad, side, side, 6);
    x.stroke();

    x.textAlign = "center";
    x.textBaseline = "middle";
    const title = displayName();
    x.fillStyle = "#0a1130";
    fitFont(
      x,
      title,
      "",
      "'Gochi Hand', 'Comic Sans MS', cursive",
      72,
      36,
      fw - 80
    );
    x.fillText(title, W / 2, fy + pad + side + 56);
    const sec = activeSecret();
    const sub =
      (catName.trim()
        ? "CroCat " + lookNumber()
        : "1 of " + TOTAL_LABEL + " possible cats") +
      (sec ? " · ✨ " + sec.name : "");
    x.fillStyle = "#46527a";
    fitFont(x, sub, "600 ", "'Fredoka', Arial, sans-serif", 28, 18, fw - 80);
    x.fillText(sub, W / 2, fy + pad + side + 106);

    x.fillStyle = "rgba(255,197,61,.85)";
    x.translate(W / 2, fy);
    x.rotate((4 * Math.PI) / 180);
    x.fillRect(-84, -20, 168, 40);
    x.restore();

    let host = "";
    try {
      host = new URL(cfg.siteUrl || location.href).host;
    } catch (_) {}
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#ffffff";
    x.font = "700 36px 'Fredoka', Arial, sans-serif";
    x.fillText(
      (cfg.ticker || "$CROCAT") + " · " + (cfg.tagline || "The Cat of Cronos"),
      W / 2,
      962
    );
    x.fillStyle = "#cfe0ff";
    x.font = "600 27px 'Fredoka', Arial, sans-serif";
    x.fillText("Create yours" + (host ? " at " + host : ""), W / 2, 1014);
    return c;
  }

  function fileName(suffix) {
    const slug =
      displayName()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "") || "crocat";
    return (
      (slug.startsWith("crocat") ? slug : "crocat-" + slug) +
      (suffix ? "-" + suffix : "") +
      ".png"
    );
  }
  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function downloadPfp(ev) {
    const [x, y] = eventPoint(ev, el.download);
    try {
      downloadBlob(await toBlob(await buildPfp()), fileName());
      burst(x, y, ["🐾", "✨"], 7);
      toast("Saved! Go set it as your PFP 😼");
    } catch (_) {
      toast("Couldn't export the image 😿 Try another browser.");
    }
  }

  const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // Note under the buttons: the card is in the clipboard (copied) or was
  // downloaded. openX = link to X for when the popup got blocked
  function showHint(blob, copied, openX) {
    if (!el.hint) return;
    const link = (txt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "studio__hintLink";
      b.textContent = txt;
      return b;
    };
    el.hint.replaceChildren();
    if (copied) {
      const k = document.createElement("kbd");
      k.textContent = MAC ? "⌘ V" : "Ctrl V";
      const dl = link("or download it");
      dl.addEventListener("click", () => downloadBlob(blob, fileName("card")));
      el.hint.append(
        "📋 Card copied! In the X post press ",
        k,
        " to attach it 😺 ",
        dl
      );
    } else {
      const b = document.createElement("b");
      b.textContent = fileName("card");
      el.hint.append(
        "📸 Saved your card! Attach ",
        b,
        " to the post before posting 😺"
      );
    }
    if (openX) {
      const a = document.createElement("a");
      a.href = openX;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "studio__hintLink";
      a.textContent = "Open X ↗";
      el.hint.append(" ", a);
    }
    el.hint.classList.remove("hidden");
  }
  function saveCard(blob) {
    downloadBlob(blob, fileName("card"));
    showHint(blob, false);
  }

  // Puts the PNG on the clipboard. Takes the Promise<Blob> so the copy starts
  // right inside the click (Safari needs that); retries with the Blob for
  // browsers that only accept a ready Blob
  async function copyImage(card) {
    if (
      !navigator.clipboard ||
      !navigator.clipboard.write ||
      !window.ClipboardItem
    )
      throw new Error("no clipboard");
    try {
      return await navigator.clipboard.write([
        new ClipboardItem({ "image/png": card }),
      ]);
    } catch (_) {
      return navigator.clipboard.write([
        new ClipboardItem({ "image/png": await card }),
      ]);
    }
  }

  async function share() {
    const tpl = cfg.creatorShareText || "Meet {name}, my CroCat 🐱\n{url}";
    const text = tpl
      .replace(/\{name\}/g, displayName())
      .replace(/\{url\}/g, shareUrl());
    const intent =
      "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
    const touch = !!(
      window.matchMedia && matchMedia("(pointer: coarse)").matches
    );

    // Desktop: X doesn't let a website attach an image to a post, so the card
    // goes to the clipboard (paste it in the composer) and then X opens.
    // X opens after the copy: Chrome only copies while this page has the focus
    if (!touch || !navigator.canShare) {
      const card = buildCard().then(toBlob);
      let copied = false,
        blob = null;
      try {
        await copyImage(card);
        copied = true;
      } catch (_) {}
      try {
        blob = await card;
      } catch (_) {}
      if (blob && !copied) downloadBlob(blob, fileName("card"));
      const w = window.open(intent, "_blank");
      if (w) w.opener = null;
      if (blob) showHint(blob, copied, w ? null : intent);
      else if (!w) location.href = intent;
      if (copied)
        toast(
          "📋 Card copied! Paste it in your post with " +
            (MAC ? "⌘V" : "Ctrl+V"),
          4200
        );
      return;
    }

    // Mobile: native share sheet with the card attached (X app, Telegram…)
    let blob = null;
    try {
      blob = await toBlob(await buildCard());
    } catch (_) {
      blob = null;
    }
    if (blob) {
      const file = new File([blob], fileName("card"), { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text });
          return;
        } catch (e) {
          if (e && e.name === "AbortError") return;
        }
      }
      saveCard(blob);
    }
    // Fallback: the X composer with the text (card already downloaded).
    // If the popup gets blocked, go there in this tab (the look is saved).
    const w = window.open(intent, "_blank");
    if (w) w.opener = null;
    else location.href = intent;
  }

  async function copyLink(ev) {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      const t = document.createElement("textarea");
      t.value = url;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    const [x, y] = eventPoint(ev, el.copy);
    burst(x, y, ["🔗", "🐾"], 6);
    toast("Link copied! Anyone who opens it sees this exact CroCat 🐱");
  }

  /* ---------- Init (only when the section gets close to the viewport) ---------- */
  let started = false;
  function start() {
    if (started) return;
    started = true;
    buildStage();
    buildTabs();
    showCat(activeCat);
    render();
    renderSecrets();

    if (el.name) {
      el.name.value = catName;
      el.name.addEventListener("input", () => {
        const v = cleanName(el.name.value);
        if (v !== el.name.value) el.name.value = v;
        catName = v;
        save();
        renderMeta();
      });
    }
    el.random && el.random.addEventListener("click", randomize);
    el.reset && el.reset.addEventListener("click", reset);
    el.download && el.download.addEventListener("click", downloadPfp);
    el.share && el.share.addEventListener("click", share);
    el.copy && el.copy.addEventListener("click", copyLink);

    if (sharedLook) setTimeout(() => say("someone sent you this look 👀"), 600);
    checkSecrets();
  }

  if (!sharedLook && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        io.disconnect();
        start();
      },
      { rootMargin: "900px 0px" }
    );
    io.observe(root);
  } else {
    start();
  }

  // Handy for debugging from the console
  window.CROCAT_STUDIO = {
    get outfit() {
      return Object.assign({}, outfit);
    },
    buildPfp,
    buildCard,
    shareUrl,
  };
})();
