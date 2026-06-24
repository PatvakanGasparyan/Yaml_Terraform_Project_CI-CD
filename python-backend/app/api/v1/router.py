from fastapi import APIRouter

from app.api.v1 import auth, health, stubs, validation

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(validation.router)

for stub in stubs.STUB_ROUTERS:
    api_router.include_router(stub)
