import { z } from "zod";

const optionalText = (max = 200) => z.string().trim().max(max).default("");
// Omit blank additions so unchanged pre-screening submissions keep their fingerprint.
const screeningText = (max: number) =>
  optionalText(max).transform((value) => value || undefined);

export function normalizePhone(value: string): string {
  const digits = value.replace(/[\s()-]/g, "");
  if (digits.startsWith("09")) return `+63${digits.slice(1)}`;
  if (digits.startsWith("639")) return `+${digits}`;
  return digits;
}

export const trackingKeys = [
  "source",
  "campaign",
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const;

export const trackingSchema = z.object({
  source: optionalText(),
  campaign: optionalText(),
  utm_source: optionalText(),
  utm_medium: optionalText(),
  utm_campaign: optionalText(),
  landing_page: z
    .string()
    .max(200)
    .regex(/^\/[^?#]*$/)
    .default("/apply"),
});

export const applicationSchema = z.object({
  jobId: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined),
  firstName: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
  lastName: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
  email: z
    .string()
    .trim()
    .max(254)
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(30)
    .transform(normalizePhone)
    .refine(
      (value) => /^\+639\d{9}$/.test(value),
      "Enter a Philippine mobile number, such as 0917 123 4567.",
    ),
  location: z.string().trim().min(1, "Enter your city or location.").max(200),
  position: z
    .string()
    .trim()
    .min(1, "Enter the position you are interested in.")
    .max(200),
  experience: z
    .string()
    .trim()
    .max(10)
    .default("")
    .refine(
      (value) =>
        value === "" || (/^\d+(\.\d+)?$/.test(value) && Number(value) <= 60),
      "Enter years of experience between 0 and 60.",
    )
    .transform((value) => (value === "" ? undefined : Number(value))),
  employmentStatus: optionalText(),
  availability: optionalText(),
  expectedSalary: screeningText(100),
  previousSalary: screeningText(100),
  strengthOne: screeningText(300),
  strengthTwo: screeningText(300),
  distanceFromDagupan: screeningText(200),
  relocationPreference: z
    .enum(["", "Willing", "Not willing", "Discuss first"])
    .default("")
    .transform((value) => value || undefined),
  portfolio: optionalText(2000)
    .refine((value) => {
      if (!value) return true;
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "Enter a link starting with http:// or https://.")
    .transform((value) => value || undefined),
  resume: optionalText(2000).refine((value) => {
    if (!value) return true;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Enter a link starting with http:// or https://."),
  message: optionalText(2000),
  referredBy: screeningText(200),
  privacyConsent: z
    .boolean()
    .refine((value) => value, "Please agree to the privacy notice."),
  website: z
    .string()
    .max(0, "Unable to validate this application.")
    .default(""),
  ...trackingSchema.shape,
});
