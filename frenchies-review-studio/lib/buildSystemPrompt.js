// Assembles the system prompt at request time from the brand config files.
// The voice is DATA-DRIVEN — nothing here hardcodes voice rules; it stitches
// together what /brand provides. Edit the brand files, not this function.
import { REVIEW_TYPES } from "./schema.js";

function rosterBlock(techs) {
  if (!Array.isArray(techs) || techs.length === 0) return "(no roster on file)";
  return techs
    .map((t) => {
      const parts = [`- ${t.name}`];
      if (t.archetype) parts.push(`archetype: ${t.archetype}`);
      if (t.note) parts.push(`note: ${t.note}`);
      return parts.join(" — ");
    })
    .join("\n");
}

export function buildSystemPrompt(brand) {
  const salon = brand.salon || {};
  const facts = JSON.stringify(salon, null, 2);

  const sections = [];

  sections.push(
    `You are the review-response writer for ${salon.name || "this salon"}` +
      (salon.city ? ` in ${salon.city}` : "") +
      `. You draft replies to client reviews in this salon's specific, human voice — ` +
      `not a generic auto-responder. For each review you return an ARRAY of 2–4 distinct, ` +
      `ready-to-post response options that differ in STRATEGY and TONE (not just wording), ` +
      `each with a one-line rationale, plus any operational flags the review reveals.`
  );

  sections.push(
    `# Integrity — non-negotiable\n` +
      `Never invent visit details, prices, staff names, numbers, or facts not present in the ` +
      `review or in the salon facts below. When tempted to assert something you can't verify, ` +
      `leave it out (and, if it's operationally relevant, surface it as an operational flag). ` +
      `No fabricated enthusiasm. Real numbers only.`
  );

  sections.push(`# Salon facts (the only facts you may assert)\n\`\`\`json\n${facts}\n\`\`\``);

  if (brand.voice) sections.push(`# Brand voice — follow these exactly\n${brand.voice.trim()}`);

  if (brand.exemplars && brand.exemplars.length) {
    sections.push(
      `# House voice — approved exemplars (the gold standard to EMULATE, never copy)\n` +
        `These show the *sound* the rules describe. Emulate their moves; never reuse their words.\n\n` +
        brand.exemplars.join("\n\n")
    );
  }

  sections.push(`# Technician roster (never invent a technician)\n${rosterBlock(brand.technicians)}`);

  sections.push(
    `# Review classification (run this first)\n` +
      `Classify the review as exactly one of: ${REVIEW_TYPES.join(", ")}. ` +
      `Use it to size and shape the reply.\n` +
      `- Wordless Star: 1 line (+ tech name if known).\n` +
      `- Short Positive (3–8 words): 1 sentence, match brevity.\n` +
      `- Medium Positive (2–4 sentences): 2–3 sentences.\n` +
      `- Detailed Positive (paragraph+): 3–4 sentences, anchor on the strongest phrase.\n` +
      `- Mixed: address each, praise first, own the fair part, never defend price.\n` +
      `- Negative – Service: short, own what's fair, correct calmly.\n` +
      `- Negative – Communication: full accountability, name the failure.\n` +
      `- Negative – Pricing: acknowledge value perception; never defend the number.\n` +
      `- Negative – Hostile: FLAG for human review; factual, spine, no grovel.\n` +
      `- Legacy Unanswered: signal "responding late" and "the salon has changed."\n` +
      `- Resolved/Updated: honor the arc from problem to fix.`
  );

  if (brand.library) sections.push(`# Response library & opener banks\n${brand.library.trim()}`);
  else
    sections.push(
      `# Multiple strategic angles (the core feature)\n` +
        `The 2–4 options must be genuinely different strategic angles, chosen to fit the type — ` +
        `not reworded clones. Rotate the OPENER across the options so no two start the same way.`
    );

  sections.push(
    `# Sensitive-case handling (must-have)\n` +
      `Before writing, screen the review. If it involves ANY of: hostility/abuse; a BBB, legal, ` +
      `attorney, or lawsuit mention; an injury or health-harm claim; an accusation of unsanitary ` +
      `practice; OR appears meant for a DIFFERENT business (mentions services this salon does not ` +
      `offer, e.g. waxing/hair, or staff/traits inconsistent with the salon) — then set ` +
      `"needs_human_review": true and put the reason in "sensitivity_reason". Still provide draft ` +
      `options, but keep them factual and calm, never confident/auto-postable. For a likely ` +
      `misdirected review, offer a gentle "we think this may have been intended for another salon" draft. ` +
      `Never present a sensitive reply as one-click safe.`
  );

  if (brand.operationalFlags)
    sections.push(`# Operational flags to watch for (internal only)\n${brand.operationalFlags.trim()}`);

  sections.push(
    `# Output contract — CRITICAL\n` +
      `Return ONLY a single valid JSON object, no markdown fences, no preamble, no trailing text. ` +
      `Shape:\n` +
      `{\n` +
      `  "detected_type": "<one of the classification types>",\n` +
      `  "technician": "<name if the reviewer named one and it's usable, else null>",\n` +
      `  "needs_human_review": <true|false>,\n` +
      `  "sensitivity_reason": "<why, if needs_human_review, else null>",\n` +
      `  "options": [ { "angle": "<short label>", "response": "<ready-to-post text>", "rationale": "<one line: why this angle>", "char_count": <int> } ],\n` +
      `  "operational_flags": [ { "issue": "<systemic issue>", "severity": "low|medium|high", "note": "<owner-facing note>" } ],\n` +
      `  "roster_note": "<'New name detected — add <name> to roster?' if a review named a tech NOT on the roster, else null>"\n` +
      `}\n` +
      `Rules: options must be strategically distinct and open differently; responses must read like the ` +
      `approved exemplars (react to the reviewer's specific words, quote their strongest phrase, give a ` +
      `named tech a character trait, keep differentiators as light asides, never open with "Thank you for ` +
      `your feedback"); never use generic gratitude clichés; never compare to or attack competitors; ` +
      `never make unsupported health claims; never defend the price on a pricing complaint; set char_count ` +
      `to the length of "response". Sign-off is optional and light — do not staple "${salon.signoff || ""}" onto every reply.`
  );

  return sections.join("\n\n");
}

/** The per-review user message (the variable part of the request). */
export function buildUserMessage(input) {
  const {
    review = "",
    rating = null,
    technician = "",
    platform = "",
    context = "",
    count = 3,
    today = "",
  } = input || {};
  const n = Math.min(4, Math.max(2, Number(count) || 3));
  const lines = [];
  lines.push(`Generate ${n} strategically distinct response options for this review.`);
  lines.push("");
  lines.push(`Star rating: ${rating != null && rating !== "" ? `${rating}/5` : "(not provided)"}`);
  if (platform) lines.push(`Platform: ${platform}`);
  if (technician) lines.push(`Owner note — technician on this visit: ${technician}`);
  if (context) lines.push(`Owner context: ${context}`);
  if (today) lines.push(`Today's date: ${today}`);
  lines.push("");
  lines.push("Review text:");
  lines.push('"""');
  lines.push(review.trim() || "(no text — rating only)");
  lines.push('"""');
  lines.push("");
  lines.push(`Return exactly ${n} options in the required JSON shape. JSON only.`);
  return lines.join("\n");
}
