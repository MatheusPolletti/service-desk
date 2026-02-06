"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface Ticket {
  id: number;
  subject: string;
  requesterEmail: string;
  updatedAt: string;
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleOnClick = (id: number) => {
    router.replace(`/${id}`);
  };

  useEffect(() => {
    fetch("http://localhost:5000/ticket/get/messages")
      .then((res) => res.json())
      .then((response) => {
        if (response.success && Array.isArray(response.data)) {
          setTickets(response.data);
        } else {
          setTickets([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-10 w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <span className="text-sm text-gray-500">Total: {tickets.length}</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>Lista de tickets recentes.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead className="text-right">Última Atualização</TableHead>
              <TableHead className="w-25"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum ticket encontrado.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  onClick={() => handleOnClick(ticket.id)}
                >
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/ticket/${ticket.id}`}
                      className="font-medium hover:underline text-blue-600 hover:text-blue-800"
                    >
                      {ticket.subject}
                    </Link>
                  </TableCell>
                  <TableCell>{ticket.requesterEmail}</TableCell>
                  <TableCell className="text-right text-gray-500">
                    {new Date(ticket.updatedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
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
    </div>
  );
}
