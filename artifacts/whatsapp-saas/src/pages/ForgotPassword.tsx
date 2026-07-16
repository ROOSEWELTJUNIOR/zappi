import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, Zap } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const schema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(_values: FormValues) {
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    toast({
      title: 'E-mail enviado!',
      description: 'Verifique sua caixa de entrada para redefinir a senha.',
    });
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
          <p className="text-sm text-muted-foreground mt-1">Recuperação de senha</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {sent ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Verifique seu e-mail</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Enviamos um link de recuperação para o e-mail informado. O link expira em 30 minutos.
                </p>
              </div>
              <Button
                data-testid="button-back-login"
                onClick={() => setLocation('/login')}
                className="w-full mt-2 bg-primary hover:bg-primary/90 shadow-[0_0_16px_rgba(0,80,143,0.3)]"
              >
                Voltar para o login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Esqueceu a senha?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Informe seu e-mail e enviaremos um link para redefinir a senha.
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

                  <Button
                    data-testid="button-submit"
                    type="submit"
                    className="w-full font-semibold py-5 mt-2 bg-primary hover:bg-primary/90 shadow-[0_0_16px_rgba(0,80,143,0.35)] transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      'Enviar link de recuperação'
                    )}
                  </Button>
                </form>
              </Form>

              <button
                data-testid="link-back-login"
                onClick={() => setLocation('/login')}
                className="mt-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
