import { NOME_CAPA, NOME_DECO } from "./modelos.js";

/** Resumo em texto do design + conteúdo, para colar em outra ferramenta. */
export function briefing(modelo, deck) {
  const linhas = deck.slides.map((s, i) => {
    const p = {
      capa: `Capa — ${s.titulo}${s.subtitulo ? ` / ${s.subtitulo}` : ""}`,
      topicos: `Tópicos — ${s.titulo}: ${(s.itens || []).join("; ")}`,
      texto: `Texto — ${s.titulo}: ${s.corpo}`,
      destaque: `Destaque — ${s.numero}: ${s.legenda}`,
      citacao: `Citação — "${s.corpo}"${s.autor ? ` (${s.autor})` : ""}`,
      fim: `Encerramento — ${s.titulo}${s.subtitulo ? ` / ${s.subtitulo}` : ""}`,
    }[s.tipo];
    return `${i + 1}. ${p}`;
  }).join("\n");

  return `BRIEFING DE APRESENTAÇÃO

DESIGN: ${modelo.nome} — ${modelo.desc}${modelo.arquivo ? `\nReferência: ${modelo.arquivo}` : ""}
Tipografia: títulos em ${modelo.fTitle} (peso ${modelo.wTitle}${modelo.upper ? ", caixa alta" : ""}), corpo em ${modelo.fBody}
Paleta: fundo ${modelo.bgGrad ? modelo.bgGrad.join(" > ") : modelo.bg} | texto ${modelo.fg} | secundário ${modelo.muted} | destaque ${modelo.accent} | superfície ${modelo.surface}${modelo.grad ? `\nGradiente/faixas: ${modelo.grad.join(", ")}` : ""}${modelo.blocos ? `\nBlocos: ${modelo.blocos.slice(0, 5).join(", ")}` : ""}
Cantos: ${modelo.radius}px | Capa: ${NOME_CAPA[modelo.capa]} | Elemento visual: ${NOME_DECO[modelo.deco]}
Formato: 16:9

ESTRUTURA
${linhas}`;
}
