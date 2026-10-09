import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Minus, Plus, RotateCcw } from "lucide-react";

const ALINHAMENTOS = [["l", AlignLeft, "à esquerda"], ["ctr", AlignCenter, "centralizado"], ["r", AlignRight, "à direita"]];

/** Ferramentas de texto de um campo: tamanho, negrito, itálico, alinhamento e cor. */
export default function BarraEstilo({ nome, estilo, aoMudar }) {
  const e = estilo || {};
  const escala = Number(e.escala) || 1;
  const set = (mudanca) => aoMudar({ ...e, ...mudanca });
  const mexido = Object.keys(e).length > 0;

  return (
    <div className="barra-estilo" role="group" aria-label={`Formatação: ${nome}`}>
      <button type="button" className="fmt" title={`Diminuir ${nome}`} onClick={() => set({ escala: Math.max(0.6, Math.round((escala - 0.1) * 10) / 10) })} aria-label={`Diminuir ${nome}`}><Minus size={13} /></button>
      <span className="fmt-valor" aria-hidden="true">{Math.round(escala * 100)}%</span>
      <button type="button" className="fmt" title={`Aumentar ${nome}`} onClick={() => set({ escala: Math.min(2, Math.round((escala + 0.1) * 10) / 10) })} aria-label={`Aumentar ${nome}`}><Plus size={13} /></button>
      <button type="button" className="fmt" title={`Negrito em ${nome}`} aria-pressed={e.negrito === true} onClick={() => set({ negrito: e.negrito === true ? null : true })} aria-label={`Negrito em ${nome}`}><Bold size={13} /></button>
      <button type="button" className="fmt" title={`Itálico em ${nome}`} aria-pressed={e.italico === true} onClick={() => set({ italico: e.italico === true ? null : true })} aria-label={`Itálico em ${nome}`}><Italic size={13} /></button>
      {ALINHAMENTOS.map(([v, Icone, desc]) => (
        <button key={v} type="button" className="fmt" title={`Alinhar ${desc}`} aria-pressed={e.align === v} onClick={() => set({ align: e.align === v ? null : v })} aria-label={`Alinhar ${desc}`}><Icone size={13} /></button>
      ))}
      <input type="color" className="fmt-cor" title={`Cor de ${nome}`} value={e.cor || "#000000"} onChange={(ev) => set({ cor: ev.target.value })} aria-label={`Cor de ${nome}`} />
      {mexido && (
        <button type="button" className="fmt" title={`Voltar ${nome} ao padrão do modelo`} onClick={() => aoMudar({})} aria-label={`Voltar ${nome} ao padrão do modelo`}><RotateCcw size={13} /></button>
      )}
    </div>
  );
}
