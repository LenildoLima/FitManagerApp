import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle, Upload } from "lucide-react";
import { students, calculateBMI, bmiClassification } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

const STEPS = ["Anamnese", "PAR-Q", "Antropometria", "Testes Físicos", "Parecer"];

const PARQ_QUESTIONS = [
  "Algum médico já disse que você possui algum problema cardíaco e recomendou atividade física supervisionada?",
  "Você sente dor no peito quando pratica atividade física?",
  "Você teve dor no peito no último mês, mesmo sem praticar atividade física?",
  "Você já perdeu o equilíbrio por tontura ou já desmaiou?",
  "Você tem algum problema ósseo ou articular que pode piorar com a prática de atividade física?",
  "Algum médico já recomendou uso de medicamentos para pressão arterial ou problema cardíaco?",
  "Você tem conhecimento de qualquer outra razão pela qual não deveria praticar atividade física?",
];

const OBJECTIVES = ["Perda de peso", "Ganho de massa", "Condicionamento", "Reabilitação", "Bem-estar", "Performance"];
const DISEASES = ["Diabetes", "Hipertensão", "Cardiopatia", "Osteoporose", "Artrite", "Asma", "Hipotireoidismo"];

function CheckGroup({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-smooth ${
              active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[
        { v: true, l: "Sim", c: "destructive" },
        { v: false, l: "Não", c: "success" },
      ].map((o) => (
        <button
          key={o.l}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-smooth border ${
            value === o.v
              ? o.v
                ? "border-destructive bg-destructive/15 text-destructive"
                : "border-success bg-success/15 text-success"
              : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export default function EvaluationNew() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const student = students.find((s) => s.id === studentId);

  const [step, setStep] = useState(0);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [parq, setParq] = useState<(boolean | null)[]>(Array(7).fill(null));
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [cref, setCref] = useState("");
  const [level, setLevel] = useState("");

  const parqAnyYes = parq.some((p) => p === true);
  const parqAllAnswered = parq.every((p) => p !== null);

  const bmi = useMemo(() => {
    if (!weight || !height) return null;
    return calculateBMI(Number(weight), Number(height));
  }, [weight, height]);
  const bmiInfo = bmi ? bmiClassification(bmi) : null;

  if (!student) return <div>Aluno não encontrado.</div>;

  const handleApprove = () => {
    if (!cref.trim()) {
      toast.error("CREF do profissional é obrigatório.");
      return;
    }
    if (parqAnyYes) {
      toast.error("PAR-Q exige laudo médico antes da liberação.");
      return;
    }
    toast.success(`${student.name} foi liberado(a) para treino!`);
    navigate(`/alunos/${student.id}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/avaliacoes" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliação Física</h1>
          <p className="text-sm text-muted-foreground">{student.name}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-smooth ${
              i === step
                ? "border-primary bg-primary/10 text-primary"
                : i < step
                ? "border-success/40 bg-success/5 text-success"
                : "border-border bg-secondary/30 text-muted-foreground"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-success text-success-foreground" : "bg-secondary"
            }`}>
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        {/* Step 1: Anamnese */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Anamnese</h2>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <CheckGroup options={OBJECTIVES} value={objectives} onChange={setObjectives} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Já praticou atividade física?</Label><Input placeholder="Modalidade, tempo..." /></div>
              <div className="space-y-1.5"><Label>Quando parou?</Label><Input placeholder="Há quanto tempo" /></div>
            </div>

            <div className="space-y-2">
              <Label>Doenças pré-existentes</Label>
              <CheckGroup options={DISEASES} value={diseases} onChange={setDiseases} />
              <Input placeholder="Outras doenças (descreva)" className="mt-2" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Medicamentos contínuos</Label><Input placeholder="Nome e dosagem" /></div>
              <div className="space-y-1.5"><Label>Suplementos em uso</Label><Input placeholder="Quais?" /></div>
              <div className="space-y-1.5"><Label>Cirurgias / lesões</Label><Input placeholder="Descrição" /></div>
              <div className="space-y-1.5"><Label>Alergias alimentares</Label><Input /></div>
              <div className="space-y-1.5">
                <Label>Tabagismo</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="ex">Ex-fumante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Consumo de álcool</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="ev">Eventual</SelectItem>
                    <SelectItem value="freq">Frequente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Qualidade do sono</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boa">Boa</SelectItem>
                    <SelectItem value="reg">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Ocupação profissional</Label><Input /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Regime alimentar</Label><Textarea rows={2} /></div>
            </div>

            {student.sex === "Feminino" && (
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <Label>Gestante ou pós-parto recente?</Label>
                <div className="mt-2"><YesNo value={null} onChange={() => {}} /></div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: PAR-Q */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">PAR-Q — Prontidão para Atividade Física</h2>
            <div className="space-y-3">
              {PARQ_QUESTIONS.map((q, i) => (
                <div key={i} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="flex-1 text-sm"><span className="mr-2 font-bold text-primary">{i + 1}.</span>{q}</p>
                  <YesNo value={parq[i]} onChange={(v) => setParq(parq.map((p, idx) => (idx === i ? v : p)))} />
                </div>
              ))}
            </div>

            {parqAllAnswered && !parqAnyYes && (
              <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-success">
                <Check className="h-4 w-4" /> PAR-Q aprovado. Pode prosseguir.
              </div>
            )}
            {parqAnyYes && (
              <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                  <AlertTriangle className="h-4 w-4" /> É necessário apresentar laudo médico antes de iniciar os treinos.
                </div>
                <div className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-warning/40 bg-background/50 text-sm text-warning">
                  <Upload className="h-4 w-4" /> Enviar laudo médico (PDF)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Anthropometry */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Medidas Antropométricas</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5"><Label>Peso (kg)</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>Altura (cm)</Label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div className="space-y-1.5">
                <Label>IMC</Label>
                <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-secondary/40 px-3">
                  {bmi ? (
                    <>
                      <span className="font-bold">{bmi.toFixed(1)}</span>
                      <StatusBadge variant={bmiInfo!.color as any}>{bmiInfo!.label}</StatusBadge>
                    </>
                  ) : <span className="text-xs text-muted-foreground">— Preencha peso e altura</span>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Circunferências (cm)</h3>
              <div className="grid gap-3 md:grid-cols-4">
                {["Cintura", "Quadril", "Braço D relax.", "Braço D contr.", "Braço E relax.", "Braço E contr.", "Antebraço", "Coxa D", "Coxa E", "Panturrilha D", "Panturrilha E", "Tórax", "Pescoço"].map((c) => (
                  <div key={c} className="space-y-1"><Label className="text-xs">{c}</Label><Input type="number" /></div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">% Gordura</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Protocolo</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione protocolo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p3">Pollock 3 dobras</SelectItem>
                      <SelectItem value="p7">Pollock 7 dobras</SelectItem>
                      <SelectItem value="jp">Jackson & Pollock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>% Gordura calculado</Label>
                  <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-xs text-muted-foreground">— Preencha as dobras</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5"><Label>PA Sistólica (mmHg)</Label><Input type="number" /></div>
              <div className="space-y-1.5"><Label>PA Diastólica (mmHg)</Label><Input type="number" /></div>
              <div className="space-y-1.5"><Label>FC repouso (bpm)</Label><Input type="number" /></div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Fotos posturais</h3>
              <div className="grid gap-3 md:grid-cols-4">
                {["Frente", "Perfil dir.", "Perfil esq.", "Costas"].map((p) => (
                  <div key={p} className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-secondary/20 text-xs text-muted-foreground hover:border-primary/40">
                    <Upload className="h-4 w-4" />{p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Tests */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Testes de Capacidade Física</h2>
            <p className="text-xs text-muted-foreground">Todos os testes são opcionais.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Banco de Wells (cm)</Label><Input type="number" /></div>
              <div className="space-y-1.5"><Label>Resistência abdominal (1 min)</Label><Input type="number" /></div>
              <div className="space-y-1.5"><Label>Flexões (1 min)</Label><Input type="number" /></div>
              <div className="space-y-1.5"><Label>FC após Step Test (bpm)</Label><Input type="number" /></div>
            </div>
            <div className="space-y-1.5"><Label>Observações do avaliador</Label><Textarea rows={3} /></div>
          </div>
        )}

        {/* Step 5: Parecer */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">Parecer e Liberação</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nível de condicionamento</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ini">Iniciante</SelectItem>
                    <SelectItem value="int">Intermediário</SelectItem>
                    <SelectItem value="ava">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Próxima avaliação</Label><Input type="date" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Observações e restrições</Label><Textarea rows={3} /></div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>CREF do profissional responsável *</Label>
                <Input value={cref} onChange={(e) => setCref(e.target.value)} placeholder="Ex: 000000-G/SP" />
              </div>
            </div>

            {parqAnyYes && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                <AlertTriangle className="h-4 w-4" /> PAR-Q indicou risco — liberação só após laudo médico.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleApprove}
                disabled={parqAnyYes}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                <Check className="mr-2 h-4 w-4" /> Aprovar e liberar para treino
              </Button>
              <Button variant="outline" className="border-warning/40 text-warning hover:bg-warning/10">
                <AlertTriangle className="mr-2 h-4 w-4" /> Aguardar laudo médico
              </Button>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="mt-6 flex justify-between border-t border-border pt-5">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Voltar</Button>
          {step < 4 && (
            <Button onClick={() => setStep(step + 1)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Próximo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
