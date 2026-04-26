import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, AlertTriangle, Upload } from "lucide-react";
import { calculateBMI, bmiClassification } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { useAlunos } from "@/hooks/useAlunos";
import { useAvaliacoes } from "@/hooks/useAvaliacoes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

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
  const { alunos, loading: loadingAlunos } = useAlunos();
  const { user } = useAuth();
  
  const student = alunos.find((s) => s.id === studentId);

  const [step, setStep] = useState(0);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [diseases, setDiseases] = useState<string[]>([]);
  
  const toggleObjetivo = (valor: string) => {
    setObjectives((prev) => {
      const novo = prev.includes(valor) ? prev.filter((o) => o !== valor) : [...prev, valor];
      console.log('objetivos atualizados:', novo);
      return novo;
    });
  };

  const toggleDisease = (valor: string) => {
    setDiseases((prev) => {
      const novo = prev.includes(valor) ? prev.filter((o) => o !== valor) : [...prev, valor];
      console.log('doenças atualizadas:', novo);
      return novo;
    });
  };
  const [gestante, setGestante] = useState<boolean | null>(null);
  const [parq, setParq] = useState<(boolean | null)[]>(Array(7).fill(null));
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [cref, setCref] = useState("");
  const [level, setLevel] = useState("");
  const [proximaAvaliacao, setProximaAvaliacao] = useState("");
  const [restricoes, setRestricoes] = useState("");
  const [parecer, setParecer] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [dobras, setDobras] = useState<Record<string, number | "">>({});
  
  const [circs, setCircs] = useState<Record<string, number | "">>({});
  const [paSistolica, setPaSistolica] = useState<number | "">("");
  const [paDiastolica, setPaDiastolica] = useState<number | "">("");
  const [fcRepouso, setFcRepouso] = useState<number | "">("");
  const [testesFisicos, setTestesFisicos] = useState({
    wells_resultado_cm: "",
    abdominal_1min: "",
    flexoes_1min: "",
    step_fc_pos_teste: "",
    observacoes: ""
  });
  
  const [anamnese, setAnamnese] = useState({
    atividade_anterior: "",
    quando_parou: "",
    doencas_outras: "",
    medicamentos: "",
    suplementos: "",
    lesoes: "",
    alergias: "",
    tabagismo: "",
    alcool: "",
    sono: "",
    ocupacao: "",
    regime: ""
  });

  const parqAnyYes = parq.some((p) => p === true);
  const parqAllAnswered = parq.every((p) => p !== null);

  const bmi = useMemo(() => {
    if (!weight || !height) return null;
    return calculateBMI(Number(weight), Number(height));
  }, [weight, height]);
  const bmiInfo = bmi ? bmiClassification(bmi) : null;

  const dobrasRequired = useMemo(() => {
    if (!protocolo) return [];
    if (protocolo === "p3" || protocolo === "jp") {
      return student?.sexo_biologico === "feminino" 
        ? ["Tríceps", "Supra-ilíaca", "Coxa"]
        : ["Peitoral", "Abdômen", "Coxa"];
    }
    if (protocolo === "p7") {
      return ["Peitoral", "Axilar média", "Tríceps", "Subescapular", "Abdominal", "Supra-ilíaca", "Coxa"];
    }
    return [];
  }, [protocolo, student?.sexo_biologico]);

  const calcPercGordura = useMemo(() => {
    if (!protocolo || dobrasRequired.length === 0) return null;
    
    const allFilled = dobrasRequired.every(d => dobras[d] !== undefined && dobras[d] !== "");
    if (!allFilled) return null;
    
    const soma = dobrasRequired.reduce((acc, d) => acc + Number(dobras[d]), 0);
    
    let idade = 30;
    if (student?.data_nascimento) {
       idade = new Date().getFullYear() - new Date(student.data_nascimento).getFullYear();
    }
    
    if (protocolo === "p3" || protocolo === "jp") {
      let densidade = 0;
      if (student?.sexo_biologico === "feminino") {
        densidade = 1.0994921 - (0.0009929 * soma) + (0.0000023 * Math.pow(soma, 2)) - (0.0001392 * idade);
      } else {
        densidade = 1.1093800 - (0.0008267 * soma) + (0.0000016 * Math.pow(soma, 2)) - (0.0002574 * idade);
      }
      return ((4.95 / densidade) - 4.50) * 100;
    }
    
    if (protocolo === "p7") {
       let densidade = 0;
       if (student?.sexo_biologico === "feminino") {
          densidade = 1.0970 - (0.00046971 * soma) + (0.00000056 * Math.pow(soma, 2)) - (0.00012828 * idade);
       } else {
          densidade = 1.112 - (0.00043499 * soma) + (0.00000055 * Math.pow(soma, 2)) - (0.00028826 * idade);
       }
       return ((4.95 / densidade) - 4.50) * 100;
    }

    return null;
  }, [protocolo, dobras, dobrasRequired, student]);

  const massaGorda = useMemo(() => {
    if (calcPercGordura !== null && weight !== "") {
      return (Number(weight) * (calcPercGordura / 100));
    }
    return null;
  }, [calcPercGordura, weight]);

  const massaMagra = useMemo(() => {
    if (massaGorda !== null && weight !== "") {
      return Number(weight) - massaGorda;
    }
    return null;
  }, [massaGorda, weight]);

  if (loadingAlunos) return <div className="flex h-[80vh] items-center justify-center">Carregando...</div>;
  if (!student) return <div className="p-10 text-center">Aluno não encontrado.</div>;

  const handleSaveFlow = async (statusFinal: 'aprovada' | 'aguardando_laudo') => {
    console.log('=== SAVE INICIADO ===')
    console.log('objectives no momento do save:', objectives)
    console.log('diseases no momento do save:', diseases)

    if (!cref.trim() && statusFinal === 'aprovada') {
      toast.error("CREF do profissional é obrigatório.");
      return;
    }
    if (parqAnyYes && statusFinal === 'aprovada') {
      toast.error("PAR-Q exige laudo médico antes da liberação.");
      return;
    }

    try {
      // PASSO 1
      const { data: avaliacaoArr, error: errorAvaliacao } = await supabase
        .from('avaliacoes_fisicas')
        .insert({
          aluno_id: student.id,
          professor_id: user?.id || null, // Assuming user ID could be fetched from Auth if available
          cref: cref || null,
          status: statusFinal,
          data_avaliacao: new Date().toISOString().split('T')[0],
          proxima_avaliacao: proximaAvaliacao || null,
          nivel_condicionamento: level || 'iniciante',
          parecer: parecer || null,
          restricoes: restricoes || null,
        })
        .select();
      
      if (errorAvaliacao) throw errorAvaliacao;
      if (!avaliacaoArr || avaliacaoArr.length === 0) {
        throw new Error("Supabase bloqueou o retorno do ID (RLS Policy). Verifique se INSERT na tabela avaliacoes_fisicas está liberado para SELECT pelo professor.");
      }
      const avaliacaoId = avaliacaoArr[0].id;

      console.log('objetivos antes de salvar (pós-await):', objectives);
      console.log('medidas antes de salvar:', { circs, paSistolica, paDiastolica, fcRepouso });
      console.log('testes antes de salvar:', testesFisicos);

      // PASSO 2
      const { error: errorAn } = await supabase.from('anamnese').insert({
        avaliacao_id: avaliacaoId,
        objetivos: objectives.length > 0 ? objectives : [],
        praticou_antes: !!anamnese.atividade_anterior,
        atividade_anterior: anamnese.atividade_anterior || null,
        tempo_afastamento: anamnese.quando_parou || null,
        doencas: diseases || [],
        doencas_outras: anamnese.doencas_outras || null,
        usa_medicamentos: !!anamnese.medicamentos,
        medicamentos_desc: anamnese.medicamentos || null,
        usa_suplementos: !!anamnese.suplementos,
        suplementos_desc: anamnese.suplementos || null,
        tem_lesoes: !!anamnese.lesoes,
        lesoes_desc: anamnese.lesoes || null,
        tabagismo: anamnese.tabagismo || null,
        alcool: anamnese.alcool || null,
        qualidade_sono: anamnese.sono || null,
        ocupacao: anamnese.ocupacao || null,
        regime_alimentar: anamnese.regime || null,
        alergias_alimentares: anamnese.alergias || null,
        gestante_ou_pos_parto: gestante,
      });
      if (errorAn) throw errorAn;

      // PASSO 3
      const { error: errorParq } = await supabase.from('parq').insert({
        avaliacao_id: avaliacaoId,
        q1: parq[0] || false,
        q2: parq[1] || false,
        q3: parq[2] || false,
        q4: parq[3] || false,
        q5: parq[4] || false,
        q6: parq[5] || false,
        q7: parq[6] || false,
      });
      if (errorParq) throw errorParq;

      // PASSO 4
      const { error: errorMed } = await supabase.from('medidas_antropometricas').insert({
        avaliacao_id: avaliacaoId,
        peso_kg: Number(weight) || null,
        altura_cm: Number(height) || null,
        circ_cintura: circs["Cintura"] || null,
        circ_quadril: circs["Quadril"] || null,
        circ_braco_d_rel: circs["Braço D relax."] || null,
        circ_braco_d_cont: circs["Braço D contr."] || null,
        circ_braco_e_rel: circs["Braço E relax."] || null,
        circ_braco_e_cont: circs["Braço E contr."] || null,
        circ_antebraco: circs["Antebraço"] || null,
        circ_coxa_d: circs["Coxa D"] || null,
        circ_coxa_e: circs["Coxa E"] || null,
        circ_panturrilha_d: circs["Panturrilha D"] || null,
        circ_panturrilha_e: circs["Panturrilha E"] || null,
        circ_torax: circs["Tórax"] || null,
        circ_pescoco: circs["Pescoço"] || null,
        protocolo_gordura: protocolo || null,
        perc_gordura: calcPercGordura || null,
        massa_gorda_kg: massaGorda || null,
        massa_magra_kg: massaMagra || null,
        pressao_sistolica: Number(paSistolica) || null,
        pressao_diastolica: Number(paDiastolica) || null,
        fc_repouso: Number(fcRepouso) || null,
      });
      if (errorMed) throw errorMed;

      // PASSO 5
      const { error: errorTes } = await supabase.from('testes_fisicos').insert({
        avaliacao_id: avaliacaoId,
        wells_resultado_cm: Number(testesFisicos.wells_resultado_cm) || null,
        abdominal_1min: Number(testesFisicos.abdominal_1min) || null,
        flexoes_1min: Number(testesFisicos.flexoes_1min) || null,
        step_fc_pos_teste: Number(testesFisicos.step_fc_pos_teste) || null,
        observacoes: testesFisicos.observacoes || null,
      });
      if (errorTes) throw errorTes;

      toast.success(statusFinal === 'aprovada' ? `${student.nome} foi liberado(a) para treino!` : `Avaliação aguardando laudo para ${student.nome}.`);
      navigate(`/alunos/${student.id}`);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar avaliação: " + error.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/avaliacoes" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliação Física</h1>
          <p className="text-sm text-muted-foreground">{student.nome}</p>
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
              <div className="flex flex-wrap gap-2">
                {OBJECTIVES.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleObjetivo(opt)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-smooth ${
                      objectives.includes(opt) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Já praticou atividade física?</Label><Input placeholder="Modalidade, tempo..." value={anamnese.atividade_anterior} onChange={e => setAnamnese({...anamnese, atividade_anterior: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Quando parou?</Label><Input placeholder="Há quanto tempo" value={anamnese.quando_parou} onChange={e => setAnamnese({...anamnese, quando_parou: e.target.value})} /></div>
            </div>

            <div className="space-y-2">
              <Label>Doenças pré-existentes</Label>
              <div className="flex flex-wrap gap-2">
                {DISEASES.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleDisease(opt)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-smooth ${
                      diseases.includes(opt) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Input placeholder="Outras doenças (descreva)" className="mt-2" value={anamnese.doencas_outras} onChange={e => setAnamnese({...anamnese, doencas_outras: e.target.value})} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Medicamentos contínuos</Label><Input placeholder="Nome e dosagem" value={anamnese.medicamentos} onChange={e => setAnamnese({...anamnese, medicamentos: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Suplementos em uso</Label><Input placeholder="Quais?" value={anamnese.suplementos} onChange={e => setAnamnese({...anamnese, suplementos: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Cirurgias / lesões</Label><Input placeholder="Descrição" value={anamnese.lesoes} onChange={e => setAnamnese({...anamnese, lesoes: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Alergias alimentares</Label><Input value={anamnese.alergias} onChange={e => setAnamnese({...anamnese, alergias: e.target.value})} /></div>
              <div className="space-y-1.5">
                <Label>Tabagismo</Label>
                <Select value={anamnese.tabagismo} onValueChange={v => setAnamnese({...anamnese, tabagismo: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="ex">Ex-fumante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Consumo de álcool</Label>
                <Select value={anamnese.alcool} onValueChange={v => setAnamnese({...anamnese, alcool: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="ev">Eventual</SelectItem>
                    <SelectItem value="freq">Frequente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Qualidade do sono</Label>
                <Select value={anamnese.sono} onValueChange={v => setAnamnese({...anamnese, sono: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boa">Boa</SelectItem>
                    <SelectItem value="reg">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Ocupação profissional</Label><Input value={anamnese.ocupacao} onChange={e => setAnamnese({...anamnese, ocupacao: e.target.value})} /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Regime alimentar</Label><Textarea rows={2} value={anamnese.regime} onChange={e => setAnamnese({...anamnese, regime: e.target.value})} /></div>
            </div>

            {student.sexo_biologico === "feminino" && (
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <Label>Gestante ou pós-parto recente?</Label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGestante(true)}
                    className={`rounded-md border px-4 py-1.5 text-xs font-semibold transition-smooth ${
                      gestante === true
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setGestante(false)}
                    className={`rounded-md border px-4 py-1.5 text-xs font-semibold transition-smooth ${
                      gestante === false
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Não
                  </button>
                </div>
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
                  <div key={c} className="space-y-1">
                    <Label className="text-xs">{c}</Label>
                    <Input 
                      type="number" 
                      value={circs[c] ?? ""}
                      onChange={(e) => setCircs({ ...circs, [c]: e.target.value === "" ? "" : Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">% Gordura e Dobras Cutâneas</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Protocolo</Label>
                  <Select value={protocolo} onValueChange={(v) => { setProtocolo(v); setDobras({}); }}>
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
                  <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 font-semibold">
                    {calcPercGordura !== null ? (
                      <span className="text-primary">{calcPercGordura.toFixed(2)}%</span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-normal">— Preencha as dobras</span>
                    )}
                  </div>
                </div>
              </div>

              {dobrasRequired.length > 0 && (
                <div className="mt-4">
                   <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Dobras (mm)</h4>
                   <div className="grid gap-3 md:grid-cols-4">
                     {dobrasRequired.map(d => (
                        <div key={d} className="space-y-1">
                           <Label className="text-xs">{d}</Label>
                           <div className="relative">
                             <Input 
                               type="number" 
                               value={dobras[d] ?? ""} 
                               onChange={e => setDobras({...dobras, [d]: e.target.value === "" ? "" : Number(e.target.value)})}
                               className="pr-8 text-sm"
                             />
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mm</span>
                           </div>
                        </div>
                     ))}
                   </div>
                </div>
              )}

              {calcPercGordura !== null && massaGorda !== null && massaMagra !== null && (
                 <div className="mt-4 grid gap-4 md:grid-cols-2">
                   <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Massa Gorda</p>
                      <p className="text-lg font-semibold">{massaGorda.toFixed(1)} <span className="text-sm font-normal">kg</span></p>
                   </div>
                   <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Massa Magra</p>
                      <p className="text-lg font-semibold">{massaMagra.toFixed(1)} <span className="text-sm font-normal">kg</span></p>
                   </div>
                 </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5"><Label>PA Sistólica (mmHg)</Label><Input type="number" value={paSistolica} onChange={e => setPaSistolica(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>PA Diastólica (mmHg)</Label><Input type="number" value={paDiastolica} onChange={e => setPaDiastolica(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label>FC repouso (bpm)</Label><Input type="number" value={fcRepouso} onChange={e => setFcRepouso(e.target.value === "" ? "" : Number(e.target.value))} /></div>
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
              <div className="space-y-1.5"><Label>Banco de Wells (cm)</Label><Input type="number" value={testesFisicos.wells_resultado_cm} onChange={e => setTestesFisicos({...testesFisicos, wells_resultado_cm: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Resistência abdominal (1 min)</Label><Input type="number" value={testesFisicos.abdominal_1min} onChange={e => setTestesFisicos({...testesFisicos, abdominal_1min: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>Flexões (1 min)</Label><Input type="number" value={testesFisicos.flexoes_1min} onChange={e => setTestesFisicos({...testesFisicos, flexoes_1min: e.target.value})} /></div>
              <div className="space-y-1.5"><Label>FC após Step Test (bpm)</Label><Input type="number" value={testesFisicos.step_fc_pos_teste} onChange={e => setTestesFisicos({...testesFisicos, step_fc_pos_teste: e.target.value})} /></div>
            </div>
            <div className="space-y-1.5"><Label>Observações do avaliador</Label><Textarea rows={3} value={testesFisicos.observacoes} onChange={e => setTestesFisicos({...testesFisicos, observacoes: e.target.value})} /></div>
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
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Próxima avaliação</Label>
                <Input type="date" value={proximaAvaliacao} onChange={(e) => setProximaAvaliacao(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Observações e restrições</Label>
                <Textarea rows={3} value={restricoes} onChange={(e) => setRestricoes(e.target.value)} placeholder="Ex: Evitar exercícios de alto impacto..." />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Parecer do avaliador</Label>
                <Textarea rows={3} value={parecer} onChange={(e) => setParecer(e.target.value)} placeholder="Resumo do condicionamento físico..." />
              </div>
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
                onClick={() => handleSaveFlow('aprovada')}
                disabled={parqAnyYes}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                <Check className="mr-2 h-4 w-4" /> Aprovar e liberar para treino
              </Button>
              <Button onClick={() => handleSaveFlow('aguardando_laudo')} variant="outline" className="border-warning/40 text-warning hover:bg-warning/10">
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
