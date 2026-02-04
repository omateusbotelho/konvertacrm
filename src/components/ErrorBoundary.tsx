import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Integrate with Sentry when configured
    // if (window.Sentry) {
    //   Sentry.captureException(error, { 
    //     contexts: { react: { componentStack: errorInfo.componentStack } } 
    //   });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            <Alert variant="destructive" className="border-destructive/50">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">
                Algo deu errado
              </AlertTitle>
              <AlertDescription className="mt-2 text-muted-foreground">
                Ocorreu um erro inesperado. Nossa equipe foi notificada.
              </AlertDescription>
            </Alert>

            <div className="bg-card rounded-lg border p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                O que você pode fazer:
              </p>
              
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Tentar novamente a ação que causou o erro</li>
                <li>• Recarregar a página</li>
                <li>• Voltar para a página inicial</li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  onClick={this.handleReload}
                  variant="default"
                  className="flex-1"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Recarregar Página
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Voltar para Home
                </Button>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-destructive mb-2">
                    Detalhes do Erro (Dev Only)
                  </p>
                  <div className="bg-muted/50 rounded p-3 overflow-auto max-h-48">
                    <pre className="text-xs text-destructive whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Boundary for specific routes with simpler UI
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Erro ao carregar página
          </h2>
          <p className="text-muted-foreground mb-4 text-center">
            Não foi possível carregar este conteúdo.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Recarregar Página
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
