import { Link } from "wouter"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border">
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-2">Página não encontrada</h1>
          
          <p className="text-muted-foreground mb-8">
            O endereço que você está tentando acessar não existe ou foi movido.
          </p>
          
          <Link href="/dashboard" className="w-full">
            <Button className="w-full py-6 text-base font-semibold shadow-[0_0_16px_rgba(0,80,143,0.2)]">
              Voltar ao Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
