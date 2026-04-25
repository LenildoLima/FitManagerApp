import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Upload, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function UsuarioEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    perfil: "" as "recepcionista" | "professor" | "admin" | "",
    cref: "",
    ativo: true,
    avatar_url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Administradores agora podem ser editados (regra de proteção aplicada no render do Select)
      
      setFormData({
        nome: data.nome,
        email: data.email,
        perfil: data.perfil,
        cref: data.cref || "",
        ativo: data.ativo,
        avatar_url: data.avatar_url || "",
      });
    } catch (error: any) {
      toast.error("Erro ao carregar usuário: " + error.message);
      navigate("/usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, perfil: value as any }));
    if (errors.perfil) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.perfil;
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome) newErrors.nome = "Nome é obrigatório";
    if (!formData.email) newErrors.email = "E-mail é obrigatório";
    
    if (!formData.perfil) newErrors.perfil = "Selecione um perfil";
    
    if (formData.perfil === 'professor' && !formData.cref) {
      newErrors.cref = "CREF é obrigatório para professores";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      // 1. Upload de avatar se houver novo
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatares/${id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fitmanager')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fitmanager')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrlData.publicUrl;
      }

      // 2. Atualizar na tabela perfis
      const { error: updateError } = await supabase
        .from('perfis')
        .update({
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
          cref: formData.perfil === 'professor' ? formData.cref : null,
          ativo: formData.ativo,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success("Alterações salvas com sucesso!");
      navigate("/usuarios");
    } catch (error: any) {
      console.error("Erro ao salvar alterações:", error);
      toast.error("Erro ao salvar: " + (error.message || "Verifique o console"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center text-muted-foreground">Carregando dados do usuário...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/usuarios" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Usuário</h1>
          <p className="text-sm text-muted-foreground">Atualize os dados do funcionário</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input 
                id="nome" 
                name="nome" 
                value={formData.nome} 
                onChange={handleInputChange} 
                placeholder="Ex: João Silva"
                className={errors.nome ? "border-destructive" : ""}
              />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="email@fitmanager.app"
                disabled // E-mail costuma ser a chave no Auth, evitar mudar aqui sem sincronizar
                className={errors.email ? "border-destructive opacity-50" : "opacity-50"}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perfil">Perfil *</Label>
              <Select 
                value={formData.perfil} 
                onValueChange={handleSelectChange}
                disabled={user?.id === id}
              >
                <SelectTrigger className={errors.perfil ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recepcionista">Recepcionista</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {user?.id === id && (
                <p className="text-xs text-amber-500 font-medium">Você não pode alterar seu próprio perfil.</p>
              )}
              {errors.perfil && <p className="text-xs text-destructive">{errors.perfil}</p>}
            </div>

            {formData.perfil === "professor" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="cref">Número do CREF *</Label>
                <Input 
                  id="cref" 
                  name="cref" 
                  value={formData.cref} 
                  onChange={handleInputChange} 
                  placeholder="000000-G/SP"
                  className={errors.cref ? "border-destructive" : ""}
                />
                {errors.cref && <p className="text-xs text-destructive">{errors.cref}</p>}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Foto de perfil (Avatar)</Label>
            <input 
              type="file" 
              ref={avatarInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <div className="flex items-center gap-4">
              <div 
                onClick={() => avatarInputRef.current?.click()}
                className={`flex h-24 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-smooth ${avatarFile ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/40'}`}
              >
                {avatarFile ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span className="text-sm truncate max-w-[200px]">{avatarFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Alterar foto</span>
                  </>
                )}
              </div>
              {formData.avatar_url && !avatarFile && (
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                  <img src={formData.avatar_url} alt="Avatar atual" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Usuário Ativo</Label>
              <p className="text-xs text-muted-foreground">Define se o funcionário pode acessar o sistema</p>
            </div>
            <Switch 
              checked={formData.ativo} 
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))} 
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => navigate("/usuarios")} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
