# Estúdio de Apresentações

Cole um texto, deixe o sistema organizar em slides, escolha o design e exporte em PowerPoint ou PDF.
Tudo o que importa roda no navegador: nenhum servidor é necessário para criar, editar ou exportar.

## Como funciona

```
CONTEÚDO → ESTRUTURA → DESIGN → REVISÃO → EXPORTAÇÃO
```

O conteúdo (o *deck*) e o design (o *modelo*) são separados. Trocar de modelo nunca altera o texto,
e o mesmo deck pode ser exportado com qualquer um dos 26 modelos incluídos.

### Núcleo, sem IA

| Etapa | O que acontece |
| --- | --- |
| Conteúdo | Texto livre ou sintaxe avançada (`#`, `##`, `-`, `>`, `! número \| legenda`) |
| Estrutura | `interpretarConteudo()` reconhece título, seções, listas, citações e números |
| Design | Galeria mostra a sua apresentação em cada modelo |
| Revisão | Editar, duplicar, reordenar, trocar tipo, formatar cada campo, plano de fundo, marca d'água, apresentar em tela cheia |
| Exportação | `.pptx` com formas e textos editáveis, `.pdf` 16:9 com uma página por slide |

### IA, opcional

A geração de conteúdo por IA é a única parte que depende de uma API externa. Sem a chave
configurada, o aplicativo continua inteiro: só o botão de gerar fica indisponível, com um aviso.

## Desenvolvimento

```bash
npm install
npm run dev
```

Build de produção e conferência local:

```bash
npm run build
npm run preview
```

## Testes

```bash
npm run test:core          # interpretação de texto, layout dos 26 modelos e geração de PPTX
npm run build && npm run servir   # em outro terminal:
CHROME_PATH=/caminho/para/chrome npm run test:e2e
```

O teste de ponta a ponta percorre o fluxo inteiro em um navegador real: cola o conteúdo, monta a
estrutura, escolhe um modelo, edita, troca de modelo, exporta PPTX e PDF, entra no modo apresentação,
recarrega a página para conferir a persistência e mede o layout na largura de um celular.

## Publicar no GitHub

```bash
git init
git add .
git commit -m "Estúdio de Apresentações"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/estudio-apresentacoes.git
git push -u origin main
```

O arquivo `.env` está no `.gitignore`. Nunca faça commit de uma chave real.

## Publicar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do GitHub.
2. A Vercel reconhece o Vite sozinha: framework **Vite**, build `npm run build`, saída `dist`.
   A pasta `api/` vira função serverless automaticamente.
3. Em **Settings → Environment Variables**, adicione:

   | Nome | Valor | Ambientes |
   | --- | --- | --- |
   | `ANTHROPIC_API_KEY` | sua chave da Anthropic | Production, Preview, Development |
   | `ANTHROPIC_MODEL` | opcional, ex.: `claude-sonnet-4-5` | Production |

4. Clique em **Deploy**. Depois de mudar variáveis, faça um novo deploy para que passem a valer.

Sem `ANTHROPIC_API_KEY`, o site publica e funciona igual — apenas sem a geração por IA.

### Segurança da chave

A chave existe somente dentro de `api/generate.js`, que roda no servidor. O navegador conversa
apenas com `/api/generate`. A rota aceita só POST, limita o tamanho da entrada, valida o JSON,
tem timeout de 60 s, aplica um limite de requisições por IP e nunca devolve nem registra a chave.
`GET /api/generate` responde apenas `{ "configurada": true|false }`, para a interface saber se
deve oferecer o botão de IA.

## Estrutura do projeto

```
api/generate.js          função serverless que fala com a Anthropic
src/
  App.jsx                etapas, estado da apresentação e exportações
  core/
    modelos.js           catálogo de modelos (tokens visuais) e MODEL_REGISTRY
    layout.js            coordenadas lógicas 960×540 e o layout de cada tipo de slide
    renderHtml.js        renderizador único usado na tela, na impressão e no PDF
    pptx.js              gerador de .pptx (OOXML + zip, sem dependências)
    pdf.js               exportação de PDF, impressão e download de HTML
    parser.js            interpretação de texto livre
    parserMarkdown.js    sintaxe avançada
    ia.js                cliente de /api/generate
    armazenamento.js     localStorage com queda para memória
    fontes.js            fontes da tela e substitutas seguras para o PowerPoint
  ui/                    componentes de interface
  hooks/useAutosave.js   gravação com atraso
test/                    testes do núcleo e de ponta a ponta
```

## Formatação, fundo e marca d'água

Cada campo do editor tem uma barra própria: aumentar e diminuir a fonte, negrito,
itálico, alinhamento e cor, com um botão para voltar ao padrão do modelo. Os ajustes
ficam no slide (`slide.estilo`), não no modelo, então sobrevivem à troca de design.

O plano de fundo (cor, gradiente ou imagem, com controle de escurecimento) e a marca
d'água (texto ou logo, em cinco posições, com tamanho e opacidade) valem para a
apresentação inteira e ficam no deck. Cada slide pode esconder a marca individualmente.
Tudo isso vai junto no PPTX — a imagem é embutida no arquivo — e no PDF.

## Modelos

Os 26 modelos vêm prontos. Para adicionar outros, use **Importar .md** na etapa de design com um
arquivo que descreva um design system (cores, tipografia, cantos, atmosfera). A leitura do arquivo
usa a IA uma única vez, na importação; depois disso o modelo fica salvo no navegador e funciona
sem qualquer API.

## Fontes

A tela usa fontes do Google Fonts. No `.pptx`, fontes que provavelmente não existem na máquina de
quem abrir o arquivo são trocadas por substitutas de largura parecida (`fonteExportacao()`), para o
layout não se desfazer. No PDF isso não acontece: as fontes são as mesmas da tela.
