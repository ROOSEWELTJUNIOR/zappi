import { Plus, Smartphone, QrCode, RefreshCw, PowerOff, Battery, Wifi } from "lucide-react"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const mockConnections = [
  { id: "1", name: "Suporte Principal", phone: "+55 11 99999-1111", status: "connected", battery: 87, createdAt: "12/10/2023" },
  { id: "2", name: "Vendas SP", phone: "+55 11 98888-2222", status: "connected", battery: 42, createdAt: "15/10/2023" },
  { id: "3", name: "Vendas RJ", phone: "+55 21 97777-3333", status: "disconnected", battery: 0, createdAt: "02/11/2023" },
  { id: "4", name: "Atendimento Financeiro", phone: "Aguardando leitura", status: "pending", battery: 0, createdAt: "Hoje" },
]

export default function Connections() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <Breadcrumb className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">Conexões</h1>
          <p className="text-muted-foreground mt-1">Conecte e gerencie seus números de WhatsApp.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockConnections.map((conn) => (
          <Card key={conn.id} className={`flex flex-col relative overflow-hidden transition-all ${conn.status === 'connected' ? 'border-primary/20 bg-primary/5' : ''}`}>
            {conn.status === 'connected' && (
              <div className="absolute top-0 right-0 p-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                  conn.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' :
                  conn.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{conn.name}</CardTitle>
                  <CardDescription className="font-mono mt-0.5 text-sm">{conn.phone}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1">
              <div className="bg-card/50 border border-border rounded-lg p-3 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  {conn.status === 'connected' ? (
                    <Badge variant="success" className="h-5">Conectado</Badge>
                  ) : conn.status === 'disconnected' ? (
                    <Badge variant="error" className="h-5">Desconectado</Badge>
                  ) : (
                    <Badge variant="warning" className="h-5">Aguardando QR Code</Badge>
                  )}
                </div>
                
                {conn.status === 'connected' && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Bateria</span>
                    <div className="flex items-center gap-1">
                      <Battery className="h-3 w-3 text-muted-foreground" />
                      <span className={conn.battery < 20 ? 'text-red-500 font-medium' : ''}>{conn.battery}%</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Criado em</span>
                  <span>{conn.createdAt}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0 mt-auto">
              {conn.status === 'connected' ? (
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1 text-xs" size="sm">
                    <RefreshCw className="h-3 w-3 mr-1.5" /> Sincronizar
                  </Button>
                  <Button variant="destructive" className="flex-1 text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-transparent" size="sm">
                    <PowerOff className="h-3 w-3 mr-1.5" /> Desconectar
                  </Button>
                </div>
              ) : conn.status === 'pending' ? (
                <Button className="w-full shadow-[0_0_16px_rgba(124,58,237,0.2)]">
                  <QrCode className="h-4 w-4 mr-2" /> Ler QR Code
                </Button>
              ) : (
                <Button className="w-full bg-sidebar border border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-foreground">
                  <RefreshCw className="h-4 w-4 mr-2" /> Reconectar
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}

        {/* Empty State / Add New Placeholder Card */}
        <Card className="flex flex-col items-center justify-center border-dashed border-2 hover:border-primary/50 transition-colors bg-transparent shadow-none cursor-pointer group min-h-[280px]">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-lg">Adicionar Número</h3>
          <p className="text-sm text-muted-foreground text-center mt-2 px-6">
            Você ainda pode conectar mais 2 números no seu plano atual.
          </p>
        </Card>
      </div>
    </div>
  )
}
