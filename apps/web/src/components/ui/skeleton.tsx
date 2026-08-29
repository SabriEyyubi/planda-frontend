export function Skeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="card muted">
      {label}…
    </div>
  );
}
