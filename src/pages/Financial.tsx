import { CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCobrancas } from "@/hooks/useCobrancas";
import { formatarMoeda } from "@/utils/formatters";

export default function Financial() {
  const { cobrancas, loading, registrarPagamento } = useCobrancas();

  const total = cobrancas.reduce((acc, p) => acc + p.valor, 0);
  const overdue = cobrancas.filter((p) => p.status === "atrasado").reduce((acc, p) => acc + p.valor, 0);
  const paid = cobrancas.filter((p) => p.status === "pago").reduce((acc, p) => acc + p.valor, 0);

  const handlePayment = async (id: string) => {
    try {
      await registrarPagamento(id, 'pix'); // Default para pix
      toast.success("Pagamento registrado!");
    } catch (error: any) {
      toast.error("Erro ao registrar pagamento: " + error.message);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center">Carregando...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gestão de cobranças e mensalidades</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total faturado</p>
          <p className="mt-2 text-2xl font-bold">{formatarMoeda(paid)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Em aberto</p>
          <p className="mt-2 text-2xl font-bold text-destructive">{formatarMoeda(overdue)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total previsto</p>
          <p className="mt-2 text-2xl font-bold">{formatarMoeda(total)}</p>
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
              {cobrancas.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{p.aluno?.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.mes_referencia}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.vencimento).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 font-semibold">{formatarMoeda(p.valor)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge variant={p.status === "pago" ? "success" : p.status === "atrasado" ? "destructive" : "warning"}>
                        {p.status}
                      </StatusBadge>
                      {p.pago_em && <span className="ml-2 text-xs text-muted-foreground">{p.forma_pagamento}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status !== "pago" && (
                        <Button size="sm" onClick={() => handlePayment(p.id)} className="h-7 bg-primary text-xs text-primary-foreground hover:bg-primary/90">
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
