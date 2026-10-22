import { z } from "zod";

const adminUrl = z.url().superRefine((value, ctx) => {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !["/", "/admin"].includes(url.pathname)
  )
    ctx.addIssue({ code: "custom", message: "Invalid administration URL" });
});
const configuration = z.object({
  RESEND_API_KEY: z.string().trim().min(1),
  RESEND_TEST_MODE: z.enum(["true", "false"]).default("true"),
  APPLICATION_NOTIFICATION_TO: z.email(),
  APPLICATION_NOTIFICATION_FROM: z
    .string()
    .max(300)
    .refine((value) => {
      const match = /^TaskWavePH Recruitment <([^<>\r\n]+)>$/.exec(value);
      return !!match && z.email().safeParse(match[1]).success;
    }),
  APPLICATION_NOTIFICATION_ADMIN_URL: adminUrl,
});
export function getApplicationEmailConfig(
  env: Record<string, string | undefined>,
) {
  if (env.APPLICATION_NOTIFICATIONS_ENABLED !== "true")
    return { state: "disabled" } as const;
  const parsed = configuration.safeParse(env);
  if (!parsed.success) return { state: "invalid" } as const;
  if (
    parsed.data.RESEND_TEST_MODE === "true" &&
    !/^delivered(?:\+[a-zA-Z0-9_-]+)?@resend\.dev$/.test(
      parsed.data.APPLICATION_NOTIFICATION_TO,
    )
  )
    return { state: "invalid" } as const;
  return { state: "ready", ...parsed.data } as const;
}
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function applicationEmail({
  names,
  total,
  adminUrl,
}: {
  names: string[];
  total: number;
  adminUrl: string;
}) {
  const displayed = names.slice(0, 3);
  if (
    !Number.isSafeInteger(total) ||
    total < 1 ||
    !displayed.length ||
    displayed.length > total
  )
    throw new Error(
      "Cannot format an empty or invalid applicant notification.",
    );
  const url = new URL(adminUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/applications`;
  const href = url.toString();
  const count = `${total} new ${total === 1 ? "application" : "applications"}`;
  const subject = `${count} — TaskWavePH`;
  const more = total - displayed.length;
  const text = `${count} received.\n\n${displayed.map((name) => `• ${name}`).join("\n")}${more ? `\n+${more} more new ${more === 1 ? "applicant" : "applicants"}` : ""}\n\nView applications: ${href}\n\nSign in with your approved TaskWavePH staff account to review all application details.`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#F2F4F7;color:#0A1D3B;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="24" style="table-layout:fixed;max-width:600px;background:#ffffff;border:1px solid #e1e8f0;border-radius:12px"><tr><td style="overflow-wrap:anywhere;word-wrap:break-word;word-break:break-word"><img src="https://www.taskwaveph.com/logo/taskwaveph-logo-on-white.png" width="220" alt="TaskWavePH" style="display:block;max-width:100%;height:auto"><h1 style="font-size:24px;line-height:1.3;margin:28px 0 16px">New applicants</h1><p style="line-height:1.7">${escapeHtml(count)} received. Here are the latest applicants:</p><ul style="padding-left:22px;line-height:1.8">${displayed.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}</ul>${more ? `<p style="color:#52627a;line-height:1.7">+${more} more new ${more === 1 ? "applicant" : "applicants"}</p>` : ""}<p style="margin:28px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#0D6EFD;color:#ffffff;padding:14px 22px;border-radius:6px;text-decoration:none;font-weight:bold">View Applications</a></p><p style="color:#52627a;font-size:14px;line-height:1.6">Sign in with your approved TaskWavePH staff account to review all application details.</p></td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}
