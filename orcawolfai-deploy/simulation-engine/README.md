# OrcaWolf Edge Triage Simulation Engine
**Author:** John Wolf, MBA CIS — OrcaWolfAI  
**Module:** Combat Trauma / MASCAL Data Load Tester

## What This Is
This is the backend simulation engine for the OrcaWolf AI Mass Casualty Incident (MCI) triage system. It generates realistic FHIR R4 patient bundles, ingests them into a sovereign mesh data store, runs them through a Vertex AI vector embedding pipeline, and load-tests the AI gateway under field conditions.

## Components

### `fhir_mongo_loader.py`
Ingests Synthea-generated FHIR R4 bundles into a sovereign data store. Supports both local (Community Edition) and cloud (Atlas) targets. Routes each FHIR resource type to its own collection with upsert logic to prevent duplicates.

### `fhir_vector_pipeline.py`
Converts FHIR bundles into semantic text summaries and generates vector embeddings via Google Vertex AI (`text-embedding-004`). Powers the AI triage intelligence layer (L4 in the Sovereign Mesh stack).

### `locustfile.py`
Simulates combat medic field conditions — each "CombatMedicUser" submits random Synthea FHIR trauma payloads to the AI Gateway endpoint (`/api/encounter/triage`) every 1–5 seconds, mimicking real MASCAL chaos. Tracks success/failure rates in the Locust UI.

## How to Run Locally

```bash
# Install dependencies
pip install pymongo google-cloud-aiplatform vertexai locust

# Run FHIR ingestion
python fhir_mongo_loader.py

# Run vector pipeline
python fhir_vector_pipeline.py

# Run load test (from project root)
locust -f simulation-engine/locustfile.py --host=http://localhost:8000
```

## Integration with OrcaWolf AI Site
The live simulation UI at `/simulation` on orcawolfai.com runs a client-side triage engine. This backend engine is the production-grade counterpart — connecting the two is the next phase of development.
