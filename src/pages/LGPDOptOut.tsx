import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, MailX, CheckCircle2, ShieldX, AlertTriangle } from 'lucide-react';
import { validateLGPDToken, markTokenAsUsed } from '@/lib/lgpd-token';

const optOutSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type OptOutFormData = z.infer<typeof optOutSchema>;

export default function LGPDOptOut() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [prefilledEmail, setPrefilledEmail] = useState<string>('');

  const form = useForm<OptOutFormData>({
    resolver: zodResolver(optOutSchema),
    defaultValues: {
      email: '',
    },
  });

  // Validate token on mount
  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setTokenStatus('invalid');
        setTokenError('Token de acesso não fornecido. Utilize o link enviado por e-mail.');
        return;
      }

      const result = await validateLGPDToken(token);
      
      if (!result.valid) {
        setTokenStatus('invalid');
        setTokenError(result.error || 'Token inválido');
        return;
      }

      if (result.type && result.type !== 'optout') {
        setTokenStatus('invalid');
        setTokenError('Este token não é válido para cancelamento de inscrição.');
        return;
      }

      setTokenStatus('valid');
      if (result.email) {
        setPrefilledEmail(result.email);
        form.setValue('email', result.email);
      }
    };

    validate();
  }, [token, form]);

  const handleSubmit = async (data: OptOutFormData) => {
    if (!token) return;
    
    setIsSubmitting(true);
    try {
      // Find contact by email
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

      if (contactError) throw contactError;

      if (!contact) {
        toast.error('E-mail não encontrado em nossa base de dados.');
        return;
      }

      // Revoke marketing consents for this contact
      const { error: updateError } = await supabase
        .from('lgpd_consents')
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
        })
        .eq('contact_id', contact.id)
        .eq('consent_type', 'marketing');

      if (updateError) throw updateError;

      // Mark token as used
      await markTokenAsUsed(token);

      setIsSuccess(true);
      toast.success('Opt-out registrado com sucesso!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar sua solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Validando acesso...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ShieldX className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            <CardDescription>
              Não foi possível validar seu acesso a esta página
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{tokenError}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Se você recebeu um link por e-mail, verifique se está utilizando o link completo.
              Tokens expiram após 24 horas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Solicitação Processada</h2>
            <p className="text-muted-foreground">
              Você foi removido de nossa lista de marketing. Não receberá mais
              comunicações promocionais.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MailX className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Cancelar Inscrição</CardTitle>
          <CardDescription>
            Não deseja mais receber nossas comunicações de marketing?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu E-mail</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        {...field} 
                        disabled={!!prefilledEmail}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cancelar Inscrição
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Ao cancelar a inscrição, você ainda poderá receber comunicações 
                relacionadas a serviços contratados e informações importantes.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
