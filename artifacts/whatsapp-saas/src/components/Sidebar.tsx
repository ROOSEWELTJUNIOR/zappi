import * as React from "react"
import { Link, useLocation } from "wouter"
import {
  LayoutDashboard,
  MessageCircle,
  GitBranch,
  Users,
  Plug,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chats", href: "/chats", icon: MessageCircle },
  { name: "Fluxos", href: "/flows", icon: GitBranch },
  { name: "Contatos", href: "/contacts", icon: Users },
  { name: "Conexões", href: "/connections", icon: Plug },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Pedidos", href: "/orders", icon: ShoppingBag },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  className,
}: {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  className?: string
}) {
  const [location] = useLocation()
  const { user, logout } = useAuth()

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out h-full relative",
        isCollapsed ? "w-[64px]" : "w-[240px]",
        className
      )}
    >
      <div className="flex h-[60px] items-center justify-center border-b border-sidebar-border px-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-md p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between gap-3")}>
          <div className={cn("flex items-center gap-3", isCollapsed && "hidden")}>
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium truncate">{user?.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 text-[10px] px-1 bg-sidebar-accent/50 text-sidebar-foreground/80 border-sidebar-border uppercase">
                  {user?.plan}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className={cn(
              "rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors shrink-0",
              isCollapsed && "mx-auto"
            )}
            title="Logout"
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
