import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Upload, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SEGMENTS = [
  'E-commerce',
  'Infoprodutos',
  'Clínica',
  'Imobiliária',
  'Advocacia',
  'Restaurante',
  'Academia',
  'Marketing',
  'Outro',
];

const EMPLOYEES_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
];

const schema = z.object({
  name: z.string().min(2, 'Nome da empresa deve ter no mínimo 2 caracteres'),
  phone: z
    .string()
    .min(10, 'Telefone inválido')
    .max(20, 'Telefone inválido'),
  segment: z.string().min(1, 'Selecione um segmento'),
  employeesCount: z.string().min(1, 'Selecione a quantidade de funcionários'),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCompany() {
  const [, setLocation] = useLocation();
  const { createCompany } = useCompany();
  const { updateUser, user } = useAuth();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', segment: '', employeesCount: '' },
  });

  const { isSubmitting } = form.formState;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: FormValues) {
    try {
      const company = await createCompany({
        name: values.name,
        phone: values.phone,
        segment: values.segment,
        employeesCount: values.employeesCount,
        logo: logoPreview,
      });
      if (user) {
        updateUser({ companyId: company.id });
      }
      toast({ title: 'Empresa criada!', description: `Bem-vindo ao FlowBot, ${values.name}!` });
      setLocation('/dashboard');
    } catch {
      toast({
        title: 'Erro ao criar empresa',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,80,143,0.4)]">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">FlowBot</h1>
          <p className="text-sm text-muted-foreground mt-1">Quase lá! Configure sua empresa</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
              <span className="text-xs text-primary font-semibold">✓</span>
            </div>
            <span className="text-xs text-muted-foreground">Conta criada</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_8px_rgba(0,80,143,0.5)]">
              <span className="text-xs text-white font-semibold">2</span>
            </div>
            <span className="text-xs text-foreground font-medium">Sua empresa</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-semibold">3</span>
            </div>
            <span className="text-xs text-muted-foreground">Pronto</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Dados da empresa</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Essas informações ajudam a personalizar sua experiência.
            </p>
          </div>

          {/* Logo upload */}
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              data-testid="button-upload-logo"
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-background/50 flex flex-col items-center justify-center gap-1 transition-colors group"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <>
                  <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Upload className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
              data-testid="input-logo"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Logo da empresa</p>
              <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG até 2MB (opcional)</p>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => setLogoPreview(null)}
                  className="text-xs text-destructive hover:underline mt-1"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Nome da empresa</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-company-name"
                        placeholder="Minha Empresa Ltda"
                        className="bg-background/60 border-border focus-visible:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Telefone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-phone"
                        placeholder="(11) 99999-0000"
                        className="bg-background/60 border-border focus-visible:ring-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="segment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Segmento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger
                            data-testid="select-segment"
                            className="bg-background/60 border-border focus:ring-primary"
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border">
                          {SEGMENTS.map((s) => (
                            <SelectItem key={s} value={s} className="focus:bg-primary/10">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeesCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Funcionários</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger
                            data-testid="select-employees"
                            className="bg-background/60 border-border focus:ring-primary"
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border">
                          {EMPLOYEES_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o} className="focus:bg-primary/10">
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full font-semibold py-5 mt-2 bg-primary hover:bg-primary/90 shadow-[0_0_16px_rgba(0,80,143,0.35)] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando empresa...
                  </span>
                ) : (
                  'Criar empresa e entrar'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
