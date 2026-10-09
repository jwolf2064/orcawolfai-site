import os
import json
import random
from locust import HttpUser, task, between
# 08/02/2026 - John Wolf, MBA CIS, OrcaWolfAI 
# 1. Load all FHIR bundles into memory when the script starts
PAYLOAD_DIR = "sample_fhir_payloads"
fhir_payloads = []

print(f"Loading Synthea FHIR payloads from {PAYLOAD_DIR}...")
for filename in os.listdir(PAYLOAD_DIR):
    if filename.endswith(".json"):
        with open(os.path.join(PAYLOAD_DIR, filename), "r", encoding="utf-8") as f:
            fhir_payloads.append(json.load(f))
            
print(f"Successfully loaded {len(fhir_payloads)} trauma records.")

# 2. Define the Simulated User (Combat Medic)
class CombatMedicUser(HttpUser):
    # Simulate the chaos of the field: medics submit a record every 1 to 5 seconds
    wait_time = between(1, 5) 

    @task
    def submit_casualty(self):
        if not fhir_payloads:
            return
        
        # Pick a random trauma payload from our Synthea batch
        payload = random.choice(fhir_payloads)
        
        # Send a POST request to our local FastAPI AI Gateway (which we will build next)
        # Note: We group the requests in Locust UI under "/api/encounter/triage"
        with self.client.post("/api/encounter/triage", json=payload, name="/api/encounter/triage", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed! AI Gateway returned: {response.status_code}")