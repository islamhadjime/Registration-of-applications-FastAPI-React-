from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, requests
from app.seed import seed_default_admin_standalone

Base.metadata.create_all(bind=engine)
seed_default_admin_standalone()

app = FastAPI(title="Requests API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(requests.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
