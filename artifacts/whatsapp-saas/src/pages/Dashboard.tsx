import { useMemo } from "react"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"
import { Users, MessageCircle, GitBranch, ShoppingBag, DollarSign, Plug, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const areaData = [
  { name: 'Seg', conversas: 340 },
  { name: 'Ter', conversas: 410 },
  { name: 'Qua', conversas: 380 },
  { name: 'Qui', conversas: 520 },
  { name: 'Sex', conversas: 487 },
  { name: 'Sáb', conversas: 280 },
  { name: 'Dom', conversas: 210 },
]

const barData = [
  { name: 'Pendente', value: 45 },
  { name: 'Em andamento', value: 30 },
  { name: 'Concluído', value: 50 },
  { name: 'Cancelado', value: 13 },
]

const pieData = [
  { name: 'WA Orgânico', value: 400 },
  { name: 'Tráfego Pago', value: 300 },
  { name: 'Indicação', value: 150 },
  { name: 'Outros', value: 50 },
]

const COLORS = ['#00508F', '#0070C8', 'hsl(240, 4%, 65%)', 'hsl(240, 4%, 40%)']

const recentActivity = [
  { id: 1, name: "Maria Oliveira", phone: "+55 11 9****-1234", status: "Novo Lead", statusVariant: "info" as const, time: "Há 5 min" },
  { id: 2, name: "Carlos Santos", phone: "+55 21 9****-5678", status: "Em Atendimento", statusVariant: "warning" as const, time: "Há 12 min" },
  { id: 3, name: "Ana Beatriz", phone: "+55 31 9****-9012", status: "Pedido Realizado", statusVariant: "success" as const, time: "Há 1 hora" },
  { id: 4, name: "João Pedro", phone: "+55 41 9****-3456", status: "Aguardando", statusVariant: "secondary" as const, time: "Há 2 horas" },
  { id: 5, name: "Fernanda Costa", phone: "+55 51 9****-7890", status: "Cancelado", statusVariant: "error" as const, time: "Há 3 horas" },
]

export default function Dashboard() {
  const CustomTooltip = useMemo(() => {
    return ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
            <p className="font-medium text-foreground mb-1">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da sua operação no WhatsApp.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primary relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.284</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% essa semana
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-primary relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageCircle className="w-12 h-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">487</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8% essa semana
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-12 h-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Estimada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 48.920</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +18% esse mês
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sidebar-border relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <GitBranch className="w-12 h-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fluxos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">
              De 50 disponíveis
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sidebar-border relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos no Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">138</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +5% comparado ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sidebar-border relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Plug className="w-12 h-12" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApps Conectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3<span className="text-lg text-muted-foreground">/5</span></div>
            <p className="text-xs text-muted-foreground mt-1">
              Status: Todos online
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Conversas por dia</CardTitle>
            <CardDescription>Volume de interações nos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConversas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="conversas" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorConversas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Leads por fonte</CardTitle>
            <CardDescription>Origem dos contatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pedidos por status</CardTitle>
            <CardDescription>Distribuição atual de pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted)/0.2)'}} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas interações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.phone}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={activity.statusVariant}>{activity.status}</Badge>
                    <span className="text-xs text-muted-foreground hidden sm:inline-block w-[70px] text-right">
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
