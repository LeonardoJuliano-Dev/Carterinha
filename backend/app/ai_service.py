import os
import re
import json
import datetime
import httpx
from typing import Tuple, List, Optional
from dotenv import load_dotenv

load_dotenv()

from .schemas import (
    TransactionAnalysisRequest,
    TransactionAnalysisResponse,
    ReceiptExtractionRequest,
    ReceiptExtractionResponse,
    ReceiptItem,
    PriceComparisonRequest,
    PriceComparisonResponse,
    AdvisorChatRequest,
    AdvisorChatResponse,
    ChatMessageModel,
    GoalContext,
)


class FinancialConsultantService:
    """
    Serviço de Análise Financeira Proativa & Inteligência de Decisão.
    Suporta Google Gemini (Gemini 3.1 Flash Lite / 3.5 Flash) e OpenAI (GPT-4o Mini),
    com fallback 100% offline para o motor de regras heurístico Local-First.
    Moeda base: Metical Moçambicano (MT / MZN).
    """

    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")

    def _build_prompt(self, request: TransactionAnalysisRequest) -> str:
        goals_summary = ""
        if request.active_goals:
            goals_summary = "\nMetas de vida ativas do utilizador:\n"
            for goal in request.active_goals:
                remaining = max(0.0, goal.target_amount - goal.current_amount)
                goals_summary += f"- {goal.name}: Alvo = {goal.target_amount:.2f} MT, Guardado = {goal.current_amount:.2f} MT (Falta {remaining:.2f} MT)\n"
        else:
            goals_summary = "\nO utilizador ainda não definiu metas específicas de poupança."

        budget_info = ""
        if request.lifestyle_budget_remaining is not None:
            budget_info = f"\nSaldo disponível no orçamento de Lazer/Estilo de Vida: {request.lifestyle_budget_remaining:.2f} MT"

        store_info = f"\nEstabelecimento/Loja: {request.store_name}" if request.store_name else ""

        rule_text = "50/30/20"
        if request.budget_split:
            rule_text = f"{request.budget_split.needs_percent:.0f}/{request.budget_split.wants_percent:.0f}/{request.budget_split.savings_percent:.0f}"

        prompt = f"""
És o consultor financeiro pessoal de inteligência proativa do aplicativo Carterinha, empático, direto e focado na regra personalizada {rule_text} e em metas de vida em Meticais Moçambicanos (MT).
Analisa a seguinte despesa NÃO ESSENCIAL que o utilizador pretende ou acabou de registar:

- Descrição: "{request.description}"
- Valor: {request.amount:.2f} MT
- Categoria: {request.category} {store_info}
{budget_info}
{goals_summary}

Gera uma resposta concisa e prática contendo:
1. Um parecer direto sobre se este gasto compromete as finanças ou metas dentro da regra {rule_text}.
2. O impacto percentual ou temporal sobre a principal meta (quantas semanas ou meses atrasa).
3. Uma recomendação prática em Meticais (MT) para compensar o gasto.
Mantém o tom profissional, encorajador e conciso (máximo 2 a 3 frases em Português).
"""
        return prompt.strip()

    async def _call_gemini_llm(self, prompt: str) -> Optional[str]:
        """Contacta a API do Google Gemini com modelos atualizados."""
        if not self.gemini_api_key:
            return None

        models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
        for model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_api_key}"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        json={
                            "contents": [
                                {
                                    "parts": [{"text": prompt}]
                                }
                            ],
                            "generationConfig": {
                                "temperature": 0.3,
                                "maxOutputTokens": 250,
                            }
                        }
                    )
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            text_parts = [p.get("text", "") for p in parts if "text" in p and not p.get("thought", False)]
                            if text_parts:
                                return "".join(text_parts).strip()
            except Exception as e:
                print(f"[Gemini API Error with {model}] {e}")
        return None

    async def _call_openai_llm(self, prompt: str) -> Optional[str]:
        """Contacta a API da OpenAI (GPT-4o Mini)."""
        if not self.openai_api_key:
            return None

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.openai_api_key}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": "És um consultor financeiro pessoal perito na regra 50/30/20 para o aplicativo Carterinha (Moeda: Meticais MT)."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.4,
                        "max_tokens": 180
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[OpenAI API Error] {e}")
        return None

    async def _call_llm_if_available(self, prompt: str) -> Optional[str]:
        """Tenta Gemini primeiro, depois OpenAI se configurado."""
        if self.gemini_api_key:
            res = await self._call_gemini_llm(prompt)
            if res:
                return res

        if self.openai_api_key:
            res = await self._call_openai_llm(prompt)
            if res:
                return res

        return None

    def _generate_rule_based_advice(self, request: TransactionAnalysisRequest) -> Tuple[str, str, str, str]:
        """
        Motor de regras heurístico inteligente Local-First.
        Garante funcionamento imediato e fiável 100% offline em Meticais (MT).
        """
        amount = request.amount
        budget_left = request.lifestyle_budget_remaining if request.lifestyle_budget_remaining is not None else 2000.0
        primary_goal = request.active_goals[0] if request.active_goals else None

        impact_level = "baixo"
        if amount > 5000 or (budget_left > 0 and amount > budget_left * 0.5):
            impact_level = "alto"
        elif amount > 1500 or (budget_left > 0 and amount > budget_left * 0.25):
            impact_level = "moderado"

        opportunity_cost = ""
        delay_text = ""
        if primary_goal:
            missing_goal = max(0.0, primary_goal.target_amount - primary_goal.current_amount)
            pct_of_goal = (amount / primary_goal.target_amount) * 100 if primary_goal.target_amount > 0 else 0
            
            # Estimativa de atraso em semanas
            weekly_savings_rate = max(500.0, (primary_goal.target_amount * 0.20) / 4)
            weeks_delayed = max(1, round(amount / weekly_savings_rate))
            delay_text = f"Esta compra atrasa em aproximadamente {weeks_delayed} semanas a tua meta de {primary_goal.name}."

            opportunity_cost = (
                f"{delay_text} Este valor de {amount:.2f} MT equivale a {pct_of_goal:.1f}% do objetivo "
                f"(faltam {missing_goal:.2f} MT)."
            )
        else:
            opportunity_cost = f"Investir {amount:.2f} MT num depósito a prazo (10% a.a.) renderia cerca de {amount * 0.10:.2f} MT de juros."

        store_str = f" em '{request.store_name}'" if request.store_name else ""

        if impact_level == "alto":
            advice = (
                f"Atenção: A despesa de {amount:.2f} MT em '{request.description}'{store_str} consome uma fatia elevada do teu orçamento de Lazer. "
                f"{opportunity_cost} Se reduzires pequenos gastos de lazer nos próximos dias, recuperas o prazo original da meta."
            )
            suggested_action = "Ponderar adiar a compra ou procurar uma alternativa com melhor preço."
        elif impact_level == "moderado":
            advice = (
                f"O gasto de {amount:.2f} MT em '{request.description}'{store_str} cabe no teu estilo de vida, mas exige atenção ao saldo livre. "
                f"{opportunity_cost}"
            )
            suggested_action = "Registar a despesa e compensar poupando 500 MT/semana nas próximas semanas."
        else:
            advice = (
                f"Gasto controlado ({amount:.2f} MT em '{request.description}'{store_str}). "
                f"Encontra-se dentro do teu orçamento de lazer e não compromete as tuas metas prioritárias."
            )
            suggested_action = "Avançar sem comprometer a disciplina financeira."

        return advice, impact_level, opportunity_cost, suggested_action

    async def analyze_transaction(self, request: TransactionAnalysisRequest) -> TransactionAnalysisResponse:
        """
        Executa a análise da transação não essencial e devolve o conselho estruturado em MT.
        """
        prompt = self._build_prompt(request)
        llm_advice = await self._call_llm_if_available(prompt)

        rule_advice, impact_level, opp_cost, action = self._generate_rule_based_advice(request)

        final_advice = llm_advice if llm_advice else rule_advice

        return TransactionAnalysisResponse(
            transaction_id=request.transaction_id,
            advice=final_advice,
            impact_level=impact_level,
            opportunity_cost=opp_cost,
            suggested_action=action
        )

    async def extract_receipt_info(self, request: ReceiptExtractionRequest) -> ReceiptExtractionResponse:
        """
        Extrai de forma inteligente o estabelecimento, valor total, categoria e itens da fatura/recibo.
        Usa modelos Gemini Vision rápidos (Flash Lite) com fallback local inteligente.
        """
        if self.gemini_api_key and request.image_base64:
            clean_b64 = request.image_base64.split(",")[-1].strip()
            vision_models = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
            
            prompt_text = """
Analise com extrema precisão esta imagem de fatura/talão/recibo de compras e extraia os dados estritamente em JSON:
{
  "store_name": "Nome exato do Estabelecimento ou Loja comercial",
  "total_amount": 0.0,
  "category": "essential ou lifestyle",
  "date": "YYYY-MM-DD",
  "items": [
    {"name": "Nome do Produto", "price": 0.0, "quantity": 1.0}
  ]
}
Regras:
1. "total_amount": extraia o valor total final pago em número decimal (ex: 450.00). Não invente valores se não estiver visível.
2. "store_name": nome exato do estabelecimento (ex: Shoprite, VIP Spar, Jumbo, etc.). Se não identificar, use null.
3. "items": lista de produtos/serviços detalhados no recibo com nome legível e preço numérico.
4. "category": "essential" para alimentação, saúde, farmácia, combustíveis, utilitários; "lifestyle" para restaurantes, eletrónica, lazer, vestuário.
5. Responda estritamente em JSON válido sem texto adicional.
"""
            for model in vision_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_api_key}"
                    async with httpx.AsyncClient(timeout=20.0) as client:
                        response = await client.post(
                            url,
                            headers={"Content-Type": "application/json"},
                            json={
                                "contents": [
                                    {
                                        "parts": [
                                            {"text": prompt_text},
                                            {
                                                "inline_data": {
                                                    "mime_type": "image/jpeg",
                                                    "data": clean_b64
                                                }
                                            }
                                        ]
                                    }
                                ],
                                "generationConfig": {
                                    "temperature": 0.1,
                                    "responseMimeType": "application/json"
                                }
                            }
                        )
                        if response.status_code == 200:
                            data = response.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                text_parts = [p.get("text", "") for p in parts if "text" in p and not p.get("thought", False)]
                                raw_json = "".join(text_parts).strip()
                                
                                json_match = re.search(r'\{.*\}', raw_json, re.DOTALL)
                                if json_match:
                                    parsed = json.loads(json_match.group(0))
                                    store_name = parsed.get("store_name") or "Desconhecido"
                                    try:
                                        total_amount = float(parsed.get("total_amount") or 0.0)
                                    except (ValueError, TypeError):
                                        total_amount = 0.0
                                    
                                    category = parsed.get("category", "essential")
                                    if category not in ["essential", "lifestyle"]:
                                        category = "essential"
                                    
                                    items = []
                                    for i in parsed.get("items", []):
                                        try:
                                            p_price = float(i.get("price") or 0.0)
                                            p_qty = float(i.get("quantity") or 1.0)
                                            p_name = str(i.get("name") or "Item").strip()
                                            if p_name:
                                                items.append(ReceiptItem(name=p_name, price=p_price, quantity=p_qty))
                                        except Exception:
                                            continue

                                    if total_amount <= 0.0 and items:
                                        total_amount = sum(it.price * it.quantity for it in items)

                                    date_val = parsed.get("date")
                                    if not date_val:
                                        date_val = datetime.date.today().isoformat()

                                    print(f"[Gemini Vision OCR] Sucesso com {model}: {store_name}, Total: {total_amount} MT, {len(items)} itens")
                                    return ReceiptExtractionResponse(
                                        store_name=store_name,
                                        total_amount=total_amount,
                                        category=category,
                                        date=date_val,
                                        items=items,
                                        confidence=0.98,
                                        is_essential=(category == "essential")
                                    )
                except Exception as vision_err:
                    print(f"[Gemini Vision OCR Error with {model}] {vision_err}")

        # Fallback local com análise de texto ou nome do ficheiro (sem valores fictícios)
        text = request.raw_text or ""
        file_name = (request.file_name or "").lower()

        known_merchants = [
            ("Shoprite", "essential", ["shoprite", "supermercado", "mercearia"]),
            ("VIP Spar", "essential", ["vip spar", "spar"]),
            ("Jumbo", "essential", ["jumbo", "hipermercado"]),
            ("Recheio", "essential", ["recheio", "grossista"]),
            ("Supermercado Premier", "essential", ["premier"]),
            ("Game", "lifestyle", ["game", "tecnologia", "casa"]),
            ("Woolworths", "lifestyle", ["woolworths", "vestuário"]),
            ("Galp", "essential", ["galp", "combustível"]),
            ("TotalEnergies", "essential", ["total", "totalenergies"]),
            ("Petromoc", "essential", ["petromoc", "combustível"]),
            ("Puma Energy", "essential", ["puma", "combustível"]),
            ("EDM", "essential", ["edm", "credelec", "eletricidade"]),
            ("FIPAG", "essential", ["fipag", "água"]),
            ("Vodacom", "essential", ["vodacom", "m-pesa", "internet"]),
            ("Movitel", "essential", ["movitel", "e-mola"]),
            ("Tmcel", "essential", ["tmcel", "internet"]),
        ]

        detected_store = "Estabelecimento"
        category = "essential"
        is_essential = True

        combined_search = f"{file_name} {text.lower()}"
        for name, cat, keywords in known_merchants:
            if any(k in combined_search for k in keywords):
                detected_store = name
                category = cat
                is_essential = (cat == "essential")
                break

        # Extração de total a partir do texto
        total_amount = 0.0
        amount_matches = re.findall(r'(?:total|valor\s+total|pagar|mt|mzn|meticais)\s*[:=]?\s*(\d+[.,]\d{2})', text, re.IGNORECASE)
        if amount_matches:
            try:
                total_amount = float(amount_matches[-1].replace(',', '.'))
            except ValueError:
                total_amount = 0.0
        elif not total_amount:
            generic_amounts = re.findall(r'\b(\d{1,6}[.,]\d{2})\b', text)
            if generic_amounts:
                floats = []
                for a in generic_amounts:
                    try:
                        floats.append(float(a.replace(',', '.')))
                    except ValueError:
                        pass
                if floats:
                    total_amount = max(floats)

        items = []
        if total_amount > 0:
            items.append(ReceiptItem(name=f"Compras {detected_store}", price=total_amount, quantity=1.0))
        else:
            items.append(ReceiptItem(name="Item a preencher", price=0.0, quantity=1.0))

        return ReceiptExtractionResponse(
            store_name=detected_store,
            total_amount=total_amount,
            category=category,
            date=datetime.date.today().isoformat(),
            items=items,
            confidence=0.60 if total_amount > 0 else 0.20,
            is_essential=is_essential
        )

    def compare_price_history(self, request: PriceComparisonRequest) -> PriceComparisonResponse:
        """
        Compara o preço atual com o histórico de compras anteriores para o mesmo item em MT.
        """
        current_price = request.current_price
        history = request.historical_records

        if not history:
            return PriceComparisonResponse(
                is_cheaper=False,
                is_more_expensive=False,
                difference_amount=0.0,
                message=f"Primeiro registo para '{request.item_description}'. Este valor servirá de referência para futuras compras.",
                saving_tip="Nas próximas compras, compara com outros estabelecimentos para identificar o melhor preço."
            )

        best_record = min(history, key=lambda x: x.price)

        if current_price > best_record.price + 0.50:
            diff = current_price - best_record.price
            pct = (diff / best_record.price) * 100
            store_info = f" no {best_record.store_name}" if best_record.store_name else ""
            msg = (
                f"Atenção! Já compraste este item mais barato{store_info} por {best_record.price:.0f} MT "
                f"(+{diff:.0f} MT de diferença)."
            )
            tip = f"Se possível, dá preferência a {best_record.store_name or 'lojas anteriores'} onde costuma estar mais barato."
            return PriceComparisonResponse(
                is_cheaper=False,
                is_more_expensive=True,
                difference_amount=round(diff, 2),
                previous_best_store=best_record.store_name,
                previous_best_price=best_record.price,
                message=msg,
                saving_tip=tip
            )
        elif current_price < best_record.price - 0.50:
            saved = best_record.price - current_price
            msg = (
                f"Boa escolha! Estás a pagar um preço melhor que o histórico, poupando {saved:.0f} MT "
                f"({current_price:.0f} MT vs {best_record.price:.0f} MT). Continua assim!"
            )
            tip = "Excelente negócio! Este passa a ser o teu novo preço de referência mais económico."
            return PriceComparisonResponse(
                is_cheaper=True,
                is_more_expensive=False,
                difference_amount=round(saved, 2),
                previous_best_store=best_record.store_name,
                previous_best_price=best_record.price,
                message=msg,
                saving_tip=tip
            )
        else:
            return PriceComparisonResponse(
                is_cheaper=False,
                is_more_expensive=False,
                difference_amount=0.0,
                previous_best_store=best_record.store_name,
                previous_best_price=best_record.price,
                message=f"Preço alinhado com o teu histórico ({current_price:.0f} MT em '{request.current_store or best_record.store_name}').",
                saving_tip="Preço estável dentro da tua média habitual."
            )

    async def advisor_chat(self, request: AdvisorChatRequest) -> AdvisorChatResponse:
        """
        Consultor Financeiro Conversacional focado em Metas Reais e Cortes de Gastos em MT.
        - Lê as metas ativas reais do utilizador.
        - Se a pergunta envolver uma meta existente, detalha o plano e cortes necessários.
        - Se a meta for nova/não cadastrada, sugere o cadastro primeiro (Sim/Não).
        - Se o utilizador recusar ("Não"), monta o plano e sugere cortes, recomendando cadastro no fim.
        - Se o utilizador acabou de cadastrar ("just_created_goal"), parabeniza e entrega o plano com cortes.
        """
        user_name = request.user_name or "Utilizador"
        rule_str = "50/30/20"
        if request.budget_split:
            rule_str = f"{request.budget_split.needs_percent:.0f}% Fixas / {request.budget_split.wants_percent:.0f}% Lazer / {request.budget_split.savings_percent:.0f}% Metas"

        income_str = f"{request.monthly_income:.2f} MT" if request.monthly_income else "Não especificada"
        balance_str = f"{request.current_balance:.2f} MT" if request.current_balance else "Não especificado"

        goals_text = "Nenhuma meta cadastrada ainda."
        if request.active_goals:
            goals_list = []
            for g in request.active_goals:
                rem = max(0.0, g.target_amount - g.current_amount)
                goals_list.append(
                    f"- '{g.name}': Alvo = {g.target_amount:.0f} MT | Guardado = {g.current_amount:.0f} MT | Falta = {rem:.0f} MT | Prazo = {g.deadline or 'Indefinido'}"
                )
            goals_text = "\n".join(goals_list)

        spending_text = "Nenhum histórico recente disponível."
        if request.recent_spending_by_category:
            spending_list = [f"- {cat}: {amt:.0f} MT" for cat, amt in sorted(request.recent_spending_by_category.items(), key=lambda x: x[1], reverse=True)]
            spending_text = "\n".join(spending_list)

        just_created_text = ""
        if request.just_created_goal:
            just_created_text = f"\nO utilizador ACABOU DE CADASTRAR a meta: '{request.just_created_goal.name}' com valor alvo de {request.just_created_goal.target_amount:.0f} MT e prazo {request.just_created_goal.deadline or 'flexível'}."

        history_text = ""
        if request.conversation_history:
            history_lines = [f"{m.role.upper()}: {m.content}" for m in request.conversation_history[-6:]]
            history_text = "\nHistórico recente da conversa:\n" + "\n".join(history_lines)

        prompt = f"""
És o Consultor Financeiro Pessoal de Inteligência Artificial do aplicativo Carterinha em Moçambique (moeda oficial: Metical - MT).
És empático, motivador, altamente analítico e falas em Português europeu. És capaz de responder a QUALQUER dúvida financeira sobre as contas do utilizador, além de orientar sobre metas.

DADOS REAIS DO UTILIZADOR:
- Nome: {user_name}
- Renda Mensal: {income_str}
- Saldo Atual: {balance_str}
- Regra de Orçamento Definida: {rule_str} (Nota: a divisão de orçamento no Carterinha é flexível e varia conforme as preferências do utilizador; a regra 50/30/20 é apenas uma recomendação de referência do sistema, e não uma regra fixa)
- Metas de Vida Reais Cadastradas:
{goals_text}
- Gastos Reais Recentes por Categoria (últimos 30 dias):
{spending_text}{just_created_text}
{history_text}

MENSAGEM ATUAL DO UTILIZADOR:
"{request.message}"

INSTRUÇÕES E REGRAS DE NEGÓCIO OBRIGATÓRIAS:
1. SE O UTILIZADOR ACABOU DE CADASTRAR A META (`just_created_goal` presente):
   - Dá os parabéns pelo passo dado no Carterinha.
   - Explica exatamente como atingir essa meta, indicando quanto poupar por mês e o prazo estimado.
   - Analisa os gastos reais e diz EXPLICITAMENTE QUAIS GASTOS CORTAR (ex: categorias não essenciais com maiores valores).
   - Define "suggest_goal_creation": false.

2. SE O UTILIZADOR RECUSOU CADASTRAR A META (disse "Não", "Não quero cadastrar", "Depois", etc.):
   - Compreende a decisão sem insistir no cadastro imediato.
   - AJUDA A MONTAR O PLANO DE COMO CONSEGUIR ESSA META mesmo sem estar cadastrada (calcula aportes sugeridos e prazo).
   - Analisa os gastos reais e aponta QUAIS GASTOS CORTAR para libertar margem.
   - No FINAL da resposta, sugere amigavelmente que, quando quiser acompanhar o progresso graficamente, poderá registá-la no Carterinha.
   - Define "suggest_goal_creation": false.

3. SE O UTILIZADOR PERGUNTOU SOBRE UMA META QUE JÁ ESTÁ CADASTRADA (nas Metas de Vida Reais):
   - Lê os dados reais da meta (alvo, valor guardado, quanto falta e prazo).
   - Monta um plano claro de aceleração de poupança e diz QUAIS GASTOS CORTAR com base no histórico de consumo real.
   - Define "suggest_goal_creation": false, "identified_goal_id": id da meta.

4. SE O UTILIZADOR PRETENDE COMPRAR / JUNTAR PARA UM NOVO BEM OU OBJETIVO NÃO CADASTRADO (ex: "quero comprar um carro", "planeio viajar", "quanto preciso poupar para uma mota"):
   - Identifica o nome e valor pretendido e SUGERE O CADASTRO DA META para calibrar o orçamento e acompanhar o progresso.
   - Pergunta claramente se gostaria de cadastrar a meta no aplicativo agora.
   - Define "suggest_goal_creation": true, "suggested_goal_name": nome do objetivo, "suggested_goal_target": valor em float.

5. SE O UTILIZADOR FAZ UMA PERGUNTA FINANCEIRA GERAL (ex: maiores gastos, análise do 50/30/20, despesas em categorias específicas como Alimentação ou Lazer, dicas de poupança, saúde financeira geral):
   - Responde DIRETAMENTE e com precisão usando os dados reais fornecidos acima.
   - Analisa os números concretos em MT, calcula percentagens e dá conselhos práticos para o contexto de Moçambique.
   - NÃO sugere cadastro de meta neste caso. Define "suggest_goal_creation": false.

6. Formato de Resposta Estrito: Retorne APENAS um objeto JSON válido:
{{
  "reply": "Texto da resposta ao utilizador...",
  "suggest_goal_creation": true/false,
  "suggested_goal_name": "Nome ou null",
  "suggested_goal_target": 1234.0 ou null,
  "identified_goal_id": "id ou null",
  "action_plan": ["Passo 1...", "Passo 2..."],
  "expenses_to_cut": ["Categoria 1: reduzir X MT", "Categoria 2..."]
}}
"""
        models = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
        if self.gemini_api_key:
            for model in models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_api_key}"
                    async with httpx.AsyncClient(timeout=18.0) as client:
                        response = await client.post(
                            url,
                            headers={"Content-Type": "application/json"},
                            json={
                                "contents": [{"parts": [{"text": prompt}]}],
                                "generationConfig": {
                                    "temperature": 0.2,
                                    "responseMimeType": "application/json"
                                }
                            }
                        )
                        if response.status_code == 200:
                            data = response.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                text = "".join(p.get("text", "") for p in parts if "text" in p and not p.get("thought", False)).strip()
                                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                                if json_match:
                                    parsed = json.loads(json_match.group(0))
                                    return AdvisorChatResponse(
                                        reply=parsed.get("reply", "Estou aqui para ajudar com as tuas finanças e metas."),
                                        suggest_goal_creation=bool(parsed.get("suggest_goal_creation", False)),
                                        suggested_goal_name=parsed.get("suggested_goal_name"),
                                        suggested_goal_target=float(parsed.get("suggested_goal_target")) if parsed.get("suggested_goal_target") else None,
                                        identified_goal_id=parsed.get("identified_goal_id"),
                                        action_plan=parsed.get("action_plan", []),
                                        expenses_to_cut=parsed.get("expenses_to_cut", [])
                                    )
                except Exception as err:
                    print(f"[Advisor Gemini Chat Error with {model}] {err}")

        # Fallback Heurístico Local-First (Offline)
        msg_lower = request.message.lower()
        top_cut_categories = []
        total_spending = 0.0
        sorted_cats = []
        if request.recent_spending_by_category:
            sorted_cats = sorted(request.recent_spending_by_category.items(), key=lambda x: x[1], reverse=True)
            total_spending = sum(v for _, v in sorted_cats)
            non_essential_cats = [c for c in sorted_cats if any(k in c[0].lower() for k in ["lazer", "restaurante", "shopping", "saídas", "viagem", "outros", "uber", "subscrição"])]
            top_cut_categories = [f"{c[0]} (gastaste {c[1]:.0f} MT)" for c in non_essential_cats[:2]] or [f"{sorted_cats[0][0]} (gastaste {sorted_cats[0][1]:.0f} MT)"]

        # 1. Caso: meta recém-criada
        if request.just_created_goal:
            g = request.just_created_goal
            monthly_target = round(g.target_amount / 6, 0)
            cut_text = f" Sugiro cortar em {top_cut_categories[0]}." if top_cut_categories else " Cortando pequenas compras supérfluas."
            return AdvisorChatResponse(
                reply=f"Excelente decisão, {user_name}! A tua meta '{g.name}' de {g.target_amount:,.0f} MT está agora registada. Para a alcançares em 6 meses, o teu aporte mensal será de aproximadamente {monthly_target:,.0f} MT.{cut_text} Vamos acompanhar cada depósito juntos!",
                suggest_goal_creation=False,
                suggested_goal_name=g.name,
                suggested_goal_target=g.target_amount,
                action_plan=[f"Guardar {monthly_target:,.0f} MT por mês", "Evitar saídas não planeadas"],
                expenses_to_cut=top_cut_categories
            )

        # 2. Caso: utilizador diz "não"
        if any(w in msg_lower for w in ["não", "nao", "depois", "agora não", "deixa", "dispensa"]):
            cuts_mention = f" Recomendo reduzir despesas em {top_cut_categories[0]}." if top_cut_categories else ""
            return AdvisorChatResponse(
                reply=f"Compreendido perfeitamente, {user_name}. Podes avançar no teu próprio ritmo.{cuts_mention} Se poupares uma quantia regular todos os meses, conseguirás juntar o montante necessário. Quando quiseres acompanhar os números graficamente, basta cadastrar a meta na Carterinha!",
                suggest_goal_creation=False,
                action_plan=["Reservar 20% do rendimento mensal para poupança", "Rever gastos supérfluos"],
                expenses_to_cut=top_cut_categories
            )

        # 3. Caso: meta existente referida
        for g in request.active_goals:
            if g.name.lower() in msg_lower:
                rem = max(0.0, g.target_amount - g.current_amount)
                cut_info = f" Se reduzires {top_cut_categories[0]}, aceleras a conclusão!" if top_cut_categories else ""
                return AdvisorChatResponse(
                    reply=f"Para a tua meta '{g.name}', já guardaste {g.current_amount:,.0f} MT de {g.target_amount:,.0f} MT (faltam {rem:,.0f} MT).{cut_info}",
                    suggest_goal_creation=False,
                    identified_goal_id=g.id,
                    action_plan=[f"Faltam {rem:,.0f} MT para concluir a meta", "Aporte regular na categoria de metas"],
                    expenses_to_cut=top_cut_categories
                )

        # 4. Caso: pergunta financeira geral (orçamento, despesas, categorias, poupança, saúde financeira)
        is_general_finance = any(kw in msg_lower for kw in [
            "gasto", "despesa", "maior", "orçamento", "orcamento", "50/30/20", "50-30-20",
            "alimentação", "alimentacao", "lazer", "transporte", "poupar", "economizar",
            "saldo", "renda", "resumo", "saúde", "saude", "como estão", "como estao",
            "onde cortar", "cortar", "dicas", "analisar", "contas"
        ])
        is_new_goal_intent = any(kw in msg_lower for kw in [
            "quero comprar", "comprar um", "comprar uma", "juntar para", "guardar para",
            "planeio comprar", "quero ter", "meta de comprar", "quanto custa comprar"
        ])

        if is_general_finance and not is_new_goal_intent:
            top_cat_str = f"{sorted_cats[0][0]} com {sorted_cats[0][1]:,.0f} MT" if sorted_cats else "nenhuma despesa registada"
            income_val = request.monthly_income or 0.0
            plan_steps = [
                "Acompanhar o registo diário de despesas",
                "Manter os gastos essenciais abaixo de 50% da renda",
                "Garantir aporte mensal na poupança logo após o recebimento"
            ]
            reply_text = f"Análise Financeira para {user_name}:\n"
            reply_text += f"- Total de despesas recentes: {total_spending:,.0f} MT\n"
            reply_text += f"- Maior categoria de gasto: {top_cat_str}\n"
            if income_val > 0:
                spend_pct = (total_spending / income_val) * 100
                reply_text += f"- Consumo da tua renda: {spend_pct:.1f}% ({rule_str})\n"
            reply_text += f"Para otimizar o teu saldo, o ideal é rever despesas variáveis em {top_cut_categories[0] if top_cut_categories else 'gastos não essenciais'}."

            return AdvisorChatResponse(
                reply=reply_text,
                suggest_goal_creation=False,
                action_plan=plan_steps,
                expenses_to_cut=top_cut_categories
            )

        # 5. Caso: nova meta sugerida (se houver intenção de compra ou bem específico)
        amounts = re.findall(r'(\d+[\d\s.,]*)\s*(?:mt|meticais|mil|k)', msg_lower)
        target_val = 10000.0
        if amounts:
            clean_num = amounts[0].replace(' ', '').replace('.', '').replace(',', '.')
            try:
                target_val = float(clean_num)
                if 'mil' in msg_lower and target_val < 1000:
                    target_val *= 1000
            except ValueError:
                pass

        suggested_name = "Novo Objetivo"
        for kw in ["carro", "mota", "moto", "casa", "viagem", "telemóvel", "computador", "férias", "curso", "casamento", "bicicleta", "terreno"]:
            if kw in msg_lower:
                suggested_name = kw.capitalize()
                break

        return AdvisorChatResponse(
            reply=f"Esse é um excelente objetivo para as tuas finanças, {user_name}! Para podermos calibrar o teu orçamento e acompanhar a tua evolução passo a passo, gostarias de cadastrar a meta '{suggested_name}' no valor de {target_val:,.0f} MT agora? (Sim / Não)",
            suggest_goal_creation=True,
            suggested_goal_name=suggested_name,
            suggested_goal_target=target_val,
            action_plan=[],
            expenses_to_cut=top_cut_categories
        )
