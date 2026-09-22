import { novoSlide } from "./deck.js";

export function textoParaSlides(texto) {
  const linhas = String(texto).replace(/\r/g, "").split("\n");
  const slides = [];
  let atual = null, paragrafo = [];
  const fechaPar = () => {
    const p = paragrafo.join("\n").trim();
    paragrafo = [];
    if (!p) return;
    if (atual && atual.tipo === "capa" && !atual.subtitulo) { atual.subtitulo = p.slice(0, 140); return; }
    if (atual && atual.tipo === "texto" && !atual.corpo) { atual.corpo = p; return; }
    slides.push({ ...novoSlide("texto"), corpo: p });
    atual = slides[slides.length - 1];
  };
  for (const raw of linhas) {
    const l = raw.trim();
    if (!l) { fechaPar(); continue; }
    let m;
    if ((m = /^#\s+(.*)/.exec(l))) {
      fechaPar();
      slides.push({ ...novoSlide("capa"), titulo: m[1].trim() });
      atual = slides[slides.length - 1];
    } else if ((m = /^#{2,}\s+(.*)/.exec(l))) {
      fechaPar();
      slides.push({ ...novoSlide("texto"), titulo: m[1].trim(), itens: [] });
      atual = slides[slides.length - 1];
    } else if ((m = /^[-*•]\s+(.*)/.exec(l))) {
      fechaPar();
      if (!atual || (atual.tipo !== "topicos" && !(atual.tipo === "texto" && !atual.corpo))) {
        slides.push({ ...novoSlide("topicos"), itens: [] });
        atual = slides[slides.length - 1];
      }
      if (atual.tipo === "texto") { atual.tipo = "topicos"; atual.itens = []; }
      atual.itens.push(m[1].trim());
    } else if ((m = /^>\s*(.*)/.exec(l))) {
      fechaPar();
      slides.push({ ...novoSlide("citacao"), corpo: m[1].trim() });
      atual = slides[slides.length - 1];
    } else if ((m = /^!\s*([^|]{1,8})\|\s*(.*)/.exec(l))) {
      fechaPar();
      slides.push({ ...novoSlide("destaque"), numero: m[1].trim(), legenda: m[2].trim() });
      atual = slides[slides.length - 1];
    } else {
      paragrafo.push(l);
    }
  }
  fechaPar();
  return slides.filter((s) => s.titulo || s.subtitulo || s.corpo || s.numero || (s.itens || []).length);
}
