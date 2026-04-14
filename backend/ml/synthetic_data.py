"""
backend/ml/synthetic_data.py
============================
Generates synthetic data for Yield, Disease, and Market Price models.
"""
import pandas as pd
import numpy as np

def generate_yield_data(samples: int = 2000) -> pd.DataFrame:
    np.random.seed(42)
    crops = ['wheat', 'rice', 'tomato', 'onion', 'cotton']
    soils = ['black', 'red', 'alluvial', 'laterite']
    
    data = {
        'crop': np.random.choice(crops, samples),
        'soil_type': np.random.choice(soils, samples),
        'area_acres': np.random.uniform(1.0, 50.0, samples),
        'avg_temp_c': np.random.uniform(15.0, 40.0, samples),
        'rainfall_mm': np.random.uniform(50.0, 1000.0, samples)
    }
    df = pd.DataFrame(data)
    
    # Base yield per acre logic (metric tons)
    base_yield = {'wheat': 1.5, 'rice': 2.0, 'tomato': 10.0, 'onion': 8.0, 'cotton': 0.8}
    
    def calc_yield(row):
        base = base_yield[row['crop']]
        # Simple multipliers
        soil_mult = 1.2 if row['soil_type'] in ['black', 'alluvial'] else 0.9
        temp_mult = 1.0 - (abs(row['avg_temp_c'] - 25.0) / 100.0)
        rain_mult = 1.0 + (row['rainfall_mm'] / 2000.0)
        return row['area_acres'] * base * soil_mult * temp_mult * rain_mult * np.random.uniform(0.9, 1.1)
        
    df['yield_tons'] = df.apply(calc_yield, axis=1)
    return df

def generate_disease_data(samples: int = 2000) -> pd.DataFrame:
    np.random.seed(101)
    crops = ['wheat', 'rice', 'tomato', 'onion', 'cotton']
    
    df = pd.DataFrame({
        'crop': np.random.choice(crops, samples),
        'humidity_pct': np.random.uniform(30.0, 95.0, samples),
        'temp_c': np.random.uniform(15.0, 42.0, samples),
        'wind_speed_kph': np.random.uniform(0.0, 50.0, samples),
        'soil_moisture': np.random.uniform(10.0, 80.0, samples),
        'ndvi_index': np.random.uniform(0.2, 0.9, samples),
        'historical_pressure': np.random.uniform(0.0, 1.0, samples),
        'leaf_wetness_hrs': np.random.uniform(0.0, 14.0, samples),
        'last_24h_rainfall': np.random.uniform(0.0, 50.0, samples)
    })
    
    # Complex Risk Logic
    def calc_risk(row):
        # Fungal risk (High humidity + leaf wetness)
        fungal_score = (row['humidity_pct'] / 100.0) * 0.4 + (row['leaf_wetness_hrs'] / 14.0) * 0.4
        
        # Pest dispersal (High wind + Historical pressure)
        pest_score = (row['wind_speed_kph'] / 50.0) * 0.3 + (row['historical_pressure']) * 0.5
        
        # Plant stress (Low NDVI + Extreme temps)
        stress_score = (1.0 - row['ndvi_index']) * 0.4 + (abs(row['temp_c'] - 28) / 20.0) * 0.2
        
        total_score = fungal_score + pest_score + stress_score
        
        # Add random variance and threshold
        final_prob = total_score / 2.0 # Normalize roughly to 0-1
        return 1 if (final_prob + np.random.uniform(-0.15, 0.15)) > 0.55 else 0
        
    df['disease_outbreak'] = df.apply(calc_risk, axis=1)
    return df

def generate_market_data(samples: int = 2000) -> pd.DataFrame:
    np.random.seed(99)
    crops = ['wheat', 'rice', 'tomato', 'onion', 'cotton']
    months = list(range(1, 13))
    
    df = pd.DataFrame({
        'crop': np.random.choice(crops, samples),
        'month': np.random.choice(months, samples),
        'demand_index': np.random.uniform(0.5, 1.5, samples)
    })
    
    base_price = {'wheat': 2200, 'rice': 2500, 'tomato': 1200, 'onion': 1500, 'cotton': 5500}
    
    def price(row):
        b = base_price[row['crop']]
        # Seasonal peak variation 
        seasonal_mult = 1.0 + np.sin(row['month'] * (2 * np.pi / 12)) * 0.2
        return b * row['demand_index'] * seasonal_mult * np.random.uniform(0.95, 1.05)
        
    df['price_inr_quintal'] = df.apply(price, axis=1)
    return df

def generate_irrigation_data(samples: int = 2000) -> pd.DataFrame:
    np.random.seed(42)
    crops = ['wheat', 'rice', 'tomato', 'onion', 'cotton']
    
    df = pd.DataFrame({
        'crop': np.random.choice(crops, samples),
        'soil_moisture': np.random.uniform(5.0, 60.0, samples),
        'temp_c': np.random.uniform(15.0, 45.0, samples),
        'humidity_pct': np.random.uniform(20.0, 90.0, samples),
        'wind_speed_kph': np.random.uniform(0.0, 40.0, samples),
        'solar_intensity': np.random.uniform(0.1, 1.0, samples),
        'water_availability': np.random.uniform(0.0, 1.0, samples),
        'crop_age_days': np.random.randint(1, 150, samples),
        'rainfall_forecast_mm': np.random.uniform(0.0, 50.0, samples),
        'soil_type_drying_const': np.random.uniform(0.5, 1.5, samples),
        'leaf_area_index': np.random.uniform(0.5, 5.0, samples),
        'water_source': np.random.choice(['canal', 'tubewell', 'pond'], samples)
    })
    
    def calc_need(row):
        # Evapotranspiration proxy
        et_proxy = (row['temp_c'] * 0.4 + row['solar_intensity'] * 5.0 + row['wind_speed_kph'] * 0.2) / (row['humidity_pct'] / 10.0 + 1)
        
        # Net moisture balance
        moisture_loss = et_proxy * row['soil_type_drying_const'] * (row['leaf_area_index'] / 2.0)
        net_balance = row['soil_moisture'] - moisture_loss + (row['rainfall_forecast_mm'] * 0.8)
        
        # Source-specific constraints on willingness to irrigate
        # Tubewell is expensive, so threshold might be lower unless critical.
        # Canal is cheap but maybe less reliable.
        threshold = 25.0
        if row['water_source'] == 'tubewell':
            threshold = 20.0 # Wait longer due to cost
        elif row['water_source'] == 'canal':
            threshold = 30.0 # Better to water early if canal water is available
            
        if 40 < row['crop_age_days'] < 80: # Flowering/mid-stage spike
            threshold += 10.0
            
        needs_water = 1 if (net_balance < threshold and row['water_availability'] > 0.1) else 0
        return needs_water

    df['irrigation_needed'] = df.apply(calc_need, axis=1)
    return df
