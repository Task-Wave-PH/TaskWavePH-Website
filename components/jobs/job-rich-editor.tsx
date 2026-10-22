"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import { Extension, wrappingInputRule } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import HardBreak from "@tiptap/extension-hard-break";
import { BulletList, ListItem } from "@tiptap/extension-list";
import { Plugin } from "@tiptap/pm/state";
import { UndoRedo } from "@tiptap/extensions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  jobRichDocumentSchema,
  plainTextDocument,
  richTextPlain,
  type JobRichDocument,
} from "@/features/jobs/rich-text";

const Bullets = BulletList.extend({
  addInputRules() {
    return [wrappingInputRule({ find: /^- $/, type: this.type })];
  },
});
const ContentLimits = Extension.create({
  name: "jobContentLimits",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        filterTransaction(transaction) {
          if (!transaction.docChanged) return true;
          const parsed = jobRichDocumentSchema.safeParse(
            transaction.doc.toJSON(),
          );
          const allowed =
            parsed.success && richTextPlain(parsed.data).length <= 10000;
          if (!allowed)
            editor.view.dom.dispatchEvent(new Event("job-content-limit"));
          return allowed;
        },
      }),
    ];
  },
});
export function JobRichEditor({
  id,
  label,
  value,
  richValue,
  disabled,
  error,
  onChange,
  onBlur,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  richValue?: JobRichDocument;
  disabled: boolean;
  error?: string;
  onChange: (document: JobRichDocument) => void;
  onBlur: () => void;
  inputRef: (element: HTMLElement | null) => void;
}) {
  const [limitMessage, setLimitMessage] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      HardBreak,
      Bullets,
      ListItem.extend({ content: "paragraph+" }),
      UndoRedo,
      ContentLimits,
    ],
    enableInputRules: ["bulletList"],
    enablePasteRules: false,
    content: richValue ?? plainTextDocument(value),
    onUpdate: ({ editor }) => {
      const parsed = jobRichDocumentSchema.safeParse(editor.getJSON());
      if (parsed.success) {
        setLimitMessage("");
        onChange(parsed.data);
      }
    },
    onBlur,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-invalid": String(!!error),
        "aria-labelledby": `${id}-label`,
        "aria-describedby": `${id}-hint${error ? ` ${id}-error` : ""}`,
        class:
          "min-h-40 max-w-full whitespace-pre-wrap break-words rounded-b-lg p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_p]:min-h-6",
      },
    },
  });
  useEffect(() => {
    if (!editor) return;
    const element = editor.view.dom;
    const notify = () =>
      setLimitMessage(
        "That change exceeds the content limit. Use shorter text or fewer formatting blocks.",
      );
    element.addEventListener("job-content-limit", notify);
    return () => element.removeEventListener("job-content-limit", notify);
  }, [editor]);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      bullet: editor?.isActive("bulletList"),
    }),
  });
  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);
  useEffect(() => {
    if (!editor) return;
    const next = richValue ?? plainTextDocument(value);
    // Compare normalized documents: JSON property order must not reset selection/history.
    if (!editor.state.doc.eq(editor.schema.nodeFromJSON(next)))
      editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, richValue, value]);
  useEffect(() => {
    if (editor) inputRef(editor.view.dom);
    return () => inputRef(null);
  }, [editor, inputRef]);
  return (
    <>
      <Label
        id={`${id}-label`}
        htmlFor={id}
        onClick={() => editor?.commands.focus()}
      >
        {label}
      </Label>
      <div className="min-w-0 rounded-lg border bg-background">
        <div
          role="group"
          aria-label={`${label} formatting`}
          className="flex flex-wrap gap-1 border-b p-2"
        >
          <Button
            className="min-h-11 min-w-11 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
            type="button"
            variant="ghost"
            aria-label="Bold"
            aria-pressed={!!state?.bold}
            disabled={disabled || !editor}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </Button>
          <Button
            className="min-h-11 min-w-11 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
            type="button"
            variant="ghost"
            aria-label="Italic"
            aria-pressed={!!state?.italic}
            disabled={disabled || !editor}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </Button>
          <Button
            className="min-h-11 min-w-11 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
            type="button"
            variant="ghost"
            aria-label="Bullets"
            aria-pressed={!!state?.bullet}
            disabled={disabled || !editor}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            • List
          </Button>
        </div>
        <EditorContent editor={editor} />
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        Type - then Space for bullets. Use Ctrl/Cmd+B for bold or Ctrl/Cmd+I for
        italic. Maximum 10,000 characters.
      </p>
      {limitMessage && (
        <p role="alert" className="text-sm text-destructive">
          {limitMessage}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {richValue && richTextPlain(richValue).length > 10000 && (
        <p role="alert" className="text-sm text-destructive">
          Shorten this content to 10,000 characters before saving.
        </p>
      )}
    </>
  );
}
