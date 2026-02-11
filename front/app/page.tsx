"use client";

import { useEffect, useState } from "react";
import ContactForm from "./components/contract-form";
import Tickets from "./components/tickets";
import { Ticket, Bell, Loader2 } from "lucide-react";

interface DashboardStats {
  open: number;
  pending: number;
  resolvedToday: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    open: 0,
    pending: 0,
    resolvedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/ticket/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error("Erro ao carregar estatísticas", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Ticket className="w-6 h-6" /> SBDesk
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <ButtonVariant
            icon={<Ticket size={20} />}
            label="Meus Chamados"
            active
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              MP
            </div>
            <div className="text-sm">
              <p className="font-medium">Matheus Polletti</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-700">
            Central de Atendimentos
          </h2>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600">
              <Bell size={20} />
            </button>
            <ContactForm />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Chamados Abertos"
                value={loading ? "-" : stats.open.toString()}
                color="text-blue-600"
              />
              <StatCard
                label="Em Andamento"
                value={loading ? "-" : stats.pending.toString()}
                color="text-yellow-600"
              />
              <StatCard
                label="Resolvidos (Hoje)"
                value={loading ? "-" : stats.resolvedToday.toString()}
                color="text-green-600"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Tickets />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ButtonVariant({
  icon,
  label,
  active = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {value === "-" ? (
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        ) : (
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        )}
      </div>
    </div>
  );
}
