# observAI

Dashboard de observabilidade para contas Datadog. Visualiza custos estimados e métricas de uso (APM, Infrastructure, Logs, RUM, Containers, etc.) com fallback automático para o plano Free.

---

## Visão Geral

| | |
|---|---|
| **Stack** | Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Recharts |
| **Deploy** | Docker · Kubernetes (k3d) |
| **APIs** | Datadog `/api/v2/usage/estimated_cost` e `/api/v1/usage/summary` |
| **Autenticação** | API Key + Application Key (in-memory, sem persistência) |

### Funcionalidades

- Tela de setup com seletor de site Datadog (US1, US3, US5, EU1, AP1)
- Dashboard com cards de resumo, trend chart, distribuição por produto e tabela detalhada
- **Fallback automático**: tenta cost API → se 403 (plano Free / sem billing admin), usa usage API
- Proxy server-side para as APIs do Datadog (evita exposição de chaves no browser)
- Error boundaries com mensagens de erro legíveis

---

## Estrutura do Projeto

```
observAI/
├── Dockerfile                        # Build multi-stage (deps → builder → runner)
├── k8s/
│   └── manifests.yaml                # Namespace, Deployment e Service
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Tela de setup / login
│   │   ├── layout.tsx                # Root layout com providers
│   │   ├── globals.css               # Tailwind v4 + glassmorphism
│   │   ├── error.tsx                 # Error boundary nível de rota
│   │   ├── global-error.tsx          # Error boundary raiz
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Dashboard principal
│   │   └── api/datadog/
│   │       ├── validate/route.ts     # POST — valida credenciais
│   │       ├── costs/route.ts        # GET  — estimated cost (v2)
│   │       └── usage/route.ts        # GET  — usage summary (v1, fallback)
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── SummaryCards.tsx      # Cards: mês, total, MoM, top produto
│   │   │   ├── CostTrendChart.tsx    # Line chart — tendência 6 meses
│   │   │   ├── CostDistributionChart.tsx  # Pie chart — distribuição por produto
│   │   │   ├── ProductBreakdownChart.tsx  # Bar chart — top 10 produtos
│   │   │   └── CostTable.tsx         # Tabela ordenável por produto
│   │   └── ui/                       # Componentes shadcn/ui
│   ├── context/
│   │   └── credentials.tsx           # React Context — credenciais in-memory
│   ├── hooks/
│   │   └── useCosts.ts               # Hook — fetch com fallback cost→usage
│   ├── lib/
│   │   └── utils.ts                  # cn() helper
│   └── types/
│       └── datadog.ts                # Tipos: Credentials, MonthlyCostEntry, etc.
└── next.config.ts                    # output: standalone
```

---

## Pré-requisitos

- Node.js 22+
- Docker
- kubectl + k3d (para deploy em cluster local)

---

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em modo dev
npm run dev
```

Acesse `http://localhost:3000`, insira suas chaves Datadog e clique em **Connect Account**.

---

## Deploy no Kubernetes (k3d)

### 1. Build da imagem

```bash
docker build -t observai:latest .
```

### 2. Importar no cluster k3d

```bash
k3d image import observai:latest -c <nome-do-cluster>
```

### 3. Aplicar os manifests

```bash
kubectl apply -f k8s/manifests.yaml
```

### 4. Aguardar o deploy

```bash
kubectl rollout status deployment/observai -n observai
```

### 5. Expor via port-forward

```bash
kubectl port-forward svc/observai 3000:80 -n observai --address 0.0.0.0
```

Acesse `http://localhost:3000` (ou pelo IP do servidor).

---

## Variáveis de Ambiente (container)

Definidas no `k8s/manifests.yaml` e no `Dockerfile`. Não requerem configuração manual.

| Variável | Valor | Descrição |
|---|---|---|
| `NODE_ENV` | `production` | Modo de execução |
| `NEXT_TELEMETRY_DISABLED` | `1` | Desativa telemetria Next.js |
| `HOSTNAME` | `0.0.0.0` | Bind em todas as interfaces |
| `PORT` | `3000` | Porta interna do servidor |

> As chaves Datadog **nunca** são persistidas. São armazenadas apenas em memória React durante a sessão do browser.

---

## Autenticação Datadog

### Onde encontrar as chaves

| Chave | Caminho no Datadog |
|---|---|
| API Key | Organization Settings → API Keys |
| Application Key | Organization Settings → Application Keys |

### Permissões necessárias

| Endpoint usado | Scope necessário | Observação |
|---|---|---|
| `/api/v1/validate` | qualquer API Key válida | — |
| `/api/v2/usage/estimated_cost` | `usage_read` + Billing Admin role | Apenas plano Pro/Enterprise |
| `/api/v1/usage/summary` | `usage_read` | Disponível no plano Free |

O dashboard detecta automaticamente o nível de acesso:
- **Com billing admin** → exibe custos em dólares
- **Sem billing admin / plano Free** → exibe métricas de uso (hosts, spans, eventos)

---

## API Routes

### `POST /api/datadog/validate`

Valida as credenciais contra o Datadog.

```json
// Body
{ "apiKey": "...", "appKey": "...", "site": "datadoghq.com" }

// Resposta OK
{ "valid": true, "org": "Nome da Organização" }
```

### `GET /api/datadog/costs`

Busca os últimos 6 meses de custos estimados.

```
Headers: x-dd-api-key, x-dd-app-key
Query:   site=datadoghq.com
```

### `GET /api/datadog/usage`

Fallback — busca os últimos 6 meses de usage summary (APM Hosts, Infra Hosts, Containers, Logs, etc.).

```
Headers: x-dd-api-key, x-dd-app-key
Query:   site=datadoghq.com
```

---

## Sites Suportados

| Site | URL |
|---|---|
| US1 (padrão) | `datadoghq.com` |
| US3 | `us3.datadoghq.com` |
| US5 | `us5.datadoghq.com` |
| EU1 | `datadoghq.eu` |
| AP1 | `ap1.datadoghq.com` |

---

## Tecnologias

| Pacote | Uso |
|---|---|
| `next` 16 | Framework React com App Router |
| `recharts` 3 | Gráficos (line, bar, pie) |
| `shadcn/ui` | Componentes de UI |
| `tailwindcss` 4 | Estilização |
| `sonner` | Notificações toast |
| `lucide-react` | Ícones |
| `next-themes` | Suporte a tema |
