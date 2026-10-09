import os
import json
from pymongo import MongoClient

# Connection Strings
# Local Community Edition
LOCAL_MONGO_URI = "mongodb://localhost:27017/"
# Atlas Cloud Cluster (Replace with your actual Atlas connection string)
ATLAS_MONGO_URI = "mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority"

# Connect to the target database (Choose LOCAL or ATLAS here)
client = MongoClient(LOCAL_MONGO_URI)
db = client["fhir_v4"]

PAYLOAD_DIR = "load-engine/sample_fhir_payloads"

def process_fhir_bundle(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        bundle = json.load(f)
        
    if bundle.get("resourceType") != "Bundle":
        print(f"Skipping {filepath} - Not a FHIR Bundle.")
        return

    # Unpack the bundle and route each resource to its specific collection
    entries = bundle.get("entry", [])
    for entry in entries:
        resource = entry.get("resource")
        if not resource:
            continue
            
        resource_type = resource.get("resourceType")
        
        # MongoDB uses _id as the primary key. We map the FHIR 'id' to MongoDB '_id'
        # to prevent duplicates if we run the script twice.
        if "id" in resource:
            resource["_id"] = resource["id"]
            
        # Insert or Update (Upsert) the resource into its specific collection
        db[resource_type].update_one(
            {"_id": resource.get("_id")},
            {"$set": resource},
            upsert=True
        )

print("Starting FHIR Ingestion...")
for filename in os.listdir(PAYLOAD_DIR):
    if filename.endswith(".json"):
        print(f"Ingesting: {filename}")
        process_fhir_bundle(os.path.join(PAYLOAD_DIR, filename))

print("✅ Ingestion Complete!")
