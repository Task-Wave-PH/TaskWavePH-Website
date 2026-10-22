import { Fragment, type ReactNode } from "react";
import {
  jobRichDocumentSchema,
  type JobRichDocument,
} from "@/features/jobs/rich-text";

export function JobRichText({
  document,
  fallback,
}: {
  document?: JobRichDocument;
  fallback: string;
}) {
  const parsed = jobRichDocumentSchema.safeParse(document);
  if (!parsed.success)
    return (
      <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">
        {fallback}
      </p>
    );
  const paragraph = (
    block: Extract<JobRichDocument["content"][number], { type: "paragraph" }>,
    key: number,
  ) => (
    <p key={key} className="min-h-6 whitespace-pre-wrap">
      {block.content?.map((node, index) => {
        let child: ReactNode = node.type === "text" ? node.text : <br />;
        for (const mark of node.marks ?? [])
          child =
            mark.type === "bold" ? <strong>{child}</strong> : <em>{child}</em>;
        return <Fragment key={index}>{child}</Fragment>;
      })}
    </p>
  );
  return (
    <div className="mt-4 space-y-4 break-words leading-relaxed text-muted-foreground">
      {parsed.data.content.map((block, index) =>
        block.type === "paragraph" ? (
          paragraph(block, index)
        ) : (
          <ul key={index} className="list-disc space-y-2 pl-6">
            {block.content.map((item, itemIndex) => (
              <li key={itemIndex}>{item.content.map(paragraph)}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
