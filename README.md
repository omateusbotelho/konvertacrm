# KonvertaCRM

Sistema de CRM para gestão de vendas, pipeline, comissões e faturamento.

## 🚀 Setup Rápido

### 1. Clonar e Instalar

```bash
git clone <YOUR_GIT_URL>
cd konvertacrm
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Chave pública do Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ✅ | ID do projeto Supabase |
| `VITE_APP_URL` | ❌ | URL da aplicação (default: localhost:8080) |
| `VITE_SENTRY_DSN` | ❌ | DSN do Sentry para monitoramento |

### 3. Rodar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`

### 4. Build para Produção

```bash
npm run build
npm run preview  # Para testar o build localmente
```

## 🧪 Testes

```bash
npm run test        # Rodar testes uma vez
npm run test:watch  # Rodar testes em modo watch
```

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **State**: TanStack Query (React Query)
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Forms**: React Hook Form, Zod
- **Charts**: Recharts

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes React
│   ├── ui/         # Componentes base (shadcn)
│   ├── dashboard/  # Componentes do dashboard
│   ├── pipeline/   # Componentes do pipeline
│   └── ...
├── hooks/          # Custom hooks
├── contexts/       # React contexts
├── lib/            # Utilitários e helpers
├── pages/          # Páginas da aplicação
├── types/          # TypeScript types
└── integrations/   # Integrações (Supabase)

supabase/
├── functions/      # Edge Functions
└── migrations/     # Migrações do banco
```

## 🔐 Variáveis de Ambiente

Veja `.env.example` para lista completa de variáveis.

**Importante**: A aplicação valida as variáveis de ambiente no startup. Se alguma variável obrigatória estiver faltando, um erro claro será exibido.

## 📚 Documentação Adicional

- [Lovable Docs](https://docs.lovable.dev)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Faça suas alterações
3. Rode os testes
4. Abra um PR

## 📝 Licença

Proprietary - Konverta
