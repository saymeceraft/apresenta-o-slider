export const parseHex = (h) => {
  const m = /^#([0-9a-f]{6})$/i.exec((h || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const lum = (h) => { const c = parseHex(h); return c ? (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 : null; };
export const sobre = (h) => { const l = lum(h); return l !== null && l > 0.6 ? "#111111" : "#ffffff"; };
export const hexA = (h, a) => { const c = parseHex(h); return c ? `rgba(${c[0]},${c[1]},${c[2]},${a})` : h; };
export const escuro = (t) => { const l = lum(t.bg); return l === null ? true : l < 0.45; };
export const fonteNome = (t) => (t.fTitle === t.fBody ? t.fTitle : `${t.fTitle} + ${t.fBody}`);
export const hex6 = (h, fb = "000000") => { const c = parseHex(h); return c ? c.map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase() : fb; };
