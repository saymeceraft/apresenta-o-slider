/* Camada única de persistência: o resto do app não sabe onde os dados moram.
   Tenta localStorage e, se o navegador bloquear, guarda em memória. */
const memoria = new Map();

let suporte = null;
function temLocalStorage() {
  if (suporte !== null) return suporte;
  try {
    const k = "__estudio_teste__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    suporte = true;
  } catch {
    suporte = false;
  }
  return suporte;
}

export const storageService = {
  async get(chave) {
    try {
      if (temLocalStorage()) {
        const v = window.localStorage.getItem(chave);
        return v === null ? null : JSON.parse(v);
      }
    } catch (e) {
      console.warn("Leitura do armazenamento falhou:", e);
    }
    return memoria.has(chave) ? memoria.get(chave) : null;
  },
  async set(chave, valor) {
    memoria.set(chave, valor);
    try {
      if (temLocalStorage()) window.localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      console.warn("Gravação no armazenamento falhou:", e);
      return false;
    }
  },
  async remove(chave) {
    memoria.delete(chave);
    try {
      if (temLocalStorage()) window.localStorage.removeItem(chave);
    } catch { /* sem persistência, segue em memória */ }
  },
};

export const CHAVES = {
  deck: "estudio:deck",
  modelo: "estudio:modelo",
  modelos: "estudio:modelos-importados",
  config: "estudio:config",
};
