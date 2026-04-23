import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { plans } from "@/lib/mock-data";
import { toast } from "sonner";

export default function StudentNew() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("dados");
  const [lgpd, setLgpd] = useState(false);

  const handleSave = () => {
    if (!lgpd) {
      toast.error("É necessário aceitar o termo LGPD.");
      return;
    }
    toast.success("Aluno cadastrado com sucesso!");
    navigate("/alunos");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/alunos" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Aluno</h1>
          <p className="text-sm text-muted-foreground">Preencha as três etapas para concluir o cadastro</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 bg-secondary/40">
          <TabsTrigger value="dados">1. Dados Pessoais</TabsTrigger>
          <TabsTrigger value="plano">2. Plano</TabsTrigger>
          <TabsTrigger value="docs">3. Documentos</TabsTrigger>
        </TabsList>

        {/* Tab 1 */}
        <TabsContent value="dados" className="mt-5 space-y-5 rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Nome completo *</Label><Input placeholder="Nome completo" /></div>
            <div className="space-y-1.5"><Label>CPF *</Label><Input placeholder="000.000.000-00" /></div>
            <div className="space-y-1.5"><Label>RG</Label><Input placeholder="00.000.000-0" /></div>
            <div className="space-y-1.5"><Label>Data de nascimento *</Label><Input type="date" /></div>
            <div className="space-y-1.5">
              <Label>Sexo biológico *</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Telefone</Label><Input placeholder="(11) 0000-0000" /></div>
            <div className="space-y-1.5"><Label>Celular *</Label><Input placeholder="(11) 90000-0000" /></div>
            <div className="space-y-1.5"><Label>E-mail *</Label><Input type="email" placeholder="email@exemplo.com" /></div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <h3 className="mb-3 text-sm font-semibold">Endereço</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5"><Label>CEP</Label><Input placeholder="00000-000" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label>Logradouro</Label><Input placeholder="Rua / Avenida" /></div>
              <div className="space-y-1.5"><Label>Número</Label><Input /></div>
              <div className="space-y-1.5"><Label>Bairro</Label><Input /></div>
              <div className="space-y-1.5"><Label>Cidade</Label><Input /></div>
              <div className="space-y-1.5"><Label>Estado</Label><Input maxLength={2} placeholder="SP" /></div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <h3 className="mb-3 text-sm font-semibold">Contato de emergência</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5"><Label>Nome</Label><Input /></div>
              <div className="space-y-1.5"><Label>Parentesco</Label><Input /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input /></div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Foto de perfil</Label>
              <div className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/20 text-sm text-muted-foreground transition-smooth hover:border-primary/40">
                <Upload className="h-4 w-4" />
                Clique para enviar
              </div>
            </div>
            <div className="space-y-1.5"><Label>Quem indicou</Label><Input placeholder="Nome do indicador" /></div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações internas</Label>
            <Textarea placeholder="Notas para a equipe..." rows={3} />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setTab("plano")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Próximo: Plano
            </Button>
          </div>
        </TabsContent>

        {/* Tab 2 */}
        <TabsContent value="plano" className="mt-5 space-y-5 rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Plano *</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — R$ {p.price.toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select defaultValue="Ativo">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Data de início *</Label><Input type="date" /></div>
            <div className="space-y-1.5">
              <Label>Data de vencimento</Label>
              <Input type="date" disabled className="opacity-70" />
              <p className="text-xs text-muted-foreground">Calculada automaticamente conforme o plano</p>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setTab("dados")}>Voltar</Button>
            <Button onClick={() => setTab("docs")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Próximo: Documentos
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3 */}
        <TabsContent value="docs" className="mt-5 space-y-5 rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Contrato assinado (PDF)", required: true },
              { label: "Laudo médico (PDF)", required: false },
            ].map((d) => (
              <div key={d.label} className="space-y-1.5">
                <Label>{d.label} {d.required && "*"}</Label>
                <div className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-secondary/20 text-sm text-muted-foreground transition-smooth hover:border-primary/40">
                  <Upload className="h-5 w-5" />
                  <span>Clique para enviar PDF</span>
                </div>
              </div>
            ))}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/20 p-4">
            <input
              type="checkbox"
              checked={lgpd}
              onChange={(e) => setLgpd(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            />
            <div>
              <p className="text-sm font-medium">Termo LGPD aceito</p>
              <p className="text-xs text-muted-foreground">
                O aluno autoriza o tratamento dos seus dados pessoais conforme a Lei Geral de Proteção de Dados.
                {lgpd && <span className="ml-2 text-primary">Registrado em {new Date().toLocaleString("pt-BR")}</span>}
              </p>
            </div>
          </label>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setTab("plano")}>Voltar</Button>
            <Button onClick={handleSave} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Check className="mr-2 h-4 w-4" />
              Concluir cadastro
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
