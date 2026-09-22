import { useEffect, useRef, useState } from "react";
import { slideHtml } from "../core/renderHtml.js";
import { W } from "../core/layout.js";

/** Mostra um slide em qualquer largura, mantendo a proporção 16:9. */
export default function SlideView({ modelo, slide, className = "" }) {
  const ref = useRef(null);
  const [escala, setEscala] = useState(0.3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setEscala(el.getBoundingClientRect().width / W);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`slide-quadro ${className}`}>
      <div style={{ transform: `scale(${escala})` }} dangerouslySetInnerHTML={{ __html: slideHtml(modelo, slide) }} />
    </div>
  );
}
