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

from backend.ml.synthetic_data import generate_yield_data, generate_disease_data, generate_market_data

logger = logging.getLogger(__name__)

class MLPredictors:
    def __init__(self):
        self.yield_model = None
        self.disease_model = None
        self.price_model = None
        
        # Encoders for categorical string inputs
        self.crop_le = LabelEncoder()
        self.soil_le = LabelEncoder()
        
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
            
            X_d = df_disease[['crop', 'humidity_pct', 'temp_c']]
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

    def predict_disease_risk(self, crop: str, humidity_pct: float, temp_c: float) -> float:
        """Predict probability (%) of pest/disease outbreak."""
        try:
            c = self.crop_le.transform([crop.lower()])[0]
            data = pd.DataFrame([[c, humidity_pct, temp_c]], columns=['crop', 'humidity_pct', 'temp_c'])
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

# Singleton instance
global_ml_predictors = None
def get_ml_predictors() -> MLPredictors:
    global global_ml_predictors
    if global_ml_predictors is None:
        global_ml_predictors = MLPredictors()
    return global_ml_predictors
