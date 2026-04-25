import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, ClipboardType, History, TriangleAlert, CheckCircle2, User, Loader2, Dumbbell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";

interface AlunoComFicha {
  id: string;
  nome: string;
  status: string;
  plano: string | null;
  avaliacoes: { status: string }[];
  fichas: {
    id: string;
    nome: string;
    status: string;
    data_validade: string;
  }[];
}

export default function FichasTreino() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<AlunoComFicha[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    try {
      setLoading(true);
      
      // Conforme o prompt: buscar alunos ativos com suas avaliações e fichas
      const { data, error } = await supabase
        .from('alunos')
        .select(`
          id,
          nome,
          status,
          plano:planos(nome),
          avaliacoes:avaliacoes_fisicas(status),
          fichas:fichas_treino(id, nome, status, data_validade)
        `)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      
      const formatados = (data || []).map((a: any) => ({
        ...a,
        plano: a.plano?.nome || null
      }));
      
      setAlunos(formatados);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFichaAtiva = (fichas: AlunoComFicha['fichas']) => {
    return fichas?.find(f => f.status === 'ativa');
  };

  const hasAvaliacaoAprovada = (avaliacoes: AlunoComFicha['avaliacoes']) => {
    return avaliacoes?.some(a => a.status === 'aprovada');
  };

  const isVencida = (dataValidade: string) => {
    return new Date(dataValidade) < new Date();
  };

  const getDiasVencida = (dataValidade: string) => {
    const diff = new Date().getTime() - new Date(dataValidade).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const filteredAlunos = alunos.filter(a => 
    a.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fichas de Treino</h1>
          <p className="text-sm text-muted-foreground">Gerencie o treino dos seus alunos matriculados.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do aluno..."
            className="w-full rounded-lg border border-border bg-secondary/40 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAlunos.map((aluno) => {
          const fichaAtiva = getFichaAtiva(aluno.fichas);
          const aprovado = hasAvaliacaoAprovada(aluno.avaliacoes);
          const vencida = fichaAtiva && isVencida(fichaAtiva.data_validade);
          const diasVencida = vencida ? getDiasVencida(fichaAtiva.data_validade) : 0;

          return (
            <div key={aluno.id} className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-smooth hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold shadow-glow">
                    {aluno.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <h3 className="font-bold leading-tight">{aluno.nome}</h3>
                    <p className="text-xs text-muted-foreground">{aluno.plano || "Sem plano"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {!aprovado ? (
                    <>
                      <StatusBadge variant="destructive">Bloqueado — sem avaliação</StatusBadge>
                      <p className="text-[10px] text-destructive font-medium uppercase tracking-wider">Avaliação pendente</p>
                    </>
                  ) : !fichaAtiva ? (
                    <StatusBadge variant="warning">Sem ficha ativa</StatusBadge>
                  ) : (
                    <>
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-semibold truncate">{fichaAtiva.nome}</span>
                        <StatusBadge variant={vencida ? "destructive" : "success"}>
                          {vencida ? "Vencida" : "Ativa"}
                        </StatusBadge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Expira em: {new Date(fichaAtiva.data_validade).toLocaleDateString('pt-BR')}
                      </p>
                      {vencida && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 p-2 text-destructive">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold">Ficha vencida há {diasVencida} dias</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                  {!aprovado ? (
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="w-full text-xs text-muted-foreground cursor-not-allowed opacity-50"
                       disabled
                     >
                       Nova ficha bloqueada
                     </Button>
                  ) : !fichaAtiva ? (
                    <Button 
                      onClick={() => navigate(`/fichas/nova/${aluno.id}`)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      + Criar ficha
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 w-full gap-2">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/fichas/${fichaAtiva.id}/editar`)}
                        className="text-[10px] h-8"
                      >
                        <Pencil className="mr-1.5 h-3 w-3" />
                        Editar ficha
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/fichas/nova/${aluno.id}`)}
                        className="text-[10px] h-8"
                      >
                        <Plus className="mr-1.5 h-3 w-3" />
                        Nova ficha
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/fichas/${aluno.id}/historico`)}
                        className="col-span-2 text-[10px] h-8"
                      >
                        <History className="mr-1.5 h-3 w-3" />
                        Ver histórico
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredAlunos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
           <div className="rounded-full bg-secondary p-4 mb-4">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
           </div>
           <h3 className="text-lg font-semibold">Nenhum aluno encontrado</h3>
           <p className="text-sm text-muted-foreground">Tente buscar por um nome diferente.</p>
        </div>
      )}
    </div>
  );
}
