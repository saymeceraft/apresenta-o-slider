import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Copy, Download, FileText, Globe, Loader2,
  Palette, Play, Presentation, Printer, RefreshCw, Undo2,
} from "lucide-react";

import Passos from "./ui/Passos.jsx";
import EtapaConteudo from "./ui/EtapaConteudo.jsx";
import EditorSlides from "./ui/EditorSlides.jsx";
import Galeria from "./ui/Galeria.jsx";
import Apresentar from "./ui/Apresentar.jsx";
import PainelVisual from "./ui/PainelVisual.jsx";
import SlideView from "./ui/SlideView.jsx";

import { listarModelos, modeloDeTokens, MODEL_REGISTRY } from "./core/modelos.js";
import { comporModelo, FUNDO_PADRAO, MARCA_PADRAO } from "./core/composicao.js";
import { NOMES_FONTES } from "./core/fontes.js";
import { novoSlide, duplicarSlide } from "./core/deck.js";
import { montarSlides, ajustarQuantidade } from "./core/parser.js";
import { construirPptx } from "./core/pptx.js";
import { exportarPdf, imprimir, baixarHtml } from "./core/pdf.js";
import { briefing } from "./core/briefing.js";
import { nomeArquivo, baixar, copiarTexto } from "./core/arquivo.js";
import { storageService, CHAVES } from "./core/armazenamento.js";
import { gerarDeck, iaDisponivel, interpretarModelo, ErroIA } from "./core/ia.js";
import useAutosave from "./hooks/useAutosave.js";

const CONFIG_PADRAO = {
  assunto: "", tom: "Institucional", objetivo: "Apresentação institucional",
  publico: "Público geral", quantidade: "auto", avancado: false,
};

const DECK_EXEMPLO = {
  fundo: FUNDO_PADRAO,
  marca: MARCA_PADRAO,
  slides: [
    { ...novoSlide("capa"), titulo: "Sua apresentação começa aqui", subtitulo: "Cole seu conteúdo para ver os modelos com ele" },
    { ...novoSlide("topicos"), titulo: "O que vamos abordar", itens: ["Contexto e cenário atual", "Principais desafios", "Proposta de solução", "Próximos passos"] },
    { ...novoSlide("destaque"), numero: "4", legenda: "eixos para organizar a conversa do início ao fim" },
    { ...novoSlide("fim"), titulo: "Obrigado", subtitulo: "Vamos construir juntos" },
  ],
};

export default function App() {
  const [etapa, setEtapa] = useState(1);
  const [maximo, setMaximo] = useState(1);
  const [texto, setTexto] = useState("");
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [deck, setDeck] = useState(DECK_EXEMPLO);
  const [proprio, setProprio] = useState(false);
  const [modeloId, setModeloId] = useState(null);
  const [recomendado, setRecomendado] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [importados, setImportados] = useState([]);
  const [importando, setImportando] = useState("");
  const [gerando, setGerando] = useState(false);
  const [exportando, setExportando] = useState("");
  const [aviso, setAviso] = useState("");
  const [recado, setRecado] = useState("");
  const [iaOk, setIaOk] = useState(null);
  const [apresentando, setApresentando] = useState(false);
  const [desfazer, setDesfazer] = useState(null);
  const [carregado, setCarregado] = useState(false);

  /* ---------- carregar o que estava salvo ---------- */
  useEffect(() => {
    (async () => {
      const [d, m, imp, cfg] = await Promise.all([
        storageService.get(CHAVES.deck),
        storageService.get(CHAVES.modelo),
        storageService.get(CHAVES.modelos),
        storageService.get(CHAVES.config),
      ]);
      if (Array.isArray(imp)) setImportados(imp);
      if (cfg && typeof cfg === "object") {
        const { etapa: salva, texto: textoSalvo, ...resto } = cfg;
        setConfig({ ...CONFIG_PADRAO, ...resto });
        if (typeof textoSalvo === "string") setTexto(textoSalvo);
        if (d?.slides?.length && Number.isInteger(salva)) {
          // Volta exatamente para onde a pessoa parou.
          setEtapa(Math.min(salva, m ? 5 : 3));
        }
      }
      if (d?.slides?.length) {
        setDeck(d);
        setProprio(true);
        setMaximo(m ? 5 : 3);
      }
      if (typeof m === "string") setModeloId(m);
      setCarregado(true);
    })();
    iaDisponivel().then(setIaOk);
  }, []);

  /* ---------- autosave ---------- */
  const salvarDeck = useCallback(async (d) => {
    if (!carregado || !proprio) return;
    await storageService.set(CHAVES.deck, d);
  }, [carregado, proprio]);
  const estadoSalvo = useAutosave(deck, salvarDeck);

  useEffect(() => {
    if (carregado) storageService.set(CHAVES.config, { ...config, etapa, texto });
  }, [config, etapa, texto, carregado]);
  useEffect(() => { if (carregado && modeloId) storageService.set(CHAVES.modelo, modeloId); }, [modeloId, carregado]);

  /* ---------- dados derivados ---------- */
  const modelos = useMemo(() => listarModelos(importados), [importados]);
  const modelo = useMemo(
    () => modelos.find((t) => t.id === modeloId) || null,
    [modelos, modeloId]
  );
  const base = modelo || MODEL_REGISTRY.base[0];
  // O modelo é o dono do visual; fundo e marca do deck entram por cima.
  const modeloComposto = useMemo(() => comporModelo(modelo, deck), [modelo, deck]);
  const modeloPreview = useMemo(() => comporModelo(base, deck), [base, deck]);
  const modelosCompostos = useMemo(() => modelos.map((t) => comporModelo(t, deck)), [modelos, deck]);
  const slides = deck.slides;

  const flash = (m) => { setRecado(m); setTimeout(() => setRecado(""), 3200); };
  const irPara = (n) => { setEtapa(n); setMaximo((v) => Math.max(v, n)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const atualizarDeck = (novos) => setDeck((d) => ({ ...d, slides: novos }));
  const mudarFundo = (fundo) => { setDeck((d) => ({ ...d, fundo })); setProprio(true); };
  const mudarMarca = (marca) => { setDeck((d) => ({ ...d, marca })); setProprio(true); };

  /* ---------- etapa 1: conteúdo ---------- */
  const montar = () => {
    const novos = montarSlides(texto, config);
    if (!novos.length) {
      setAviso("Não consegui encontrar conteúdo nesse texto. Escreva ao menos um título e um parágrafo.");
      return;
    }
    setAviso("");
    setProprio(true);
    atualizarDeck(novos);
    setRecomendado(null);
    setMotivo("");
    irPara(2);
  };

  const gerarComIA = async () => {
    setGerando(true);
    setAviso("");
    try {
      const r = await gerarDeck({ ...config, conteudo: texto }, modelos);
      setProprio(true);
      atualizarDeck(r.slides);
      setRecomendado(r.recomendado);
      setMotivo(r.motivo);
      irPara(2);
    } catch (e) {
      setAviso(e instanceof ErroIA ? e.message : "Não foi possível gerar a apresentação.");
      if (e?.motivo === "sem-chave") setIaOk(false);
    } finally {
      setGerando(false);
    }
  };

  /* ---------- etapa 2/4: estrutura e revisão ---------- */
  const mudarSlide = (i, s) => atualizarDeck(slides.map((x, k) => (k === i ? s : x)));
  const moverSlide = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    const arr = [...slides];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    atualizarDeck(arr);
  };
  const duplicar = (i) => {
    const arr = [...slides];
    arr.splice(i + 1, 0, duplicarSlide(slides[i]));
    atualizarDeck(arr);
  };
  const excluir = (i) => {
    if (slides.length <= 1) return;
    setDesfazer({ slide: slides[i], indice: i });
    atualizarDeck(slides.filter((_, k) => k !== i));
    setRecado(`Slide ${i + 1} excluído.`);
    setTimeout(() => { setDesfazer(null); setRecado((r) => (r.startsWith("Slide ") ? "" : r)); }, 9000);
  };
  const restaurar = () => {
    if (!desfazer) return;
    const arr = [...slides];
    arr.splice(Math.min(desfazer.indice, arr.length), 0, desfazer.slide);
    atualizarDeck(arr);
    setDesfazer(null);
    flash("Slide restaurado.");
  };
  const adicionar = (tipo) => atualizarDeck([...slides, novoSlide(tipo)]);
  const reaplicarQuantidade = (q) => {
    setConfig({ ...config, quantidade: q });
    const novos = ajustarQuantidade(slides, q);
    atualizarDeck(novos);
    const alvo = Number(q);
    if (alvo && novos.length !== alvo) {
      flash(novos.length > alvo
        ? `O conteúdo não coube em ${alvo} slides: ficaram ${novos.length}.`
        : `Não havia texto suficiente para ${alvo} slides: ficaram ${novos.length}.`);
    }
  };

  /* ---------- etapa 3: design ---------- */
  const usarModelo = (id) => {
    setModeloId(id); // o deck não é tocado: conteúdo e design são separados
    irPara(4);
  };

  const importarModelos = async (arquivos) => {
    const lista = Array.from(arquivos || []);
    if (!lista.length) return;
    const novos = [];
    const falhas = [];
    for (let i = 0; i < lista.length; i++) {
      setImportando(`Lendo ${i + 1} de ${lista.length}: ${lista[i].name}`);
      try {
        const tokens = await interpretarModelo(await lista[i].text(), lista[i].name);
        novos.push(modeloDeTokens(tokens, lista[i].name, NOMES_FONTES));
      } catch (e) {
        console.warn("Importação falhou:", lista[i].name, e);
        falhas.push(lista[i].name);
      }
    }
    setImportando("");
    if (novos.length) {
      const atualizados = [...importados, ...novos];
      setImportados(atualizados);
      await storageService.set(CHAVES.modelos, atualizados);
    }
    flash(falhas.length
      ? `${novos.length} importado(s). Não consegui ler: ${falhas.join(", ")}.`
      : `${novos.length} modelo(s) importado(s).`);
  };

  const removerModelo = async (id) => {
    const atualizados = importados.filter((t) => t.id !== id);
    setImportados(atualizados);
    await storageService.set(CHAVES.modelos, atualizados);
    if (modeloId === id) setModeloId(null);
  };

  /* ---------- etapa 5: exportar ---------- */
  const exportarPowerPoint = async () => {
    if (!modelo) return;
    setExportando("pptx");
    setRecado("Gerando o arquivo do PowerPoint…");
    await new Promise((r) => setTimeout(r, 30));
    try {
      baixar(
        nomeArquivo(deck, modelo, "pptx"),
        construirPptx(modeloComposto, slides),
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      );
      flash(`Baixado: ${nomeArquivo(deck, modelo, "pptx")}`);
    } catch (e) {
      console.error(e);
      flash("Não foi possível exportar o PowerPoint.");
    } finally {
      setExportando("");
    }
  };

  const exportarComoPdf = async () => {
    if (!modelo) return;
    setExportando("pdf");
    setRecado("Gerando o PDF…");
    try {
      await exportarPdf(modeloComposto, slides, nomeArquivo(deck, modelo, "pdf"),
        (i, total) => setExportando(`pdf:${i}/${total}`));
      flash(`Baixado: ${nomeArquivo(deck, modelo, "pdf")}`);
    } catch (e) {
      console.error(e);
      flash("Não foi possível gerar o PDF. Você pode usar Imprimir como alternativa.");
    } finally {
      setExportando("");
    }
  };

  const novaApresentacao = async () => {
    const temTrabalho = proprio && slides.length > 1;
    if (temTrabalho && !window.confirm("Começar uma nova apresentação? O conteúdo atual será descartado.")) return;
    await storageService.remove(CHAVES.deck);
    setDeck(DECK_EXEMPLO);
    setProprio(false);
    setTexto("");
    setModeloId(null);
    setRecomendado(null);
    setMotivo("");
    setMaximo(1);
    setEtapa(1);
  };

  /* ---------- render ---------- */
  const rotuloExportando = exportando.startsWith("pdf:")
    ? `Gerando PDF ${exportando.slice(4)}`
    : exportando === "pdf" ? "Gerando PDF" : exportando === "pptx" ? "Gerando" : "";

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <span className="marca-icone"><Presentation size={18} /></span>
          <span className="marca-nome">Estúdio de Apresentações</span>
        </div>
        <div className="topo-acoes">
          {proprio && <span className="estado-salvo">{estadoSalvo === "salvando" ? "Salvando…" : estadoSalvo === "salvo" ? "Salvo" : ""}</span>}
          <button type="button" className="btn btn-pequeno btn-contorno" onClick={novaApresentacao}>Nova apresentação</button>
        </div>
      </header>

      <h1 className="titulo">Seu conteúdo. Seu design. Sua apresentação.</h1>
      <p className="subtitulo">
        Cole o texto, deixe o sistema organizar em slides, escolha o design e exporte em PowerPoint ou PDF.
      </p>

      <Passos atual={etapa} maximo={maximo} aoIr={irPara} />

      {etapa === 1 && (
        <EtapaConteudo
          texto={texto}
          setTexto={setTexto}
          config={config}
          setConfig={setConfig}
          aoMontar={montar}
          aoGerarIA={gerarComIA}
          gerando={gerando}
          iaOk={iaOk}
          aviso={aviso}
          temDeck={proprio && etapa === 1 && !texto.trim()}
          aoAvancar={() => irPara(modeloId ? 5 : 2)}
        />
      )}

      {etapa === 2 && (
        <section className="secao">
          <div className="secao-cabecalho">
            <h2>Estrutura ({slides.length} slides)</h2>
            <div className="opcoes">
              <span className="dica">Quantidade</span>
              {["auto", 5, 8, 10, 15].map((q) => (
                <button key={String(q)} type="button" className="opcao"
                  aria-pressed={String(config.quantidade) === String(q)}
                  onClick={() => reaplicarQuantidade(q)}>
                  {q === "auto" ? "Automático" : q}
                </button>
              ))}
              <button type="button" className="btn btn-pequeno btn-contorno" onClick={montar} disabled={!texto.trim()}>
                <RefreshCw size={15} /> Reinterpretar texto
              </button>
            </div>
          </div>
          <p className="dica" style={{ marginBottom: 14 }}>
            Confira a ordem e o tipo de cada slide. Dá para ajustar tudo agora ou depois, na revisão.
          </p>
          <div style={{ marginBottom: 18 }}>
            <PainelVisual fundo={deck.fundo} marca={deck.marca} modelo={modeloPreview} slide={slides[0]}
              aoMudarFundo={mudarFundo} aoMudarMarca={mudarMarca} />
          </div>
          <EditorSlides
            slides={slides}
            modelo={modeloPreview}
            temMarca={!!modeloPreview.marca}
            aoMudar={mudarSlide}
            aoMover={moverSlide}
            aoDuplicar={duplicar}
            aoExcluir={excluir}
            aoAdicionar={adicionar}
          />
        </section>
      )}

      {etapa === 3 && (
        <section className="secao">
          <Galeria
            modelos={modelosCompostos}
            slides={slides}
            escolhido={modeloId}
            recomendado={recomendado}
            motivo={motivo}
            aoUsar={usarModelo}
            aoImportar={importarModelos}
            importando={importando}
            aviso={recado}
            aoRemover={removerModelo}
          />
        </section>
      )}

      {etapa === 4 && (
        <section className="secao">
          <div className="secao-cabecalho">
            <h2>Revisar apresentação</h2>
            <div className="opcoes">
              <span className="dica">{modelo ? `Design: ${modelo.nome}` : "Nenhum design escolhido"}</span>
              <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => irPara(3)}>
                <Palette size={15} /> Trocar modelo
              </button>
              {modelo && (
                <button type="button" className="btn btn-pequeno btn-contorno" onClick={() => setApresentando(true)}>
                  <Play size={15} /> Apresentar
                </button>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <PainelVisual fundo={deck.fundo} marca={deck.marca} modelo={modeloPreview} slide={slides[0]}
              aoMudarFundo={mudarFundo} aoMudarMarca={mudarMarca} />
          </div>
          <EditorSlides
            slides={slides}
            modelo={modeloPreview}
            temMarca={!!modeloPreview.marca}
            aoMudar={mudarSlide}
            aoMover={moverSlide}
            aoDuplicar={duplicar}
            aoExcluir={excluir}
            aoAdicionar={adicionar}
          />
        </section>
      )}

      {etapa === 5 && modelo && (
        <section className="secao">
          <div className="secao-cabecalho">
            <h2>Exportar</h2>
            <span className="dica">{modelo.nome} · {slides.length} slides · 16:9</span>
          </div>
          <div className="moldura" style={{ maxWidth: 760 }}>
            <SlideView modelo={modeloComposto} slide={slides[0]} />
          </div>
          <div className="opcoes" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-principal" onClick={exportarPowerPoint} disabled={!!exportando}>
              <Download size={17} /> PowerPoint
            </button>
            <button type="button" className="btn btn-escuro" onClick={exportarComoPdf} disabled={!!exportando}>
              {exportando.startsWith("pdf") ? <Loader2 size={17} className="girando" /> : <FileText size={17} />}
              {rotuloExportando || "PDF"}
            </button>
          </div>
          <div className="opcoes" style={{ marginTop: 12 }}>
            <span className="dica">Outras opções</span>
            <button type="button" className="btn btn-pequeno" onClick={() => {
              const r = imprimir(modeloComposto, slides, nomeArquivo(deck, modelo, "pdf"));
              flash(r ? "Use Imprimir e escolha Salvar como PDF." : "O navegador bloqueou a impressão. Baixe o HTML.");
            }}>
              <Printer size={15} /> Imprimir
            </button>
            <button type="button" className="btn btn-pequeno" onClick={() => { baixarHtml(modeloComposto, slides, nomeArquivo(deck, modelo, "html")); flash("HTML baixado."); }}>
              <Globe size={15} /> Baixar HTML
            </button>
            <button type="button" className="btn btn-pequeno" onClick={async () => flash(await copiarTexto(briefing(modelo, deck)) ? "Briefing copiado." : "Não consegui copiar.")}>
              <Copy size={15} /> Copiar briefing
            </button>
          </div>
        </section>
      )}

      {etapa === 5 && !modelo && (
        <section className="secao">
          <div className="cartao-claro">
            <p className="dica" style={{ margin: 0 }}>Escolha um design antes de exportar.</p>
            <button type="button" className="btn btn-principal" style={{ marginTop: 12 }} onClick={() => irPara(3)}>
              <Palette size={17} /> Escolher design
            </button>
          </div>
        </section>
      )}

      <div className="barra">
        {etapa > 1 && (
          <button type="button" className="btn btn-pequeno" onClick={() => irPara(etapa - 1)}>
            <ArrowLeft size={15} /> Voltar
          </button>
        )}
        <span className={`barra-info${recado ? " recado" : ""}`}>
          {recado || (etapa === 1 ? "Comece pelo conteúdo"
            : etapa === 2 ? `${slides.length} slides prontos para receber um design`
              : etapa === 3 ? "Toque em um modelo para ver a sua apresentação nele"
                : etapa === 4 ? "Ajuste o que precisar; trocar de modelo não muda o conteúdo"
                  : "Tudo pronto")}
        </span>
        {etapa === 1 && proprio && (
          <button type="button" className="btn btn-pequeno btn-principal" onClick={() => irPara(2)}>
            Estrutura <ArrowRight size={15} />
          </button>
        )}
        {etapa === 2 && (
          <button type="button" className="btn btn-pequeno btn-principal" onClick={() => irPara(3)}>
            Escolher design <ArrowRight size={15} />
          </button>
        )}
        {etapa === 3 && modeloId && (
          <button type="button" className="btn btn-pequeno btn-principal" onClick={() => irPara(4)}>
            Revisar <ArrowRight size={15} />
          </button>
        )}
        {etapa === 4 && (
          <button type="button" className="btn btn-pequeno btn-principal" onClick={() => irPara(5)} disabled={!modelo}>
            Exportar <ArrowRight size={15} />
          </button>
        )}
        {etapa === 5 && modelo && (
          <button type="button" className="btn btn-pequeno" onClick={() => setApresentando(true)}>
            <Play size={15} /> Apresentar
          </button>
        )}
        {desfazer && (
          <button type="button" className="btn btn-pequeno btn-escuro" onClick={restaurar}>
            <Undo2 size={15} /> Desfazer
          </button>
        )}
      </div>

      {apresentando && modelo && (
        <Apresentar modelo={modeloComposto} slides={slides} aoSair={() => setApresentando(false)} />
      )}
    </div>
  );
}
