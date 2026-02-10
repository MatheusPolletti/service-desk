"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CornerRightUp,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SimpleTicket {
  id: number;
  subject: string;
  requesterEmail: string;
  status: string;
  updatedAt: string;
  slaDueDate?: string;
  slaStatus?: "OK" | "WARNING" | "BREACHED";
}

function getInitials(email: string) {
  return email ? email.substring(0, 2).toUpperCase() : "??";
}

function getSlaDisplay(dateString?: string) {
  if (!dateString) return null;

  const deadline = new Date(dateString);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    return {
      text: `Venceu há ${Math.abs(diffHours)}h`,
      style: "text-red-700 bg-red-50 border-red-200",
      icon: <AlertCircle className="w-3 h-3" />,
    };
  }

  if (diffHours < 4) {
    return {
      text: `Vence em ${diffHours}h`,
      style: "text-amber-700 bg-amber-50 border-amber-200",
      icon: <Clock className="w-3 h-3" />,
    };
  }

  return {
    text: `Prazo: ${diffHours}h`,
    style: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  };
}

export default function TicketSidebar() {
  const [tickets, setTickets] = useState<SimpleTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");

  const params = useParams();
  const currentId = Number(params.id);

  useEffect(() => {
    fetch("http://localhost:5000/ticket/get/messages")
      .then((res) => res.json())
      .then((response) => {
        if (response.success && Array.isArray(response.data)) {
          setTickets(response.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const term = searchTerm.toLowerCase();
    return (
      ticket.subject.toLowerCase().includes(term) ||
      ticket.requesterEmail.toLowerCase().includes(term) ||
      ticket.id.toString().includes(term)
    );
  });

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg text-gray-800">
            Caixa de Entrada
          </h2>
          <div
            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
            onClick={() => router.replace("/")}
            title="Sair"
          >
            <CornerRightUp className="w-4 h-4 text-gray-500" />
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar..."
            className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-blue-500 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const isActive = ticket.id === currentId;
                const sla = getSlaDisplay(ticket.slaDueDate);

                return (
                  <Link
                    key={ticket.id}
                    href={`/${ticket.id}`}
                    className={`block p-4 hover:bg-gray-50 transition-colors border-l-4 group ${
                      isActive
                        ? "bg-blue-50/50 border-l-blue-600"
                        : "border-l-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Avatar className="h-6 w-6 border border-gray-200">
                          <AvatarFallback className="text-[9px] font-bold bg-white text-gray-600">
                            {getInitials(ticket.requesterEmail)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`text-xs font-semibold truncate ${isActive ? "text-blue-700" : "text-gray-900"}`}
                        >
                          {ticket.requesterEmail}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {new Date(ticket.updatedAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>

                    <div className="pl-8 mb-2">
                      <p
                        className={`text-sm font-medium truncate ${isActive ? "text-gray-900" : "text-gray-700"}`}
                      >
                        {ticket.subject}
                      </p>
                    </div>

                    <div className="pl-8 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">
                        #{ticket.id}
                      </span>

                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${
                          ticket.status === "OPEN"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : ticket.status === "PENDING"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                              : "bg-gray-50 text-gray-600 border-gray-100"
                        }`}
                      >
                        {ticket.status.toLowerCase()}
                      </span>

                      {sla &&
                        ticket.status !== "RESOLVED" &&
                        ticket.status !== "CLOSED" && (
                          <span
                            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium ${sla.style}`}
                          >
                            {sla.icon}
                            {sla.text}
                          </span>
                        )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  Nenhum ticket encontrado.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
