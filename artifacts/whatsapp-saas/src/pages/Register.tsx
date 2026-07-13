import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const schema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    lastName: z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
    email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
    terms: z.boolean().refine((v) => v === true, { message: 'Você deve aceitar os termos' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    try {
      await register({
        name: values.name,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      toast({ title: 'Conta criada!', description: 'Agora configure sua empresa.' });
      setLocation('/create-company');
    } catch {
      toast({
        title: 'Erro ao criar conta',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(124,58,237,0.4)]">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">FlowBot</h1>
          <p className="text-sm text-muted-foreground mt-1">Comece gratuitamente hoje</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Criar sua conta</h2>
            <p className="text-sm text-muted-foreground mt-1">Preencha os dados abaixo para começar</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Nome</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-name"
                          placeholder="João"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Sobrenome</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-last-name"
                          placeholder="Silva"
                          className="bg-background/60 border-border focus-visible:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-email"
                        type="email"
                        placeholder="nome@empresa.com"
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          data-testid="input-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 8 caracteres"
                          className="bg-background/60 border-border focus-visible:ring-primary pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          data-testid="button-toggle-password"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Confirmar senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          data-testid="input-confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repita a senha"
                          className="bg-background/60 border-border focus-visible:ring-primary pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          data-testid="button-toggle-confirm"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-2 space-y-0 pt-1">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-0.5"
                      />
                    </FormControl>
                    <div className="flex flex-col gap-1">
                      <FormLabel className="text-sm text-muted-foreground font-normal cursor-pointer leading-relaxed">
                        Li e aceito os{' '}
                        <span className="text-primary hover:underline">Termos de Uso</span> e a{' '}
                        <span className="text-primary hover:underline">Política de Privacidade</span>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full font-semibold py-5 mt-2 bg-primary hover:bg-primary/90 shadow-[0_0_16px_rgba(124,58,237,0.35)] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  'Criar conta grátis'
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <button
              data-testid="link-login"
              onClick={() => setLocation('/login')}
              className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
