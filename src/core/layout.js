import { F, CW, isSerif } from "./fontes.js";
import { sobre } from "./cores.js";
import { ROTULO } from "./deck.js";

/* Sistema de coordenadas lógico do slide: 960 x 540 (16:9).
   Toda exportação converte a partir daqui, então mudar de resolução
   é questão de trocar os conversores abaixo. */
export const W = 960, H = 540, P = 72, PT = 64;

const pesoFator = (w) => (w >= 800 ? 1.09 : w >= 700 ? 1.06 : w >= 600 ? 1.03 : w <= 300 ? 0.96 : 1);
const larguraTexto = (txt, size, fonte, upper, track, peso) =>
  txt.length * size * (CW(fonte) * pesoFator(peso || 400) + (track || 0)) * (upper ? 1.14 : 1);

// Quebra por palavra desperdiça espaço no fim de cada linha; a margem de 7% cobre isso.
export function alturaTexto(txt, w, size, lh, fonte, upper, track, peso) {
  const linhas = String(txt || "").split("\n");
  let total = 0;
  for (const l of linhas) {
    const larg = larguraTexto(l, size, fonte, upper, track, peso) * 1.07;
    total += Math.max(1, Math.ceil(larg / w)) * size * lh;
  }
  return Math.round(total);
}

/* Conversores entre a coordenada lógica e a de exportação. */
export const escalaSaida = (largura) => largura / W;
export const pxX = (x, k = 1) => x * k;
export const pxY = (y, k = 1) => y * k;
export const pxW = (w, k = 1) => w * k;
export const pxH = (h, k = 1) => h * k;

const S = (o) => o;

function decoShapes(t, tipo) {
  const capa = tipo === "capa", out = [];
  const g = t.grad || [t.accent];
  switch (t.deco) {
    case "glow":
      out.push(S({ k: "ellipse", x: 480, y: -300, w: 760, h: 760, fill: t.glow || t.accent, opacity: t.glowA || 0.3, soft: 120 }));
      break;
    case "gradiente":
      out.push(S({ k: "ellipse", x: 620, y: 260, w: 440, h: 440, fill: g[0], opacity: 0.5, soft: 90 }));
      out.push(S({ k: "ellipse", x: -110, y: -140, w: 380, h: 380, fill: g[1] || g[0], opacity: 0.42, soft: 90 }));
      break;
    case "faixa":
      out.push(S({ k: "rect", x: 0, y: 0, w: 18, h: H, fill: t.accent }));
      break;
    case "canto":
      out.push(S({ k: "rect", x: W - 120, y: 0, w: 120, h: 120, fill: t.accent }));
      break;
    case "ponto":
      out.push(S({ k: "ellipse", x: W - 72 - (capa ? 88 : 44), y: 52, w: capa ? 88 : 44, h: capa ? 88 : 44, fill: t.accent }));
      break;
    case "linhas":
      out.push(S({ k: "rect", x: P, y: 40, w: W - 2 * P, h: 1, fill: t.fg, opacity: 0.45 }));
      out.push(S({ k: "rect", x: P, y: H - 40, w: W - 2 * P, h: 1, fill: t.fg, opacity: 0.45 }));
      break;
    case "stripe": {
      const lw = capa ? 34 : 16, lh = capa ? 210 : 110, gap = capa ? 14 : 9;
      g.forEach((c, i) => out.push(S({ k: "rect", x: W - 190 + i * (lw + gap), y: -30, w: lw, h: lh, fill: c, rot: -20 })));
      break;
    }
    case "fita":
      out.push(S({ k: "rect", x: capa ? 420 : 620, y: capa ? -40 : -70, w: 760, h: capa ? 150 : 90, radius: 75, rot: -18, grad: g, opacity: capa ? 1 : 0.75 }));
      break;
    case "moldura":
      [[0, 0, W, 14], [0, H - 14, W, 14], [0, 0, 14, H], [W - 14, 0, 14, H]].forEach(([x, y, w, h]) => out.push(S({ k: "rect", x, y, w, h, fill: "#000000" })));
      break;
    case "mosaico": {
      if (!capa) break;
      const cols = [[150, 220, 130], [90, 240, 150], [180, 130, 230]];
      cols.forEach((cc, i) => {
        let y = -40;
        cc.forEach((h, k) => {
          out.push(S({ k: "rect", x: 560 + i * 122, y, w: 110, h, fill: (t.blocos || [t.accent])[(i * 3 + k) % (t.blocos || [t.accent]).length], radius: t.radius }));
          y += h + 12;
        });
      });
      break;
    }
    default: break;
  }
  return out;
}

const txt = (o) => S({ k: "text", lh: 1.3, align: "l", weight: 400, track: 0, ...o });

function tituloProps(t, size, cor) {
  return { font: t.fTitle, size, weight: t.wTitle, track: t.track, upper: t.upper, lh: t.upper ? 1.04 : 1.08, color: cor || t.fg };
}

function rotulo(t, texto, cor) {
  if (!texto) return [];
  return [txt({ x: P, y: PT, w: W - 2 * P, text: texto, font: t.fBody, size: 15, weight: 600, color: cor || t.accent, lh: 1.2 })];
}

function layoutCapa(t, s) {
  const out = [];
  const titulo = s.titulo || "Título da apresentação";
  const sub = s.subtitulo || "";
  const estreita = t.deco === "mosaico";
  const wTxt = (estreita ? 460 : W - 2 * P);
  const base = titulo.length > 60 ? 46 : titulo.length > 34 ? 58 : 72;
  let size = Math.round(base * (t.escala || 1) * (t.upper ? 0.92 : 1) * (estreita ? 0.82 : 1));
  const tp = () => tituloProps(t, size);
  const hT = () => alturaTexto(titulo, wTxt, size, tp().lh, t.fTitle, t.upper, t.track, t.wTitle);
  while (size > 26 && hT() > 250) size -= 4;
  const hSub = sub ? alturaTexto(sub, Math.min(wTxt, 700), 24, 1.4, t.fBody, false, 0) : 0;

  switch (t.capa) {
    case "centro": {
      const total = hT() + (sub ? 30 + hSub : 0);
      let y = Math.round((H - total) / 2);
      out.push(txt({ x: P, y, w: W - 2 * P, text: titulo, align: "ctr", ...tp() }));
      if (sub) out.push(txt({ x: 160, y: y + hT() + 30, w: W - 320, text: sub, align: "ctr", font: t.fBody, size: 24, weight: t.wBody, color: t.muted, lh: 1.4 }));
      return out;
    }
    case "editorial": {
      const s2 = isSerif(t.fTitle);
      out.push(txt({ x: P, y: PT, w: 300, text: "Edição nº 01", font: t.fBody, size: 15, color: t.muted }));
      out.push(txt({ x: W - P - 300, y: PT, w: 300, text: "Apresentação", font: t.fBody, size: 15, color: t.muted, align: "r" }));
      const hs = sub ? alturaTexto(sub, wTxt, 26, 1.4, s2 ? t.fTitle : t.fBody, false, 0) : 0;
      const y0 = H - PT - hs - (sub ? 28 : 0) - hT();
      out.push(txt({ x: P, y: y0, w: wTxt, text: titulo, ...tp() }));
      if (sub) out.push(txt({ x: P, y: y0 + hT() + 28, w: wTxt, text: sub, font: s2 ? t.fTitle : t.fBody, italic: s2, size: 26, color: t.accent, lh: 1.4 }));
      return out;
    }
    case "painel": {
      const pb = t.painel || t.accent, pf = sobre(pb), pw = 300;
      out.push(S({ k: "rect", x: 0, y: 0, w: pw, h: H, fill: pb }));
      out.push(S({ k: "rect", x: 44, y: 64, w: 48, h: 48, fill: pf, opacity: 0.18, radius: Math.min(t.radius, 10) }));
      out.push(S({ k: "rect", x: 59, y: 79, w: 18, h: 18, fill: pf, radius: Math.min(t.radius, 4) }));
      out.push(txt({ x: 44, y: H - 88, w: pw - 88, text: "Apresentação", font: t.fBody, size: 16, color: pf, opacity: 0.85 }));
      const cx = pw + 60, cw = W - pw - 120;
      let sz = Math.min(size, 54);
      const alt = () => alturaTexto(titulo, cw, sz, tituloProps(t, sz).lh, t.fTitle, t.upper, t.track, t.wTitle);
      while (sz > 24 && alt() > 200) sz -= 3;
      const p2 = tituloProps(t, sz);
      const h2 = alt();
      const hs = sub ? alturaTexto(sub, cw, 22, 1.45, t.fBody, false, 0) : 0;
      let y = Math.round((H - (4 + 24 + h2 + (sub ? 18 + hs : 0))) / 2);
      out.push(S({ k: "rect", x: cx, y, w: 48, h: 4, fill: t.accent2 || t.accent }));
      out.push(txt({ x: cx, y: y + 28, w: cw, text: titulo, ...p2 }));
      if (sub) out.push(txt({ x: cx, y: y + 28 + h2 + 18, w: cw, text: sub, font: t.fBody, size: 22, weight: t.wBody, color: t.muted, lh: 1.45 }));
      return out;
    }
    case "bloco": {
      const bb = (t.blocos && t.blocos[0]) || t.accent, bf = sobre(bb);
      out.push(S({ k: "rect", x: 28, y: 28, w: W - 56, h: H - 56, fill: bb, radius: Math.min(t.radius, 28) }));
      out.push(txt({ x: 80, y: 72, w: 400, text: "Apresentação", font: t.fBody, size: 16, weight: 600, color: bf, opacity: 0.8 }));
      const cw = W - 160;
      let sz3 = Math.min(size, 62);
      const alt3 = () => alturaTexto(titulo, cw, sz3, tituloProps(t, sz3).lh, t.fTitle, t.upper, t.track, t.wTitle);
      while (sz3 > 26 && alt3() > 250) sz3 -= 4;
      const p2 = { ...tituloProps(t, sz3, bf) };
      const h2 = alt3();
      const hs = sub ? alturaTexto(sub, Math.min(cw, 700), 24, 1.4, t.fBody, false, 0) : 0;
      const y0 = H - 72 - hs - (sub ? 26 : 0) - h2;
      out.push(txt({ x: 80, y: y0, w: cw, text: titulo, ...p2 }));
      if (sub) out.push(txt({ x: 80, y: y0 + h2 + 26, w: Math.min(cw, 700), text: sub, font: t.fBody, size: 24, color: bf, opacity: 0.82, lh: 1.4 }));
      return out;
    }
    case "cartaz": {
      const sz = Math.round(size * 1.1);
      const p2 = tituloProps(t, sz);
      const h2 = alturaTexto(titulo, wTxt, sz, p2.lh, t.fTitle, t.upper, t.track, t.wTitle);
      out.push(...rotulo(t, "Apresentação"));
      out.push(txt({ x: P, y: Math.max(150, Math.round((H - h2) / 2) - 20), w: wTxt, text: titulo, ...p2 }));
      if (sub) {
        out.push(S({ k: "rect", x: P, y: H - PT - hSub + 10, w: 72, h: 6, fill: t.accent }));
        out.push(txt({ x: P + 96, y: H - PT - hSub, w: 560, text: sub, font: t.fBody, size: 22, color: t.fg, opacity: 0.85, lh: 1.4 }));
      }
      return out;
    }
    case "moldura": {
      out.push(S({ k: "rect", x: 40, y: 40, w: 210, h: 40, fill: t.accent }));
      out.push(txt({ x: 56, y: 50, w: 190, text: "Apresentação", font: t.fTitle, size: 18, weight: 900, color: "#ffffff" }));
      out.push(S({ k: "rect", x: 262, y: 46, w: W - 302, h: 28, fill: (t.blocos && t.blocos[2]) || t.surface }));
      out.push(S({ k: "ellipse", x: W - 172, y: 96, w: 112, h: 112, fill: t.sticker || "#fcc20f", rot: -12 }));
      out.push(txt({ x: W - 172, y: 140, w: 112, text: "Novo!", align: "ctr", font: t.fTitle, size: 22, weight: 900, color: t.accent, rot: -12 }));
      const cw = W - 160;
      let sz4 = Math.min(size, 54);
      const alt4 = () => alturaTexto(titulo, cw, sz4, tituloProps(t, sz4).lh, t.fTitle, t.upper, t.track, t.wTitle);
      while (sz4 > 24 && alt4() > 190) sz4 -= 3;
      const p2 = tituloProps(t, sz4);
      const h2 = alt4();
      const hs = sub ? alturaTexto(sub, cw, 22, 1.45, t.fBody, false, 0) : 0;
      const y0 = H - 64 - hs - (sub ? 18 : 0) - h2 - 56;
      out.push(S({ k: "rect", x: 56, y: y0, w: W - 112, h: h2 + 56, fill: (t.blocos && t.blocos[0]) || t.surface }));
      out.push(txt({ x: 88, y: y0 + 28, w: cw, text: titulo, ...p2 }));
      if (sub) out.push(txt({ x: 88, y: y0 + h2 + 56 + 18, w: cw, text: sub, font: t.fBody, size: 22, color: t.fg, lh: 1.45 }));
      return out;
    }
    default: {
      const hs = sub ? alturaTexto(sub, Math.min(wTxt, 700), 24, 1.4, t.fBody, false, 0) : 0;
      const y0 = H - PT - hs - (sub ? 28 : 0) - hT();
      out.push(...rotulo(t, "Apresentação"));
      out.push(S({ k: "rect", x: P, y: y0 - 33, w: 56, h: 5, fill: t.accent, radius: Math.min(t.radius, 3) }));
      out.push(txt({ x: P, y: y0, w: wTxt, text: titulo, ...tp() }));
      if (sub) out.push(txt({ x: P, y: y0 + hT() + 28, w: Math.min(wTxt, 700), text: sub, font: t.fBody, size: 24, weight: t.wBody, color: t.muted, lh: 1.4 }));
      return out;
    }
  }
}

function layoutTopicos(t, s) {
  const out = [...rotulo(t, s.rotulo || ROTULO.topicos)];
  const itens = (s.itens || []).filter((x) => String(x).trim()).slice(0, 6);
  const n = Math.max(itens.length, 1);
  const cols = n <= 3 ? 1 : 2;
  const linhas = Math.ceil(n / cols);
  const titulo = s.titulo || "";
  const sz = Math.round(44 * (t.escala || 1));
  const tp = tituloProps(t, sz);
  const hT = titulo ? alturaTexto(titulo, W - 2 * P, sz, tp.lh, t.fTitle, t.upper, t.track, t.wTitle) : 0;
  if (titulo) out.push(txt({ x: P, y: PT + 28, w: W - 2 * P, text: titulo, ...tp }));

  const topo = PT + 28 + hT + 34;
  const dispo = H - PT - topo;
  const gap = 18;
  const cardH = Math.max(74, Math.min(126, Math.floor((dispo - gap * (linhas - 1)) / linhas)));
  const cardW = cols === 1 ? W - 2 * P : Math.floor((W - 2 * P - 20) / 2);
  const y0 = H - PT - (cardH * linhas + gap * (linhas - 1));
  const nb = (t.blocos || []).length;
  const fsz = n > 4 ? 19 : 22;

  itens.forEach((item, i) => {
    const cx = P + (i % cols) * (cardW + 20);
    const cy = y0 + Math.floor(i / cols) * (cardH + gap);
    let cor = t.fg, num = t.accent, padX = 26, padY = 22;
    if (t.cartao === "blocos" && nb) {
      const b = t.blocos[i % nb]; cor = sobre(b); num = cor;
      out.push(S({ k: "rect", x: cx, y: cy, w: cardW, h: cardH, fill: b, radius: t.radius }));
    } else if (t.cartao === "linha") {
      out.push(S({ k: "rect", x: cx, y: cy, w: cardW, h: t.linhaGrossa ? 6 : 1, fill: t.fg }));
      padX = 0; padY = 18;
    } else if (t.cartao === "borda") {
      out.push(S({ k: "rect", x: cx, y: cy, w: cardW, h: cardH, stroke: t.hairline, radius: t.radius }));
    } else {
      out.push(S({ k: "rect", x: cx, y: cy, w: cardW, h: cardH, fill: t.surface, radius: t.radius }));
    }
    out.push(txt({ x: cx + padX, y: cy + padY, w: 60, text: String(i + 1).padStart(2, "0"), font: t.fTitle, size: 17, weight: 700, color: num }));
    out.push(txt({ x: cx + padX, y: cy + padY + 27, w: cardW - padX * 2, text: item, font: t.fBody, size: fsz, weight: 500, color: cor, lh: 1.3 }));
  });
  return out;
}

function layoutTexto(t, s) {
  const out = [...rotulo(t, s.rotulo)];
  const y0 = s.rotulo ? PT + 28 : PT;
  const titulo = s.titulo || "";
  const sz = Math.round(44 * (t.escala || 1));
  const tp = tituloProps(t, sz);
  const hT = titulo ? alturaTexto(titulo, W - 2 * P, sz, tp.lh, t.fTitle, t.upper, t.track, t.wTitle) : 0;
  if (titulo) out.push(txt({ x: P, y: y0, w: W - 2 * P, text: titulo, ...tp }));
  const corpo = s.corpo || "";
  if (corpo) {
    const cw = Math.min(W - 2 * P, 760);
    let cs = corpo.length > 620 ? 19 : corpo.length > 380 ? 22 : 26;
    while (cs > 15 && alturaTexto(corpo, cw, cs, 1.5, t.fBody, false, 0) > H - (y0 + hT + 30) - PT) cs -= 1;
    out.push(txt({ x: P, y: y0 + hT + 30, w: cw, text: corpo, font: t.fBody, size: cs, weight: t.wBody, color: t.muted, lh: 1.5 }));
  }
  return out;
}

function layoutDestaque(t, s) {
  const out = [...rotulo(t, s.rotulo || ROTULO.destaque)];
  const num = s.numero || "0";
  const cor = t.destaqueCor || t.accent;
  const sz = Math.round((num.length > 5 ? 110 : num.length > 3 ? 140 : 180) * Math.max(t.escala || 1, 0.75));
  const leg = s.legenda || "";
  const hL = leg ? alturaTexto(leg, 700, 30, 1.3, t.fBody, false, 0) : 0;
  const total = sz * 1.05 + (leg ? 26 + hL : 0);
  const y = Math.round((H - total) / 2) + 10;
  out.push(txt({ x: P, y, w: W - 2 * P, text: num, font: t.fTitle, size: sz, weight: t.wTitle, track: -0.03, color: cor, lh: 1.05 }));
  if (leg) out.push(txt({ x: P, y: y + Math.round(sz * 1.05) + 26, w: 700, text: leg, font: t.fBody, size: 30, weight: 500, color: t.fg, lh: 1.3 }));
  return out;
}

function layoutCitacao(t, s) {
  const out = [...rotulo(t, s.rotulo)];
  const s2 = isSerif(t.fTitle);
  const frase = `“${s.corpo || ""}”`;
  let sz = Math.round(40 * Math.max(t.escala || 1, 0.8));
  while (sz > 20 && alturaTexto(frase, W - 2 * P, sz, 1.28, t.fTitle, false, 0, t.wTitle) > 260) sz -= 2;
  const h = alturaTexto(frase, W - 2 * P, sz, 1.28, t.fTitle, false, 0, t.wTitle);
  const y = Math.round((H - h) / 2);
  out.push(txt({ x: P, y, w: W - 2 * P, text: frase, font: t.fTitle, italic: s2, size: sz, weight: Math.min(t.wTitle, 600), track: -0.015, color: t.fg, lh: 1.28 }));
  if (s.autor) out.push(txt({ x: P, y: y + h + 32, w: W - 2 * P, text: s.autor, font: t.fBody, size: 20, color: t.muted }));
  return out;
}

function layoutFim(t, s) {
  const out = [...rotulo(t, s.rotulo || ROTULO.fim)];
  const titulo = s.titulo || "Obrigado";
  const sz = Math.round(56 * (t.escala || 1));
  const tp = tituloProps(t, sz);
  const hT = alturaTexto(titulo, W - 2 * P, sz, tp.lh, t.fTitle, t.upper, t.track, t.wTitle);
  const sub = s.subtitulo || "";
  const hS = sub ? alturaTexto(sub, 700, 24, 1.4, t.fBody, false, 0) : 0;
  const y = Math.round((H - (hT + (sub ? 22 + hS : 0))) / 2);
  out.push(txt({ x: P, y, w: W - 2 * P, text: titulo, ...tp }));
  if (sub) out.push(txt({ x: P, y: y + hT + 22, w: 700, text: sub, font: t.fBody, size: 24, weight: t.wBody, color: t.muted, lh: 1.4 }));
  return out;
}

export function layout(t, s) {
  const fn = { capa: layoutCapa, topicos: layoutTopicos, texto: layoutTexto, destaque: layoutDestaque, citacao: layoutCitacao, fim: layoutFim }[s.tipo] || layoutTexto;
  return [...decoShapes(t, s.tipo), ...fn(t, s)];
}
