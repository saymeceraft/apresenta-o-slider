const ABAS = [
  [1, "Conteúdo"],
  [2, "Design"],
  [3, "Editar"],
  [4, "Exportar"],
];

export default function Abas({ atual, maximo, aoIr }) {
  return (
    <nav className="abas" aria-label="Etapas">
      {ABAS.map(([n, nome]) => (
        <button
          key={n}
          type="button"
          className="aba"
          aria-current={n === atual ? "page" : undefined}
          disabled={n > maximo}
          onClick={() => n <= maximo && aoIr(n)}
        >
          {nome}
        </button>
      ))}
    </nav>
  );
}
