/**
 * Research reports are stored with a JSON payload in `summary` because the AI
 * pipeline returns structured data. The UI should never dump that raw blob at
 * the user, so parsing and preview helpers live here.
 */

export interface ResearchSignal {
  type?: string;
  title?: string;
  description?: string;
  sourceUrl?: string;
}

export interface ParsedResearchSummary {
  signals: ResearchSignal[];
  painPoints: string[];
  opportunities: string[];
  personalizationAngles: string[];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function toSignals(value: unknown): ResearchSignal[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): ResearchSignal[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const signal: ResearchSignal = {};
    if (typeof record["type"] === "string") signal.type = record["type"];
    if (typeof record["title"] === "string") signal.title = record["title"];
    if (typeof record["description"] === "string") signal.description = record["description"];
    if (typeof record["sourceUrl"] === "string") signal.sourceUrl = record["sourceUrl"];
    return Object.keys(signal).length > 0 ? [signal] : [];
  });
}

export function parseResearchSummary(
  raw: string | null | undefined
): ParsedResearchSummary | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

    const record = parsed as Record<string, unknown>;
    const summary: ParsedResearchSummary = {
      signals: toSignals(record["signals"]),
      painPoints: toStringArray(record["painPoints"] ?? record["pain_points"]),
      opportunities: toStringArray(record["opportunities"]),
      personalizationAngles: toStringArray(
        record["personalizationAngles"] ?? record["personalization_angles"]
      ),
    };

    const hasContent =
      summary.signals.length > 0 ||
      summary.painPoints.length > 0 ||
      summary.opportunities.length > 0 ||
      summary.personalizationAngles.length > 0;

    return hasContent ? summary : null;
  } catch {
    return null;
  }
}

/**
 * One-line preview for tables and compact cards. Plain-text reports pass
 * through untouched so older rows keep working.
 */
export function summarizeResearch(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const parsed = parseResearchSummary(raw);
  if (!parsed) return raw;

  const lead =
    parsed.signals[0]?.title ??
    parsed.signals[0]?.description ??
    parsed.painPoints[0] ??
    parsed.opportunities[0] ??
    parsed.personalizationAngles[0] ??
    null;

  const counts = [
    parsed.painPoints.length > 0 ? `${parsed.painPoints.length} pain points` : null,
    parsed.opportunities.length > 0 ? `${parsed.opportunities.length} opportunities` : null,
    parsed.personalizationAngles.length > 0
      ? `${parsed.personalizationAngles.length} angles`
      : null,
  ].filter((item): item is string => item !== null);

  return lead ? [lead, ...counts].join(" · ") : counts.join(" · ") || null;
}
