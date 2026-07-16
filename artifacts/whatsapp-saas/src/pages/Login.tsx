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

const schema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  rememberMe: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    const success = await login({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    });

    if (success) {
      toast({ title: 'Bem-vindo de volta!', description: 'Login realizado com sucesso.' });
      setLocation('/dashboard');
    } else {
      toast({
        title: 'Credenciais inválidas',
        description: 'Verifique seu e-mail e senha e tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,80,143,0.4)]">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">FlowBot</h1>
          <p className="text-sm text-muted-foreground mt-1">Automação inteligente para WhatsApp</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Entrar na sua conta</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use <span className="text-primary font-medium">joao@empresa.com</span> / <span className="text-primary font-medium">12345678</span>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-foreground">Senha</FormLabel>
                      <button
                        type="button"
                        onClick={() => setLocation('/forgot-password')}
                        className="text-xs text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          data-testid="input-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
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
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        data-testid="checkbox-remember-me"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </FormControl>
                    <FormLabel className="text-sm text-muted-foreground font-normal cursor-pointer">
                      Lembrar-me por 30 dias
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full font-semibold py-5 mt-2 bg-primary hover:bg-primary/90 shadow-[0_0_16px_rgba(0,80,143,0.35)] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <button
              data-testid="link-register"
              onClick={() => setLocation('/register')}
              className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              Criar conta grátis
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao entrar, você concorda com nossos{' '}
          <span className="text-primary hover:underline cursor-pointer">Termos de Uso</span> e{' '}
          <span className="text-primary hover:underline cursor-pointer">Política de Privacidade</span>.
        </p>
      </div>
    </div>
  );
}
