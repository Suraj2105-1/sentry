"""
Pydantic models — merchant, battle, report types.
"""
from pydantic import BaseModel
from typing import Optional


class MerchantConfig(BaseModel):
    dynamic_pricing: bool = True
    return_window: int = 7
    coupon_policy: str = "single"


class MerchantBase(BaseModel):
    name: str
    category: str
    monthly_gmv: float = 0
    config: dict = {}


class MerchantCreate(MerchantBase):
    pass


class MerchantRead(MerchantBase):
    id: str
    risk_score: float = 0
    created_at: str

    class Config:
        from_attributes = True


class BattleSessionCreate(BaseModel):
    merchant_id: str


class BattleSessionRead(BaseModel):
    id: str
    merchant_id: str
    status: str
    generation: int
    red_attacks: int
    blue_blocks: int
    margin_health: float
    harm_prevented_inr: float
    created_at: str


class ScanRequest(BaseModel):
    merchant_id: str


class VulnerabilityRead(BaseModel):
    id: str
    name: str
    attack_vector: str
    description: str
    cvss_score: float
    severity: str
    category: str
    exploit_probability: float
    financial_exposure_inr: float
    remediation: str
    remediation_effort: str
    confirmed: bool = False


class ScanSummary(BaseModel):
    critical: int
    high: int
    medium: int
    total_confirmed: int
    total_exposure_inr: float
    overall_score: float
    risk_rating: str


class ScanReport(BaseModel):
    scan_id: str
    merchant_id: str
    merchant_name: Optional[str] = None
    vulnerabilities: list[VulnerabilityRead]
    summary: ScanSummary
    completed_at: str
    status: str = "completed"
