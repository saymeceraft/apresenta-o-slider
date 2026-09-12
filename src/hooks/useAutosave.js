import { useEffect, useRef, useState } from "react";

/**
 * Salva com atraso: espera o usuário parar de digitar antes de gravar.
 * Devolve "ocioso" | "salvando" | "salvo" para a interface mostrar.
 */
export default function useAutosave(valor, salvar, atraso = 600) {
  const [estado, setEstado] = useState("ocioso");
  const primeira = useRef(true);
  const salvarRef = useRef(salvar);
  salvarRef.current = salvar;

  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    setEstado("salvando");
    const t = setTimeout(async () => {
      try {
        await salvarRef.current(valor);
        setEstado("salvo");
      } catch (e) {
        console.warn("Autosave falhou:", e);
        setEstado("ocioso");
      }
    }, atraso);
    return () => clearTimeout(t);
  }, [valor, atraso]);

  return estado;
}
