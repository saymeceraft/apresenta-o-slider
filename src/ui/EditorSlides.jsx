import { AlignCenter, AlignLeft, AlignRight, ArrowUp, ArrowDown, Bold, Copy, Italic, Minus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { TIPOS, converterSlide } from "../core/deck.js";
import SlideView from "./SlideView.jsx";

const ALINHAMENTOS = [["l", AlignLeft, "à esquerda"], ["ctr", AlignCenter, "centralizado"], ["r", AlignRight, "à direita"]];

/** Ferramentas de texto de um campo: tamanho, negrito, itálico, alinhamento e cor. */
function BarraEstilo({ nome, estilo, aoMudar }) {
  const e = estilo || {};
  const escala = Number(e.escala) || 1;
  const set = (mudanca) => aoMudar({ ...e, ...mudanca });
  const mexido = Object.keys(e).length > 0;

  return (
    <div className="barra-estilo" role="group" aria-label={`Formatação: ${nome}`}>
      <button type="button" className="fmt" title={`Diminuir ${nome}`} onClick={() => set({ escala: Math.max(0.6, Math.round((escala - 0.1) * 10) / 10) })} aria-label={`Diminuir ${nome}`}><Minus size={13} /></button>
      <span className="fmt-valor" aria-hidden="true">{Math.round(escala * 100)}%</span>
      <button type="button" className="fmt" title={`Aumentar ${nome}`} onClick={() => set({ escala: Math.min(2, Math.round((escala + 0.1) * 10) / 10) })} aria-label={`Aumentar ${nome}`}><Plus size={13} /></button>
      <button type="button" className="fmt" title={`Negrito em ${nome}`} aria-pressed={e.negrito === true} onClick={() => set({ negrito: e.negrito === true ? null : true })} aria-label={`Negrito em ${nome}`}><Bold size={13} /></button>
      <button type="button" className="fmt" title={`Itálico em ${nome}`} aria-pressed={e.italico === true} onClick={() => set({ italico: e.italico === true ? null : true })} aria-label={`Itálico em ${nome}`}><Italic size={13} /></button>
      {ALINHAMENTOS.map(([v, Icone, desc]) => (
        <button key={v} type="button" className="fmt" title={`Alinhar ${desc}`} aria-pressed={e.align === v} onClick={() => set({ align: e.align === v ? null : v })} aria-label={`Alinhar ${desc}`}><Icone size={13} /></button>
      ))}
      <input type="color" className="fmt-cor" title={`Cor de ${nome}`} value={e.cor || "#000000"} onChange={(ev) => set({ cor: ev.target.value })} aria-label={`Cor de ${nome}`} />
      {mexido && (
        <button type="button" className="fmt" title={`Voltar ${nome} ao padrão do modelo`} onClick={() => aoMudar({})} aria-label={`Voltar ${nome} ao padrão do modelo`}><RotateCcw size={13} /></button>
      )}
    </div>
  );
}

/** Um campo do editor com a sua barra de formatação. */
function Campo({ nome, estilo, aoMudarEstilo, children }) {
  return (
    <div className="campo-bloco">
      <BarraEstilo nome={nome} estilo={estilo} aoMudar={aoMudarEstilo} />
      {children}
    </div>
  );
}

function CartaoSlide({ slide, indice, total, modelo, temMarca, aoMudar, aoMover, aoDuplicar, aoExcluir }) {
  const set = (k, v) => aoMudar({ ...slide, [k]: v });
  const campos = (TIPOS.find((t) => t.id === slide.tipo) || TIPOS[0]).campos;
  const estiloDe = (campo) => (slide.estilo || {})[campo] || {};
  const mudarEstilo = (campo, valor) => {
    const estilo = { ...(slide.estilo || {}) };
    if (!valor || Object.keys(valor).length === 0) delete estilo[campo];
    else estilo[campo] = valor;
    aoMudar({ ...slide, estilo });
  };


  return (
    <div className="editor-slide">
      <div className="editor-topo">
        <span className="editor-num">{indice + 1}</span>
        <select
          className="select-tipo"
          value={slide.tipo}
          onChange={(e) => aoMudar(converterSlide(slide, e.target.value))}
          aria-label={`Tipo do slide ${indice + 1}`}
        >
          {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <div className="editor-acoes">
          <button type="button" className="btn btn-icone" onClick={() => aoMover(-1)} disabled={indice === 0} title="Mover para cima" aria-label="Mover para cima"><ArrowUp size={15} /></button>
          <button type="button" className="btn btn-icone" onClick={() => aoMover(1)} disabled={indice === total - 1} title="Mover para baixo" aria-label="Mover para baixo"><ArrowDown size={15} /></button>
          <button type="button" className="btn btn-icone" onClick={aoDuplicar} title="Duplicar slide" aria-label="Duplicar slide"><Copy size={15} /></button>
          <button type="button" className="btn btn-icone" onClick={aoExcluir} disabled={total <= 1} title="Excluir slide" aria-label="Excluir slide" style={{ color: "var(--perigo)" }}><Trash2 size={15} /></button>
        </div>
        <div style={{ width: "100%" }}>
          {temMarca && (
            <button type="button" className="opcao" style={{ height: 28, fontSize: 13 }} aria-pressed={!slide.semMarca}
              onClick={() => aoMudar({ ...slide, semMarca: !slide.semMarca })}>
              {slide.semMarca ? "Mostrar marca aqui" : "Ocultar marca aqui"}
            </button>
          )}
        </div>
      </div>

      {modelo && (
        <div className="moldura" style={{ marginBottom: 10 }}>
          <SlideView modelo={modelo} slide={slide} />
        </div>
      )}

      <div className="editor-campos">
        {campos.includes("titulo") && (
          <Campo estilo={estiloDe("titulo")} aoMudarEstilo={(v) => mudarEstilo("titulo", v)} nome="título">
            <input className="campo" value={slide.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Título" aria-label="Título" />
          </Campo>
        )}
        {campos.includes("subtitulo") && (
          <Campo estilo={estiloDe("subtitulo")} aoMudarEstilo={(v) => mudarEstilo("subtitulo", v)} nome="subtítulo">
            <input className="campo" value={slide.subtitulo} onChange={(e) => set("subtitulo", e.target.value)} placeholder="Subtítulo" aria-label="Subtítulo" />
          </Campo>
        )}
        {campos.includes("numero") && (
          <>
            <Campo estilo={estiloDe("numero")} aoMudarEstilo={(v) => mudarEstilo("numero", v)} nome="número">
              <input className="campo" style={{ maxWidth: 140 }} value={slide.numero} onChange={(e) => set("numero", e.target.value)} placeholder="42%" aria-label="Número" />
            </Campo>
            <Campo estilo={estiloDe("legenda")} aoMudarEstilo={(v) => mudarEstilo("legenda", v)} nome="legenda">
              <input className="campo" value={slide.legenda} onChange={(e) => set("legenda", e.target.value)} placeholder="Legenda do número" aria-label="Legenda" />
            </Campo>
          </>
        )}
        {campos.includes("corpo") && (
          <Campo estilo={estiloDe("corpo")} aoMudarEstilo={(v) => mudarEstilo("corpo", v)} nome={slide.tipo === "citacao" ? "frase" : "texto"}>
            <textarea
              className="campo"
              style={{ minHeight: slide.tipo === "citacao" ? 70 : 110 }}
              value={slide.corpo}
              onChange={(e) => set("corpo", e.target.value)}
              placeholder={slide.tipo === "citacao" ? "Frase" : "Texto do slide"}
              aria-label="Texto"
            />
          </Campo>
        )}
        {campos.includes("autor") && (
          <Campo estilo={estiloDe("autor")} aoMudarEstilo={(v) => mudarEstilo("autor", v)} nome="autor">
            <input className="campo" value={slide.autor} onChange={(e) => set("autor", e.target.value)} placeholder="Autor ou fonte (opcional)" aria-label="Autor" />
          </Campo>
        )}
        {campos.includes("itens") && (
          <div className="editor-campos">
            <BarraEstilo nome="itens" estilo={estiloDe("itens")} aoMudar={(v) => mudarEstilo("itens", v)} />
            {(slide.itens || []).map((item, k) => (
              <div className="editor-item" key={k}>
                <input
                  className="campo"
                  value={item}
                  onChange={(e) => set("itens", slide.itens.map((x, j) => (j === k ? e.target.value : x)))}
                  placeholder={`Item ${k + 1}`}
                  aria-label={`Item ${k + 1}`}
                />
                <button type="button" className="btn btn-icone" onClick={() => set("itens", slide.itens.filter((_, j) => j !== k))} title="Remover item" aria-label={`Remover item ${k + 1}`}><X size={15} /></button>
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

export default function EditorSlides({ slides, modelo, temMarca, aoMudar, aoMover, aoDuplicar, aoExcluir, aoAdicionar }) {
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
            temMarca={temMarca}
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
