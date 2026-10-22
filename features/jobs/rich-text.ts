import { z } from "zod";

export const jobBodyFields = [
  "description",
  "responsibilities",
  "requirements",
] as const;
export type JobBodyField = (typeof jobBodyFields)[number];
const mark = z.object({ type: z.enum(["bold", "italic"]) }).strict();
const marks = z
  .array(mark)
  .max(2)
  .refine(
    (items) => new Set(items.map((m) => m.type)).size === items.length,
    "Duplicate formatting marks.",
  );
const inline = z.union([
  z
    .object({
      type: z.literal("text"),
      text: z.string().min(1).max(10000),
      marks: marks.optional(),
    })
    .strict(),
  z.object({ type: z.literal("hardBreak"), marks: marks.optional() }).strict(),
]);
const paragraph = z
  .object({
    type: z.literal("paragraph"),
    content: z.array(inline).max(1000).optional(),
  })
  .strict();
const bulletList = z
  .object({
    type: z.literal("bulletList"),
    content: z
      .array(
        z
          .object({
            type: z.literal("listItem"),
            content: z.array(paragraph).min(1).max(1000),
          })
          .strict(),
      )
      .min(1)
      .max(1000),
  })
  .strict();

const documentShape = z
  .object({
    type: z.literal("doc"),
    content: z
      .array(z.union([paragraph, bulletList]))
      .min(1)
      .max(1000),
  })
  .strict();

// Preflight before Zod walks arrays or serialization sees an excessively deep input.
const bounded = z
  .custom<z.input<typeof documentShape>>(() => true)
  .superRefine((value, ctx) => {
    const stack: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
    let nodes = 0;
    while (stack.length) {
      const item = stack.pop()!;
      if (item.depth > 12 || stack.length > 3000 || nodes > 1000) {
        ctx.addIssue({
          code: "custom",
          message: "This content is too complex. Use fewer formatting blocks.",
        });
        return;
      }
      if (item.value && typeof item.value === "object") {
        if (!Array.isArray(item.value)) nodes++;
        const children = Object.values(item.value);
        if (children.length > 1000) {
          ctx.addIssue({
            code: "custom",
            message: "Use fewer formatting blocks.",
          });
          return;
        }
        for (const child of children)
          stack.push({ value: child, depth: item.depth + 1 });
      }
    }
    try {
      if (new TextEncoder().encode(JSON.stringify(value)).length > 50000) {
        ctx.addIssue({
          code: "custom",
          message: "This formatted content is too large.",
        });
      }
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid formatted content." });
    }
  });
export const jobRichDocumentSchema = bounded.pipe(documentShape);
export type JobRichDocument = z.infer<typeof jobRichDocumentSchema>;
export const jobRichTextSchema = z
  .object({
    description: jobRichDocumentSchema.optional(),
    responsibilities: jobRichDocumentSchema.optional(),
    requirements: jobRichDocumentSchema.optional(),
  })
  .strict();
export type JobRichText = z.infer<typeof jobRichTextSchema>;

export function richTextPlain(document: JobRichDocument): string {
  const text = (p: z.infer<typeof paragraph>) =>
    (p.content ?? [])
      .map((node) => (node.type === "text" ? node.text : "\n"))
      .join("");
  return document.content
    .map((block) =>
      block.type === "paragraph"
        ? text(block)
        : block.content
            .map((item) => item.content.map(text).join("\n"))
            .join("\n"),
    )
    .join("\n");
}
export function plainTextDocument(text: string): JobRichDocument {
  return {
    type: "doc",
    content: text.split(/\r\n|\r|\n/).map((line) => ({
      type: "paragraph",
      ...(line ? { content: [{ type: "text", text: line }] } : {}),
    })),
  };
}
