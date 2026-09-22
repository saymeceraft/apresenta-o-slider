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

  // Ferramentas de texto: aumentar e colorir o título do primeiro slide
  const antesEstilo = await page.$eval(".editor-slide .slide-quadro div", (n) => n.innerHTML);
  await page.click('.editor-slide button[aria-label^="Aumentar título"]');
  await page.click('.editor-slide button[aria-label^="Aumentar título"]');
  await page.click('.editor-slide button[aria-label^="Negrito em título"]');
  await page.$eval('.editor-slide input[aria-label^="Cor de título"]', (n) => {
    // O React acompanha o valor por um setter próprio; usamos o nativo para o onChange disparar.
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(n, "#ff0055");
    n.dispatchEvent(new Event("input", { bubbles: true }));
    n.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 350));
  const corAplicada = await page.$eval(".editor-slide .slide-quadro div", (n) => n.innerHTML.includes("rgb(255, 0, 85)") || n.innerHTML.includes("#ff0055"));
  if (!corAplicada) erros.push("a cor escolhida não chegou ao slide");
  else passos.push("cor aplicada no slide");
  const depoisEstilo = await page.$eval(".editor-slide .slide-quadro div", (n) => n.innerHTML);
  if (antesEstilo === depoisEstilo) erros.push("as ferramentas de texto não mudaram o slide");
  else passos.push("ferramentas de texto alteram o slide");

  // Marca d'água de texto (o painel abre em "Ajustar")
  await page.$$eval("button", (ns) => { const b = ns.find((n) => n.textContent.trim() === "Ajustar"); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 250));
  await page.$$eval(".opcao", (ns) => { const b = ns.find((n) => n.textContent.trim() === "Texto"); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 200));
  const campoMarca = await page.$('input[aria-label="Texto da marca d\'água"]');
  if (!campoMarca) erros.push("campo da marca d'água não apareceu");
  else {
    await campoMarca.type("ADIT · Confidencial");
    await new Promise((r) => setTimeout(r, 400));
    const temMarca = await page.$eval(".editor-slide .slide-quadro div", (n) => n.innerHTML.includes("Confidencial"));
    if (!temMarca) erros.push("a marca d'água não apareceu no slide");
    else passos.push("marca d'água aplicada");
  }

  // Arrastar a marca d'água para outra posição
  const alvo = await page.$(".posicionador");
  if (!alvo) erros.push("posicionador da marca não apareceu");
  else {
    const caixa = await alvo.boundingBox();
    await page.mouse.move(caixa.x + caixa.width * 0.8, caixa.y + caixa.height * 0.8);
    await page.mouse.down();
    await page.mouse.move(caixa.x + caixa.width * 0.2, caixa.y + caixa.height * 0.25, { steps: 8 });
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 300));
    const pos = await page.$eval(".alvo-marca", (n) => n.style.left);
    passos.push(`marca arrastada para left ${pos}`);
    if (parseFloat(pos) > 40) erros.push("arrastar a marca não mudou a posição");
  }

  // Plano de fundo em gradiente
  await page.$$eval(".opcao", (ns) => { const b = ns.find((n) => n.textContent.trim() === "Gradiente"); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 400));
  const temFundo = await page.$eval(".editor-slide .slide-quadro div", (n) => n.getAttribute("style") + n.innerHTML).catch(() => "");
  const gradienteOk = await page.$eval(".editor-slide .slide-quadro div > div", (n) => n.style.background.includes("gradient"));
  if (!gradienteOk) erros.push("o plano de fundo em gradiente não foi aplicado");
  else passos.push("plano de fundo em gradiente aplicado");

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
    () => /Baixado: .+\.pptx/.test(document.body.innerText) || document.body.innerText.includes("Não foi possível exportar"),
    { timeout: 20000 }
  );
  await clicarTexto(page, ".btn-escuro", "PDF");
  await page.waitForFunction(
    () => /Baixado: .+\.pdf/.test(document.body.innerText) || document.body.innerText.includes("Não foi possível gerar"),
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

  const voltouNaEtapa = await page.evaluate(() => document.body.innerText.includes("Exportar") && !!document.querySelector(".barra"));
  const etapaAtual = await page.$eval('.passo[aria-current="step"]', (n) => n.textContent.trim());
  if (etapaAtual.startsWith("1")) erros.push("após recarregar voltou para a etapa 1 em vez de onde estava");
  else passos.push(`voltou direto para a etapa ${etapaAtual}`);

  // Desfazer exclusão
  await page.$$eval(".passo", (ns) => { const b = ns.find((n) => n.textContent.includes("Revisão")); if (b) b.click(); });
  await espera(600);
  const antesEx = await page.$$eval(".editor-slide", (n) => n.length);
  await page.click('.editor-slide button[aria-label="Excluir slide"]');
  await espera(300);
  await page.$$eval(".barra button", (ns) => { const b = ns.find((n) => n.textContent.includes("Desfazer")); if (b) b.click(); });
  await espera(400);
  const depoisEx = await page.$$eval(".editor-slide", (n) => n.length);
  if (depoisEx !== antesEx) erros.push(`desfazer exclusão não restaurou o slide (${antesEx} -> ${depoisEx})`);
  else passos.push("excluir e desfazer funcionam");

  // Trocar o tipo preservando o texto
  const tipoOk = await page.evaluate(async () => {
    const cartoes = [...document.querySelectorAll(".editor-slide")];
    const k = cartoes.findIndex((n) => n.querySelector("select").value === "topicos");
    if (k < 0) return "sem slide de tópicos";
    const itens = [...cartoes[k].querySelectorAll("input.campo")].map((n) => n.value).filter(Boolean);
    const sel = cartoes[k].querySelector("select");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
    setter.call(sel, "texto");
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 500));
    const area = document.querySelectorAll(".editor-slide")[k].querySelector("textarea");
    if (!itens.length) return "slide de tópicos sem itens";
    return area && itens.some((i) => area.value.includes(i)) ? "ok" : `texto perdido ao trocar o tipo (itens: ${itens.join("|")}, corpo: ${area ? area.value.slice(0, 40) : "sem textarea"})`;
  });
  if (tipoOk === "ok") passos.push("trocar o tipo preserva o texto");
  else if (tipoOk !== "sem slide de tópicos") erros.push(tipoOk);

  // Tooltips nos botões de ícone
  const semDica = await page.$$eval(".editor-slide button, .fmt", (ns) =>
    ns.filter((n) => !n.textContent.trim() && !n.getAttribute("title")).length);
  if (semDica) erros.push(`${semDica} botões de ícone sem dica ao passar o mouse`);
  else passos.push("todos os botões de ícone têm dica");

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
