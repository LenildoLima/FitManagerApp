export type StudentStatus = "Ativo" | "Inativo" | "Suspenso" | "Cancelado";
export type EvaluationStatus = "Aprovada" | "Pendente" | "Aguardando laudo" | "Sem avaliação";
export type PaymentStatus = "Pendente" | "Pago" | "Atrasado";

export interface Plan {
  id: string;
  name: string;
  description: string;
  duration: "Mensal" | "Trimestral" | "Semestral" | "Anual";
  price: number;
  dailyAccess: number;
}

export interface Payment {
  id: string;
  studentId: string;
  monthRef: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string;
  method?: string;
}

export interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  sex: "Masculino" | "Feminino";
  photoUrl?: string;
  planId: string;
  startDate: string;
  dueDate: string;
  status: StudentStatus;
  evaluationStatus: EvaluationStatus;
  lastCheckIn?: string;
  workoutValidUntil?: string;
  lgpdAccepted: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
}

export interface WorkoutSheet {
  id: string;
  studentId: string;
  name: string;
  goal: string;
  level: string;
  startDate: string;
  validUntil: string;
  active: boolean;
  divisions: {
    letter: string;
    exercises: {
      exerciseId: string;
      sets: number;
      reps: string;
      load: string;
      rest: number;
      notes?: string;
    }[];
  }[];
}

export const plans: Plan[] = [
  { id: "p1", name: "Mensal Básico", description: "Acesso à musculação", duration: "Mensal", price: 99.9, dailyAccess: 1 },
  { id: "p2", name: "Trimestral Plus", description: "Musculação + aulas coletivas", duration: "Trimestral", price: 269.9, dailyAccess: 2 },
  { id: "p3", name: "Anual Premium", description: "Acesso total + personal", duration: "Anual", price: 1199.9, dailyAccess: 3 },
];

export const exercises: Exercise[] = [
  { id: "e1", name: "Supino reto com barra", muscleGroup: "Peito" },
  { id: "e2", name: "Supino inclinado halteres", muscleGroup: "Peito" },
  { id: "e3", name: "Crucifixo máquina", muscleGroup: "Peito" },
  { id: "e4", name: "Puxada frontal", muscleGroup: "Costas" },
  { id: "e5", name: "Remada curvada", muscleGroup: "Costas" },
  { id: "e6", name: "Levantamento terra", muscleGroup: "Costas" },
  { id: "e7", name: "Agachamento livre", muscleGroup: "Pernas" },
  { id: "e8", name: "Leg press 45°", muscleGroup: "Pernas" },
  { id: "e9", name: "Cadeira extensora", muscleGroup: "Pernas" },
  { id: "e10", name: "Mesa flexora", muscleGroup: "Pernas" },
  { id: "e11", name: "Desenvolvimento militar", muscleGroup: "Ombros" },
  { id: "e12", name: "Elevação lateral", muscleGroup: "Ombros" },
  { id: "e13", name: "Rosca direta", muscleGroup: "Bíceps" },
  { id: "e14", name: "Tríceps corda", muscleGroup: "Tríceps" },
  { id: "e15", name: "Abdominal infra", muscleGroup: "Abdômen" },
  { id: "e16", name: "Prancha isométrica", muscleGroup: "Core" },
];

export const students: Student[] = [
  {
    id: "s1", name: "Lucas Almeida", cpf: "123.456.789-00", email: "lucas@email.com", phone: "(11) 99999-1111",
    birthDate: "1995-03-12", sex: "Masculino", planId: "p2", startDate: "2025-01-15", dueDate: "2026-04-15",
    status: "Ativo", evaluationStatus: "Aprovada", lastCheckIn: "2026-04-22", workoutValidUntil: "2026-07-15", lgpdAccepted: true,
  },
  {
    id: "s2", name: "Mariana Costa", cpf: "234.567.890-11", email: "mariana@email.com", phone: "(11) 98888-2222",
    birthDate: "1998-07-22", sex: "Feminino", planId: "p1", startDate: "2026-03-01", dueDate: "2026-04-01",
    status: "Ativo", evaluationStatus: "Sem avaliação", lastCheckIn: "2026-04-20", lgpdAccepted: true,
  },
  {
    id: "s3", name: "Pedro Santos", cpf: "345.678.901-22", email: "pedro@email.com", phone: "(11) 97777-3333",
    birthDate: "1990-11-05", sex: "Masculino", planId: "p3", startDate: "2025-08-10", dueDate: "2026-08-10",
    status: "Ativo", evaluationStatus: "Aprovada", lastCheckIn: "2026-04-23", workoutValidUntil: "2026-05-10", lgpdAccepted: true,
  },
  {
    id: "s4", name: "Ana Oliveira", cpf: "456.789.012-33", email: "ana@email.com", phone: "(11) 96666-4444",
    birthDate: "2000-01-30", sex: "Feminino", planId: "p2", startDate: "2026-01-20", dueDate: "2026-04-20",
    status: "Ativo", evaluationStatus: "Aguardando laudo", lastCheckIn: "2026-04-05", lgpdAccepted: true,
  },
  {
    id: "s5", name: "Rafael Souza", cpf: "567.890.123-44", email: "rafael@email.com", phone: "(11) 95555-5555",
    birthDate: "1988-09-14", sex: "Masculino", planId: "p1", startDate: "2025-11-01", dueDate: "2026-03-01",
    status: "Ativo", evaluationStatus: "Aprovada", lastCheckIn: "2026-03-28", workoutValidUntil: "2026-04-01", lgpdAccepted: true,
  },
  {
    id: "s6", name: "Juliana Pereira", cpf: "678.901.234-55", email: "juliana@email.com", phone: "(11) 94444-6666",
    birthDate: "1993-05-18", sex: "Feminino", planId: "p3", startDate: "2025-06-01", dueDate: "2026-06-01",
    status: "Ativo", evaluationStatus: "Aprovada", lastCheckIn: "2026-04-22", workoutValidUntil: "2026-08-01", lgpdAccepted: true,
  },
  {
    id: "s7", name: "Carlos Mendes", cpf: "789.012.345-66", email: "carlos@email.com", phone: "(11) 93333-7777",
    birthDate: "1985-12-01", sex: "Masculino", planId: "p1", startDate: "2026-02-10", dueDate: "2026-04-10",
    status: "Suspenso", evaluationStatus: "Sem avaliação", lastCheckIn: "2026-03-15", lgpdAccepted: true,
  },
];

export const payments: Payment[] = [
  { id: "pay1", studentId: "s1", monthRef: "2026-04", amount: 89.97, dueDate: "2026-04-15", status: "Pago", paidAt: "2026-04-10", method: "PIX" },
  { id: "pay2", studentId: "s2", monthRef: "2026-04", amount: 99.9, dueDate: "2026-04-01", status: "Atrasado" },
  { id: "pay3", studentId: "s3", monthRef: "2026-04", amount: 99.99, dueDate: "2026-04-10", status: "Pago", paidAt: "2026-04-08", method: "Cartão" },
  { id: "pay4", studentId: "s4", monthRef: "2026-04", amount: 89.97, dueDate: "2026-04-20", status: "Pendente" },
  { id: "pay5", studentId: "s5", monthRef: "2026-03", amount: 99.9, dueDate: "2026-03-01", status: "Atrasado" },
  { id: "pay6", studentId: "s7", monthRef: "2026-04", amount: 99.9, dueDate: "2026-04-10", status: "Atrasado" },
];

export const workouts: WorkoutSheet[] = [
  {
    id: "w1", studentId: "s1", name: "Hipertrofia AB", goal: "Ganho de massa", level: "Intermediário",
    startDate: "2026-04-01", validUntil: "2026-07-15", active: true,
    divisions: [
      { letter: "A", exercises: [
        { exerciseId: "e1", sets: 4, reps: "8-10", load: "60kg", rest: 90 },
        { exerciseId: "e2", sets: 3, reps: "10-12", load: "20kg", rest: 60 },
        { exerciseId: "e13", sets: 3, reps: "12", load: "12kg", rest: 60 },
      ]},
      { letter: "B", exercises: [
        { exerciseId: "e7", sets: 4, reps: "8", load: "80kg", rest: 120 },
        { exerciseId: "e8", sets: 4, reps: "10", load: "150kg", rest: 90 },
      ]},
    ],
  },
];

export function getPlanName(id: string) {
  return plans.find(p => p.id === id)?.name ?? "—";
}

export function isInadimplente(studentId: string) {
  return payments.some(p => p.studentId === studentId && p.status === "Atrasado");
}

export function isWorkoutExpired(student: Student) {
  if (!student.workoutValidUntil) return false;
  return new Date(student.workoutValidUntil) < new Date();
}

export function isInactive(student: Student) {
  if (!student.lastCheckIn) return true;
  const days = (Date.now() - new Date(student.lastCheckIn).getTime()) / 86400000;
  return days > 15;
}

export function calculateBMI(weight: number, heightCm: number) {
  const h = heightCm / 100;
  return weight / (h * h);
}

export function bmiClassification(bmi: number) {
  if (bmi < 18.5) return { label: "Abaixo do peso", color: "info" };
  if (bmi < 25) return { label: "Normal", color: "success" };
  if (bmi < 30) return { label: "Sobrepeso", color: "warning" };
  if (bmi < 35) return { label: "Obesidade I", color: "warning" };
  if (bmi < 40) return { label: "Obesidade II", color: "destructive" };
  return { label: "Obesidade III", color: "destructive" };
}
