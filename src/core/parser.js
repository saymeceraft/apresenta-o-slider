import { novoSlide } from "./deck.js";
import { textoParaSlides } from "./parserMarkdown.js";

export { textoParaSlides };

export const MIN_SLIDES = 3;
export const MAX_SLIDES = 30;

/* Só títulos com # ligam a leitura avançada. Listas, citações e números
   já são entendidos no texto livre, e muita gente escreve com travessão
   sem querer usar Markdown. */
export const pareceMarkdown = (texto) => /^\s{0,3}#{1,3}\s+\S/m.test(String(texto || ""));

const limpar = (t) => String(t || "").replace(/\r/g, "").trim();
const palavras = (t) => limpar(t).split(/\s+/).filter(Boolean).length;
const frases = (t) => limpar(t).split(/(?<=[.!?…])\s+(?=[A-ZÀ-Ü0-9"“])/).filter((x) => x.trim());

/** Linha curta, sem pontuação final: cara de título de seção. */
const pareceTitulo = (l) =>
  l.length <= 62 && palavras(l) <= 9 && !/[.:;,!?]$/.test(l) && !/^[-*•\d]/.test(l);

const pareceLista = (l) => /^\s*([-*•–]|\d+[.)])\s+/.test(l);
const semMarca = (l) => l.replace(/^\s*([-*•–]|\d+[.)])\s+/, "").trim();
const pareceCitacao = (l) => /^["“'].+["”']$/.test(l.trim()) && palavras(l) <= 30;

/** "42% — dos municípios" ou "2016 - fundação" viram slide de número. */
const destaqueDe = (l) => {
  const t = l.trim();
  const explicito = /^!\s*([^|\n]{1,8})\|\s*(.{3,90})$/.exec(t);
  if (explicito) return { numero: explicito[1].trim(), legenda: explicito[2].trim() };
  const m = /^([0-9][0-9.,%ºªx+]{0,6})\s*[—–-]\s*(.{3,90})$/.exec(t);
  return m ? { numero: m[1], legenda: m[2].trim() } : null;
};

function blocos(texto) {
  const t = limpar(texto);
  if (!t) return [];
  const porLinhaVazia = t.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  if (porLinhaVazia.length > 1) return porLinhaVazia;
  return t.split("\n").map((l) => l.trim()).filter(Boolean);
}

/**
 * Lê texto livre e devolve slides. Não inventa informação: só reorganiza,
 * quebra parágrafos longos e reconhece títulos, listas, citações e números.
 */
export function interpretarConteudo(texto, opcoes = {}) {
  const partes = blocos(texto);
  if (!partes.length) return [];

  const slides = [];
  let capa = null;
  let pendente = null; // título de seção esperando o corpo

  const linhasDe = (b) => b.split("\n").map((l) => l.trim()).filter(Boolean);

  // Capa: primeira linha curta do texto.
  const primeiras = linhasDe(partes[0]);
  if (primeiras.length && palavras(primeiras[0]) <= 14 && primeiras[0].length <= 90) {
    capa = { ...novoSlide("capa"), titulo: primeiras[0].replace(/^#+\s*/, "") };
    // Só vira subtítulo o que parece uma linha de apoio, não uma frase do texto.
    const apoio = primeiras[1] && primeiras[1].length <= 90 && palavras(primeiras[1]) <= 14
      && !/[.!?…]$/.test(primeiras[1]) && !pareceLista(primeiras[1]) && !pareceCitacao(primeiras[1]);
    if (apoio) {
      capa.subtitulo = primeiras[1];
      primeiras.splice(0, 2);
    } else {
      primeiras.splice(0, 1);
    }
    partes[0] = primeiras.join("\n");
    slides.push(capa);
  }

  const fechaPendente = () => {
    if (pendente) { slides.push(pendente); pendente = null; }
  };

  for (const bloco of partes) {
    if (!bloco.trim()) continue;
    const linhas = linhasDe(bloco);

    // Bloco só de itens de lista.
    const itens = linhas.filter(pareceLista);
    if (itens.length >= 2 && itens.length >= linhas.length - 1) {
      const titulo = pareceLista(linhas[0]) ? (pendente?.titulo || "") : linhas[0];
      if (!pareceLista(linhas[0])) linhas.shift();
      fechaPendenteComoTopicos();
      slides.push({ ...novoSlide("topicos"), titulo, itens: linhas.filter(pareceLista).map(semMarca).slice(0, 6) });
      continue;
    }

    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i];
      const d = destaqueDe(l);
      if (d) { fechaPendente(); slides.push({ ...novoSlide("destaque"), ...d }); continue; }
      if (pareceCitacao(l)) {
        fechaPendente();
        slides.push({ ...novoSlide("citacao"), corpo: l.replace(/^["“']|["”']$/g, "").trim() });
        continue;
      }
      if (pareceLista(l)) {
        const grupo = [];
        while (i < linhas.length && pareceLista(linhas[i])) grupo.push(semMarca(linhas[i++]));
        i--;
        const titulo = pendente?.titulo || "";
        pendente = null;
        slides.push({ ...novoSlide("topicos"), titulo, itens: grupo.slice(0, 6) });
        continue;
      }
      if (pareceTitulo(l) && (i < linhas.length - 1 || linhas.length === 1)) {
        fechaPendente();
        pendente = { ...novoSlide("texto"), titulo: l.replace(/^#+\s*/, "").replace(/:$/, ""), corpo: "" };
        continue;
      }
      // Parágrafo.
      if (pendente && !pendente.corpo) { pendente.corpo = l; fechaPendente(); }
      else { fechaPendente(); slides.push({ ...novoSlide("texto"), titulo: "", corpo: l }); }
    }
    fechaPendente();
  }
  fechaPendente();

  function fechaPendenteComoTopicos() {
    if (pendente && !pendente.corpo) pendente = null;
    else fechaPendente();
  }

  let saida = slides.filter((s) => s.titulo || s.subtitulo || s.corpo || s.numero || (s.itens || []).length);
  saida = saida.flatMap(quebrarLongo);
  if (!saida.length) return [];
  if (saida[0].tipo !== "capa") saida.unshift({ ...novoSlide("capa"), titulo: (saida[0].titulo || limpar(texto)).slice(0, 70) });
  if (opcoes.encerramento !== false) saida.push({ ...novoSlide("fim"), titulo: "Obrigado" });
  return ajustarQuantidade(saida, opcoes.quantidade);
}

/** Um parágrafo muito grande vira dois ou três slides, cortando entre frases. */
function quebrarLongo(s) {
  if (s.tipo !== "texto" || (s.corpo || "").length <= 620) return [s];
  const fs = frases(s.corpo);
  const partes = [];
  let atual = "";
  for (const f of fs) {
    if ((atual + " " + f).trim().length > 520 && atual) { partes.push(atual.trim()); atual = f; }
    else atual = (atual + " " + f).trim();
  }
  if (atual) partes.push(atual);
  return partes.map((corpo, i) => ({ ...s, corpo, titulo: i === 0 ? s.titulo : "" }));
}

const textoSimples = (s) => s.tipo === "texto";

/** Junta dois slides de texto em um só, preservando os dois títulos. */
function juntar(a, b) {
  const partes = [a.corpo, b.titulo ? `${b.titulo}: ${b.corpo}` : b.corpo].filter(Boolean);
  return { ...a, corpo: partes.join("\n") };
}

/** Aproxima o número de slides do pedido. Nunca apaga conteúdo: se não der
 *  para juntar mais, devolve mais slides do que o alvo. */
export function ajustarQuantidade(slides, alvo) {
  if (!alvo || alvo === "auto") return slides.slice(0, MAX_SLIDES);
  const n = Math.max(MIN_SLIDES, Math.min(MAX_SLIDES, Number(alvo) || 0));
  let out = [...slides];

  // Sobrando: junta textos vizinhos, primeiro os curtos, depois qualquer par.
  for (const limite of [560, 900, 1400, Infinity]) {
    while (out.length > n) {
      let i = out.findIndex((s, k) =>
        k < out.length - 1 && textoSimples(s) && textoSimples(out[k + 1]) &&
        (s.corpo.length + out[k + 1].corpo.length) < limite);
      if (i < 0) break;
      out.splice(i, 2, juntar(out[i], out[i + 1]));
    }
    if (out.length <= n) break;
  }

  // Faltando: quebra os textos maiores em dois.
  let volta = 0;
  while (out.length < n && volta < 60) {
    volta++;
    let idx = -1, maior = 0;
    out.forEach((s, i) => {
      const tam = s.tipo === "texto" ? (s.corpo || "").length : 0;
      if (tam > maior && tam > 200) { maior = tam; idx = i; }
    });
    if (idx < 0) break;
    const fs = frases(out[idx].corpo);
    if (fs.length < 2) break;
    const meio = Math.ceil(fs.length / 2);
    out.splice(idx, 1,
      { ...out[idx], corpo: fs.slice(0, meio).join(" ") },
      { ...out[idx], titulo: "", corpo: fs.slice(meio).join(" ") });
  }
  return out;
}

/** Ponto de entrada único: escolhe entre sintaxe avançada e texto livre. */
export function montarSlides(texto, opcoes = {}) {
  const avancado = opcoes.avancado ?? pareceMarkdown(texto);
  const base = avancado ? textoParaSlides(texto) : interpretarConteudo(texto, opcoes);
  if (!avancado) return base;
  return ajustarQuantidade(base, opcoes.quantidade);
}
