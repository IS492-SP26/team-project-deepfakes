"""
Sentinel — Deepfake Threat Intelligence Platform
FastAPI Backend
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os, time, uuid, logging
from dotenv import load_dotenv

from routers import analyze, reports, search
from db import init_db
from telemetry import setup_logging, log_event

load_dotenv(override=True)
setup_logging()
logger = logging.getLogger("sentinel")

app = FastAPI(
    title="Sentinel API",
    description="Deepfake & NCEI Threat Intelligence Platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    logger.info("Sentinel API started")

@app.middleware("http")
async def request_logger(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000)
    log_event("http_request", {
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "duration_ms": duration,
    })
    return response

app.include_router(analyze.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "sentinel-api"}

@app.get("/")
def root():
    return {"message": "Sentinel Threat Intelligence API", "docs": "/docs"}
