import TicketChat from "@/app/components/ticket-chat";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white shadow rounded-lg overflow-hidden">
        <TicketChat ticketId={Number(resolvedParams.id)} />
      </div>
    </div>
  );
}
