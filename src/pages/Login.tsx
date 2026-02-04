import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { toastSuccess, toastError } from "@/lib/toast";

// Validation schemas
const emailSchema = z.string().email("E-mail inválido");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading, signIn } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
      // Redirect to dashboard, not root (since root now redirects to login)
      const destination = from === "/login" ? "/" : from;
      navigate(destination, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toastError(error.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toastError("E-mail ou senha incorretos");
      } else if (error.message.includes("Email not confirmed")) {
        toastError("Por favor, confirme seu e-mail antes de fazer login");
      } else {
        toastError(error.message || "Erro ao fazer login");
      }
      return;
    }
    
    toastSuccess("Login realizado com sucesso!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <span className="text-lg font-bold text-accent-foreground">K</span>
            </div>
            <span className="text-2xl font-semibold text-primary-foreground">KonvertaOS</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Sistema de Gestão<br />
            Comercial e Financeira<br />
            <span className="text-accent">para sua Agência</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            Gerencie seu pipeline de vendas, controle financeiro e comissionamento da equipe em uma única plataforma.
          </p>
        </div>

        <div className="text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} KonvertaOS. Uso interno.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="space-y-1 text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="text-lg font-bold text-primary-foreground">K</span>
              </div>
              <span className="text-2xl font-semibold">KonvertaOS</span>
            </div>
            <CardTitle className="text-2xl font-semibold">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-accent hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Lembrar de mim
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Acesso restrito a usuários autorizados.<br />
              Entre em contato com o administrador para obter credenciais.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
