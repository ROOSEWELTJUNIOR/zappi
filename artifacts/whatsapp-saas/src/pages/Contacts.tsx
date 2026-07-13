import { Plus, Users, Search, Download, Filter } from "lucide-react"

import { Breadcrumb } from "@/components/Breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const mockContacts = [
  { id: "1", name: "Maria Oliveira", phone: "+55 11 99999-1234", email: "maria@exemplo.com", tags: ["vip", "novo"], status: "active", createdAt: "12/10/2023" },
  { id: "2", name: "Carlos Santos", phone: "+55 21 98888-5678", email: "", tags: ["lead"], status: "active", createdAt: "15/10/2023" },
  { id: "3", name: "Ana Beatriz", phone: "+55 31 97777-9012", email: "ana.b@empresa.com", tags: ["cliente", "recorrente"], status: "inactive", createdAt: "02/11/2023" },
  { id: "4", name: "João Pedro", phone: "+55 41 96666-3456", email: "joao.p@email.com", tags: ["frio"], status: "active", createdAt: "20/11/2023" },
  { id: "5", name: "Fernanda Costa", phone: "+55 51 95555-7890", email: "", tags: ["vip"], status: "active", createdAt: "05/12/2023" },
]

export default function Contacts() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
        <div>
          <Breadcrumb className="mb-2" />
          <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua base de clientes e leads.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, telefone ou email..."
              className="pl-9 bg-background w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filtros
            </Button>
          </div>
        </div>

        {mockContacts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContacts.map((contact) => (
                <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {contact.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{contact.name}</span>
                        {contact.email && <span className="text-xs text-muted-foreground">{contact.email}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal capitalize">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.status === 'active' ? (
                      <Badge variant="success" className="h-5 text-[10px]">Ativo</Badge>
                    ) : (
                      <Badge variant="error" className="h-5 text-[10px]">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {contact.createdAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhum contato encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Sua lista de contatos está vazia. Adicione contatos manualmente ou importe uma planilha.
            </p>
            <Button size="sm">Adicionar Contato</Button>
          </div>
        )}
        
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground bg-muted/10">
          <div>Mostrando <span className="font-medium text-foreground">1</span> a <span className="font-medium text-foreground">5</span> de <span className="font-medium text-foreground">1.284</span> resultados</div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Próxima</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
