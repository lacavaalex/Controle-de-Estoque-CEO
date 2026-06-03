// Página placeholder do esqueleto. Cada tela de negócio (Estoque CEO, etc.)
// substituirá isto pela sua implementação, ligada ao backend.
interface PlaceholderProps {
  titulo: string;
  descricao: string;
  story?: string;
}

export function Placeholder({ titulo, descricao, story }: PlaceholderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
      <p className="mt-2 max-w-2xl text-gray-600">{descricao}</p>
      {story && (
        <span className="mt-4 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-strong">
          {story}
        </span>
      )}
      <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-400">
        Tela em construção — esqueleto pronto, conteúdo a implementar.
      </div>
    </div>
  );
}
