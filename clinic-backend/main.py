from __future__ import annotations

import asyncio
import logging

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

import db
from config import load_config
from routes.availability import router as availability_router
from routes.holds import router as holds_router
from routes.bookings import router as bookings_router
from routes.admin import router as admin_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("clinic-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    cfg = load_config()
    db.init_db_config(cfg)
    app.state.cfg = cfg
    await db.create_tables()
    logger.info("clinic-backend started — %s", cfg.clinic_name)

    # Background task: expire stale holds every 60 seconds
    expiry_task = asyncio.create_task(db.run_expiry_loop(60))

    yield

    expiry_task.cancel()
    try:
        await expiry_task
    except asyncio.CancelledError:
        pass
    logger.info("clinic-backend shutting down")


app = FastAPI(
    title="Clinic Booking Backend",
    description="Mock clinic scheduling service — slots, holds, bookings",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(availability_router)
app.include_router(holds_router)
app.include_router(bookings_router)
app.include_router(admin_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "clinic-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
