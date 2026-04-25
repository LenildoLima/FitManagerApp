import { Home, Users, ClipboardList, Dumbbell, DollarSign, Calendar, Settings, LogOut, Activity, UserPlus, UserCircle2 } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Alunos", url: "/alunos", icon: Users },
  { title: "Usuários", url: "/usuarios", icon: Users, adminOnly: true },
  { title: "Avaliações", url: "/avaliacoes", icon: ClipboardList },
  { title: "Fichas de Treino", url: "/fichas", icon: Dumbbell },
  { title: "Exercícios", url: "/exercicios", icon: Activity },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Planos", url: "/planos", icon: Activity },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Meu Perfil", url: "/meu-perfil", icon: UserCircle2 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { perfil } = useAuth();

  const filteredItems = items.filter(item => !item.adminOnly || perfil?.perfil === 'admin');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold tracking-tight text-sidebar-accent-foreground">FitManager</p>
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Gestão Inteligente</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const active = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.url === "/"}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          {perfil?.avatar_url ? (
            <img 
              src={perfil.avatar_url} 
              alt={perfil.nome} 
              className="h-9 w-9 rounded-full object-cover border border-sidebar-border" 
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
              {perfil?.nome ? perfil.nome.split(" ").map(n => n[0]).slice(0, 2).join("") : "U"}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{perfil?.nome || "Usuário"}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{perfil?.email || ""}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate("/login")}
                className="rounded-md p-1.5 text-sidebar-foreground/70 transition-smooth hover:bg-sidebar-accent hover:text-destructive"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
