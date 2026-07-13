import { useState } from "react"
import { useLocation } from "wouter"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login } = useAuth()
  const [, setLocation] = useLocation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login()
    setLocation("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-border bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white shadow-[0_0_24px_rgba(124,58,237,0.4)]">
            <span className="font-bold text-3xl leading-none">F</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Entrar no FlowBot</CardTitle>
            <CardDescription className="text-muted-foreground">
              Acesse sua conta para gerenciar seus fluxos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                  Senha
                </label>
                <a href="#" className="text-xs text-primary hover:underline underline-offset-4">
                  Esqueceu a senha?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full text-base font-semibold py-6 mt-2">
              Entrar
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <a href="/register" className="text-primary font-medium hover:underline underline-offset-4" onClick={(e) => { e.preventDefault(); setLocation('/register') }}>
              Criar agora
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
