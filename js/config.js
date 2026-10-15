/* =========================================================================
   CROCAT — CONFIGURACIÓN CENTRAL
   -------------------------------------------------------------------------
   Edita SOLO este archivo para cambiar los datos del token, links y textos.
   No hace falta tocar el HTML ni el resto del JS.
   ========================================================================= */

window.CROCAT_CONFIG = {
  // --- Identidad -------------------------------------------------------
  name: "CroCat",
  ticker: "$CROCAT",
  tagline: "The Cat of Cronos",

  // --- Contrato --------------------------------------------------------
  contractAddress: "0x7Eb480c734eC5f6bd2B918F7393b59D59913DFFA",
  chain: "Cronos",

  // --- Links (👉 reemplaza los que tengas) -----------------------------
  links: {
    buy: "https://vvs.finance/swap?outputCurrency=0x7Eb480c734eC5f6bd2B918F7393b59D59913DFFA",
    chart:
      "https://dexscreener.com/cronos/0x7Eb480c734eC5f6bd2B918F7393b59D59913DFFA",
    twitter: "https://x.com/CroCat_Token",
    telegram: "", // deja "" si no hay (se oculta el botón)
    discord: "", // deja "" si no hay (se oculta el botón)
    explorer:
      "https://explorer.cronos.org/token/0x7Eb480c734eC5f6bd2B918F7393b59D59913DFFA",
  },

  // --- Stats en vivo (precio, market cap, liquidez, volumen) -----------
  // Se leen de la API pública de DexScreener con el contractAddress.
  // Si la API falla o no hay pares, la franja se oculta sola.
  liveStats: {
    enabled: true,
    chainId: "cronos", // id de la chain en DexScreener
    refreshSec: 60, // cada cuánto se actualiza (pestaña visible)
  },

  // --- Texto para compartir en X (Create your CroCat) ------------------
  // {name} = nombre que le puso el usuario al gato · {url} = link a SU look
  creatorShareText:
    "Meet {name}, my custom CroCat 🐱✨\n\nDress up yours 👇\n{url}\n\n$CROCAT #Cronos",

  // --- Botón "Shill it on X" (sección Join) -----------------------------
  // Usa {url} para el link del sitio.
  shillText:
    "gm from the litter 🐾\n\n$CROCAT is the cat of Cronos: nine lives, zero chill, swimming on VVS.\n\nCome meow with us 👇\n{url}",

  // URL del sitio (para los links que se comparten). Si cambia el dominio, cámbialo
  // también en los meta og:/twitter: de index.html.
  siteUrl: "https://crocattoken.xyz",
};
