/** Nome de arquivo seguro a partir do título da apresentação e do modelo. */
export function nomeArquivo(deck, modelo, extensao) {
  const bruto = deck?.slides?.find((s) => s.titulo)?.titulo || "apresentacao";
  const base = bruto
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60) || "apresentacao";
  const sufixo = modelo?.id ? `-${String(modelo.id).replace(/[^a-z0-9-]/gi, "").slice(0, 24)}` : "";
  return `${base}${sufixo}.${extensao}`;
}

export function baixar(nome, dados, tipo) {
  const url = URL.createObjectURL(new Blob([dados], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 2000);
}

export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
