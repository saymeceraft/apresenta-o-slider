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

/** Cópia profunda de um slide, sem compartilhar arrays. */
export const duplicarSlide = (s) => ({ ...s, itens: [...(s.itens || [])] });

export const deckVazio = () => ({ slides: [novoSlide("capa")] });

export const contarPalavras = (deck) =>
  deck.slides.reduce((n, s) =>
    n + [s.titulo, s.subtitulo, s.corpo, s.legenda, ...(s.itens || [])]
      .filter(Boolean).join(" ").split(/\s+/).filter(Boolean).length, 0);
