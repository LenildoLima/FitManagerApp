import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dumbbell, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInactiveWarning, setShowInactiveWarning] = useState(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowInactiveWarning(false);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      // PROBLEMA 3 — Bloquear login de usuário inativo
      const { data: profile, error: profileError } = await supabase
        .from('perfis')
        .select('ativo')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile && !profile.ativo) {
        await supabase.auth.signOut();
        setShowInactiveWarning(true);
        
        // Auto-hide após 8 segundos
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        warningTimerRef.current = setTimeout(() => {
          setShowInactiveWarning(false);
        }, 8000);

        return;
      }

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') setEmail(value);
    else setPassword(value);
    
    // Some automaticamente ao começar a digitar novamente
    if (showInactiveWarning) {
      setShowInactiveWarning(false);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant">
            <Dumbbell className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FitManager</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sistema de gestão para academias</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => handleInputChange('email', e.target.value)} 
                placeholder="seu@email.com"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/esqueci-senha" title="Solicitar nova senha ao administrador" className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => handleInputChange('password', e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {showInactiveWarning && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-2 rounded-lg border border-orange-500/50 bg-orange-500/10 p-4 text-orange-200">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold leading-none">Acesso pendente de ativação</h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    Seu cadastro ainda não foi ativado pelo administrador. 
                    Entre em contato com a administração da academia para liberar seu acesso.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não possui uma conta?{" "}
              <button 
                onClick={() => navigate("/usuarios/novo")}
                className="font-medium text-primary hover:underline focus:outline-none"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">© 2026 FitManager. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
