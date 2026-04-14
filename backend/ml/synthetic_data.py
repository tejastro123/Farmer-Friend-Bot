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
        'temp_c': np.random.uniform(15.0, 40.0, samples)
    })
    
    # High humidity + high temp = high risk (1)
    def calc_risk(row):
        score = (row['humidity_pct'] * 0.7) + (row['temp_c'] * 1.5)
        # Shift probability
        prob = score / 150.0 
        return 1 if (prob + np.random.uniform(-0.2, 0.2)) > 0.6 else 0
        
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
