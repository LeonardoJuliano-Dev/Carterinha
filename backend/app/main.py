import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .schemas import (
    TransactionAnalysisRequest,
    TransactionAnalysisResponse,
    ReceiptExtractionRequest,
    ReceiptExtractionResponse,
    PriceComparisonRequest,
    PriceComparisonResponse,
    UserBehaviorProfileRequest,
    UserBehaviorProfileResponse,
    AdvisorChatRequest,
    AdvisorChatResponse,
)
from .ai_service import FinancialConsultantService
from .behavior_ml import UserBehaviorMLEngine

load_dotenv()

app = FastAPI(
    title="Carterinha Financial AI & Machine Learning Microservice",
    description="Microserviço Stateless de Machine Learning e Inteligência Artificial para Finanças Pessoais Local-First",
    version="2.0.0"
)

# Configuração de CORS parametrizável via variável de ambiente (ALLOWED_ORIGINS)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = FinancialConsultantService()
ml_engine = UserBehaviorMLEngine()


@app.get("/health", tags=["Health"])
async def health_check():
    """Verifica a disponibilidade do microserviço."""
    return {
        "status": "online",
        "service": "carterinha-financial-ai-ml",
        "stateless": True,
        "gemini_active": bool(os.getenv("GEMINI_API_KEY")),
        "openai_active": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post(
    "/analyze",
    response_model=TransactionAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
    summary="Analisar despesa não essencial e fornecer parecer financeiro"
)
async def analyze_transaction(request: TransactionAnalysisRequest):
    """
    Recebe os dados de uma despesa Não Essencial e contexto de metas,
    devolvendo um parecer fundamentado sobre custo de oportunidade e impacto.
    """
    try:
        response = await ai_service.analyze_transaction(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no processamento da análise financeira: {str(e)}"
        )


@app.post(
    "/extract-receipt",
    response_model=ReceiptExtractionResponse,
    status_code=status.HTTP_200_OK,
    tags=["Receipts"],
    summary="Extrair estabelecimento, valor total e itens a partir da fatura"
)
async def extract_receipt(request: ReceiptExtractionRequest):
    """
    Processa a imagem ou dados de uma fatura/recibo e extrai
    automaticamente o estabelecimento, valor total, itens e categoria.
    """
    try:
        response = await ai_service.extract_receipt_info(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao extrair dados da fatura: {str(e)}"
        )


@app.post(
    "/compare-price",
    response_model=PriceComparisonResponse,
    status_code=status.HTTP_200_OK,
    tags=["Price Intelligence"],
    summary="Comparar preço do item com histórico de compras anteriores"
)
async def compare_price(request: PriceComparisonRequest):
    """
    Compara o preço de uma compra com o histórico de compras em outras lojas,
    fornecendo alertas de preço elevado ou confirmações de poupança.
    """
    try:
        response = ai_service.compare_price_history(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao comparar histórico de preços: {str(e)}"
        )


@app.post(
    "/behavior-profile",
    response_model=UserBehaviorProfileResponse,
    status_code=status.HTTP_200_OK,
    tags=["Machine Learning & Behavior"],
    summary="Estudar comportamento de gastos e gerar perfil de Machine Learning"
)
async def analyze_user_behavior(request: UserBehaviorProfileRequest):
    """
    Algoritmo de Machine Learning que analisa a velocidade de queima de caixa (burn rate),
    concentração de fim de semana, índice de impulsividade e arquétipo financeiro.
    """
    try:
        response = await ml_engine.generate_profile(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar perfil de comportamento com ML: {str(e)}"
        )


@app.post(
    "/advisor-chat",
    response_model=AdvisorChatResponse,
    status_code=status.HTTP_200_OK,
    tags=["Advisor & Goals"],
    summary="Consultor Financeiro Conversacional focado em metas reais e cortes de despesas"
)
async def advisor_chat_endpoint(request: AdvisorChatRequest):
    """
    Processa a mensagem do utilizador no chat do consultor financeiro,
    analisa as metas reais e padrões de gasto, sugere novos cadastros ou monta
    um plano detalhado de poupança com corte de gastos específicos.
    """
    try:
        response = await ai_service.advisor_chat(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no consultor financeiro: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
