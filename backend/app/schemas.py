from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class BudgetSplitModel(BaseModel):
    needs_percent: float = Field(default=50.0, ge=0, le=100, description="Percentagem para despesas fixas/essenciais")
    wants_percent: float = Field(default=30.0, ge=0, le=100, description="Percentagem para lazer/estilo de vida")
    savings_percent: float = Field(default=20.0, ge=0, le=100, description="Percentagem para metas e poupança")


class GoalContext(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., description="Nome da meta de vida (ex: 'Fundo de Emergência', 'Férias')")
    target_amount: float = Field(..., gt=0, description="Valor alvo da meta")
    current_amount: float = Field(default=0.0, ge=0, description="Valor atualmente acumulado")
    deadline: Optional[str] = Field(default=None, description="Data limite prevista (YYYY-MM-DD)")


class TransactionItemModel(BaseModel):
    id: Optional[str] = None
    description: str
    amount: float
    category: str
    is_essential: bool
    store_name: Optional[str] = None
    created_at: str


class TransactionAnalysisRequest(BaseModel):
    transaction_id: Optional[str] = Field(default=None, description="Identificador único da transação no telemóvel")
    description: str = Field(..., min_length=1, description="Descrição do gasto (ex: 'Jantar fora', 'Subscrição streaming')")
    amount: float = Field(..., gt=0, description="Valor financeiro da transação")
    category: str = Field(default="lifestyle", description="Categoria do gasto (ex: 'lifestyle', 'lazer', 'outros')")
    is_essential: bool = Field(default=False, description="Indicação se a despesa é essencial (True) ou supérflua (False)")
    lifestyle_budget_remaining: Optional[float] = Field(
        default=None, 
        description="Saldo remanescente na categoria de Lazer/Estilo de Vida"
    )
    store_name: Optional[str] = Field(default=None, description="Nome do estabelecimento/loja")
    active_goals: Optional[List[GoalContext]] = Field(
        default_factory=list, 
        description="Lista das metas de vida ativas do utilizador"
    )
    budget_split: Optional[BudgetSplitModel] = Field(
        default=None,
        description="Divisão personalizada de orçamento do utilizador (ex: 40/30/30, 50/30/20)"
    )


class TransactionAnalysisResponse(BaseModel):
    transaction_id: Optional[str] = None
    advice: str = Field(..., description="Conselho financeiro direto e personalizado gerado pelo consultor de IA")
    impact_level: str = Field(..., description="Nível de impacto financeiro: 'baixo', 'moderado' ou 'alto'")
    opportunity_cost: Optional[str] = Field(default=None, description="Custo de oportunidade em relação às metas de vida")
    suggested_action: Optional[str] = Field(default=None, description="Ação sugerida ao utilizador")


class ReceiptItem(BaseModel):
    name: str = Field(..., description="Nome do produto ou serviço")
    price: float = Field(..., description="Preço do item")
    quantity: float = Field(default=1.0, description="Quantidade")


class ReceiptExtractionRequest(BaseModel):
    image_base64: Optional[str] = Field(default=None, description="Imagem da fatura em formato Base64")
    file_name: Optional[str] = Field(default=None, description="Nome do ficheiro original da fatura")
    raw_text: Optional[str] = Field(default=None, description="Texto OCR opcional para análise")


class ReceiptExtractionResponse(BaseModel):
    store_name: str = Field(..., description="Nome do estabelecimento identificado")
    total_amount: float = Field(..., description="Valor total da fatura extraído com precisão")
    category: str = Field(default="essential", description="Categoria recomendada: 'essential' ou 'lifestyle'")
    date: Optional[str] = Field(default=None, description="Data da compra no formato YYYY-MM-DD")
    items: List[ReceiptItem] = Field(default_factory=list, description="Lista de itens identificados no recibo")
    confidence: float = Field(default=0.95, description="Nível de confiança da extração")
    is_essential: bool = Field(default=True, description="Indicação se a fatura é de consumo essencial")


class PriceRecord(BaseModel):
    store_name: str
    price: float
    date: str


class PriceComparisonRequest(BaseModel):
    item_description: str = Field(..., description="Descrição ou nome do item/produto")
    current_price: float = Field(..., gt=0, description="Preço atual da compra")
    current_store: Optional[str] = Field(default=None, description="Loja atual onde está a comprar")
    historical_records: List[PriceRecord] = Field(default_factory=list, description="Histórico de compras anteriores do mesmo item")


class PriceComparisonResponse(BaseModel):
    is_cheaper: bool = Field(..., description="Se a compra atual é mais barata que a média histórica")
    is_more_expensive: bool = Field(..., description="Se a compra atual é mais cara que o melhor preço registado")
    difference_amount: float = Field(default=0.0, description="Diferença monetária em relação ao histórico")
    previous_best_store: Optional[str] = Field(default=None, description="Loja onde já comprou mais barato")
    previous_best_price: Optional[float] = Field(default=None, description="Melhor preço histórico registado")
    message: str = Field(..., description="Parecer inteligente de comparação de preços")
    saving_tip: Optional[str] = Field(default=None, description="Dica prática de poupança")


# ==========================================
# MACHINE LEARNING & BEHAVIORAL PROFILING
# ==========================================

class UserBehaviorProfileRequest(BaseModel):
    user_name: str = Field(default="Alex Eduardo")
    monthly_income: float = Field(default=24500.0)
    current_balance: float = Field(default=12450.0)
    transactions: List[TransactionItemModel] = Field(default_factory=list)
    active_goals: List[GoalContext] = Field(default_factory=list)
    budget_split: Optional[BudgetSplitModel] = Field(
        default=None,
        description="Divisão personalizada de orçamento do utilizador (ex: 40/30/30, 50/30/20)"
    )


class UserBehaviorProfileResponse(BaseModel):
    archetype: str = Field(..., description="Arquétipo financeiro: 'Poupador Prudente', 'Equilibrado Consciente', 'Impulsivo de Fim de Semana', etc.")
    archetype_badge: str = Field(..., description="Ícone/Rótulo resumido com a regra personalizada")
    impulse_risk_score: int = Field(..., ge=0, le=100, description="Índice de risco de compras por impulso (0 a 100)")
    daily_burn_rate: float = Field(..., description="Velocidade média de gasto diário em MT")
    days_until_depleted: int = Field(..., description="Dias estimados até esgotar o saldo livre no ritmo atual")
    weekend_concentration_pct: float = Field(..., description="Percentagem de gastos de lazer concentrados em sextas/sábados/domingos")
    top_leaking_category: str = Field(..., description="Categoria com maior fuga de dinheiro não planeada")
    ml_insights: List[str] = Field(..., description="Padrões comportamentais descobertos pelo algoritmo de ML")
    personalized_action_plan: str = Field(..., description="Plano de ação proativo sugerido pela IA")


# ==========================================
# CONSULTOR FINANCEIRO IA & CHAT CONVERSACIONAL
# ==========================================

class ChatMessageModel(BaseModel):
    role: str = Field(..., description="'user' ou 'assistant'")
    content: str = Field(..., description="Conteúdo da mensagem")


class AdvisorChatRequest(BaseModel):
    message: str = Field(..., description="Mensagem ou pergunta do utilizador no chat")
    user_name: Optional[str] = Field(default="Utilizador", description="Nome do utilizador")
    active_goals: List[GoalContext] = Field(default_factory=list, description="Metas de vida reais cadastradas")
    budget_split: Optional[BudgetSplitModel] = Field(default=None, description="Regra de orçamento do utilizador")
    monthly_income: Optional[float] = Field(default=None, description="Renda mensal total do utilizador")
    current_balance: Optional[float] = Field(default=None, description="Saldo atual total")
    recent_spending_by_category: Optional[Dict[str, float]] = Field(
        default_factory=dict,
        description="Gastos reais recentes agregados por categoria (ex: {'Lazer': 2500, 'Alimentação': 4000})"
    )
    conversation_history: List[ChatMessageModel] = Field(default_factory=list, description="Histórico da conversa recente")
    just_created_goal: Optional[GoalContext] = Field(default=None, description="Meta recém-cadastrada se o utilizador acabou de criá-la")


class AdvisorChatResponse(BaseModel):
    reply: str = Field(..., description="Resposta inteligente e empática do consultor")
    suggest_goal_creation: bool = Field(default=False, description="Se deve sugerir a criação de uma nova meta")
    suggested_goal_name: Optional[str] = Field(default=None, description="Nome inferido para a meta sugerida")
    suggested_goal_target: Optional[float] = Field(default=None, description="Valor alvo sugerido em MT")
    identified_goal_id: Optional[str] = Field(default=None, description="ID da meta identificada se já existir")
    action_plan: List[str] = Field(default_factory=list, description="Passos do plano de ação para atingir a meta")
    expenses_to_cut: List[str] = Field(default_factory=list, description="Categorias reais sugeridas para corte de despesas")
