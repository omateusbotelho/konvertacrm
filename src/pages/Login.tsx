import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      const destination = from === "/login" ? "/" : from;
      navigate(destination, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-bold text-primary-foreground">K</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            KonvertaOS
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Lembrar de mim
              </label>
            </div>
            <Link 
              to="/forgot-password" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "ENTRAR"
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          Acesso restrito a usuários autorizados
        </p>
      </div>
    </div>
  );
}
