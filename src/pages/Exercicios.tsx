import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Power, PowerOff, Play, Loader2, X, Dumbbell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";

const GRUPOS_MUSCULARES = [
  "Peito", "Costas", "Pernas", "Ombros", "Bíceps", "Tríceps", "Abdômen", "Cardio", "Outros"
];

interface Exercicio {
  id: string;
  nome: string;
  grupo_muscular: string;
  descricao: string | null;
  video_url: string | null;
  ativo: boolean;
}

export default function Exercicios() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [grupoFilter, setGrupoFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingExercicio, setEditingExercicio] = useState<Exercicio | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    grupo_muscular: "Peito",
    descricao: "",
    video_url: "",
    ativo: true
  });

  useEffect(() => {
    fetchExercicios();
  }, []);

  const fetchExercicios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercicios')
        .select('*')
        .order('nome');

      if (error) throw error;
      setExercicios(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar exercícios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (exercicio?: Exercicio) => {
    if (exercicio) {
      setEditingExercicio(exercicio);
      setFormData({
        nome: exercicio.nome,
        grupo_muscular: exercicio.grupo_muscular,
        descricao: exercicio.descricao || "",
        video_url: exercicio.video_url || "",
        ativo: exercicio.ativo
      });
    } else {
      setEditingExercicio(null);
      setFormData({
        nome: "",
        grupo_muscular: "Peito",
        descricao: "",
        video_url: "",
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.grupo_muscular) {
      toast.error("Nome e grupo muscular são obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      const dataToSave = {
        nome: formData.nome,
        grupo_muscular: formData.grupo_muscular,
        descricao: formData.descricao,
        video_url: formData.video_url,
        ativo: formData.ativo
      };

      if (editingExercicio) {
        const { error } = await supabase
          .from('exercicios')
          .update(dataToSave)
          .eq('id', editingExercicio.id);
        if (error) throw error;
        toast.success("Exercício atualizado!");
      } else {
        const { error } = await supabase
          .from('exercicios')
          .insert([dataToSave]);
        if (error) throw error;
        toast.success("Exercício criado!");
      }

      setIsModalOpen(false);
      fetchExercicios();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (exercicio: Exercicio) => {
    try {
      const { error } = await supabase
        .from('exercicios')
        .update({ ativo: !exercicio.ativo })
        .eq('id', exercicio.id);
      
      if (error) throw error;
      toast.success(`Exercício ${!exercicio.ativo ? 'ativado' : 'inativado'}!`);
      fetchExercicios();
    } catch (error: any) {
      toast.error("Erro ao alterar status: " + error.message);
    }
  };

  const filteredExercicios = exercicios.filter(ex => {
    const matchesSearch = ex.nome.toLowerCase().includes(search.toLowerCase()) || 
                         (ex.descricao?.toLowerCase().includes(search.toLowerCase()) || false);
    const matchesGrupo = grupoFilter === "Todos" || ex.grupo_muscular === grupoFilter;
    return matchesSearch && matchesGrupo;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banco de Exercícios</h1>
          <p className="text-sm text-muted-foreground">{filteredExercicios.length} exercícios encontrados</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo exercício
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full rounded-lg border border-border bg-secondary/40 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grupo:</Label>
          <select 
            value={grupoFilter}
            onChange={(e) => setGrupoFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary/40 py-2 px-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="Todos">Todos os grupos</option>
            {GRUPOS_MUSCULARES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredExercicios.map((ex) => (
            <div key={ex.id} className={`group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-smooth hover:shadow-lg ${!ex.ativo && 'opacity-60'}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                    {ex.grupo_muscular}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(ex)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 ${ex.ativo ? 'text-destructive' : 'text-success'}`}
                      onClick={() => toggleAtivo(ex)}
                    >
                      {ex.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold leading-tight">{ex.nome}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ex.descricao || "Sem descrição"}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {ex.video_url && (
                      <a 
                        href={ex.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition-smooth hover:bg-red-500 hover:text-white"
                        title="Ver vídeo demonstração"
                      >
                        <Play className="h-4 w-4 fill-current" />
                      </a>
                    )}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                  </div>
                  <StatusBadge variant={ex.ativo ? "success" : "muted"}>
                    {ex.ativo ? "Ativo" : "Inativo"}
                  </StatusBadge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingExercicio ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
            <DialogDescription>
              Preencha as informações do exercício físico.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome do Exercício</Label>
              <Input 
                id="nome" 
                value={formData.nome} 
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Ex: Supino Reto com Barra"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grupo">Grupo Muscular</Label>
              <select 
                id="grupo"
                value={formData.grupo_muscular}
                onChange={(e) => setFormData({...formData, grupo_muscular: e.target.value})}
                className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {GRUPOS_MUSCULARES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição / Instruções</Label>
              <textarea 
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                className="min-h-[100px] w-full rounded-lg border border-border bg-background py-2 px-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Descreva a execução correta..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="video_url">URL do Vídeo (YouTube/Vimeo)</Label>
              <div className="flex gap-2">
                <Input 
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {formData.video_url && (
                  <Button variant="outline" size="icon" onClick={() => window.open(formData.video_url, '_blank')}>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="ativo" 
                checked={formData.ativo}
                onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <Label htmlFor="ativo" className="cursor-pointer">Exercício Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-gradient-primary text-primary-foreground">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {editingExercicio ? "Salvar Alterações" : "Criar Exercício"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
