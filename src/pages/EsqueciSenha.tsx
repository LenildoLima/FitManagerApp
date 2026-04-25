import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, ArrowLeft, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function EsqueciSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // 1. Verificar se o email existe na tabela perfis
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', email)
        .single();

      if (perfilError || !perfil) {
        toast.error("E-mail não encontrado no sistema");
        return;
      }

      // 2. Inserir registro em solicitacoes_senha
      const { error: insertError } = await supabase
        .from('solicitacoes_senha')
        .insert({
          perfil_id: perfil.id,
          email: email,
          status: 'pendente'
        });

      if (insertError) throw insertError;

      setShowSuccess(true);
    } catch (error: any) {
      console.error("Erro ao solicitar senha:", error);
      toast.error("Erro ao processar solicitação: " + (error.message || "Tente novamente"));
    } finally {
      setLoading(false);
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
          {showSuccess ? (
            <div className="space-y-6 text-center animate-scale-in">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <Clock className="h-10 w-10" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Solicitação enviada!</h2>
                <p className="text-muted-foreground leading-relaxed">
                  O administrador definirá uma nova senha para você em breve. 
                  Entre em contato com a recepção se precisar de urgência.
                </p>
              </div>

              <Button 
                onClick={() => navigate("/login")}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
              >
                Voltar ao login
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Link to="/login" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <h2 className="text-xl font-bold tracking-tight">Esqueci minha senha</h2>
              </div>
              
              <p className="mb-6 text-sm text-muted-foreground">
                Digite seu email para solicitar uma nova senha ao administrador.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="pl-10"
                      required 
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90" 
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar solicitação"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">© 2026 FitManager. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
