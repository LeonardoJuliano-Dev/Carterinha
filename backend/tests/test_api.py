import sys
import os

# Adiciona o diretório backend ao sys.path para suportar execução a partir da raiz
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["stateless"] is True


def test_analyze_non_essential_transaction():
    payload = {
        "transaction_id": "tx_test_1",
        "description": "Jantar Fora",
        "amount": 2500.0,
        "category": "lifestyle",
        "is_essential": False,
        "lifestyle_budget_remaining": 6000.0,
        "active_goals": [
            {
                "id": "goal_1",
                "name": "Viagem de Férias",
                "target_amount": 50000.0,
                "current_amount": 15000.0
            }
        ]
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_id"] == "tx_test_1"
    assert "advice" in data
    assert data["impact_level"] in ["baixo", "moderado", "alto"]
    assert "opportunity_cost" in data


def test_extract_receipt():
    payload = {
        "file_name": "recibo_shoprite_supermercado.jpg",
        "raw_text": "SHOPRITE MATOLA\nTOTAL A PAGAR: 2450.00 MT\nDATA: 2026-08-25"
    }
    response = client.post("/extract-receipt", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["store_name"] == "Shoprite"
    assert data["total_amount"] == 2450.00
    assert data["category"] == "essential"
    assert data["is_essential"] is True


def test_compare_price_higher_than_history():
    payload = {
        "item_description": "Café em Grão 1kg",
        "current_price": 850.00,
        "current_store": "Loja Gourmet",
        "historical_records": [
            {"store_name": "VIP Spar", "price": 620.00, "date": "2026-08-01"},
            {"store_name": "Shoprite", "price": 650.00, "date": "2026-08-15"}
        ]
    }
    response = client.post("/compare-price", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_more_expensive"] is True
    assert data["previous_best_store"] == "VIP Spar"
    assert data["difference_amount"] > 0
    assert "mais barato" in data["message"].lower()


def test_compare_price_savings():
    payload = {
        "item_description": "Detergente OMO",
        "current_price": 450.00,
        "current_store": "Shoprite",
        "historical_records": [
            {"store_name": "Supermercado Premier", "price": 600.00, "date": "2026-07-20"}
        ]
    }
    response = client.post("/compare-price", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_cheaper"] is True
    assert data["difference_amount"] == 150.0
    assert "poupando" in data["message"].lower()


def test_behavior_profile_ml():
    payload = {
        "user_name": "Alex Eduardo",
        "monthly_income": 24500.0,
        "current_balance": 12450.0,
        "transactions": [
            {
                "id": "tx_1",
                "description": "Restaurante Fim de Semana",
                "amount": 2500.0,
                "category": "lifestyle",
                "is_essential": False,
                "created_at": "2026-08-28T20:00:00"  # Sexta-feira
            },
            {
                "id": "tx_2",
                "description": "Compras Shoprite",
                "amount": 3200.0,
                "category": "essential",
                "is_essential": True,
                "created_at": "2026-08-25T10:00:00"
            }
        ],
        "active_goals": [
            {
                "id": "g_1",
                "name": "Férias 2025",
                "target_amount": 30000.0,
                "current_amount": 12000.0
            }
        ]
    }
    response = client.post("/behavior-profile", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["archetype_badge"] != ""
    assert 0 <= data["impulse_risk_score"] <= 100
    assert data["daily_burn_rate"] > 0
    assert len(data["ml_insights"]) > 0
    assert "personalized_action_plan" in data


def test_behavior_profile_custom_split_40_30_30():
    payload = {
        "user_name": "Alex Eduardo",
        "monthly_income": 24500.0,
        "current_balance": 12450.0,
        "transactions": [
            {
                "id": "tx_1",
                "description": "Restaurante",
                "amount": 2500.0,
                "category": "lifestyle",
                "is_essential": False,
                "created_at": "2026-08-28T20:00:00"
            }
        ],
        "active_goals": [],
        "budget_split": {
            "needs_percent": 40.0,
            "wants_percent": 30.0,
            "savings_percent": 30.0
        }
    }
    response = client.post("/behavior-profile", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "40/30/30" in data["archetype_badge"] or "40% Fixas" in data["ml_insights"][0]
    assert "40%" in data["ml_insights"][0]
    assert "30% Metas" in data["ml_insights"][0]

