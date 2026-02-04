import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - will be replaced with Supabase auth
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }, 1000);
  };

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
            O CRM Financeiro<br />
            para Agências de<br />
            <span className="text-accent">Alto Crescimento</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            Unifique gestão comercial, controle financeiro e comissionamento em uma única plataforma.
          </p>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="text-3xl font-bold text-accent">+500</p>
            <p className="text-sm text-primary-foreground/60">Agências ativas</p>
          </div>
          <div className="h-12 w-px bg-primary-foreground/20" />
          <div>
            <p className="text-3xl font-bold text-accent">R$2.5M</p>
            <p className="text-sm text-primary-foreground/60">Gerenciados/mês</p>
          </div>
          <div className="h-12 w-px bg-primary-foreground/20" />
          <div>
            <p className="text-3xl font-bold text-accent">98%</p>
            <p className="text-sm text-primary-foreground/60">Satisfação</p>
          </div>
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
            <CardTitle className="text-2xl font-semibold">Bem-vindo de volta</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar sua conta
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
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a href="#" className="text-sm text-accent hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <a href="#" className="text-accent hover:underline font-medium">
                Fale com vendas
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
