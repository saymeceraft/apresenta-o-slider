/* Catálogo de modelos. Cada modelo é um conjunto de tokens visuais;
   o conteúdo (deck) nunca é alterado por eles. */
export const CAPAS = ["esquerda", "centro", "editorial", "painel", "bloco", "cartaz", "moldura"];
export const DECOS = ["none", "glow", "gradiente", "faixa", "canto", "ponto", "linhas", "stripe", "fita", "moldura", "mosaico"];
export const CARTOES = ["preenchido", "borda", "linha", "blocos"];
export const NOME_CAPA = { esquerda: "título à esquerda, na base", centro: "título centralizado", editorial: "revista com linha de metadados", painel: "painel lateral de cor", bloco: "bloco de cor ocupando o slide", cartaz: "cartaz com título gigante", moldura: "moldura preta estilo catálogo" };
export const NOME_DECO = { none: "nenhum", glow: "brilho radial", gradiente: "manchas de gradiente", faixa: "faixa lateral", canto: "bloco no canto", ponto: "círculo de marca", linhas: "linhas finas", stripe: "faixas diagonais", fita: "fita em gradiente", moldura: "moldura", mosaico: "mosaico de imagens" };

const PADRAO = {
  bg: "#ffffff", fg: "#1d1d1f", muted: "#6e6e73", accent: "#007aff", surface: "#f5f5f7", hairline: "#d2d2d7",
  fTitle: "Inter", fBody: "Inter", wTitle: 700, wBody: 400, track: -0.02, upper: false, escala: 1, radius: 12,
  capa: "esquerda", deco: "none", cartao: "preenchido", grad: null, blocos: null, painel: null,
};
export const mk = (o) => ({ ...PADRAO, ...o });

export const MODELOS_ARQUIVO = [
  mk({ id: "airbnb", nome: "Airbnb", arquivo: "DESIGN-airbnb.md", desc: "Branco acolhedor, vermelho coral e cantos generosos.",
    fg: "#222222", muted: "#6a6a6a", accent: "#ff385c", surface: "#f7f7f7", hairline: "#dddddd", wTitle: 600, radius: 20, cartao: "borda" }),
  mk({ id: "airtable", nome: "Airtable", arquivo: "DESIGN-airtable.md", desc: "Tinta escura e cartões assinatura em coral, verde e pêssego.",
    fg: "#181d26", muted: "#41454d", accent: "#aa2d00", surface: "#f8fafc", hairline: "#dddddd", wTitle: 500, track: -0.015,
    capa: "bloco", cartao: "blocos", blocos: ["#aa2d00", "#0a2e0e", "#fcab79", "#181d26"] }),
  mk({ id: "binance", nome: "Binance", arquivo: "DESIGN-binance.md", desc: "Fundo quase preto com amarelo intenso como único destaque.",
    bg: "#0b0e11", fg: "#eaecef", muted: "#707a8a", accent: "#fcd535", surface: "#1e2329", hairline: "#2b3139", radius: 8, deco: "glow", glowA: 0.2 }),
  mk({ id: "bmw-m", nome: "BMW M", arquivo: "DESIGN-bmw-m.md", desc: "Preto absoluto, caixa alta e as três faixas de competição.",
    bg: "#000000", fg: "#ffffff", muted: "#bbbbbb", accent: "#1c69d4", surface: "#1a1a1a", hairline: "#3c3c3c", wTitle: 800, track: -0.01, upper: true, radius: 0,
    capa: "cartaz", deco: "stripe", grad: ["#0066b1", "#1c69d4", "#e22718"], cartao: "linha", linhaGrossa: true }),
  mk({ id: "bmw", nome: "BMW", arquivo: "DESIGN-bmw.md", desc: "Corporativo automotivo: azul, painel escuro e dois pesos.",
    fg: "#262626", muted: "#6b6b6b", accent: "#1c69d4", surface: "#f7f7f7", hairline: "#e6e6e6", track: 0, wBody: 300, radius: 4,
    capa: "painel", painel: "#1a2129" }),
  mk({ id: "bugatti", nome: "Bugatti", arquivo: "DESIGN-bugatti.md", desc: "Luxo austero: preto, caixa alta espaçada e serifa clássica.",
    bg: "#000000", fg: "#ffffff", muted: "#999999", accent: "#ffffff", surface: "#141414", hairline: "#262626",
    fTitle: "Saira Condensed", fBody: "Cormorant Garamond", wTitle: 400, track: 0.12, upper: true, escala: 0.95, radius: 0,
    capa: "centro", deco: "linhas", cartao: "linha" }),
  mk({ id: "coinbase", nome: "Coinbase", arquivo: "DESIGN-coinbase.md", desc: "Branco institucional, azul único e títulos grandes e leves.",
    fg: "#0a0b0d", muted: "#5b616e", accent: "#0052ff", surface: "#eef0f3", hairline: "#dee1e6", wTitle: 400, track: -0.03, radius: 16 }),
  mk({ id: "cursor", nome: "Cursor", arquivo: "DESIGN-cursor.md", desc: "Papel creme editorial, tinta quente e laranja vivo.",
    bg: "#f7f7f4", fg: "#26251e", muted: "#5a5852", accent: "#f54e00", surface: "#ffffff", hairline: "#e6e5e0", wTitle: 400, track: -0.03, radius: 8,
    capa: "editorial", cartao: "borda" }),
  mk({ id: "dell-1996", nome: "Dell 1996", arquivo: "DESIGN-dell-1996.md", desc: "Catálogo anos 90: moldura preta, faixas coloridas e Arial Black.",
    fg: "#000000", muted: "#333333", accent: "#e91d2a", surface: "#b3bd95", hairline: "#000000",
    fTitle: "Arial Black", fBody: "Times New Roman", wTitle: 900, track: 0, escala: 0.8, radius: 0,
    capa: "moldura", deco: "moldura", cartao: "blocos", blocos: ["#b3bd95", "#d77a7a", "#8c9ae0", "#e6915d"], sticker: "#fcc20f" }),
  mk({ id: "discord", nome: "Discord", arquivo: "DESIGN-discord.md", desc: "Índigo profundo, gradiente blurple e magenta, títulos largos.",
    bg: "#0a0d3a", fg: "#ffffff", muted: "#c9cbe8", accent: "#5865f2", surface: "#1e2353", hairline: "#2b3170",
    fTitle: "Unbounded", wTitle: 800, track: 0, upper: true, escala: 0.62, radius: 16,
    capa: "centro", deco: "gradiente", grad: ["#5865f2", "#ec48bd"], destaqueCor: "#35ed7e" }),
  mk({ id: "figma", nome: "Figma", arquivo: "DESIGN-figma.md", desc: "Preto e branco interrompido por blocos pastel recortados.",
    fg: "#000000", muted: "#5c5c5c", accent: "#000000", surface: "#f7f7f5", hairline: "#e6e6e6", wTitle: 400, track: -0.025, radius: 24,
    capa: "bloco", cartao: "blocos", blocos: ["#c5b0f4", "#dceeb1", "#f4ecd6", "#efd4d4", "#c8e6cd"] }),
  mk({ id: "kraken", nome: "Kraken", arquivo: "DESIGN-kraken.md", desc: "Branco confiável com roxo marcante e cantos de 12px.",
    fg: "#101114", muted: "#686b82", accent: "#7132f5", surface: "#f0ebff", hairline: "#dedee5", fTitle: "IBM Plex Sans", fBody: "IBM Plex Sans", radius: 12 }),
  mk({ id: "lovable", nome: "Lovable", arquivo: "DESIGN-lovable.md", desc: "Creme pergaminho, carvão quente e tipografia humanista.",
    bg: "#f7f4ed", fg: "#1c1c1c", muted: "#5f5f5d", accent: "#1c1c1c", surface: "#fcfbf8", hairline: "#dcd9d0",
    fTitle: "Hanken Grotesk", fBody: "Hanken Grotesk", wTitle: 600, track: -0.025, radius: 12, capa: "centro", cartao: "borda" }),
  mk({ id: "mobbin", nome: "Mobbin", arquivo: "DESIGN-mobbin.md", desc: "Galeria branca monocromática, pílulas e cantos de 24px.",
    fg: "#141414", muted: "#707070", accent: "#0066ff", surface: "#f3f3f3", hairline: "#e0e0e0",
    fTitle: "Hanken Grotesk", fBody: "Hanken Grotesk", track: -0.01, radius: 24 }),
  mk({ id: "pinterest", nome: "Pinterest", arquivo: "DESIGN-pinterest.md", desc: "Mosaico de imagens, vermelho vivo e neutros quentes.",
    fg: "#211922", muted: "#62625b", accent: "#e60023", surface: "#f6f6f3", hairline: "#dadad3", fTitle: "Manrope", fBody: "Manrope", radius: 16,
    deco: "mosaico", blocos: ["#e60023", "#e5e5e0", "#c8c8c1", "#7e238b", "#f6f6f3", "#62625b", "#dadad3", "#211922", "#e5e5e0"] }),
  mk({ id: "raycast", nome: "Raycast", arquivo: "DESIGN-raycast.md", desc: "Preto de produto, bordas finas e faixas vermelhas diagonais.",
    bg: "#07080a", fg: "#f4f4f6", muted: "#9c9c9d", accent: "#ff6161", surface: "#121212", hairline: "#242728", wTitle: 600, track: 0, radius: 12,
    deco: "stripe", grad: ["#ff5757", "#d23434", "#a1131a"], cartao: "borda" }),
  mk({ id: "sentry", nome: "Sentry", arquivo: "DESIGN-sentry.md", desc: "Meia-noite violeta, verde-limão elétrico e personalidade.",
    bg: "#1f1633", fg: "#ffffff", muted: "#bdb8c0", accent: "#c2ef4e", surface: "#150f23", hairline: "#362d59",
    fTitle: "Space Grotesk", fBody: "Rubik", radius: 10, capa: "cartaz", deco: "glow", glow: "#6a5fc1", glowA: 0.45 }),
  mk({ id: "tesla", nome: "Tesla", arquivo: "DESIGN-tesla.md", desc: "Subtração radical: branco, cinza carbono e um só azul.",
    fg: "#171a20", muted: "#5c5e62", accent: "#3e6ae1", surface: "#f4f4f4", hairline: "#eeeeee", wTitle: 500, track: 0, radius: 4, capa: "centro" }),
  mk({ id: "together-ai", nome: "Together AI", arquivo: "DESIGN-together_ai.md", desc: "Azul-noite com fita em gradiente laranja, magenta e lavanda.",
    bg: "#010120", fg: "#ffffff", muted: "#959494", accent: "#fc4c02", surface: "#11122e", hairline: "#313641", wTitle: 500, track: -0.03, radius: 8,
    deco: "fita", grad: ["#fc4c02", "#ef2cc1", "#bdbbff"], cartao: "borda" }),
  mk({ id: "vodafone", nome: "Vodafone", arquivo: "DESIGN-vodafone.md", desc: "Cartaz de campanha: caixa alta pesadíssima e vermelho escarlate.",
    fg: "#25282b", muted: "#7e7e7e", accent: "#e60000", surface: "#f2f2f2", hairline: "#bebebe", wTitle: 800, track: -0.03, upper: true, radius: 6,
    capa: "cartaz", deco: "ponto" }),
].map((t) => ({ ...t, origem: "arquivo" }));

export const MODELOS_BASE = [
  mk({ id: "minimal", nome: "Minimal", desc: "Branco, tipografia limpa e muito respiro.", track: -0.035, radius: 14 }),
  mk({ id: "keynote", nome: "Keynote Escuro", desc: "Fundo preto e um azul elétrico. Impacto de palco.",
    bg: "#000000", fg: "#f5f5f7", muted: "#86868b", accent: "#2997ff", surface: "#1c1c1e", hairline: "#2c2c2e", wTitle: 800, track: -0.04, radius: 14,
    capa: "centro", deco: "glow" }),
  mk({ id: "editorial", nome: "Editorial", desc: "Serifa elegante e tons de papel, estilo revista.",
    bg: "#f6f1e9", fg: "#2a2420", muted: "#7a6e64", accent: "#8a3b1f", surface: "#ece4d8", hairline: "#cfc4b4",
    fTitle: "Playfair Display", track: -0.01, radius: 0, capa: "editorial", deco: "linhas", cartao: "linha" }),
  mk({ id: "gradiente", nome: "Gradiente Vibrante", desc: "Cores intensas e vidro fosco. Moderno e criativo.",
    bg: "#5b2bf0", bgGrad: ["#4f2bff", "#b43cff", "#ff6a88"], fg: "#ffffff", muted: "#e8dcff", accent: "#ffffff",
    surface: "#7a3af5", hairline: "#c9a8ff", wTitle: 800, track: -0.035, radius: 18, deco: "gradiente", grad: ["#ffd36e", "#3ad7ff"] }),
  mk({ id: "corporativo", nome: "Corporativo", desc: "Faixa lateral e grid ordenado. Sóbrio e institucional.",
    fg: "#0b2545", muted: "#5c6b7a", accent: "#13315c", accent2: "#3e92cc", surface: "#eef2f7", hairline: "#d5dde8",
    fTitle: "IBM Plex Sans", fBody: "IBM Plex Sans", wTitle: 600, radius: 4, capa: "painel", deco: "faixa" }),
  mk({ id: "suico", nome: "Suíço", desc: "Grid assimétrico, caixa alta e bloco vermelho.",
    bg: "#f2f2f2", fg: "#111111", muted: "#555555", accent: "#e30613", surface: "#e6e6e6", hairline: "#111111",
    fTitle: "Space Grotesk", track: -0.025, upper: true, radius: 0, capa: "cartaz", deco: "canto", cartao: "linha", linhaGrossa: true }),
].map((t) => ({ ...t, origem: "base" }));

export const MODEL_REGISTRY = {
  arquivo: MODELOS_ARQUIVO,
  base: MODELOS_BASE,
};

/** Lista completa: modelos de arquivo, importados pelo usuário e básicos. */
export const listarModelos = (importados = []) => [
  ...MODEL_REGISTRY.arquivo,
  ...importados,
  ...MODEL_REGISTRY.base,
];

export const acharModelo = (id, importados = []) =>
  listarModelos(importados).find((t) => t.id === id) || null;

/* ---------- Modelos importados de um DESIGN.md ---------- */
const COR = (v, d) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim() : d);
const UM = (v, lista, d) => (lista.includes(v) ? v : d);
const NUM = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };

/** Valida o que veio da IA e devolve um modelo utilizável (nunca confia no JSON cru). */
export function modeloDeTokens(j, arquivo, fontesValidas) {
  const cores = (a) => (Array.isArray(a) ? a.map((x) => COR(x, null)).filter(Boolean).slice(0, 9) : null);
  const t = mk({
    id: "imp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    origem: "importado",
    arquivo,
    nome: String(j?.nome || String(arquivo).replace(/^DESIGN-|\.(md|markdown|txt)$/gi, "")).slice(0, 28),
    desc: String(j?.desc || "Modelo importado").slice(0, 100),
    bg: COR(j?.bg, "#ffffff"), fg: COR(j?.fg, "#1d1d1f"), muted: COR(j?.muted, "#6e6e73"),
    accent: COR(j?.accent, "#007aff"), surface: COR(j?.surface, "#f5f5f7"), hairline: COR(j?.hairline, "#d2d2d7"),
    fTitle: UM(j?.fTitle, fontesValidas, "Inter"), fBody: UM(j?.fBody, fontesValidas, "Inter"),
    wTitle: NUM(j?.wTitle, 300, 900, 700), wBody: NUM(j?.wBody, 300, 500, 400),
    track: NUM(j?.track, -0.06, 0.2, -0.02), upper: !!j?.upper,
    escala: NUM(j?.escala, 0.55, 1.15, 1), radius: NUM(j?.radius, 0, 32, 12),
    capa: UM(j?.capa, CAPAS, "esquerda"), deco: UM(j?.deco, DECOS, "none"), cartao: UM(j?.cartao, CARTOES, "preenchido"),
    grad: cores(j?.grad), blocos: cores(j?.blocos), painel: COR(j?.painel, null),
  });
  if (["gradiente", "fita", "stripe"].includes(t.deco) && !(t.grad || []).length) t.grad = [t.accent, t.muted];
  if ((t.cartao === "blocos" || t.capa === "bloco" || t.deco === "mosaico") && !(t.blocos || []).length) {
    t.blocos = [t.accent, t.surface, t.hairline];
  }
  return t;
}
