import { useEffect, useState, useRef } from "react";
import { Building2, Settings2, Bell, Save, Upload, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// ─── Mask helpers ─────────────────────────────────────────────────────────────

function maskCNPJ(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskCEP(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 8);
  return n.replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskPhone(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10) return n.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return n.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

// ─── Toggle Component ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? "bg-primary" : "bg-secondary"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  nome: "FitManager",
  cnpj: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  telefone: "",
  email: "",
  logo_url: "",
};

const DEFAULT_PARAMS = {
  dias_bloqueio: 5,
  dias_validade_ficha: 30,
  dias_alerta_ficha: 7,
  dias_reavaliacao: 60,
};

const DEFAULT_NOTIF = {
  vencimento_plano: true,
  ficha_vencida: true,
  avaliacao_pendente: true,
  inadimplencia_admin: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Configuracoes() {
  const { perfil } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [notif, setNotif] = useState(DEFAULT_NOTIF);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const c = localStorage.getItem("fitmanager_config");
      const p = localStorage.getItem("fitmanager_params");
      const n = localStorage.getItem("fitmanager_notif");
      if (c) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(c) });
      if (p) setParams({ ...DEFAULT_PARAMS, ...JSON.parse(p) });
      if (n) setNotif({ ...DEFAULT_NOTIF, ...JSON.parse(n) });
    } catch {
      /* ignore */
    }
  }, []);

  // ── Guard: admin only ────────────────────────────────────────────────────────
  if (perfil && perfil.perfil !== "admin") {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive/60" />
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Esta página está disponível apenas para administradores do sistema.
        </p>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSaveConfig = () => {
    localStorage.setItem("fitmanager_config", JSON.stringify(config));
    toast.success("Dados da academia salvos!");
  };

  const handleSaveParams = () => {
    localStorage.setItem("fitmanager_params", JSON.stringify(params));
    toast.success("Parâmetros do sistema salvos!");
  };

  const handleSaveNotif = () => {
    localStorage.setItem("fitmanager_notif", JSON.stringify(notif));
    toast.success("Preferências de notificações salvas!");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const ext = file.name.split(".").pop();
      const path = `logo/logo_academia.${ext}`;
      const { error } = await supabase.storage.from("fitmanager").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("fitmanager").getPublicUrl(path);
      setConfig((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success("Logo enviado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar logo: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize o sistema de acordo com sua academia</p>
      </div>

      {/* ══ SEÇÃO 1: Dados da Academia ══════════════════════════════════════ */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Dados da Academia</h2>
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo da Academia</Label>
          <div className="flex items-center gap-4">
            {config.logo_url ? (
              <img src={config.logo_url} alt="Logo" className="h-16 w-16 rounded-xl object-contain border border-border bg-secondary/30" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20">
                <Building2 className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
                className="gap-2"
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? "Enviando..." : "Carregar logo"}
              </Button>
              <p className="mt-1 text-[11px] text-muted-foreground">PNG, JPG ou SVG. Máx 2MB.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome da Academia</Label>
            <Input
              value={config.nome}
              onChange={(e) => setConfig({ ...config, nome: e.target.value })}
              placeholder="FitManager"
            />
          </div>

          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <Input
              value={config.cnpj}
              onChange={(e) => setConfig({ ...config, cnpj: maskCNPJ(e.target.value) })}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              value={config.telefone}
              onChange={(e) => setConfig({ ...config, telefone: maskPhone(e.target.value) })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-1.5">
            <Label>E-mail de contato</Label>
            <Input
              type="email"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="contato@academia.com"
            />
          </div>
        </div>

        {/* Endereço */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">Endereço</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input
                value={config.cep}
                onChange={(e) => setConfig({ ...config, cep: maskCEP(e.target.value) })}
                placeholder="00000-000"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Logradouro</Label>
              <Input
                value={config.logradouro}
                onChange={(e) => setConfig({ ...config, logradouro: e.target.value })}
                placeholder="Rua, Avenida..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Número</Label>
              <Input
                value={config.numero}
                onChange={(e) => setConfig({ ...config, numero: e.target.value })}
                placeholder="123"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bairro</Label>
              <Input
                value={config.bairro}
                onChange={(e) => setConfig({ ...config, bairro: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input
                value={config.cidade}
                onChange={(e) => setConfig({ ...config, cidade: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado (UF)</Label>
              <Input
                value={config.estado}
                maxLength={2}
                onChange={(e) => setConfig({ ...config, estado: e.target.value.toUpperCase() })}
                placeholder="SP"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveConfig} className="bg-gradient-primary text-primary-foreground hover:opacity-90 gap-2">
            <Save className="h-4 w-4" /> Salvar dados
          </Button>
        </div>
      </section>

      {/* ══ SEÇÃO 2: Parâmetros do Sistema ══════════════════════════════════ */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Parâmetros do Sistema</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Dias de atraso para bloquear acesso</Label>
            <Input
              type="number"
              min={0}
              value={params.dias_bloqueio}
              onChange={(e) => setParams({ ...params, dias_bloqueio: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground">Bloqueia o aluno após N dias de inadimplência</p>
          </div>

          <div className="space-y-1.5">
            <Label>Validade padrão da ficha de treino (dias)</Label>
            <Input
              type="number"
              min={1}
              value={params.dias_validade_ficha}
              onChange={(e) => setParams({ ...params, dias_validade_ficha: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground">Usado ao criar nova ficha sem data definida</p>
          </div>

          <div className="space-y-1.5">
            <Label>Dias para alertar ficha a vencer</Label>
            <Input
              type="number"
              min={1}
              value={params.dias_alerta_ficha}
              onChange={(e) => setParams({ ...params, dias_alerta_ficha: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground">Exibe alerta N dias antes do vencimento</p>
          </div>

          <div className="space-y-1.5">
            <Label>Dias para reavaliação física</Label>
            <Input
              type="number"
              min={1}
              value={params.dias_reavaliacao}
              onChange={(e) => setParams({ ...params, dias_reavaliacao: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground">Intervalo recomendado entre avaliações físicas</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveParams} className="bg-gradient-primary text-primary-foreground hover:opacity-90 gap-2">
            <Save className="h-4 w-4" /> Salvar parâmetros
          </Button>
        </div>
      </section>

      {/* ══ SEÇÃO 3: Notificações ════════════════════════════════════════════ */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Notificações</h2>
        </div>

        <div className="space-y-4">
          {(
            [
              { key: "vencimento_plano",    label: "Notificar vencimento do plano",       desc: "Avisa quando o plano de um aluno está próximo de vencer" },
              { key: "ficha_vencida",       label: "Notificar ficha vencida",              desc: "Alerta quando a ficha de treino de um aluno expirou" },
              { key: "avaliacao_pendente",  label: "Notificar avaliação pendente",         desc: "Lembra que um aluno está aguardando reavaliação física" },
              { key: "inadimplencia_admin",  label: "Alertar admin sobre inadimplência",   desc: "Envia alerta ao administrador sobre alunos inadimplentes" },
            ] as const
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Toggle
                checked={notif[key]}
                onChange={(v) => setNotif({ ...notif, [key]: v })}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSaveNotif} className="bg-gradient-primary text-primary-foreground hover:opacity-90 gap-2">
            <Save className="h-4 w-4" /> Salvar preferências
          </Button>
        </div>
      </section>
    </div>
  );
}
