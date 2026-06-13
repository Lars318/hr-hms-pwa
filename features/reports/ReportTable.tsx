const PREVIEW_LIMIT = 20;

interface Props {
  headers: string[];
  rows: (string | number | null)[][];
  total: number;
}

export function ReportTable({ headers, rows, total }: Props) {
  const preview = rows.slice(0, PREVIEW_LIMIT);

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ingen data for valgt periode og filter.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {total} rad{total !== 1 ? "er" : ""} totalt
        {total > PREVIEW_LIMIT ? ` — viser første ${PREVIEW_LIMIT}` : ""}
      </p>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {preview.map((row, ri) => (
              <tr key={ri} className="hover:bg-muted/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="whitespace-nowrap px-3 py-2 text-xs">
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
