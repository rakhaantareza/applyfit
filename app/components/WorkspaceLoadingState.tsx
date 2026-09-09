export function WorkspaceLoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="workspace-loading" aria-busy="true" role="status">
      <span className="sr-only">Memuat data halaman</span>
      <span className="workspace-loading-heading" aria-hidden="true" />
      {Array.from({ length: rows }, (_, index) => (
        <span className="workspace-loading-row" aria-hidden="true" key={index} />
      ))}
    </div>
  );
}
