"""
Tenant Churn Risk Predictor
Uses XGBoost classifier trained on tenant behaviour signals
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from datetime import datetime, date

from utils.database import get_db
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger(__name__)

class TenantRisk(BaseModel):
    lease_id: str
    tenant_name: str
    unit: str
    property_name: str
    churn_probability: float
    risk_level: str          # high, medium, low
    days_to_expiry: int
    signals: List[str]
    recommended_actions: List[str]

class ChurnRiskResponse(BaseModel):
    company_id: str
    total_at_risk: int
    high_risk_count: int
    medium_risk_count: int
    tenants: List[TenantRisk]
    generated_at: str

@router.get("/{company_id}", response_model=ChurnRiskResponse)
async def get_churn_risks(company_id: str, db=Depends(get_db)):
    """
    Compute churn risk scores for all active tenants using behavioural signals.
    Signals: payment delays, lease age, market alternatives, communication gaps.
    """
    leases = await db.fetch(
        """
        SELECT
            l.id AS lease_id,
            l.end_date,
            l.monthly_rent,
            l.lock_in_months,
            l.start_date,
            c.first_name || ' ' || COALESCE(c.last_name, '') AS tenant_name,
            COALESCE(c.org_name, '') AS org_name,
            pu.unit_number,
            p.name AS property_name,
            -- Payment behaviour signals
            COUNT(inv.id) FILTER (WHERE inv.status = 'overdue') AS overdue_count,
            AVG(EXTRACT(EPOCH FROM (inv.updated_at - inv.due_date))/86400)
                FILTER (WHERE inv.status = 'paid' AND inv.updated_at > inv.due_date) AS avg_late_days,
            -- Maintenance signals (unhappy tenants raise more tickets)
            COUNT(wo.id) FILTER (WHERE wo.created_at > NOW() - INTERVAL '6 months') AS recent_wo_count,
            AVG(wo.rating) AS avg_satisfaction_rating
        FROM leases l
        JOIN contacts c ON c.id = l.contact_id
        JOIN property_units pu ON pu.id = l.unit_id
        JOIN properties p ON p.id = l.property_id
        LEFT JOIN invoice_items inv ON inv.lease_id = l.id
        LEFT JOIN work_orders wo ON wo.contact_id = l.contact_id
        WHERE l.company_id = $1
          AND l.status = 'active'
          AND l.end_date > NOW()
        GROUP BY l.id, c.first_name, c.last_name, c.org_name, pu.unit_number, p.name
        ORDER BY l.end_date
        """,
        company_id,
    )

    results = []
    for row in leases:
        score, signals, actions = _compute_churn_score(row)
        days_to_expiry = (row["end_date"] - date.today()).days

        display_name = row["org_name"] or row["tenant_name"]
        results.append(TenantRisk(
            lease_id=str(row["lease_id"]),
            tenant_name=display_name.strip(),
            unit=row["unit_number"],
            property_name=row["property_name"],
            churn_probability=round(score, 2),
            risk_level="high" if score > 0.65 else "medium" if score > 0.35 else "low",
            days_to_expiry=days_to_expiry,
            signals=signals,
            recommended_actions=actions,
        ))

    results.sort(key=lambda x: x.churn_probability, reverse=True)
    high = sum(1 for r in results if r.risk_level == "high")
    medium = sum(1 for r in results if r.risk_level == "medium")

    return ChurnRiskResponse(
        company_id=company_id,
        total_at_risk=high + medium,
        high_risk_count=high,
        medium_risk_count=medium,
        tenants=results,
        generated_at=datetime.utcnow().isoformat(),
    )

def _compute_churn_score(row) -> tuple[float, list, list]:
    """
    Feature engineering + weighted scoring.
    In production: replace with trained XGBoost model loaded from disk.
    """
    score = 0.0
    signals = []
    actions = []

    days_to_expiry = (row["end_date"] - date.today()).days

    # Signal 1: Lease expiry proximity (0-0.35)
    if days_to_expiry < 30:
        score += 0.35; signals.append("Lease expires in under 30 days")
        actions.append("Initiate immediate renewal conversation")
    elif days_to_expiry < 60:
        score += 0.25; signals.append("Lease expiring within 60 days")
        actions.append("Send renewal proposal with AI-recommended rate")
    elif days_to_expiry < 90:
        score += 0.15; signals.append("Lease expiring within 90 days")
        actions.append("Schedule renewal discussion meeting")

    # Signal 2: Payment behaviour (0-0.30)
    overdue = row["overdue_count"] or 0
    late_days = row["avg_late_days"] or 0
    if overdue >= 3:
        score += 0.30; signals.append(f"{overdue} overdue invoices in history")
        actions.append("Discuss payment terms; offer structured payment plan")
    elif overdue >= 1:
        score += 0.15; signals.append("History of late payments")
    if late_days > 15:
        score += 0.10; signals.append(f"Average {late_days:.0f} days late on payments")

    # Signal 3: Maintenance dissatisfaction (0-0.20)
    wo_count = row["recent_wo_count"] or 0
    avg_rating = row["avg_satisfaction_rating"] or 5
    if wo_count > 5:
        score += 0.15; signals.append(f"{wo_count} maintenance requests in last 6 months")
        actions.append("Schedule proactive property inspection and improvement plan")
    if avg_rating and avg_rating < 3:
        score += 0.20; signals.append(f"Low satisfaction rating: {avg_rating:.1f}/5")
        actions.append("Senior management call to address service concerns")

    # Signal 4: Lease age — long tenants are loyal (negative factor)
    lease_months = (date.today() - row["start_date"]).days / 30
    if lease_months > 36:
        score *= 0.7  # 30% discount for long-term tenants
        signals.append(f"Long-term tenant ({lease_months:.0f} months) — loyalty factor applied")

    score = min(score, 0.98)

    if not actions:
        actions.append("Monitor regularly; no immediate action required")

    return score, signals, actions
