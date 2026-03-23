function badgeClass(isComplete: boolean) {
  return isComplete
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-terracotta/15 text-terracotta border-terracotta/30";
}

export function AdminLocaleCompleteness({
  trComplete,
  enComplete,
}: {
  trComplete: boolean;
  enComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em]">
      <span className={`rounded-full border px-2 py-1 ${badgeClass(trComplete)}`}>
        TR {trComplete ? "complete" : "missing"}
      </span>
      <span className={`rounded-full border px-2 py-1 ${badgeClass(enComplete)}`}>
        EN {enComplete ? "complete" : "missing"}
      </span>
    </div>
  );
}
