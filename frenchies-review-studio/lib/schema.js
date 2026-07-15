// The output contract. Used two ways:
//  1) As output_config.format (json_schema) so the model returns valid JSON.
//  2) As documentation echoed into the system prompt.
export const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    detected_type: { type: "string" },
    technician: { type: ["string", "null"] },
    needs_human_review: { type: "boolean" },
    sensitivity_reason: { type: ["string", "null"] },
    options: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          angle: { type: "string" },
          response: { type: "string" },
          rationale: { type: "string" },
          char_count: { type: "integer" },
        },
        required: ["angle", "response", "rationale", "char_count"],
      },
    },
    operational_flags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          issue: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          note: { type: "string" },
        },
        required: ["issue", "severity", "note"],
      },
    },
    roster_note: { type: ["string", "null"] },
  },
  required: [
    "detected_type",
    "technician",
    "needs_human_review",
    "sensitivity_reason",
    "options",
    "operational_flags",
    "roster_note",
  ],
};

export const REVIEW_TYPES = [
  "Wordless Star",
  "Short Positive",
  "Medium Positive",
  "Detailed Positive",
  "Mixed",
  "Negative – Service",
  "Negative – Communication",
  "Negative – Pricing",
  "Negative – Hostile",
  "Legacy Unanswered",
  "Resolved/Updated",
];

/**
 * Defensively coerce/validate a parsed model object into the output contract so
 * the UI never crashes on a slightly-off response.
 */
export function normalizeResult(obj) {
  const o = obj && typeof obj === "object" ? obj : {};
  const opts = Array.isArray(o.options) ? o.options : [];
  return {
    detected_type: typeof o.detected_type === "string" ? o.detected_type : "Unknown",
    technician: typeof o.technician === "string" && o.technician.trim() ? o.technician : null,
    needs_human_review: o.needs_human_review === true,
    sensitivity_reason:
      typeof o.sensitivity_reason === "string" && o.sensitivity_reason.trim()
        ? o.sensitivity_reason
        : null,
    options: opts.map((op) => {
      const resp = typeof op?.response === "string" ? op.response : "";
      return {
        angle: typeof op?.angle === "string" ? op.angle : "Option",
        response: resp,
        rationale: typeof op?.rationale === "string" ? op.rationale : "",
        char_count: Number.isFinite(op?.char_count) ? op.char_count : resp.length,
      };
    }),
    operational_flags: Array.isArray(o.operational_flags)
      ? o.operational_flags
          .filter((f) => f && typeof f === "object")
          .map((f) => ({
            issue: typeof f.issue === "string" ? f.issue : "",
            severity: ["low", "medium", "high"].includes(f.severity) ? f.severity : "low",
            note: typeof f.note === "string" ? f.note : "",
          }))
      : [],
    roster_note:
      typeof o.roster_note === "string" && o.roster_note.trim() ? o.roster_note : null,
  };
}
