import { Link } from "react-router-dom";
import { Plus, Lock, Dumbbell } from "lucide-react";
import { students, workouts } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

export default function Workouts() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fichas de Treino</h1>
        <p className="text-sm text-muted-foreground">Selecione um aluno aprovado para criar ou editar a ficha.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {students.map((s) => {
          const canCreate = s.evaluationStatus === "Aprovada";
          const w = workouts.find((wk) => wk.studentId === s.id && wk.active);
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                  {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{s.name}</p>
                  {w ? (
                    <p className="text-xs text-muted-foreground">{w.name}</p>
                  ) : canCreate ? (
                    <p className="text-xs text-muted-foreground">Sem ficha ativa</p>
                  ) : (
                    <StatusBadge variant="destructive">Bloqueado — sem avaliação</StatusBadge>
                  )}
                </div>
              </div>
              <div className="mt-3">
                {canCreate ? (
                  <Link
                    to={`/fichas/nova/${s.id}`}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {w ? <><Dumbbell className="h-3.5 w-3.5" /> Editar ficha</> : <><Plus className="h-3.5 w-3.5" /> Criar ficha</>}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Lock className="h-3.5 w-3.5" /> Avaliação pendente
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
