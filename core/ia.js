import { novoSlide } from "./deck.js";
import { CAPAS, DECOS, CARTOES } from "./modelos.js";
import { NOMES_FONTES } from "./fontes.js";
import { ajustarQuantidade } from "./parser.js";

/* O navegador nunca conversa direto com a Anthropic: toda chamada passa
   pela função serverless /api/generate, que guarda a chave. */

export const OBJETIVOS = ["Informar", "Ensinar", "Apresentar projeto", "Vender", "Apresentação institucional", "Relatório", "Aula", "Sermão ou palestra", "Evento", "Outro"];
export const PUBLICOS = ["Público geral", "Membros", "Liderança", "Jovens", "Crianças", "Empresarial", "Governo", "Acadêmico", "Outro"];
export const TONS = ["Institucional", "Acadêmico", "Comercial", "Criativo"];

export class ErroIA extends Error {
  constructor(mensagem, motivo) {
    super(mensagem);
    this.motivo = motivo;
  }
}

async function postar(corpo, segundos = 90) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), segundos * 1000);
  let res;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(t);
    if (e.name === "AbortError") throw new ErroIA("A geração demorou demais e foi cancelada.", "timeout");
    throw new ErroIA("Não foi possível falar com o servidor de IA.", "rede");
  }
  clearTimeout(t);
  let dados = null;
  try { dados = await res.json(); } catch { /* resposta sem JSON */ }
  if (res.status === 501) throw new ErroIA("A geração com IA não está configurada neste ambiente.", "sem-chave");
  if (res.status === 429) throw new ErroIA("Muitas gerações seguidas. Espere um instante e tente de novo.", "limite");
  if (!res.ok) throw new ErroIA(dados?.erro || "A IA não conseguiu responder agora.", "servidor");
  return dados;
}

/** A IA está disponível neste deploy? Nunca lança: só responde sim ou não. */
export async function iaDisponivel() {
  try {
    const res = await fetch("/api/generate", { method: "GET" });
    if (!res.ok) return false;
    const j = await res.json();
    return !!j?.configurada;
  } catch {
    return false;
  }
}

/** Gera o conteúdo estruturado. O design não vem daqui — só uma sugestão de modelo. */
export async function gerarDeck({ assunto, conteudo, tom, objetivo, publico, quantidade }, modelos) {
  const alvo = quantidade === "auto" || !quantidade ? 8 : Number(quantidade);
  const dados = await postar({
    tipo: "conteudo",
    assunto: String(assunto || "").slice(0, 400),
    conteudo: String(conteudo || "").slice(0, 12000),
    tom, objetivo, publico,
    slides: alvo,
    modelos: modelos.map((t) => ({ id: t.id, desc: t.desc })).slice(0, 60),
  });

  const j = dados?.resultado || {};
  const lista = Array.isArray(j.slides) ? j.slides : [];
  const slides = lista.map(normalizarSlide).filter(Boolean);
  if (!slides.length) throw new ErroIA("A IA respondeu sem slides utilizáveis.", "vazio");
  if (slides[0].tipo !== "capa") slides.unshift({ ...novoSlide("capa"), titulo: assunto || "Apresentação" });
  return {
    slides: ajustarQuantidade(slides, quantidade),
    recomendado: modelos.some((t) => t.id === j.recomendado) ? j.recomendado : null,
    motivo: typeof j.motivo === "string" ? j.motivo.slice(0, 120) : "",
  };
}

const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function normalizarSlide(s) {
  if (!s || typeof s !== "object") return null;
  const tipos = ["capa", "topicos", "texto", "destaque", "citacao", "fim"];
  const tipo = tipos.includes(s.tipo) ? s.tipo : "texto";
  const base = novoSlide(tipo);
  const out = {
    ...base,
    tipo,
    titulo: texto(s.titulo, 90),
    subtitulo: texto(s.subtitulo, 140),
    corpo: texto(s.corpo, 900),
    numero: texto(s.numero, 6),
    legenda: texto(s.legenda, 140),
    autor: texto(s.autor, 60),
    itens: Array.isArray(s.itens) ? s.itens.map((x) => texto(x, 70)).filter(Boolean).slice(0, 6) : [],
  };
  const vazio = !out.titulo && !out.subtitulo && !out.corpo && !out.numero && !out.itens.length;
  return vazio ? null : out;
}

/** Converte um DESIGN.md em tokens de modelo. Só é usada na importação. */
export async function interpretarModelo(conteudoMd, arquivo) {
  const dados = await postar({
    tipo: "modelo",
    arquivo: String(arquivo || "modelo.md").slice(0, 120),
    conteudo: String(conteudoMd || "").slice(0, 14000),
    fontes: NOMES_FONTES,
    capas: CAPAS,
    decos: DECOS,
    cartoes: CARTOES,
  });
  if (!dados?.resultado) throw new ErroIA("Não consegui ler esse arquivo de design.", "vazio");
  return dados.resultado;
}
