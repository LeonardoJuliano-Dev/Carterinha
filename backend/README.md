# Microserviço de IA Financeira (FastAPI)

Microserviço **100% Stateless** para análise proativa de gastos e metas de vida. Não utiliza base de dados nem ORM.

## Como Executar

1. **Instalar dependências:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Iniciar o servidor com Uvicorn:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Documentação Interativa:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## Endpoints

- `GET /health`: Estado do microserviço.
- `POST /analyze`: Envio de transação não essencial para cálculo de custo de oportunidade e parecer de IA.
