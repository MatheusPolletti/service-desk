"use client";

import {
  Reply,
  ReplyAll,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";

interface Attachment {
  id: string;
  mimeType: string;
  data: string;
  filename: string;
}

interface Message {
  id: string;
  content: string;
  direction: "IN" | "OUT";
  createdAt: string;
  senderEmail?: string;
  attachments: Attachment[];
}

interface Ticket {
  id: number;
  subject: string;
  requesterEmail: string;
  recipients: string[];
  status: string;
  messages: Message[];
}

function getInitials(nameOrEmail: string) {
  const clean = nameOrEmail.replace(/[^a-zA-Z ]/g, "");
  return (clean.substring(0, 1) || "?").toUpperCase();
}

function formatOutlookDate(dateString: string) {
  const date = new Date(dateString);
  const weekDay = date.toLocaleDateString("pt-BR", { weekday: "short" });
  const dayMonthYear = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const weekDayClean = weekDay.replace(".", "");
  const weekDayCap =
    weekDayClean.charAt(0).toUpperCase() + weekDayClean.slice(1);

  return `${weekDayCap}, ${dayMonthYear} ${time}`;
}

function getPreviewText(content: string) {
  const DELIMITER = "<---HISTORY-SEPARATOR--->";
  const [newContent] = content.split(DELIMITER);
  return newContent.replace(/\[cid:[^\]]*\]/g, "").trim();
}

const renderWithInlineImages = (text: string, attachments: Attachment[]) => {
  if (!text) return null;

  const cidRegex = /\[cid:([^\]]+)\]/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  const usedAttachmentIds = new Set<string>();

  while ((match = cidRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const cidId = match[1];

    let imageAttachment = attachments.find((att) =>
      att.filename.includes(cidId),
    );

    if (!imageAttachment) {
      const availableImages = attachments.filter(
        (att) =>
          att.mimeType.startsWith("image/") && !usedAttachmentIds.has(att.id),
      );
      if (availableImages.length > 0) {
        imageAttachment = availableImages[0];
      }
    }

    if (imageAttachment) {
      usedAttachmentIds.add(imageAttachment.id);
      parts.push(
        <div key={match.index} className="my-2">
          <Image
            src={`data:${imageAttachment.mimeType};base64,${imageAttachment.data}`}
            alt="Imagem inserida"
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: "auto", maxHeight: "400px", maxWidth: "100%" }}
            className="rounded border border-gray-200"
          />
        </div>,
      );
    }

    lastIndex = cidRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <div className="whitespace-pre-wrap">{parts}</div>;
};

const splitMessageContent = (msg: Message) => {
  const DELIMITER = "<---HISTORY-SEPARATOR--->";

  if (!msg.content.includes(DELIMITER)) {
    return {
      newContent: msg.content,
      historyContent: null,
    };
  }

  const [newContent, historyContent] = msg.content.split(DELIMITER);

  return {
    newContent: newContent.trim(),
    historyContent: historyContent.trim(),
  };
};

const MessageItem = ({
  msg,
  ticket,
  expandedMessages,
  toggleMessage,
  index,
}: {
  msg: Message;
  ticket: Ticket;
  expandedMessages: Record<string, boolean>;
  toggleMessage: (id: string) => void;
  index: number;
}) => {
  const isAgent = msg.direction === "OUT";
  const currentSenderEmail = isAgent
    ? "Suporte Técnico"
    : msg.senderEmail || ticket.requesterEmail;
  const senderDisplayName = currentSenderEmail;
  const { newContent, historyContent } = splitMessageContent(msg);

  const isExpanded =
    expandedMessages[msg.id] ||
    (Object.keys(expandedMessages).length === 0 && index === 0);
  const avatarBg = isAgent ? "bg-orange-100" : "bg-blue-100";
  const avatarText = isAgent ? "text-orange-700" : "text-blue-700";
  const borderColor = isAgent ? "border-l-orange-500" : "border-l-[#005a9e]";
  const nameColor = isAgent ? "text-orange-700" : "text-[#005a9e]";
  const headerBg = isExpanded
    ? isAgent
      ? "bg-orange-50/30"
      : "bg-blue-50/30"
    : "bg-white";

  return (
    <div
      className={`bg-white border border-gray-200 shadow-sm transition-all duration-200 ease-in-out ${
        isExpanded
          ? `rounded-sm border-l-4 ${borderColor}`
          : "rounded-md cursor-pointer hover:bg-gray-50"
      }`}
      onClick={(e) => {
        if (window.getSelection()?.toString().length === 0) {
          !isExpanded && toggleMessage(msg.id);
        }
      }}
    >
      <div
        className={`px-4 py-3 flex items-start gap-3 ${!isExpanded ? "h-14 overflow-hidden" : ""} ${headerBg}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleMessage(msg.id);
        }}
      >
        <Avatar
          className={`${isExpanded ? "w-10 h-10" : "w-8 h-8"} ${avatarBg} ${avatarText} border border-gray-100 transition-all`}
        >
          <AvatarFallback className="font-bold text-xs">
            {getInitials(senderDisplayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 overflow-hidden">
              <span
                className={`font-semibold ${nameColor} truncate ${!isExpanded ? "text-sm" : "text-[15px]"}`}
              >
                {senderDisplayName}
              </span>
              {isAgent && isExpanded && (
                <span className="text-[10px] uppercase font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                  Staff
                </span>
              )}

              {!isExpanded && (
                <span className="text-gray-500 text-xs truncate max-w-75 hidden sm:block">
                  {" "}
                  {getPreviewText(msg.content)
                    .substring(0, 60)
                    .replace(/\n/g, " ")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-xs whitespace-nowrap">
              <span>{formatOutlookDate(msg.createdAt)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1 text-gray-400"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in fade-in duration-300">
          <div className="px-4 py-4 pl-17 text-gray-800 text-[15px] leading-relaxed font-sans border-t border-transparent">
            {renderWithInlineImages(newContent, msg.attachments)}
          </div>

          {msg.attachments && msg.attachments.length > 0 && (
            <div className="px-4 pb-4 pl-17">
              <div className="border-t border-gray-100 pt-3">
                <div className="flex flex-col gap-4 mb-4">
                  {msg.attachments
                    .filter((att) => att.mimeType.startsWith("image/"))
                    .map((att) => (
                      <div
                        key={att.id}
                        className="max-w-md border rounded-lg overflow-hidden shadow-sm bg-gray-50"
                      >
                        <Image
                          src={`data:${att.mimeType};base64,${att.data}`}
                          alt={att.filename}
                          width={0}
                          height={0}
                          sizes="100vw"
                          style={{ width: "100%", height: "auto" }}
                          className="object-contain"
                        />
                        <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 border-t truncate">
                          {att.filename}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {historyContent && (
            <div className="px-4 pb-4 pl-17">
              <details
                className={`group border border-gray-200 rounded-md bg-gray-50 ${expandedMessages ? "w-fit" : "w-22"}`}
              >
                <summary className="list-none px-3 py-2 cursor-pointer flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 select-none transition-colors group-open:bg-gray-100 rounded-t-md">
                  <div className="bg-white border border-gray-200 rounded p-0.5 shadow-sm group-open:rotate-90 transition-transform">
                    <MoreHorizontal className="w-3 h-3" />
                  </div>
                </summary>

                <div className="px-3 py-3 border-t border-gray-200 text-xs text-gray-500 font-mono bg-white rounded-b-md overflow-auto max-h-96">
                  {renderWithInlineImages(historyContent, msg.attachments)}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function TicketEmailThread({ ticketId }: { ticketId: number }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<
    Record<string, boolean>
  >({});
  const editorRef = useRef<HTMLDivElement>(null);

  const loadTicket = useCallback(() => {
    fetch(`http://localhost:5000/ticket/get/message/${ticketId}`)
      .then((res) => res.json())
      .then((response) => {
        if (response.success && response.data) {
          const loadedTicket = response.data;
          if (loadedTicket.messages) loadedTicket.messages.reverse();
          setTicket(loadedTicket);
          if (loadedTicket.messages && loadedTicket.messages.length > 0) {
            const newestMsgId = loadedTicket.messages[0].id;
            setExpandedMessages((prev) => ({ [newestMsgId]: true, ...prev }));
          }
        }
      })
      .catch((err) => console.error(err));
  }, [ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (isReplying && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isReplying]);

  const toggleMessage = (messageId: string) => {
    setExpandedMessages((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  async function sendReply() {
    if (!reply.trim() || !ticket) return;
    setSending(true);
    const recipientsToSend = ticket.recipients || [];
    try {
      await fetch(`http://localhost:5000/ticket/add/message/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: reply,
          notifyClient: true,
          recipients: recipientsToSend,
        }),
      });
      setReply("");
      setIsReplying(false);
      loadTicket();
    } finally {
      setSending(false);
    }
  }

  if (!ticket)
    return (
      <div className="p-10">
        <Skeleton className="h-40 w-full" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] font-sans text-sm">
      <div className="bg-white px-5 py-4 border-b border-gray-200 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800 truncate">
          {ticket.subject.includes("[Ticket")
            ? ticket.subject
            : `[Ticket #${ticket.id}] ${ticket.subject}`}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-1">
          {!isReplying ? (
            <div className="flex items-center gap-1 p-1">
              <Button
                variant="ghost"
                className="h-10 text-gray-600 hover:bg-gray-100 text-sm gap-2 px-4 justify-start flex-1"
                onClick={() => setIsReplying(true)}
              >
                <Reply className="w-4 h-4 text-[#005a9e]" /> Responder
              </Button>
              <Button
                variant="ghost"
                className="h-10 text-gray-600 hover:bg-gray-100 text-sm gap-2 px-4 justify-start flex-1"
                onClick={() => setIsReplying(true)}
              >
                <ReplyAll className="w-4 h-4 text-[#005a9e]" /> Responder a
                todos
              </Button>
            </div>
          ) : (
            <div
              ref={editorRef}
              className="animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex gap-1 p-2 border-b border-gray-100 justify-between items-center bg-gray-50/50">
                <span className="text-xs font-semibold text-gray-500 pl-2">
                  Respondendo para:{" "}
                  <span className="text-[#005a9e]">
                    {ticket.requesterEmail}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-600"
                  onClick={() => setIsReplying(false)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <textarea
                className="w-full min-h-40 p-4 text-sm outline-none resize-none bg-white"
                placeholder="Escreva sua resposta..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                autoFocus
              />
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-b-md border-t border-gray-100">
                <div className="flex gap-3 items-center">
                  <Button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="bg-[#005a9e] hover:bg-[#004578] text-white px-6 h-8 text-sm shadow-sm"
                  >
                    {sending ? "Enviando..." : "Enviar"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsReplying(false)}
                    className="h-8 text-sm text-gray-600"
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {ticket.messages.map((msg, index) => (
          <MessageItem
            key={msg.id}
            msg={msg}
            ticket={ticket}
            expandedMessages={expandedMessages}
            toggleMessage={toggleMessage}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
