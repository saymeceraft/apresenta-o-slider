import { useRef, useState } from "react";
import { Image as Icone, Trash2, Upload } from "lucide-react";
import { FUNDO_PADRAO, MARCA_PADRAO, POSICOES, prepararImagem } from "../core/composicao.js";

const Bloco = ({ titulo, children }) => (
  <div className="cartao-claro" style={{ display: "grid", gap: 12 }}>
    <div className="rotulo-campo" style={{ margin: 0 }}>{titulo}</div>
    {children}
  </div>
);

const Faixa = ({ rotulo, valor, min, max, passo, aoMudar, formato }) => (
  <label style={{ display: "grid", gap: 4 }}>
    <span className="dica">{rotulo}: {formato ? formato(valor) : valor}</span>
    <input type="range" min={min} max={max} step={passo} value={valor} onChange={(e) => aoMudar(Number(e.target.value))} />
  </label>
);

export default function PainelVisual({ fundo, marca, aoMudarFundo, aoMudarMarca }) {
  const f = { ...FUNDO_PADRAO, ...(fundo || {}) };
  const m = { ...MARCA_PADRAO, ...(marca || {}) };
  const [erro, setErro] = useState("");
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

  return (
    <div className="grade-visual">
      <Bloco titulo="Plano de fundo">
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
              Cor
              <input type="color" value={f.cor} onChange={(e) => aoMudarFundo({ ...f, cor: e.target.value })} aria-label="Cor do fundo" />
            </label>
            {f.tipo === "gradiente" && (
              <label className="dica" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                Segunda cor
                <input type="color" value={f.cor2} onChange={(e) => aoMudarFundo({ ...f, cor2: e.target.value })} aria-label="Segunda cor do gradiente" />
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
                <Upload size={15} /> {f.imagem ? "Trocar imagem" : "Escolher imagem"}
              </button>
              {f.imagem && (
                <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => aoMudarFundo({ ...f, tipo: "modelo", imagem: null })}>
                  <Trash2 size={15} /> Remover
                </button>
              )}
            </div>
            {f.imagem && (
              <>
                <img src={f.imagem} alt="" style={{ width: "100%", maxHeight: 110, objectFit: "cover", borderRadius: 8 }} />
                <Faixa rotulo="Escurecer" valor={f.escurecer} min={0} max={0.8} passo={0.05}
                  formato={(v) => `${Math.round(v * 100)}%`} aoMudar={(v) => aoMudarFundo({ ...f, escurecer: v })} />
                <p className="dica">O texto fica claro ou escuro conforme o fundo, para continuar legível.</p>
              </>
            )}
          </>
        )}
      </Bloco>

      <Bloco titulo="Marca d'água">
        <div className="opcoes">
          <button type="button" className="opcao" aria-pressed={!m.ativa} onClick={() => aoMudarMarca({ ...m, ativa: false })}>Sem marca</button>
          <button type="button" className="opcao" aria-pressed={m.ativa && m.tipo === "texto"} onClick={() => aoMudarMarca({ ...m, ativa: true, tipo: "texto" })}>Texto</button>
          <button type="button" className="opcao" aria-pressed={m.ativa && m.tipo === "imagem"}
            onClick={() => (m.imagem ? aoMudarMarca({ ...m, ativa: true, tipo: "imagem" }) : arqMarca.current?.click())}>Logo</button>
        </div>

        <input ref={arqMarca} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { carregar(e.target.files?.[0], "marca"); e.target.value = ""; }} />

        {m.ativa && m.tipo === "texto" && (
          <input className="campo" value={m.texto} placeholder="Ex.: ADIT · Confidencial"
            onChange={(e) => aoMudarMarca({ ...m, texto: e.target.value })} aria-label="Texto da marca d'água" />
        )}

        {m.ativa && m.tipo === "imagem" && (
          <div className="opcoes">
            <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => arqMarca.current?.click()}>
              <Icone size={15} /> {m.imagem ? "Trocar logo" : "Escolher logo"}
            </button>
            {m.imagem && <img src={m.imagem} alt="" style={{ height: 34, objectFit: "contain" }} />}
          </div>
        )}

        {m.ativa && (
          <>
            <div className="opcoes">
              {POSICOES.map(([v, nome]) => (
                <button key={v} type="button" className="opcao" aria-pressed={m.posicao === v}
                  onClick={() => aoMudarMarca({ ...m, posicao: v })}>{nome}</button>
              ))}
            </div>
            <Faixa rotulo="Tamanho" valor={m.tamanho} min={0.5} max={3} passo={0.1} formato={(v) => `${v.toFixed(1)}×`}
              aoMudar={(v) => aoMudarMarca({ ...m, tamanho: v })} />
            <Faixa rotulo="Opacidade" valor={m.opacidade} min={0.05} max={1} passo={0.05} formato={(v) => `${Math.round(v * 100)}%`}
              aoMudar={(v) => aoMudarMarca({ ...m, opacidade: v })} />
            <button type="button" className="opcao" aria-pressed={m.naCapa} onClick={() => aoMudarMarca({ ...m, naCapa: !m.naCapa })}>
              Mostrar também na capa
            </button>
          </>
        )}
      </Bloco>

      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}
