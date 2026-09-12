/* Função serverless (Vercel). A chave da Anthropic vive só aqui.
   O navegador nunca a recebe e ela nunca aparece em log ou resposta. */

const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
const LIMITE_CONTEUDO = 16000;
const LIMITE_CORPO = 60000;
const TIMEOUT_MS = 60000;

// Rate limit simples, por instância. Não substitui um serviço dedicado,
// mas evita que uma aba sozinha dispare dezenas de gerações.
const janelas = new Map();
function excedeuLimite(ip, max = 12, janelaMs = 60000) {
  const agora = Date.now();
  const registro = janelas.get(ip)?.filter((t) => agora - t < janelaMs) || [];
  registro.push(agora);
  janelas.set(ip, registro);
  if (janelas.size > 500) {
    for (const [k, v] of janelas) if (!v.some((t) => agora - t < janelaMs)) janelas.delete(k);
  }
  return registro.length > max;
}

const texto = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const listaCurta = (v, max) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, max) : []);

function promptConteudo(b) {
  const modelos = Array.isArray(b.modelos)
    ? b.modelos.filter((m) => m && typeof m.id === "string")
        .map((m) => `${m.id}: ${texto(m.desc, 120)}`).join("\n")
    : "";
  const alvo = Math.max(3, Math.min(30, Number(b.slides) || 8));
  return `Você estrutura o conteúdo de apresentações. Devolva SOMENTE JSON válido, sem markdown e sem texto fora do JSON.

Tarefa: montar ${alvo} slides sobre o assunto abaixo.
Assunto: ${texto(b.assunto, 400) || "(não informado)"}
Objetivo: ${texto(b.objetivo, 60) || "Informar"}
Público: ${texto(b.publico, 60) || "Público geral"}
Tom: ${texto(b.tom, 40) || "Institucional"}
Idioma: português do Brasil.

${b.conteudo ? `Base de conteúdo fornecida pelo usuário (use apenas o que está aqui, reorganizando):\n"""\n${texto(b.conteudo, LIMITE_CONTEUDO)}\n"""` : "Não há texto base: escreva a partir do assunto, mantendo tudo em nível geral."}

Formato:
{
  "slides": [
    {"tipo":"capa","titulo":"até 60 caracteres","subtitulo":"até 90 caracteres"},
    {"tipo":"topicos","titulo":"até 45 caracteres","itens":["até 6 itens, 38 caracteres cada"]},
    {"tipo":"texto","titulo":"até 40 caracteres","corpo":"até 420 caracteres"},
    {"tipo":"destaque","numero":"até 5 caracteres","legenda":"até 90 caracteres"},
    {"tipo":"citacao","corpo":"até 110 caracteres","autor":"opcional"},
    {"tipo":"fim","titulo":"até 30 caracteres","subtitulo":"até 50 caracteres"}
  ],
  "recomendado": "id de um modelo da lista",
  "motivo": "até 90 caracteres"
}

Regras:
- O primeiro slide é sempre "capa" e o último é sempre "fim".
- Varie os tipos, mas use "destaque" apenas com números estruturais (etapas, pilares, um ano) ou dados presentes no conteúdo fornecido.
- Nunca invente estatísticas, datas ou nomes que não estejam no conteúdo.
- Citações devem ser originais e sem atribuição a pessoas reais.
- Escreva só conteúdo: nada de cores, fontes ou instruções visuais.

Modelos disponíveis para a recomendação:
${modelos}`;
}

function promptModelo(b) {
  return `Você converte a descrição de um design system em tokens para slides 16:9. Devolva SOMENTE JSON válido, sem markdown.

{
  "nome": "nome curto (até 24 caracteres)",
  "desc": "uma frase em português, até 80 caracteres",
  "bg": "#rrggbb", "fg": "#rrggbb", "muted": "#rrggbb",
  "accent": "#rrggbb", "surface": "#rrggbb", "hairline": "#rrggbb",
  "fTitle": "uma de: ${listaCurta(b.fontes, 30).join(", ")}",
  "fBody": "uma da mesma lista",
  "wTitle": 300 a 900, "wBody": 300 a 500,
  "track": espaçamento entre letras do título em em,
  "upper": true se os títulos são em caixa alta,
  "escala": 0.55 a 1.15,
  "radius": 0 a 32,
  "capa": "uma de: ${listaCurta(b.capas, 20).join(" | ")}",
  "deco": "uma de: ${listaCurta(b.decos, 20).join(" | ")}",
  "cartao": "uma de: ${listaCurta(b.cartoes, 10).join(" | ")}",
  "grad": ["#rrggbb"] ou null,
  "blocos": ["#rrggbb"] ou null,
  "painel": "#rrggbb" ou null
}

Escolha a fonte disponível mais próxima da original e a capa, deco e cartao que melhor traduzam a atmosfera descrita.

ARQUIVO (${texto(b.arquivo, 120)}):
${texto(b.conteudo, LIMITE_CONTEUDO)}`;
}

function extrairJson(bruto) {
  const limpo = String(bruto || "").replace(/```json|```/g, "").trim();
  const i = limpo.indexOf("{");
  const f = limpo.lastIndexOf("}");
  if (i < 0 || f <= i) return null;
  try { return JSON.parse(limpo.slice(i, f + 1)); } catch { return null; }
}

export default async function handler(req, res) {
  const chave = process.env.ANTHROPIC_API_KEY;

  if (req.method === "GET") {
    return res.status(200).json({ configurada: !!chave });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erro: "Método não permitido." });
  }
  if (!chave) {
    return res.status(501).json({ erro: "A geração com IA não está configurada neste ambiente." });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (excedeuLimite(ip)) {
    return res.status(429).json({ erro: "Muitas gerações seguidas. Tente novamente em um minuto." });
  }

  let corpo = req.body;
  if (typeof corpo === "string") {
    if (corpo.length > LIMITE_CORPO) return res.status(413).json({ erro: "Conteúdo grande demais." });
    try { corpo = JSON.parse(corpo); } catch { return res.status(400).json({ erro: "JSON inválido." }); }
  }
  if (!corpo || typeof corpo !== "object") return res.status(400).json({ erro: "Corpo da requisição ausente." });
  if (JSON.stringify(corpo).length > LIMITE_CORPO) return res.status(413).json({ erro: "Conteúdo grande demais." });

  const tipo = corpo.tipo === "modelo" ? "modelo" : "conteudo";
  if (tipo === "conteudo" && !texto(corpo.assunto, 400).trim() && !texto(corpo.conteudo, 100).trim()) {
    return res.status(400).json({ erro: "Informe um assunto ou um conteúdo base." });
  }
  if (tipo === "modelo" && !texto(corpo.conteudo, 100).trim()) {
    return res.status(400).json({ erro: "Arquivo de design vazio." });
  }

  const prompt = tipo === "modelo" ? promptModelo(corpo) : promptConteudo(corpo);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": chave,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: tipo === "modelo" ? 1200 : 3000,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => "");
      console.error("Anthropic respondeu", resposta.status, detalhe.slice(0, 500));
      const status = resposta.status === 429 ? 429 : 502;
      return res.status(status).json({ erro: "A IA não conseguiu responder agora." });
    }

    const dados = await resposta.json();
    const bruto = (dados.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const resultado = extrairJson(bruto);
    if (!resultado) return res.status(502).json({ erro: "A IA respondeu em um formato inesperado." });
    return res.status(200).json({ resultado });
  } catch (e) {
    if (e.name === "AbortError") return res.status(504).json({ erro: "A geração demorou demais." });
    console.error("Falha ao chamar a IA:", e?.message);
    return res.status(502).json({ erro: "Falha ao falar com a IA." });
  } finally {
    clearTimeout(timer);
  }
}
