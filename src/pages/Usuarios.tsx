import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Users as UsersIcon, Pencil, Power, PowerOff, Key, Copy, Eye, EyeOff, RotateCcw, TriangleAlert, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Perfil } from "@/types/database";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Usuarios() {
  const navigate = useNavigate();
  const { perfil: currentUserPerfil } = useAuth();
  const [users, setUsers] = useState<Perfil[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal de Redefinição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetingLoading, setResetingLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_senha')
        .select('*, perfil:perfis(nome)')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar solicitações:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

  const toggleStatus = async (user: Perfil) => {
    if (user.perfil === 'admin') {
      toast.error("Usuários administradores não podem ser desativados.");
      return;
    }

    try {
      const { error } = await supabase
        .from('perfis')
        .update({ ativo: !user.ativo })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success(`Usuário ${user.ativo ? 'desativado' : 'ativado'} com sucesso!`);
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao alterar status: " + error.message);
    }
  };

  const handleOpenResetModal = (request: any) => {
    setSelectedRequest(request);
    setNewPassword("");
    setConfirmPassword("");
    setIsModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Senha copiada para a área de transferência!");
  };

  const handleConfirmReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setResetingLoading(true);
      
      // 1. Chamar Edge Function
      const { error: functionError } = await supabase.functions.invoke('redefinir-senha', {
        body: { userId: selectedRequest.perfil_id, novaSenha: newPassword }
      });

      if (functionError) throw functionError;

      // 2. Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('solicitacoes_senha')
        .update({ status: 'resolvido', resolvido_em: new Date().toISOString() })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      toast.success("Senha redefinida! Informe a nova senha ao usuário.");
      setIsModalOpen(false);
      fetchRequests();
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast.error("Erro ao redefinir: " + error.message);
    } finally {
      setResetingLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getProfileBadgeVariant = (perfil: string) => {
    switch (perfil) {
      case 'admin': return 'destructive'; // Will style custom below or used mapped ones
      case 'recepcionista': return 'primary';
      case 'professor': return 'success';
      default: return 'muted';
    }
  };

  const getProfileColor = (perfil: string) => {
    switch (perfil) {
      case 'admin': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'recepcionista': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'professor': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading && users.length === 0) {
    return <div className="flex h-[80vh] items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
            {requests.length > 0 && (
              <span className="flex h-6 items-center rounded-full bg-amber-500 px-2.5 text-xs font-bold text-white animate-pulse">
                {requests.length} {requests.length === 1 ? 'solicitação' : 'solicitações'} de senha
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{filteredUsers.length} funcionário(s) cadastrado(s)</p>
        </div>
        <Button
          onClick={() => navigate("/usuarios/novo")}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
        >
          <UsersIcon className="h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-lg border border-border bg-secondary/40 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {requests.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold tracking-tight">Solicitações de Redefinição de Senha</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((req) => (
              <div key={req.id} className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm transition-smooth hover:bg-amber-500/10">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-amber-600 truncate mr-2">{req.perfil?.nome}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(req.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                  <Button 
                    onClick={() => handleOpenResetModal(req)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs h-8"
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Redefinir senha
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Funcionário</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3 text-left">CREF</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="transition-smooth hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.nome} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                          {u.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                      )}
                      <p className="font-medium">{u.nome}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getProfileColor(u.perfil)}`}>
                      {u.perfil.charAt(0).toUpperCase() + u.perfil.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.cref || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge variant={u.ativo ? "success" : "muted"}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {u.perfil !== 'admin' && (
                        <>
                          <Link 
                            to={`/usuarios/${u.id}/editar`} 
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" 
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => toggleStatus(u)}
                            className={`rounded-md p-1.5 transition-colors ${u.ativo ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive' : 'text-muted-foreground hover:bg-success/10 hover:text-success'}`}
                            title={u.ativo ? "Desativar" : "Ativar"}
                          >
                            {u.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </button>
                        </>
                      )}
                      {u.perfil === 'admin' && (
                        <span className="text-xs text-muted-foreground italic px-2">Sistema</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Redefinição de Senha */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              Redefinir senha de {selectedRequest?.perfil?.nome}
            </DialogTitle>
            <DialogDescription>
              Você definirá uma senha temporária em nome deste usuário. Informe a nova senha a ele após confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newPassword">Nova senha temporária</Label>
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 caracteres"
                  autoComplete="new-password"
                />
                <Button 
                  variant="outline" 
                   size="icon" 
                   title="Copiar senha"
                   onClick={() => copyToClipboard(newPassword)}
                   disabled={!newPassword}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <Button 
              type="button" 
              variant="secondary" 
              className="w-full text-xs"
              onClick={generateRandomPassword}
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Gerar senha aleatória
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={resetingLoading}>
              Cancelar
            </Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white" 
              onClick={handleConfirmReset}
              disabled={resetingLoading}
            >
              {resetingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar Redefinição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
