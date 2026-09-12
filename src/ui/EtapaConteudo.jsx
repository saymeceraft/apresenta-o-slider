import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { OBJETIVOS, PUBLICOS, TONS } from "../core/ia.js";

const QUANTIDADES = [
  ["auto", "Automático"], [5, "5"], [8, "8"], [10, "10"], [15, "15"],
];

const EXEMPLO = `História do Campo ADIT

Tudo começou em 2015, com poucas famílias reunidas em uma casa.

Crescimento
Hoje são várias congregações espalhadas pela região.

Próximos passos
Continuar expandindo o trabalho e formar novos líderes.`;

const AVANCADO = `# Capa da apresentação
Linha de apoio

## Título do slide
- primeiro item
- segundo item

> Uma frase de impacto

! 42 | legenda do número`;

export default function EtapaConteudo({
  texto, setTexto, config, setConfig, aoMontar, aoGerarIA,
  gerando, iaOk, aviso, temDeck, aoAvancar,
}) {
  const mudar = (k, v) => setConfig({ ...config, [k]: v });

  return (
    <>
      <section className="cartao">
        <label className="rotulo-campo" htmlFor="conteudo">Cole ou escreva seu conteúdo</label>
        <textarea
          id="conteudo"
          className="campo"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={config.avancado ? AVANCADO : EXEMPLO}
          rows={10}
        />
        <div className="opcoes" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-principal" onClick={aoMontar} disabled={!texto.trim()}>
            <Wand2 size={17} /> Organizar em slides
          </button>
          <button
            type="button"
            className="opcao"
            aria-pressed={!!config.avancado}
            onClick={() => mudar("avancado", !config.avancado)}
          >
            Usar estrutura avançada
          </button>
          {temDeck && (
            <button type="button" className="btn btn-contorno" onClick={aoAvancar}>
              Continuar de onde parei
            </button>
          )}
        </div>
        {config.avancado ? (
          <p className="dica" style={{ marginTop: 10 }}>
            <code># capa</code> · <code>## slide</code> · <code>- item</code> · <code>&gt; citação</code> · <code>! número | legenda</code>
          </p>
        ) : (
          <p className="dica" style={{ marginTop: 10 }}>
            Escreva normalmente. O sistema reconhece o título, as seções, as listas e os parágrafos.
          </p>
        )}
      </section>

      <section className="secao">
        <div className="secao-cabecalho">
          <h2>Quantidade de slides</h2>
        </div>
        <div className="opcoes">
          {QUANTIDADES.map(([v, nome]) => (
            <button
              key={String(v)}
              type="button"
              className="opcao"
              aria-pressed={String(config.quantidade) === String(v)}
              onClick={() => mudar("quantidade", v)}
            >
              {nome}
            </button>
          ))}
          <input
            type="number"
            min={3}
            max={30}
            className="campo"
            style={{ width: 130 }}
            placeholder="Personalizado"
            value={QUANTIDADES.some(([v]) => String(v) === String(config.quantidade)) ? "" : config.quantidade}
            onChange={(e) => mudar("quantidade", e.target.value ? Number(e.target.value) : "auto")}
            aria-label="Quantidade personalizada de slides"
          />
        </div>
      </section>

      <section className="secao">
        <div className="secao-cabecalho">
          <h2>Gerar com IA <span className="etiqueta">opcional</span></h2>
        </div>
        {iaOk === false ? (
          <div className="cartao-claro">
            <p className="dica" style={{ margin: 0 }}>
              A geração com IA não está configurada neste ambiente. Você ainda pode criar,
              editar e exportar a apresentação normalmente escrevendo o conteúdo acima.
            </p>
          </div>
        ) : (
          <div className="cartao">
            <div className="grade-campos">
              <div>
                <label className="rotulo-campo" htmlFor="assunto">Assunto</label>
                <input
                  id="assunto"
                  className="campo"
                  value={config.assunto}
                  onChange={(e) => mudar("assunto", e.target.value)}
                  placeholder="Ex.: História do Campo ADIT"
                />
              </div>
              <div>
                <label className="rotulo-campo" htmlFor="objetivo">Objetivo</label>
                <select id="objetivo" className="campo" value={config.objetivo} onChange={(e) => mudar("objetivo", e.target.value)}>
                  {OBJETIVOS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label className="rotulo-campo" htmlFor="publico">Público</label>
                <select id="publico" className="campo" value={config.publico} onChange={(e) => mudar("publico", e.target.value)}>
                  {PUBLICOS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label className="rotulo-campo" htmlFor="tom">Tom</label>
                <select id="tom" className="campo" value={config.tom} onChange={(e) => mudar("tom", e.target.value)}>
                  {TONS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
            </div>
            <div className="opcoes" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-escuro"
                onClick={aoGerarIA}
                disabled={gerando || (!config.assunto.trim() && !texto.trim())}
              >
                {gerando ? <Loader2 size={17} className="girando" /> : <Sparkles size={17} />}
                {gerando ? "Gerando conteúdo" : "Gerar conteúdo com IA"}
              </button>
              <span className="dica">
                A IA usa o texto acima como base, quando houver. Ela escreve o conteúdo; o design continua sendo sua escolha.
              </span>
            </div>
          </div>
        )}
        {aviso && <p className="erro">{aviso}</p>}
      </section>
    </>
  );
}
