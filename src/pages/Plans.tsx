import { Plus, Pencil, Trash2 } from "lucide-react";
import { plans } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function Plans() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
          <p className="text-sm text-muted-foreground">Configure os planos oferecidos pela academia</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Novo plano
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 transition-smooth hover:border-primary/40 hover:shadow-glow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {p.duration}
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold">
              R$ {p.price.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground"> /{p.duration.toLowerCase()}</span>
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>{p.dailyAccess} acesso(s) por dia</span>
              <div className="flex gap-1">
                <button className="rounded-md p-1 hover:bg-secondary hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                <button className="rounded-md p-1 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
