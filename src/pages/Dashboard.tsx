import { Users, UserPlus, AlertCircle, ClipboardX, UserMinus, Activity, TrendingUp, ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { useAlunos } from "@/hooks/useAlunos";
import { useCobrancas } from "@/hooks/useCobrancas";

const iconBg: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  info: "bg-info/15 text-info",
};

function StatCard({ icon: Icon, label, value, hint, tone = "primary" }: any) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { stats, loading: loadingStats } = useDashboard();
  const { alunos, loading: loadingAlunos } = useAlunos();
  const { cobrancas, loading: loadingCobrancas } = useCobrancas();

  if (loadingStats || loadingAlunos || loadingCobrancas) {
    return <div className="flex h-[80vh] items-center justify-center">Carregando...</div>;
  }

  const occupancy = 0; // Placeholder para ocupação real se houver

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral da operação · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <Link
          to="/alunos/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Novo aluno
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <StatCard icon={Users} label="Alunos ativos" value={stats.alunosAtivos} hint="Total atualmente matriculado" tone="primary" />
        <StatCard icon={TrendingUp} label="Novos no mês" value={stats.novosMes} hint="Cadastros neste mês" tone="info" />
        <StatCard icon={AlertCircle} label="Mensalidades em aberto" value={stats.inadimplentes} hint="Inadimplência atual" tone="destructive" />
        <StatCard icon={ClipboardX} label="Sem avaliação física" value={stats.semAvaliacao} hint="Bloqueados para treino" tone="warning" />
        <StatCard icon={UserMinus} label="Inativos +15 dias" value={stats.inativos15dias} hint="Última entrada ausente" tone="warning" />
        <StatCard icon={Activity} label="Ocupação atual" value={occupancy} hint="Pessoas na academia agora" tone="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Atenção necessária</h2>
            <Link to="/alunos" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {alunos
              .filter((s) => s.status !== 'ativo')
              .slice(0, 5)
              .map((s) => (
                <Link
                  key={s.id}
                  to={`/alunos/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 transition-smooth hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                      {s.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.nome}</p>
                      <p className="text-xs text-muted-foreground">{s.status}</p>
                    </div>
                  </div>
                  <StatusBadge variant={s.status === 'inativo' ? "destructive" : "warning"}>
                    {s.status}
                  </StatusBadge>
                </Link>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Inadimplentes</h2>
            <Link to="/financeiro" className="text-xs text-primary hover:underline">Ver financeiro</Link>
          </div>
          <div className="space-y-3">
            {cobrancas
              .filter((p) => p.status === "atrasado")
              .map((p) => {
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                    <div>
                      <p className="text-sm font-medium">{p.aluno?.nome}</p>
                      <p className="text-xs text-muted-foreground">Venc. {new Date(p.vencimento).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">R$ {p.valor.toFixed(2)}</p>
                      <StatusBadge variant="destructive">Atrasado</StatusBadge>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
