"""Master Data API — read/write for Products, B2B/B2C Customers, Costing, Recipes."""
from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from ._shared import get_db, serialize, gen_id
from .graamam_master import COMPANY

router = APIRouter(prefix="/graamam/master", tags=["graamam-master"])


@router.get("/company")
async def get_company():
    return COMPANY


@router.get("/products")
async def list_products(category: Optional[str] = None, q: Optional[str] = None):
    db = get_db()
    query = {}
    if category and category.lower() != "all":
        query["category"] = category
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"product_id": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.graamam_products.find(query, {"_id": 0}).sort("product_id", 1).to_list(1000)
    return [serialize(d) for d in docs]


@router.get("/customers/b2b")
async def list_b2b_customers():
    db = get_db()
    return [serialize(d) async for d in db.graamam_customers_b2b.find({}, {"_id": 0}).sort("name", 1)]


@router.get("/customers/b2c")
async def list_b2c_customers(q: Optional[str] = None):
    db = get_db()
    query = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"mobile": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
        ]
    return [serialize(d) async for d in db.graamam_customers_b2c.find(query, {"_id": 0}).limit(200)]


@router.get("/costing")
async def list_costing():
    db = get_db()
    return [serialize(d) async for d in db.graamam_costing.find({}, {"_id": 0}).sort("mainProduct", 1)]


@router.get("/summary")
async def summary():
    db = get_db()
    return {
        "products": await db.graamam_products.count_documents({}),
        "b2b_customers": await db.graamam_customers_b2b.count_documents({}),
        "b2c_customers": await db.graamam_customers_b2c.count_documents({}),
        "costing": await db.graamam_costing.count_documents({}),
        "recipes": await db.graamam_recipes.count_documents({}),
    }


class ProductPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: Optional[str] = None
    name: str
    category: str = "Other"
    pack: str = ""
    hsn: str = "2106"
    gst_rate: float = 5
    shelf_life: str = ""
    mrp_inr: float = 0
    discount_pct: float = 0


@router.post("/products", status_code=201)
async def create_product(payload: ProductPayload):
    db = get_db()
    if not payload.name.strip():
        raise HTTPException(400, "name is required")
    docs = await db.graamam_products.find({}, {"_id": 0, "product_id": 1}).to_list(5000)
    nums = []
    for d in docs:
        pid = (d.get("product_id") or "").replace("P", "")
        if pid.isdigit():
            nums.append(int(pid))
    pid = payload.product_id or f"P{(max(nums) + 1 if nums else 200):03d}"
    doc = {"id": gen_id(), "product_id": pid, **payload.model_dump(exclude={"product_id"})}
    doc["icon"] = "eco"
    await db.graamam_products.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


# ---------- RECIPES (recipe -> product link is BY NAME; read by
# graamam_production.py's order_raw_needs()). Field names below
# (batch_output / cost_per_kg) MUST match exactly what production.py
# reads from graamam_recipes — do not rename. ----------
class RecipeIngredientPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item: str
    qty: float = 0
    cost_per_kg: float = 0


class RecipePayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    category: str = ""
    conversion: float = 1.0
    batch_output: float = 1
    ingredients: List[RecipeIngredientPayload] = []


def _recipe_doc(payload: RecipePayload, existing_id: Optional[str] = None) -> dict:
    return {
        "id": existing_id or gen_id(),
        "name": payload.name.strip(),
        "category": (payload.category or "").strip(),
        "conversion": float(payload.conversion or 1.0),
        "batch_output": float(payload.batch_output or 1),
        "ingredients": [
            {"item": i.item.strip(), "qty": float(i.qty or 0), "cost_per_kg": float(i.cost_per_kg or 0)}
            for i in payload.ingredients if i.item and i.item.strip()
        ],
    }


@router.get("/recipes")
async def list_recipes():
    db = get_db()
    return [serialize(d) async for d in db.graamam_recipes.find({}, {"_id": 0}).sort("name", 1)]


@router.post("/recipes", status_code=201)
async def create_recipe(payload: RecipePayload):
    db = get_db()
    name = payload.name.strip()
    if not name:
        raise HTTPException(400, "name is required")
    doc = _recipe_doc(payload)
    if not doc["ingredients"]:
        raise HTTPException(400, "at least one ingredient is required")
    if await db.graamam_recipes.find_one({"name": name}, {"_id": 1}):
        raise HTTPException(409, f"a recipe named '{name}' already exists")
    await db.graamam_recipes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@router.put("/recipes/{name}")
async def update_recipe(name: str, payload: RecipePayload):
    db = get_db()
    existing = await db.graamam_recipes.find_one({"name": name}, {"_id": 0})
    if not existing:
        raise HTTPException(404, f"recipe '{name}' not found")
    new_name = payload.name.strip() or name
    if new_name != name and await db.graamam_recipes.find_one({"name": new_name}, {"_id": 1}):
        raise HTTPException(409, f"a recipe named '{new_name}' already exists")
    doc = _recipe_doc(payload, existing_id=existing.get("id"))
    if not doc["ingredients"]:
        raise HTTPException(400, "at least one ingredient is required")
    await db.graamam_recipes.update_one({"name": name}, {"$set": doc})
    updated = await db.graamam_recipes.find_one({"name": new_name}, {"_id": 0})
    return serialize(updated)


@router.delete("/recipes/{name}")
async def delete_recipe(name: str):
    db = get_db()
    r = await db.graamam_recipes.delete_one({"name": name})
    if not r.deleted_count:
        raise HTTPException(404, f"recipe '{name}' not found")
    return {"deleted": True, "name": name}
