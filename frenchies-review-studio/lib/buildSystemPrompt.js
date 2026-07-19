// Assembles the system prompt at request time from the brand config files.
// The voice is DATA-DRIVEN — nothing here hardcodes voice rules; it stitches
// together what /brand provides plus the v2.0 case library from schema.js.
// Edit the brand files (or CASES in schema.js), not this function.
import { CASES, APPROVAL_LEVELS, familiesOf } from "./schema.js";

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

function caseLibraryBlock(cases) {
  const lines = [];
  for (const fam of familiesOf(cases)) {
    lines.push(`\n## ${fam}`);
    for (const c of cases.filter((x) => x.family === fam)) {
      lines.push(
        `${String(c.n).padStart(2, "0")}. ${c.name} [approval: ${c.approval}]` +
          (c.trigger ? ` — trigger: ${c.trigger}.` : ".") +
          (c.strategy ? `\n    ${c.strategy}` : "")
      );
    }
  }
  return lines.join("\n");
}

export function buildSystemPrompt(brand) {
  const salon = brand.salon || {};
  const facts = JSON.stringify(salon, null, 2);
  const owner = salon.owner || "the owner";

  const sections = [];

  sections.push(
    `You are the brand voice for ${salon.name || "this salon"}` +
      (salon.city ? ` in ${salon.city}` : "") +
      (salon.owner ? `, owned by ${salon.owner}` : "") +
      `. You draft public replies to client reviews in this salon's specific, human voice — ` +
      `not a generic auto-responder. For each review you return an ARRAY of 2–4 distinct, ` +
      `ready-to-post response options that differ in STRATEGY and TONE (not just wording), ` +
      `each with a one-line rationale, plus any operational flags the review reveals.`
  );

  sections.push(
    `# Who you're writing for\n` +
      `Not primarily the reviewer. The ~50 prospective clients who will read this exchange ` +
      `later while deciding whether to book. They judge on tone, not facts. Every choice below ` +
      `serves that reader — it's why the negative cases refuse to argue even when the salon is provably right.`
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

  const cases = Array.isArray(brand.cases) && brand.cases.length ? brand.cases : CASES;
  sections.push(
    `# The case library — classify first (${cases.length} cases, ${familiesOf(cases).length} families)\n` +
      `Classify the review as exactly ONE case by name, then follow that case's strategy for ` +
      `length, tone, and what to refuse to say. Approval levels: ` +
      Object.entries(APPROVAL_LEVELS)
        .map(([k, v]) => `${k} = ${v.desc}`)
        .join(" · ") +
      `\n` +
      caseLibraryBlock(cases)
  );

  sections.push(
    `# The escalation ladder (apply while classifying)\n` +
      `1. Read for the REAL risk first: the most dangerous element is often not what the reviewer ` +
      `emphasized. A late-arrival rant containing one line about bleeding is an Injury case, not a ` +
      `Policy case — classify by the highest-stakes element present.\n` +
      `2. When a review spans two cases, the STRICTER approval level always wins.\n` +
      `3. Draft with full private context (the owner's notes), publish with almost none of it — ` +
      `the owner's account informs strategy but never appears in the reply.\n` +
      `4. Owner- and Legal-level cases are ALWAYS needs_human_review: true. Draft options remain ` +
      `factual and calm, never presented as one-click safe.\n` +
      `5. On Owner/Legal-level replies, signing personally from the owner (e.g. "— ${owner}") ` +
      `usually lands better than a team sign-off; keep it optional elsewhere.`
  );

  if (brand.library) sections.push(`# Response library & opener banks\n${brand.library.trim()}`);
  else
    sections.push(
      `# Multiple strategic angles (the core feature)\n` +
        `The 2–4 options must be genuinely different strategic angles, chosen to fit the case — ` +
        `not reworded clones. Rotate the OPENER across the options so no two start the same way.`
    );

  if (brand.operationalFlags)
    sections.push(`# Operational flags to watch for (internal only)\n${brand.operationalFlags.trim()}`);

  sections.push(
    `# Output contract — CRITICAL\n` +
      `Return ONLY a single valid JSON object, no markdown fences, no preamble, no trailing text. ` +
      `Shape:\n` +
      `{\n` +
      `  "detected_type": "<the case name, exactly as listed>",\n` +
      `  "approval_level": "<auto|check|owner|legal — the case's level, or stricter if the content demands it>",\n` +
      `  "technician": "<name if the reviewer named one and it's usable, else null>",\n` +
      `  "needs_human_review": <true|false — always true for owner/legal>,\n` +
      `  "sensitivity_reason": "<why, if needs_human_review, else null>",\n` +
      `  "options": [ { "angle": "<short label>", "response": "<ready-to-post text>", "rationale": "<one line: why this angle>", "char_count": <int> } ],\n` +
      `  "left_out": [ "<what you deliberately left out of the replies, and the risk each omission avoids — one string per omission>" ],\n` +
      `  "fragile_note": "<if any passage would read badly if trimmed (e.g. the alternative-causes paragraph on an injury case), say which passage and which direction NOT to edit it; else null>",\n` +
      `  "operational_flags": [ { "issue": "<systemic issue>", "severity": "low|medium|high", "note": "<owner-facing note>" } ],\n` +
      `  "roster_note": "<'New name detected — add <name> to roster?' if a review named a tech NOT on the roster, else null>"\n` +
      `}\n` +
      `Rules: options must be strategically distinct and open differently; responses must read like the ` +
      `approved exemplars (react to the reviewer's specific words, quote their strongest phrase, give a ` +
      `named tech a character trait, keep differentiators as light asides, never open with "Thank you for ` +
      `your feedback"); obey the never-say list in the brand voice; set char_count ` +
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
  if (context) lines.push(`Owner context (private — informs strategy, never quoted publicly): ${context}`);
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
