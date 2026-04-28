# 🛒 Gestor de Compras Inteligente

Este é um sistema completo para gestão de compras e despesas, capaz de processar notas fiscais eletrônicas e fornecer visualizações detalhadas dos gastos.

## 🚀 Funcionalidades

- **Leitura Automática de Notas:** Suporte para importação de arquivos **XML** (NF-e) e **PDF**.
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
- **SQLite** (Banco de dados leve e eficiente)
- **Multer** (Upload de arquivos)
- **xml2js** e **pdf-parse** (Processamento de documentos)

## 📦 Como Instalar e Rodar

### Pré-requisitos
- Node.js instalado
- Git instalado

### 1. Clone o repositório
```bash
git clone https://github.com/Roberta-Bittencourtt/Gestor-Compras.git
cd Gestor-Compras
```

### 2. Configurar o Servidor (Backend)
```bash
cd server
npm install
node index.js
```
O servidor rodará em: `http://localhost:5000`

### 3. Configurar o Cliente (Frontend)
Abra um novo terminal e:
```bash
cd client
npm install
npm run dev
```
O site estará disponível em: `http://localhost:5173` (ou o endereço que aparecer no terminal)

## 👤 Autora
- **Roberta Bittencourtt**

---
Desenvolvido com ❤️ para facilitar a gestão financeira.
