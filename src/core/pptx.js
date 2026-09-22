import { FP } from "./fontes.js";
import { hex6 } from "./cores.js";
import { layout, alturaTexto } from "./layout.js";
import { esc } from "./renderHtml.js";

const enc = new TextEncoder();
let CRC_T = null;
function crcTable() {
  if (CRC_T) return CRC_T;
  CRC_T = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC_T[n] = c >>> 0;
  }
  return CRC_T;
}
function crc32(buf) {
  const T = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = T[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files) {
  const partes = [], central = [];
  let off = 0;
  for (const f of files) {
    const nome = enc.encode(f.name);
    const dados = typeof f.data === "string" ? enc.encode(f.data) : f.data;
    const crc = crc32(dados);
    const lh = new Uint8Array(30 + nome.length);
    const v = new DataView(lh.buffer);
    v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true);
    v.setUint16(8, 0, true); v.setUint16(10, 0, true); v.setUint16(12, 0x2821, true);
    v.setUint32(14, crc, true); v.setUint32(18, dados.length, true); v.setUint32(22, dados.length, true);
    v.setUint16(26, nome.length, true); v.setUint16(28, 0, true);
    lh.set(nome, 30);
    partes.push(lh, dados);
    const ch = new Uint8Array(46 + nome.length);
    const w = new DataView(ch.buffer);
    w.setUint32(0, 0x02014b50, true); w.setUint16(4, 20, true); w.setUint16(6, 20, true);
    w.setUint16(8, 0x0800, true); w.setUint16(10, 0, true); w.setUint16(12, 0, true); w.setUint16(14, 0x2821, true);
    w.setUint32(16, crc, true); w.setUint32(20, dados.length, true); w.setUint32(24, dados.length, true);
    w.setUint16(28, nome.length, true); w.setUint32(42, off, true);
    ch.set(nome, 46);
    central.push(ch);
    off += lh.length + dados.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array(22);
  const e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
  const total = [...partes, ...central, end];
  const size = total.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(size);
  let p = 0;
  for (const b of total) { out.set(b, p); p += b.length; }
  return out;
}

/** Converte um data URL em bytes, no navegador ou no Node. */
function bytesDeDataUrl(url) {
  const virgula = String(url).indexOf(",");
  if (virgula < 0) return null;
  const cabecalho = url.slice(0, virgula);
  const base64 = url.slice(virgula + 1);
  const ext = /image\/png/i.test(cabecalho) ? "png" : /image\/gif/i.test(cabecalho) ? "gif" : "jpeg";
  try {
    if (typeof atob === "function") {
      const bin = atob(base64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return { bytes: out, ext };
    }
    return { bytes: new Uint8Array(Buffer.from(base64, "base64")), ext };
  } catch {
    return null;
  }
}

const EMU = 12700;
const emu = (px) => Math.round(px * EMU);
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n';

function fillXml(sh) {
  if (sh.grad) {
    const gs = sh.grad.map((c, i) => `<a:gs pos="${Math.round((i / Math.max(sh.grad.length - 1, 1)) * 100000)}"><a:srgbClr val="${hex6(c)}"/></a:gs>`).join("");
    return `<a:gradFill rotWithShape="1"><a:gsLst>${gs}</a:gsLst><a:lin ang="0" scaled="0"/></a:gradFill>`;
  }
  if (!sh.fill) return "<a:noFill/>";
  const al = sh.opacity != null && sh.opacity < 1 ? `<a:alpha val="${Math.round(sh.opacity * 100000)}"/>` : "";
  return `<a:solidFill><a:srgbClr val="${hex6(sh.fill)}">${al}</a:srgbClr></a:solidFill>`;
}

function spXml(sh, id, rels) {
  const rot = sh.rot ? ` rot="${Math.round(sh.rot * 60000)}"` : "";
  if (sh.k === "img") {
    const rid = rels && rels.get(sh.src);
    if (!rid) return "";
    const alpha = sh.opacity != null && sh.opacity < 1
      ? `<a:alphaModFix amt="${Math.round(sh.opacity * 100000)}"/>` : "";
    return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="img${id}"/><p:cNvPicPr><a:picLocks noChangeAspect="0"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`
      + `<p:blipFill><a:blip r:embed="${rid}">${alpha}</a:blip>`
      + `<a:stretch><a:fillRect/></a:stretch></p:blipFill>`
      + `<p:spPr><a:xfrm${rot}><a:off x="${emu(sh.x)}" y="${emu(sh.y)}"/><a:ext cx="${emu(sh.w)}" cy="${emu(sh.h)}"/></a:xfrm>`
      + `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
  }
  if (sh.k === "rect" || sh.k === "ellipse") {
    const geo = sh.k === "ellipse" ? '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>'
      : sh.radius ? `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${Math.min(50000, Math.round((sh.radius / Math.min(sh.w, sh.h)) * 100000))}"/></a:avLst></a:prstGeom>`
        : '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
    const ln = sh.stroke ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${hex6(sh.stroke)}"/></a:solidFill></a:ln>` : "<a:ln><a:noFill/></a:ln>";
    const sombra = sh.sombra
      ? '<a:effectLst><a:outerShdw blurRad="228600" dist="76200" dir="5400000" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="14000"/></a:srgbClr></a:outerShdw></a:effectLst>'
      : "";
    const ef = sh.soft
      ? `<a:effectLst><a:softEdge rad="${emu(Math.min(sh.soft, Math.min(sh.w, sh.h) / 2 - 1))}"/></a:effectLst>`
      : sombra;
    return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="s${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>`
      + `<p:spPr><a:xfrm${rot}><a:off x="${emu(sh.x)}" y="${emu(sh.y)}"/><a:ext cx="${emu(sh.w)}" cy="${emu(sh.h)}"/></a:xfrm>`
      + `${geo}${fillXml(sh)}${ln}${ef}</p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`;
  }
  const alpha = sh.opacity != null && sh.opacity < 1 ? `<a:alpha val="${Math.round(sh.opacity * 100000)}"/>` : "";
  const spc = Math.round((sh.track || 0) * sh.size * 100);
  const h = alturaTexto(sh.text, sh.w, sh.size, sh.lh, sh.font, sh.upper, sh.track, sh.weight) + Math.round(sh.size * 0.4);
  const runs = String(sh.text).split("\n").map((linha) =>
    `<a:p><a:pPr algn="${sh.align || "l"}"><a:lnSpc><a:spcPts val="${Math.round(sh.lh * sh.size * 100)}"/></a:lnSpc></a:pPr>`
    + `<a:r><a:rPr lang="pt-BR" sz="${Math.round(sh.size * 100)}" b="${sh.weight >= 600 ? 1 : 0}" i="${sh.italic ? 1 : 0}" spc="${spc}" dirty="0">`
    + `<a:solidFill><a:srgbClr val="${hex6(sh.color)}">${alpha}</a:srgbClr></a:solidFill>`
    + `<a:latin typeface="${esc(FP(sh.font))}"/><a:cs typeface="${esc(FP(sh.font))}"/></a:rPr>`
    + `<a:t>${esc(sh.upper ? String(linha).toUpperCase() : linha)}</a:t></a:r></a:p>`).join("");
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="t${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>`
    + `<p:spPr><a:xfrm${rot}><a:off x="${emu(sh.x)}" y="${emu(sh.y)}"/><a:ext cx="${emu(sh.w)}" cy="${emu(h)}"/></a:xfrm>`
    + `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>`
    + `<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"><a:normAutofit/></a:bodyPr><a:lstStyle/>${runs}</p:txBody></p:sp>`;
}

function slideXml(t, s, rels) {
  const shapes = layout(t, s).map((sh, i) => spXml(sh, i + 2, rels)).join("");
  const bg = t.bgGrad
    ? fillXml({ grad: t.bgGrad })
    : `<a:solidFill><a:srgbClr val="${hex6(t.bg, "FFFFFF")}"/></a:solidFill>`;
  return XML + `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">`
    + `<p:cSld><p:bg><p:bgPr>${bg}<a:effectLst/></p:bgPr></p:bg>`
    + `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`
    + `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`
    + `${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

const THEME = XML + `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Estudio"><a:themeElements>
<a:clrScheme name="Estudio"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1D1D1F"/></a:dk2><a:lt2><a:srgbClr val="F5F5F7"/></a:lt2><a:accent1><a:srgbClr val="007AFF"/></a:accent1><a:accent2><a:srgbClr val="5856D6"/></a:accent2><a:accent3><a:srgbClr val="34C759"/></a:accent3><a:accent4><a:srgbClr val="FF9500"/></a:accent4><a:accent5><a:srgbClr val="FF3B30"/></a:accent5><a:accent6><a:srgbClr val="AF52DE"/></a:accent6><a:hlink><a:srgbClr val="007AFF"/></a:hlink><a:folHlink><a:srgbClr val="6E6E73"/></a:folHlink></a:clrScheme>
<a:fontScheme name="Estudio"><a:majorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
<a:fmtScheme name="Estudio">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
</a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

const VAZIO_TREE = `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree>`;
const NS = `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"`;

const MASTER = XML + `<p:sldMaster ${NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>${VAZIO_TREE}</p:cSld>`
  + `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>`
  + `<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`;

const LAYOUT = XML + `<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Em branco">${VAZIO_TREE}</p:cSld>`
  + `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

export function construirPptx(t, slides) {
  const n = slides.length;
  const arquivos = [];

  // Imagens usadas (fundo e marca d'água) viram partes de mídia do pacote.
  const midia = new Map(); // dataURL -> { nome, ext }
  const porSlide = slides.map((s) => {
    const usadas = [];
    for (const sh of layout(t, s)) {
      if (sh.k !== "img" || !sh.src) continue;
      if (!midia.has(sh.src)) {
        const dados = bytesDeDataUrl(sh.src);
        if (!dados) continue;
        const nome = `image${midia.size + 1}.${dados.ext === "jpeg" ? "jpeg" : dados.ext}`;
        midia.set(sh.src, { nome, bytes: dados.bytes });
        arquivos.push({ name: `ppt/media/${nome}`, data: dados.bytes });
      }
      if (!usadas.includes(sh.src)) usadas.push(sh.src);
    }
    const rels = new Map();
    usadas.forEach((src, i) => rels.set(src, `rId${i + 2}`));
    return { usadas, rels };
  });
  const extensoes = [...new Set([...midia.values()].map((m) => m.nome.split(".").pop()))];
  const tipos = [
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    ...extensoes.map((e) => `<Default Extension="${e}" ContentType="image/${e === "jpeg" ? "jpeg" : e}"/>`),
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
    ...slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`),
  ].join("");
  arquivos.push({ name: "[Content_Types].xml", data: XML + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${tipos}</Types>` });
  arquivos.push({ name: "_rels/.rels", data: XML + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>` });

  const sldIds = slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("");
  arquivos.push({
    name: "ppt/presentation.xml", data: XML + `<p:presentation ${NS} saveSubsetFonts="1">`
      + `<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>`
      + `<p:sldIdLst>${sldIds}</p:sldIdLst>`
      + `<p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`
  });
  const relsPres = [`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
  ...slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`),
  `<Relationship Id="rId${n + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>`].join("");
  arquivos.push({ name: "ppt/_rels/presentation.xml.rels", data: XML + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relsPres}</Relationships>` });

  arquivos.push({ name: "ppt/slideMasters/slideMaster1.xml", data: MASTER });
  arquivos.push({
    name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", data: XML + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
      + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`
      + `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`
  });
  arquivos.push({ name: "ppt/slideLayouts/slideLayout1.xml", data: LAYOUT });
  arquivos.push({
    name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", data: XML + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
      + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`
  });
  arquivos.push({ name: "ppt/theme/theme1.xml", data: THEME });

  slides.forEach((s, i) => {
    const { usadas, rels } = porSlide[i];
    arquivos.push({ name: `ppt/slides/slide${i + 1}.xml`, data: slideXml(t, s, rels) });
    const relsImg = usadas
      .filter((src) => midia.has(src))
      .map((src, k) => `<Relationship Id="rId${k + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${midia.get(src).nome}"/>`)
      .join("");
    arquivos.push({
      name: `ppt/slides/_rels/slide${i + 1}.xml.rels`, data: XML + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
        + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`
        + `${relsImg}</Relationships>`
    });
  });
  return zip(arquivos);
}
