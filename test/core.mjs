/* Testes do núcleo: interpretação de texto, layout e geração de PPTX.
   Uso: node test/core.mjs   (gera arquivos em /tmp/estudio-teste) */
import fs from "fs";
import { montarSlides } from "../src/core/parser.js";
import { listarModelos } from "../src/core/modelos.js";
import { construirPptx } from "../src/core/pptx.js";
import { slideHtml } from "../src/core/renderHtml.js";
import { novoSlide } from "../src/core/deck.js";

const SAIDA = "/tmp/estudio-teste";
fs.mkdirSync(SAIDA, { recursive: true });
const falhas = [];
const ok = (cond, nome) => { console.log(cond ? " ✓" : " ✗", nome); if (!cond) falhas.push(nome); };

/* 1. Interpretação de texto livre */
const livre = `História do Campo ADIT
Relatório de gestão

Tudo começou em 2015 com poucas famílias.

Crescimento
Hoje são várias congregações.

- Ensino
- Assistência
- Formação

! 2015 | ano do primeiro encontro

"Quem cuida do começo colhe o futuro"

Próximos passos
Formar novos líderes.`;
const s1 = montarSlides(livre, { quantidade: "auto" });
ok(s1[0].tipo === "capa" && s1[0].titulo.includes("ADIT"), "capa reconhecida");
ok(s1.some((s) => s.tipo === "topicos" && s.itens.length === 3), "lista vira slide de tópicos");
ok(s1.some((s) => s.tipo === "destaque" && s.numero === "2015"), "número em destaque reconhecido");
ok(s1.some((s) => s.tipo === "citacao"), "citação reconhecida");
ok(s1[s1.length - 1].tipo === "fim", "encerramento no fim");

/* 2. Sintaxe avançada continua funcionando */
const md = `# Título\nApoio\n\n## Roteiro\n- um\n- dois\n\n> frase\n\n! 42 | legenda`;
const s2 = montarSlides(md, { avancado: true });
ok(s2.length >= 4 && s2[0].tipo === "capa", "markdown ainda é aceito");

/* 3. Caso difícil de layout e exportação */
const dificil = [
  { ...novoSlide("capa"), titulo: "Um título muito longo que precisa quebrar em pelo menos duas linhas na capa", subtitulo: "Subtítulo de apoio com um tamanho razoável para o teste" },
  { ...novoSlide("topicos"), titulo: "Seis tópicos", itens: ["Primeiro item da lista", "Segundo item", "Terceiro item", "Quarto item", "Quinto item", "Sexto item"] },
  { ...novoSlide("texto"), titulo: "Parágrafo longo", corpo: "A".repeat(60) + " Um parágrafo com cerca de trezentos caracteres serve para conferir a quebra de linha, o tamanho da fonte e o espaçamento aplicado pelo renderizador em situações reais de uso, sem depender de um texto curto e artificial." },
  { ...novoSlide("destaque"), numero: "128%", legenda: "crescimento acumulado no período analisado" },
  { ...novoSlide("citacao"), corpo: "Uma citação de tamanho médio para testar a caixa de texto centralizada.", autor: "Equipe" },
  { ...novoSlide("fim"), titulo: "Obrigado", subtitulo: "Até a próxima" },
];

const modelos = listarModelos();
ok(modelos.length >= 20, `catálogo com ${modelos.length} modelos`);

let erroRender = null;
for (const m of modelos) {
  for (const s of dificil) {
    try {
      const html = slideHtml(m, s);
      if (!html.includes("position:absolute")) throw new Error("html vazio");
    } catch (e) { erroRender = `${m.id}: ${e.message}`; }
  }
}
ok(!erroRender, "todos os modelos renderizam todos os tipos de slide" + (erroRender ? ` (${erroRender})` : ""));

const casos = ["bugatti", "dell-1996", "gradiente", "bmw-m", "editorial", "binance"];
for (const id of casos) {
  const m = modelos.find((t) => t.id === id);
  const bytes = construirPptx(m, dificil);
  fs.writeFileSync(`${SAIDA}/${id}.pptx`, bytes);
  ok(bytes.length > 20000 && bytes[0] === 0x50 && bytes[1] === 0x4b, `pptx de ${id} gerado (${Math.round(bytes.length / 1024)} kB)`);
}

console.log(falhas.length ? `\n${falhas.length} falha(s)` : "\nTudo certo. Arquivos em " + SAIDA);
process.exit(falhas.length ? 1 : 0);
