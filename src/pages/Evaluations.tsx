import { Link } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useAlunos } from "@/hooks/useAlunos";

export default function Evaluations() {
  const { alunos, loading } = useAlunos();

  if (loading) return <div className="flex h-[80vh] items-center justify-center">Carregando...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avaliações Físicas</h1>
        <p className="text-sm text-muted-foreground">Selecione um aluno para iniciar ou consultar uma avaliação.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {alunos.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-4 transition-smooth hover:border-primary/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                {s.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <p className="font-medium">{s.nome}</p>
                <StatusBadge
                  variant={s.status === "ativo" ? "success" : "warning"}
                >
                  {s.status}
                </StatusBadge>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to={`/avaliacoes/nova/${s.id}`}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> Nova avaliação
              </Link>
              <Link
                to={`/alunos/${s.id}`}
                className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <ClipboardList className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
