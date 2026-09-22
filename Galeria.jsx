import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Trash2, Upload, X } from "lucide-react";
import SlideView from "./SlideView.jsx";
import { escuro, fonteNome } from "../core/cores.js";
import { NOME_CAPA, NOME_DECO } from "../core/modelos.js";

const paleta = (t) => [
  ["Fundo", t.bgGrad ? t.bgGrad[0] : t.bg],
  ["Texto", t.fg],
  ["Secundário", t.muted],
  ["Destaque", t.accent],
];

function Previa({ modelo, slides, aberto, aoFechar, aoUsar, aoRemover }) {
  const [i, setI] = useState(0);

  useEffect(() => { setI(0); }, [modelo?.id]);
  useEffect(() => {
    if (!aberto) return;
    const h = (e) => {
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowRight") setI((v) => (v + 1) % slides.length);
      if (e.key === "ArrowLeft") setI((v) => (v - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aberto, slides.length, aoFechar]);

  if (!aberto || !modelo) return null;
  const atual = slides[Math.min(i, slides.length - 1)];

  return (
    <div className="fundo-modal" onClick={aoFechar}>
      <div className="modal" role="dialog" aria-label={`Pré-visualização ${modelo.nome}`} onClick={(e) => e.stopPropagation()}>
        <div className="secao-cabecalho" style={{ marginBottom: 0 }}>
          <div>
            <h2>{modelo.nome}</h2>
            <p className="dica">Slide {i + 1} de {slides.length}</p>
          </div>
          <button type="button" className="btn btn-icone" onClick={aoFechar} aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="modal-grade">
          <div>
            <div className="moldura" style={{ position: "relative" }}>
              <SlideView modelo={modelo} slide={atual} />
              <button type="button" className="navegar" style={{ left: 12 }} onClick={() => setI((v) => (v - 1 + slides.length) % slides.length)} aria-label="Slide anterior"><ChevronLeft size={20} /></button>
              <button type="button" className="navegar" style={{ right: 12 }} onClick={() => setI((v) => (v + 1) % slides.length)} aria-label="Próximo slide"><ChevronRight size={20} /></button>
            </div>
            <div className="tiras">
              {slides.map((s, k) => (
                <button key={k} type="button" className="tira" aria-current={k === i} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`}>
                  <SlideView modelo={modelo} slide={s} />
                </button>
              ))}
            </div>
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <p className="dica">{modelo.desc}</p>
              <p className="dica" style={{ marginTop: 8 }}>
                Capa: {NOME_CAPA[modelo.capa]}<br />Elemento: {NOME_DECO[modelo.deco]}
              </p>
              {modelo.arquivo && <p className="dica" style={{ marginTop: 8 }}>Referência: {modelo.arquivo}</p>}
            </div>
            <div>
              <div className="rotulo-campo">Tipografia</div>
              <div style={{ fontFamily: `var(--fonte)`, fontSize: 14, color: "var(--muted)" }}>{fonteNome(modelo)}</div>
            </div>
            <div>
              <div className="rotulo-campo">Paleta</div>
              {paleta(modelo).map(([nome, cor]) => (
                <div key={nome} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: cor, boxShadow: "inset 0 0 0 1px var(--border)" }} />
                  <span style={{ fontSize: 14, flex: 1 }}>{nome}</span>
                  <span className="dica">{String(cor).toUpperCase()}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto", display: "grid", gap: 8 }}>
              <button type="button" className="btn btn-principal" onClick={() => aoUsar(modelo.id)}>
                <Check size={18} /> Usar este modelo
              </button>
              {modelo.origem === "importado" && (
                <button type="button" className="btn btn-perigo" onClick={() => aoRemover(modelo.id)}>
                  <Trash2 size={16} /> Remover modelo
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function Galeria({
  modelos, slides, escolhido, recomendado, motivo,
  aoUsar, aoImportar, importando, aviso, aoRemover,
}) {
  const [filtro, setFiltro] = useState("meus");
  const [aberto, setAberto] = useState(null);
  const entrada = useRef(null);

  const FILTROS = [
    ["meus", "Seus modelos", (t) => t.origem !== "base"],
    ["todos", "Todos", () => true],
    ["claros", "Claros", (t) => !escuro(t)],
    ["escuros", "Escuros", (t) => escuro(t)],
    ["base", "Básicos", (t) => t.origem === "base"],
  ];
  const fn = (FILTROS.find((f) => f[0] === filtro) || FILTROS[0])[2];
  const lista = modelos.filter(fn).sort((a, b) => (b.id === recomendado) - (a.id === recomendado));
  const miniaturas = slides.slice(1, 4);
  const modeloAberto = modelos.find((t) => t.id === aberto) || null;

  return (
    <>
      <div className="secao-cabecalho">
        <h2>Escolha o design</h2>
        <div className="opcoes">
          {FILTROS.map(([id, nome, f]) => (
            <button key={id} type="button" className="opcao" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
              {nome} <span style={{ opacity: 0.6 }}>{modelos.filter(f).length}</span>
            </button>
          ))}
          <input
            ref={entrada}
            type="file"
            accept=".md,.markdown,.txt"
            multiple
            style={{ display: "none" }}
            onChange={(e) => { aoImportar(e.target.files); e.target.value = ""; }}
          />
          <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => entrada.current?.click()} disabled={!!importando}>
            {importando ? <Loader2 size={15} className="girando" /> : <Upload size={15} />}
            {importando ? "Importando" : "Importar .md"}
          </button>
        </div>
      </div>

      <p className="dica" style={{ marginBottom: 16 }}>
        {importando || aviso || (recomendado
          ? `Sugestão: ${modelos.find((t) => t.id === recomendado)?.nome}${motivo ? ` — ${motivo}` : ""}. Você pode escolher qualquer outro.`
          : "Todos os modelos mostram a sua apresentação. O conteúdo não muda ao trocar de design.")}
      </p>

      <div className="galeria">
        {lista.map((t) => (
          <button key={t.id} type="button" className="modelo" aria-pressed={escolhido === t.id} onClick={() => setAberto(t.id)}>
            <div className="moldura">
              <SlideView modelo={t} slide={slides[0]} />
            </div>
            {miniaturas.length > 0 && (
              <div className="modelo-miniaturas" style={{ gridTemplateColumns: `repeat(${miniaturas.length}, 1fr)` }}>
                {miniaturas.map((s, i) => (
                  <div className="moldura" key={i} style={{ borderRadius: 6 }}>
                    <SlideView modelo={t} slide={s} />
                  </div>
                ))}
              </div>
            )}
            <div className="modelo-rodape">
              <div className="modelo-linha">
                <span className="modelo-nome">{t.nome}</span>
                {escolhido === t.id ? <span className="etiqueta etiqueta-cheia"><Check size={12} />Em uso</span>
                  : t.id === recomendado ? <span className="etiqueta etiqueta-azul">Sugerido</span>
                    : t.origem === "importado" ? <span className="etiqueta">Importado</span> : null}
              </div>
              <p className="modelo-desc">{t.desc}</p>
              <div className="modelo-linha">
                <span className="amostra-cores">
                  {paleta(t).map(([n, v]) => <span key={n} title={n} style={{ background: v }} />)}
                </span>
                <span className="dica">{fonteNome(t)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Previa
        modelo={modeloAberto}
        slides={slides}
        aberto={!!modeloAberto}
        aoFechar={() => setAberto(null)}
        aoUsar={(id) => { setAberto(null); aoUsar(id); }}
        aoRemover={(id) => { setAberto(null); aoRemover(id); }}
      />
    </>
  );
}
