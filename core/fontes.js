export const FONTES = {
  "Inter": { css: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", pptx: "Inter", cw: 0.50 },
  "Hanken Grotesk": { css: "'Hanken Grotesk', Inter, sans-serif", pptx: "Hanken Grotesk", cw: 0.49 },
  "Manrope": { css: "Manrope, Inter, sans-serif", pptx: "Manrope", cw: 0.52 },
  "IBM Plex Sans": { css: "'IBM Plex Sans', Inter, sans-serif", pptx: "IBM Plex Sans", cw: 0.51 },
  "Space Grotesk": { css: "'Space Grotesk', Inter, sans-serif", pptx: "Space Grotesk", cw: 0.52 },
  "Rubik": { css: "Rubik, Inter, sans-serif", pptx: "Rubik", cw: 0.51 },
  "Unbounded": { css: "Unbounded, Inter, sans-serif", pptx: "Unbounded", cw: 0.68 },
  "Saira Condensed": { css: "'Saira Condensed', 'Arial Narrow', sans-serif", pptx: "Saira Condensed", cw: 0.40 },
  "Playfair Display": { css: "'Playfair Display', Georgia, serif", pptx: "Playfair Display", cw: 0.48 },
  "Cormorant Garamond": { css: "'Cormorant Garamond', Georgia, serif", pptx: "Cormorant Garamond", cw: 0.43 },
  "Arial Black": { css: "'Arial Black', 'Helvetica Neue', Arial, sans-serif", pptx: "Arial Black", cw: 0.64 },
  "Times New Roman": { css: "'Times New Roman', Times, serif", pptx: "Times New Roman", cw: 0.45 },
};
export const NOMES_FONTES = Object.keys(FONTES);
export const F = (n) => (FONTES[n] || FONTES.Inter).css;
// Nome seguro para o PPTX: se a fonte original provavelmente não existe na
// máquina de quem abrir o arquivo, usamos uma substituta de largura parecida
// para o layout exportado não se desfazer.
const FONTES_PPT_FALLBACK = {
  "Saira Condensed": "Arial Narrow",
  "Cormorant Garamond": "Garamond",
  "Playfair Display": "Georgia",
  "Unbounded": "Arial Black",
};
export function fonteExportacao(n) {
  const f = FONTES[n] || FONTES.Inter;
  return FONTES_PPT_FALLBACK[n] || f.pptx;
}
export const FP = fonteExportacao;
export const CW = (n) => (FONTES[n] || FONTES.Inter).cw;
export const isSerif = (n) => ["Playfair Display", "Cormorant Garamond", "Times New Roman"].includes(n);

export const FONTS_LINK = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Rubik:wght@400;500;600&family=Unbounded:wght@400;700;800&family=Saira+Condensed:wght@400;500;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap";
