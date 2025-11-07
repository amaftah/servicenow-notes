import React, { useMemo, useState } from "react";

type Provider = "offline" | "libre";

// Minimal EN→FR glossary for offline fallback
const GLOSSARY: Record<string, string> = {
  incident: "incident",
  outage: "panne",
  degraded: "dégradée",
  performance: "performance",
  user: "utilisateur",
  users: "utilisateurs",
  customer: "client",
  customers: "clients",
  error: "erreur",
  failure: "défaillance",
  login: "connexion",
  authentication: "authentification",
  authorization: "autorisation",
  payment: "paiement",
  database: "base de données",
  server: "serveur",
  network: "réseau",
  latency: "latence",
  timeout: "dépassement de délai",
  retry: "réessai",
  restarted: "redémarré",
  restart: "redémarrer",
  cache: "cache",
  cleared: "vidé",
  escalated: "escaladé",
  escalation: "escalade",
  root: "racine",
  cause: "cause",
  suspected: "suspectée",
  temporary: "temporaire",
  workaround: "solution de contournement",
  fix: "correctif",
  deployed: "déployé",
  monitoring: "surveillance",
  logs: "journaux",
  alert: "alerte",
  alerts: "alertes",
  region: "région",
  europe: "Europe",
  us: "États-Unis",
  production: "production",
  staging: "pré-production",
  severity: "sévérité",
  high: "élevée",
  medium: "moyenne",
  low: "faible"
};

function simpleTranslate(text: string): string {
  const replaced = text
    .replace(/\b([A-Za-z']+)\b/g, (m) => GLOSSARY[m.toLowerCase()] ?? m)
    .replace(/\bETA\b/g, "ETA")
    .replace(/\bSLA\b/g, "SLA");
  return `⟦Brouillon – traduction approximative⟧ ${replaced}`;
}

async function libreTranslate(text: string, endpoint: string): Promise<string> {
  try {
    const url = `${endpoint.replace(/\/$/, "")}/translate`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "en", target: "fr", format: "text" })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data?.translatedText ?? text;
  } catch {
    return simpleTranslate(text);
  }
}

interface Parsed {
  app?: string;
  env?: string;
  impact?: string;
  urgency?: string;
  steps?: string[];
  error?: string;
  when?: string;
  region?: string;
  user?: string;
  ticket?: string;
  summary?: string;
}

function parseInput(raw: string): Parsed {
  const text = raw.trim();
  const get = (label: string) =>
    (text.match(new RegExp(`${label}\\s*[:=]\\s*([^\\n]+)`, "i"))?.[1] || "").trim();

  const stepsBlock = text.match(/steps?\s*[:=]([\s\S]+)/i)?.[1] ?? "";
  const steps = stepsBlock
    .split(/\n|;|•|-/)
    .map((s) => s.replace(/^\s*(\d+\.|-)/, "").trim())
    .filter(Boolean);

  return {
    app: get("app|application|service|system"),
    env: get("env|environment"),
    impact: get("impact"),
    urgency: get("urgency|priority|prio|severity"),
    error: get("error|err|code"),
    when: get("when|since|time|started"),
    region: get("region|location"),
    user: get("user|requester|caller"),
    ticket: get("ticket|ref|id"),
    summary: text,
    steps
  };
}

function buildFrenchTemplates(p: Parsed) {
  const ts = new Date().toLocaleString("fr-FR");

  const titre = [
    p.app ? `${p.app}:` : null,
    p.error ? `${p.error}` : null,
    p.impact ? `– impact ${p.impact}` : null
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 120);

  const description = [
    `Contexte: ${p.app ?? "application non précisée"}${p.env ? ` (env: ${p.env})` : ""}.`,
    p.when ? `Début observé: ${p.when}.` : null,
    p.region ? `Zone concernée: ${p.region}.` : null,
    p.impact ? `Impact déclaré: ${p.impact}.` : null,
    p.urgency ? `Priorité/Sévérité: ${p.urgency}.` : null,
    p.error ? `Symptômes/erreur: ${p.error}.` : null
  ]
    .filter(Boolean)
    .join("\n");

  const steps = p.steps?.length
    ? p.steps.map((s, i) => `- Étape ${i + 1}: ${s}`).join("\n")
    : "- Aucune étape fournie.";

  const workNotes = [
    `[${ts}] Prise en charge de l'incident.`,
    p.user ? `Appelant: ${p.user}.` : null,
    description,
    `Actions réalisées:\n${steps}`,
    `Prochaines actions: analyse des journaux, corrélation des alertes, vérification dépendances.`,
    `Surveillance continue en place.`
  ]
    .filter(Boolean)
    .join("\n\n");

  const userComment = [
    "Bonjour,",
    p.app
      ? `Nous investiguons actuellement un souci affectant ${p.app}${p.error ? ` (erreur: ${p.error})` : ""}.`
      : `Nous investiguons actuellement le souci signalé${p.error ? ` (erreur: ${p.error})` : ""}.`,
    p.impact ? `Impact déclaré: ${p.impact}.` : null,
    "Nos équipes sont mobilisées. Nous vous tiendrons informé de l'avancement.",
    "Merci de votre patience."
  ]
    .filter(Boolean)
    .join(" \n");

  return { titre: titre || "Incident – détails à préciser", description, workNotes, userComment };
}

async function ensureFrench(text: string, provider: Provider, endpoint: string) {
  if (!text) return "";
  if (provider === "libre" && endpoint) return libreTranslate(text, endpoint);
  return simpleTranslate(text);
}

function btn(disabled = false): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid",
    borderColor: disabled ? "#9adbc0" : "#059669",
    background: disabled ? "#34d399" : "#059669",
    color: "white",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600
  };
}

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 16,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  padding: 12,
  outline: "none"
};

export default function ServiceNowNoteGenerator() {
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState<Provider>("offline");
  const [endpoint, setEndpoint] = useState("");
  const [loading, setLoading] = useState(false);

  const parsed = useMemo(() => parseInput(input), [input]);
  const fr = useMemo(() => buildFrenchTemplates(parsed), [parsed]);

  const [frTitle, setFrTitle] = useState("");
  const [frDesc, setFrDesc] = useState("");
  const [frWork, setFrWork] = useState("");
  const [frUser, setFrUser] = useState("");

  async function generate() {
    setLoading(true);
    try {
      const t1 = await ensureFrench(fr.titre, provider, endpoint);
      const t2 = await ensureFrench(fr.description, provider, endpoint);
      const t3 = await ensureFrench(fr.workNotes, provider, endpoint);
      const t4 = await ensureFrench(fr.userComment, provider, endpoint);
      setFrTitle(t1);
      setFrDesc(t2);
      setFrWork(t3);
      setFrUser(t4);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  const asServiceNowJSON = useMemo(
    () =>
      JSON.stringify(
        {
          short_description: frTitle || fr.titre,
          description: frDesc || fr.description,
          work_notes: frWork || fr.workNotes,
          comments: frUser || fr.userComment
        },
        null,
        2
      ),
    [frTitle, frDesc, frWork, frUser, fr]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
        color: "#0f172a"
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        {/* Header */}
        <header
          style={{
            background: "#059669",
            color: "white",
            borderRadius: 16,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px rgba(5,150,105,0.25)"
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            ServiceNow Incident Notes Generator
          </h1>
          <span
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.35)"
            }}
          >
            React + TypeScript
          </span>
        </header>

        {/* Prompt Card */}
        <section style={{ ...card, marginTop: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            One-field prompt (English)
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              "Describe the incident. Optional: app, env, impact, urgency, error, when, region, user, ticket, steps: ..."
            }
            style={{ ...inputStyle, minHeight: 150 }}
          />

          {/* Translation settings */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "inline-flex",
                padding: 4,
                borderRadius: 12,
                background: "#e2e8f0",
                border: "1px solid #cbd5e1"
              }}
            >
              <label
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: provider === "offline" ? "white" : "transparent",
                  color: provider === "offline" ? "#065f46" : "#334155",
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: provider === "offline" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <input
                  type="radio"
                  checked={provider === "offline"}
                  onChange={() => setProvider("offline")}
                  style={{ marginRight: 6 }}
                />
                Offline fallback
              </label>

              <label
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: provider === "libre" ? "white" : "transparent",
                  color: provider === "libre" ? "#065f46" : "#334155",
                  fontSize: 14,
                  fontWeight: 600,
                  boxShadow: provider === "libre" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <input
                  type="radio"
                  checked={provider === "libre"}
                  onChange={() => setProvider("libre")}
                  style={{ marginRight: 6 }}
                />
                LibreTranslate endpoint
              </label>
            </div>

            {provider === "libre" && (
              <input
                placeholder="https://libretranslate.example.com"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                style={{ ...inputStyle, width: 360 }}
              />
            )}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={generate} disabled={loading || !input} style={btn(loading || !input)}>
              {loading ? "Generating…" : "Generate French notes"}
            </button>
            <button
              onClick={() => {
                setFrTitle("");
                setFrDesc("");
                setFrWork("");
                setFrUser("");
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                background: "white",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Reset outputs
            </button>
          </div>
        </section>

        {/* Output Grid */}
        <section
          style={{
            display: "grid",
            gap: 16,
            marginTop: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"
          }}
        >
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Title (short_description)</h2>
              <button
                onClick={() => copy(frTitle || fr.titre)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                Copy
              </button>
            </div>
            <textarea
              value={frTitle || fr.titre}
              onChange={(e) => setFrTitle(e.target.value)}
              style={{ ...inputStyle, minHeight: 60, marginTop: 10 }}
            />
          </div>

          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Description (description)</h2>
              <button
                onClick={() => copy(frDesc || fr.description)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                Copy
              </button>
            </div>
            <textarea
              value={frDesc || fr.description}
              onChange={(e) => setFrDesc(e.target.value)}
              style={{ ...inputStyle, minHeight: 150, marginTop: 10 }}
            />
          </div>

          <div style={{ ...card, gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Work notes (note de travail – interne)
              </h2>
              <button
                onClick={() => copy(frWork || fr.workNotes)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                Copy
              </button>
            </div>
            <textarea
              value={frWork || fr.workNotes}
              onChange={(e) => setFrWork(e.target.value)}
              style={{ ...inputStyle, minHeight: 150, marginTop: 10 }}
            />
          </div>

          <div style={{ ...card, gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                User-visible comment (commentaire visible par l'utilisateur)
              </h2>
              <button
                onClick={() => copy(frUser || fr.userComment)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                Copy
              </button>
            </div>
            <textarea
              value={frUser || fr.userComment}
              onChange={(e) => setFrUser(e.target.value)}
              style={{ ...inputStyle, minHeight: 120, marginTop: 10 }}
            />
          </div>
        </section>

        {/* JSON Export */}
        <section style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Export for ServiceNow (JSON)</h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => copy(asServiceNowJSON)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                Copy JSON
              </button>
              <a
                href={`data:application/json;charset=utf-8,${encodeURIComponent(asServiceNowJSON)}`}
                download={`servicenow_notes_${Date.now()}.json`}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  fontSize: 12,
                  textDecoration: "none",
                  color: "#0f172a"
                }}
              >
                Download JSON
              </a>
            </div>
          </div>
          <pre
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 12,
              marginTop: 10,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          >
{asServiceNowJSON}
          </pre>
        </section>

        <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
          Astuce : utilisez des mots-clés comme <code>app:</code>, <code>env:</code>, <code>impact:</code>,{" "}
          <code>urgency:</code>, <code>error:</code>, <code>when:</code>, <code>region:</code>, <code>user:</code>,{" "}
          <code>steps:</code>.
        </div>
      </div>
    </div>
  );
}
