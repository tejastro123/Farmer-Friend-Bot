"""
backend/ml/models.py
====================
Trains and encapsulates ML predictive models in-memory on boot.
"""
import logging
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

from backend.ml.synthetic_data import generate_yield_data, generate_disease_data, generate_market_data, generate_irrigation_data

logger = logging.getLogger(__name__)

class MLPredictors:
    def __init__(self):
        self.yield_model = None
        self.disease_model = None
        self.price_model = None
        self.irrigation_model = None
        
        # Encoders for categorical string inputs
        self.crop_le = LabelEncoder()
        self.soil_le = LabelEncoder()
        self.source_le = LabelEncoder()
        
        logger.info("Initializing ML Prediction Service. Generating and training synthetic models...")
        self._train_models()

    def _train_models(self):
        try:
            # 1. Train Yield Model (XGBoost)
            df_yield = generate_yield_data(2000)
            self.crop_le.fit(df_yield['crop'].tolist() + ['wheat', 'rice', 'tomato', 'onion', 'cotton'])
            self.soil_le.fit(df_yield['soil_type'].tolist() + ['black', 'red', 'alluvial', 'laterite'])
            
            df_yield['crop'] = self.crop_le.transform(df_yield['crop'])
            df_yield['soil_type'] = self.soil_le.transform(df_yield['soil_type'])
            
            X_y = df_yield[['crop', 'soil_type', 'area_acres', 'avg_temp_c', 'rainfall_mm']]
            y_y = df_yield['yield_tons']
            
            self.yield_model = xgb.XGBRegressor(n_estimators=100, max_depth=4, random_state=42)
            self.yield_model.fit(X_y, y_y)
            logger.info("Yield Model (XGBoost) trained.")

            # 2. Train Disease Outbreak Model (Random Forest)
            df_disease = generate_disease_data(2000)
            df_disease['crop'] = self.crop_le.transform(df_disease['crop'])
            
            X_d = df_disease[['crop', 'humidity_pct', 'temp_c', 'wind_speed_kph', 'soil_moisture', 'ndvi_index', 'historical_pressure', 'leaf_wetness_hrs', 'last_24h_rainfall']]
            y_d = df_disease['disease_outbreak']
            
            self.disease_model = RandomForestClassifier(n_estimators=100, random_state=42)
            self.disease_model.fit(X_d, y_d)
            logger.info("Disease Risk Model (RandomForest) trained.")

            # 3. Train Market Price Model (XGBoost)
            df_market = generate_market_data(2000)
            df_market['crop'] = self.crop_le.transform(df_market['crop'])
            
            X_m = df_market[['crop', 'month', 'demand_index']]
            y_m = df_market['price_inr_quintal']
            
            self.price_model = xgb.XGBRegressor(n_estimators=100, max_depth=3, random_state=42)
            self.price_model.fit(X_m, y_m)
            logger.info("Market Price Model (XGBoost) trained.")

            # 4. Train Irrigation Optimizer Model (Random Forest)
            df_irr = generate_irrigation_data(2000)
            self.source_le.fit(df_irr['water_source'].tolist() + ['canal', 'tubewell', 'pond'])
            
            df_irr['crop'] = self.crop_le.transform(df_irr['crop'])
            df_irr['water_source'] = self.source_le.transform(df_irr['water_source'])
            
            X_i = df_irr[['crop', 'soil_moisture', 'temp_c', 'humidity_pct', 'wind_speed_kph', 'solar_intensity', 'water_availability', 'crop_age_days', 'rainfall_forecast_mm', 'soil_type_drying_const', 'leaf_area_index', 'water_source']]
            y_i = df_irr['irrigation_needed']
            
            self.irrigation_model = RandomForestClassifier(n_estimators=100, random_state=42)
            self.irrigation_model.fit(X_i, y_i)
            logger.info("Irrigation Optimizer Model (RandomForest) trained.")

        except Exception as e:
            logger.error(f"Failed to train ML Models: {e}")

    def predict_yield(self, crop: str, soil_type: str, area_acres: float, avg_temp_c: float, rainfall_mm: float) -> float:
        """Predict expected metric tons yield."""
        try:
            c = self.crop_le.transform([crop.lower()])[0]
            s = self.soil_le.transform([soil_type.lower()])[0]
            data = pd.DataFrame([[c, s, area_acres, avg_temp_c, rainfall_mm]], 
                                columns=['crop', 'soil_type', 'area_acres', 'avg_temp_c', 'rainfall_mm'])
            return float(self.yield_model.predict(data)[0])
        except Exception as e:
            logger.error(f"Yield predict error: {e}")
            return -1.0

    def predict_disease_risk(self, crop: str, humidity_pct: float, temp_c: float, wind_speed_kph: float, soil_moisture: float, ndvi_index: float, historical_pressure: float, leaf_wetness_hrs: float, last_24h_rainfall: float) -> float:
        """Predict probability (%) of pest/disease outbreak using 9 indicators."""
        try:
            c = self.crop_le.transform([crop.lower()])[0]
            data = pd.DataFrame([[c, humidity_pct, temp_c, wind_speed_kph, soil_moisture, ndvi_index, historical_pressure, leaf_wetness_hrs, last_24h_rainfall]], 
                                columns=['crop', 'humidity_pct', 'temp_c', 'wind_speed_kph', 'soil_moisture', 'ndvi_index', 'historical_pressure', 'leaf_wetness_hrs', 'last_24h_rainfall'])
            # Returns prob of class 1
            return float(self.disease_model.predict_proba(data)[0][1]) * 100 
        except Exception as e:
            logger.error(f"Disease risk predict error: {e}")
            return -1.0

    def forecast_price(self, crop: str, month: int, demand_index: float = 1.0) -> float:
        """Forecast price in INR per Quintal."""
        try:
            c = self.crop_le.transform([crop.lower()])[0]
            data = pd.DataFrame([[c, month, demand_index]], columns=['crop', 'month', 'demand_index'])
            return float(self.price_model.predict(data)[0])
        except Exception as e:
            logger.error(f"Price forecast error: {e}")
            return -1.0

    def predict_irrigation_need(self, crop: str, soil_moisture: float, temp_c: float, humidity_pct: float, wind_speed_kph: float, solar_intensity: float, water_availability: float, crop_age_days: int, rainfall_forecast_mm: float, soil_type_drying_const: float, leaf_area_index: float, water_source: str) -> float:
        """Predict probability (%) of needing irrigation."""
        try:
            c = self.crop_le.transform([crop.lower()])[0]
            src = self.source_le.transform([water_source.lower()])[0]
            data = pd.DataFrame([[c, soil_moisture, temp_c, humidity_pct, wind_speed_kph, solar_intensity, water_availability, crop_age_days, rainfall_forecast_mm, soil_type_drying_const, leaf_area_index, src]], 
                                columns=['crop', 'soil_moisture', 'temp_c', 'humidity_pct', 'wind_speed_kph', 'solar_intensity', 'water_availability', 'crop_age_days', 'rainfall_forecast_mm', 'soil_type_drying_const', 'leaf_area_index', 'water_source'])
            # Returns prob of class 1
            return float(self.irrigation_model.predict_proba(data)[0][1]) * 100 
        except Exception as e:
            logger.error(f"Irrigation predict error: {e}")
            return -1.0

# Singleton instance
global_ml_predictors = None
def get_ml_predictors() -> MLPredictors:
    global global_ml_predictors
    if global_ml_predictors is None:
        global_ml_predictors = MLPredictors()
    return global_ml_predictors
