import { sobre, hexA, lum } from "./cores.js";

/* O modelo continua sendo o dono do visual. Aqui só sobrepomos duas
   escolhas do usuário que valem para a apresentação inteira:
   o plano de fundo e a marca d'água. O deck (conteúdo) não é tocado. */

export const FUNDO_PADRAO = { tipo: "modelo", cor: "#0b1020", cor2: "#4f2bff", imagem: null, escurecer: 0.35 };
export const MARCA_PADRAO = {
  ativa: false, tipo: "texto", texto: "", imagem: null,
  posicao: "inferior-direita", x: null, y: null,
  tamanho: 1, opacidade: 0.35, naCapa: true,
};

export const POSICOES = [
  ["superior-esquerda", "Sup. esquerda"],
  ["superior-direita", "Sup. direita"],
  ["inferior-esquerda", "Inf. esquerda"],
  ["inferior-direita", "Inf. direita"],
  ["centro", "Centro"],
];

/** Devolve o modelo com o fundo e a marca do deck já aplicados. */
export function comporModelo(modelo, deck) {
  if (!modelo) return modelo;
  const fundo = { ...FUNDO_PADRAO, ...(deck?.fundo || {}) };
  const marca = { ...MARCA_PADRAO, ...(deck?.marca || {}) };
  let t = { ...modelo };

  if (fundo.tipo === "cor" || fundo.tipo === "gradiente" || fundo.tipo === "imagem") {
    const claro = fundo.tipo === "imagem"
      ? fundo.escurecer < 0.25
      : (lum(fundo.tipo === "gradiente" ? fundo.cor : fundo.cor) ?? 0) > 0.55;
    const texto = claro ? "#111111" : "#ffffff";

    t.bg = fundo.tipo === "gradiente" ? fundo.cor : fundo.cor;
    t.bgGrad = fundo.tipo === "gradiente" ? [fundo.cor, fundo.cor2] : null;
    t.bgImagem = fundo.tipo === "imagem" ? fundo.imagem : null;
    t.escurecer = fundo.tipo === "imagem" ? Number(fundo.escurecer) || 0 : 0;
    t.fg = texto;
    t.muted = hexA(texto, 0.75);
    t.surface = hexA(texto, 0.14);
    t.hairline = hexA(texto, 0.28);
    if (claro === (lum(t.accent) ?? 0) > 0.55) t.accent = t.accent; // mantém a cor da marca do modelo
  }

  t.marca = marca.ativa && (marca.tipo === "imagem" ? marca.imagem : marca.texto.trim()) ? marca : null;
  return t;
}

const CANTOS = {
  "superior-esquerda": (w, h) => ({ x: 48, y: 40 }),
  "superior-direita": (w, h) => ({ x: 960 - 48 - w, y: 40 }),
  "inferior-esquerda": (w, h) => ({ x: 48, y: 540 - 40 - h }),
  "inferior-direita": (w, h) => ({ x: 960 - 48 - w, y: 540 - 40 - h }),
  centro: (w, h) => ({ x: (960 - w) / 2, y: (540 - h) / 2 }),
};

/** Onde a marca fica: posição livre (x, y de 0 a 1) ou um dos cantos. */
export function posicaoMarca(m, w, h) {
  if (typeof m.x === "number" && typeof m.y === "number") {
    return {
      x: Math.round(Math.min(Math.max(m.x, 0), 1) * (960 - w)),
      y: Math.round(Math.min(Math.max(m.y, 0), 1) * (540 - h)),
    };
  }
  const canto = CANTOS[m.posicao] || CANTOS["inferior-direita"];
  const p = canto(w, h);
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

/** Formas da marca d'água para um slide. */
export function marcaShapes(t, slide) {
  const m = t.marca;
  if (!m || slide?.semMarca) return [];
  if (slide?.tipo === "capa" && !m.naCapa) return [];
  const escala = Math.min(Math.max(Number(m.tamanho) || 1, 0.5), 3);
  const opacidade = Math.min(Math.max(Number(m.opacidade) || 0.35, 0.05), 1);

  if (m.tipo === "imagem" && m.imagem) {
    const w = Math.round(150 * escala);
    const h = Math.round(w / (Number(m.proporcao) || 3)) || 40;
    const { x, y } = posicaoMarca(m, w, h);
    return [{ k: "img", src: m.imagem, x, y, w, h, opacity: opacidade, ajuste: "contain" }];
  }

  const texto = String(m.texto || "").trim();
  if (!texto) return [];
  const size = Math.round((m.inclinada ? 60 : 20) * escala);
  const w = Math.min(760, Math.round(texto.length * size * 0.62) + 20);
  const h = Math.round(size * 1.3);
  const { x, y } = posicaoMarca(m, w, h);
  return [{
    k: "text", x, y, w, text: texto,
    font: t.fBody, size, weight: 600, lh: 1.3, track: m.posicao === "centro" ? 0.02 : 0,
    color: sobre(t.bg === "#ffffff" ? "#ffffff" : t.bg) === "#ffffff" ? "#ffffff" : "#111111",
    opacity: opacidade,
    align: typeof m.x === "number" ? "l" : m.posicao.endsWith("direita") ? "r" : m.posicao === "centro" ? "ctr" : "l",
    rot: m.inclinada ? -22 : 0,
  }];
}

/** Formas do plano de fundo (imagem e véu escuro), antes de tudo. */
export function fundoShapes(t) {
  if (!t.bgImagem) return [];
  const out = [{ k: "img", src: t.bgImagem, x: 0, y: 0, w: 960, h: 540, ajuste: "cover" }];
  if (t.escurecer > 0) out.push({ k: "rect", x: 0, y: 0, w: 960, h: 540, fill: "#000000", opacity: t.escurecer });
  return out;
}

/** Reduz a imagem antes de guardar, para não estourar o armazenamento local. */
export function prepararImagem(arquivo, larguraMax = 1600) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não consegui ler a imagem."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const k = Math.min(1, larguraMax / img.width);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const png = /png$/i.test(arquivo.type);
        resolve({
          dados: c.toDataURL(png ? "image/png" : "image/jpeg", 0.88),
          proporcao: img.width / img.height,
        });
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}
