"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Ticket {
  id: number;
  subject: string;
  requesterEmail: string;
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  slaStatus: "OK" | "WARNING" | "BREACHED";
  updatedAt: string;
  createdAt: string;
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTickets = useCallback(() => {
    setLoading(true);

    fetch("http://localhost:5000/ticket/get/messages")
      .then((res) => res.json())
      .then((response) => {
        if (response.success && Array.isArray(response.data)) {
          setTickets(response.data);
        } else {
          setTickets([]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOnClick = (id: number) => {
    router.push(`/${id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
      case "RESOLVED":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      case "CLOSED":
        return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusSLA = (status: string) => {
    switch (status) {
      case "OK":
        return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
      case "WARNING":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
      case "BREACHED":
        return "bg-red-100 text-blue-700 hover:bg-blue-200 border-blue-200";
    }
  };

  return (
    <div className="w-full">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Chamados Recentes
          </h3>
          <p className="text-sm text-slate-500">
            Gerencie as solicitações de suporte
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="w-20">ID</TableHead>
            <TableHead className="w-30">Status</TableHead>
            <TableHead className="w-40">Status SLA</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead className="text-right">Última Atualização</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-32 text-center text-slate-500"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                  Carregando tickets...
                </div>
              </TableCell>
            </TableRow>
          ) : tickets.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-32 text-center text-slate-500"
              >
                Nenhum ticket encontrado.
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleOnClick(ticket.id)}
              >
                <TableCell className="font-medium text-slate-700">
                  #{ticket.id}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(ticket.status)}`}
                  >
                    {ticket.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusSLA(ticket.slaStatus)}`}
                  >
                    {ticket.slaStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-slate-900 block truncate max-w-75">
                    {ticket.subject}
                  </span>
                </TableCell>
                <TableCell className="text-slate-600">
                  {ticket.requesterEmail}
                </TableCell>
                <TableCell className="text-right text-slate-500 text-sm">
                  {new Date(ticket.updatedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
