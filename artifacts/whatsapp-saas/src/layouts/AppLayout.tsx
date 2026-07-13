import * as React from "react"
import { useLocation, Redirect } from "wouter"
import { Menu, X } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { cn } from "@/lib/utils"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Auto-collapse sidebar on tablet
  React.useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsSidebarCollapsed(true)
      } else if (window.innerWidth >= 1024) {
        setIsSidebarCollapsed(false)
      }
    }
    
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  if (!isAuthenticated) {
    return <Redirect to="/login" />
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block h-full">
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed} 
          />
        </div>

        {/* Mobile Sidebar Backdrop */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[280px] transform bg-sidebar transition-transform duration-300 ease-in-out md:hidden",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="absolute right-4 top-4">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md p-2 hover:bg-sidebar-accent text-sidebar-foreground/70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <Sidebar 
            isCollapsed={false} 
            setIsCollapsed={() => {}} 
            className="w-full border-r-0"
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
