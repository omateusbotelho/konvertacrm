import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Shield, CheckCircle2 } from 'lucide-react';

const consentSchema = z.object({
  company_name: z.string().min(2, 'Nome da empresa é obrigatório'),
  contact_name: z.string().min(2, 'Nome do contato é obrigatório'),
  email: z.string().email('E-mail inválido'),
  marketing_consent: z.boolean(),
  data_processing_consent: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar o processamento de dados para continuar',
  }),
});

type ConsentFormData = z.infer<typeof consentSchema>;

export default function LGPDConsent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ConsentFormData>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      company_name: '',
      contact_name: '',
      email: '',
      marketing_consent: false,
      data_processing_consent: false,
    },
  });

  const handleSubmit = async (data: ConsentFormData) => {
    setIsSubmitting(true);
    try {
      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.company_name,
          created_by: null, // Public submission
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          full_name: data.contact_name,
          email: data.email,
          company_id: company.id,
          is_primary: true,
          created_by: null,
        })
        .select()
        .single();

      if (contactError) throw contactError;

      // Register consents
      const consents = [];
      
      if (data.data_processing_consent) {
        consents.push({
          contact_id: contact.id,
          company_id: company.id,
          consent_type: 'data_processing' as const,
          consent_given: true,
          consent_date: new Date().toISOString(),
          ip_address: null,
          user_agent: navigator.userAgent,
        });
      }

      if (data.marketing_consent) {
        consents.push({
          contact_id: contact.id,
          company_id: company.id,
          consent_type: 'marketing' as const,
          consent_given: true,
          consent_date: new Date().toISOString(),
          ip_address: null,
          user_agent: navigator.userAgent,
        });
      }

      const { error: consentError } = await supabase
        .from('lgpd_consents')
        .insert(consents);

      if (consentError) throw consentError;

      setIsSuccess(true);
      toast.success('Consentimento registrado com sucesso!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao registrar consentimento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground">
              Seu consentimento foi registrado com sucesso.
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
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Termo de Consentimento</CardTitle>
          <CardDescription>
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua Empresa Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="data_processing_consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aceito o processamento dos meus dados *</FormLabel>
                        <FormDescription>
                          Autorizo o processamento dos meus dados pessoais para fins de 
                          prestação de serviços e comunicação relacionada ao nosso relacionamento comercial.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketing_consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aceito receber comunicações</FormLabel>
                        <FormDescription>
                          Autorizo o envio de comunicações relacionadas aos serviços contratados. 
                          Você pode cancelar a qualquer momento.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Registrar Consentimento
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Ao enviar este formulário, você declara estar ciente dos seus direitos 
                previstos na LGPD, incluindo acesso, correção e exclusão dos seus dados.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
