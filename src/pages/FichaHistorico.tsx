import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { History, Eye, RotateCcw, Calendar, TrendingUp, Loader2, ArrowLeft, Dumbbell, ClipboardList } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Ficha {
  id: string;
  nome: string;
  objetivo: string;
  nivel: string;
  data_inicio: string;
  data_validade: string;
  status: string;
  observacoes: string | null;
}

export default function FichaHistorico() {
  const { aluno_id } = useParams();
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [alunoNome, setAlunoNome] = useState("");
  
  // Modal Visualização
  const [selectedFicha, setSelectedFicha] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  useEffect(() => {
    fetchHistorico();
  }, [aluno_id]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      
      const { data: aluno } = await supabase.from('alunos').select('nome').eq('id', aluno_id).single();
      if (aluno) setAlunoNome(aluno.nome);

      const { data, error } = await supabase
        .from('fichas_treino')
        .select('*')
        .eq('aluno_id', aluno_id)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setFichas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar histórico: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizar = async (ficha: Ficha) => {
    try {
      setIsModalOpen(true);
      setLoadingDetalhes(true);
      
      const { data, error } = await supabase
        .from('fichas_treino')
        .select(`
          *,
          divisoes:divisoes_treino(
            *,
            itens:itens_treino(
              *,
              exercicio:exercicios(*)
            )
          )
        `)
        .eq('id', ficha.id)
        .single();

      if (error) throw error;
      setSelectedFicha(data);
    } catch (error: any) {
      toast.error("Erro ao carregar detalhes: " + error.message);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const getStatusVariant = (status: string, validade: string) => {
    if (new Date(validade) < new Date() && status === 'ativa') return 'destructive';
    if (status === 'ativa') return 'success';
    return 'muted';
  };

  const getStatusLabel = (status: string, validade: string) => {
    if (new Date(validade) < new Date() && status === 'ativa') return 'Vencida';
    if (status === 'ativa') return 'Ativa';
    if (status === 'template') return 'Template';
    return 'Arquivada';
  };

  if (loading) {
     return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate("/fichas")}>
              <ArrowLeft className="h-5 w-5" />
           </Button>
           <div>
              <h1 className="text-2xl font-bold tracking-tight">Histórico de Treinos</h1>
              <p className="text-sm text-muted-foreground">Evolução física de <span className="font-bold text-foreground">{alunoNome}</span></p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {fichas.map((f) => (
          <div key={f.id} className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-smooth hover:bg-secondary/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <TrendingUp className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="font-bold">{f.nome}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                       <span>{f.objetivo}</span>
                       <span>•</span>
                       <span>{f.nivel}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:gap-8">
                 <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">{new Date(f.data_inicio).toLocaleDateString('pt-BR')}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Validade</p>
                    <p className="text-sm font-medium">{new Date(f.data_validade).toLocaleDateString('pt-BR')}</p>
                 </div>
                 <div>
                    <StatusBadge variant={getStatusVariant(f.status, f.data_validade)}>
                       {getStatusLabel(f.status, f.data_validade)}
                    </StatusBadge>
                 </div>
              </div>

              <div className="flex items-center gap-2 pt-4 md:pt-0">
                 <Button variant="outline" size="sm" onClick={() => handleVisualizar(f)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                 </Button>
                 <Button 
                   variant="secondary" 
                   size="sm" 
                   onClick={() => navigate(`/fichas/nova/${aluno_id}?template_id=${f.id}`)}
                 >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reativar
                 </Button>
              </div>
            </div>
          </div>
        ))}

        {fichas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
             <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
             <p>Nenhuma ficha encontrada no histórico.</p>
          </div>
        )}
      </div>

      {/* Modal de Visualização */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
         <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Visualização de Ficha
               </DialogTitle>
               <DialogDescription>
                  Detalhes do treino prescrito em {selectedFicha && new Date(selectedFicha.data_inicio).toLocaleDateString('pt-BR')}.
               </DialogDescription>
            </DialogHeader>

            {loadingDetalhes || !selectedFicha ? (
               <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
               <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-secondary/20 p-4 text-sm md:grid-cols-4">
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Objetivo</p>
                        <p className="font-semibold">{selectedFicha.objetivo}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Nível</p>
                        <p className="font-semibold">{selectedFicha.nivel}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Início</p>
                        <p className="font-semibold">{new Date(selectedFicha.data_inicio).toLocaleDateString('pt-BR')}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Vencimento</p>
                        <p className="font-semibold">{new Date(selectedFicha.data_validade).toLocaleDateString('pt-BR')}</p>
                     </div>
                  </div>

                  <div className="space-y-5">
                     {selectedFicha.divisoes.map((div: any) => (
                        <div key={div.id} className="space-y-3">
                           <div className="flex items-center gap-2 bg-secondary/40 px-3 py-2 rounded-t-lg border-x border-t border-border">
                              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
                                 {div.letra}
                              </span>
                              <h4 className="font-bold text-sm">{div.descricao}</h4>
                           </div>
                           <div className="overflow-hidden rounded-b-lg border border-border">
                              <table className="w-full text-xs">
                                 <thead className="bg-secondary/20 text-muted-foreground">
                                    <tr>
                                       <th className="px-3 py-2 text-left">Exercício</th>
                                       <th className="px-3 py-2 text-center">Sets</th>
                                       <th className="px-3 py-2 text-center">Reps</th>
                                       <th className="px-3 py-2 text-center">Carga</th>
                                       <th className="px-3 py-2 text-center">Intervalo</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-border">
                                    {div.itens.map((it: any) => (
                                       <tr key={it.id}>
                                          <td className="px-3 py-2 font-medium">{it.exercicio?.nome}</td>
                                          <td className="px-3 py-2 text-center font-bold text-primary">{it.series}</td>
                                          <td className="px-3 py-2 text-center uppercase">{it.repeticoes}</td>
                                          <td className="px-3 py-2 text-center">{it.carga_kg}kg</td>
                                          <td className="px-3 py-2 text-center">{it.intervalo_seg}s</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     ))}
                  </div>

                  {selectedFicha.observacoes && (
                     <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="text-[10px] font-bold uppercase text-amber-600 mb-1">Observações Gerais</p>
                        <p className="text-sm text-muted-foreground">{selectedFicha.observacoes}</p>
                     </div>
                  )}
               </div>
            )}

            <DialogFooter>
               <Button onClick={() => setIsModalOpen(false)}>Fechar</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
