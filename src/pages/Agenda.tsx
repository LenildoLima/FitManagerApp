import { useEffect, useState } from "react";
import { Plus, Loader2, CalendarDays, Users, Clock, CheckCircle2, XCircle, CalendarCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AulaColetiva {
  id: string;
  modalidade: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  vagas_max: number;
  ativo: boolean;
  professor: { nome: string } | null;
}

interface AgendamentoPersonal {
  id: string;
  data: string;
  hora: string;
  status: string;
  observacoes: string | null;
  aluno: { nome: string } | null;
  professor: { nome: string } | null;
}

interface Perfil {
  id: string;
  nome: string;
}

interface Aluno {
  id: string;
  nome: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = [
  { value: "segunda", label: "Segunda" },
  { value: "terca",   label: "Terça" },
  { value: "quarta",  label: "Quarta" },
  { value: "quinta",  label: "Quinta" },
  { value: "sexta",   label: "Sexta" },
  { value: "sabado",  label: "Sábado" },
];

const DIA_LABEL: Record<string, string> = {
  segunda: "Segunda-feira",
  terca:   "Terça-feira",
  quarta:  "Quarta-feira",
  quinta:  "Quinta-feira",
  sexta:   "Sexta-feira",
  sabado:  "Sábado",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "info" | "destructive" }> = {
  agendado:  { label: "Agendado",  variant: "info" },
  realizado: { label: "Realizado", variant: "success" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Agenda() {
  // --- Coletivas ---
  const [aulas, setAulas] = useState<AulaColetiva[]>([]);
  const [loadingAulas, setLoadingAulas] = useState(true);
  const [modalAula, setModalAula] = useState(false);
  const [savingAula, setSavingAula] = useState(false);
  const [formAula, setFormAula] = useState({
    modalidade: "",
    dia_semana: "segunda",
    horario_inicio: "",
    horario_fim: "",
    professor_id: "",
    vagas_max: 20,
  });

  // --- Personal ---
  const [agendamentos, setAgendamentos] = useState<AgendamentoPersonal[]>([]);
  const [loadingAg, setLoadingAg] = useState(true);
  const [modalPersonal, setModalPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [formPersonal, setFormPersonal] = useState({
    aluno_id: "",
    professor_id: "",
    data: "",
    hora: "",
    observacoes: "",
  });

  // --- Shared lookup data ---
  const [professores, setProfessores] = useState<Perfil[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);

  useEffect(() => {
    fetchAulas();
    fetchAgendamentos();
    fetchProfessores();
    fetchAlunos();
  }, []);

  // ── Aulas Coletivas ──────────────────────────────────────────────────────────

  const fetchAulas = async () => {
    try {
      setLoadingAulas(true);
      const { data, error } = await supabase
        .from("aulas_coletivas")
        .select("*, professor:perfis(nome)")
        .eq("ativo", true)
        .order("dia_semana");
      if (error) throw error;
      setAulas(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar aulas: " + err.message);
    } finally {
      setLoadingAulas(false);
    }
  };

  const handleSaveAula = async () => {
    if (!formAula.modalidade || !formAula.horario_inicio || !formAula.horario_fim) {
      toast.error("Modalidade e horários são obrigatórios.");
      return;
    }
    try {
      setSavingAula(true);
      const { error } = await supabase.from("aulas_coletivas").insert({
        modalidade: formAula.modalidade,
        dia_semana: formAula.dia_semana,
        horario_inicio: formAula.horario_inicio,
        horario_fim: formAula.horario_fim,
        professor_id: formAula.professor_id || null,
        vagas_max: formAula.vagas_max,
        ativo: true,
      });
      if (error) throw error;
      toast.success("Aula criada com sucesso!");
      setModalAula(false);
      setFormAula({ modalidade: "", dia_semana: "segunda", horario_inicio: "", horario_fim: "", professor_id: "", vagas_max: 20 });
      fetchAulas();
    } catch (err: any) {
      toast.error("Erro ao salvar aula: " + err.message);
    } finally {
      setSavingAula(false);
    }
  };

  // ── Agendamentos Personal ────────────────────────────────────────────────────

  const fetchAgendamentos = async () => {
    try {
      setLoadingAg(true);
      const { data, error } = await supabase
        .from("agendamentos_personal")
        .select("*, aluno:alunos(nome), professor:perfis(nome)")
        .order("data", { ascending: false });
      if (error) throw error;
      setAgendamentos(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar agendamentos: " + err.message);
    } finally {
      setLoadingAg(false);
    }
  };

  const handleSavePersonal = async () => {
    if (!formPersonal.aluno_id || !formPersonal.data || !formPersonal.hora) {
      toast.error("Aluno, data e hora são obrigatórios.");
      return;
    }
    try {
      setSavingPersonal(true);
      const { error } = await supabase.from("agendamentos_personal").insert({
        aluno_id: formPersonal.aluno_id,
        professor_id: formPersonal.professor_id || null,
        data: formPersonal.data,
        hora: formPersonal.hora,
        observacoes: formPersonal.observacoes || null,
        status: "agendado",
      });
      if (error) throw error;
      toast.success("Agendamento criado!");
      setModalPersonal(false);
      setFormPersonal({ aluno_id: "", professor_id: "", data: "", hora: "", observacoes: "" });
      fetchAgendamentos();
    } catch (err: any) {
      toast.error("Erro ao salvar agendamento: " + err.message);
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "realizado" | "cancelado") => {
    try {
      const { error } = await supabase
        .from("agendamentos_personal")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Agendamento marcado como ${status}.`);
      fetchAgendamentos();
    } catch (err: any) {
      toast.error("Erro ao atualizar status: " + err.message);
    }
  };

  // ── Lookup data ──────────────────────────────────────────────────────────────

  const fetchProfessores = async () => {
    const { data } = await supabase.from("perfis").select("id, nome").eq("perfil", "professor");
    setProfessores(data || []);
  };

  const fetchAlunos = async () => {
    const { data } = await supabase.from("alunos").select("id, nome").eq("situacao", "ativo").order("nome");
    setAlunos(data || []);
  };

  // ── Grouped by day ───────────────────────────────────────────────────────────

  const aulasPorDia = DIAS_SEMANA.map((d) => ({
    ...d,
    aulas: aulas.filter((a) => a.dia_semana === d.value),
  }));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground">Gerencie aulas coletivas e sessões de Personal Trainer</p>
      </div>

      {/* ══ SEÇÃO 1: Aulas Coletivas ══════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Aulas Coletivas</h2>
          </div>
          <Button
            onClick={() => setModalAula(true)}
            className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nova aula
          </Button>
        </div>

        {loadingAulas ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {aulasPorDia.map((dia) => (
              <div key={dia.value} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Day header */}
                <div className="bg-primary/10 border-b border-border px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">{dia.label}</p>
                </div>
                {/* Classes */}
                <div className="p-2 space-y-2 min-h-[80px]">
                  {dia.aulas.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground/60">—</p>
                  ) : (
                    dia.aulas.map((aula) => (
                      <div
                        key={aula.id}
                        className="rounded-lg border border-border bg-secondary/30 p-2.5 space-y-1.5 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold leading-snug">{aula.modalidade}</p>
                          <StatusBadge variant="success">Ativa</StatusBadge>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          {aula.horario_inicio.slice(0, 5)} – {aula.horario_fim.slice(0, 5)}
                        </div>
                        {aula.professor && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            Prof. {aula.professor.nome}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3 shrink-0" />
                          {aula.vagas_max} vagas
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ══ SEÇÃO 2: Personal Trainer ════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Personal Trainer</h2>
          </div>
          <Button
            onClick={() => setModalPersonal(true)}
            className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Novo agendamento
          </Button>
        </div>

        {loadingAg ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
            <CalendarCheck className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhum agendamento cadastrado</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aluno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Professor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agendamentos.map((ag) => {
                  const cfg = STATUS_CONFIG[ag.status] ?? STATUS_CONFIG["agendado"];
                  const dataFmt = ag.data
                    ? new Date(ag.data + "T00:00:00").toLocaleDateString("pt-BR")
                    : "—";
                  return (
                    <tr key={ag.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{ag.aluno?.nome ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ag.professor?.nome ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{dataFmt}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ag.hora?.slice(0, 5) ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={cfg.variant}>{cfg.label}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        {ag.status === "agendado" && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleUpdateStatus(ag.id, "realizado")}
                              title="Marcar como Realizado"
                              className="rounded-md p-1.5 text-success hover:bg-success/10 transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(ag.id, "cancelado")}
                              title="Cancelar"
                              className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ══ MODAL: Nova Aula Coletiva ════════════════════════════════════════ */}
      <Dialog open={modalAula} onOpenChange={setModalAula}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nova Aula Coletiva</DialogTitle>
            <DialogDescription>Preencha os dados da aula para adicioná-la à grade semanal.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Modalidade</Label>
              <Input
                placeholder="Ex: Zumba, Spinning, Pilates..."
                value={formAula.modalidade}
                onChange={(e) => setFormAula({ ...formAula, modalidade: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Dia da Semana</Label>
              <select
                value={formAula.dia_semana}
                onChange={(e) => setFormAula({ ...formAula, dia_semana: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Horário Início</Label>
                <Input
                  type="time"
                  value={formAula.horario_inicio}
                  onChange={(e) => setFormAula({ ...formAula, horario_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Horário Fim</Label>
                <Input
                  type="time"
                  value={formAula.horario_fim}
                  onChange={(e) => setFormAula({ ...formAula, horario_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Professor Responsável</Label>
              <select
                value={formAula.professor_id}
                onChange={(e) => setFormAula({ ...formAula, professor_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Selecione —</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Vagas Máximas</Label>
              <Input
                type="number"
                min={1}
                value={formAula.vagas_max}
                onChange={(e) => setFormAula({ ...formAula, vagas_max: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalAula(false)} disabled={savingAula}>Cancelar</Button>
            <Button onClick={handleSaveAula} disabled={savingAula} className="bg-gradient-primary text-primary-foreground">
              {savingAula ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Salvar Aula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ MODAL: Novo Agendamento Personal ════════════════════════════════ */}
      <Dialog open={modalPersonal} onOpenChange={setModalPersonal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Novo Agendamento — Personal</DialogTitle>
            <DialogDescription>Agende uma sessão de Personal Trainer para um aluno.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Aluno</Label>
              <select
                value={formPersonal.aluno_id}
                onChange={(e) => setFormPersonal({ ...formPersonal, aluno_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Selecione —</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Professor</Label>
              <select
                value={formPersonal.professor_id}
                onChange={(e) => setFormPersonal({ ...formPersonal, professor_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Selecione —</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formPersonal.data}
                  onChange={(e) => setFormPersonal({ ...formPersonal, data: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={formPersonal.hora}
                  onChange={(e) => setFormPersonal({ ...formPersonal, hora: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <textarea
                value={formPersonal.observacoes}
                onChange={(e) => setFormPersonal({ ...formPersonal, observacoes: e.target.value })}
                rows={3}
                placeholder="Alguma observação sobre a sessão..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalPersonal(false)} disabled={savingPersonal}>Cancelar</Button>
            <Button onClick={handleSavePersonal} disabled={savingPersonal} className="bg-gradient-primary text-primary-foreground">
              {savingPersonal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Salvar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
