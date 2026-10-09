import { useEffect, useRef, useState } from "react";
import {
  ChevronDown, Copy, Image as IconeImagem, Maximize2, Plus, Redo2, Ruler, Trash2, Undo2,
} from "lucide-react";
import SlideView from "./SlideView.jsx";
import BarraEstilo from "./BarraEstilo.jsx";
import PainelVisual from "./PainelVisual.jsx";
import { TIPOS, converterSlide } from "../core/deck.js";
import { prepararImagem } from "../core/composicao.js";
import { W, H } from "../core/layout.js";

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5];

/** Resumo de uma linha para a miniatura da esquerda. */
const resumo = (s) =>
  s.titulo || s.corpo || s.legenda || (s.itens || []).join(", ") || s.subtitulo || TIPOS.find((t) => t.id === s.tipo)?.nome || "Slide";

function Secao({ titulo, children, aberta = true }) {
  const [on, setOn] = useState(aberta);
  return (
    <section className="prop-secao">
      <button type="button" className="prop-cabecalho" onClick={() => setOn(!on)} aria-expanded={on}>
        <span>{titulo}</span>
        <ChevronDown size={15} style={{ transform: on ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {on && <div className="prop-corpo">{children}</div>}
    </section>
  );
}

/** Campos de conteúdo do slide, cada um com a sua barra de formatação. */
function CamposConteudo({ slide, aoMudar }) {
  const set = (k, v) => aoMudar({ ...slide, [k]: v });
  const campos = (TIPOS.find((t) => t.id === slide.tipo) || TIPOS[0]).campos;
  const estiloDe = (campo) => (slide.estilo || {})[campo] || {};
  const mudarEstilo = (campo, valor) => {
    const estilo = { ...(slide.estilo || {}) };
    if (!valor || Object.keys(valor).length === 0) delete estilo[campo];
    else estilo[campo] = valor;
    aoMudar({ ...slide, estilo });
  };
  const Fmt = ({ campo, nome }) => (
    <BarraEstilo nome={nome} estilo={estiloDe(campo)} aoMudar={(v) => mudarEstilo(campo, v)} />
  );
  return (
    <div className="prop-campos">
      {campos.includes("titulo") && <Fmt campo="titulo" nome="título" />}
      {campos.includes("titulo") && (
        <input className="campo" value={slide.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Título" aria-label="Título" />
      )}
      {campos.includes("subtitulo") && <Fmt campo="subtitulo" nome="subtítulo" />}
      {campos.includes("subtitulo") && (
        <input className="campo" value={slide.subtitulo} onChange={(e) => set("subtitulo", e.target.value)} placeholder="Subtítulo" aria-label="Subtítulo" />
      )}
      {campos.includes("numero") && (
        <>
          <Fmt campo="numero" nome="número" />
          <input className="campo" value={slide.numero} onChange={(e) => set("numero", e.target.value)} placeholder="42%" aria-label="Número" />
          <input className="campo" value={slide.legenda} onChange={(e) => set("legenda", e.target.value)} placeholder="Legenda" aria-label="Legenda" />
        </>
      )}
      {campos.includes("corpo") && <Fmt campo="corpo" nome="texto" />}
      {campos.includes("corpo") && (
        <textarea className="campo" style={{ minHeight: 120 }} value={slide.corpo} onChange={(e) => set("corpo", e.target.value)}
          placeholder={slide.tipo === "citacao" ? "Frase" : "Texto do slide"} aria-label="Texto" />
      )}
      {campos.includes("autor") && (
        <input className="campo" value={slide.autor} onChange={(e) => set("autor", e.target.value)} placeholder="Autor (opcional)" aria-label="Autor" />
      )}
      {campos.includes("itens") && (
        <>
          <Fmt campo="itens" nome="itens" />
          {(slide.itens || []).map((item, k) => (
            <div className="editor-item" key={k}>
              <input className="campo" value={item} aria-label={`Item ${k + 1}`} placeholder={`Item ${k + 1}`}
                onChange={(e) => set("itens", slide.itens.map((x, j) => (j === k ? e.target.value : x)))} />
              <button type="button" className="btn btn-icone" title="Remover item" aria-label={`Remover item ${k + 1}`}
                onClick={() => set("itens", slide.itens.filter((_, j) => j !== k))}>×</button>
            </div>
          ))}
          {(slide.itens || []).length < 6 && (
            <button type="button" className="btn btn-pequeno" style={{ justifySelf: "start" }}
              onClick={() => set("itens", [...(slide.itens || []), ""])}><Plus size={14} /> Item</button>
          )}
        </>
      )}
    </div>
  );
}

export default function Editor({
  slides, indice, modelo, modeloBase, deck,
  aoSelecionar, aoMudarSlide, aoMover, aoDuplicar, aoExcluir, aoAdicionar,
  aoMudarFundo, aoMudarMarca, podeDesfazer, podeRefazer, aoDesfazer, aoRefazer,
  modelos, aoTrocarModelo, aoApresentar,
}) {
  const [zoom, setZoom] = useState(1);
  const [guias, setGuias] = useState(false);
  const [aba, setAba] = useState("conteudo");
  const [arrastando, setArrastando] = useState(null);
  const [erroImagem, setErroImagem] = useState("");
  const entradaFoto = useRef(null);
  const slide = slides[Math.min(indice, slides.length - 1)];

  useEffect(() => {
    const h = (e) => {
      const emCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? aoRefazer() : aoDesfazer();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault(); aoDuplicar(indice);
      } else if (!emCampo && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        aoSelecionar(Math.min(Math.max(indice + (e.key === "ArrowDown" ? 1 : -1), 0), slides.length - 1));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [indice, slides.length, aoDesfazer, aoRefazer, aoDuplicar, aoSelecionar]);

  const enviarFoto = async (arquivo) => {
    setErroImagem("");
    if (!arquivo) return;
    if (arquivo.size > 8 * 1024 * 1024) { setErroImagem("Use uma imagem de até 8 MB."); return; }
    try {
      const { dados } = await prepararImagem(arquivo, 1400);
      aoMudarSlide(indice, { ...slide, imagem: dados });
    } catch (e) {
      setErroImagem(e.message || "Não consegui usar essa imagem.");
    }
  };

  const soltar = (destino) => {
    if (arrastando === null || arrastando === destino) return;
    aoMover(arrastando, destino - arrastando);
    setArrastando(null);
  };

  return (
    <div className="editor">
      {/* ---------- esquerda: navegação ---------- */}
      <aside className="painel painel-slides" aria-label="Slides">
        <div className="painel-topo">
          <strong>Slides</strong>
          <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => aoAdicionar("texto")}>
            <Plus size={14} /> Adicionar
          </button>
        </div>
        <ol className="miniaturas">
          {slides.map((s, i) => (
            <li key={i}>
              <div
                className={`miniatura ${i === indice ? "ativa" : ""} ${arrastando === i ? "arrastando" : ""}`}
                draggable
                onDragStart={() => setArrastando(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => soltar(i)}
                onDragEnd={() => setArrastando(null)}
              >
                <button type="button" className="miniatura-btn" onClick={() => aoSelecionar(i)} aria-current={i === indice}>
                  <span className="miniatura-num">{i + 1}</span>
                  <span className="miniatura-quadro"><SlideView modelo={modelo} slide={s} deck={deck} /></span>
                  <span className="miniatura-titulo">{resumo(s).slice(0, 42)}</span>
                </button>
                <span className="miniatura-acoes">
                  <button type="button" className="btn btn-icone" title="Duplicar slide" aria-label={`Duplicar slide ${i + 1}`} onClick={() => aoDuplicar(i)}><Copy size={14} /></button>
                  <button type="button" className="btn btn-icone" title="Excluir slide" aria-label={`Excluir slide ${i + 1}`} disabled={slides.length <= 1}
                    onClick={() => aoExcluir(i)} style={{ color: "var(--perigo)" }}><Trash2 size={14} /></button>
                </span>
              </div>
            </li>
          ))}
        </ol>
        <div className="painel-rodape">
          <label className="rotulo-campo" htmlFor="modelo-atual">Modelo atual</label>
          <select id="modelo-atual" className="campo" value={modeloBase?.id || ""} onChange={(e) => aoTrocarModelo(e.target.value)}>
            {modelos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
      </aside>

      {/* ---------- centro: prévia ---------- */}
      <section className="painel painel-palco" aria-label="Prévia do slide">
        <div className="barra-palco">
          <button type="button" className="btn btn-icone" title="Desfazer" aria-label="Desfazer" disabled={!podeDesfazer} onClick={aoDesfazer}><Undo2 size={16} /></button>
          <button type="button" className="btn btn-icone" title="Refazer" aria-label="Refazer" disabled={!podeRefazer} onClick={aoRefazer}><Redo2 size={16} /></button>
          <select className="campo campo-mini" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom">
            {ZOOMS.map((z) => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
          </select>
          <button type="button" className={`btn btn-pequeno ${guias ? "btn-escuro" : ""}`} onClick={() => setGuias(!guias)} aria-pressed={guias}>
            <Ruler size={14} /> Guias
          </button>
          <span style={{ flex: 1 }} />
          <input ref={entradaFoto} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { enviarFoto(e.target.files?.[0]); e.target.value = ""; }} />
          <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => entradaFoto.current?.click()}>
            <IconeImagem size={14} /> {slide.imagem ? "Trocar imagem" : "Imagem"}
          </button>
          {slide.imagem && (
            <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => aoMudarSlide(indice, { ...slide, imagem: null })}>
              Remover
            </button>
          )}
          <button type="button" className="btn btn-pequeno btn-contorno" onClick={aoApresentar}>
            <Maximize2 size={14} /> Tela cheia
          </button>
        </div>

        <div className="palco-area">
          <div className="palco-slide" style={{ width: `min(100%, ${Math.round(W * zoom)}px)` }}>
            <SlideView modelo={modelo} slide={slide} deck={deck} />
            {guias && (
              <div className="guias" aria-hidden="true">
                <span className="guia-v" style={{ left: "50%" }} />
                <span className="guia-h" style={{ top: "50%" }} />
                <span className="guia-margem" style={{ inset: `${(64 / H) * 100}% ${(72 / W) * 100}%` }} />
              </div>
            )}
          </div>
          {erroImagem && <p className="erro">{erroImagem}</p>}
        </div>
      </section>

      {/* ---------- direita: propriedades ---------- */}
      <aside className="painel painel-props" aria-label="Propriedades do slide">
        <div className="painel-topo"><strong>Propriedades do slide</strong></div>
        <div className="abas-prop">
          {[["conteudo", "Conteúdo"], ["layout", "Layout"], ["estilo", "Estilo"]].map(([id, nome]) => (
            <button key={id} type="button" className="aba-prop" aria-pressed={aba === id} onClick={() => setAba(id)}>{nome}</button>
          ))}
        </div>

        {aba === "conteudo" && <CamposConteudo slide={slide} aoMudar={(x) => aoMudarSlide(indice, x)} />}

        {aba === "layout" && (
          <div className="prop-campos">
            <label className="rotulo-campo" htmlFor="tipo-slide">Tipo de slide</label>
            <select id="tipo-slide" className="campo" value={slide.tipo}
              onChange={(e) => aoMudarSlide(indice, converterSlide(slide, e.target.value))}>
              {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            <div className="opcoes">
              <button type="button" className="opcao" onClick={() => aoMover(indice, -1)} disabled={indice === 0}>Mover acima</button>
              <button type="button" className="opcao" onClick={() => aoMover(indice, 1)} disabled={indice === slides.length - 1}>Mover abaixo</button>
            </div>
            <div className="opcoes">
              <span className="dica">Adicionar depois deste</span>
              {TIPOS.map((t) => (
                <button key={t.id} type="button" className="opcao" onClick={() => aoAdicionar(t.id, indice + 1)}>{t.nome}</button>
              ))}
            </div>
          </div>
        )}

        {aba === "estilo" && (
          <div className="prop-campos">
            <PainelVisual
              fundo={deck.fundo}
              marca={deck.marca}
              modelo={modelo}
              slide={slide}
              fundoSlide={slide.fundo}
              aoMudarFundo={aoMudarFundo}
              aoMudarMarca={aoMudarMarca}
              aoMudarFundoSlide={(f) => aoMudarSlide(indice, { ...slide, fundo: f })}
              embutido
            />
          </div>
        )}
      </aside>
    </div>
  );
}
