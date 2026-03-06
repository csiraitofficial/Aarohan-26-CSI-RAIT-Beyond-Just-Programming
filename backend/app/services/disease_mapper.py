"""
MediScan AI Disease Mapper — 50-class chest disease classification labels.
Ported from the MediScan AI project's trained EfficientNetV2 model.
"""

DISEASE_MAP = {
    0: "Pneumonia",
    1: "Tuberculosis",
    2: "Lung Cancer",
    3: "COVID-19",
    4: "Atelectasis",
    5: "Cardiomegaly",
    6: "Pulmonary Fibrosis",
    7: "Pleural Effusion",
    8: "Emphysema",
    9: "Bronchitis",
    10: "Asthma",
    11: "Interstitial Lung Disease",
    12: "Pneumothorax",
    13: "Hypertension-Related Changes",
    14: "Pulmonary Edema",
    15: "Pulmonary Embolism",
    16: "Sarcoidosis",
    17: "COPD",
    18: "Lung Abscess",
    19: "Lung Nodule",
    20: "Lung Mass",
    21: "Mediastinal Widening",
    22: "Bronchiectasis",
    23: "Rib Fracture",
    24: "Chest Wall Abnormality",
    25: "Hemothorax",
    26: "Chylothorax",
    27: "ARDS",
    28: "Silicosis",
    29: "Asbestosis",
    30: "Berylliosis",
    31: "Pneumoconiosis",
    32: "Hyperinflation",
    33: "Hypoventilation",
    34: "COVID Post Effects",
    35: "Scoliosis",
    36: "Kyphosis",
    37: "Tracheal Deviation",
    38: "Diaphragm Elevation",
    39: "Diaphragm Flattening",
    40: "Bronchopneumonia",
    41: "Hilar Enlargement",
    42: "Lymphadenopathy",
    43: "Consolidation",
    44: "Ground Glass Opacity",
    45: "Reticular Pattern",
    46: "Nodular Pattern",
    47: "Upper Lobe Opacity",
    48: "Lower Lobe Opacity",
    49: "Normal",
}

# Critical diseases that need immediate medical attention
CRITICAL_DISEASES = {
    "Lung Cancer", "Pulmonary Embolism", "ARDS", "Pneumothorax",
    "Hemothorax", "Pulmonary Edema",
}

# Severity levels for each disease category
DISEASE_SEVERITY = {
    "Normal": "none",
    "Asthma": "moderate",
    "Bronchitis": "moderate",
    "Pneumonia": "high",
    "Tuberculosis": "high",
    "Lung Cancer": "critical",
    "COVID-19": "high",
    "COPD": "high",
    "Pulmonary Edema": "critical",
    "Pneumothorax": "critical",
    "ARDS": "critical",
    "Pulmonary Embolism": "critical",
    "Hemothorax": "critical",
}


def get_disease_name(index: int) -> str:
    """Get disease name from class index."""
    return DISEASE_MAP.get(index, "Unknown Disease")


def get_disease_severity(disease_name: str) -> str:
    """Get severity level for a disease. Defaults to 'moderate'."""
    return DISEASE_SEVERITY.get(disease_name, "moderate")


def is_critical(disease_name: str) -> bool:
    """Check if a disease requires immediate medical attention."""
    return disease_name in CRITICAL_DISEASES
