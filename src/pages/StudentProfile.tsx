import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Phone, Mail, ClipboardList, Dumbbell, DollarSign, AlertTriangle, Printer } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useAlunos } from "@/hooks/useAlunos";
import { useCobrancas } from "@/hooks/useCobrancas";
import { useAvaliacoes } from "@/hooks/useAvaliacoes";
import { Button } from "@/components/ui/button";
import { gerarContrato } from "@/utils/gerarContrato";
import { formatarCPF, formatarTelefone, formatarMoeda } from "@/utils/formatters";

export default function StudentProfile() {
  const { id } = useParams();
  const { alunos, loading: loadingAlunos } = useAlunos();
  const { cobrancas, loading: loadingCobrancas } = useCobrancas(id);
  const { avaliacoes, loading: loadingAvaliacoes } = useAvaliacoes(id);

  const student = alunos.find((s) => s.id === id);

  if (loadingAlunos || loadingCobrancas || loadingAvaliacoes) {
    return <div className="flex h-[80vh] items-center justify-center">Carregando...</div>;
  }

  if (!student) {
    return (
      <div className="text-center text-muted-foreground p-10">
        Aluno não encontrado. <Link to="/alunos" className="text-primary hover:underline">Voltar</Link>
      </div>
    );
  }

  const overdue = cobrancas.some((p) => p.status === "atrasado");
  const noEval = avaliacoes.length === 0;
  const workoutExpired = false; // Ajustar quando houver hook de fichas
  const studentPayments = cobrancas;
  const studentWorkout = null; // Ajustar quando houver hook de fichas

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/alunos" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Perfil do aluno</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-primary text-primary hover:bg-primary/5"
          onClick={() => student.plano && gerarContrato(student, student.plano)}
        >
          <Printer className="h-4 w-4" />
          Reimprimir contrato
        </Button>
      </div>

      {/* Alerts */}
      {(noEval || overdue || workoutExpired) && (
        <div className="space-y-2">
          {noEval && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Bloqueado para treino</span>
              <span className="text-destructive/80">— Nenhuma avaliação encontrada</span>
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
              {student.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <h2 className="mt-3 text-lg font-bold">{student.nome}</h2>
            <p className="text-xs text-muted-foreground">{formatarCPF(student.cpf)}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              <StatusBadge variant={student.status === "ativo" ? "success" : "muted"}>{student.status}</StatusBadge>
              <StatusBadge variant={noEval ? "destructive" : "success"}>{noEval ? "Sem avaliação" : "Avaliado"}</StatusBadge>
            </div>
          </div>
          <div className="mt-5 space-y-2.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{student.email || 'N/A'}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{formatarTelefone(student.celular || student.telefone || '')}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Nasc. {student.data_nascimento ? new Date(student.data_nascimento).toLocaleDateString("pt-BR") : 'N/A'}</div>
          </div>
        </div>

        {/* Plan + financial */}
        <div className="space-y-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Plano atual</p>
              <p className="mt-1 text-lg font-bold">{student.plano?.nome || 'Nenhum'}</p>
              <p className="text-xs text-muted-foreground">Vence em {student.data_vencimento_plano ? new Date(student.data_vencimento_plano).toLocaleDateString("pt-BR") : '-'}</p>
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
            {avaliacoes.length > 0 ? (
              <div className="space-y-2">
                {avaliacoes.map((av) => (
                  <div key={av.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 text-sm">
                    <div>
                      <p className="font-medium">Avaliação em {new Date(av.data_avaliacao).toLocaleDateString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">CREF: {av.cref || 'N/A'}</p>
                    </div>
                    <StatusBadge variant={av.status === 'aprovada' ? "success" : "warning"}>{av.status}</StatusBadge>
                  </div>
                ))}
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
            <p className="text-sm text-muted-foreground">Funcionalidade de fichas será integrada em breve.</p>
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
                      <p className="font-medium">Mensalidade {p.mes_referencia}</p>
                      <p className="text-xs text-muted-foreground">Venc. {new Date(p.vencimento).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatarMoeda(p.valor)}</span>
                      <StatusBadge variant={p.status === "pago" ? "success" : p.status === "atrasado" ? "destructive" : "warning"}>{p.status}</StatusBadge>
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
