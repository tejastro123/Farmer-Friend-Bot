"""
backend/api/farm.py
==================
Farm Management API - Crop, Weather, Financial, Inventory, Advisory, Schemes, Soil
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.api.auth import get_current_user
from backend.db.db_utils import (
    add_crop_cycle, get_crop_cycles, add_yield_record, get_yield_records,
    add_input_usage, get_input_usage, add_equipment, get_equipment,
    add_weather_record, get_weather_history, add_weather_alert, get_weather_alerts,
    add_expense, get_expenses, add_transaction, get_transactions,
    add_loan, get_loans, add_insurance, get_insurance,
    add_seed_inventory, get_seed_inventory, add_agrochemical_stock, get_agrochemical_stock,
    add_advisory_recommendation, get_advisory_recommendations, update_advisory_implementation,
    add_scheme_application, get_scheme_applications, update_scheme_status,
    add_soil_test, get_soil_tests, get_latest_soil_health
)

router = APIRouter(prefix="/farm", tags=["Farm Management"])

# ── SCHEMAS ──────────────────────────────────────────────────────────────────

class CropCycleCreate(BaseModel):
    crop_name: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    season: Optional[str] = None
    notes: Optional[str] = None

class CropCycleUpdate(BaseModel):
    crop_name: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    actual_harvest_date: Optional[str] = None
    season: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class YieldRecordCreate(BaseModel):
    crop_cycle_id: Optional[int] = None
    crop_name: Optional[str] = None
    yield_quintals: Optional[float] = None
    area_hectares: Optional[float] = None
    selling_price_per_quintal: Optional[float] = None
    buyer_name: Optional[str] = None
    harvest_date: Optional[str] = None
    quality_grade: Optional[str] = None
    notes: Optional[str] = None

class InputUsageCreate(BaseModel):
    crop_cycle_id: Optional[int] = None
    input_type: Optional[str] = None
    input_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    cost: Optional[float] = None
    application_date: Optional[str] = None
    notes: Optional[str] = None

class EquipmentCreate(BaseModel):
    equipment_name: Optional[str] = None
    equipment_type: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_cost: Optional[float] = None
    condition: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    next_maintenance_date: Optional[str] = None
    notes: Optional[str] = None

class EquipmentUpdate(BaseModel):
    equipment_name: Optional[str] = None
    equipment_type: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_cost: Optional[float] = None
    condition: Optional[str] = None
    last_maintenance_date: Optional[str] = None
    next_maintenance_date: Optional[str] = None
    notes: Optional[str] = None

class WeatherRecordCreate(BaseModel):
    date: Optional[str] = None
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    humidity: Optional[float] = None
    rainfall_mm: Optional[float] = None
    weather_condition: Optional[str] = None

class WeatherRecordUpdate(BaseModel):
    date: Optional[str] = None
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    humidity: Optional[float] = None
    rainfall_mm: Optional[float] = None
    weather_condition: Optional[str] = None

class WeatherAlertCreate(BaseModel):
    alert_type: Optional[str] = None
    severity: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class ExpenseCreate(BaseModel):
    expense_type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None
    receipt_image: Optional[str] = None
    is_recurring: Optional[int] = None

class ExpenseUpdate(BaseModel):
    expense_type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None
    receipt_image: Optional[str] = None
    is_recurring: Optional[int] = None

class TransactionCreate(BaseModel):
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    reference_id: Optional[str] = None
    payment_method: Optional[str] = None

class TransactionUpdate(BaseModel):
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    reference_id: Optional[str] = None
    payment_method: Optional[str] = None

class LoanCreate(BaseModel):
    lender_name: Optional[str] = None
    loan_type: Optional[str] = None
    principal_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    emi_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None

class LoanUpdate(BaseModel):
    lender_name: Optional[str] = None
    loan_type: Optional[str] = None
    principal_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    emi_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class InsuranceCreate(BaseModel):
    policy_type: Optional[str] = None
    provider_name: Optional[str] = None
    policy_number: Optional[str] = None
    premium_amount: Optional[float] = None
    coverage_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None

class InsuranceUpdate(BaseModel):
    policy_type: Optional[str] = None
    provider_name: Optional[str] = None
    policy_number: Optional[str] = None
    premium_amount: Optional[float] = None
    coverage_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    claim_status: Optional[str] = None
    notes: Optional[str] = None

class SeedInventoryCreate(BaseModel):
    seed_name: Optional[str] = None
    crop_type: Optional[str] = None
    quantity_kg: Optional[float] = None
    cost: Optional[float] = None
    purchase_date: Optional[str] = None
    supplier_name: Optional[str] = None
    expiry_date: Optional[str] = None
    notes: Optional[str] = None

class SeedInventoryUpdate(BaseModel):
    seed_name: Optional[str] = None
    crop_type: Optional[str] = None
    quantity_kg: Optional[float] = None
    cost: Optional[float] = None
    purchase_date: Optional[str] = None
    supplier_name: Optional[str] = None
    expiry_date: Optional[str] = None
    notes: Optional[str] = None

class AgrochemicalStockCreate(BaseModel):
    product_name: str
    product_type: str
    quantity_kg: float
    cost: float
    purchase_date: str
    supplier_name: Optional[str] = None
    expiry_date: Optional[str] = None
    notes: Optional[str] = None

class AdvisoryCreate(BaseModel):
    crop_cycle_id: int
    recommendation_text: str
    category: str
    priority: str

class AdvisoryUpdate(BaseModel):
    is_implemented: int
    result_text: Optional[str] = None

class SchemeApplicationCreate(BaseModel):
    scheme_name: str
    scheme_type: str
    applying_date: str
    amount_applied: float
    documents_submitted: Optional[str] = None
    notes: Optional[str] = None

class SchemeUpdate(BaseModel):
    status: str
    amount_approved: Optional[float] = None
    approval_date: Optional[str] = None

class SoilTestCreate(BaseModel):
    test_date: str
    ph_level: float
    nitrogen_ppm: float
    phosphorus_ppm: float
    potassium_ppm: float
    organic_carbon: float
    lab_name: Optional[str] = None
    field_location: Optional[str] = None
    recommendations: Optional[str] = None

class SoilTestUpdate(BaseModel):
    test_date: Optional[str] = None
    ph_level: Optional[float] = None
    nitrogen_ppm: Optional[float] = None
    phosphorus_ppm: Optional[float] = None
    potassium_ppm: Optional[float] = None
    organic_carbon: Optional[float] = None
    lab_name: Optional[str] = None
    field_location: Optional[str] = None
    recommendations: Optional[str] = None

# ── CROP MANAGEMENT ───────────────────────────────────────────────────────────

@router.post("/crop-cycles")
def create_crop_cycle(data: CropCycleCreate, user: dict = Depends(get_current_user)):
    try:
        payload = {k: v for k, v in data.dict().items() if v is not None}
        cycle_id = add_crop_cycle(
            user["id"],
            payload.get("crop_name"),
            payload.get("planting_date"),
            payload.get("expected_harvest_date"),
            payload.get("season"),
            payload.get("notes")
        )
        return {"id": cycle_id, "status": "created"}
    except Exception as e:
        logger.error(f"Crop cycle error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/crop-cycles")
def list_crop_cycles(user: dict = Depends(get_current_user)):
    return get_crop_cycles(user["id"])

@router.put("/crop-cycles/{cycle_id}")
def update_crop_cycle(cycle_id: int, data: CropCycleUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_crop_cycle
    try:
        update_crop_cycle(user["id"], cycle_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Crop cycle update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/crop-cycles/{cycle_id}")
def delete_crop_cycle(cycle_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_crop_cycle
    try:
        delete_crop_cycle(user["id"], cycle_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Crop cycle delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/yield-records")
def create_yield_record(data: YieldRecordCreate, user: dict = Depends(get_current_user)):
    try:
        total_income = data.yield_quintals * data.selling_price_per_quintal
        rid = add_yield_record(user["id"], data.crop_cycle_id, data.crop_name, data.yield_quintals, data.area_hectares, data.selling_price_per_quintal, total_income, buyer=data.buyer_name, harvest_date=data.harvest_date, grade=data.quality_grade, notes=data.notes)
        return {"id": rid, "status": "created"}
    except Exception as e:
        logger.error(f"Yield record error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/yield-records")
def list_yield_records(user: dict = Depends(get_current_user)):
    return get_yield_records(user["id"])

@router.post("/input-usage")
def create_input_usage(data: InputUsageCreate, user: dict = Depends(get_current_user)):
    try:
        iid = add_input_usage(user["id"], data.crop_cycle_id, data.input_type, data.input_name, data.quantity, data.cost, data.unit, data.application_date, data.notes)
        return {"id": iid, "status": "created"}
    except Exception as e:
        logger.error(f"Input usage error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/input-usage")
def list_input_usage(user: dict = Depends(get_current_user)):
    return get_input_usage(user["id"])

@router.post("/equipment")
def create_equipment(data: EquipmentCreate, user: dict = Depends(get_current_user)):
    try:
        payload = {k: v for k, v in data.dict().items() if v is not None}
        eid = add_equipment(
            user["id"],
            payload.get("equipment_name"),
            payload.get("equipment_type"),
            payload.get("purchase_date"),
            payload.get("purchase_cost"),
            payload.get("condition"),
            last_maint=payload.get("last_maintenance_date"),
            next_maint=payload.get("next_maintenance_date"),
            notes=payload.get("notes")
        )
        return {"id": eid, "status": "created"}
    except Exception as e:
        logger.error(f"Equipment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/equipment")
def list_equipment(user: dict = Depends(get_current_user)):
    return get_equipment(user["id"])

@router.put("/equipment/{equip_id}")
def update_equipment(equip_id: int, data: EquipmentUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_equipment
    try:
        update_equipment(user["id"], equip_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Equipment update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/equipment/{equip_id}")
def delete_equipment(equip_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_equipment
    try:
        delete_equipment(user["id"], equip_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Equipment delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── WEATHER ───────────────────────────────────────────────────────────────────

@router.post("/weather")
def create_weather_record(data: WeatherRecordCreate, user: dict = Depends(get_current_user)):
    try:
        wid = add_weather_record(user["id"], data.date, data.temperature_min, data.temperature_max, data.humidity, data.rainfall_mm, data.weather_condition)
        return {"id": wid, "status": "created"}
    except Exception as e:
        logger.error(f"Weather record error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather")
def list_weather_history(user: dict = Depends(get_current_user), limit: int = 30):
    return get_weather_history(user["id"], limit)

@router.put("/weather/{weather_id}")
def update_weather_record(weather_id: int, data: WeatherRecordUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_weather_record
    try:
        update_weather_record(user["id"], weather_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Weather update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/weather/{weather_id}")
def delete_weather_record(weather_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_weather_record
    try:
        delete_weather_record(user["id"], weather_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Weather delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/weather/alerts")
def create_weather_alert(data: WeatherAlertCreate, user: dict = Depends(get_current_user)):
    try:
        aid = add_weather_alert(user["id"], data.alert_type, data.severity, data.start_date, data.end_date, data.description)
        return {"id": aid, "status": "created"}
    except Exception as e:
        logger.error(f"Weather alert error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather/alerts")
def list_weather_alerts(user: dict = Depends(get_current_user)):
    return get_weather_alerts(user["id"])

# ── FINANCE ───────────────────────────────────────────────────────────────────

@router.post("/expenses")
def create_expense(data: ExpenseCreate, user: dict = Depends(get_current_user)):
    try:
        payload = {k: v for k, v in data.dict().items() if v is not None}
        eid = add_expense(
            user["id"],
            payload.get("expense_type"),
            payload.get("category"),
            payload.get("amount"),
            payload.get("date"),
            payload.get("description"),
            receipt=payload.get("receipt_image"),
            recurring=payload.get("is_recurring")
        )
        return {"id": eid, "status": "created"}
    except Exception as e:
        logger.error(f"Expense error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/expenses")
def list_expenses(user: dict = Depends(get_current_user), category: Optional[str] = None):
    return get_expenses(user["id"], category)

@router.put("/expenses/{expense_id}")
def update_expense(expense_id: int, data: ExpenseUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_expense
    try:
        update_expense(user["id"], expense_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Expense update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_expense
    try:
        delete_expense(user["id"], expense_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Expense delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transactions")
def create_transaction(data: TransactionCreate, user: dict = Depends(get_current_user)):
    try:
        tid = add_transaction(user["id"], data.transaction_type, data.amount, data.date, data.category, data.description, ref_id=data.reference_id, payment_method=data.payment_method)
        return {"id": tid, "status": "created"}
    except Exception as e:
        logger.error(f"Transaction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions")
def list_transactions(user: dict = Depends(get_current_user)):
    return get_transactions(user["id"])

@router.put("/transactions/{txn_id}")
def update_transaction(txn_id: int, data: TransactionUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_transaction
    try:
        update_transaction(user["id"], txn_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Transaction update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/transactions/{txn_id}")
def delete_transaction(txn_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_transaction
    try:
        delete_transaction(user["id"], txn_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Transaction delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/loans")
def create_loan(data: LoanCreate, user: dict = Depends(get_current_user)):
    try:
        lid = add_loan(user["id"], data.lender_name, data.loan_type, data.principal_amount, data.interest_rate, data.emi_amount, data.start_date, data.end_date, notes=data.notes)
        return {"id": lid, "status": "created"}
    except Exception as e:
        logger.error(f"Loan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/loans")
def list_loans(user: dict = Depends(get_current_user)):
    return get_loans(user["id"])

@router.put("/loans/{loan_id}")
def update_loan(loan_id: int, data: LoanUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_loan
    try:
        update_loan(user["id"], loan_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Loan update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/loans/{loan_id}")
def delete_loan(loan_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_loan
    try:
        delete_loan(user["id"], loan_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Loan delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/insurance")
def create_insurance(data: InsuranceCreate, user: dict = Depends(get_current_user)):
    try:
        iid = add_insurance(user["id"], data.policy_type, data.provider_name, data.policy_number, data.premium_amount, data.coverage_amount, data.start_date, data.end_date, notes=data.notes)
        return {"id": iid, "status": "created"}
    except Exception as e:
        logger.error(f"Insurance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insurance")
def list_insurance(user: dict = Depends(get_current_user)):
    return get_insurance(user["id"])

@router.put("/insurance/{policy_id}")
def update_insurance_policy(policy_id: int, data: InsuranceUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_insurance
    try:
        update_insurance(user["id"], policy_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Insurance update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/insurance/{policy_id}")
def delete_insurance_policy(policy_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_insurance
    try:
        delete_insurance(user["id"], policy_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Insurance delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── INVENTORY ─────────────────────────────────────────────────────────────────

@router.post("/seeds")
def create_seed_inventory(data: SeedInventoryCreate, user: dict = Depends(get_current_user)):
    try:
        payload = {k: v for k, v in data.dict().items() if v is not None}
        sid = add_seed_inventory(
            user["id"],
            payload.get("seed_name"),
            payload.get("crop_type"),
            payload.get("quantity_kg"),
            payload.get("cost"),
            payload.get("purchase_date"),
            supplier=payload.get("supplier_name"),
            expiry=payload.get("expiry_date"),
            notes=payload.get("notes")
        )
        return {"id": sid, "status": "created"}
    except Exception as e:
        logger.error(f"Seed inventory error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/seeds")
def list_seed_inventory(user: dict = Depends(get_current_user)):
    return get_seed_inventory(user["id"])

@router.put("/seeds/{seed_id}")
def update_seed_inventory_endpoint(seed_id: int, data: SeedInventoryUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_seed_inventory
    try:
        update_seed_inventory(user["id"], seed_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Seed update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/seeds/{seed_id}")
def delete_seed_inventory_endpoint(seed_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_seed_inventory
    try:
        delete_seed_inventory(user["id"], seed_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Seed delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agrochemicals")
def create_agrochemical_stock(data: AgrochemicalStockCreate, user: dict = Depends(get_current_user)):
    try:
        sid = add_agrochemical_stock(user["id"], data.product_name, data.product_type, data.quantity_kg, data.cost, data.purchase_date, supplier=data.supplier_name, expiry=data.expiry_date, notes=data.notes)
        return {"id": sid, "status": "created"}
    except Exception as e:
        logger.error(f"Agrochemical stock error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agrochemicals")
def list_agrochemical_stock(user: dict = Depends(get_current_user)):
    return get_agrochemical_stock(user["id"])

# ── ADVISORY ───────────────────────────────────────────────────────────────────

@router.post("/advisory")
def create_advisory(data: AdvisoryCreate, user: dict = Depends(get_current_user)):
    try:
        aid = add_advisory_recommendation(user["id"], data.crop_cycle_id, data.recommendation_text, data.category, data.priority)
        return {"id": aid, "status": "created"}
    except Exception as e:
        logger.error(f"Advisory error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/advisory")
def list_advisory(user: dict = Depends(get_current_user)):
    return get_advisory_recommendations(user["id"])

@router.put("/advisory/{rec_id}")
def update_advisory(rec_id: int, data: AdvisoryUpdate, user: dict = Depends(get_current_user)):
    try:
        update_advisory_implementation(user["id"], rec_id, data.is_implemented, data.result_text)
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Advisory update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── GOVERNMENT SCHEMES ─────────────────────────────────────────────────────────

@router.post("/schemes")
def create_scheme_application(data: SchemeApplicationCreate, user: dict = Depends(get_current_user)):
    try:
        sid = add_scheme_application(user["id"], data.scheme_name, data.scheme_type, data.applying_date, data.amount_applied, documents=data.documents_submitted, notes=data.notes)
        return {"id": sid, "status": "created"}
    except Exception as e:
        logger.error(f"Scheme application error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/schemes")
def list_scheme_applications(user: dict = Depends(get_current_user)):
    return get_scheme_applications(user["id"])

@router.put("/schemes/{app_id}")
def update_scheme(app_id: int, data: SchemeUpdate, user: dict = Depends(get_current_user)):
    try:
        update_scheme_status(user["id"], app_id, data.status, data.amount_approved, data.approval_date)
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Scheme update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── SOIL HEALTH ────────────────────────────────────────────────────────────────

@router.post("/soil-tests")
def create_soil_test(data: SoilTestCreate, user: dict = Depends(get_current_user)):
    try:
        payload = {k: v for k, v in data.dict().items() if v is not None}
        tid = add_soil_test(
            user["id"],
            payload.get("test_date"),
            payload.get("ph_level"),
            payload.get("nitrogen_ppm"),
            payload.get("phosphorus_ppm"),
            payload.get("potassium_ppm"),
            payload.get("organic_carbon"),
            lab=payload.get("lab_name"),
            location=payload.get("field_location"),
            recommendations=payload.get("recommendations")
        )
        return {"id": tid, "status": "created"}
    except Exception as e:
        logger.error(f"Soil test error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/soil-tests")
def list_soil_tests(user: dict = Depends(get_current_user)):
    return get_soil_tests(user["id"])

@router.put("/soil-tests/{test_id}")
def update_soil_test(test_id: int, data: SoilTestUpdate, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import update_soil_test
    try:
        update_soil_test(user["id"], test_id, data.dict(exclude_unset=True))
        return {"status": "updated"}
    except Exception as e:
        logger.error(f"Soil test update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/soil-tests/{test_id}")
def delete_soil_test(test_id: int, user: dict = Depends(get_current_user)):
    from backend.db.db_utils import delete_soil_test
    try:
        delete_soil_test(user["id"], test_id)
        return {"status": "deleted"}
    except Exception as e:
        logger.error(f"Soil test delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/soil-health/latest")
def get_latest_soil(user: dict = Depends(get_current_user)):
    return get_latest_soil_health(user["id"])

@router.get("/dashboard-summary")
def get_dashboard_summary(user: dict = Depends(get_current_user)):
    """Get summary data for farm dashboard"""
    try:
        # Try to auto-sync weather data
        try:
            from backend.services.weather import auto_log_weather
            from backend.db.db_utils import get_farmer_profile
            profile = get_farmer_profile(user["id"])
            if profile and profile.get("village") or profile.get("district"):
                location = profile.get("village") or profile.get("district")
                auto_log_weather(user["id"], location)
        except Exception as wE:
            pass
        
        return {
            "active_cycles": len(get_crop_cycles(user["id"])),
            "total_yield": sum(r.get('yield_quintals', 0) for r in get_yield_records(user["id"])),
            "total_expenses": sum(e.get('amount', 0) for e in get_expenses(user["id"])),
            "total_income": sum(t.get('amount', 0) for t in get_transactions(user["id"]) if t.get('transaction_type') == 'income'),
            "active_loans": len([l for l in get_loans(user["id"]) if l.get('status') == 'active']),
            "pending_schemes": len([s for s in get_scheme_applications(user["id"]) if s.get('status') == 'pending']),
            "soil_health": get_latest_soil_health(user["id"]),
            "equipment_count": len(get_equipment(user["id"])),
            "seed_inventory_count": len(get_seed_inventory(user["id"])),
            "alerts_count": len(get_weather_alerts(user["id"]))
        }
    except Exception as e:
        logger.error(f"Dashboard summary error: {e}")
        return {"error": str(e)}

@router.post("/sync-weather")
def sync_weather(user: dict = Depends(get_current_user)):
    """Manually trigger weather data sync"""
    from backend.services.weather import auto_log_weather
    from backend.db.db_utils import get_farmer_profile
    try:
        profile = get_farmer_profile(user["id"])
        if not profile or not (profile.get("village") or profile.get("district")):
            return {"status": "error", "message": "No location set in profile"}
        
        location = profile.get("village") or profile.get("district")
        success = auto_log_weather(user["id"], location)
        return {"status": "synced" if success else "error", "location": location}
    except Exception as e:
        return {"status": "error", "message": str(e)}