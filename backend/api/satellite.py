"""
backend/api/satellite.py
======================
API endpoints for satellite remote sensing and crop health monitoring.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

from backend.services.satellite import satellite_service

router = APIRouter(prefix="/satellite", tags=["satellite"])


class NDVIRequest(BaseModel):
    lat: float
    lon: float
    radius_km: float = 5.0


class CropHealthRequest(BaseModel):
    lat: float
    lon: float
    crop_type: str = "general"


class SoilMoistureRequest(BaseModel):
    lat: float
    lon: float


class DroughtRiskRequest(BaseModel):
    lat: float
    lon: float


class FloodRiskRequest(BaseModel):
    lat: float
    lon: float


class ChangeDetectionRequest(BaseModel):
    lat: float
    lon: float
    days: int = 30


class YieldEstimationRequest(BaseModel):
    lat: float
    lon: float
    crop: str


class TimeSeriesRequest(BaseModel):
    lat: float
    lon: float
    days: int = 90


class MultiIndexRequest(BaseModel):
    lat: float
    lon: float
    include_indices: Optional[List[str]] = None


@router.post("/ndvi")
async def get_ndvi(request: NDVIRequest):
    """Get NDVI (Normalized Difference Vegetation Index) for a location."""
    try:
        result = await satellite_service.get_ndvi(
            lat=request.lat,
            lon=request.lon,
            radius_km=request.radius_km,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crop-health")
async def get_crop_health(request: CropHealthRequest):
    """Get overall crop health score (0-100) based on multiple vegetation indices."""
    try:
        result = await satellite_service.get_crop_health_score(
            lat=request.lat,
            lon=request.lon,
            crop_type=request.crop_type,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/soil-moisture")
async def get_soil_moisture(request: SoilMoistureRequest):
    """Get estimated soil moisture content."""
    try:
        result = await satellite_service.get_soil_moisture(
            lat=request.lat,
            lon=request.lon,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/drought-risk")
async def detect_drought(request: DroughtRiskRequest):
    """Detect drought risk using vegetation stress indicators."""
    try:
        result = await satellite_service.detect_drought_risk(
            lat=request.lat,
            lon=request.lon,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/flood-risk")
async def detect_flood(request: FloodRiskRequest):
    """Detect potential flood risk using water indices."""
    try:
        result = await satellite_service.detect_flood_risk(
            lat=request.lat,
            lon=request.lon,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/change-detection")
async def detect_changes(request: ChangeDetectionRequest):
    """Detect changes in vegetation over time."""
    try:
        result = await satellite_service.get_crop_change_detection(
            lat=request.lat,
            lon=request.lon,
            days=request.days,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/yield-estimation")
async def estimate_yield(request: YieldEstimationRequest):
    """Estimate crop yield potential based on vegetation health."""
    try:
        result = await satellite_service.get_yield_estimation(
            lat=request.lat,
            lon=request.lon,
            crop=request.crop,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/time-series")
async def get_timeseries(request: TimeSeriesRequest):
    """Get historical NDVI time series for analysis."""
    try:
        result = await satellite_service.get_time_series(
            lat=request.lat,
            lon=request.lon,
            days=request.days,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/multi-index")
async def get_multi_index(request: MultiIndexRequest):
    """Get multiple vegetation indices in one call."""
    try:
        indices = request.include_indices or ["ndvi", "ndwi", "evi"]
        results = {}

        if "ndvi" in indices:
            results["ndvi"] = await satellite_service.get_ndvi(request.lat, request.lon)
        if "ndwi" in indices:
            results["ndwi"] = await satellite_service.get_ndwi(request.lat, request.lon)
        if "evi" in indices:
            results["evi"] = await satellite_service.get_evi(request.lat, request.lon)

        return {"success": True, "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/indices")
async def list_indices():
    """List available vegetation indices and their descriptions."""
    return {
        "indices": [
            {
                "name": "NDVI",
                "description": "Normalized Difference Vegetation Index - measures vegetation health and density",
                "range": "-1 to 1",
                "use_cases": ["crop health", "vegetation monitoring", "yield estimation"],
            },
            {
                "name": "NDWI",
                "description": "Normalized Difference Water Index - measures water content in vegetation",
                "range": "-1 to 1",
                "use_cases": ["soil moisture", "drought monitoring", "irrigation scheduling"],
            },
            {
                "name": "EVI",
                "description": "Enhanced Vegetation Index - sensitive to canopy variations",
                "range": "-1 to 1",
                "use_cases": ["canopy structure", "growth stage detection"],
            },
        ]
    }


class SatelliteSearchRequest(BaseModel):
    lat: float
    lon: float
    satellite: str = "sentinel-2-l2a"
    days: int = 30
    cloud_cover: float = 20.0
    
    @property
    def cloud_cover_val(self) -> float:
        return float(self.cloud_cover)


class SatelliteFeaturesRequest(BaseModel):
    lat: float
    lon: float
    satellite: str = "sentinel-2-l2a"
    crop: str = "general"


@router.get("/satellites")
async def list_satellites():
    """List all available satellite datasets."""
    return {"satellites": satellite_service.list_satellites()}


@router.post("/search")
async def search_satellite(request: SatelliteSearchRequest):
    """Search any satellite for imagery."""
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    try:
        result = await satellite_service.search_satellite(
            lat=request.lat,
            lon=request.lon,
            satellite=request.satellite,
            days=request.days,
            cloud_cover=request.cloud_cover,
        )
        logger.info(f"Search result: {result.get('count', 0)} items")
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        # Return demo data on error
        demo_data = satellite_service._generate_demo_imagery(
            request.lat, request.lon, request.satellite, request.days, request.cloud_cover or 30.0
        )
        return {"success": True, "data": {**demo_data, "demo": True, "error": str(e)}}


@router.post("/features")
async def get_satellite_features(request: SatelliteFeaturesRequest):
    """Get all features for a specific satellite."""
    import logging
    try:
        result = await satellite_service.get_satellite_features(
            lat=request.lat,
            lon=request.lon,
            satellite=request.satellite,
            crop=request.crop,
        )
        return {"success": True, "data": result}
    except Exception as e:
        logging.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class PlanetSearchRequest(BaseModel):
    lat: float
    lon: float
    item_types: Optional[List[str]] = ["sentinel2-l2a"]
    days: int = 30
    cloud_cover: float = 20.0


class PlanetAssetRequest(BaseModel):
    item_id: str
    item_type: str = "sentinel2-l2a"


class CalcNDVIRequest(BaseModel):
    nir: float
    red: float


@router.post("/planet/search")
async def planet_search(request: PlanetSearchRequest):
    """Search Planet satellite imagery for a location."""
    try:
        result = await satellite_service.planet_search(
            lat=request.lat,
            lon=request.lon,
            item_types=request.item_types,
            days=request.days,
            cloud_cover=request.cloud_cover,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/planet/assets")
async def planet_get_assets(request: PlanetAssetRequest):
    """Get available assets for a Planet item."""
    try:
        result = await satellite_service.planet_get_assets(
            item_id=request.item_id,
            item_type=request.item_type,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/planet/activate")
async def planet_activate_asset(
    item_id: str = Query(...),
    asset_type: str = Query("analytic_sr"),
    item_type_param: str = Query("Sentinel2"),
):
    """Activate an asset for download."""
    try:
        result = await satellite_service.planet_activate_asset(
            item_id=item_id,
            asset_type=asset_type,
            item_type=item_type_param,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate/ndvi")
async def calculate_ndvi(request: CalcNDVIRequest):
    """Calculate NDVI from NIR and Red bands."""
    try:
        ndvi = satellite_service.calculate_ndvi_from_bands(
            nir=request.nir,
            red=request.red,
        )
        return {"success": True, "data": {"ndvi": ndvi, "interpretation": _interpret_ndvi(ndvi)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate/ndwi")
async def calculate_ndwi(request: CalcNDVIRequest):
    """Calculate NDWI from NIR and SWIR bands."""
    try:
        ndwi = satellite_service.calculate_ndwi_from_bands(
            nir=request.nir,
            swir=request.red,
        )
        return {"success": True, "data": {"ndwi": ndwi}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _interpret_ndvi(ndvi: float) -> str:
    if ndvi < 0:
        return "Water or inanimate surface"
    elif ndvi < 0.2:
        return "Bare soil or sand"
    elif ndvi < 0.5:
        return "Sparse vegetation"
    elif ndvi < 0.8:
        return "Healthy vegetation / crops"
    return "Dense forest"