import { slideHtml, documentoImpressao } from "./renderHtml.js";
import { W, H } from "./layout.js";
import { baixar } from "./arquivo.js";

/** Espera as fontes do documento antes de rasterizar, senão o PDF sai com fallback. */
async function fontesProntas() {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch { /* navegador sem a API de fontes */ }
  await new Promise((r) => setTimeout(r, 60));
}

function palco() {
  const div = document.createElement("div");
  Object.assign(div.style, {
    position: "fixed", left: "-10000px", top: "0",
    width: `${W}px`, height: `${H}px`, overflow: "hidden",
    background: "#ffffff", zIndex: "-1",
  });
  document.body.appendChild(div);
  return div;
}

/**
 * Gera um PDF 16:9 com uma página por slide e baixa o arquivo.
 * Cada slide é renderizado no próprio navegador, então cores, posições
 * e fontes ficam iguais à pré-visualização.
 */
export async function exportarPdf(modelo, slides, nome, aoProgredir) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [W, H], compress: true });
  const area = palco();
  try {
    await fontesProntas();
    for (let i = 0; i < slides.length; i++) {
      aoProgredir?.(i + 1, slides.length);
      area.innerHTML = slideHtml(modelo, slides[i]);
      // Deixa o navegador aplicar o layout antes da captura.
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      const canvas = await html2canvas(area, {
        width: W, height: H, scale: 2, useCORS: true, logging: false, backgroundColor: null,
      });
      const img = canvas.toDataURL("image/jpeg", 0.94);
      if (i > 0) pdf.addPage([W, H], "landscape");
      pdf.addImage(img, "JPEG", 0, 0, W, H, undefined, "FAST");
    }
    pdf.save(nome);
    return true;
  } finally {
    area.remove();
  }
}

/** Alternativa: abre a janela de impressão do navegador (mantém texto vetorial). */
export function imprimir(modelo, slides, titulo) {
  const html = documentoImpressao(modelo, slides, titulo);
  try {
    const w = window.open("", "_blank");
    if (w && w.document) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      return "janela";
    }
  } catch (e) {
    console.warn("Não foi possível abrir a janela de impressão:", e);
  }
  try {
    const ifr = document.createElement("iframe");
    Object.assign(ifr.style, { position: "fixed", right: "0", bottom: "0", width: "1px", height: "1px", opacity: "0", border: "0" });
    ifr.setAttribute("aria-hidden", "true");
    ifr.srcdoc = html;
    document.body.appendChild(ifr);
    setTimeout(() => ifr.remove(), 90000);
    return "quadro";
  } catch (e) {
    console.warn("Impressão embutida falhou:", e);
  }
  return null;
}

/** Última alternativa: baixa o HTML pronto para o usuário imprimir. */
export function baixarHtml(modelo, slides, nome) {
  baixar(nome, documentoImpressao(modelo, slides, nome), "text/html");
}
