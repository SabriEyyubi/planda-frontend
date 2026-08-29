export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className="card" aria-labelledby="empty-title">
      <h2 id="empty-title">{title}</h2>
      {description && <p className="muted">{description}</p>}
    </section>
  );
}
