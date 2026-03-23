import { AdminStateCard } from "../components/AdminStateCard";

export function AdminPlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AdminStateCard
      title={`${title} module is staged`}
      message={`${description} This placeholder route is wired and protected, ready for implementation in the next sprint.`}
    />
  );
}
