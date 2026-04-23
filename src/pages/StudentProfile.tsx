import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Phone, Mail, ClipboardList, Dumbbell, DollarSign, AlertTriangle } from "lucide-react";
import { students, payments, workouts, getPlanName, isInadimplente, isWorkoutExpired } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";

export default function StudentProfile() {
  const { id } = useParams();
  const student = students.find((s) => s.id === id);

  if (!student) {
    return (
      <div className="text-center text-muted-foreground">
        Aluno não encontrado. <Link to="/alunos" className="text-primary">Voltar</Link>
      </div>
    );
  }

  const overdue = isInadimplente(student.id);
  const noEval = student.evaluationStatus !== "Aprovada";
  const workoutExpired = isWorkoutExpired(student);
  const studentPayments = payments.filter((p) => p.studentId === student.id);
  const studentWorkout = workouts.find((w) => w.studentId === student.id && w.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/alunos" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Perfil do aluno</h1>
      </div>

      {/* Alerts */}
      {(noEval || overdue || workoutExpired) && (
        <div className="space-y-2">
          {noEval && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Bloqueado para treino</span>
              <span className="text-destructive/80">— {student.evaluationStatus}</span>
              <Link to={`/avaliacoes/nova/${student.id}`} className="ml-auto rounded-md bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90">
                Iniciar avaliação
              </Link>
            </div>
          )}
          {overdue && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" /> Inadimplente — há cobrança em atraso.
            </div>
          )}
          {workoutExpired && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" /> Ficha de treino vencida.
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Personal info */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground">
              {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <h2 className="mt-3 text-lg font-bold">{student.name}</h2>
            <p className="text-xs text-muted-foreground">{student.cpf}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              <StatusBadge variant={student.status === "Ativo" ? "success" : "muted"}>{student.status}</StatusBadge>
              <StatusBadge variant={noEval ? "destructive" : "success"}>{student.evaluationStatus}</StatusBadge>
            </div>
          </div>
          <div className="mt-5 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{student.email}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{student.phone}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Nasc. {new Date(student.birthDate).toLocaleDateString("pt-BR")}</div>
          </div>
        </div>

        {/* Plan + financial */}
        <div className="space-y-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Plano atual</p>
              <p className="mt-1 text-lg font-bold">{getPlanName(student.planId)}</p>
              <p className="text-xs text-muted-foreground">Vence em {new Date(student.dueDate).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Financeiro</p>
              <p className="mt-1 text-lg font-bold">{overdue ? "Em atraso" : "Em dia"}</p>
              <p className="text-xs text-muted-foreground">{studentPayments.length} cobrança(s) registrada(s)</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-primary" /> Avaliações físicas</h3>
              <Link to={`/avaliacoes/nova/${student.id}`} className="text-xs text-primary hover:underline">Nova avaliação</Link>
            </div>
            {student.evaluationStatus === "Aprovada" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                  <div>
                    <p className="font-medium">Avaliação inicial</p>
                    <p className="text-xs text-muted-foreground">15/01/2026 · CREF 0000-G/SP</p>
                  </div>
                  <StatusBadge variant="success">Aprovada</StatusBadge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold"><Dumbbell className="h-4 w-4 text-primary" /> Ficha de treino atual</h3>
              {!noEval && <Link to={`/fichas/nova/${student.id}`} className="text-xs text-primary hover:underline">Nova ficha</Link>}
            </div>
            {studentWorkout ? (
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{studentWorkout.name}</p>
                  <StatusBadge variant={workoutExpired ? "warning" : "success"}>
                    {workoutExpired ? "Vencida" : "Ativa"}
                  </StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground">{studentWorkout.divisions.length} divisões · {studentWorkout.divisions.reduce((acc, d) => acc + d.exercises.length, 0)} exercícios</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem ficha ativa.</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><DollarSign className="h-4 w-4 text-primary" /> Histórico financeiro</h3>
            {studentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lançamento.</p>
            ) : (
              <div className="space-y-2">
                {studentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                    <div>
                      <p className="font-medium">Mensalidade {p.monthRef}</p>
                      <p className="text-xs text-muted-foreground">Venc. {new Date(p.dueDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">R$ {p.amount.toFixed(2)}</span>
                      <StatusBadge variant={p.status === "Pago" ? "success" : p.status === "Atrasado" ? "destructive" : "warning"}>{p.status}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
