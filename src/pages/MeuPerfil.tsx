import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Upload, Save, Eye, EyeOff, User, Lock, Mail, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function MeuPerfil() {
  const { user, perfil, fetchPerfil } = useAuth() as any; // Assuming fetchPerfil might be available or we can call fetch directly
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: perfil?.nome || "",
    cref: perfil?.cref || "",
    avatar_url: perfil?.avatar_url || "",
  });

  const [passwordData, setPasswordData] = useState({
    novaSenha: "",
    confirmarSenha: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (perfil) {
      setFormData({
        nome: perfil.nome,
        cref: perfil.cref || "",
        avatar_url: perfil.avatar_url || "",
      });
    }
  }, [perfil]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const handleSaveProfile = async () => {
    if (!formData.nome) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      setSaving(true);

      // 1. Upload de avatar se houver novo
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatares/${user.id}.${fileExt}`;
        
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
          cref: perfil.perfil === 'professor' ? formData.cref : null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success("Perfil atualizado com sucesso!");
      if (fetchPerfil) fetchPerfil(user.id);
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.novaSenha || passwordData.novaSenha.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: passwordData.novaSenha });
      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setPasswordData({ novaSenha: "", confirmarSenha: "" });
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
      </div>

      {/* Seção 1: Meus Dados */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Meus Dados</h2>
        </div>

        <div className="space-y-6">
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
                className={`flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-smooth overflow-hidden ${avatarFile || formData.avatar_url ? 'border-primary' : 'border-border bg-secondary/20 hover:border-primary/40'}`}
              >
                {avatarFile ? (
                  <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="h-full w-full object-cover" />
                ) : formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                Alterar foto
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" name="nome" value={formData.nome} onChange={handleInputChange} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={perfil?.email || ""} disabled className="bg-secondary/40" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perfil_label">Perfil</Label>
              <Input id="perfil_label" value={perfil?.perfil?.charAt(0).toUpperCase() + perfil?.perfil?.slice(1)} disabled className="bg-secondary/40" />
            </div>

            {perfil?.perfil === "professor" && (
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="cref">Número do CREF</Label>
                <Input id="cref" name="cref" value={formData.cref} onChange={handleInputChange} placeholder="000000-G/SP" />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-gradient-primary text-primary-foreground shadow-glow">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>

      {/* Seção 2: Alterar Senha */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Alterar Senha</h2>
        </div>

        <div className="space-y-4">

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <Input 
              id="novaSenha" 
              name="novaSenha" 
              type={showPassword ? "text" : "password"} 
              value={passwordData.novaSenha} 
              onChange={handlePasswordChange}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
            <Input 
              id="confirmarSenha" 
              name="confirmarSenha" 
              type={showPassword ? "text" : "password"} 
              value={passwordData.confirmarSenha} 
              onChange={handlePasswordChange}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpdatePassword} disabled={loading} variant="secondary">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Alterar senha
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
