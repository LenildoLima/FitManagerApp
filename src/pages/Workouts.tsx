import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Lock, Dumbbell, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useAlunos } from "@/hooks/useAlunos";
import { useFichasTreino } from "@/hooks/useFichasTreino";
import { supabase } from "@/lib/supabase";

export default function Workouts() {
  const { alunos, loading: loadingAlunos } = useAlunos();
  const { fichas, loading: loadingFichas } = useFichasTreino();
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(true);

  useEffect(() => {
    async function fetchAvaliacoes() {
      try {
        const { data } = await supabase
          .from('avaliacoes_fisicas')
          .select('aluno_id, status')
          .eq('status', 'aprovada');
        setAvaliacoes(data || []);
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
      } finally {
        setLoadingAvaliacoes(false);
      }
    }
    fetchAvaliacoes();
  }, []);

  if (loadingAlunos || loadingFichas || loadingAvaliacoes) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando fichas e alunos...</p>
      </div>
    );
  }

  if (alunos.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Dumbbell className="h-12 w-12 text-muted-foreground/20" />
        <p className="text-lg font-medium">Nenhum aluno cadastrado ainda.</p>
        <Link to="/alunos/novo" className="text-sm text-primary hover:underline">Cadastrar primeiro aluno</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fichas de Treino</h1>
        <p className="text-sm text-muted-foreground">Selecione um aluno aprovado para criar ou editar a ficha.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {alunos.map((s) => {
          const temAvaliacaoAprovada = avaliacoes.some(av => av.aluno_id === s.id);
          const fichaAtiva = fichas.find(f => f.aluno_id === s.id);
          
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 transition-smooth hover:border-primary/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {s.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{s.nome}</p>
                  {fichaAtiva ? (
                    <p className="truncate text-xs text-muted-foreground">{fichaAtiva.nome}</p>
                  ) : temAvaliacaoAprovada ? (
                    <p className="text-xs text-muted-foreground">Sem ficha ativa</p>
                  ) : (
                    <StatusBadge variant="destructive">Bloqueado — sem avaliação</StatusBadge>
                  )}
                </div>
              </div>
              <div className="mt-4">
                {temAvaliacaoAprovada ? (
                  <Link
                    to={`/fichas/nova/${s.id}`}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {fichaAtiva ? <><Dumbbell className="h-3.5 w-3.5" /> Editar ficha</> : <><Plus className="h-3.5 w-3.5" /> Criar ficha</>}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-md bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
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
