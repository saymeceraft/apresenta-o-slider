export const TIPOS = [
  { id: "capa", nome: "Capa", campos: ["titulo", "subtitulo"] },
  { id: "topicos", nome: "Tópicos", campos: ["titulo", "itens"] },
  { id: "texto", nome: "Texto", campos: ["titulo", "corpo"] },
  { id: "destaque", nome: "Número em destaque", campos: ["numero", "legenda"] },
  { id: "citacao", nome: "Citação", campos: ["corpo", "autor"] },
  { id: "fim", nome: "Encerramento", campos: ["titulo", "subtitulo"] },
];
export const ROTULO = { capa: "Apresentação", topicos: "Roteiro", texto: "", destaque: "Em destaque", citacao: "", fim: "Encerramento" };

export const novoSlide = (tipo) => {
  const b = { tipo, titulo: "", subtitulo: "", itens: [], corpo: "", numero: "", legenda: "", autor: "", rotulo: "" };
  if (tipo === "topicos") b.itens = ["", ""];
  return b;
};

/** Troca o tipo do slide aproveitando o que já estava escrito. */
export function converterSlide(slide, tipo) {
  if (slide.tipo === tipo) return slide;
  const base = novoSlide(tipo);
  const itens = slide.itens || [];
  const textoLivre = [slide.corpo, itens.join("\n"), slide.legenda].filter(Boolean).join("\n");

  const out = { ...base, tipo, titulo: slide.titulo || "", subtitulo: slide.subtitulo || "" };
  if (tipo === "topicos") {
    out.itens = (textoLivre ? textoLivre.split("\n") : []).map((x) => x.trim()).filter(Boolean).slice(0, 6);
    if (!out.itens.length) out.itens = ["", ""];
  } else if (tipo === "texto" || tipo === "citacao") {
    out.corpo = textoLivre || slide.subtitulo || "";
    if (tipo === "citacao") out.autor = slide.autor || "";
  } else if (tipo === "destaque") {
    out.numero = slide.numero || "";
    out.legenda = slide.legenda || textoLivre.split("\n")[0] || "";
  } else if (tipo === "capa" || tipo === "fim") {
    out.subtitulo = slide.subtitulo || textoLivre.split("\n")[0] || "";
  }
  if (slide.estilo) out.estilo = slide.estilo;
  if (slide.semMarca) out.semMarca = true;
  return out;
}

/** Cópia profunda de um slide, sem compartilhar arrays. */
export const duplicarSlide = (s) => ({ ...s, itens: [...(s.itens || [])] });

export const deckVazio = () => ({ slides: [novoSlide("capa")] });

export const contarPalavras = (deck) =>
  deck.slides.reduce((n, s) =>
    n + [s.titulo, s.subtitulo, s.corpo, s.legenda, ...(s.itens || [])]
      .filter(Boolean).join(" ").split(/\s+/).filter(Boolean).length, 0);
