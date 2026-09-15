---
description: Atue como um desenvolvedor Full-Stack sênior e crie a base de um sistema de finanças pessoais "Local-First" focado em análise proativa de gastos e metas de vida. O projeto possui um frontend mobile e um microserviço de IA.
---

**Stack Tecnológico do Workspace:**
*   **Frontend Mobile:** React Native (Expo), Tailwind CSS (NativeWind), Zustand e `expo-sqlite` (banco de dados no dispositivo).
*   **Backend AI (Microserviço):** Python, FastAPI, Uvicorn e Pydantic.
*   **Contexto MCP:** O arquivo `finances.db` (SQLite) está exposto via Model Context Protocol (MCP), permitindo que você valide queries e schemas diretamente na raiz.

**Regras Rígidas de Arquitetura (Padrão Local-First):**
*   O aplicativo React Native é a única fonte da verdade e o único componente que tem acesso de leitura/escrita ao banco de dados `finances.db` (via `expo-sqlite`).
*   O microserviço FastAPI em Python deve ser 100% "stateless" (sem estado). Ele NÃO deve se conectar a banco de dados, não deve usar Prisma ou qualquer ORM. Sua única função é receber o endpoint POST, enviar o contexto para o LLM e devolver a string de feedback.
*   Toda a lógica de negócios (fatiamento de renda 50/30/20, cálculo de saldos disponíveis e gravação de histórico) deve ser executada exclusivamente no lado do cliente (Mobile).

**Requisitos e Lógica de Negócio:**
1.  **Alocação Automática de Renda:** Ao registrar o salário, o sistema deve dividi-lo automaticamente em orçamentos (Despesas Fixas, Lazer, Poupança, Investimentos) utilizando a regra 50/30/20, exibindo o saldo disponível por categoria.
2.  **Registro de Transações com Classificação:** Interface para inserir gastos diários/semanais. O usuário informa valor, descrição e um marcador booleano: "Essencial" ou "Não Essencial".
3.  **Consultor de Bolso (Integração IA):** Sempre que um gasto "Não Essencial" for registrado, o mobile deve fazer uma requisição POST para o microserviço FastAPI (rota `/analyze`). O FastAPI usará um LLM para analisar a descrição do gasto e retornar um conselho financeiro direto, calculando se o gasto compensa ou como ele atrasa as metas de vida.
4.  **Armazenamento Local:** O mobile deve receber o conselho da API e salvar a transação completa no SQLite local, preenchendo a coluna `ai_feedback`.

**Plano de Execução Solicitado:**
1.  Gere o código React Native para inicializar o banco de dados `expo-sqlite`, criando as tabelas `budgets` (com limites mensais), `goals` (metas de vida) e `transactions` (incluindo as colunas `is_essential` e `ai_feedback`).
2.  Crie a rota FastAPI `main.py` com o endpoint `/analyze` que recebe os dados da transação e estrutura o prompt de análise financeira.
3.  Implemente a função no mobile que salva a transação e faz a chamada HTTP para o FastAPI de forma assíncrona.