import { useState } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, CreditCard, Shield, User, Building, Bell, Zap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { evolutionConfig, isEvolutionConfigured } from '@/config/evolution';
import { testConnection } from '@/services/evolution.service';

export default function Settings() {
  const { user } = useAuth();
  const { currentCompany } = useCompany();

  // Evolution API connection test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection();
    setTestResult(result);
    setTesting(false);
  }

  const maskedKey = evolutionConfig.apiKey
    ? evolutionConfig.apiKey.slice(0, 4) + '•'.repeat(Math.max(4, evolutionConfig.apiKey.length - 4))
    : '(não configurada)';

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb className="mb-2" />
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta, empresa e preferências.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <div className="flex overflow-x-auto pb-2 scrollbar-none">
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 flex-nowrap min-w-max">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger
              value="company"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <Building className="h-4 w-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Plano e Cobrança
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <Shield className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger
              value="evolution"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <Zap className="h-4 w-4 mr-2" />
              Evolution API
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6 max-w-3xl">
          {/* ── Profile ── */}
          <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize seus dados pessoais e foto de perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-border group-hover:opacity-50 transition-opacity">
                      <AvatarImage src={user?.avatar || ''} />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                        {user?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-8 w-8 text-white drop-shadow-md" />
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <h4 className="font-medium text-foreground">Foto de Perfil</h4>
                    <p className="text-muted-foreground">JPG, GIF ou PNG. Máximo de 2MB.</p>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">Alterar</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">Remover</Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Nome Completo</label>
                    <Input defaultValue={user?.name} className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Email</label>
                    <Input defaultValue={user?.email} className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Cargo / Função</label>
                    <Input defaultValue={user?.role === 'admin' ? 'Administrador' : user?.role} className="bg-background/50" disabled />
                    <p className="text-[10px] text-muted-foreground">O cargo só pode ser alterado pelo dono da conta.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border py-4 bg-muted/10">
                <Button className="ml-auto shadow-[0_0_12px_rgba(124,58,237,0.3)]">Salvar Alterações</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ── Company ── */}
          <TabsContent value="company" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Gerencie as informações do seu negócio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Nome da Empresa</label>
                    <Input defaultValue={currentCompany?.name} className="bg-background/50" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">CNPJ</label>
                      <Input placeholder="00.000.000/0000-00" className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Telefone de Contato</label>
                      <Input placeholder="+55 (00) 00000-0000" className="bg-background/50" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border py-4 bg-muted/10">
                <Button className="ml-auto">Salvar Empresa</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ── Plan ── */}
          <TabsContent value="plan" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card className="border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Seu Plano Atual</CardTitle>
                    <CardDescription>Detalhes da sua assinatura.</CardDescription>
                  </div>
                  <Badge variant="default" className="text-sm px-3 py-1 shadow-[0_0_12px_rgba(124,58,237,0.3)]">{currentCompany?.plan}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">WhatsApps Conectados</span>
                      <span className="font-medium">{currentCompany?.whatsappsCount} / 5</span>
                    </div>
                    <div className="h-2 w-full bg-sidebar rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[60%] rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usuários da Equipe</span>
                      <span className="font-medium">{currentCompany?.usersCount} / 10</span>
                    </div>
                    <div className="h-2 w-full bg-sidebar rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[50%] rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-card border border-border rounded-xl mt-6">
                  <h4 className="font-medium text-sm mb-1">Próxima Fatura</h4>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-2xl font-bold">R$ 197,00</span>
                    <span className="text-sm text-muted-foreground">em 15/12/2023</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cartão final •••• 4242</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-3 pt-0">
                <Button className="w-full sm:w-auto">Fazer Upgrade</Button>
                <Button variant="outline" className="w-full sm:w-auto">Ver Faturas</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ── Notifications ── */}
          <TabsContent value="notifications" className="animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>Escolha como você quer ser notificado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-card text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Configurações de notificação em breve.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Security ── */}
          <TabsContent value="security" className="animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Proteja sua conta e altere sua senha.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-w-sm">
                  <label className="text-sm font-medium leading-none">Senha Atual</label>
                  <Input type="password" placeholder="••••••••" className="bg-background/50" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <label className="text-sm font-medium leading-none">Nova Senha</label>
                  <Input type="password" placeholder="••••••••" className="bg-background/50" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <label className="text-sm font-medium leading-none">Confirmar Nova Senha</label>
                  <Input type="password" placeholder="••••••••" className="bg-background/50" />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border py-4 bg-muted/10">
                <Button variant="default">Atualizar Senha</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ── Evolution API ── */}
          <TabsContent value="evolution" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Evolution API</CardTitle>
                    <CardDescription>
                      Configuração da integração com a Evolution API hospedada no Railway.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Estado da configuração:</span>
                  {isEvolutionConfigured() ? (
                    <Badge variant="success" className="gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Configurado
                    </Badge>
                  ) : (
                    <Badge variant="error" className="gap-1.5">Não configurado</Badge>
                  )}
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">URL da API</label>
                    <Input
                      readOnly
                      value={evolutionConfig.publicUrl || '(VITE_EVOLUTION_URL não definida)'}
                      className="bg-background/50 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variável de ambiente: <code className="font-mono">VITE_EVOLUTION_URL</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">API Key</label>
                    <Input
                      readOnly
                      value={maskedKey}
                      className="bg-background/50 font-mono text-sm tracking-widest"
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variável de ambiente: <code className="font-mono">VITE_EVOLUTION_API_KEY</code>
                    </p>
                  </div>
                </div>

                {/* Test result */}
                {testResult && (
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                      testResult.ok
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-destructive/30 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t border-border py-4 bg-muted/10">
                <Button
                  onClick={handleTestConnection}
                  disabled={testing || !isEvolutionConfigured()}
                  className="gap-2"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Testando…
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Testar Conexão
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Como configurar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground list-none">
                  {[
                    { key: 'VITE_EVOLUTION_URL', desc: 'URL completa da sua instância no Railway (ex: https://evolution-api-…railway.app)' },
                    { key: 'VITE_EVOLUTION_API_KEY', desc: 'Chave de autenticação definida em AUTHENTICATION_API_KEY na Evolution' },
                  ].map(({ key, desc }, i) => (
                    <li key={key} className="flex gap-3">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-medium mt-0.5">
                        {i + 1}
                      </span>
                      <span>
                        Defina <code className="font-mono text-foreground bg-muted px-1 rounded">{key}</code>{' '}
                        nas variáveis de ambiente do projeto. {desc}.
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
