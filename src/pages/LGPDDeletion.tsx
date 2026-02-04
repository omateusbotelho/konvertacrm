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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Trash2, CheckCircle2, AlertTriangle, ShieldX } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateLGPDToken, markTokenAsUsed } from '@/lib/lgpd-token';

const deletionSchema = z.object({
  email: z.string().email('E-mail inválido'),
  full_name: z.string().min(2, 'Nome é obrigatório para confirmar sua identidade'),
  reason: z.string().optional(),
});

type DeletionFormData = z.infer<typeof deletionSchema>;

export default function LGPDDeletion() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [prefilledEmail, setPrefilledEmail] = useState<string>('');

  const form = useForm<DeletionFormData>({
    resolver: zodResolver(deletionSchema),
    defaultValues: {
      email: '',
      full_name: '',
      reason: '',
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

      if (result.type && result.type !== 'deletion') {
        setTokenStatus('invalid');
        setTokenError('Este token não é válido para solicitação de exclusão.');
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

  const handleSubmit = async (data: DeletionFormData) => {
    if (!token) return;
    
    setIsSubmitting(true);
    try {
      // Find contact by email and name
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id, company_id')
        .eq('email', data.email)
        .ilike('full_name', `%${data.full_name}%`)
        .maybeSingle();

      if (contactError) throw contactError;

      if (!contact) {
        toast.error('Não encontramos um registro com esse e-mail e nome.');
        return;
      }

      // Create audit log for deletion request
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          resource_type: 'lgpd_deletion_request',
          resource_id: contact.id,
          action: 'deletion_requested',
          changes: {
            email: data.email,
            name: data.full_name,
            reason: data.reason,
            requested_at: new Date().toISOString(),
          },
          user_id: null,
          user_agent: navigator.userAgent,
        });

      if (auditError) {
        console.error('Audit log error:', auditError);
      }

      // Revoke all consents
      await supabase
        .from('lgpd_consents')
        .update({
          revoked: true,
          revoked_at: new Date().toISOString(),
        })
        .eq('contact_id', contact.id);

      // Mark token as used
      await markTokenAsUsed(token);

      setIsSuccess(true);
      toast.success('Solicitação de exclusão registrada!');
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
            <h2 className="text-2xl font-bold mb-2">Solicitação Recebida</h2>
            <p className="text-muted-foreground">
              Sua solicitação de exclusão foi registrada e será processada em até 15 dias úteis,
              conforme previsto na LGPD. Você receberá uma confirmação por e-mail quando o 
              processo for concluído.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trash2 className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Solicitar Exclusão de Dados</CardTitle>
          <CardDescription>
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A exclusão de dados é irreversível. Após o processamento, 
              não será possível recuperar suas informações.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail cadastrado *</FormLabel>
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

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Para confirmar sua identidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nos ajude a melhorar informando o motivo da exclusão"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Solicitar Exclusão
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Conforme o Art. 18 da LGPD, você tem direito à eliminação dos dados 
                pessoais tratados com o seu consentimento. O prazo para processamento 
                é de até 15 dias úteis.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
