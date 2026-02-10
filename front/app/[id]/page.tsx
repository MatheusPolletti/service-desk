import TicketChat from "@/app/components/ticket-chat"; // Seu componente de chat atual
import TicketSidebar from "@/app/components/ticket-sidebar"; // O novo componente acima

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-80 shrink-0 bg-white border-r border-gray-200 hidden md:flex flex-col z-20 shadow-sm">
        <TicketSidebar />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <TicketChat ticketId={Number(resolvedParams.id)} />
      </main>
    </div>
  );
}
