import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import SlideView from "./SlideView.jsx";

/** Tela cheia para apresentar. Não altera o deck: só navega. */
export default function Apresentar({ modelo, slides, inicial = 0, aoSair }) {
  const [i, setI] = useState(Math.min(inicial, slides.length - 1));

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") aoSair();
      else if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); setI((v) => Math.min(v + 1, slides.length - 1)); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); setI((v) => Math.max(v - 1, 0)); }
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(slides.length - 1);
    };
    window.addEventListener("keydown", h);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = antes;
    };
  }, [slides.length, aoSair]);

  return (
    <div className="palco" role="dialog" aria-modal="true" aria-label="Modo apresentação">
      <div className="palco-slide">
        <SlideView modelo={modelo} slide={slides[i]} />
      </div>
      <div className="palco-barra">
        <button type="button" onClick={() => setI((v) => Math.max(v - 1, 0))} aria-label="Slide anterior"><ChevronLeft size={18} /></button>
        <span>{i + 1} / {slides.length}</span>
        <button type="button" onClick={() => setI((v) => Math.min(v + 1, slides.length - 1))} aria-label="Próximo slide"><ChevronRight size={18} /></button>
        <button type="button" onClick={aoSair} aria-label="Sair da apresentação"><X size={18} /></button>
      </div>
    </div>
  );
}
