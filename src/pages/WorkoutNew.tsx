import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Search, Check } from "lucide-react";
import { exercises, students } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Row {
  exerciseId: string;
  sets: number;
  reps: string;
  load: string;
  rest: number;
  notes: string;
}

interface Division {
  letter: string;
  rows: Row[];
}

export default function WorkoutNew() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const student = students.find((s) => s.id === studentId);
  const [divisions, setDivisions] = useState<Division[]>([
    { letter: "A", rows: [] },
    { letter: "B", rows: [] },
  ]);
  const [search, setSearch] = useState("");

  if (!student) return <div>Aluno não encontrado.</div>;
  if (student.evaluationStatus !== "Aprovada") {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive">
        Este aluno não pode receber ficha — avaliação física pendente.
      </div>
    );
  }

  const filteredExercises = exercises.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.muscleGroup.toLowerCase().includes(search.toLowerCase())
  );

  const addDivision = () => {
    const next = String.fromCharCode("A".charCodeAt(0) + divisions.length);
    setDivisions([...divisions, { letter: next, rows: [] }]);
  };

  const addExercise = (divIdx: number, exerciseId: string) => {
    const updated = [...divisions];
    updated[divIdx].rows.push({ exerciseId, sets: 3, reps: "10-12", load: "", rest: 60, notes: "" });
    setDivisions(updated);
  };

  const updateRow = (divIdx: number, rowIdx: number, patch: Partial<Row>) => {
    const updated = [...divisions];
    updated[divIdx].rows[rowIdx] = { ...updated[divIdx].rows[rowIdx], ...patch };
    setDivisions(updated);
  };

  const removeRow = (divIdx: number, rowIdx: number) => {
    const updated = [...divisions];
    updated[divIdx].rows.splice(rowIdx, 1);
    setDivisions(updated);
  };

  const handleSave = () => {
    toast.success("Ficha de treino salva!");
    navigate(`/alunos/${student.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/fichas" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Ficha de Treino</h1>
          <p className="text-sm text-muted-foreground">{student.name}</p>
        </div>
      </div>

      {/* Header info */}
      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-4">
        <div className="space-y-1.5"><Label>Nome da ficha *</Label><Input placeholder="Ex: Hipertrofia AB" /></div>
        <div className="space-y-1.5">
          <Label>Objetivo</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hip">Hipertrofia</SelectItem>
              <SelectItem value="emag">Emagrecimento</SelectItem>
              <SelectItem value="cond">Condicionamento</SelectItem>
              <SelectItem value="forca">Força</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Nível</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ini">Iniciante</SelectItem>
              <SelectItem value="int">Intermediário</SelectItem>
              <SelectItem value="ava">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Validade</Label><Input type="date" /></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Divisions */}
        <div className="space-y-4">
          {divisions.map((div, divIdx) => (
            <div key={div.letter} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  Treino <span className="text-primary">{div.letter}</span>
                </h3>
                <span className="text-xs text-muted-foreground">{div.rows.length} exercícios</span>
              </div>

              {div.rows.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                  Use o banco de exercícios ao lado para adicionar.
                </div>
              ) : (
                <div className="space-y-2">
                  {div.rows.map((row, rowIdx) => {
                    const ex = exercises.find((e) => e.id === row.exerciseId);
                    return (
                      <div key={rowIdx} className="grid gap-2 rounded-lg border border-border bg-secondary/30 p-3 md:grid-cols-[1fr_70px_90px_90px_80px_36px]">
                        <div>
                          <p className="text-sm font-medium">{ex?.name}</p>
                          <p className="text-xs text-muted-foreground">{ex?.muscleGroup}</p>
                        </div>
                        <Input value={row.sets} onChange={(e) => updateRow(divIdx, rowIdx, { sets: Number(e.target.value) })} placeholder="Séries" />
                        <Input value={row.reps} onChange={(e) => updateRow(divIdx, rowIdx, { reps: e.target.value })} placeholder="Reps" />
                        <Input value={row.load} onChange={(e) => updateRow(divIdx, rowIdx, { load: e.target.value })} placeholder="Carga" />
                        <Input value={row.rest} onChange={(e) => updateRow(divIdx, rowIdx, { rest: Number(e.target.value) })} placeholder="Desc." />
                        <button
                          onClick={() => removeRow(divIdx, rowIdx)}
                          className="flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <Button onClick={addDivision} variant="outline" className="w-full border-dashed">
            <Plus className="mr-2 h-4 w-4" /> Adicionar divisão ({String.fromCharCode("A".charCodeAt(0) + divisions.length)})
          </Button>
        </div>

        {/* Exercise bank */}
        <div className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-20 lg:self-start">
          <h3 className="mb-2 text-sm font-semibold">Banco de exercícios</h3>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-md border border-border bg-secondary/40 py-1.5 pl-9 pr-3 text-sm focus:border-primary/60 focus:outline-none"
            />
          </div>
          <div className="max-h-[480px] space-y-1.5 overflow-y-auto pr-1">
            {filteredExercises.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{ex.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{ex.muscleGroup}</p>
                </div>
                <Select onValueChange={(v) => addExercise(Number(v), ex.id)}>
                  <SelectTrigger className="h-7 w-[60px] text-xs"><SelectValue placeholder="+" /></SelectTrigger>
                  <SelectContent>
                    {divisions.map((d, i) => (
                      <SelectItem key={d.letter} value={String(i)}>{d.letter}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Check className="mr-2 h-4 w-4" /> Salvar ficha
        </Button>
      </div>
    </div>
  );
}
