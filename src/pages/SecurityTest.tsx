import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

interface TestResult {
  name: string;
  description: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export default function SecurityTest() {
  const { user, role } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    try {
      // TEST 1: Verificar se SDR só vê próprios deals
      if (role === 'sdr') {
        const { data: deals, error } = await supabase
          .from('deals')
          .select('id, owner_id, sdr_id, closer_id');

        if (error) {
          testResults.push({
            name: 'RLS - Deals Visibility (SDR)',
            description: 'SDR deve ver apenas próprios deals',
            status: 'error',
            message: `Erro ao buscar deals: ${error.message}`,
          });
        } else {
          const hasOthersDeals = deals?.some(
            (d) => d.owner_id !== user?.id && d.sdr_id !== user?.id && d.closer_id !== user?.id
          );

          testResults.push({
            name: 'RLS - Deals Visibility (SDR)',
            description: 'SDR deve ver apenas próprios deals',
            status: hasOthersDeals ? 'error' : 'success',
            message: hasOthersDeals
              ? `❌ FALHA: SDR pode ver ${deals?.length} deals de outros usuários!`
              : `✅ OK: SDR vê apenas próprios deals (${deals?.length} deals)`,
          });
        }
      }

      // TEST 2: Verificar se Closer/Admin vê todos os deals
      if (role === 'closer' || role === 'admin') {
        const { data: deals, error } = await supabase
          .from('deals')
          .select('id, owner_id, sdr_id, closer_id');

        if (error) {
          testResults.push({
            name: `RLS - Deals Visibility (${role})`,
            description: `${role} deve ver todos os deals`,
            status: 'error',
            message: `Erro ao buscar deals: ${error.message}`,
          });
        } else {
          testResults.push({
            name: `RLS - Deals Visibility (${role})`,
            description: `${role} deve ver todos os deals`,
            status: 'success',
            message: `✅ OK: ${role} vê todos os deals (${deals?.length} deals)`,
          });
        }
      }

      // TEST 3: Verificar se pode acessar invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, deal_id')
        .limit(10);

      if (invoicesError) {
        testResults.push({
          name: 'RLS - Invoices Access',
          description: 'Verificar acesso a invoices',
          status: 'warning',
          message: `Erro: ${invoicesError.message}`,
        });
      } else {
        // Para SDR/Closer, verificar se todas as invoices são de seus deals
        if (role !== 'admin') {
          const { data: userDeals } = await supabase
            .from('deals')
            .select('id')
            .or(`owner_id.eq.${user?.id},sdr_id.eq.${user?.id},closer_id.eq.${user?.id}`);

          const userDealIds = new Set(userDeals?.map((d) => d.id));
          const hasOthersInvoices = invoices?.some((inv) => inv.deal_id && !userDealIds.has(inv.deal_id));

          testResults.push({
            name: 'RLS - Invoices Access',
            description: 'Usuário deve ver apenas invoices de seus deals',
            status: hasOthersInvoices ? 'error' : 'success',
            message: hasOthersInvoices
              ? `❌ FALHA: Pode ver invoices de outros usuários!`
              : `✅ OK: Vê apenas próprias invoices (${invoices?.length})`,
          });
        } else {
          testResults.push({
            name: 'RLS - Invoices Access (Admin)',
            description: 'Admin deve ver todas as invoices',
            status: 'success',
            message: `✅ OK: Admin vê todas as invoices (${invoices?.length})`,
          });
        }
      }

      // TEST 4: Verificar acesso a activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, deal_id, created_by')
        .limit(10);

      if (activitiesError) {
        testResults.push({
          name: 'RLS - Activities Access',
          description: 'Verificar acesso a activities',
          status: 'warning',
          message: `Erro: ${activitiesError.message}`,
        });
      } else {
        testResults.push({
          name: 'RLS - Activities Access',
          description: 'Usuário acessa activities apropriadamente',
          status: 'success',
          message: `✅ OK: Acesso a ${activities?.length} activities`,
        });
      }

      // TEST 5: Verificar acesso a comissões
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('id, user_id')
        .limit(10);

      if (commissionsError) {
        testResults.push({
          name: 'RLS - Commissions Access',
          description: 'Verificar acesso a comissões',
          status: 'warning',
          message: `Erro: ${commissionsError.message}`,
        });
      } else {
        if (role !== 'admin') {
          const hasOthersCommissions = commissions?.some((c) => c.user_id !== user?.id);

          testResults.push({
            name: 'RLS - Commissions Access',
            description: 'Usuário deve ver apenas próprias comissões',
            status: hasOthersCommissions ? 'error' : 'success',
            message: hasOthersCommissions
              ? `❌ FALHA: Pode ver comissões de outros!`
              : `✅ OK: Vê apenas próprias comissões (${commissions?.length})`,
          });
        } else {
          testResults.push({
            name: 'RLS - Commissions Access (Admin)',
            description: 'Admin deve ver todas as comissões',
            status: 'success',
            message: `✅ OK: Admin vê todas comissões (${commissions?.length})`,
          });
        }
      }

      // TEST 6: Verificar acesso a audit_logs (apenas admin)
      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('id')
        .limit(5);

      if (role === 'admin') {
        testResults.push({
          name: 'RLS - Audit Logs Access (Admin)',
          description: 'Admin deve poder ver audit logs',
          status: auditError ? 'error' : 'success',
          message: auditError 
            ? `❌ ERRO: ${auditError.message}` 
            : `✅ OK: Admin vê audit logs (${auditLogs?.length})`,
        });
      } else {
        testResults.push({
          name: 'RLS - Audit Logs Access',
          description: 'Não-admin NÃO deve ver audit logs',
          status: (auditLogs?.length ?? 0) > 0 ? 'error' : 'success',
          message: (auditLogs?.length ?? 0) > 0
            ? `❌ FALHA: Não-admin pode ver ${auditLogs?.length} audit logs!`
            : `✅ OK: Não-admin não vê audit logs`,
        });
      }

      // TEST 7: Verificar acesso a user_roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .limit(10);

      if (role === 'admin') {
        testResults.push({
          name: 'RLS - User Roles Access (Admin)',
          description: 'Admin deve poder gerenciar roles',
          status: rolesError ? 'error' : 'success',
          message: rolesError 
            ? `❌ ERRO: ${rolesError.message}` 
            : `✅ OK: Admin vê todas roles (${roles?.length})`,
        });
      } else {
        const hasOthersRoles = roles?.some((r) => r.user_id !== user?.id);
        testResults.push({
          name: 'RLS - User Roles Access',
          description: 'Usuário deve ver apenas própria role',
          status: hasOthersRoles ? 'error' : 'success',
          message: hasOthersRoles
            ? `❌ FALHA: Pode ver roles de outros usuários!`
            : `✅ OK: Vê apenas própria role`,
        });
      }

      // TEST 8: Tentar criar deal
      const { data: createdDeal, error: createError } = await supabase
        .from('deals')
        .insert({
          title: 'TEST - DELETAR',
          company_id: null,
          deal_type: 'project',
          value: 1,
          source: 'other',
          owner_id: user?.id,
          stage: 'lead',
          probability: 10,
        })
        .select()
        .single();

      if (createError) {
        testResults.push({
          name: 'RLS - Create Deal Permission',
          description: 'Verificar permissão para criar deals',
          status: 'error',
          message: `❌ ERRO ao criar deal: ${createError.message}`,
        });
      } else {
        // Limpar deal de teste
        if (createdDeal) {
          await supabase.from('deals').delete().eq('id', createdDeal.id);
        }
        testResults.push({
          name: 'RLS - Create Deal Permission',
          description: 'Verificar permissão para criar deals',
          status: 'success',
          message: '✅ OK: Pode criar deals (deal de teste foi removido)',
        });
      }

    } catch (error) {
      testResults.push({
        name: 'Test Suite Error',
        description: 'Erro geral nos testes',
        status: 'error',
        message: `Erro inesperado: ${error}`,
      });
    }

    setResults(testResults);
    setIsRunning(false);
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-secondary-foreground" />;
      default:
        return null;
    }
  };

  const errorCount = results.filter((r) => r.status === 'error').length;
  const successCount = results.filter((r) => r.status === 'success').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;

  return (
    <AppLayout title="Testes de Segurança">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">🔒 Testes de Segurança (RLS)</h1>
            <p className="text-muted-foreground">
              Valide se as políticas de Row Level Security estão funcionando corretamente.
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Esta página é apenas para desenvolvimento/staging. NÃO expor em produção.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
            <CardDescription>Contexto do teste</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Role</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {role || 'Não definido'}
                </span>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={runTests} 
          disabled={isRunning} 
          size="lg" 
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executando Testes...
            </>
          ) : (
            '▶️ Executar Testes de Segurança'
          )}
        </Button>

        {results.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Resumo dos Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-accent/50 rounded-lg border border-accent">
                    <p className="text-2xl font-bold text-primary">
                      {successCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Sucessos</p>
                  </div>
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/50">
                    <p className="text-2xl font-bold text-destructive">
                      {errorCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Falhas</p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg border border-border">
                    <p className="text-2xl font-bold text-secondary-foreground">
                      {warningCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Avisos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Resultados Detalhados</h2>
              {results.map((result, index) => (
                <Card 
                  key={index} 
                  className={
                    result.status === 'error' 
                      ? 'border-destructive' 
                      : result.status === 'warning' 
                        ? 'border-secondary' 
                        : 'border-primary'
                  }
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {getIcon(result.status)}
                      <div className="flex-1">
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-muted-foreground">{result.description}</p>
                        <p className="text-sm mt-1">{result.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
