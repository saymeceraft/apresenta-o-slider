import { sobre, misturar } from "./cores.js";

/* Assinaturas de marca.
   Tokens de cor e tipografia sozinhos deixam todos os modelos parecidos.
   O que distingue um design system de verdade é o seu gesto: o cartão de
   anúncio do Airbnb, a lista de cotações de uma corretora, a janela de
   ferramenta de um produto de software. Aqui ficam essas peças, montadas
   com as cores do próprio modelo e desenhadas na coluna direita da capa. */

const COL = { x: 536, y: 64, w: 368, h: 412 };

const texto = (o) => ({ k: "text", lh: 1.3, align: "l", weight: 400, track: 0, ...o });

/** Cartão de anúncio: foto, selo, favorito, título e linha de preço. */
function cartaoProduto(t, { selo, cor }) {
  const r = t.comp?.mediaRaio ?? t.radius;
  const sombra = "0 1px 2px rgba(0,0,0,.05), 0 10px 26px rgba(0,0,0,.09)";
  const foto = misturar(cor || t.accent, t.bg === "#ffffff" ? "#ffffff" : t.surface, 0.22);
  const out = [
    { k: "rect", x: COL.x, y: COL.y, w: COL.w, h: COL.h, fill: t.surface, radius: r, sombra },
    { k: "rect", x: COL.x, y: COL.y, w: COL.w, h: 286, fill: foto, radius: r },
  ];
  if (selo) {
    const larg = Math.round(selo.length * 7.6) + 26;
    out.push({ k: "rect", x: COL.x + 20, y: COL.y + 20, w: larg, h: 28, fill: t.bg === "#000000" ? "#ffffff" : "#ffffff", radius: 9999 });
    out.push(texto({ x: COL.x + 20, y: COL.y + 27, w: larg, text: selo, align: "ctr", font: t.fBody, size: 13, weight: 600, color: "#111111" }));
  }
  // favorito
  out.push({ k: "ellipse", x: COL.x + COL.w - 56, y: COL.y + 20, w: 34, h: 34, fill: "#ffffff" });
  out.push({ k: "ellipse", x: COL.x + COL.w - 47, y: COL.y + 31, w: 16, h: 13, fill: cor || t.accent });
  // texto do cartão
  out.push({ k: "rect", x: COL.x + 22, y: COL.y + 314, w: 196, h: 15, fill: misturar(t.fg, t.surface, 0.55), radius: 7 });
  out.push({ k: "rect", x: COL.x + 22, y: COL.y + 342, w: 128, h: 12, fill: misturar(t.fg, t.surface, 0.26), radius: 6 });
  // botão redondo de ação
  out.push({ k: "ellipse", x: COL.x + COL.w - 78, y: COL.y + COL.h - 78, w: 58, h: 58, fill: cor || t.accent });
  return out;
}

/** Lista de cotações: pares, preços e variação. O gesto das corretoras. */
function ticker(t, { positiva = "#16c784", negativa = "#ea3943" } = {}) {
  const r = Math.min(t.radius, 14);
  const linhas = [
    ["BTC", "64.820,10", "+2,4%", true],
    ["ETH", "3.145,88", "+1,1%", true],
    ["SOL", "148,32", "-0,8%", false],
    ["ADA", "0,5421", "+3,7%", true],
  ];
  const out = [{ k: "rect", x: COL.x, y: COL.y, w: COL.w, h: COL.h, fill: t.surface, radius: r, sombra: t.comp?.sombra ? "0 10px 26px rgba(0,0,0,.09)" : null }];
  out.push(texto({ x: COL.x + 24, y: COL.y + 26, w: 200, text: "Mercado", font: t.fBody, size: 16, weight: 600, color: t.fg }));
  linhas.forEach(([par, preco, var_, alta], i) => {
    const y = COL.y + 72 + i * 78;
    out.push({ k: "rect", x: COL.x + 24, y, w: COL.w - 48, h: 1, fill: misturar(t.fg, t.surface, 0.14) });
    out.push({ k: "ellipse", x: COL.x + 24, y: y + 20, w: 34, h: 34, fill: misturar(t.accent, t.surface, 0.3) });
    out.push(texto({ x: COL.x + 70, y: y + 22, w: 120, text: par, font: t.fBody, size: 17, weight: 600, color: t.fg }));
    out.push(texto({ x: COL.x + 70, y: y + 44, w: 160, text: preco, font: t.fBody, size: 14, color: t.muted }));
    out.push(texto({ x: COL.x + COL.w - 130, y: y + 30, w: 106, text: var_, align: "r", font: t.fBody, size: 16, weight: 600, color: alta ? positiva : negativa }));
  });
  return out;
}

/** Janela de ferramenta: barra de topo e linhas de conteúdo. */
function janelaApp(t, { barra, destaque, linhas = 7 }) {
  const r = Math.min(t.radius, 14);
  const painel = misturar(t.fg, t.bg, 0.06);
  const out = [
    { k: "rect", x: COL.x, y: COL.y, w: COL.w, h: COL.h, fill: t.surface, radius: r, sombra: "0 10px 30px rgba(0,0,0,.12)" },
    { k: "rect", x: COL.x, y: COL.y, w: COL.w, h: 44, fill: painel, radius: r },
  ];
  [0, 1, 2].forEach((i) => out.push({ k: "ellipse", x: COL.x + 18 + i * 18, y: COL.y + 16, w: 11, h: 11, fill: misturar(t.fg, t.surface, 0.3) }));
  if (barra) {
    out.push({ k: "rect", x: COL.x + 90, y: COL.y + 12, w: COL.w - 110, h: 22, fill: misturar(t.bg, t.surface, 0.6), radius: 9999 });
  }
  for (let i = 0; i < linhas; i++) {
    const largura = [220, 300, 180, 262, 150, 286, 206][i % 7];
    const y = COL.y + 76 + i * 42;
    const cor = destaque && i === 2 ? t.accent : misturar(t.fg, t.surface, i % 3 === 0 ? 0.42 : 0.2);
    if (destaque && i === 2) out.push({ k: "rect", x: COL.x + 22, y: y - 6, w: largura + 14, h: 26, fill: t.accent, radius: 4 });
    out.push({
      k: "rect", x: COL.x + 28, y, w: Math.min(largura, COL.w - 56), h: 12,
      fill: destaque && i === 2 ? sobre(t.accent) : cor, radius: 6,
    });
  }
  return out;
}




/* Qual gesto pertence a cada marca. Modelos fora desta lista continuam
   com o elemento gráfico que já tinham. */
const ASSINATURAS = {
  airbnb: (t) => cartaoProduto(t, { selo: "Favorito dos hóspedes" }),
  mobbin: (t) => cartaoProduto(t, { selo: "Em alta", cor: t.accent }),
  binance: (t) => ticker(t, { positiva: "#0ecb81", negativa: "#f6465d" }),
  coinbase: (t) => ticker(t),
  kraken: (t) => ticker(t),
  raycast: (t) => janelaApp(t, { barra: true, linhas: 7 }),
  sentry: (t) => janelaApp(t, { barra: false, destaque: true, linhas: 7 }),
  "together-ai": (t) => janelaApp(t, { barra: true, destaque: true, linhas: 6 }),
};

/* O painel ocupa a coluna direita, então só entra nas capas que deixam
   o texto à esquerda. Capas centralizadas, em bloco ou com painel próprio
   já têm a sua própria composição. */
export const temAssinatura = (t) => !!ASSINATURAS[t?.id] && (!t?.capa || t?.capa === "esquerda");

/** Formas do painel de marca da capa. */
export function assinaturaCapa(t) {
  const fn = ASSINATURAS[t?.id];
  return fn && temAssinatura(t) ? fn(t) : [];
}
