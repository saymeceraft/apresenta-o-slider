import { F, FONTS_LINK } from "./fontes.js";
import { hexA } from "./cores.js";
import { layout, W, H } from "./layout.js";

export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shapeHtml(sh) {
  const base = `position:absolute;left:${sh.x}px;top:${sh.y}px;`;
  const rot = sh.rot ? `transform:rotate(${sh.rot}deg);` : "";
  if (sh.k === "rect" || sh.k === "ellipse") {
    // Formas "soft" usam degradê radial em vez de filter:blur — o resultado é
    // praticamente igual e sobrevive à exportação em PDF e à impressão.
    const macia = !!sh.soft;
    const fill = macia
      ? `background:radial-gradient(closest-side, ${hexA(sh.fill, sh.opacity ?? 1)} 0%, ${hexA(sh.fill, 0)} 100%);`
      : sh.grad ? `background:linear-gradient(90deg,${sh.grad.join(",")});`
        : sh.fill ? `background:${sh.fill};` : "";
    const st = sh.stroke ? `border:1px solid ${sh.stroke};box-sizing:border-box;` : "";
    const r = sh.k === "ellipse" ? "border-radius:50%;" : sh.radius ? `border-radius:${sh.radius}px;` : "";
    const op = !macia && sh.opacity != null ? `opacity:${sh.opacity};` : "";
    return `<div style="${base}width:${sh.w}px;height:${sh.h}px;${fill}${st}${r}${op}${rot}"></div>`;
  }
  const al = { l: "left", ctr: "center", r: "right" }[sh.align || "l"];
  const style = `${base}width:${sh.w}px;font-family:${F(sh.font)};font-size:${sh.size}px;font-weight:${sh.weight};`
    + `line-height:${sh.lh};letter-spacing:${sh.track || 0}em;color:${sh.color};text-align:${al};`
    + `${sh.upper ? "text-transform:uppercase;" : ""}${sh.italic ? "font-style:italic;" : ""}`
    + `${sh.opacity != null ? `opacity:${sh.opacity};` : ""}white-space:pre-wrap;overflow-wrap:break-word;margin:0;${rot}`;
  return `<div style="${style}">${esc(sh.text)}</div>`;
}

export function slideHtml(t, s) {
  const bg = t.bgGrad ? `linear-gradient(135deg,${t.bgGrad.join(",")})` : t.bg;
  return `<div style="position:absolute;inset:0;background:${bg};overflow:hidden">`
    + layout(t, s).map(shapeHtml).join("") + `</div>`;
}



export function documentoImpressao(t, slides, titulo) {
  const paginas = slides.map((s) => `<div class="pg"><div class="sl">${slideHtml(t, s)}</div></div>`).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo || "Apresentação")}</title>
<link rel="stylesheet" href="${FONTS_LINK}">
<style>
  @page{size:13.333in 7.5in;margin:0}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#3c3c40}
  .pg{width:1280px;height:720px;overflow:hidden;margin:0 auto 16px;background:#fff}
  .sl{width:960px;height:540px;position:relative;transform:scale(1.33333);transform-origin:top left}
  @media print{body{background:#fff}.pg{margin:0;page-break-after:always;break-after:page}.pg:last-child{page-break-after:auto}}
</style></head><body>${paginas}
<script>
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function(){setTimeout(function(){window.focus();window.print();},350);});
<\/script></body></html>`;
}
