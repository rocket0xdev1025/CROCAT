/* =========================================================================
   CROCAT — CATÁLOGO DEL "CREATE YOUR CROCAT"
   -------------------------------------------------------------------------
   Cada item es una capa WebP de 1024×1024 con fondo transparente, alineada
   al gato base (VisualAssets/WebsiteAssets/CroCatBase.png: el CroCat de
   frente, saltando, sin ropa). Las prendas salen de las fotos del mismo gato
   con cada prenda puesta. La ruta se arma sola:

       {dir}{categoría}/{id}.{ext}         → capa delantera
       {dir}{categoría}/{id}-back.{ext}    → capa trasera (solo si back: true)
       {dir}{categoría}/{id}-cut.{ext}     → máscara del gato base (solo si cut: true)

   La máscara "-cut" es blanca con transparencia: lo transparente se borra del
   gato base mientras se usa ese item (las orejas que quedan bajo un gorro,
   las piernas que reemplaza un pantalón…).

   👉 Para reemplazar un asset: copia el archivo con el MISMO nombre.
      Si viene en otro formato, `ext` también se puede poner en una categoría
      o en un item, y `base` acepta extensión ("base/crocat.png").

   Campos por item:
     id    — nombre del archivo (sin espacios ni puntos)
     name  — texto que ve el usuario
     line  — lo que dice el gato al ponérselo
     none  — true = opción "sin nada" (no carga imagen)
     back  — true = además tiene una capa detrás del gato (capas, capuchas…)
     cut   — true = además tiene una máscara "-cut" que esconde partes del gato base
     ext   — opcional, extensión solo para este item (si no, la de la categoría/global)
     fit   — ajuste fino opcional si un asset quedó corrido, en px del lienzo
             de 1024: { x: 0, y: -12, scale: 1.05 } (escala desde el centro).
             No mueve la máscara "-cut".
   ========================================================================= */

window.CROCAT_CREATOR = {
  dir: "assets/creator/",
  ext: "webp",
  base: "base/crocat", // gato base (sin ropa)

  // Orden de las pestañas. El orden de dibujo es fijo:
  // fondo → capas traseras → gato → pantalones → polera → gorro
  categories: [
    {
      id: "bg",
      label: "Background",
      icon: "🌄",
      thumb: { zoom: 1, x: 0.5, y: 0.5 },
      items: [
        {
          id: "studio",
          name: "Photo studio",
          line: "ready for my close-up 📸",
        },
        { id: "bed", name: "Cozy bedroom", line: "my favorite trampoline 🛏️" },
        {
          id: "kitchen",
          name: "Kitchen",
          line: "I can smell the tuna from here 🐟",
        },
        { id: "beach", name: "Summer beach", line: "sun's out, paws out ☀️" },
        {
          id: "birthday",
          name: "Birthday party",
          line: "is that cake for me? 🎂",
        },
        {
          id: "magic",
          name: "Magic land",
          line: "where do the mushrooms lead? 🍄",
        },
        {
          id: "dojo",
          name: "Dojo",
          line: "the dojo is open. sensei is napping",
        },
        { id: "snow", name: "Snow day", line: "brrr… my beans are cold ❄️" },
        { id: "space", name: "To the moon", line: "next stop: the moon 🚀" },
        { id: "chart", name: "Green candles", line: "only up from here 📈" },
        {
          id: "western",
          name: "Wild west",
          line: "this town ain't big enough 🌵",
        },
      ],
    },
    {
      id: "hat",
      label: "Hat",
      icon: "🎩",
      thumb: { zoom: 2.8, x: 0.495, y: 0.137 },
      items: [
        {
          id: "none",
          name: "No hat",
          none: true,
          line: "ears free, as nature intended",
        },
        { id: "cowboy", name: "Cowboy", cut: true, line: "yeehaw 🤠" },
        {
          id: "wizard",
          name: "Wizard",
          cut: true,
          line: "you're a wizard, meowy 🧙",
        },
        {
          id: "cap",
          name: "Jockey",
          cut: true,
          line: "no cap. ok, one cap 🧢",
        },
        { id: "santa", name: "Santa", line: "ho ho meow 🎅" },
        {
          id: "crown",
          name: "Crown",
          cut: true,
          line: "bow before the cat king 👑",
        },
        {
          id: "pirate",
          name: "Pirate",
          cut: true,
          line: "arr, where be the treats? 🏴‍☠️",
        },
        {
          id: "chef",
          name: "Chef",
          cut: true,
          line: "today's special: tuna 👨‍🍳",
        },
        {
          id: "tophat",
          name: "Top hat",
          cut: true,
          line: "how do you do, fren? 🎩",
        },
        { id: "beanie", name: "Beanie", cut: true, line: "cozy ears only 🧶" },
        {
          id: "birthday",
          name: "Party hat",
          cut: true,
          line: "it's my birthday (every day) 🎉",
        },
      ],
    },
    {
      id: "top",
      label: "Top",
      icon: "👕",
      thumb: { zoom: 1.77, x: 0.5, y: 0.495 },
      items: [
        { id: "none", name: "Nothing", none: true, line: "fur is a fit 😼" },
        { id: "bandana", name: "CRO bandana", line: "the classic 💙" },
        {
          id: "cryptocom",
          name: "Crypto.com tee",
          cut: true,
          line: "fortune favors the brave 💪",
        },
        {
          id: "hoodie",
          name: "Crypto.com hoodie",
          cut: true,
          line: "comfy mode on",
        },
        {
          id: "shirt",
          name: "White shirt",
          cut: true,
          line: "business casual, casual business",
        },
        {
          id: "cowboy",
          name: "Sheriff shirt",
          cut: true,
          line: "I'm the law around here ⭐",
        },
        {
          id: "cape",
          name: "Vampire cape",
          back: true,
          cut: true,
          line: "I vant to suck your… treats 🧛",
        },
        {
          id: "punk",
          name: "Punk jacket",
          cut: true,
          line: "no rules, just naps 🤘",
        },
        {
          id: "rapper",
          name: "Gold chain",
          line: "MC Whiskers in the house 🎤",
        },
        {
          id: "santa",
          name: "Santa suit",
          cut: true,
          line: "been a good kitty this year 🎁",
        },
        {
          id: "suit",
          name: "Suit & tie",
          cut: true,
          line: "the name's Cat. CroCat 🍸",
        },
      ],
    },
    {
      id: "pants",
      label: "Pants",
      icon: "👖",
      thumb: { zoom: 1.74, x: 0.508, y: 0.736 },
      items: [
        {
          id: "none",
          name: "No pants",
          none: true,
          line: "pants are a social construct",
        },
        {
          id: "jeans",
          name: "Denim shorts",
          cut: true,
          line: "classic denim drip 👖",
        },
        {
          id: "shorts",
          name: "Khaki shorts",
          cut: true,
          line: "shorts season, all seasons",
        },
        {
          id: "cargo",
          name: "Cargo",
          cut: true,
          line: "pockets full of treats",
        },
        {
          id: "sweats",
          name: "Sweatpants",
          cut: true,
          line: "comfy pants, comfy cat",
        },
        {
          id: "gym",
          name: "Gym shorts",
          cut: true,
          line: "leg day? every day 🏃",
        },
        {
          id: "pajama",
          name: "Pajamas",
          cut: true,
          line: "nap time is all the time 💤",
        },
        {
          id: "cro",
          name: "CRO shorts",
          cut: true,
          line: "repping Cronos from the waist down 💙",
        },
        {
          id: "karate",
          name: "Karate gi",
          cut: true,
          line: "black belt in napping 🥋",
        },
        {
          id: "punk",
          name: "Punk shorts",
          cut: true,
          line: "spikes for protection 🤘",
        },
        {
          id: "skirt",
          name: "Plaid skirt",
          cut: true,
          line: "*does a little twirl* 💃",
        },
      ],
    },
  ],

  // Look por defecto (y el del botón Reset)
  defaults: { bg: "studio", hat: "none", top: "bandana", pants: "none" },

  // Combos secretos: si el look cumple TODAS las condiciones se desbloquea.
  // Cada condición acepta un id o una lista de ids.
  secrets: [
    {
      id: "hohoho",
      name: "Ho Ho Meow",
      hint: "a jolly suit on a cold day",
      need: { hat: "santa", top: "santa", bg: "snow" },
    },
    {
      id: "sheriff",
      name: "Sheriff Whiskers",
      hint: "this town needs a sheriff",
      need: { hat: "cowboy", top: "cowboy", bg: "western" },
    },
    {
      id: "captain",
      name: "Captain Whiskers",
      hint: "a hat for the seven seas",
      need: { hat: "pirate", bg: "beach" },
    },
    {
      id: "sensei",
      name: "Sensei Whiskers",
      hint: "a black belt where it belongs",
      need: { pants: "karate", bg: "dojo" },
    },
    {
      id: "wizard",
      name: "The Meowgician",
      hint: "a pointy hat in a magic land",
      need: { hat: "wizard", bg: "magic" },
    },
    {
      id: "chef",
      name: "Chef Whiskers",
      hint: "someone's cooking in the kitchen",
      need: { hat: "chef", bg: "kitchen" },
    },
    {
      id: "bday",
      name: "Birthday Cat",
      hint: "dress up for the party",
      need: { hat: "birthday", bg: "birthday" },
    },
    {
      id: "maxi",
      name: "Cronos Maxi",
      hint: "blue fit, green candles",
      need: {
        top: ["cryptocom", "hoodie", "bandana"],
        pants: "cro",
        bg: "chart",
      },
    },
    {
      id: "dracula",
      name: "Count Meowcula",
      hint: "a cape and a very fancy hat",
      need: { top: "cape", hat: "tophat" },
    },
    {
      id: "mc",
      name: "MC Whiskers",
      hint: "a gold chain and a fresh cap",
      need: { hat: "cap", top: "rapper" },
    },
    {
      id: "punk",
      name: "Punk Meow",
      hint: "no rules, matching studs",
      need: { top: "punk", pants: "punk" },
    },
    {
      id: "royal",
      name: "Royal Nap",
      hint: "a king in his PJs",
      need: { hat: "crown", pants: "pajama" },
    },
  ],
};
