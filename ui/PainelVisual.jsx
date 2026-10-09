import { useRef, useState } from "react";
import { Move, Plus, Trash2, Upload, X } from "lucide-react";
import { FUNDO_PADRAO, MARCA_PADRAO, POSICOES, prepararImagem, posicaoMarca } from "../core/composicao.js";
import SlideView from "./SlideView.jsx";

const Faixa = ({ rotulo, valor, min, max, passo, aoMudar, formato }) => (
  <label style={{ display: "grid", gap: 4 }}>
    <span className="dica">{rotulo}: {formato ? formato(valor) : valor}</span>
    <input type="range" min={min} max={max} step={passo} value={valor} onChange={(e) => aoMudar(Number(e.target.value))} />
  </label>
);

/** Prévia onde a marca d'água é arrastada até a posição desejada. */
function Posicionador({ modelo, slide, marca, aoMudar }) {
  const area = useRef(null);
  const [arrastando, setArrastando] = useState(false);
  const corpo = marca.inclinada ? 60 : 20;
  const largura = marca.tipo === "imagem"
    ? 150 * marca.tamanho
    : Math.min(760, String(marca.texto || "").length * corpo * marca.tamanho * 0.62 + 20);
  const altura = marca.tipo === "imagem"
    ? (150 * marca.tamanho) / (Number(marca.proporcao) || 3)
    : corpo * marca.tamanho * 1.3;
  const atual = posicaoMarca(marca, largura, altura);

  const mover = (evento) => {
    const caixa = area.current?.getBoundingClientRect();
    if (!caixa) return;
    const k = caixa.width / 960;
    const x = (evento.clientX - caixa.left) / k - largura / 2;
    const y = (evento.clientY - caixa.top) / k - altura / 2;
    aoMudar({
      ...marca,
      x: Math.min(Math.max(x / Math.max(960 - largura, 1), 0), 1),
      y: Math.min(Math.max(y / Math.max(540 - altura, 1), 0), 1),
    });
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span className="dica"><Move size={13} style={{ verticalAlign: "-2px" }} /> Arraste a marca</span>
      <div ref={area} className="posicionador moldura"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setArrastando(true); mover(e); }}
        onPointerMove={(e) => arrastando && mover(e)}
        onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); setArrastando(false); }}
        onPointerCancel={() => setArrastando(false)}>
        <SlideView modelo={modelo} slide={slide} />
        <span className="alvo-marca" style={{
          left: `${(atual.x / 960) * 100}%`, top: `${(atual.y / 540) * 100}%`,
          width: `${(largura / 960) * 100}%`, height: `${(altura / 540) * 100}%`,
        }} />
      </div>
    </div>
  );
}

/** Controles do plano de fundo: cor, gradiente com várias paradas ou imagem. */
function ControlesFundo({ f, aoMudar, aoEnviar, entrada }) {
  const paradas = (f.paradas && f.paradas.length ? f.paradas : [f.cor]).slice(0, 6);
  const mudarParada = (i, cor) => aoMudar({ ...f, paradas: paradas.map((c, k) => (k === i ? cor : c)) });

  return (
    <>
      <div className="opcoes">
        {[["modelo", "Do modelo"], ["cor", "Cor"], ["gradiente", "Gradiente"], ["imagem", "Imagem"]].map(([v, nome]) => (
          <button key={v} type="button" className="opcao" aria-pressed={f.tipo === v}
            onClick={() => (v === "imagem" && !f.imagem ? entrada.current?.click() : aoMudar({ ...f, tipo: v }))}>
            {nome}
          </button>
        ))}
      </div>

      {f.tipo === "cor" && (
        <label className="dica linha-cor">
          Cor <input type="color" value={f.cor} onChange={(e) => aoMudar({ ...f, cor: e.target.value })} aria-label="Cor do fundo" />
        </label>
      )}

      {f.tipo === "gradiente" && (
        <>
          <div className="paradas">
            {paradas.map((c, i) => (
              <span key={i} className="parada">
                <input type="color" value={c} onChange={(e) => mudarParada(i, e.target.value)} aria-label={`Cor ${i + 1} do gradiente`} />
                {paradas.length > 2 && (
                  <button type="button" className="parada-x" title="Remover cor" aria-label={`Remover cor ${i + 1}`}
                    onClick={() => aoMudar({ ...f, paradas: paradas.filter((_, k) => k !== i) })}><X size={11} /></button>
                )}
              </span>
            ))}
            {paradas.length < 6 && (
              <button type="button" className="btn btn-icone" title="Adicionar cor" aria-label="Adicionar cor ao gradiente"
                onClick={() => aoMudar({ ...f, paradas: [...paradas, paradas[paradas.length - 1]] })}><Plus size={14} /></button>
            )}
          </div>
          <Faixa rotulo="Ângulo" valor={f.angulo ?? 135} min={0} max={360} passo={15}
            formato={(v) => `${v}°`} aoMudar={(v) => aoMudar({ ...f, angulo: v })} />
        </>
      )}

      {f.tipo === "imagem" && (
        <>
          <div className="opcoes">
            <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => entrada.current?.click()}>
              <Upload size={15} /> {f.imagem ? "Trocar imagem" : "Enviar imagem"}
            </button>
            {f.imagem && (
              <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => aoMudar({ ...f, tipo: "modelo", imagem: null })}>
                <Trash2 size={15} /> Remover
              </button>
            )}
          </div>
          {f.imagem && (
            <Faixa rotulo="Escurecer" valor={f.escurecer} min={0} max={0.8} passo={0.05}
              formato={(v) => `${Math.round(v * 100)}%`} aoMudar={(v) => aoMudar({ ...f, escurecer: v })} />
          )}
        </>
      )}
      <input ref={entrada} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { aoEnviar(e.target.files?.[0]); e.target.value = ""; }} />
    </>
  );
}

export default function PainelVisual({
  fundo, marca, modelo, slide, fundoSlide,
  aoMudarFundo, aoMudarMarca, aoMudarFundoSlide, embutido = false,
}) {
  const f = { ...FUNDO_PADRAO, ...(fundo || {}) };
  const fSlide = { ...FUNDO_PADRAO, ...(fundo || {}), ...(fundoSlide || {}) };
  const m = { ...MARCA_PADRAO, ...(marca || {}) };
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState(embutido);
  const [alvo, setAlvo] = useState("apresentacao");
  const arqFundo = useRef(null);
  const arqMarca = useRef(null);

  const porSlide = alvo === "slide" && !!aoMudarFundoSlide;
  const fundoAtual = porSlide ? fSlide : f;
  const aplicarFundo = (novo) => (porSlide ? aoMudarFundoSlide(novo) : aoMudarFundo(novo));

  const carregar = async (arquivo, destino) => {
    setErro("");
    if (!arquivo) return;
    if (arquivo.size > 8 * 1024 * 1024) { setErro("Use um arquivo de até 8 MB."); return; }
    try {
      const { dados, proporcao } = await prepararImagem(arquivo, destino === "fundo" ? 1600 : 900);
      if (destino === "fundo") aplicarFundo({ ...fundoAtual, tipo: "imagem", imagem: dados });
      else aoMudarMarca({ ...m, ativa: true, tipo: "imagem", imagem: dados, proporcao });
    } catch (e) {
      setErro(e.message || "Não consegui usar essa imagem.");
    }
  };

  const nomeFundo = { modelo: "fundo do modelo", cor: "fundo em cor", gradiente: "fundo em gradiente", imagem: "fundo com imagem" }[f.tipo];

  const corpo = (
    <>
      <div className="grupo-visual">
        <div className="rotulo-campo" style={{ margin: 0 }}>Plano de fundo</div>
        {aoMudarFundoSlide && (
          <div className="opcoes">
            <button type="button" className="opcao" aria-pressed={alvo === "apresentacao"} onClick={() => setAlvo("apresentacao")}>Toda a apresentação</button>
            <button type="button" className="opcao" aria-pressed={alvo === "slide"} onClick={() => setAlvo("slide")}>Só este slide</button>
          </div>
        )}
        <ControlesFundo f={fundoAtual} aoMudar={aplicarFundo} aoEnviar={(a) => carregar(a, "fundo")} entrada={arqFundo} />
        {porSlide && slide?.fundo && (
          <button type="button" className="btn btn-pequeno" onClick={() => aoMudarFundoSlide(null)}>Usar o fundo da apresentação</button>
        )}
      </div>

      <div className="grupo-visual">
        <div className="rotulo-campo" style={{ margin: 0 }}>Marca d'água</div>
        <input ref={arqMarca} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { carregar(e.target.files?.[0], "marca"); e.target.value = ""; }} />
        <div className="opcoes">
          <button type="button" className="opcao" aria-pressed={!m.ativa} onClick={() => aoMudarMarca({ ...m, ativa: false })}>Sem marca</button>
          <button type="button" className="opcao" aria-pressed={m.ativa && m.tipo === "texto"} onClick={() => aoMudarMarca({ ...m, ativa: true, tipo: "texto" })}>Texto</button>
          <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => arqMarca.current?.click()}>
            <Upload size={15} /> {m.imagem ? "Trocar logo" : "Enviar logo"}
          </button>
        </div>

        {m.ativa && m.tipo === "texto" && (
          <input className="campo" value={m.texto} placeholder="Ex.: Sua Empresa"
            onChange={(e) => aoMudarMarca({ ...m, texto: e.target.value })} aria-label="Texto da marca d'água" />
        )}

        {m.ativa && (
          <>
            {modelo && slide && <Posicionador modelo={modelo} slide={slide} marca={m} aoMudar={aoMudarMarca} />}
            <div className="opcoes">
              {POSICOES.map(([v, nome]) => (
                <button key={v} type="button" className="opcao" aria-pressed={m.x === null && m.posicao === v}
                  onClick={() => aoMudarMarca({ ...m, posicao: v, x: null, y: null })}>{nome}</button>
              ))}
            </div>
            <Faixa rotulo="Tamanho" valor={m.tamanho} min={0.5} max={3} passo={0.1} formato={(v) => `${v.toFixed(1)}×`}
              aoMudar={(v) => aoMudarMarca({ ...m, tamanho: v })} />
            <Faixa rotulo="Opacidade" valor={m.opacidade} min={0.05} max={1} passo={0.05} formato={(v) => `${Math.round(v * 100)}%`}
              aoMudar={(v) => aoMudarMarca({ ...m, opacidade: v })} />
            <div className="opcoes">
              <button type="button" className="opcao" aria-pressed={m.naCapa} onClick={() => aoMudarMarca({ ...m, naCapa: !m.naCapa })}>Mostrar na capa</button>
              {m.tipo === "texto" && (
                <button type="button" className="opcao" aria-pressed={!!m.inclinada} onClick={() => aoMudarMarca({ ...m, inclinada: !m.inclinada })}>Inclinada</button>
              )}
            </div>
          </>
        )}
      </div>
      {erro && <p className="erro">{erro}</p>}
    </>
  );

  if (embutido) return <div className="visual-embutido">{corpo}</div>;

  return (
    <section className="cartao-claro" style={{ display: "grid", gap: 14 }}>
      <div className="secao-cabecalho" style={{ margin: 0 }}>
        <div>
          <strong style={{ fontSize: 15 }}>Fundo e marca d'água</strong>
          <p className="dica" style={{ margin: "2px 0 0" }}>
            {nomeFundo} · {m.ativa ? (m.tipo === "imagem" ? "logo" : "marca em texto") : "sem marca d'água"}
          </p>
        </div>
        <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
          {aberto ? "Fechar" : "Ajustar"}
        </button>
      </div>
      {aberto && <div className="grade-visual">{corpo}</div>}
    </section>
  );
}
