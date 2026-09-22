import { useRef, useState } from "react";
import { Move, Trash2, Upload } from "lucide-react";
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
      <span className="dica"><Move size={13} style={{ verticalAlign: "-2px" }} /> Arraste a marca para onde quiser</span>
      <div
        ref={area}
        className="posicionador moldura"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setArrastando(true); mover(e); }}
        onPointerMove={(e) => arrastando && mover(e)}
        onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); setArrastando(false); }}
        onPointerCancel={() => setArrastando(false)}
      >
        <SlideView modelo={modelo} slide={slide} />
        <span className="alvo-marca" style={{
          left: `${(atual.x / 960) * 100}%`, top: `${(atual.y / 540) * 100}%`,
          width: `${(largura / 960) * 100}%`, height: `${(altura / 540) * 100}%`,
        }} />
      </div>
    </div>
  );
}

export default function PainelVisual({ fundo, marca, modelo, slide, aoMudarFundo, aoMudarMarca }) {
  const f = { ...FUNDO_PADRAO, ...(fundo || {}) };
  const m = { ...MARCA_PADRAO, ...(marca || {}) };
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState(false);
  const arqFundo = useRef(null);
  const arqMarca = useRef(null);

  const carregar = async (arquivo, destino) => {
    setErro("");
    if (!arquivo) return;
    if (arquivo.size > 8 * 1024 * 1024) { setErro("Imagem muito grande. Use um arquivo de até 8 MB."); return; }
    try {
      const { dados, proporcao } = await prepararImagem(arquivo, destino === "fundo" ? 1600 : 900);
      if (destino === "fundo") aoMudarFundo({ ...f, tipo: "imagem", imagem: dados });
      else aoMudarMarca({ ...m, ativa: true, tipo: "imagem", imagem: dados, proporcao });
    } catch (e) {
      setErro(e.message || "Não consegui usar essa imagem.");
    }
  };

  const nomeFundo = { modelo: "fundo do modelo", cor: "fundo em cor", gradiente: "fundo em gradiente", imagem: "fundo com imagem" }[f.tipo];
  const resumo = `${nomeFundo} · ${m.ativa ? (m.tipo === "imagem" ? "logo" : "marca em texto") : "sem marca d'água"}`;

  return (
    <section className="cartao-claro" style={{ display: "grid", gap: 14 }}>
      <div className="secao-cabecalho" style={{ margin: 0 }}>
        <div>
          <strong style={{ fontSize: 15 }}>Fundo e marca d'água</strong>
          <p className="dica" style={{ margin: "2px 0 0" }}>{resumo}</p>
        </div>
        <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
          {aberto ? "Fechar" : "Ajustar"}
        </button>
      </div>

      {aberto && (
        <div className="grade-visual">
          <div style={{ display: "grid", gap: 12 }}>
            <div className="rotulo-campo" style={{ margin: 0 }}>Plano de fundo</div>
            <div className="opcoes">
              {[["modelo", "Do modelo"], ["cor", "Cor"], ["gradiente", "Gradiente"], ["imagem", "Imagem"]].map(([v, nome]) => (
                <button key={v} type="button" className="opcao" aria-pressed={f.tipo === v}
                  onClick={() => (v === "imagem" && !f.imagem ? arqFundo.current?.click() : aoMudarFundo({ ...f, tipo: v }))}>
                  {nome}
                </button>
              ))}
            </div>

            {(f.tipo === "cor" || f.tipo === "gradiente") && (
              <div className="opcoes">
                <label className="dica" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Cor <input type="color" value={f.cor} onChange={(e) => aoMudarFundo({ ...f, cor: e.target.value })} aria-label="Cor do fundo" />
                </label>
                {f.tipo === "gradiente" && (
                  <label className="dica" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    Segunda cor <input type="color" value={f.cor2} onChange={(e) => aoMudarFundo({ ...f, cor2: e.target.value })} aria-label="Segunda cor" />
                  </label>
                )}
              </div>
            )}

            <input ref={arqFundo} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { carregar(e.target.files?.[0], "fundo"); e.target.value = ""; }} />

            {f.tipo === "imagem" && (
              <>
                <div className="opcoes">
                  <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => arqFundo.current?.click()}>
                    <Upload size={15} /> {f.imagem ? "Trocar imagem" : "Enviar imagem"}
                  </button>
                  {f.imagem && (
                    <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => aoMudarFundo({ ...f, tipo: "modelo", imagem: null })}>
                      <Trash2 size={15} /> Remover
                    </button>
                  )}
                </div>
                {f.imagem && (
                  <Faixa rotulo="Escurecer" valor={f.escurecer} min={0} max={0.8} passo={0.05}
                    formato={(v) => `${Math.round(v * 100)}%`} aoMudar={(v) => aoMudarFundo({ ...f, escurecer: v })} />
                )}
              </>
            )}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div className="rotulo-campo" style={{ margin: 0 }}>Marca d'água</div>
            <input ref={arqMarca} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { carregar(e.target.files?.[0], "marca"); e.target.value = ""; }} />

            <div className="opcoes">
              <button type="button" className="opcao" aria-pressed={!m.ativa} onClick={() => aoMudarMarca({ ...m, ativa: false })}>Sem marca</button>
              <button type="button" className="opcao" aria-pressed={m.ativa && m.tipo === "texto"} onClick={() => aoMudarMarca({ ...m, ativa: true, tipo: "texto" })}>Texto</button>
              <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => arqMarca.current?.click()}>
                <Upload size={15} /> {m.imagem ? "Trocar logo" : "Enviar logo"}
              </button>
              {m.imagem && m.tipo === "imagem" && (
                <img src={m.imagem} alt="" style={{ height: 30, objectFit: "contain" }} />
              )}
            </div>

            {m.ativa && m.tipo === "texto" && (
              <input className="campo" value={m.texto} placeholder="Ex.: ADIT · Confidencial"
                onChange={(e) => aoMudarMarca({ ...m, texto: e.target.value })} aria-label="Texto da marca d'água" />
            )}

            {m.ativa && (
              <>
                {modelo && slide && <Posicionador modelo={modelo} slide={slide} marca={m} aoMudar={aoMudarMarca} />}
                <div className="opcoes">
                  <span className="dica">Cantos</span>
                  {POSICOES.map(([v, nome]) => (
                    <button key={v} type="button" className="opcao"
                      aria-pressed={m.x === null && m.posicao === v}
                      onClick={() => aoMudarMarca({ ...m, posicao: v, x: null, y: null })}>{nome}</button>
                  ))}
                </div>
                <Faixa rotulo="Tamanho" valor={m.tamanho} min={0.5} max={3} passo={0.1} formato={(v) => `${v.toFixed(1)}×`}
                  aoMudar={(v) => aoMudarMarca({ ...m, tamanho: v })} />
                <Faixa rotulo="Opacidade" valor={m.opacidade} min={0.05} max={1} passo={0.05} formato={(v) => `${Math.round(v * 100)}%`}
                  aoMudar={(v) => aoMudarMarca({ ...m, opacidade: v })} />
                <div className="opcoes">
                  <button type="button" className="opcao" aria-pressed={m.naCapa} onClick={() => aoMudarMarca({ ...m, naCapa: !m.naCapa })}>
                    Mostrar na capa
                  </button>
                  {m.tipo === "texto" && (
                    <button type="button" className="opcao" aria-pressed={!!m.inclinada} onClick={() => aoMudarMarca({ ...m, inclinada: !m.inclinada })}>
                      Grande e inclinada
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {erro && <p className="erro">{erro}</p>}
    </section>
  );
}
