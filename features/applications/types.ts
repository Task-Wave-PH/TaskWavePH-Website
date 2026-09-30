import type { z } from "zod";
import type { applicationSchema, trackingSchema } from "./schema";

export type ApplicationInput = z.input<typeof applicationSchema>;
export type ApplicationData = z.output<typeof applicationSchema>;
export type ApplicationTracking = z.output<typeof trackingSchema>;
