"""
PropelERP AI Engine
FastAPI microservice for all AI/ML capabilities
"""
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

from api.routes import (
    revenue_forecast,
    churn_prediction,
    maintenance_prediction,
    contract_nlp,
    valuation,
    sentiment,
    energy,
    chat,
    rtsp_detection,
)
from utils.database import init_db_pool
from utils.logger import setup_logger

logger = setup_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 PropelERP AI Engine starting...")
    await init_db_pool()
    logger.info("✅ Database pool ready")
    yield
    logger.info("👋 AI Engine shutting down")

app = FastAPI(
    title="PropelERP AI Engine",
    description="AI/ML microservice for property management intelligence",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://propelerp.wisewit.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "PropelERP AI Engine", "version": "1.0.0"}

# Mount routers
app.include_router(revenue_forecast.router, prefix="/api/v1/revenue-forecast", tags=["Revenue Forecast"])
app.include_router(churn_prediction.router, prefix="/api/v1/churn-risks",      tags=["Churn Prediction"])
app.include_router(maintenance_prediction.router, prefix="/api/v1/maintenance-predictions", tags=["Predictive Maintenance"])
app.include_router(contract_nlp.router,    prefix="/api/v1/analyse-contract",  tags=["Contract Intelligence"])
app.include_router(valuation.router,       prefix="/api/v1/valuation",         tags=["Property Valuation"])
app.include_router(sentiment.router,       prefix="/api/v1/sentiment",         tags=["Tenant Sentiment"])
app.include_router(energy.router,          prefix="/api/v1/energy",            tags=["Energy Optimization"])
app.include_router(chat.router,            prefix="/api/v1/chat",              tags=["AI Assistant"])
app.include_router(rtsp_detection.router,  prefix="/api/v1/rtsp",              tags=["RTSP Detection"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
