// The output contract + the v2.0 case library. Used three ways:
//  1) OUTPUT_SCHEMA as output_config.format (json_schema) so the model returns valid JSON.
//  2) CASES drives the review-classification block of the system prompt.
//  3) Both are echoed into the docs/UI so the app and the Master Prompt Library agree.
//
// Source of truth for the taxonomy: the Frenchies Master Review Response
// Prompt Library v2.0 — 22 cases in 5 families, each with an approval level.

export const APPROVAL_LEVELS = {
  auto: { label: "Auto", rank: 0, desc: "Any trained team member can post after a read-through." },
  check: { label: "Check", rank: 1, desc: "One second pair of eyes — usually the salon lead — before posting." },
  owner: { label: "Owner", rank: 2, desc: "The owner reads and approves personally. No exceptions." },
  legal: { label: "Legal", rank: 3, desc: "Owner plus outside counsel or franchise support before a public word." },
};

export const FAMILIES = [
  "Positive",
  "Mixed & neutral",
  "Negative",
  "Time-shifted",
  "Edge & escalation",
];

// n: case number in the Master Prompt Library. approval: minimum sign-off level.
// strategy: the condensed case module — what the model must do for this case.
export const CASES = [
  { n: 1, name: "Wordless Star", family: "Positive", approval: "auto", trigger: "Rating only, no text",
    strategy: "1 line (2 absolute max). Don't thank for 'kind words' — there were none. Don't invent what they enjoyed. Use the booking-record tech name only if the owner supplied it. Vary the opener — these accumulate publicly." },
  { n: 2, name: "Short Positive", family: "Positive", approval: "auto", trigger: "3–8 words of praise",
    strategy: "ONE sentence — match their brevity; brevity is confidence. Open by AGREEING ('She really is.'), not thanking. Named tech gets one character trait. Light see-you-next-time close, no hard sell." },
  { n: 3, name: "Medium Positive", family: "Positive", approval: "auto", trigger: "2–4 sentences",
    strategy: "2–3 sentences. Find the SINGLE most specific detail they included and make it the spine. Quote their strongest phrase back. At most ONE light differentiator, only if their review opens the door naturally." },
  { n: 4, name: "Detailed Positive", family: "Positive", approval: "auto", trigger: "Full paragraph rave",
    strategy: "3–4 sentences. Do NOT answer every point — pick the strongest beat (the most VALUABLE line is often not the loudest compliment). Quote their best phrase. Flag internally if testimonial-worthy (consent needed before reuse)." },
  { n: 5, name: "First-Visit Convert", family: "Positive", approval: "auto", trigger: "Skeptic won over",
    strategy: "Match their humor if they used any. Acknowledge their real reason for coming, in their framing. CRITICAL: never spell out their demographic or say 'everyone is welcome' — that others them; let tone do the work. Don't get clinical." },
  { n: 6, name: "Membership Convert", family: "Positive", approval: "check", trigger: "Mentions joining the membership",
    strategy: "The membership line IS the lede, even mid-paragraph. Frame it as a decision worth honoring — someone choosing this as their place. NO benefits/pricing pitch; the proof is their choice. Close as a welcome, not a thank-you." },
  { n: 7, name: "Loyal Regular", family: "Positive", approval: "auto", trigger: "Long-term client",
    strategy: "Reply like someone who KNOWS them. Acknowledge the length of the relationship in their terms. NO rebook nudge, booking link, or membership pitch — all imply we forgot they're already here. Their regular tech pairing is central." },
  { n: 8, name: "Event & Bridal", family: "Positive", approval: "auto", trigger: "Wedding, group, occasion",
    strategy: "Lead with the occasion, not the service. Demonstrate group/deadline competence through CALM TONE, never claims. Name every technician the reviewer named. Leave the door open for the people around them, no hard pitch." },
  { n: 9, name: "Mixed Review", family: "Mixed & neutral", approval: "check", trigger: "Praise + complaint together",
    strategy: "Praise first, briefly. Then own the complaint plainly — BAN the pivot words 'but', 'however', 'that said', 'unfortunately'; use a full stop and a new sentence. Own with NO explanation attached (explanations read as excuses). One concrete fix or direct contact. Never defend pricing, timing, or policy here." },
  { n: 10, name: "Lukewarm Middle", family: "Mixed & neutral", approval: "check", trigger: "3★, faint praise",
    strategy: "Do NOT over-apologize — nothing bad happened, and a heavy apology invents a problem. Do NOT interrogate publicly. Short and confident: acknowledge honestly, signal we aim higher than fine, one genuine low-pressure private invitation." },
  { n: 11, name: "Silent Low Star", family: "Mixed & neutral", approval: "check", trigger: "1–2★, no text",
    strategy: "NEVER guess the cause or apologize for a specific unverified failure — that publicly confesses to something that may not have happened. 1–2 sentences, calm and unbothered: acknowledge the rating, genuine willingness to understand, direct contact. Written for future readers." },
  { n: 12, name: "Negative – Service", family: "Negative", approval: "owner", trigger: "Quality, technique, result",
    strategy: "Own it plainly and early — no 'we're sorry you feel'. Do NOT explain the technique or why it happened; to a third-party reader explanation reads as excuse. Never name or imply fault of a technician publicly. One concrete remedy (come back, we'll correct it). Short; move detail offline." },
  { n: 13, name: "Negative – Communication", family: "Negative", approval: "owner", trigger: "Rudeness, booking, ghosting",
    strategy: "Name the failure honestly — never soften it to 'any confusion'. NEVER suggest they misunderstood or overreacted. Institutional responsibility, never an individual's. State one specific change if genuinely real. Direct line to the owner. This is the one negative family where a fuller, warmer apology beats brevity." },
  { n: 14, name: "Negative – Pricing", family: "Negative", approval: "owner", trigger: "Cost or value surprise",
    strategy: "NEVER defend the number. BANNED: 'you get what you pay for' and every variation. The value perception is legitimate — a price that felt wrong to them WAS wrong for them. ONCE, calmly, describe what the price buys (autoclave sterilization, single-use files, unhurried time) as how we work, not as rebuttal. Then stop. No refunds publicly." },
  { n: 15, name: "Negative – Policy Dispute", family: "Negative", approval: "owner", trigger: "Late arrival, cancellation, fee",
    strategy: "NEVER say 'you were late' or 'you were wrong', even softened. State the standard by WHO IT PROTECTS: back-to-back bookings mean a late start comes out of the NEXT client's time. Use the line 'a rule I only enforce sometimes isn't fair to anybody.' Do NOT correct their timeline or numbers, quote fine print, or mention the charge/refund/cameras/texts/receipts. Open by genuinely acknowledging their disrupted day." },
  { n: 16, name: "Negative – Hostile", family: "Negative", approval: "owner", trigger: "Abusive, unfair, personal",
    strategy: "INVERT match-the-energy: heat gets room temperature. 2–3 calm sentences max beside their angry paragraph. No grovel (reads as guilt and teaches that aggression works), no rebuttal of specific accusations, no reference to their tone. One direct contact, then stop. Advise privately whether to leave unanswered or report to the platform." },
  { n: 17, name: "Injury or Health Claim", family: "Negative", approval: "legal", trigger: "Bleeding, burn, infection, reaction",
    strategy: "Do NOT rebut and do NOT admit fault. REOPEN as an invitation: 'I'd really like to hear more.' Offer alternative causes ONLY as possibilities that INCLUDE our own work (medications, thyroid/circulation, dry cuticles, home care), each hedged, routed to their doctor if ongoing. SCOPE LIMIT: alternative causes are credible for tenderness/bleeding/sensitivity, NOT for a burn, cut, or instrument-traced infection — there, drop the alt-causes entirely, express real concern, move private immediately. Never name the technician. Never discuss compensation." },
  { n: 18, name: "Legacy Unanswered", family: "Time-shifted", approval: "check", trigger: "Old review, never replied to",
    strategy: "Acknowledge the lateness openly and without excuse — 'this is a late reply and that's on us.' Signal the salon has CHANGED without detailing history and WITHOUT blaming any former team member; draw a line between eras, not people. Don't re-litigate. Genuine invitation to see the difference. Short." },
  { n: 19, name: "Resolved or Updated", family: "Time-shifted", approval: "check", trigger: "Complaint later fixed; updated review",
    strategy: "Thank them for the SECOND CHANCE specifically — that's the rare thing, and it's theirs. NO victory lap ('so glad we could turn this around' centres us). Don't re-describe the original problem. Briefly affirm the standard that should have applied the first time. Warm, short, genuinely humble." },
  { n: 20, name: "Misdirected Review", family: "Edge & escalation", approval: "owner", trigger: "Meant for another business",
    strategy: "Tells: acrylics, jetted tubs, services/staff that don't exist here. Be gentle and leave room to be wrong: 'we think this may have been meant for another salon.' Never certain, never list their errors, never name the other business. Offer to help if it WAS us. 2 sentences max." },
  { n: 21, name: "Suspicious or Fake", family: "Edge & escalation", approval: "owner", trigger: "No record of the visit",
    strategy: "NEVER accuse them of being fake publicly — and never threaten legal action to force removal (the FTC Consumer Review Rule prohibits groundless legal threats, intimidation, and false public accusations to remove reviews). State the absence of a record neutrally, invite direct contact, 2 sentences, unbothered. Report through the platform on factual grounds." },
  { n: 22, name: "Discrimination or Harassment Claim", family: "Edge & escalation", approval: "legal", trigger: "Bias, dignity, or conduct claim",
    strategy: "Treat the claim as serious on its face. Never dispute their experience or defend the team's intent — 'that's not who we are' reads as dismissal. No conclusions, no findings, no timelines, no names. Move to a direct private channel with the owner immediately. Short, grave, human — NO brand-voice warmth or wit; charm reads as flippancy here." },
];

export const REVIEW_TYPES = CASES.map((c) => c.name);

/**
 * Validate/coerce a user-edited case list (e.g. brand/review-cases.json) into
 * the shape the prompt and the approval floor need. Returns null if nothing
 * usable, so callers can fall back to the built-in CASES.
 */
export function sanitizeCases(raw) {
  if (!Array.isArray(raw)) return null;
  const out = raw
    .filter((c) => c && typeof c === "object" && typeof c.name === "string" && c.name.trim())
    .map((c, i) => ({
      n: i + 1,
      name: c.name.trim(),
      family: typeof c.family === "string" && c.family.trim() ? c.family.trim() : "Positive",
      approval: APPROVAL_LEVELS[c.approval] ? c.approval : "check",
      trigger: typeof c.trigger === "string" ? c.trigger.trim() : "",
      strategy: typeof c.strategy === "string" ? c.strategy.trim() : "",
    }));
  return out.length ? out : null;
}

/** Family names in order of first appearance in a case list. */
export function familiesOf(cases) {
  const seen = [];
  for (const c of cases || CASES) if (!seen.includes(c.family)) seen.push(c.family);
  return seen;
}

export function caseByName(name, cases = CASES) {
  if (typeof name !== "string") return null;
  const t = name.trim().toLowerCase();
  return (cases || CASES).find((c) => c.name.toLowerCase() === t) || null;
}

/** The stricter of the model's stated level and the detected case's floor. */
export function effectiveApproval(detectedType, modelLevel, cases = CASES) {
  const c = caseByName(detectedType, cases);
  const floor = c ? c.approval : "check";
  const m = typeof modelLevel === "string" && APPROVAL_LEVELS[modelLevel] ? modelLevel : "check";
  return APPROVAL_LEVELS[m].rank >= APPROVAL_LEVELS[floor].rank ? m : floor;
}

export const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    detected_type: { type: "string" },
    approval_level: { type: "string", enum: ["auto", "check", "owner", "legal"] },
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
    left_out: {
      type: "array",
      items: { type: "string" },
    },
    fragile_note: { type: ["string", "null"] },
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
    "approval_level",
    "technician",
    "needs_human_review",
    "sensitivity_reason",
    "options",
    "left_out",
    "fragile_note",
    "operational_flags",
    "roster_note",
  ],
};

/**
 * Defensively coerce/validate a parsed model object into the output contract so
 * the UI never crashes on a slightly-off response. Also enforces the approval
 * floor: the detected case's level wins if the model under-calls it, and
 * Owner/Legal always implies needs_human_review.
 */
export function normalizeResult(obj, cases = CASES) {
  const o = obj && typeof obj === "object" ? obj : {};
  const opts = Array.isArray(o.options) ? o.options : [];
  const detected = typeof o.detected_type === "string" ? o.detected_type : "Unknown";
  const approval = effectiveApproval(detected, o.approval_level, cases);
  const mustReview = approval === "owner" || approval === "legal";
  return {
    detected_type: detected,
    approval_level: approval,
    technician: typeof o.technician === "string" && o.technician.trim() ? o.technician : null,
    needs_human_review: o.needs_human_review === true || mustReview,
    sensitivity_reason:
      typeof o.sensitivity_reason === "string" && o.sensitivity_reason.trim()
        ? o.sensitivity_reason
        : mustReview
          ? `${APPROVAL_LEVELS[approval].label}-level case — ${APPROVAL_LEVELS[approval].desc}`
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
    left_out: Array.isArray(o.left_out)
      ? o.left_out.filter((x) => typeof x === "string" && x.trim())
      : [],
    fragile_note:
      typeof o.fragile_note === "string" && o.fragile_note.trim() ? o.fragile_note : null,
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
