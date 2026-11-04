import { z } from "zod";

/**
 * Render a compact, model-friendly description of a Zod schema.
 *
 * OpenAI-compatible providers that only support `response_format: json_object`
 * (for example Groq) do not enforce a schema. Appending this hint to the system
 * prompt gives the model an exact target shape, which prevents otherwise valid
 * completions from failing runtime validation.
 */
export function describeSchema(schema: z.ZodTypeAny, depth = 0): string {
  if (depth > 8) {
    return "any";
  }

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return describeSchema(schema.unwrap(), depth);
  }

  if (schema instanceof z.ZodDefault) {
    return describeSchema(schema.removeDefault(), depth);
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const entries = Object.entries(shape).map(
      ([key, value]) => `  "${key}": ${describeSchema(value, depth + 1)}`
    );
    return `{\n${entries.join(",\n")}\n}`;
  }

  if (schema instanceof z.ZodArray) {
    return `[${describeSchema(schema.element, depth + 1)}]`;
  }

  if (schema instanceof z.ZodEnum) {
    return (schema.options as unknown[])
      .map((option) => JSON.stringify(option))
      .join(" | ");
  }

  if (schema instanceof z.ZodString) {
    return '"string"';
  }

  if (schema instanceof z.ZodNumber) {
    return "number";
  }

  if (schema instanceof z.ZodBoolean) {
    return "true | false";
  }

  if (schema instanceof z.ZodLiteral) {
    return JSON.stringify(schema.value);
  }

  if (schema instanceof z.ZodUnion) {
    return (schema.options as z.ZodTypeAny[])
      .map((option) => describeSchema(option, depth + 1))
      .join(" | ");
  }

  if (schema instanceof z.ZodPipeline) {
    return describeSchema(schema._def.out, depth);
  }

  if (schema instanceof z.ZodEffects) {
    return describeSchema(schema._def.schema, depth);
  }

  return "any";
}

/** Remove Markdown fences and leading prose from a JSON completion. */
export function extractJson(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}
