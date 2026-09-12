const PASSOS = ["Conteúdo", "Estrutura", "Design", "Revisão", "Exportar"];

export default function Passos({ atual, maximo, aoIr }) {
  return (
    <nav className="passos" aria-label="Etapas">
      {PASSOS.map((nome, i) => {
        const n = i + 1;
        const liberado = n <= maximo;
        return (
          <button
            key={nome}
            type="button"
            className={`passo ${n < atual ? "feito" : ""}`}
            aria-current={n === atual ? "step" : undefined}
            disabled={!liberado}
            onClick={() => liberado && aoIr(n)}
          >
            <span className="passo-num">{n}</span>
            {nome}
          </button>
        );
      })}
    </nav>
  );
}
