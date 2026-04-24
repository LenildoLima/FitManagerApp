import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Check, Loader2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAlunos } from "@/hooks/useAlunos";
import { usePlanos } from "@/hooks/usePlanos";
import { supabase } from "@/lib/supabase";
import { gerarContrato } from "@/utils/gerarContrato";
import { mascararCPF, mascararTelefone } from "@/utils/formatters";

export default function StudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { atualizarAluno, fetchAlunos } = useAlunos();
  const { planos } = usePlanos();

  const [tab, setTab] = useState("dados");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    rg: "",
    data_nascimento: "",
    sexo_biologico: "" as any,
    telefone: "",
    celular: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    emergencia_nome: "",
    emergencia_parentesco: "",
    emergencia_telefone: "",
    indicado_por: "",
    observacoes: "",
    plano_id: "",
    status: "ativo" as any,
    data_inicio_plano: "",
    data_vencimento_plano: "",
    lgpd_aceito: false,
    foto_url: "",
    contrato_url: "",
    laudo_medico_url: "",
  });

  useEffect(() => {
    async function loadStudent() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('alunos')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            ...data,
            cpf: mascararCPF(data.cpf || ""),
            telefone: mascararTelefone(data.telefone || ""),
            celular: mascararTelefone(data.celular || ""),
            emergencia_telefone: mascararTelefone(data.emergencia_telefone || ""),
            lgpd_aceito: !!data.lgpd_aceito,
            data_inicio_plano: data.data_inicio_plano || "",
            data_vencimento_plano: data.data_vencimento_plano || "",
          });
        }
      } catch (error: any) {
        toast.error("Erro ao carregar aluno: " + error.message);
        navigate("/alunos");
      } finally {
        setInitialLoading(false);
      }
    }
    loadStudent();
  }, [id, navigate]);

  useEffect(() => {
    if (formData.plano_id && formData.data_inicio_plano) {
      const plano = planos.find(p => p.id === formData.plano_id);
      if (plano) {
        const inicio = new Date(formData.data_inicio_plano);
        let meses = 1;
        if (plano.duracao === 'trimestral') meses = 3;
        else if (plano.duracao === 'semestral') meses = 6;
        else if (plano.duracao === 'anual') meses = 12;

        const vencimento = new Date(inicio);
        vencimento.setMonth(inicio.getMonth() + meses);
        
        const newVencimento = vencimento.toISOString().split('T')[0];
        if (newVencimento !== formData.data_vencimento_plano) {
            setFormData(prev => ({
              ...prev,
              data_vencimento_plano: newVencimento
            }));
        }
      }
    }
  }, [formData.plano_id, formData.data_inicio_plano, planos, formData.data_vencimento_plano]);

  const handleDownloadContrato = () => {
    const plano = planos.find(p => p.id === formData.plano_id);
    if (!plano) return;
    gerarContrato(formData as any, plano);
    toast.info("Imprima o contrato, colha a assinatura do aluno e guarde uma cópia.");
  };

  const isStep1Complete = formData.nome && formData.cpf && formData.data_nascimento && formData.sexo_biologico && formData.celular && formData.email;
  const isStep2Complete = formData.plano_id;

  const [files, setFiles] = useState<{
    foto: File | null;
    contrato: File | null;
    laudo: File | null;
  }>({
    foto: null,
    contrato: null,
    laudo: null,
  });

  const fotoInputRef = useRef<HTMLInputElement>(null);
  const contratoInputRef = useRef<HTMLInputElement>(null);
  const laudoInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cpf") {
      formattedValue = mascararCPF(value);
    } else if (name === "telefone" || name === "celular" || name === "emergencia_telefone") {
      formattedValue = mascararTelefone(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof files) => {
    const file = e.target.files?.[0] || null;
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const uploadFile = async (file: File, folder: string, studentId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('fitmanager')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('fitmanager').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!id) return;
    if (!isStep1Complete) {
      toast.error("Preencha todos os campos obrigatórios (*)");
      setTab("dados");
      return;
    }

    if (!isStep2Complete) {
      toast.error("Selecione um plano para o aluno.");
      setTab("plano");
      return;
    }

    try {
      setLoading(true);

      let updates: any = { ...formData };
      delete updates.id;
      delete updates.created_at;
      delete updates.updated_at;
      delete updates.plano; // join data

      // Upload de novos arquivos se existirem
      if (files.foto) {
        updates.foto_url = await uploadFile(files.foto, 'fotos', id);
      }
      if (files.contrato) {
        updates.contrato_url = await uploadFile(files.contrato, 'contratos', id);
      }
      if (files.laudo) {
        updates.laudo_medico_url = await uploadFile(files.laudo, 'laudos', id);
      }

      await atualizarAluno(id, updates);

      toast.success("Cadastro atualizado com sucesso!");
      await fetchAlunos();
      navigate("/alunos");
    } catch (error: any) {
      console.error("Erro ao atualizar aluno:", error);
      toast.error("Erro ao atualizar: " + (error.message || "Verifique o console"));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/alunos" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Aluno</h1>
          <p className="text-sm text-muted-foreground">Atualize as informações do cadastro</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 bg-secondary/40">
          <TabsTrigger value="dados">1. Dados Pessoais</TabsTrigger>
          <TabsTrigger value="plano">2. Plano</TabsTrigger>
          <TabsTrigger value="docs">3. Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-5 space-y-5 rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nome completo *</Label>
              <Input name="nome" value={formData.nome || ""} onChange={handleInputChange} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>CPF *</Label>
              <Input name="cpf" value={formData.cpf || ""} onChange={handleInputChange} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1.5">
              <Label>RG</Label>
              <Input name="rg" value={formData.rg || ""} onChange={handleInputChange} placeholder="00.000.000-0" />
            </div>
            <div className="space-y-1.5">
              <Label>Data de nascimento *</Label>
              <Input name="data_nascimento" type="date" value={formData.data_nascimento || ""} onChange={handleInputChange} />
            </div>
            <div className="space-y-1.5">
              <Label>Sexo biológico *</Label>
              <Select value={formData.sexo_biologico} onValueChange={(v) => handleSelectChange("sexo_biologico", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input name="telefone" value={formData.telefone || ""} onChange={handleInputChange} placeholder="(11) 0000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Celular *</Label>
              <Input name="celular" value={formData.celular || ""} onChange={handleInputChange} placeholder="(11) 90000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input name="email" type="email" value={formData.email || ""} onChange={handleInputChange} placeholder="email@exemplo.com" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <h3 className="mb-3 text-sm font-semibold">Endereço</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <Input name="cep" value={formData.cep || ""} onChange={handleInputChange} placeholder="00000-000" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Logradouro</Label>
                <Input name="logradouro" value={formData.logradouro || ""} onChange={handleInputChange} placeholder="Rua / Avenida" />
              </div>
              <div className="space-y-1.5"><Label>Número</Label><Input name="numero" value={formData.numero || ""} onChange={handleInputChange} /></div>
              <div className="space-y-1.5"><Label>Bairro</Label><Input name="bairro" value={formData.bairro || ""} onChange={handleInputChange} /></div>
              <div className="space-y-1.5"><Label>Cidade</Label><Input name="cidade" value={formData.cidade || ""} onChange={handleInputChange} /></div>
              <div className="space-y-1.5"><Label>Estado</Label><Input name="estado" value={formData.estado || ""} onChange={handleInputChange} maxLength={2} placeholder="SP" /></div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <h3 className="mb-3 text-sm font-semibold">Contato de emergência</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5"><Label>Nome</Label><Input name="emergencia_nome" value={formData.emergencia_nome || ""} onChange={handleInputChange} /></div>
              <div className="space-y-1.5"><Label>Parentesco</Label><Input name="emergencia_parentesco" value={formData.emergencia_parentesco || ""} onChange={handleInputChange} /></div>
              <div className="space-y-1.5"><Label>Telefone</Label><Input name="emergencia_telefone" value={formData.emergencia_telefone || ""} onChange={handleInputChange} /></div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Foto de perfil</Label>
              <input type="file" ref={fotoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "foto")} />
              <div 
                onClick={() => fotoInputRef.current?.click()}
                className={`flex h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-smooth ${files.foto || formData.foto_url ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/40'}`}
              >
                {files.foto || formData.foto_url ? <Check className="h-5 w-5" /> : <Upload className="h-4 w-4" />}
                {files.foto ? files.foto.name : formData.foto_url ? "Foto vinculada (Clique para trocar)" : "Clique para enviar foto"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Quem indicou</Label>
              <Input name="indicado_por" value={formData.indicado_por || ""} onChange={handleInputChange} placeholder="Nome do indicador" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações internas</Label>
            <Textarea name="observacoes" value={formData.observacoes || ""} onChange={handleInputChange} placeholder="Notas para a equipe..." rows={3} />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setTab("plano")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Próximo: Plano
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="plano" className="mt-5 space-y-5 rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Plano *</Label>
              <Select value={formData.plano_id || ""} onValueChange={(v) => handleSelectChange("plano_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} — R$ {p.valor.toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(v) => handleSelectChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data de início *</Label>
              <Input name="data_inicio_plano" type="date" value={formData.data_inicio_plano || ""} onChange={handleInputChange} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de vencimento</Label>
              <Input name="data_vencimento_plano" type="date" value={formData.data_vencimento_plano || ""} readOnly className="bg-secondary/20" />
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setTab("dados")}>Voltar</Button>
            <Button onClick={() => setTab("docs")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Próximo: Documentos
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-5 space-y-5 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Gerar Contrato Automático</p>
                <p className="text-xs text-muted-foreground">Gere o PDF com os dados preenchidos para assinatura física.</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                disabled={!isStep1Complete || !isStep2Complete}
                onClick={handleDownloadContrato}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Gerar e baixar contrato
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Contrato assinado (PDF)</Label>
                <input type="file" ref={contratoInputRef} className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, "contrato")} />
                <div 
                  onClick={() => contratoInputRef.current?.click()}
                  className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-all ${files.contrato || formData.contrato_url ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/40'}`}
                >
                  {files.contrato || formData.contrato_url ? <Check className="h-6 w-6" /> : <Upload className="h-5 w-5" />}
                  <span className="text-xs">{files.contrato ? files.contrato.name : formData.contrato_url ? "Contrato vinculado (Clique para trocar)" : "Clique para enviar PDF"}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Laudo médico (PDF)</Label>
                <input type="file" ref={laudoInputRef} className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, "laudo")} />
                <div 
                  onClick={() => laudoInputRef.current?.click()}
                  className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-all ${files.laudo || formData.laudo_medico_url ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/20 text-muted-foreground hover:border-primary/40'}`}
                >
                  {files.laudo || formData.laudo_medico_url ? <Check className="h-6 w-6" /> : <Upload className="h-5 w-5" />}
                  <span className="text-xs">{files.laudo ? files.laudo.name : formData.laudo_medico_url ? "Laudo vinculado (Clique para trocar)" : "Clique para enviar PDF"}</span>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/20 p-4 transition-colors hover:bg-secondary/30">
              <input
                type="checkbox"
                checked={formData.lgpd_aceito}
                onChange={(e) => setFormData(prev => ({ ...prev, lgpd_aceito: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-border accent-primary"
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Termo LGPD aceito</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O aluno autoriza o tratamento dos seus dados pessoais conforme a Lei Geral de Proteção de Dados.
                </p>
              </div>
            </label>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setTab("plano")} type="button">Voltar</Button>
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="min-w-[160px] bg-gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
