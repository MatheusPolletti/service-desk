"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

function getInitials(email: string) {
  return email ? email.substring(0, 2).toUpperCase() : "??";
}

function formatEmailDate(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketEmailThread({ ticketId }: { ticketId: number }) {
  const [ticket, setTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  type Attachment = {
    id: string;
    mimeType: string;
    data: string;
    filename: string;
  };

  const loadTicket = useCallback(() => {
    fetch(`http://localhost:5000/ticket/get/message/${ticketId}`)
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          setTicket(response.data);
        } else {
          console.error("Erro ao carregar ticket:", response);
        }
      })
      .catch((err) => console.error("Erro de conexão:", err));
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket?.messages]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);

    try {
      await fetch(`http://localhost:5000/ticket/add/message/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: reply,
          notifyClient: true,
          recipients: ticket.recipients,
          subject: ticket.subject,
        }),
      });
      setReply("");
      loadTicket();
    } finally {
      setSending(false);
    }
  }

  if (ticket === null) {
    return (
      <div className="p-8 text-center text-gray-500">
        Carregando conversa...
      </div>
    );
  }

  const handleClick = () => {
    router.replace("/");
  };

  return (
    <div className="flex flex-col h-screen max-h-200 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {ticket.subject}{" "}
              <span className="text-gray-400 font-normal">#{ticket.id}</span>
            </h1>
            <div className="text-sm text-gray-500">
              Solicitante:{" "}
              <span className="font-medium text-gray-700">
                {ticket.requesterEmail}
              </span>
            </div>
          </div>
          <div>
            <LogOut className="cursor-pointer" onClick={() => handleClick()} />
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-6 space-y-8 bg-white scroll-smooth"
        ref={scrollRef}
      >
        {ticket.messages.map((msg: any) => {
          const isAgent = msg.direction === "OUT";
          const senderName = isAgent
            ? "Suporte Técnico"
            : ticket.requesterEmail.split("@")[0];
          const senderEmail = isAgent
            ? "suporte@empresa.com"
            : ticket.requesterEmail;

          return (
            <div key={msg.id} className="group">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                    isAgent
                      ? "bg-blue-600 text-white"
                      : "bg-orange-500 text-white"
                  }`}
                >
                  {getInitials(isAgent ? "Suporte" : ticket.requesterEmail)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold text-gray-900">
                      {senderName}
                      <span className="text-gray-400 font-normal text-xs ml-2">
                        &lt;{senderEmail}&gt;
                      </span>
                    </h3>
                    <span className="text-xs text-gray-400 font-medium">
                      {formatEmailDate(msg.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Para: {isAgent ? ticket.requesterEmail : "Suporte Técnico"}
                  </div>
                </div>
              </div>

              <div className="ml-14 text-sm text-gray-800 leading-relaxed border-l-2 border-transparent group-hover:border-gray-200 pl-2 transition-colors">
                <p className="whitespace-pre-wrap font-sans">{msg.content}</p>

                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      {msg.attachments.length} Anexo(s)
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {msg.attachments.map((att: Attachment) => (
                        <div
                          key={att.id}
                          className="border rounded-md p-2 bg-gray-50 flex items-center gap-3 min-w-5 hover:bg-gray-100 transition"
                        >
                          <div className="bg-gray-200 p-2 rounded">
                            <svg
                              className="w-6 h-6 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-medium truncate text-gray-700">
                              {att.filename}
                            </p>
                            <div className="flex gap-2 mt-0.5">
                              <a
                                href={`data:${att.mimeType};base64,${att.data}`}
                                download={att.filename}
                                className="text-[10px] text-blue-600 font-bold hover:underline"
                              >
                                Baixar
                              </a>
                            </div>
                          </div>
                          {att.mimeType.startsWith("image/") && (
                            <Image
                              src={`data:${att.mimeType};base64,${att.data}`}
                              alt={att.filename || "Anexo"}
                              width={200}
                              height={80}
                              className="object-cover rounded border"
                              unoptimized
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-b border-gray-100 my-6 ml-14"></div>
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-gray-50 border-t">
        <div className="bg-white border rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <div className="border-b px-3 py-2 bg-gray-50 flex gap-2">
            <span className="text-xs font-bold text-gray-500">
              Responder para:
            </span>
            <span className="text-xs text-gray-700 bg-gray-200 px-2 rounded">
              {ticket.requesterEmail}
            </span>
          </div>
          <textarea
            className="w-full p-4 min-h-25 resize-y outline-none text-sm text-gray-800"
            placeholder="Escreva sua resposta aqui..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={sending}
          />
          <div className="p-3 border-t flex justify-between items-center bg-gray-50 rounded-b-lg">
            <div className="text-xs text-gray-400 italic">
              Use Shift + Enter para quebrar linha
            </div>
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className={`px-6 py-2 rounded-md text-sm font-bold shadow-sm transition-all ${
                sending || !reply.trim()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow"
              }`}
            >
              {sending ? "Enviando..." : "Enviar Resposta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
