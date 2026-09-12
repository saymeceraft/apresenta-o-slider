import { ArrowUp, ArrowDown, Copy, Plus, Trash2, X } from "lucide-react";
import { TIPOS } from "../core/deck.js";
import SlideView from "./SlideView.jsx";

function CartaoSlide({ slide, indice, total, modelo, aoMudar, aoMover, aoDuplicar, aoExcluir }) {
  const set = (k, v) => aoMudar({ ...slide, [k]: v });
  const campos = (TIPOS.find((t) => t.id === slide.tipo) || TIPOS[0]).campos;

  return (
    <div className="editor-slide">
      <div className="editor-topo">
        <span className="editor-num">{indice + 1}</span>
        <select
          className="select-tipo"
          value={slide.tipo}
          onChange={(e) => aoMudar({ ...slide, tipo: e.target.value })}
          aria-label={`Tipo do slide ${indice + 1}`}
        >
          {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <div className="editor-acoes">
          <button type="button" className="btn btn-icone" onClick={() => aoMover(-1)} disabled={indice === 0} aria-label="Mover para cima"><ArrowUp size={15} /></button>
          <button type="button" className="btn btn-icone" onClick={() => aoMover(1)} disabled={indice === total - 1} aria-label="Mover para baixo"><ArrowDown size={15} /></button>
          <button type="button" className="btn btn-icone" onClick={aoDuplicar} aria-label="Duplicar slide"><Copy size={15} /></button>
          <button type="button" className="btn btn-icone" onClick={aoExcluir} disabled={total <= 1} aria-label="Excluir slide" style={{ color: "var(--perigo)" }}><Trash2 size={15} /></button>
        </div>
      </div>

      {modelo && (
        <div className="moldura" style={{ marginBottom: 10 }}>
          <SlideView modelo={modelo} slide={slide} />
        </div>
      )}

      <div className="editor-campos">
        {campos.includes("titulo") && (
          <input className="campo" value={slide.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Título" aria-label="Título" />
        )}
        {campos.includes("subtitulo") && (
          <input className="campo" value={slide.subtitulo} onChange={(e) => set("subtitulo", e.target.value)} placeholder="Subtítulo" aria-label="Subtítulo" />
        )}
        {campos.includes("numero") && (
          <div className="editor-item">
            <input className="campo" style={{ maxWidth: 120 }} value={slide.numero} onChange={(e) => set("numero", e.target.value)} placeholder="42%" aria-label="Número" />
            <input className="campo" value={slide.legenda} onChange={(e) => set("legenda", e.target.value)} placeholder="Legenda do número" aria-label="Legenda" />
          </div>
        )}
        {campos.includes("corpo") && (
          <textarea
            className="campo"
            style={{ minHeight: slide.tipo === "citacao" ? 70 : 110 }}
            value={slide.corpo}
            onChange={(e) => set("corpo", e.target.value)}
            placeholder={slide.tipo === "citacao" ? "Frase" : "Texto do slide"}
            aria-label="Texto"
          />
        )}
        {campos.includes("autor") && (
          <input className="campo" value={slide.autor} onChange={(e) => set("autor", e.target.value)} placeholder="Autor ou fonte (opcional)" aria-label="Autor" />
        )}
        {campos.includes("itens") && (
          <div className="editor-campos">
            {(slide.itens || []).map((item, k) => (
              <div className="editor-item" key={k}>
                <input
                  className="campo"
                  value={item}
                  onChange={(e) => set("itens", slide.itens.map((x, j) => (j === k ? e.target.value : x)))}
                  placeholder={`Item ${k + 1}`}
                  aria-label={`Item ${k + 1}`}
                />
                <button type="button" className="btn btn-icone" onClick={() => set("itens", slide.itens.filter((_, j) => j !== k))} aria-label={`Remover item ${k + 1}`}><X size={15} /></button>
              </div>
            ))}
            {(slide.itens || []).length < 6 && (
              <button type="button" className="btn btn-pequeno" style={{ justifySelf: "start" }} onClick={() => set("itens", [...(slide.itens || []), ""])}>
                <Plus size={15} /> Item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorSlides({ slides, modelo, aoMudar, aoMover, aoDuplicar, aoExcluir, aoAdicionar }) {
  return (
    <>
      <div className="lista-slides">
        {slides.map((s, i) => (
          <CartaoSlide
            key={i}
            slide={s}
            indice={i}
            total={slides.length}
            modelo={modelo}
            aoMudar={(x) => aoMudar(i, x)}
            aoMover={(d) => aoMover(i, d)}
            aoDuplicar={() => aoDuplicar(i)}
            aoExcluir={() => aoExcluir(i)}
          />
        ))}
      </div>
      <div className="opcoes" style={{ marginTop: 14 }}>
        <span className="dica">Adicionar</span>
        {TIPOS.map((t) => (
          <button key={t.id} type="button" className="btn btn-pequeno" onClick={() => aoAdicionar(t.id)}>
            <Plus size={14} /> {t.nome}
          </button>
        ))}
      </div>
    </>
  );
}
