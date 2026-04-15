import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from backend.rag.knowledge_graph import get_knowledge_graph

def seed_expert_knowledge():
    kg = get_knowledge_graph()
    print("Seeding Advanced Knowledge Graph (10+ Domains)...")

    # 1. Crop -> Disease
    diseases = [
        ("Rice", "CAN_BE_AFFECTED_BY", "Rice Blast"),
        ("Wheat", "CAN_BE_AFFECTED_BY", "Yellow Rust"),
        ("Tomato", "CAN_BE_AFFECTED_BY", "Early Blight"),
        ("Cotton", "CAN_BE_AFFECTED_BY", "Pink Bollworm"),
        ("Potato", "CAN_BE_AFFECTED_BY", "Late Blight")
    ]
    
    # 2. Disease -> Treatment
    treatments = [
        ("Rice Blast", "TREATED_WITH", "Tricyclazole"),
        ("Yellow Rust", "TREATED_WITH", "Propiconazole"),
        ("Early Blight", "TREATED_WITH", "Mancozeb"),
        ("Pink Bollworm", "TREATED_WITH", "Indoxacarb"),
        ("Late Blight", "TREATED_WITH", "Metalaxyl")
    ]

    # 3. Soil -> Nutrient Profile
    soil_nutrients = [
        ("Clay Soil", "NATURALLY_HIGH_IN", "Potassium"),
        ("Sandy Soil", "NATURALLY_LOW_IN", "Nitrogen"),
        ("Loamy Soil", "IDEAL_FOR", "Phosphorus Retention"),
        ("Black Soil", "KNOWN_FOR", "High Lime Content"),
        ("Red Soil", "DEFICIENT_IN", "Magnesium")
    ]

    # 4. Nutrient -> Fertilizer Match
    fertilizers = [
        ("Nitrogen", "SUPPLIED_BY", "Urea"),
        ("Phosphorus", "SUPPLIED_BY", "DAP (Diammonium Phosphate)"),
        ("Potassium", "SUPPLIED_BY", "MOP (Muriate of Potash)"),
        ("Sulfur", "SUPPLIED_BY", "Bentonite Sulfur"),
        ("Zinc", "SUPPLIED_BY", "Zinc Sulfate")
    ]

    # 5. Crop -> Growing Stages
    stages = [
        ("Rice", "HAS_STAGE", "Nursery"),
        ("Rice", "HAS_STAGE", "Tillering"),
        ("Rice", "HAS_STAGE", "Panicle Initiation"),
        ("Wheat", "HAS_STAGE", "CRI (Crown Root Initiation)"),
        ("Wheat", "HAS_STAGE", "Flowering")
    ]

    # 6. Stage -> Water Scaling
    water_needs = [
        ("Tillering", "REQUIRES", "Continuous Standing Water"),
        ("Flowering", "CRITICAL_FOR", "Adequate Soil Moisture"),
        ("CRI", "SENSITIVE_TO", "Water Stress"),
        ("Nursery", "REQUIRES", "Light Sprinkling"),
        ("Maturation", "REQUIRES", "Reduced Watering")
    ]

    # 7. Pest -> Symptoms
    symptoms = [
        ("Aphids", "CAUSES", "Leaf Curling"),
        ("Whiteflies", "CAUSES", "Sooty Mold"),
        ("Bollworm", "CAUSES", "Square Dropping"),
        ("Thrips", "CAUSES", "Silvery Scars"),
        ("Mites", "CAUSES", "Yellow Speckling")
    ]

    # 8. Pest -> Natural Predator
    predators = [
        ("Aphids", "PREYED_UPON_BY", "Ladybugs"),
        ("Thrips", "PREYED_UPON_BY", "Minute Pirate Bugs"),
        ("Mites", "PREYED_UPON_BY", "Phytoseiid Mites"),
        ("Whiteflies", "PREYED_UPON_BY", "Encarsia formosa"),
        ("Caterpillars", "PREYED_UPON_BY", "Braconid Wasps")
    ]

    # 9. Climate Zone -> Best Crop
    climate = [
        ("Arid Zone", "SUITABLE_FOR", "Bajra (Pearl Millet)"),
        ("Arid Zone", "SUITABLE_FOR", "Guar"),
        ("Tropical Zone", "SUITABLE_FOR", "Sugarcane"),
        ("Tropical Zone", "SUITABLE_FOR", "Banana"),
        ("Temperate Zone", "SUITABLE_FOR", "Apples")
    ]

    # 10. Fertilizer -> pH Impact
    ph_impact = [
        ("Urea", "HAS_EFFECT", "Soil Acidification"),
        ("Ammonium Sulfate", "HAS_EFFECT", "Strong Acidification"),
        ("Calcium Nitrate", "HAS_EFFECT", "Alkalizing"),
        ("Rock Phosphate", "REQUIRES", "Acidic Soil for Solubility"),
        ("Lime", "USED_TO", "Increase pH")
    ]

    all_triplets = diseases + treatments + soil_nutrients + fertilizers + stages + water_needs + symptoms + predators + climate + ph_impact

    for sub, pred, obj in all_triplets:
        kg.add_triplet(sub, pred, obj)

    kg.save()
    print(f"Successfully seeded {len(all_triplets)} expert triplets across 10 domains.")

if __name__ == "__main__":
    seed_expert_knowledge()
