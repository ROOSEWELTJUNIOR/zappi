import { Plus, GitBranch, Play, MoreHorizontal, Settings2, Clock } from "lucide-react"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const mockFlows = [
  { id: "1", name: "Boas-vindas novos leads", status: "active", trigger: "Palavra-chave: ola, oi", lastRun: "Há 5 min", stepsCount: 4, executions: 1245 },
  { id: "2", name: "Recuperação de carrinho", status: "active", trigger: "Tag: carrinho-abandonado", lastRun: "Há 1 hora", stepsCount: 6, executions: 342 },
  { id: "3", name: "Pesquisa NPS pós-venda", status: "inactive", trigger: "Tag: pedido-entregue", lastRun: "Há 2 dias", stepsCount: 3, executions: 890 },
  { id: "4", name: "Campanha Black Friday", status: "draft", trigger: "Manual", lastRun: "-", stepsCount: 8, executions: 0 },
]

export default function Flows() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <Breadcrumb className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">Fluxos de Automação</h1>
          <p className="text-muted-foreground mt-1">Crie e gerencie robôs para atendimento automático.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fluxo
        </Button>
      </div>

      {mockFlows.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockFlows.map((flow) => (
            <Card key={flow.id} className="flex flex-col hover:border-primary/50 transition-colors group relative overflow-hidden">
              {/* Decorative top border glow for active items */}
              {flow.status === 'active' && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-sidebar rounded-lg border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <CardTitle className="text-lg mt-3 line-clamp-1">{flow.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  {flow.status === 'active' ? (
                    <Badge variant="success" className="h-5 text-[10px] uppercase">Ativo</Badge>
                  ) : flow.status === 'inactive' ? (
                    <Badge variant="secondary" className="h-5 text-[10px] uppercase">Inativo</Badge>
                  ) : (
                    <Badge variant="outline" className="h-5 text-[10px] uppercase text-muted-foreground">Rascunho</Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">{flow.stepsCount} etapas</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 pb-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Settings2 className="h-3 w-3" /> Gatilho
                    </p>
                    <p className="text-sm font-medium">{flow.trigger}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Última execução
                    </p>
                    <p className="text-sm font-medium">{flow.lastRun}</p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 border-t border-border mt-auto p-4 bg-muted/20 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{flow.executions}</span> execuções
                </div>
                <Button variant="secondary" size="sm" className="h-8 text-xs gap-1.5 hover:bg-primary hover:text-white transition-colors">
                  <Play className="h-3 w-3" /> Testar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-card/50 text-center max-w-2xl mx-auto mt-12">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <GitBranch className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhum fluxo criado</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Automatize suas conversas criando fluxos de mensagens com gatilhos baseados em palavras-chave ou tags.
          </p>
          <Button>Criar meu primeiro fluxo</Button>
        </div>
      )}
    </div>
  )
}
