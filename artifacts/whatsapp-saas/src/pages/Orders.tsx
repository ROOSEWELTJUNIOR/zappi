import { Plus, ShoppingBag, Search, Filter, ArrowUpRight } from "lucide-react"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const mockOrders = [
  { id: "1", orderNumber: "#ORD-8901", contactName: "Maria Oliveira", total: 1497.00, status: "completed", createdAt: "12/10/2023 14:30", items: 1 },
  { id: "2", orderNumber: "#ORD-8902", contactName: "Carlos Santos", total: 95.80, status: "pending", createdAt: "Hoje 09:15", items: 2 },
  { id: "3", orderNumber: "#ORD-8903", contactName: "Ana Beatriz", total: 500.00, status: "processing", createdAt: "Ontem 16:45", items: 1 },
  { id: "4", orderNumber: "#ORD-8904", contactName: "João Pedro", total: 129.90, status: "cancelled", createdAt: "20/11/2023 10:20", items: 1 },
  { id: "5", orderNumber: "#ORD-8905", contactName: "Fernanda Costa", total: 47.90, status: "completed", createdAt: "05/12/2023 11:10", items: 1 },
]

export default function Orders() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge variant="success" className="h-6">Pago</Badge>;
      case 'pending': return <Badge variant="warning" className="h-6">Aguardando Pagamento</Badge>;
      case 'processing': return <Badge className="h-6 bg-primary/20 text-primary hover:bg-primary/30 border-transparent">Em Separação</Badge>;
      case 'cancelled': return <Badge variant="error" className="h-6">Cancelado</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <Breadcrumb className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe as vendas realizadas via WhatsApp.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Pedido
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por número ou cliente..."
              className="pl-9 bg-background w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Status
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Data</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrders.map((order) => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono text-sm font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{order.contactName}</span>
                    <span className="text-xs text-muted-foreground">{order.items} ite{order.items > 1 ? 'ns' : 'm'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {order.createdAt}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground bg-muted/10">
          <div>Mostrando <span className="font-medium text-foreground">1</span> a <span className="font-medium text-foreground">5</span> de <span className="font-medium text-foreground">138</span> resultados</div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Próxima</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
