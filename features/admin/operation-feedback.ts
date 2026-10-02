"use client";

import { toast } from "sonner";

export async function adminOperation<T>(
  operation: () => Promise<T>,
  feedback: {
    loading: string;
    success: string;
    error: string | ((error: unknown) => string);
    preview?: boolean;
  },
): Promise<T> {
  const id = toast.loading(feedback.loading);
  const description = feedback.preview
    ? "Sample preview only. No database changes were made."
    : undefined;
  try {
    const result = await operation();
    toast.success(feedback.success, { id, description, duration: 5000 });
    return result;
  } catch (error) {
    toast.error(
      typeof feedback.error === "function"
        ? feedback.error(error)
        : feedback.error,
      { id, description, duration: 8000 },
    );
    throw error;
  }
}
