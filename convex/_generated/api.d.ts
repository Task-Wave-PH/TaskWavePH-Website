/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAccess from "../adminAccess.js";
import type * as adminMetrics from "../adminMetrics.js";
import type * as crons from "../crons.js";
import type * as downloads from "../downloads.js";
import type * as exports from "../exports.js";
import type * as http from "../http.js";
import type * as intake from "../intake.js";
import type * as jobValidators from "../jobValidators.js";
import type * as jobs from "../jobs.js";
import type * as overview from "../overview.js";
import type * as provision from "../provision.js";
import type * as seed from "../seed.js";
import type * as staffInvitations from "../staffInvitations.js";
import type * as staffManagement from "../staffManagement.js";
import type * as staffStatus from "../staffStatus.js";
import type * as staffValidators from "../staffValidators.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAccess: typeof adminAccess;
  adminMetrics: typeof adminMetrics;
  crons: typeof crons;
  downloads: typeof downloads;
  exports: typeof exports;
  http: typeof http;
  intake: typeof intake;
  jobValidators: typeof jobValidators;
  jobs: typeof jobs;
  overview: typeof overview;
  provision: typeof provision;
  seed: typeof seed;
  staffInvitations: typeof staffInvitations;
  staffManagement: typeof staffManagement;
  staffStatus: typeof staffStatus;
  staffValidators: typeof staffValidators;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  adminByTime: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"adminByTime">;
  adminByStatus: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"adminByStatus">;
};
