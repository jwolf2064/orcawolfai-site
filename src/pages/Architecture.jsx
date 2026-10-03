import { useState, useEffect, useRef } from "react";
import ShieldIcon from "icon:shield-check";
import NetworkIcon from "icon:network";
import LockIcon from "icon:lock";
import ServerIcon from "icon:server";
import ChevronLeftIcon from "icon:chevron-left";
import ChevronRightIcon from "icon:chevron-right";
import LayersIcon from "icon:layers";
import ZapIcon from "icon:zap";

const LAYERS = [
  {
    id: "L0",
    label: "Physical / Cloud Substrate",
    shortLabel: "Infrastructure",
    color: "#94a3b8",
    glowColor: "rgba(148,163,184,0.15)",
    image: "/static/gen_arch-l0-physical-substrate-bb8701.webp",
    imageAlt: "3D visualization of GKE physical cloud substrate with confidential computing nodes and encrypted storage",
    tagline: "Where hardware becomes policy — the cryptographic anchor for every layer above.",
    desc: [
      "The foundation of the entire sovereign mesh begins at the physical and cloud infrastructure layer — where hardware meets policy. OrcaWolf AI runs on Google Kubernetes Engine (GKE) Autopilot clusters provisioned with Confidential Computing nodes, meaning the CPU itself encrypts data in use, not just at rest or in transit. Even the cloud provider cannot read workload memory.",
      "Every storage volume is encrypted using Customer-Managed Encryption Keys (CMEK) held in Cloud KMS, giving the organization — not Google — the authority to revoke access instantly. VPC Service Controls (VPC-SC) wrap the entire environment in a logical perimeter that prevents data exfiltration even if an identity is compromised inside the cluster.",
      "GKE Autopilot enforces node-level hardening automatically: no privileged containers, mandatory workload identity federation, and continuous CIS Benchmark compliance scanning. This means the infrastructure itself is pre-hardened before a single application workload is deployed.",
      "The cloud substrate is not trusted implicitly — it is verified. Every node in the cluster attests its integrity through Shielded VM measured boot, and the resulting attestation is fed into the SPIRE trust root at L2. The physical layer is the anchor; every higher layer derives its trustworthiness from what is established here.",
    ],
    items: ["GKE Autopilot", "Confidential VMs", "Cloud KMS (CMEK)", "VPC-SC perimeter", "Shielded VM boot", "Workload Identity Federation"],
    trustFlow: "Shielded boot attestation flows up → L2 SPIRE trust root",
  },
  {
    id: "L1",
    label: "Ambient Mesh / ztunnel",
    shortLabel: "Mesh Fabric",
    color: "#00e5ff",
    glowColor: "rgba(0,229,255,0.15)",
    image: "/static/gen_arch-l1-ambient-mesh-9949cb.webp",
    imageAlt: "3D visualization of Istio Ambient mesh ztunnel architecture with HBONE tunnels and waypoint proxies",
    tagline: "Zero-trust networking without sidecars — the mesh enforces mTLS on every packet at node level.",
    desc: [
      "Traditional service mesh architectures inject a sidecar proxy into every pod — adding latency, resource consumption, and operational complexity at scale. OrcaWolf AI adopts Istio Ambient Mesh, which eliminates sidecars entirely by moving L4 policy enforcement to a per-node ztunnel agent.",
      "The ztunnel runs as a DaemonSet — one instance per node — and handles all inter-pod communication using HBONE (HTTP-Based Overlay Network Encapsulation) tunneling. Every packet between pods traverses this encrypted tunnel, with mutual TLS (mTLS) enforced at the node level before any traffic reaches a workload. This means even if a pod is compromised, it cannot send or receive unauthenticated traffic.",
      "For services requiring L7 capabilities (HTTP routing, JWT validation, header mutation), Waypoint proxies are deployed per-namespace or per-service account. These are full Envoy instances, but deployed on-demand rather than universally — keeping the data plane lean where fine-grained L7 policy is not needed.",
      "L4 authorization policies are enforced directly by the ztunnel: connection-level rules based on workload identity (SPIFFE SVIDs from L2), source namespace, and destination port. The result is a zero-trust network fabric where the mesh — not the application — guarantees that all communication is authenticated, encrypted, and authorized.",
    ],
    items: ["ztunnel DaemonSet", "HBONE tunneling", "Waypoint proxies (on-demand)", "L4 mTLS enforcement", "Envoy-based L7 gateways", "Peer authorization policies"],
    trustFlow: "SVID identities from L2 drive every ztunnel policy decision",
  },
  {
    id: "L2",
    label: "Zero-Trust Identity Layer",
    shortLabel: "Identity",
    color: "#4fc3f7",
    glowColor: "rgba(79,195,247,0.15)",
    image: "/static/gen_arch-l2-zero-trust-identity-ce5a3b.webp",
    imageAlt: "3D visualization of SPIFFE SPIRE zero trust identity architecture with X.509 certificate chains",
    tagline: "Every workload gets a cryptographic passport — no static secrets, no long-lived credentials.",
    desc: [
      "Identity is the new perimeter. At L2, every workload — every pod, every service, every job — receives a cryptographically verifiable identity the moment it starts, and that identity expires within hours. There are no long-lived passwords, no static API keys, no service account JSON files.",
      "OrcaWolf AI uses SPIFFE (Secure Production Identity Framework For Everyone) implemented via SPIRE (SPIFFE Runtime Environment). SPIRE runs as a server cluster backed by Cloud KMS and attests each workload's identity through a combination of Kubernetes admission and node attestation plugins. Upon successful attestation, SPIRE issues an X.509 SVID (SPIFFE Verifiable Identity Document) — a short-lived certificate that is the workload's passport within the mesh.",
      'The SVID format encodes the SPIFFE URI (e.g., "spiffe://orcawolf.mesh/ns/ehr/sa/fhir-gateway") directly in the certificate\'s SAN field, allowing the ztunnel and Waypoint proxies at L1 to perform policy decisions without any external lookup. Certificate rotation is handled automatically by cert-manager, which is integrated with SPIRE\'s SVID TTL to renew before expiry — transparently, with zero downtime.',
      "Human operators authenticate via Workload Identity Federation, binding their Google Cloud identities to mesh RBAC roles through OIDC token exchange. This creates a unified identity plane where machine and human identities are governed by the same cryptographic trust root — and that root is held in the HSM-backed Cloud KMS at L0.",
    ],
    items: ["SPIFFE / SPIRE server cluster", "X.509 SVIDs (short-lived)", "cert-manager rotation", "Node & Kubernetes attestation", "Peer authentication policies", "Workload Identity Federation"],
    trustFlow: "SVIDs issued here are consumed by L1 ztunnel and L3 FHIR gateway",
  },
  {
    id: "L3",
    label: "EHR Interop + Data Sovereignty",
    shortLabel: "Health Data",
    color: "#6ee7b7",
    glowColor: "rgba(110,231,183,0.15)",
    image: "/static/gen_arch-l3-ehr-interop-2728c9.webp",
    imageAlt: "3D visualization of EHR interoperability with FHIR R4 gateway, HL7v2 bridge and data sovereignty pipeline",
    tagline: "PHI never moves in plaintext — FHIR R4, sovereign by design, HIPAA-auditable by default.",
    desc: [
      "This is the layer where healthcare data lives — and where sovereignty is most critical. OrcaWolf AI implements a FHIR R4 API gateway as the canonical interface for all Protected Health Information (PHI) exchange. Every FHIR request entering the mesh is validated against the requester's SPIFFE identity before routing begins, and every response is stamped with a tamper-evident provenance record.",
      "The HL7v2 bridge translates legacy HL7 v2.x messages — the workhorse of hospital ADT feeds, lab results, and pharmacy orders — into FHIR R4 resources in real time. This allows OrcaWolf AI to integrate with existing hospital information systems without requiring those systems to be replaced or upgraded. The bridge normalizes, validates, and maps fields according to US Core IG profiles before any data enters the sovereign mesh.",
      "PHI sovereignty is enforced through a combination of technical and policy controls: data residency is guaranteed by VPC-SC perimeters (L0), all data at rest uses CMEK (L0), and all transit uses mTLS (L1). Additionally, a data provenance ledger records every read, write, transform, and export event — each entry signed by the workload's SVID — creating an immutable audit chain that satisfies HIPAA audit requirements natively.",
      "The de-identification pipeline sits between the raw PHI tier and the AI inference layer (L4). Using the Cloud Healthcare API's de-identification engine, PHI is transformed into Safe Harbor or Expert Determination compliant datasets before exposure to any analytical or ML workload, ensuring the AI layer never touches identifiable patient data unless explicitly authorized by policy.",
    ],
    items: ["FHIR R4 API Gateway", "HL7v2 → FHIR bridge", "Data provenance ledger", "De-identification pipeline", "Cloud Healthcare API", "US Core IG profile validation"],
    trustFlow: "De-identified data streams up → L4 AI inference under SVID authorization",
  },
  {
    id: "L4",
    label: "Google AI Inference Layer",
    shortLabel: "AI Inference",
    color: "#fbbf24",
    glowColor: "rgba(251,191,36,0.15)",
    image: "/static/gen_arch-l4-ai-inference-28de2a.webp",
    imageAlt: "3D visualization of Google Vertex AI inference layer with BigQuery ML, Healthcare NLP and Gemini reasoning inside sovereign mesh",
    tagline: "Every model endpoint is mesh-native — SVID-authenticated, policy-gated, audit-logged.",
    desc: [
      "The AI inference layer is where clinical intelligence is generated — but unlike conventional AI integrations, every model endpoint in OrcaWolf AI is a mesh-native service. Requests to Vertex AI, BigQuery ML, and the Healthcare NLP API are routed through the mesh fabric, meaning they carry SPIFFE identity, are subject to L4 and L7 authorization policies, and are logged to the audit trail at L5.",
      "Vertex AI Workbench and Model Garden expose model endpoints that are wrapped in Waypoint proxies (L1), enforcing that only authorized workloads — identified by their SVID — can reach the model. This prevents unauthorized internal services from querying clinical AI models, a critical control in a HIPAA environment.",
      "BigQuery ML hosts the federated learning aggregation tier, where locally trained model updates from edge sites (hospital systems, clinic networks) are aggregated without the raw training data ever leaving its origin jurisdiction. Only encrypted gradient updates traverse the mesh — never patient records — satisfying both data sovereignty and privacy requirements simultaneously.",
      "The Healthcare NLP API processes clinical notes, discharge summaries, and radiology reports to extract structured entities (diagnoses, medications, procedures) and maps them to standard ontologies (SNOMED CT, RxNorm, ICD-10). These structured extractions flow back into the FHIR tier as derived resources, enriching the patient record without modifying the source-of-truth data.",
      "Gemini forms the highest-level reasoning tier: multi-modal clinical decision support that synthesizes FHIR resources, NLP extractions, and real-time sensor data into situational awareness outputs. In Mass Casualty Incident scenarios, Gemini's reasoning layer coordinates triage prioritization across the full patient population in real time.",
    ],
    items: ["Vertex AI (mesh-native endpoints)", "BigQuery ML (federated aggregation)", "Healthcare NLP API", "Gemini reasoning (multi-modal)", "SNOMED CT / RxNorm mapping", "Federated gradient exchange"],
    trustFlow: "All inference events emit telemetry → L5 audit trail automatically",
  },
  {
    id: "L5",
    label: "Observability + Audit",
    shortLabel: "Audit & Ops",
    color: "#a78bfa",
    glowColor: "rgba(167,139,250,0.15)",
    image: "/static/gen_arch-l5-observability-70b9fa.webp",
    imageAlt: "3D visualization of observability stack with Istio telemetry, Cloud Logging audit trail, Prometheus and Grafana dashboards",
    tagline: "Every mesh event is observable, attributable, and immutably recorded — HIPAA audit-ready.",
    desc: [
      "A sovereign mesh is only trustworthy if every action within it is observable, attributable, and immutably recorded. L5 provides the full observability and compliance fabric for OrcaWolf AI — from sub-millisecond latency metrics to long-term regulatory audit trails.",
      "Istio telemetry v2 emits per-request metrics, traces, and access logs automatically for all mesh traffic — without any application-level instrumentation. Every HTTP request, gRPC call, and TCP connection generates a span in the distributed trace, tagged with both the source and destination SPIFFE identities. This means the audit trail is built into the infrastructure, not the application code.",
      "Cloud Logging captures all control plane and data plane events with Write-Once semantics enforced by Cloud Logging's log bucket lock feature. Every FHIR resource access, every SPIRE attestation, every policy decision is written to an integrity-protected log that cannot be modified or deleted within the defined retention period — satisfying HIPAA's 6-year audit log retention requirement.",
      "Prometheus scrapes metrics from ztunnel, Waypoint proxies, SPIRE, the FHIR gateway, and all application components. Grafana provides operational dashboards covering mesh health (connection latency, mTLS handshake success rates, policy denial rates), application health (FHIR request throughput, error rates by resource type), and security posture (SVID expiry distribution, failed attestations, anomalous traffic patterns).",
      "The SIEM integration streams all security-relevant events — policy violations, attestation failures, anomalous access patterns, and de-identification errors — to a Security Information and Event Management system in real time. Correlation rules detect multi-stage attack patterns across the mesh and trigger automated response playbooks: workload isolation, SVID revocation, and incident escalation, all without human intervention in the critical path.",
    ],
    items: ["Istio telemetry v2 (auto-instrumented)", "Cloud Logging (write-once audit)", "Prometheus metrics collection", "Grafana operational dashboards", "SIEM real-time event streaming", "Automated incident response"],
    trustFlow: "Closes the loop — every layer's events converge here for full-stack visibility",
  },
];

function WalkthroughMode({ onExit }) {
  const [active, setActive] = useState(0);
  const [animDir, setAnimDir] = useState("right");
  const [visible, setVisible] = useState(true);
  const layer = LAYERS[active];

  const go = (next) => {
    if (next === active) return;
    setAnimDir(next > active ? "right" : "left");
    setVisible(false);
    setTimeout(() => {
      setActive(next);
      setVisible(true);
    }, 280);
  };

  const prev = () => go(Math.max(0, active - 1));
  const next = () => go(Math.min(LAYERS.length - 1, active + 1));

  return (
    <div className="min-h-screen pt-24 pb-20 px-4" style={{ background: "#050a0f" }}>
      <div className="max-w-5xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-sm font-mono text-slate-400 hover:text-white transition-colors duration-150 px-3 py-2 rounded-lg border border-slate-700/50 hover:border-slate-500/50"
          >
            <LayersIcon className="w-4 h-4" aria-hidden="true" />
            All Layers
          </button>
          <div className="flex items-center gap-1" role="tablist" aria-label="Architecture layers">
            {LAYERS.map((l, i) => (
              <button
                key={l.id}
                role="tab"
                aria-selected={i === active}
                aria-label={`${l.id}: ${l.label}`}
                onClick={() => go(i)}
                className="relative px-2 py-1 rounded font-mono text-xs transition-all duration-200"
                style={{
                  color: i === active ? l.color : "#64748b",
                  background: i === active ? `${l.color}12` : "transparent",
                  border: `1px solid ${i === active ? l.color + "40" : "transparent"}`,
                }}
              >
                {l.id}
              </button>
            ))}
          </div>
          <div className="text-xs font-mono text-slate-500" aria-live="polite">
            {active + 1} / {LAYERS.length}
          </div>
        </div>

        {/* Main panel */}
        <div
          className="transition-all duration-280"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateX(0)"
              : animDir === "right"
              ? "translateX(-32px)"
              : "translateX(32px)",
          }}
          aria-live="polite"
        >
          {/* Layer ID + title */}
          <div className="flex items-start gap-5 mb-8">
            <div
              className="shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xl"
              style={{
                background: `${layer.color}12`,
                color: layer.color,
                border: `2px solid ${layer.color}40`,
                boxShadow: `0 0 40px ${layer.color}20`,
              }}
            >
              <span className="text-xs opacity-60 font-normal">layer</span>
              {layer.id}
            </div>
            <div className="flex-1 pt-1">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2 leading-tight">
                {layer.label}
              </h2>
              <p className="font-mono text-sm leading-relaxed" style={{ color: layer.color }}>
                {layer.tagline}
              </p>
            </div>
          </div>

          {/* Image */}
          <div
            className="rounded-2xl overflow-hidden border mb-8"
            style={{ borderColor: `${layer.color}30`, boxShadow: `0 0 60px ${layer.color}10` }}
          >
            <img
              src={layer.image}
              alt={layer.imageAlt}
              className="w-full object-cover"
              style={{ maxHeight: "420px" }}
              loading="eager"
            />
            <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: `${layer.color}08` }}>
              <span className="text-xs font-mono" style={{ color: `${layer.color}80` }}>
                {layer.id} — Architecture Visualization
              </span>
              <ZapIcon className="w-3 h-3" style={{ color: `${layer.color}60` }} aria-hidden="true" />
            </div>
          </div>

          {/* Description paragraphs */}
          <div
            className="rounded-2xl border p-6 sm:p-8 mb-8"
            style={{ borderColor: `${layer.color}18`, background: "linear-gradient(135deg, #070e18 0%, #050a0f 100%)" }}
          >
            <div className="space-y-4">
              {layer.desc.map((para, pi) => (
                <p key={pi} className="text-slate-300 leading-relaxed text-base">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Trust flow banner */}
          <div
            className="rounded-xl border px-5 py-3 mb-8 flex items-center gap-3"
            style={{ borderColor: `${layer.color}25`, background: `${layer.color}08` }}
          >
            <div
              className="shrink-0 w-2 h-2 rounded-full animate-pulse"
              style={{ background: layer.color }}
              aria-hidden="true"
            />
            <p className="text-sm font-mono" style={{ color: `${layer.color}cc` }}>
              {layer.trustFlow}
            </p>
          </div>

          {/* Component tags */}
          <div className="flex flex-wrap gap-2 mb-10" role="list" aria-label={`${layer.id} components`}>
            {layer.items.map((item) => (
              <span
                key={item}
                role="listitem"
                className="px-3 py-1.5 rounded-full text-xs font-mono"
                style={{
                  background: `${layer.color}10`,
                  color: layer.color,
                  border: `1px solid ${layer.color}30`,
                }}
              >
                {item}
              </span>
            ))}
          </div>

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={active === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border"
              style={{
                color: active > 0 ? LAYERS[active - 1].color : "#64748b",
                borderColor: active > 0 ? `${LAYERS[active - 1].color}30` : "#1e293b",
                background: active > 0 ? `${LAYERS[active - 1].color}08` : "transparent",
              }}
              aria-label="Previous layer"
            >
              <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
              {active > 0 ? LAYERS[active - 1].id : ""}
            </button>

            {/* Mini stack indicator */}
            <div className="flex items-end gap-1 h-8" aria-hidden="true">
              {LAYERS.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => go(i)}
                  className="w-2 rounded-full transition-all duration-300"
                  style={{
                    height: i === active ? "32px" : "12px",
                    background: i === active ? l.color : `${l.color}30`,
                  }}
                  aria-label={`Go to ${l.id}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={active === LAYERS.length - 1}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border"
              style={{
                color: active < LAYERS.length - 1 ? LAYERS[active + 1].color : "#64748b",
                borderColor: active < LAYERS.length - 1 ? `${LAYERS[active + 1].color}30` : "#1e293b",
                background: active < LAYERS.length - 1 ? `${LAYERS[active + 1].color}08` : "transparent",
              }}
              aria-label="Next layer"
            >
              {active < LAYERS.length - 1 ? LAYERS[active + 1].id : ""}
              <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Architecture() {
  const [walkthrough, setWalkthrough] = useState(false);

  if (walkthrough) {
    return <WalkthroughMode onExit={() => setWalkthrough(false)} />;
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 mesh-bg">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 text-xs font-mono mb-6">
            <NetworkIcon className="w-3 h-3" aria-hidden="true" />
            Sovereign EHR Mesh Architecture
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            The <span className="text-cyan-400">Mesh</span> Stack
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Six layers of cryptographic trust, from bare metal to AI inference —
            each enforced by the mesh, none relying on network perimeter alone.
          </p>

          {/* Walkthrough CTA */}
          <button
            onClick={() => setWalkthrough(true)}
            className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl font-mono text-sm font-semibold transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #00e5ff18, #4fc3f710)",
              border: "1px solid #00e5ff40",
              color: "#00e5ff",
              boxShadow: "0 0 30px rgba(0,229,255,0.12)",
            }}
          >
            <ZapIcon className="w-4 h-4" aria-hidden="true" />
            Start Layer-by-Layer Walkthrough
            <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Layer overview strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-20" role="list" aria-label="Layer overview">
          {LAYERS.map((layer, i) => (
            <button
              key={layer.id}
              role="listitem"
              onClick={() => setWalkthrough(true)}
              className="group rounded-xl p-3 border text-left transition-all duration-200 hover:scale-105"
              style={{
                borderColor: `${layer.color}25`,
                background: `${layer.color}08`,
              }}
              aria-label={`Open walkthrough at ${layer.id}: ${layer.label}`}
            >
              <div className="font-mono text-xs font-bold mb-1" style={{ color: layer.color }}>
                {layer.id}
              </div>
              <div className="text-white text-xs font-semibold leading-snug mb-1">{layer.shortLabel}</div>
              <div
                className="h-0.5 rounded-full w-8 group-hover:w-full transition-all duration-300"
                style={{ background: layer.color }}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        {/* Full layer stack */}
        <div className="space-y-20" aria-label="Architecture layers">
          {LAYERS.map((layer, i) => (
            <article
              key={layer.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {/* Layer header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center font-mono text-base font-bold"
                  style={{
                    background: `${layer.color}15`,
                    color: layer.color,
                    border: `1px solid ${layer.color}40`,
                    boxShadow: `0 0 20px ${layer.color}15`,
                  }}
                  aria-label={`Layer ${layer.id}`}
                >
                  {layer.id}
                </div>
                <div className="flex-1">
                  <h2 className="text-white font-display font-bold text-2xl sm:text-3xl leading-tight">
                    {layer.label}
                  </h2>
                  <p className="font-mono text-xs mt-1" style={{ color: `${layer.color}99` }}>
                    {layer.tagline}
                  </p>
                  <div
                    className="h-0.5 mt-2 rounded-full w-24"
                    style={{ background: `linear-gradient(90deg, ${layer.color}, transparent)` }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Description */}
              <div
                className="rounded-2xl border p-6 sm:p-8 mb-6"
                style={{
                  borderColor: `${layer.color}20`,
                  background: `linear-gradient(135deg, #070e18 0%, #050a0f 100%)`,
                }}
              >
                <div className="space-y-4">
                  {layer.desc.map((para, pi) => (
                    <p key={pi} className="text-slate-300 leading-relaxed text-base">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* 3D Architecture Image */}
              <div
                className="rounded-2xl overflow-hidden border mb-6"
                style={{ borderColor: `${layer.color}25` }}
              >
                <img
                  src={layer.image}
                  alt={layer.imageAlt}
                  className="w-full object-cover"
                  style={{ maxHeight: "480px" }}
                  loading="lazy"
                />
                <div
                  className="px-4 py-2 text-center"
                  style={{ background: `${layer.color}08` }}
                >
                  <span className="text-xs font-mono" style={{ color: `${layer.color}99` }}>
                    {layer.id} — {layer.label} / Architecture Visualization
                  </span>
                </div>
              </div>

              {/* Trust flow */}
              <div
                className="rounded-xl border px-4 py-2.5 mb-5 flex items-center gap-2.5"
                style={{ borderColor: `${layer.color}20`, background: `${layer.color}06` }}
              >
                <div
                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ background: layer.color }}
                  aria-hidden="true"
                />
                <p className="text-xs font-mono" style={{ color: `${layer.color}aa` }}>
                  {layer.trustFlow}
                </p>
              </div>

              {/* Component tags */}
              <div className="flex flex-wrap gap-2" role="list" aria-label={`${layer.id} components`}>
                {layer.items.map((item) => (
                  <span
                    key={item}
                    role="listitem"
                    className="px-3 py-1.5 rounded-full text-xs font-mono"
                    style={{
                      background: `${layer.color}10`,
                      color: layer.color,
                      border: `1px solid ${layer.color}30`,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              {i < LAYERS.length - 1 && (
                <div
                  className="mt-16 h-px w-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${layer.color}20, transparent)` }}
                  aria-hidden="true"
                />
              )}
            </article>
          ))}
        </div>

        {/* Key principles */}
        <section className="mt-24" aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="font-display text-3xl font-bold text-white text-center mb-10">
            Design <span className="text-cyan-400">Principles</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldIcon,
                title: "Never-trust, always-verify",
                body: "Every workload presents cryptographic proof of identity on every request. Position in the network grants nothing.",
                color: "#00e5ff",
              },
              {
                icon: LockIcon,
                title: "Data stays sovereign",
                body: "PHI never crosses jurisdiction boundaries in plaintext. The mesh policy is the enforcement point — not firewall rules.",
                color: "#6ee7b7",
              },
              {
                icon: ServerIcon,
                title: "Sidecar-free operations",
                body: "Istio Ambient eliminates per-pod proxies. Policy is enforced at the node, reducing blast radius and resource overhead.",
                color: "#a78bfa",
              },
            ].map(({ icon: Icon, title, body, color }) => (
              <div
                key={title}
                className="rounded-xl p-6 border"
                style={{
                  borderColor: `${color}20`,
                  background: `linear-gradient(135deg, #0a1628 0%, #070e18 100%)`,
                }}
              >
                <Icon className="w-7 h-7 mb-4" style={{ color }} aria-hidden="true" />
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom walkthrough CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={() => setWalkthrough(true)}
            className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl font-mono text-sm font-semibold transition-all duration-200 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #00e5ff18, #4fc3f710)",
              border: "1px solid #00e5ff40",
              color: "#00e5ff",
              boxShadow: "0 0 30px rgba(0,229,255,0.12)",
            }}
          >
            <ZapIcon className="w-4 h-4" aria-hidden="true" />
            Explore the Stack Layer by Layer
            <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
