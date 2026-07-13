import { Plus, Package, Search, Filter } from "lucide-react"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const mockProducts = [
  { id: "1", name: "Mentoria de Vendas Online (Anual)", price: 1497.00, stock: -1, category: "Infoproduto", status: "active" },
  { id: "2", name: "E-book: Gatilhos Mentais 2.0", price: 47.90, stock: -1, category: "E-book", status: "active" },
  { id: "3", name: "Consultoria Individual (1h)", price: 500.00, stock: 10, category: "Serviço", status: "active" },
  { id: "4", name: "Planner Físico 2024", price: 129.90, stock: 145, category: "Físico", status: "active" },
  { id: "5", name: "Imersão Presencial SP", price: 2500.00, stock: 0, category: "Evento", status: "inactive" },
]

export default function Products() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <Breadcrumb className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground mt-1">Catálogo de produtos para vendas via WhatsApp.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome ou categoria..."
              className="pl-9 bg-background w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Categorias
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProducts.map((product) => (
              <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center border border-border">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {product.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">{product.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-medium text-primary">
                  {formatCurrency(product.price)}
                </TableCell>
                <TableCell className="text-center">
                  {product.stock === -1 ? (
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">Infinito</span>
                  ) : product.stock === 0 ? (
                    <span className="text-xs text-red-500 font-medium px-2 py-1 bg-red-500/10 rounded-md">Esgotado</span>
                  ) : (
                    <span className="font-mono text-sm">{product.stock}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {product.status === 'active' ? (
                    <Badge variant="success" className="h-5 text-[10px]">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary" className="h-5 text-[10px]">Inativo</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground bg-muted/10">
          <div>Mostrando <span className="font-medium text-foreground">1</span> a <span className="font-medium text-foreground">5</span> de <span className="font-medium text-foreground">42</span> resultados</div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Próxima</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
