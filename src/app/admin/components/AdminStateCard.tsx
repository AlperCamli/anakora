interface AdminStateCardProps {
  title: string;
  message: string;
  tone?: "default" | "error";
}

export function AdminStateCard({
  title,
  message,
  tone = "default",
}: AdminStateCardProps) {
  const toneClass =
    tone === "error"
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : "border-border bg-card text-foreground";

  return (
    <div className={`rounded-lg border p-6 shadow-sm ${toneClass}`}>
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  );
}
