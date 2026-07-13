import * as React from "react"
import { Bell, Check, ChevronDown, Menu } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function Header({
  onMenuClick,
}: {
  onMenuClick: () => void
}) {
  const { user, logout } = useAuth()
  const { companies, currentCompany, setCurrentCompany } = useCompany()

  return (
    <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]">
            <span className="font-bold text-lg leading-none">F</span>
          </div>
          <span className="hidden md:inline-block text-lg font-bold tracking-tight">FlowBot</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-2 hover:bg-accent transition-colors focus:outline-none">
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-sm font-medium leading-none">{currentCompany.name}</span>
              <span className="text-xs text-muted-foreground mt-1">Plano {currentCompany.plan}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Trocar Empresa</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {companies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setCurrentCompany(company)}
              >
                <span>{company.name}</span>
                {currentCompany.id === company.id && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              Criar nova empresa...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="relative rounded-full p-2 hover:bg-accent transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="h-8 w-8 border border-border cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Perfil</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={logout}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
