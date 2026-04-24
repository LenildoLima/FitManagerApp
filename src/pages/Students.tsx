import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, Eye, Pencil, Ban } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useAlunos } from "@/hooks/useAlunos";
import { formatarCPF, formatarMoeda } from "@/utils/formatters";

export default function Students() {
  const { alunos: allStudents, loading, error } = useAlunos();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "inadimplente" | "no-eval" | "ativo">("all");

  const filtered = useMemo(() => {
    return allStudents.filter((s) => {
      const matchSearch =
        s.nome.toLowerCase().includes(search.toLowerCase()) || s.cpf.includes(search);
      if (!matchSearch) return false;
      if (filter === "inadimplente") return s.status === 'suspenso'; // Ajuste conforme lógica de inadimplência
      if (filter === "no-eval") return false; // Ajuste se houver campo de avaliação no Aluno
      if (filter === "ativo") return s.status === "ativo";
      return true;
    });
  }, [allStudents, search, filter]);

  if (loading) return <div className="flex h-[80vh] items-center justify-center">Carregando...</div>;
  if (error) return <div className="flex h-[80vh] items-center justify-center text-destructive">Erro: {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} resultado(s)</p>
        </div>
        <Link
          to="/alunos/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Novo aluno
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className="w-full rounded-lg border border-border bg-secondary/40 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-secondary/40 p-1">
            {[
              { k: "all", label: "Todos" },
              { k: "ativo", label: "Ativos" },
              { k: "inadimplente", label: "Inadimplentes" },
              { k: "no-eval", label: "Sem avaliação" },
            ].map((opt) => (
              <button
                key={opt.k}
                onClick={() => setFilter(opt.k as any)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-smooth ${
                  filter === opt.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Aluno</th>
                <th className="px-4 py-3 text-left">Plano</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Vencimento</th>
                <th className="px-4 py-3 text-left">Avaliação</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => {
                const overdue = s.status === 'suspenso'; // Exemplo
                return (
                  <tr key={s.id} className="transition-smooth hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                          {s.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{s.nome}</p>
                          <p className="text-xs text-muted-foreground">{formatarCPF(s.cpf)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.plano ? `${s.plano.nome} — ${formatarMoeda(s.plano.valor)}` : 'Nenhum'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={s.status === "ativo" ? "success" : s.status === "suspenso" ? "warning" : "muted"}>
                        {s.status}
                      </StatusBadge>
                      {overdue && <StatusBadge variant="destructive" className="ml-1">Inadimplente</StatusBadge>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.data_vencimento_plano ? new Date(s.data_vencimento_plano).toLocaleDateString("pt-BR") : '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={
                          s.status === "ativo" ? "success" : "warning"
                        }
                      >
                        {s.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/alunos/${s.id}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary" title="Ver perfil">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link to={`/alunos/editar/${s.id}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive" title="Bloquear">
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
