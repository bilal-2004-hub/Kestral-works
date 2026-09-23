export default function Table({ columns, rows, keyField = '_id', onRowClick, empty }) {
  if (!rows?.length) return empty || null;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm text-white">
          <thead className="border-b border-white/10 text-xs font-mono uppercase tracking-wider text-marine-100/60 bg-white/[0.02]">
            <tr>{columns.map((col) => <th key={col.key} className="px-5 py-3.5">{col.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/[0.04]' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 align-middle text-marine-100/80">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row[keyField]}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className="rounded-xl border border-white/10 bg-marine-900/80 p-5 shadow-sm text-white"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between gap-3 py-1.5 text-sm">
                <span className="text-xs font-mono uppercase tracking-wider text-marine-100/50">{col.header}</span>
                <span className="text-right text-marine-100/90">{col.render ? col.render(row) : row[col.key]}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
