import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Save, X, Search, Play, Loader2, Dumbbell, LayoutPanelTop, ClipboardList, Info, ListFilter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

// Constants for selects
const OBJETIVOS = ["Hipertrofia", "Emagrecimento", "Condicionamento", "Reabilitação", "Força", "Resistência"];
const NIVEIS = ["Iniciante", "Intermediário", "Avançado"];
const GRUPOS_MUSCULARES = ["Peito", "Costas", "Pernas", "Ombros", "Bíceps", "Tríceps", "Abdômen", "Cardio", "Outros"];

interface Exercicio {
  id: string;
  nome: string;
  grupo_muscular: string;
  video_url: string;
}

interface ItemFicha {
  id?: string;
  exercicio_id: string;
  exercicio?: Exercicio;
  ordem: number;
  series: number;
  repeticoes: string;
  carga_kg: number;
  intervalo_seg: number;
  observacoes: string;
}

interface DivisaoFicha {
  id?: string;
  letra: string;
  descricao: string;
  ordem: number;
  itens: ItemFicha[];
}

export default function FichaNova() {
  const navigate = useNavigate();
  const { id, aluno_id } = useParams();
  const alunoId = aluno_id;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alunoInfo, setAlunoInfo] = useState<any>(null);
  const [avaliacaoInfo, setAvaliacaoInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("A");

  // Main Form State
  const [fichaData, setFichaData] = useState({
    nome: "",
    objetivo: "",
    nivel: "Iniciante",
    data_inicio: new Date().toISOString().split('T')[0],
    data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observacoes: "",
    is_template: false
  });

  const [divisoes, setDivisoes] = useState<DivisaoFicha[]>([
    { letra: "A", descricao: "Treino A", ordem: 1, itens: [] }
  ]);

  // Modals state
  const [isExerciciosModalOpen, setIsExerciciosModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseGroupFilter, setExerciseGroupFilter] = useState("Todos");
  const [availableExercicios, setAvailableExercicios] = useState<Exercicio[]>([]);
  const [loadingExercicios, setLoadingExercicios] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
       fetchFichaParaEdicao();
    } else if (alunoId) {
       fetchAlunoEAssess();
    } else {
       toast.error("Parâmetro inválido.");
       navigate("/fichas");
    }
    fetchTemplates();
  }, [id, alunoId]);

  const fetchAlunoEAssess = async () => {
    try {
      setLoading(true);
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('id', alunoId)
        .single();

      if (alunoError) throw alunoError;
      
      setAlunoInfo(alunoData);

      const { data: avaliacaoData } = await supabase
        .from('avaliacoes_fisicas')
        .select(`
          *,
          anamnese:anamnese(*),
          medidas:medidas_antropometricas(*),
          testes:testes_fisicos(*)
        `)
        .eq('aluno_id', aluno_id)
        .eq('status', 'aprovada')
        .order('data_avaliacao', { ascending: false })
        .limit(1)
        .single();

      if (avaliacaoData) {
        setAvaliacaoInfo(avaliacaoData);
        console.log('anamnese:', avaliacaoData?.anamnese);
        console.log('objetivos:', avaliacaoData?.anamnese?.objetivos);

        const updates: any = {};
        if (avaliacaoData.nivel_condicionamento) {
          updates.nivel = avaliacaoData.nivel_condicionamento;
        }

        const an = Array.isArray(avaliacaoData.anamnese) ? avaliacaoData.anamnese[0] : avaliacaoData.anamnese;
        if (an) {
          const mapaObjetivos: Record<string, string> = {
            'Perda de peso': 'Emagrecimento',
            'Ganho de massa': 'Hipertrofia',
            'Condicionamento': 'Condicionamento',
            'Reabilitação': 'Reabilitação',
            'Performance': 'Força',
            'Bem-estar': 'Resistência'
          };
          
          console.log('objetivos da anamnese:', an.objetivos);
          console.log('objetivo mapeado:', mapaObjetivos[an.objetivos?.[0]]);

          if (an.objetivos && an.objetivos.length > 0) {
            const primeiroObjetivo = an.objetivos[0];
            if (primeiroObjetivo && mapaObjetivos[primeiroObjetivo]) {
              updates.objetivo = mapaObjetivos[primeiroObjetivo];
            }
          }

          let obs = "";
          if (avaliacaoData.restricoes) {
            obs += `Restrições: ${avaliacaoData.restricoes}\n`;
          }
          if (an.lesoes_desc) {
            obs += `Lesões/Cirurgias: ${an.lesoes_desc}\n`;
          }
          if (an.doencas && an.doencas.length > 0) {
            obs += `Condições de saúde: ${an.doencas.join(', ')}\n`;
          }
          if (an.usa_medicamentos) {
            obs += `Medicamentos: ${an.medicamentos_desc}\n`;
          }
          if (obs) {
            updates.observacoes = obs;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          setFichaData(prev => ({ ...prev, ...updates }));
        }
      }

    } catch (error: any) {
      toast.error("Erro ao buscar aluno: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFichaParaEdicao = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fichas_treino')
        .select(`
          *,
          aluno:alunos(id, nome),
          divisoes:divisoes_treino(
            *,
            itens:itens_treino(
              *,
              exercicio:exercicios(*)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setFichaData({
        nome: data.nome,
        objetivo: data.objetivo,
        nivel: data.nivel,
        data_inicio: data.data_inicio,
        data_validade: data.data_validade,
        observacoes: data.observacoes || "",
        is_template: data.is_template || false
      });

      setAlunoInfo(data.aluno);

      // Mapear divisoes e itens
      const mappedDivisoes = data.divisoes.map((d: any) => ({
        letra: d.letra,
        descricao: d.descricao,
        ordem: d.ordem,
        itens: d.itens.map((i: any) => ({
          exercicio_id: i.exercicio_id,
          exercicio: i.exercicio,
          ordem: i.ordem,
          series: i.series,
          repeticoes: i.repeticoes,
          carga_kg: i.carga_kg,
          intervalo_seg: i.intervalo_seg,
          observacoes: i.observacoes || ""
        })).sort((a: any, b: any) => a.ordem - b.ordem)
      })).sort((a: any, b: any) => a.ordem - b.ordem);

      setDivisoes(mappedDivisoes);
      if (mappedDivisoes.length > 0) setActiveTab(mappedDivisoes[0].letra);

    } catch (error: any) {
      toast.error("Erro ao carregar ficha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('fichas_treino')
      .select('*, divisoes:divisoes_treino(*, itens:itens_treino(*, exercicio:exercicios(*)))')
      .eq('status', 'ativa')
      .eq('salvar_como_template', true);
      
    if (error) {
      console.error('Erro ao buscar templates:', error);
    }
    setTemplates(data || []);
  };

  const fetchExercicios = async () => {
    try {
      setLoadingExercicios(true);
      let query = supabase.from('exercicios').select('*').eq('ativo', true);
      
      if (exerciseSearch) query = query.ilike('nome', `%${exerciseSearch}%`);
      if (exerciseGroupFilter !== "Todos") query = query.eq('grupo_muscular', exerciseGroupFilter);

      const { data, error } = await query.order('nome');
      if (error) throw error;
      setAvailableExercicios(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar exercícios: " + error.message);
    } finally {
      setLoadingExercicios(false);
    }
  };

  const addDivisao = () => {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const proximaLetra = letras[divisoes.length] || "?";
    setDivisoes([...divisoes, { letra: proximaLetra, descricao: `Treino ${proximaLetra}`, ordem: divisoes.length + 1, itens: [] }]);
    setActiveTab(proximaLetra);
  };

  const removeDivisao = (letra: string) => {
    if (divisoes.length === 1) return;
    const novaLista = divisoes.filter(d => d.letra !== letra).map((d, index) => {
       const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
       return { ...d, letra: letras[index], ordem: index + 1 };
    });
    setDivisoes(novaLista);
    setActiveTab(novaLista[0].letra);
  };

  const addExercicioADivisao = (exercicio: Exercicio) => {
    const novaLista = divisoes.map(d => {
      if (d.letra === activeTab) {
        return {
          ...d,
          itens: [...d.itens, {
            exercicio_id: exercicio.id,
            exercicio: exercicio,
            ordem: d.itens.length + 1,
            series: 3,
            repeticoes: "12",
            carga_kg: 0,
            intervalo_seg: 60,
            observacoes: ""
          }]
        };
      }
      return d;
    });
    setDivisoes(novaLista);
    setIsExerciciosModalOpen(false);
  };

  const updateItem = (letra: string, index: number, field: string, value: any) => {
    const novaLista = divisoes.map(d => {
      if (d.letra === letra) {
        const novosItens = [...d.itens];
        novosItens[index] = { ...novosItens[index], [field]: value };
        return { ...d, itens: novosItens };
      }
      return d;
    });
    setDivisoes(novaLista);
  };

  const removeItem = (letra: string, index: number) => {
     const novaLista = divisoes.map(d => {
        if (d.letra === letra) {
           return { ...d, itens: d.itens.filter((_, i) => i !== index).map((it, idx) => ({ ...it, ordem: idx + 1 })) };
        }
        return d;
     });
     setDivisoes(novaLista);
  };

  const applyTemplate = async (templateId: string) => {
    try {
      setLoading(true);
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
        .eq('id', templateId)
        .single();
      
      if (error) throw error;

      setFichaData(prev => ({
        ...prev,
        nome: `${data.nome} (Cópia)`,
        objetivo: data.objetivo,
        nivel: data.nivel
      }));

      const mappedDivisoes = data.divisoes.map((d: any) => ({
        letra: d.letra,
        descricao: d.descricao,
        ordem: d.ordem,
        itens: d.itens.map((i: any) => ({
          exercicio_id: i.exercicio_id,
          exercicio: i.exercicio,
          ordem: i.ordem,
          series: i.series,
          repeticoes: i.repeticoes,
          carga_kg: i.carga_kg,
          intervalo_seg: i.intervalo_seg,
          observacoes: i.observacoes || ""
        }))
      }));

      setDivisoes(mappedDivisoes);
      setActiveTab(mappedDivisoes[0]?.letra || "A");
      setIsTemplatesModalOpen(false);
      toast.success("Template aplicado!");

    } catch (error: any) {
      toast.error("Erro ao aplicar template: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fichaData.nome) {
      toast.error("Informe o nome da ficha.");
      return;
    }

    try {
      setSaving(true);
      
      const realAlunoId = alunoId || (alunoInfo?.id);

      // 1. Arquivar fichas anteriores se não for modo edição de template
      if (!fichaData.is_template) {
        await supabase
          .from('fichas_treino')
          .update({ status: 'arquivada' })
          .eq('aluno_id', realAlunoId)
          .eq('status', 'ativa');
      }

      // 2. Inserir Ficha
      const { data: ficha, error: fichaError } = await supabase
        .from('fichas_treino')
        .insert([{
          aluno_id: realAlunoId,
          professor_id: user?.id,
          nome: fichaData.nome,
          objetivo: fichaData.objetivo,
          nivel: fichaData.nivel,
          data_inicio: fichaData.data_inicio,
          data_validade: fichaData.data_validade,
          observacoes: fichaData.observacoes,
          status: fichaData.is_template ? 'template' : 'ativa'
        }])
        .select()
        .single();
      
      if (fichaError) throw fichaError;

      // 3. Inserir Divisões e Itens
      for (const div of divisoes) {
        const { data: divisao, error: divError } = await supabase
          .from('divisoes_treino')
          .insert([{
            ficha_id: ficha.id,
            letra: div.letra,
            descricao: div.descricao,
            ordem: div.ordem
          }])
          .select()
          .single();
        
        if (divError) throw divError;

        if (div.itens.length > 0) {
          const itensToInsert = div.itens.map(it => ({
            divisao_id: divisao.id,
            exercicio_id: it.exercicio_id,
            ordem: it.ordem,
            series: it.series,
            repeticoes: it.repeticoes,
            carga_kg: it.carga_kg,
            intervalo_seg: it.intervalo_seg,
            observacoes: it.observacoes
          }));

          const { error: itensError } = await supabase
            .from('itens_treino')
            .insert(itensToInsert);
          
          if (itensError) throw itensError;
        }
      }

      toast.success("Ficha salva com sucesso!");
      navigate("/fichas");

    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/20">
              <ClipboardList className="h-6 w-6" />
           </div>
           <div>
              <div className="flex items-center gap-2">
                 <h1 className="text-2xl font-bold tracking-tight">{id ? "Editar Ficha" : "Nova Ficha de Treino"}</h1>
                 <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {fichaData.nivel}
                 </span>
              </div>
              <p className="text-sm text-muted-foreground">Prescrevendo para: <span className="font-bold text-foreground">{alunoInfo?.nome}</span></p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => navigate("/fichas")}>Cancelar</Button>
           <Button onClick={() => setIsTemplatesModalOpen(true)} variant="secondary">Usar Template</Button>
           <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary text-primary-foreground shadow-glow">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Ficha
           </Button>
        </div>
      </div>

      {avaliacaoInfo && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm text-sm">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            📋 Dados da última avaliação — {new Date(avaliacaoInfo.data_avaliacao).toLocaleDateString("pt-BR")}
          </h2>
          {(() => {
            const med = Array.isArray(avaliacaoInfo.medidas) ? avaliacaoInfo.medidas[0] : avaliacaoInfo.medidas;
            if (!med) {
               return (
                  <div className="text-muted-foreground flex items-center gap-2">
                     {avaliacaoInfo.parecer && <span>Parecer do professor: <strong>{avaliacaoInfo.parecer}</strong></span>}
                  </div>
               );
            }
            
            const getImcClass = (imc: number) => {
               if (!imc) return "";
               if (imc < 18.5) return "Abaixo do peso";
               if (imc < 25) return "Normal";
               if (imc < 30) return "Sobrepeso";
               return "Obesidade";
            };
            
            const imcClass = med.imc ? getImcClass(med.imc) : "";

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {med.peso_kg && <div><span className="text-muted-foreground block text-xs">Peso</span><span className="font-semibold">{med.peso_kg}kg</span></div>}
                {med.altura_cm && <div><span className="text-muted-foreground block text-xs">Altura</span><span className="font-semibold">{med.altura_cm}cm</span></div>}
                {med.imc && <div><span className="text-muted-foreground block text-xs">IMC</span><span className="font-semibold">{med.imc} {imcClass ? `(${imcClass})` : ''}</span></div>}
                {med.perc_gordura && <div><span className="text-muted-foreground block text-xs">% Gordura</span><span className="font-semibold">{med.perc_gordura}%</span></div>}
                {(med.pressao_sistolica && med.pressao_diastolica) && <div><span className="text-muted-foreground block text-xs">PA</span><span className="font-semibold">{med.pressao_sistolica}/{med.pressao_diastolica} mmHg</span></div>}
                {med.fc_repouso && <div><span className="text-muted-foreground block text-xs">FC Repouso</span><span className="font-semibold">{med.fc_repouso} bpm</span></div>}
                {avaliacaoInfo.parecer && <div className="col-span-2 md:col-span-4 lg:col-span-1"><span className="text-muted-foreground block text-xs">Parecer</span><span className="font-semibold line-clamp-2" title={avaliacaoInfo.parecer}>{avaliacaoInfo.parecer}</span></div>}
              </div>
            );
          })()}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Seção 1: Dados Gerais */}
        <div className="space-y-6 lg:col-span-1 text-card-foreground">
           <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                 <Info className="h-5 w-5 text-primary" />
                 <h2 className="font-semibold">Informações Gerais</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome_ficha">Nome da Ficha</Label>
                  <Input 
                    id="nome_ficha" 
                    value={fichaData.nome} 
                    onChange={(e) => setFichaData({...fichaData, nome: e.target.value})}
                    placeholder="Ex: Treino de Hipertrofia A/B"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <Label>Objetivo</Label>
                      <select 
                        value={fichaData.objetivo}
                        onChange={(e) => setFichaData({...fichaData, objetivo: e.target.value})}
                        className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="" disabled>Selecione um objetivo</option>
                        {OBJETIVOS.map(obj => <option key={obj} value={obj}>{obj}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <Label>Nível</Label>
                      <select 
                        value={fichaData.nivel}
                        onChange={(e) => setFichaData({...fichaData, nivel: e.target.value})}
                        className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
                      >
                        {NIVEIS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <Label>Data Início</Label>
                      <Input 
                        type="date"
                        value={fichaData.data_inicio}
                        onChange={(e) => setFichaData({...fichaData, data_inicio: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label>Validade</Label>
                      <Input 
                        type="date"
                        value={fichaData.data_validade}
                        onChange={(e) => setFichaData({...fichaData, data_validade: e.target.value})}
                      />
                   </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Observações Gerais</Label>
                  <textarea 
                    value={fichaData.observacoes}
                    onChange={(e) => setFichaData({...fichaData, observacoes: e.target.value})}
                    className="min-h-[100px] w-full rounded-lg border border-border bg-background py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="Orientações de descanso, carga progressiva, etc..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                   <input 
                     type="checkbox" 
                     id="is_template" 
                     checked={fichaData.is_template}
                     onChange={(e) => setFichaData({...fichaData, is_template: e.target.checked})}
                     className="h-4 w-4 rounded border-border text-primary"
                   />
                   <Label htmlFor="is_template" className="text-xs text-muted-foreground">Salvar como template de treino</Label>
                </div>
              </div>
           </div>
        </div>

        {/* Seção 2: Divisões e Treinos */}
        <div className="lg:col-span-2">
           <div className="rounded-xl border border-border bg-card p-6 shadow-sm min-h-[500px]">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
                 <div className="flex items-center gap-2">
                    <LayoutPanelTop className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Montagem do Treino</h2>
                 </div>
                 <Button variant="outline" size="sm" onClick={addDivisao} className="h-8">
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar Divisão
                 </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                 <div className="flex items-center justify-between mb-4">
                   <TabsList className="bg-secondary/50">
                     {divisoes.map(d => (
                       <TabsTrigger key={d.letra} value={d.letra} className="px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                         Treino {d.letra}
                       </TabsTrigger>
                     ))}
                   </TabsList>
                 </div>

                 {divisoes.map((div, dIdx) => (
                   <TabsContent key={div.letra} value={div.letra} className="space-y-4">
                      <div className="flex items-end gap-4 bg-secondary/20 p-4 rounded-lg">
                         <div className="flex-1 space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Foco / Descrição da Divisão</Label>
                            <Input 
                               value={div.descricao} 
                               onChange={(e) => {
                                  const nova = [...divisoes];
                                  nova[dIdx].descricao = e.target.value;
                                  setDivisoes(nova);
                               }}
                               placeholder="Ex: Peito, Ombro e Tríceps" 
                               className="border-none bg-background/50 focus:ring-1"
                            />
                         </div>
                         <Button variant="destructive" size="icon" onClick={() => removeDivisao(div.letra)} disabled={divisoes.length === 1}>
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>

                      <div className="overflow-x-auto rounded-lg border border-border">
                         <table className="w-full text-sm">
                            <thead className="bg-secondary/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                               <tr>
                                  <th className="px-3 py-3 text-left">Exercício</th>
                                  <th className="px-3 py-3 text-center w-16">Sets</th>
                                  <th className="px-3 py-3 text-center w-24">Reps</th>
                                  <th className="px-3 py-3 text-center w-20">Carga</th>
                                  <th className="px-3 py-3 text-center w-20">Int.</th>
                                  <th className="px-3 py-3 text-left">Observações</th>
                                  <th className="px-3 py-3 text-right">Ação</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                               {div.itens.length === 0 ? (
                                  <tr>
                                     <td colSpan={7} className="py-10 text-center text-muted-foreground italic">
                                        Nenhum exercício adicionado a esta divisão.
                                     </td>
                                  </tr>
                               ) : (
                                  div.itens.map((it, iIdx) => (
                                    <tr key={iIdx} className="hover:bg-secondary/10">
                                       <td className="px-3 py-2 min-w-[150px]">
                                          <div className="flex items-center gap-2">
                                             <div className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-primary">
                                                <Dumbbell className="h-3.5 w-3.5" />
                                             </div>
                                             <div>
                                                <p className="font-bold text-[13px]">{it.exercicio?.nome}</p>
                                                <p className="text-[10px] text-muted-foreground">{it.exercicio?.grupo_muscular}</p>
                                             </div>
                                             {it.exercicio?.video_url && (
                                                <a href={it.exercicio.video_url} target="_blank" rel="noreferrer" className="text-red-500 hover:scale-110 transition-transform">
                                                   <Play className="h-3.5 w-3.5 fill-current" />
                                                </a>
                                             )}
                                          </div>
                                       </td>
                                       <td className="px-2 py-2">
                                          <Input 
                                            type="number" 
                                            value={it.series} 
                                            onChange={(e) => updateItem(div.letra, iIdx, 'series', parseInt(e.target.value))}
                                            className="h-8 px-1 text-center font-bold" 
                                          />
                                       </td>
                                       <td className="px-2 py-2">
                                          <Input 
                                            value={it.repeticoes} 
                                            onChange={(e) => updateItem(div.letra, iIdx, 'repeticoes', e.target.value)}
                                            className="h-8 px-1 text-center text-xs" 
                                          />
                                       </td>
                                       <td className="px-2 py-2">
                                          <Input 
                                            type="number" 
                                            value={it.carga_kg} 
                                            onChange={(e) => updateItem(div.letra, iIdx, 'carga_kg', parseInt(e.target.value))}
                                            className="h-8 px-1 text-center text-xs" 
                                          />
                                       </td>
                                       <td className="px-2 py-2 text-center">
                                          <Input 
                                            type="number" 
                                            value={it.intervalo_seg} 
                                            onChange={(e) => updateItem(div.letra, iIdx, 'intervalo_seg', parseInt(e.target.value))}
                                            className="h-8 px-1 text-center text-[10px] w-full inline-block" 
                                          />
                                       </td>
                                       <td className="px-2 py-2">
                                          <Input 
                                            value={it.observacoes} 
                                            onChange={(e) => updateItem(div.letra, iIdx, 'observacoes', e.target.value)}
                                            className="h-8 text-[11px]" 
                                            placeholder="..."
                                          />
                                       </td>
                                       <td className="px-3 py-2 text-right">
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeItem(div.letra, iIdx)}>
                                             <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                       </td>
                                    </tr>
                                  ))
                               )}
                            </tbody>
                         </table>
                      </div>

                      <Button 
                        variant="secondary" 
                        className="w-full py-6 border-dashed border-2 hover:border-primary/50"
                        onClick={() => {
                          fetchExercicios();
                          setIsExerciciosModalOpen(true);
                        }}
                      >
                         <Plus className="mr-2 h-5 w-5" />
                         ADICIONAR EXERCÍCIO AO TREINO {div.letra}
                      </Button>
                   </TabsContent>
                 ))}
              </Tabs>
           </div>
        </div>
      </div>

      {/* Modal de Busca de Exercícios */}
      <Dialog open={isExerciciosModalOpen} onOpenChange={setIsExerciciosModalOpen}>
         <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
               <DialogTitle>Buscar Exercício</DialogTitle>
               <DialogDescription>Selecione um exercício para adicionar ao treino {activeTab}.</DialogDescription>
               
               <div className="flex gap-4 mt-4">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input 
                        placeholder="Nome do exercício..." 
                        className="pl-9"
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchExercicios()}
                     />
                  </div>
                  <select 
                    value={exerciseGroupFilter}
                    onChange={(e) => setExerciseGroupFilter(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
                  >
                     <option value="Todos">Grupos</option>
                     {GRUPOS_MUSCULARES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <Button onClick={fetchExercicios} size="sm">Buscar</Button>
               </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 pt-2">
               {loadingExercicios ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
               ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                     {availableExercicios.map(ex => (
                        <div 
                          key={ex.id} 
                          onClick={() => addExercicioADivisao(ex)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20 hover:bg-primary/10 hover:border-primary/50 cursor-pointer transition-all group"
                        >
                           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-primary group-hover:scale-110 transition-transform">
                              <Dumbbell className="h-5 w-5" />
                           </div>
                           <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-sm truncate">{ex.nome}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{ex.grupo_muscular}</p>
                           </div>
                           <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
                        </div>
                     ))}
                  </div>
               )}
            </div>
            
            <DialogFooter className="p-6 bg-secondary/20">
               <Button variant="ghost" onClick={() => setIsExerciciosModalOpen(false)}>Fechar</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Modal de Templates */}
      <Dialog open={isTemplatesModalOpen} onOpenChange={setIsTemplatesModalOpen}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle>Carregar Template</DialogTitle>
               <DialogDescription>Escolha uma ficha base para acelerar a prescrição.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto px-1">
               {templates.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => applyTemplate(t.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary/30 cursor-pointer transition-all"
                  >
                     <div>
                        <p className="font-bold">{t.nome}</p>
                        <p className="text-xs text-muted-foreground">{t.objetivo} • {t.nivel}</p>
                     </div>
                     <CheckCircle2 className="h-5 w-5 text-success opacity-0 group-hover:opacity-100" />
                  </div>
               ))}
               {templates.length === 0 && <p className="text-center text-sm text-muted-foreground">Nenhum template salvo ainda.</p>}
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setIsTemplatesModalOpen(false)}>Cancelar</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
