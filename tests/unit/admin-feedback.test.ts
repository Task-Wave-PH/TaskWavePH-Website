import { afterEach, expect, it, vi } from "vitest";
const { loading, success, error } = vi.hoisted(() => ({
  loading: vi.fn(() => "operation-id"),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { loading, success, error } }));
import { adminOperation } from "../../features/admin/operation-feedback";
afterEach(() => vi.clearAllMocks());
const feedback = {
  loading: "Saving…",
  success: "Saved.",
  error: "Unable to save.",
};
it("reports success only after confirmation and replaces the pending toast", async () => {
  let confirm!: (value: string) => void;
  const pending = new Promise<string>((resolve) => {
    confirm = resolve;
  });
  const result = adminOperation(() => pending, feedback);
  expect(loading).toHaveBeenCalledWith("Saving…");
  expect(success).not.toHaveBeenCalled();
  confirm("saved");
  expect(await result).toBe("saved");
  expect(success).toHaveBeenCalledWith(
    "Saved.",
    expect.objectContaining({ id: "operation-id" }),
  );
  expect(error).not.toHaveBeenCalled();
});
it("keeps failures rejected and hides internal exception details", async () => {
  const failure = new Error("Internal database credentials error");
  await expect(
    adminOperation(async () => {
      throw failure;
    }, feedback),
  ).rejects.toBe(failure);
  expect(error).toHaveBeenCalledWith(
    "Unable to save.",
    expect.objectContaining({ id: "operation-id" }),
  );
  expect(success).not.toHaveBeenCalled();
});
it("labels successful preview changes as synthetic", async () => {
  await adminOperation(async () => {}, { ...feedback, preview: true });
  expect(success).toHaveBeenCalledWith(
    "Saved.",
    expect.objectContaining({
      description: "Sample preview only. No database changes were made.",
    }),
  );
});
