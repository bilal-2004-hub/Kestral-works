export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-marine-900">{title}</h1>
        {description && <p className="prose-measure mt-1 text-sm text-mist-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
