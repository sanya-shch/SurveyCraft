export default function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div
        className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin"
        role="status"
        aria-label="Завантаження сторінки..."
      />
    </div>
  );
}
