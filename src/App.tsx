import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentNew from "./pages/StudentNew";
import StudentProfile from "./pages/StudentProfile";
import Evaluations from "./pages/Evaluations";
import EvaluationNew from "./pages/EvaluationNew";
import FichasTreino from "./pages/FichasTreino";
import FichaNova from "./pages/FichaNova";
import FichaHistorico from "./pages/FichaHistorico";
import Exercicios from "./pages/Exercicios";
import Financial from "./pages/Financial";
import Plans from "./pages/Plans";
import StudentEdit from "./pages/StudentEdit";
import Usuarios from "./pages/Usuarios";
import UsuarioNovo from "./pages/UsuarioNovo";
import UsuarioEditar from "./pages/UsuarioEditar";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound.tsx";
import EsqueciSenha from "./pages/EsqueciSenha";
import MeuPerfil from "./pages/MeuPerfil";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/usuarios/novo" element={<UsuarioNovo />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alunos" element={<Students />} />
            <Route path="/alunos/novo" element={<StudentNew />} />
            <Route path="/alunos/editar/:id" element={<StudentEdit />} />
            <Route path="/alunos/:id" element={<StudentProfile />} />
            <Route path="/avaliacoes" element={<Evaluations />} />
            <Route path="/avaliacoes/nova/:studentId" element={<EvaluationNew />} />
            <Route path="/fichas" element={<FichasTreino />} />
            <Route path="/fichas/nova/:aluno_id" element={<FichaNova />} />
            <Route path="/fichas/:id/editar" element={<FichaNova />} />
            <Route path="/fichas/:aluno_id/historico" element={<FichaHistorico />} />
            <Route path="/exercicios" element={<Exercicios />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/usuarios/:id/editar" element={<UsuarioEditar />} />
            <Route path="/planos" element={<Plans />} />
            <Route path="/agenda" element={<Placeholder title="Agenda" />} />
            <Route path="/configuracoes" element={<Placeholder title="Configurações" />} />
            <Route path="/meu-perfil" element={<MeuPerfil />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
