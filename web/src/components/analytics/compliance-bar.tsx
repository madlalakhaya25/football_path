interface Props {
  complete: number;
  total: number;
}

export function ComplianceBar({ complete, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((complete / total) * 100);
  const incomplete = total - complete;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Document compliance</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-success" />
          {complete} complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-muted-foreground/40" />
          {incomplete} incomplete
        </span>
      </div>
    </div>
  );
}
