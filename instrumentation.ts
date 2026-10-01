export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.SUBMISSIONS_ENABLED === "true"
  ) {
    const { getSubmissionEnv } = await import("./lib/submission-env");
    getSubmissionEnv();
  }
}
