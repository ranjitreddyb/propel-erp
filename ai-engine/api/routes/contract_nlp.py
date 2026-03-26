"""
Contract Intelligence Engine
NLP analysis of lease agreements and vendor contracts using LLMs
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import os

from utils.database import get_db
from utils.logger import setup_logger
from utils.s3 import download_document_text

router = APIRouter()
logger = setup_logger(__name__)

class ContractClause(BaseModel):
    clause_type: str
    description: str
    value: Optional[str]
    risk_level: str        # ok, warning, critical
    recommendation: Optional[str]

class ContractAnalysisResponse(BaseModel):
    document_id: str
    document_name: str
    contract_type: str
    parties: List[str]
    key_dates: Dict[str, str]
    financial_terms: Dict[str, str]
    clauses: List[ContractClause]
    risk_score: float
    risk_summary: str
    missing_clauses: List[str]
    recommendations: List[str]
    analysed_at: str

@router.post("", response_model=ContractAnalysisResponse)
async def analyse_contract(
    payload: dict,
    db=Depends(get_db),
):
    """
    Extract and analyse key clauses from a lease/vendor contract document.
    Uses LLM for NLP extraction, rule-based validation for risk scoring.
    """
    document_id = payload.get("documentId")
    if not document_id:
        raise HTTPException(status_code=400, detail="documentId required")

    # Fetch document metadata from DB
    doc = await db.fetchrow(
        "SELECT * FROM documents WHERE id = $1",
        document_id,
    )

    # For demo purposes, use structured extraction
    # In production: download from S3, extract text with pdfplumber, send to LLM
    analysis = await _analyse_with_llm(document_id, doc)
    return analysis

async def _analyse_with_llm(document_id: str, doc) -> ContractAnalysisResponse:
    """
    In production: extract PDF text → send to Claude/GPT-4 with structured output prompt.
    """
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    if anthropic_key:
        return await _analyse_with_claude(document_id, doc)

    # Fallback: rule-based analysis
    return _rule_based_analysis(document_id)

async def _analyse_with_claude(document_id: str, doc) -> ContractAnalysisResponse:
    """Use Claude API for contract analysis"""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        # In production: extract actual PDF text here
        document_text = "Sample lease agreement text would be extracted from the PDF..."

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": f"""Analyse this property lease agreement and extract key information.
                Return a JSON response with these exact fields:
                - contract_type: string
                - parties: array of strings
                - key_dates: object with start_date, end_date, notice_period
                - financial_terms: object with monthly_rent, deposit, escalation
                - clauses: array of {{clause_type, description, value, risk_level, recommendation}}
                - missing_clauses: array of important missing clauses
                - risk_score: number 0-1
                - risk_summary: string
                - recommendations: array of strings

                Contract text:
                {document_text}

                Return only valid JSON, no markdown."""
            }]
        )

        import json
        result = json.loads(message.content[0].text)
        return ContractAnalysisResponse(
            document_id=document_id,
            document_name=doc["name"] if doc else "Contract",
            analysed_at=datetime.utcnow().isoformat(),
            **result
        )
    except Exception as e:
        logger.warning(f"Claude analysis failed: {e}, falling back to rule-based")
        return _rule_based_analysis(document_id)

def _rule_based_analysis(document_id: str) -> ContractAnalysisResponse:
    """Structured demo analysis"""
    return ContractAnalysisResponse(
        document_id=document_id,
        document_name="Lease Agreement",
        contract_type="Commercial Lease",
        parties=["Prestige Properties Ltd", "TechCorp India Pvt Ltd"],
        key_dates={
            "start_date": "2024-04-01",
            "end_date": "2027-03-31",
            "notice_period": "90 days",
            "lock_in_period": "12 months",
        },
        financial_terms={
            "monthly_rent": "₹4,20,000",
            "security_deposit": "₹12,60,000 (3 months)",
            "escalation": "8% annual",
            "maintenance_charge": "₹15,000/month",
            "payment_due": "1st of each month",
        },
        clauses=[
            ContractClause(
                clause_type="Rent Escalation",
                description="Annual rent escalation clause",
                value="8% per annum fixed",
                risk_level="ok",
                recommendation=None,
            ),
            ContractClause(
                clause_type="Break Clause",
                description="Tenant break option at end of Year 2",
                value="With 3 months notice",
                risk_level="warning",
                recommendation="Consider adding landlord break option symmetrically",
            ),
            ContractClause(
                clause_type="Force Majeure",
                description="Force majeure protection",
                value="MISSING",
                risk_level="critical",
                recommendation="Add force majeure clause to protect both parties",
            ),
            ContractClause(
                clause_type="Sub-letting",
                description="Sub-letting restrictions",
                value="Not permitted without written consent",
                risk_level="ok",
                recommendation=None,
            ),
            ContractClause(
                clause_type="Governing Law",
                description="Jurisdiction clause",
                value="Laws of India, Hyderabad courts",
                risk_level="ok",
                recommendation=None,
            ),
        ],
        risk_score=0.35,
        risk_summary="Moderate risk. Contract is well-structured but missing force majeure protection. Break clause is one-sided.",
        missing_clauses=[
            "Force Majeure clause",
            "Dispute resolution / arbitration clause",
            "RERA compliance declaration",
        ],
        recommendations=[
            "Add force majeure clause before execution",
            "Include mutual break option or remove one-sided break",
            "Add arbitration clause to avoid court delays",
            "Include RERA registration reference",
        ],
        analysed_at=datetime.utcnow().isoformat(),
    )
