import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "destructive" | "info" | "muted";

const variants: Record<Variant, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
  muted: "bg-muted text-muted-foreground border-border",
};

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
  info: Clock,
  muted: Clock,
};

export function StatusBadge({
  variant = "muted",
  children,
  showIcon = false,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}) {
  const Icon = icons[variant];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium", variants[variant], className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
