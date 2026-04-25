# FitManager 🏋️‍♂️

FitManager é um sistema moderno, rápido e completo para gestão de academias, studios de personal ou centros de treinamento. Construído com as tecnologias mais recentes para oferecer uma experiência fluida tanto para administradores quanto para instrutores.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Vite.
- **Estilização e UI:** Tailwind CSS, shadcn/ui, Lucide Icons.
- **Backend as a Service:** Supabase (PostgreSQL, Supabase Auth, Row Level Security - RLS).
- **Serverless:** Supabase Edge Functions (para criação segura de usuários e resets de senha).
- **Roteamento:** React Router (v6+ com future flags).
- **State/Data Fetching:** Custom Hooks e Supabase JS Client.

## ✨ Funcionalidades

### 👥 Gestão de Alunos e Usuários
- Cadastro completo de alunos com planos e controle de vencimentos.
- Dashboard financeiro apontando alunos ativos vs. inadimplentes.
- Controle de equipe (Administradores vs Professores), cada um contendo as suas permissões via Role-Based Access Control construído com Supabase (tabela `perfis`).

### 📊 Avaliações Físicas
- Anamnese, dobras cutâneas (protocolos comuns) e medições de perimetria.
- Cálculo automático de IMC, nível de condicionamento e percentual de gordura.
- Visualização de progresso do aluno.

### 🏋️ Gestão de Fichas de Treino
- **Restrição de Segurança:** Criação de treino bloqueada caso o aluno não tenha avaliação física aprovada.
- **Prescritor Dinâmico:** Construtor de fichas dividido em abas (Treino A, B, C...).
- **Banco de Exercícios:** Busca instantânea por grupos musculares com links visuais (YouTube/Vimeo) da execução.
- **Templates:** Crie uma ficha ótima uma vez, salve como template e utilize rapidamente em múltiplos alunos.
- **Acompanhamento de Vencimento:** Alerta de fichas que vão vencer dentro de 7 dias direto no painel principal.

### 🔐 Segurança e Autenticação
- Fluxos completos de **Login** e **Recuperação de Senha** isolados para o usuário e aprovados via dashboard pelo Administrador.
- Alteração segura do próprio perfil sem riscos à arquitetura original da base de dados.
- Row Level Security garante que informações confidenciais sejam alteradas apenas pela _Edge Function_ rodando em backend real (`service_role`).

## 🛠️ Como rodar o projeto localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/en/) (v18+)
- Conta no [Supabase](https://supabase.com/)

### 2. Clonando o repósitório
```bash
git clone https://github.com/LenildoLima/FitManagerApp.git
cd FitManagerApp
```

### 3. Instalação das dependências
```bash
npm install
```

### 4. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase (Atenção: nunca suba credenciais secretas pro repositório):

```env
VITE_SUPABASE_URL=SuaSupabaseUrl
VITE_SUPABASE_ANON_KEY=SuaSupabaseAnonKey
```

### 5. Executando as Edge Functions localmente (Opcional - caso vá mexer no backend)
Com as credenciais instaladas e a Supabase CLI pronta, sirva as funções ativas do projeto:
```bash
supabase functions serve criar-usuario --no-verify-jwt
supabase functions serve redefinir-senha --no-verify-jwt
```

### 6. Iniciando o servidor web
```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no seu navegador para ver o sistema rodando.

---
Desenvolvido pensando na agilidade de quem trabalha com alta capacidade de alunos diariamente.
