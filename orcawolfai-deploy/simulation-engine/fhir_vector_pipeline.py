import os
import json
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel
import numpy as np

# Initialize Vertex AI Environment Variables
os.environ["GOOGLE_CLOUD_PROJECT"] = "your-gcp-project-id"
aiplatform.init(project=os.environ["GOOGLE_CLOUD_PROJECT"], location="us-central1")

def fhir_to_semantic_string(fhir_bundle_path):
    with open(fhir_bundle_path, 'r') as f:
        bundle = json.load(f)
        
    patient_info = ""
    conditions = []
    medications = []
    
    for entry in bundle.get('entry', []):
        resource = entry.get('resource', {})
        resource_type = resource.get('resourceType')
        
        if resource_type == 'Patient':
            name = resource.get('name', [{}])[0]
            given = " ".join(name.get('given', []))
            family = name.get('family', '')
            gender = resource.get('gender', 'unknown')
            birth_date = resource.get('birthDate', 'unknown')
            patient_info = f"Patient: {given} {family}, a {gender} born on {birth_date}."
            
        elif resource_type == 'Condition':
            code_text = resource.get('code', {}).get('text', '')
            onset = resource.get('onsetDateTime', 'unknown onset')
            if code_text:
                conditions.append(f"{code_text} (diagnosed: {onset})")
                
        elif resource_type == 'MedicationRequest':
            med_text = resource.get('medicationCodeableConcept', {}).get('text', '')
            status = resource.get('status', 'unknown status')
            if med_text:
                medications.append(f"{med_text} (Status: {status})")

    summary = f"{patient_info} "
    if conditions:
        summary += "Conditions: " + "; ".join(conditions) + ". "
    if medications:
        summary += "Medications: " + "; ".join(medications) + "."
        
    return summary

def generate_vertex_embedding(text_content):
    model = TextEmbeddingModel.from_pretrained("text-embedding-004")
    embeddings = model.get_embeddings([text_content])
    return embeddings[0].values

if __name__ == "__main__":
    print("FHIR Parsing and Vector Pipeline Engine initialized.")
