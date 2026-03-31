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
      title={`${title} modulu hazirlandi`}
      message={`${description} Bu gecici rota baglandi ve korumaya alindi; bir sonraki sprintte gelistirmeye hazir.`}
    />
  );
}
