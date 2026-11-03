# 🛒 Gestor de Compras Inteligente

Este é um sistema completo para gestão de compras e despesas, capaz de processar notas fiscais eletrônicas e fornecer visualizações detalhadas dos gastos.

## 🚀 Funcionalidades

- **Leitura Automática de Notas:** Importação de arquivos **XML** (NF-e), de até 4 MB. A importação de PDF ainda não está implementada.
- **Categorização Inteligente:** Identifica automaticamente o tipo de gasto (Ex: Suprimentos Médicos, Limpeza, Alimentação) com base nos itens da nota.
- **Painel de Controle (Dashboard):** Visualização de gastos por categoria através de gráficos de pizza e barras.
- **Relatórios Profissionais:** Geração de relatórios em **PDF** com tabelas detalhadas das compras.
- **Gerenciamento Completo:** Edição e exclusão de registros de compras diretamente pela interface.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js** (com Vite)
- **Recharts** (Gráficos interativos)
- **jsPDF** (Geração de relatórios)
- **CSS3** (Estilização personalizada)

### Backend
- **Node.js** com **Express**
- **PostgreSQL no Neon** (Banco persistente, compatível com Vercel)
- **Multer** (Upload de arquivos)
- **xml2js** (Processamento de NF-e)

## 📦 Como Instalar e Rodar

### Pré-requisitos
- Node.js instalado
- Git instalado

### 1. Clone o repositório
```bash
git clone https://github.com/Roberta-Bittencourtt/Gestor-Compras.git
cd Gestor-Compras
```

### 2. Instalar e configurar o Servidor (Backend)
Na raiz do repositório:
```bash
npm install
npm ci --prefix client
cp .env.example .env
```
Preencha `DATABASE_URL` no `.env` com a conexão PostgreSQL. Nunca adicione credenciais ao Git. Execute `server/migrations/001_compras.sql` no banco antes de iniciar.

```bash
npm start
```
O servidor rodará em `http://localhost:5000`. A API usa `/api` e o Vite encaminha essas chamadas ao servidor durante o desenvolvimento.

### 3. Iniciar o Cliente (Frontend)
Abra um novo terminal e:
```bash
cd client
npm run dev
```
O site estará disponível em: `http://localhost:5173` (ou o endereço que aparecer no terminal)

## Publicação na Vercel

- Importe o repositório usando a raiz como Root Directory e Node.js 24.
- O arquivo `vercel.json` configura instalação, build, saída `client/dist` e a API.
- Configure `DATABASE_URL` como variável sensível de produção, usando a conexão com pool do Neon.
- Aplique `server/migrations/001_compras.sql` no banco escolhido.
- `/api/health` verifica a conexão e a tabela de compras.
- Mantenha a proteção de acesso da Vercel ativa ao armazenar dados internos. A aplicação ainda não tem login próprio.
- Configure um banco separado para previews antes de habilitar gravações nesse ambiente.

## 👤 Autora
- **Roberta Bittencourtt**

---
Desenvolvido com ❤️ para facilitar a gestão financeira.
