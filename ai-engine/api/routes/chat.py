"""
PropelAI Chat Assistant
Contextual Q&A over ERP data using Emergent LLM Integration
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import json
import asyncio

from utils.database import get_db
from utils.logger import setup_logger

# Emergent LLM Integration
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    EMERGENT_AVAILABLE = False

router = APIRouter()
logger = setup_logger(__name__)

class ChatMessage(BaseModel):
    role: str   # user | assistant
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    company_id: str

class ChatResponse(BaseModel):
    response: str
    data_used: Optional[List[str]] = []
    suggested_actions: Optional[List[str]] = []

# Tool definitions for LLM function calling
TOOLS = {
    "get_revenue_summary": "Fetch total rental revenue for current month/year",
    "get_occupancy_rates": "Fetch occupancy rates across all properties",
    "get_churn_risks": "Get list of tenants at risk of not renewing",
    "get_maintenance_alerts": "Fetch open and critical maintenance work orders",
    "get_lease_renewals_due": "Get leases expiring in next 30/60/90 days",
    "get_outstanding_payments": "Get overdue invoices and AR summary",
}

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db=Depends(get_db)):
    """
    Conversational AI interface over ERP data.
    Fetches relevant data from DB and uses Emergent LLM to compose intelligent responses.
    """
    # Fetch ERP context based on query intent
    context = await _build_context(request.message, request.company_id, db)

    # Try Emergent LLM-powered response first
    emergent_key = os.getenv("EMERGENT_LLM_KEY")
    if emergent_key and EMERGENT_AVAILABLE:
        response = await _llm_response(request.message, request.history or [], context, emergent_key)
    else:
        logger.info("Using rule-based response (no EMERGENT_LLM_KEY or library unavailable)")
        response = _rule_based_response(request.message, context)

    return ChatResponse(
        response=response["text"],
        data_used=response.get("data_used", []),
        suggested_actions=response.get("actions", []),
    )

async def _build_context(message: str, company_id: str, db) -> dict:
    """Fetch relevant ERP data based on query intent"""
    context = {}
    msg_lower = message.lower()

    if any(w in msg_lower for w in ["revenue", "income", "rent", "collection", "money"]):
        row = await db.fetchrow(
            """SELECT
               SUM(vl.credit_amount) FILTER (WHERE coa.account_type='income') AS revenue,
               SUM(vl.debit_amount) FILTER (WHERE coa.account_type='expense') AS expenses,
               COUNT(DISTINCT inv.id) FILTER (WHERE inv.status='overdue') AS overdue_invoices,
               SUM(inv.total_amount - inv.paid_amount) FILTER (WHERE inv.status IN ('unpaid','overdue')) AS outstanding_ar
               FROM vouchers v
               JOIN voucher_lines vl ON vl.voucher_id = v.id
               JOIN chart_of_accounts coa ON coa.id = vl.account_id
               LEFT JOIN invoice_items inv ON inv.company_id = v.company_id
               WHERE v.company_id=$1 AND v.status='posted'
               AND EXTRACT(MONTH FROM v.date)=EXTRACT(MONTH FROM NOW())""",
            company_id,
        )
        context["finance"] = dict(row) if row else {}

    if any(w in msg_lower for w in ["occupancy", "vacant", "units", "property", "occupied"]):
        rows = await db.fetch(
            """SELECT p.name,
               COUNT(pu.id) AS total,
               COUNT(pu.id) FILTER(WHERE pu.status='occupied') AS occupied,
               ROUND(COUNT(pu.id) FILTER(WHERE pu.status='occupied')::numeric/NULLIF(COUNT(pu.id),0)*100,1) AS rate
               FROM properties p JOIN property_units pu ON pu.property_id=p.id
               WHERE p.company_id=$1 GROUP BY p.id""",
            company_id,
        )
        context["occupancy"] = [dict(r) for r in rows]

    if any(w in msg_lower for w in ["maintenance", "repair", "work order", "hvac", "lift", "alert"]):
        rows = await db.fetch(
            """SELECT wo_number, title, priority, status, property_id
               FROM work_orders WHERE company_id=$1 AND status NOT IN ('completed','cancelled')
               ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END LIMIT 10""",
            company_id,
        )
        context["maintenance"] = [dict(r) for r in rows]

    if any(w in msg_lower for w in ["churn", "risk", "leaving", "renewal", "expire", "tenant"]):
        rows = await db.fetch(
            """SELECT l.lease_number, c.org_name, l.end_date,
               (l.end_date - NOW()::date) AS days_to_expiry
               FROM leases l JOIN contacts c ON c.id=l.contact_id
               WHERE l.company_id=$1 AND l.status='active'
               AND l.end_date <= NOW() + INTERVAL '90 days'
               ORDER BY l.end_date LIMIT 10""",
            company_id,
        )
        context["renewals"] = [dict(r) for r in rows]

    return context

async def _llm_response(message: str, history: list, context: dict, api_key: str) -> dict:
    """Use Emergent LLM integration for AI-powered responses"""
    try:
        if not EMERGENT_AVAILABLE:
            logger.warning("Emergent LLM not available, using rule-based response")
            return _rule_based_response(message, context)

        system_prompt = f"""You are PropelAI, an intelligent assistant for PropelERP — a property management platform.
You have access to real-time ERP data. Answer questions concisely and helpfully.
Always format numbers in Indian notation (₹ with lakhs/crores).
Current ERP context data:
{json.dumps(context, indent=2, default=str)}

Rules:
- Be concise but complete
- Use bullet points for lists
- Highlight important numbers in **bold**
- Always suggest a relevant next action at the end
- If data is not available, say so clearly"""

        # Initialize Emergent LLM Chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"propelai-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            system_message=system_prompt
        )
        
        # Use GPT-4o for best performance
        chat.with_model("openai", "gpt-4o")

        # Build conversation context from history
        for msg in history[-6:]:
            if msg.role == "user":
                await chat.send_message(UserMessage(text=msg.content))

        # Send current message
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)

        return {
            "text": response,
            "data_used": list(context.keys()),
            "actions": [],
        }
    except Exception as e:
        logger.error(f"Emergent LLM chat failed: {e}")
        return _rule_based_response(message, context)

def _rule_based_response(message: str, context: dict) -> dict:
    msg = message.lower()

    if "revenue" in msg or "income" in msg:
        f = context.get("finance", {})
        rev = f.get("revenue") or 0
        exp = f.get("expenses") or 0
        ar = f.get("outstanding_ar") or 0
        return {"text": f"📊 **This month's financials:**\n• Revenue: **₹{rev:,.0f}**\n• Expenses: ₹{exp:,.0f}\n• Net: ₹{rev-exp:,.0f}\n• Outstanding AR: ₹{ar:,.0f}\n\n💡 _Suggested: View Finance → Trial Balance for detailed breakdown_"}

    if "occupancy" in msg or "vacant" in msg:
        occ = context.get("occupancy", [])
        if occ:
            lines = [f"• {r['name']}: **{r['rate']}%** ({r['occupied']}/{r['total']} units)" for r in occ]
            return {"text": "🏢 **Occupancy by Property:**\n" + "\n".join(lines)}
        return {"text": "Occupancy data not available. Check the Properties module."}

    if "maintenance" in msg:
        items = context.get("maintenance", [])
        if items:
            critical = [i for i in items if i["priority"] == "critical"]
            return {"text": f"🔧 **Open Work Orders: {len(items)}**\n⚠️ Critical: {len(critical)}\n\n" + "\n".join(f"• [{i['priority'].upper()}] {i['title']}" for i in items[:5])}

    return {"text": "I can help you with revenue, occupancy, maintenance alerts, tenant churn risks, and lease renewals. What would you like to know about your property portfolio?"}
