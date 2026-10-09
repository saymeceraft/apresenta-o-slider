/* Percorre o fluxo inteiro em um navegador real.
   Uso: CHROME_PATH=/caminho/para/chrome node test/e2e.mjs [url] */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const URL = process.argv[2] || "http://localhost:4173/";
const SAIDA = "/tmp/e2e";
fs.rmSync(SAIDA, { recursive: true, force: true });
fs.mkdirSync(SAIDA, { recursive: true });

const TEXTO = `Planejamento Estratégico 2025
Construindo o futuro com foco, inovação e resultados

Nossa Visão
Ser referência em inovação e excelência operacional na região até 2030, com equipes preparadas e processos simples.

Pilares Estratégicos
- Crescimento sustentável
- Inovação contínua
- Excelência operacional
- Pessoas no centro
- Presença digital
- Governança clara

"Quem planeja o começo colhe o futuro"

85% — de satisfação dos clientes em 2024

Conclusão
Seguimos construindo juntos.`;

// PNG 2x2 para testar imagem de slide e logo.
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQz0AEYBxVSF+FAP0FBQFPSn0YAAAAAElFTkSuQmCC";

const erros = [];
const passos = [];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function clicar(page, seletor, texto) {
  const ok = await page.$$eval(seletor, (ns, t) => {
    const alvo = ns.find((n) => n.textContent.trim().toLowerCase().includes(t.toLowerCase()));
    if (!alvo) return false;
    alvo.click();
    return true;
  }, texto);
  if (!ok) throw new Error(`não achei "${texto}" em ${seletor}`);
}

/** Envia um arquivo para o input de arquivo que o botão abre. */
async function enviarImagem(page, abrir) {
  const [escolha] = await Promise.all([page.waitForFileChooser({ timeout: 5000 }), abrir()]);
  const arquivo = path.join(SAIDA, "teste.png");
  fs.writeFileSync(arquivo, Buffer.from(PNG, "base64"));
  await escolha.accept([arquivo]);
  await espera(600);
}

try {
  const page = await navegador.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on("pageerror", (e) => erros.push("pageerror: " + e.message));
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !/fonts\.googleapis|ERR_TUNNEL|403/.test(t)) erros.push("console: " + t.slice(0, 160));
  });

  const cdp = await page.target().createCDPSession();
  await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: SAIDA });

  await page.goto(URL, { waitUntil: "networkidle0" });
  passos.push("app carregou");

  /* ---------- 1. Conteúdo ---------- */
  await page.type("#conteudo", TEXTO, { delay: 0 });
  await clicar(page, "button", "Organizar em slides");
  await page.waitForSelector(".modelo", { timeout: 8000 });
  const nModelos = await page.$$eval(".modelo", (n) => n.length);
  passos.push(`conteúdo organizado; galeria com ${nModelos} modelos`);

  const usaConteudo = await page.$eval(".modelo", (n) => n.innerHTML.includes("Planejamento"));
  if (!usaConteudo) erros.push("a galeria não está usando o conteúdo do usuário");
  else passos.push("galeria mostra o conteúdo do usuário");

  /* ---------- 2. Design ---------- */
  await page.click(".modelo:nth-child(3)");
  await page.waitForSelector(".modal", { timeout: 5000 });
  const nomeModelo = await page.$eval(".modal h2", (n) => n.textContent.trim());
  await clicar(page, ".modal button", "Usar este modelo");
  await page.waitForSelector(".editor", { timeout: 8000 });
  passos.push(`modelo escolhido: ${nomeModelo}`);

  /* ---------- 3. Editor ---------- */
  const nSlides = await page.$$eval(".miniatura", (n) => n.length);
  passos.push(`editor aberto com ${nSlides} miniaturas`);

  await page.type('.painel-props input.campo', " (revisado)");
  await espera(700);
  const noSlide = await page.$eval(".palco-slide", (n) => n.innerHTML.includes("(revisado)"));
  if (!noSlide) erros.push("o texto digitado não apareceu na prévia");
  else passos.push("edição aparece na prévia na hora");

  // formatação
  await page.click('.painel-props button[title^="Aumentar título"]');
  await page.click('.painel-props button[title^="Negrito em título"]');
  await page.$eval('.painel-props input[title^="Cor de título"]', (n) => {
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    set.call(n, "#ff0055");
    n.dispatchEvent(new Event("input", { bubbles: true }));
    n.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await espera(400);
  const corOk = await page.$eval(".palco-slide", (n) => n.innerHTML.includes("rgb(255, 0, 85)") || n.innerHTML.includes("#ff0055"));
  if (!corOk) erros.push("a formatação de cor não chegou ao slide");
  else passos.push("formatação por campo funciona");

  // desfazer e refazer
  const antesDesfazer = await page.$eval(".palco-slide", (n) => n.innerHTML);
  await page.click('.barra-palco button[title="Desfazer"]');
  await espera(300);
  const depoisDesfazer = await page.$eval(".palco-slide", (n) => n.innerHTML);
  await page.click('.barra-palco button[title="Refazer"]');
  await espera(300);
  const depoisRefazer = await page.$eval(".palco-slide", (n) => n.innerHTML);
  if (antesDesfazer === depoisDesfazer) erros.push("desfazer não mudou nada");
  else if (depoisRefazer !== antesDesfazer) erros.push("refazer não voltou ao estado anterior");
  else passos.push("desfazer e refazer funcionam");

  // imagem do slide
  await enviarImagem(page, () => clicar(page, ".barra-palco button", "Imagem"));
  const temFoto = await page.$eval(".palco-slide", (n) => !!n.querySelector("img"));
  if (!temFoto) erros.push("a imagem enviada não apareceu no slide");
  else passos.push("imagem no slide funciona");

  // fundo em gradiente com uma cor a mais
  await clicar(page, ".aba-prop", "Estilo");
  await espera(300);
  await clicar(page, ".painel-props .opcao", "Gradiente");
  await espera(300);
  await page.click('.painel-props button[title="Adicionar cor"]');
  await espera(300);
  const paradas = await page.$$eval(".parada", (n) => n.length);
  const gradienteOk = await page.$eval(".palco-slide", (n) => /linear-gradient/.test(n.innerHTML));
  if (!gradienteOk) erros.push("o gradiente não foi aplicado ao slide");
  else passos.push(`gradiente aplicado com ${paradas} cores`);

  // fundo só deste slide
  await clicar(page, ".painel-props .opcao", "Só este slide");
  await espera(200);
  await clicar(page, ".painel-props .opcao", "Cor");
  await espera(1200);   // o autosave guarda com atraso
  const fundoSoAqui = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("estudio:deck") || "{}");
    return !!d.slides?.[0]?.fundo && !d.slides?.[1]?.fundo;
  });
  if (!fundoSoAqui) erros.push("o fundo por slide não ficou restrito ao slide");
  else passos.push("fundo só deste slide funciona");

  // reordenar e duplicar
  const antesDup = await page.$$eval(".miniatura", (n) => n.length);
  // o botão só aparece ao passar o mouse, então disparamos o clique direto
  await page.$$eval('.miniatura button[title="Duplicar slide"]', (ns) => ns[0].click());
  await espera(400);
  const depoisDup = await page.$$eval(".miniatura", (n) => n.length);
  if (depoisDup !== antesDup + 1) erros.push("duplicar slide não funcionou");
  else passos.push("duplicar slide funciona");

  /* ---------- 4. Exportar ---------- */
  await clicar(page, ".barra button", "Exportar");
  await page.waitForFunction(() => document.body.innerText.includes("Outras opções"), { timeout: 8000 });
  await clicar(page, ".btn-principal", "PowerPoint");
  await page.waitForFunction(() => /Baixado: .+\.pptx/.test(document.body.innerText) || document.body.innerText.includes("Não foi possível exportar"), { timeout: 25000 });
  await clicar(page, ".btn-escuro", "PDF");
  await page.waitForFunction(() => /Baixado: .+\.pdf/.test(document.body.innerText) || document.body.innerText.includes("Não foi possível gerar"), { timeout: 150000 });
  await espera(1500);
  const baixados = fs.readdirSync(SAIDA).filter((f) => !f.endsWith(".crdownload") && f !== "teste.png");
  passos.push("arquivos baixados: " + (baixados.join(", ") || "nenhum"));
  if (!baixados.some((f) => f.endsWith(".pptx"))) erros.push("PPTX não foi baixado");
  if (!baixados.some((f) => f.endsWith(".pdf"))) erros.push("PDF não foi baixado");

  /* ---------- apresentação ---------- */
  await clicar(page, ".barra button", "Apresentar");
  await page.waitForSelector(".palco", { timeout: 5000 });
  await page.keyboard.press("ArrowRight");
  await espera(250);
  const contador = await page.$eval(".palco-barra span", (n) => n.textContent.trim());
  await page.keyboard.press("Escape");
  await espera(300);
  passos.push(`modo apresentação ok (${contador}), saiu com ESC: ${!(await page.$(".palco"))}`);

  /* ---------- persistência ---------- */
  await page.reload({ waitUntil: "networkidle0" });
  await espera(800);
  const recuperou = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("estudio:deck") || "null");
    return !!d?.slides?.length && JSON.stringify(d).includes("(revisado)");
  });
  const abaAtual = await page.$eval('.aba[aria-current="page"]', (n) => n.textContent.trim());
  if (!recuperou) erros.push("a apresentação não foi recuperada após recarregar");
  else passos.push(`apresentação recuperada; voltou na aba ${abaAtual}`);

  /* ---------- celular ---------- */
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await espera(500);
  const estouro = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (estouro > 4) erros.push(`layout estoura ${estouro}px na largura do celular`);
  else passos.push("sem rolagem lateral no celular");
  await page.screenshot({ path: path.join(SAIDA, "mobile.png") });
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
