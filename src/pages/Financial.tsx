import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { payments as initialPayments, students } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Financial() {
  const [payments, setPayments] = useState(initialPayments);

  const total = payments.reduce((acc, p) => acc + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "Atrasado").reduce((acc, p) => acc + p.amount, 0);
  const paid = payments.filter((p) => p.status === "Pago").reduce((acc, p) => acc + p.amount, 0);

  const registerPayment = (id: string) => {
    setPayments(payments.map((p) => p.id === id ? { ...p, status: "Pago" as const, paidAt: new Date().toISOString(), method: "PIX" } : p));
    toast.success("Pagamento registrado!");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gestão de cobranças e mensalidades</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total faturado</p>
          <p className="mt-2 text-2xl font-bold">R$ {paid.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Em aberto</p>
          <p className="mt-2 text-2xl font-bold text-destructive">R$ {overdue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total previsto</p>
          <p className="mt-2 text-2xl font-bold">R$ {total.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Aluno</th>
                <th className="px-4 py-3 text-left">Mês ref.</th>
                <th className="px-4 py-3 text-left">Vencimento</th>
                <th className="px-4 py-3 text-left">Valor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => {
                const student = students.find((s) => s.id === p.studentId);
                return (
                  <tr key={p.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{student?.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.monthRef}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.dueDate).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 font-semibold">R$ {p.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={p.status === "Pago" ? "success" : p.status === "Atrasado" ? "destructive" : "warning"}>
                        {p.status}
                      </StatusBadge>
                      {p.paidAt && <span className="ml-2 text-xs text-muted-foreground">{p.method}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status !== "Pago" && (
                        <Button size="sm" onClick={() => registerPayment(p.id)} className="h-7 bg-primary text-xs text-primary-foreground hover:bg-primary/90">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Registrar pagamento
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
