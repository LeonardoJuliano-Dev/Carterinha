# Frontend Mobile: Finanças Pessoais Local-First

Aplicação móvel construída com **React Native (Expo)**, **Tailwind CSS (NativeWind)**, **Zustand** e **`expo-sqlite`**.

## Arquitetura Local-First

- **Fonte da Verdade:** `finances.db` (SQLite local gerido por `expo-sqlite`).
- **Estado Reativo:** `useFinanceStore` (Zustand) que sincroniza automaticamente as operações de leitura e escrita com a base de dados local.
- **Divisão de Rendimento 50/30/20:**
  - 50% para Despesas Fixas / Essenciais
  - 30% para Lazer & Estilo de Vida
  - 20% para Metas de Vida & Poupança
- **Consultor de IA Proativo:** Ao registar uma despesa com `is_essential: false`, a aplicação efetua uma requisição assíncrona ao microserviço FastAPI (`/analyze`) e atualiza o registo local com a coluna `ai_feedback`.

## Estrutura de Diretórios

```
src/
├── database/
│   ├── db.ts               # Conexão e inicialização das tabelas SQLite
│   └── queries.ts          # Queries CRUD (budgets, goals, transactions)
├── services/
│   └── api.ts              # Cliente HTTP para o microserviço FastAPI
├── stores/
│   └── financeStore.ts     # Store Zustand com integração da lógica de negócio
├── types/
│   └── index.ts            # Interfaces TypeScript
├── utils/
│   └── budgetCalculations.ts # Cálculo da regra 50/30/20
└── index.ts
```
