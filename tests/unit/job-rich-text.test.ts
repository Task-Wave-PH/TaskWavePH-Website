import { describe, expect, it } from "vitest";
import {
  jobRichDocumentSchema,
  plainTextDocument,
  richTextPlain,
} from "../../features/jobs/rich-text";
import { jobSchema } from "../../features/jobs/schema";

describe("job formatting boundaries", () => {
  it("keeps legacy markup literal and preserves line breaks", () => {
    const text =
      "*literal* _literal_\n- still plain\n<script>alert(1)</script>";
    expect(richTextPlain(plainTextDocument(text))).toBe(text);
  });
  it("accepts flat bullets with both marks", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Helpful support",
                      marks: [{ type: "bold" }, { type: "italic" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(richTextPlain(jobRichDocumentSchema.parse(doc))).toBe(
      "Helpful support",
    );
  });
  it("rejects links, attributes, unsupported blocks and excessive structure", () => {
    for (const content of [
      [{ type: "paragraph", attrs: { style: "color:red" } }],
      [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "link",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
      [{ type: "heading", content: [] }],
      Array.from({ length: 1001 }, () => ({ type: "paragraph" })),
    ])
      expect(
        jobRichDocumentSchema.safeParse({ type: "doc", content }).success,
      ).toBe(false);
  });
  it("derives fallback content from validated formatting and enforces visible length", () => {
    const data = {
      title: "Support specialist",
      serviceArea: "Customer Support",
      location: "Dagupan",
      arrangement: "Remote",
      employmentType: "Full-time",
      description: "A valid old description for this job.",
      responsibilities: "Support our customers.",
      requirements: "Clear communication.",
      salary: "",
      richText: {
        description: plainTextDocument(
          "A different formatted description for this job.",
        ),
      },
    };
    expect(jobSchema.parse(data).description).toBe(
      "A different formatted description for this job.",
    );
    expect(
      jobSchema.safeParse({
        ...data,
        richText: { description: plainTextDocument(" ") },
      }).success,
    ).toBe(false);
    expect(
      jobSchema.safeParse({
        ...data,
        richText: { description: plainTextDocument("x".repeat(10001)) },
      }).success,
    ).toBe(false);
  });
});
