export type SexoBiologico = 'masculino' | 'feminino'
export type StatusAluno = 'ativo' | 'inativo' | 'suspenso' | 'cancelado'
export type StatusAvaliacao = 'pendente' | 'aguardando_laudo' | 'aprovada' | 'reprovada'
export type StatusFicha = 'ativa' | 'arquivada'
export type StatusCobranca = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto'
export type DuracaoPlano = 'mensal' | 'trimestral' | 'semestral' | 'anual'
export type NivelCondicionamento = 'iniciante' | 'intermediario' | 'avancado'
export type PerfilUsuario = 'admin' | 'recepcionista' | 'professor' | 'aluno'
export type GrupoMuscular =
  | 'peito' | 'costas' | 'ombros' | 'biceps' | 'triceps'
  | 'antebraco' | 'abdomen' | 'quadriceps' | 'posterior_coxa'
  | 'gluteos' | 'panturrilha' | 'trapezio' | 'lombar' | 'full_body'

export interface Perfil {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  cref?: string
  ativo: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Plano {
  id: string
  nome: string
  descricao?: string
  duracao: DuracaoPlano
  valor: number
  acessos_por_dia: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Aluno {
  id: string
  nome: string
  cpf: string
  rg?: string
  data_nascimento: string
  sexo_biologico: SexoBiologico
  email?: string
  telefone?: string
  celular?: string
  foto_url?: string
  indicado_por?: string
  observacoes?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  emergencia_nome?: string
  emergencia_parentesco?: string
  emergencia_telefone?: string
  lgpd_aceito: boolean
  lgpd_aceito_em?: string
  plano_id?: string
  status: StatusAluno
  data_inicio_plano?: string
  data_vencimento_plano?: string
  contrato_url?: string
  laudo_medico_url?: string
  created_at: string
  updated_at: string
  // join
  plano?: Plano
}

export interface AvaliacaoFisica {
  id: string
  aluno_id: string
  professor_id?: string
  cref?: string
  status: StatusAvaliacao
  data_avaliacao: string
  proxima_avaliacao?: string
  nivel_condicionamento?: NivelCondicionamento
  parecer?: string
  restricoes?: string
  laudo_url?: string
  created_at: string
  updated_at: string
}

export interface Anamnese {
  id: string
  avaliacao_id: string
  objetivos: string[]
  praticou_antes?: boolean
  atividade_anterior?: string
  tempo_afastamento?: string
  doencas: string[]
  doencas_outras?: string
  usa_medicamentos?: boolean
  medicamentos_desc?: string
  usa_suplementos?: boolean
  suplementos_desc?: string
  tem_lesoes?: boolean
  lesoes_desc?: string
  tabagismo?: string
  alcool?: string
  qualidade_sono?: string
  ocupacao?: string
  regime_alimentar?: string
  alergias_alimentares?: string
  gestante_ou_pos_parto?: boolean
  created_at: string
}

export interface Parq {
  id: string
  avaliacao_id: string
  q1: boolean
  q2: boolean
  q3: boolean
  q4: boolean
  q5: boolean
  q6: boolean
  q7: boolean
  tem_restricao: boolean // gerado pelo banco
  created_at: string
}

export interface MedidasAntropometricas {
  id: string
  avaliacao_id: string
  peso_kg?: number
  altura_cm?: number
  imc?: number // gerado pelo banco
  circ_cintura?: number
  circ_quadril?: number
  circ_braco_d_rel?: number
  circ_braco_d_cont?: number
  circ_braco_e_rel?: number
  circ_braco_e_cont?: number
  circ_antebraco?: number
  circ_coxa_d?: number
  circ_coxa_e?: number
  circ_panturrilha_d?: number
  circ_panturrilha_e?: number
  circ_torax?: number
  circ_pescoco?: number
  protocolo_gordura?: string
  perc_gordura?: number
  massa_gorda_kg?: number
  massa_magra_kg?: number
  rcq?: number // gerado pelo banco
  pressao_sistolica?: number
  pressao_diastolica?: number
  fc_repouso?: number
  foto_frente_url?: string
  foto_perfil_d_url?: string
  foto_perfil_e_url?: string
  foto_costas_url?: string
  created_at: string
}

export interface Exercicio {
  id: string
  nome: string
  grupo_muscular: GrupoMuscular
  descricao?: string
  video_url?: string
  ativo: boolean
  created_at: string
}

export interface FichaTreino {
  id: string
  aluno_id: string
  professor_id?: string
  nome: string
  objetivo?: string
  nivel?: NivelCondicionamento
  data_inicio: string
  data_validade?: string
  status: StatusFicha
  observacoes?: string
  created_at: string
  updated_at: string
  divisoes?: DivisaoTreino[]
}

export interface DivisaoTreino {
  id: string
  ficha_id: string
  letra: string
  descricao?: string
  ordem: number
  created_at: string
  itens?: ItemTreino[]
}

export interface ItemTreino {
  id: string
  divisao_id: string
  exercicio_id: string
  ordem: number
  series?: number
  repeticoes?: string
  carga_kg?: number
  intervalo_seg?: number
  observacoes?: string
  created_at: string
  exercicio?: Exercicio
}

export interface Cobranca {
  id: string
  aluno_id: string
  plano_id?: string
  mes_referencia: string
  valor: number
  desconto: number
  valor_final: number // gerado pelo banco
  vencimento: string
  status: StatusCobranca
  pago_em?: string
  forma_pagamento?: FormaPagamento
  observacoes?: string
  created_at: string
  updated_at: string
  aluno?: Aluno
}

export interface Frequencia {
  id: string
  aluno_id: string
  entrada_em: string
  saida_em?: string
  origem: string
  aluno?: Aluno
}
