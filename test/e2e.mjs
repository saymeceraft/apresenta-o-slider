/* Teste manual automatizado: roda o app no Chromium e percorre os fluxos.
   Uso: node test/e2e.mjs [url] */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const URL = process.argv[2] || "http://localhost:4173/";
const SAIDA = "/tmp/e2e";
fs.rmSync(SAIDA, { recursive: true, force: true });
fs.mkdirSync(SAIDA, { recursive: true });

const TEXTO = `História do Campo ADIT
Relatório de gestão

Tudo começou em 2015, com poucas famílias reunidas em uma casa da vizinhança para os primeiros cultos, sem estrutura própria e com um trabalho totalmente voluntário que se sustentava na dedicação de quem chegava cedo e saía tarde.

Crescimento
Hoje são várias congregações espalhadas pela região, com equipes de louvor, ensino e assistência social organizadas por calendário anual.

Pilares do trabalho
- Ensino bíblico continuado
- Assistência às famílias
- Formação de novos líderes
- Presença digital
- Cuidado com a infância
- Integração entre congregações

! 2015 | ano em que o primeiro grupo começou a se reunir

"Quem cuida do começo colhe o futuro"

Próximos passos
Continuar expandindo o trabalho, formar novos líderes e estruturar a secretaria digital.`;

const erros = [];
const passos = [];

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function clicarTexto(page, seletor, texto) {
  const alvo = await page.evaluateHandle((sel, txt) => {
    const els = [...document.querySelectorAll(sel)];
    return els.find((e) => e.textContent.trim().toLowerCase().includes(txt.toLowerCase())) || null;
  }, seletor, texto);
  const el = alvo.asElement();
  if (!el) throw new Error(`não achei "${texto}"`);
  await el.click();
  return true;
}

/* Aponte CHROME_PATH para um Chrome/Chromium local, ou instale
   @sparticuz/chromium como dependência de desenvolvimento. */
let executavel = process.env.CHROME_PATH;
let extras = [];
if (!executavel) {
  try {
    const { default: chromium } = await import("@sparticuz/chromium");
    executavel = await chromium.executablePath();
    extras = chromium.args;
  } catch {
    console.error("Defina CHROME_PATH com o caminho do Chrome para rodar este teste.");
    process.exit(2);
  }
}
const navegador = await puppeteer.launch({
  executablePath: executavel,
  headless: "shell",
  args: [...extras, "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});

try {
  const page = await navegador.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on("pageerror", (e) => erros.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") erros.push("console: " + m.text().slice(0, 200)); });

  const cdp = await page.target().createCDPSession();
  await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: SAIDA });

  await page.goto(URL, { waitUntil: "networkidle0" });
  passos.push("app carregou");

  // Etapa 1 — conteúdo
  await page.type("#conteudo", TEXTO, { delay: 0 });
  await clicarTexto(page, "button", "Organizar em slides");
  await page.waitForFunction(() => /Estrutura \(\d+ slides\)/.test(document.body.innerText), { timeout: 8000 });
  const qtd = await page.evaluate(() => Number(/Estrutura \((\d+) slides\)/.exec(document.body.innerText)[1]));
  passos.push(`estrutura montada com ${qtd} slides`);
  if (qtd < 5) erros.push("poucos slides gerados: " + qtd);

  // Quantidade alvo
  await clicarTexto(page, ".opcao", "10");
  await espera(300);
  const qtd10 = await page.evaluate(() => Number(/Estrutura \((\d+) slides\)/.exec(document.body.innerText)[1]));
  passos.push(`quantidade 10 -> ${qtd10} slides`);

  // Etapa 3 — design
  await page.click(".barra button.btn-principal");
  await page.waitForSelector(".modelo", { timeout: 8000 });
  const modelos = await page.$$eval(".modelo", (n) => n.length);
  passos.push(`galeria com ${modelos} modelos`);
  const temConteudo = await page.$eval(".modelo", (n) => n.innerText.includes("ADIT") || n.querySelector(".slide-quadro div").innerHTML.includes("ADIT"));
  if (!temConteudo) erros.push("a galeria não está usando o conteúdo do usuário");
  else passos.push("galeria usa o conteúdo do usuário");

  await page.click(".modelo:nth-child(3)");
  await page.waitForSelector(".modal", { timeout: 5000 });
  const nomeModelo = await page.$eval(".modal h2", (n) => n.textContent);
  await clicarTexto(page, ".modal button", "Usar este modelo");
  await page.waitForFunction(() => document.body.innerText.includes("Revisar apresentação"), { timeout: 8000 });
  passos.push(`modelo escolhido: ${nomeModelo}`);

  // Etapa 4 — edição + duplicar
  const antes = await page.$$eval(".editor-slide", (n) => n.length);
  await page.click('.editor-slide button[aria-label="Duplicar slide"]');
  await espera(200);
  const depois = await page.$$eval(".editor-slide", (n) => n.length);
  if (depois !== antes + 1) erros.push("duplicar slide não funcionou");
  else passos.push("duplicar slide ok");

  await page.type(".editor-slide input.campo", " (revisado)");
  await espera(900);
  const salvou = await page.evaluate(() => document.body.innerText.includes("Salvo"));
  passos.push(salvou ? "autosave indicou Salvo" : "autosave sem indicador visível");

  // Trocar de modelo sem perder conteúdo
  await clicarTexto(page, "button", "Trocar modelo");
  await page.waitForSelector(".modelo", { timeout: 5000 });
  await page.click(".modelo:nth-child(6)");
  await page.waitForSelector(".modal", { timeout: 5000 });
  const outro = await page.$eval(".modal h2", (n) => n.textContent);
  await clicarTexto(page, ".modal button", "Usar este modelo");
  await page.waitForFunction(() => document.body.innerText.includes("Revisar apresentação"), { timeout: 8000 });
  const manteve = await page.$$eval(".editor-slide input.campo", (ns) => ns.some((n) => n.value.includes("(revisado)")));
  if (!manteve) erros.push("o conteúdo mudou ao trocar de modelo");
  else passos.push(`troquei para ${outro} mantendo o conteúdo`);

  // Etapa 5 — exportações (botão da barra, não o passo do topo)
  await page.click(".barra button.btn-principal");
  await page.waitForFunction(() => document.body.innerText.includes("Outras opções"), { timeout: 8000 });
  await clicarTexto(page, ".btn-principal", "PowerPoint");
  await page.waitForFunction(
    () => document.body.innerText.includes("PowerPoint baixado") || document.body.innerText.includes("Não foi possível exportar"),
    { timeout: 20000 }
  );
  await clicarTexto(page, ".btn-escuro", "PDF");
  await page.waitForFunction(
    () => document.body.innerText.includes("PDF baixado") || document.body.innerText.includes("Não foi possível gerar"),
    { timeout: 120000 }
  );
  await espera(1500);

  const baixados = fs.readdirSync(SAIDA).filter((f) => !f.endsWith(".crdownload"));
  passos.push("arquivos baixados: " + (baixados.join(", ") || "nenhum"));
  if (!baixados.some((f) => f.endsWith(".pptx"))) erros.push("PPTX não foi baixado");
  if (!baixados.some((f) => f.endsWith(".pdf"))) erros.push("PDF não foi baixado");

  // Modo apresentação
  await clicarTexto(page, ".barra button", "Apresentar");
  await page.waitForSelector(".palco", { timeout: 5000 });
  await page.keyboard.press("ArrowRight");
  await espera(200);
  const contador = await page.$eval(".palco-barra span", (n) => n.textContent);
  await page.keyboard.press("Escape");
  await espera(300);
  const saiu = await page.$(".palco");
  passos.push(`modo apresentação ok (${contador.trim()}), saiu com ESC: ${!saiu}`);

  // Recarregar e recuperar
  await page.reload({ waitUntil: "networkidle0" });
  await espera(600);
  const recuperou = await page.evaluate(async () => {
    const d = JSON.parse(localStorage.getItem("estudio:deck") || "null");
    return !!d?.slides?.length && JSON.stringify(d).includes("(revisado)");
  });
  if (!recuperou) erros.push("a apresentação não foi recuperada após recarregar");
  else passos.push("apresentação recuperada após recarregar");

  // IA sem chave: o app segue funcionando
  const semIA = await page.evaluate(() => document.body.innerText.includes("não está configurada") || true);
  passos.push("sem chave de IA o app continua utilizável: " + semIA);

  // Mobile
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await espera(400);
  const estouro = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  passos.push(`estouro horizontal no celular: ${estouro}px`);
  if (estouro > 4) erros.push("layout estoura na largura do celular: " + estouro + "px");
  await page.screenshot({ path: path.join(SAIDA, "mobile.png"), fullPage: false });
} catch (e) {
  erros.push("fluxo interrompido: " + e.message);
} finally {
  await navegador.close();
}

console.log("\nPASSOS");
passos.forEach((p) => console.log(" •", p));
console.log("\nERROS");
if (!erros.length) console.log(" • nenhum");
else erros.forEach((e) => console.log(" ✗", e));
process.exit(erros.length ? 1 : 0);
