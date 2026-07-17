"""Graamam Connect — lightweight auth stub.

The v2 prototype used localStorage-only sessions. Here we expose a POST
endpoint that validates username+password against the hardcoded demo users
and returns the user record + role. Client stores the response in
localStorage and gates routes via `RequireAuth`.

Swap this for real Firebase Auth in the last phase.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

router = APIRouter(prefix="/graamam/auth", tags=["graamam-auth"])

# From graamam_v2.html + docs. Passwords intentionally kept as demo strings.
USERS = {
    "admin":      {"password": "admin123",  "name": "Admin",             "role": "admin"},
    "lead":       {"password": "lead123",   "name": "Graamam Lead",      "role": "lead"},
    "suresh":     {"password": "stock123",  "name": "Suresh",             "role": "stock"},
    "divya":      {"password": "acc123",    "name": "Divya",              "role": "accounts"},
    "krishna":    {"password": "proc123",   "name": "Krishna",            "role": "procurement"},
    "warehouse":  {"password": "wh123",     "name": "Warehouse Lead",    "role": "warehouse"},
    "production": {"password": "prod123",   "name": "Production Lead",   "role": "production"},
}


class LoginPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    password: str


@router.post("/login")
async def login(payload: LoginPayload):
    u = USERS.get((payload.username or "").strip().lower())
    if not u or u["password"] != payload.password:
        raise HTTPException(401, "Invalid username or password")
    return {"username": payload.username.strip().lower(), "name": u["name"], "role": u["role"]}


@router.get("/users")
async def public_users():
    """Public list (no passwords) — used by the login page to show demo tiles."""
    return [{"username": k, "name": v["name"], "role": v["role"]} for k, v in USERS.items()]
