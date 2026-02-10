"use client";

import { useState } from "react";
import { Plus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ContactForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const data = {
      subject: formData.get("subject"),
      content: formData.get("message"),
      recipients: formData.get("recipients"),
    };

    try {
      const res = await fetch("http://localhost:5000/ticket/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setOpen(false);
        window.location.reload();
      } else {
        console.error("Erro ao criar ticket");
      }
    } catch (error) {
      console.error("Erro de conexão", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Novo Chamado
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Abrir Novo Chamado</DialogTitle>
          <DialogDescription>
            Informe os dados abaixo. Você receberá atualizações por e-mail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="recipients" className="text-slate-700">
              Seu E-mail (Solicitante)
            </Label>
            <Input
              id="recipients"
              name="recipients"
              type="email"
              placeholder="seu.email@empresa.com"
              required
              className="col-span-3"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject" className="text-slate-700">
              Assunto
            </Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Ex: Não consigo acessar a VPN"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message" className="text-slate-700">
              Descrição Detalhada
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Descreva o problema, mensagens de erro, etc..."
              className="min-h-37.5 resize-none"
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Criar Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
