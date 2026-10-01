import { z } from "zod";
import { trackingSchema } from "../applications/schema";
export const services = [
  "Customer Support",
  "Digital Marketing",
  "Web Development",
  "Virtual Assistance",
  "Admin & Business Support",
  "Lead Generation & Sales Support",
] as const;
export const leadSchema = z.object({
  company: z.string().trim().min(2).max(200),
  contactName: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .max(254)
    .email()
    .transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(30).default(""),
  companyWebsite: z
    .string()
    .trim()
    .max(2000)
    .default("")
    .refine(
      (v) => !v || (/^https?:\/\//.test(v) && URL.canParse(v)),
      "Enter an HTTP or HTTPS website.",
    ),
  services: z.array(z.enum(services)).min(1).max(6),
  message: z.string().trim().min(10).max(2000),
  privacyConsent: z
    .boolean()
    .refine((v) => v, "Please agree to the privacy notice."),
  website: z.string().max(0).default(""),
  ...trackingSchema.shape,
});
