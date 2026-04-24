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
import Workouts from "./pages/Workouts";
import WorkoutNew from "./pages/WorkoutNew";
import Financial from "./pages/Financial";
import Plans from "./pages/Plans";
import StudentEdit from "./pages/StudentEdit";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alunos" element={<Students />} />
            <Route path="/alunos/novo" element={<StudentNew />} />
            <Route path="/alunos/editar/:id" element={<StudentEdit />} />
            <Route path="/alunos/:id" element={<StudentProfile />} />
            <Route path="/avaliacoes" element={<Evaluations />} />
            <Route path="/avaliacoes/nova/:studentId" element={<EvaluationNew />} />
            <Route path="/fichas" element={<Workouts />} />
            <Route path="/fichas/nova/:studentId" element={<WorkoutNew />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/planos" element={<Plans />} />
            <Route path="/agenda" element={<Placeholder title="Agenda" />} />
            <Route path="/configuracoes" element={<Placeholder title="Configurações" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
