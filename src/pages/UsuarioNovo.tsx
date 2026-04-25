import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Upload, UserPlus, Dumbbell, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function UsuarioNovo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    perfil: "" as "recepcionista" | "professor" | "",
    cref: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "E-mail inválido";
    
    if (!formData.senha) newErrors.senha = "Senha é obrigatória";
    else if (formData.senha.length < 8) newErrors.senha = "Senha deve ter no mínimo 8 caracteres";
    
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
      setLoading(true);

      // 1. Verificar se e-mail já existe na tabela perfis
      const { data: existingUser } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        setErrors(prev => ({ ...prev, email: "Este e-mail já está em uso" }));
        toast.error("E-mail já cadastrado.");
        return;
      }

      // 2. Criar usuário via Edge Function (evita erro 403 no frontend)
      const { data: funcData, error: funcError } = await supabase.functions.invoke('criar-usuario', {
        body: { 
          nome: formData.nome, 
          email: formData.email, 
          password: formData.senha, 
          perfil: formData.perfil, 
          cref: formData.perfil === 'professor' ? formData.cref : null 
        }
      });

      if (funcError || funcData?.error) {
        throw new Error(funcData?.error || funcError.message);
      }

      // O cadastro do perfil já é feito dentro da Edge Function
      const userId = funcData.userId;

      // 3. Upload de avatar se houver
      let avatarUrl = "";
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatares/${userId}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fitmanager')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fitmanager')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrlData.publicUrl;
      }

      // O registro na tabela perfis agora já foi feito pela Edge Function.
      // Atualizamos apenas o avatar_url se ele foi enviado, pois o upload ocorre no cliente.
      if (avatarUrl) {
        const { error: updateError } = await supabase
          .from('perfis')
          .update({ avatar_url: avatarUrl })
          .eq('id', userId);
        
        if (updateError) throw updateError;
      }
      setShowSuccess(true);
      // Removido o navigate automático para login
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast.error("Erro ao criar usuário: " + (error.message || "Verifique o console"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 py-12">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl animate-fade-in space-y-6">
        {showSuccess ? (
          <div className="rounded-2xl border border-border bg-card p-10 shadow-card text-center space-y-6 animate-scale-in">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Clock className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Cadastro realizado com sucesso!</h1>
              <p className="text-muted-foreground leading-relaxed px-4">
                Seu cadastro foi recebido e está aguardando ativação pelo administrador do sistema. 
                Assim que seu acesso for liberado, você receberá uma confirmação e poderá fazer login normalmente.
              </p>
            </div>

            <Button 
              onClick={() => navigate("/login")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
            >
              Voltar para o login
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-4">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant">
                <Dumbbell className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">FitManager</h1>
              <p className="mt-1 text-sm text-muted-foreground">Cadastre um novo funcionário no sistema</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => navigate("/login")} 
                  className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="Voltar para Login"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-xl font-bold tracking-tight">Novo Usuário</h2>
              </div>

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
                      name="new-email" 
                      type="email" 
                      autoComplete="off"
                      value={formData.email} 
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@fitmanager.app"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="senha">Senha (min 8 caracteres) *</Label>
                    <Input 
                      id="senha" 
                      name="new-password" 
                      type="password" 
                      autoComplete="new-password"
                      value={formData.senha} 
                      onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                      placeholder="********"
                      className={errors.senha ? "border-destructive" : ""}
                    />
                    {errors.senha && <p className="text-xs text-destructive">{errors.senha}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="perfil">Perfil *</Label>
                    <Select value={formData.perfil} onValueChange={handleSelectChange}>
                      <SelectTrigger className={errors.perfil ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recepcionista">Recepcionista</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className={`flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-smooth ${avatarFile ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/40'}`}
                  >
                    {avatarFile ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span className="text-sm truncate max-w-[200px]">{avatarFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Clique para enviar foto</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => navigate("/login")} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Usuário
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        <p className="text-center text-xs text-muted-foreground">© 2026 FitManager. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
