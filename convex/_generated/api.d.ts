/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountLinking from "../accountLinking.js";
import type * as appState from "../appState.js";
import type * as auth from "../auth.js";
import type * as babyProfiles from "../babyProfiles.js";
import type * as diaperChanges from "../diaperChanges.js";
import type * as diaryEntries from "../diaryEntries.js";
import type * as easyFormulaRules from "../easyFormulaRules.js";
import type * as feedings from "../feedings.js";
import type * as growthRecords from "../growthRecords.js";
import type * as habits from "../habits.js";
import type * as healthRecords from "../healthRecords.js";
import type * as http from "../http.js";
import type * as pumpings from "../pumpings.js";
import type * as scheduledNotifications from "../scheduledNotifications.js";
import type * as seed from "../seed.js";
import type * as sleepSessions from "../sleepSessions.js";
import type * as timeline from "../timeline.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountLinking: typeof accountLinking;
  appState: typeof appState;
  auth: typeof auth;
  babyProfiles: typeof babyProfiles;
  diaperChanges: typeof diaperChanges;
  diaryEntries: typeof diaryEntries;
  easyFormulaRules: typeof easyFormulaRules;
  feedings: typeof feedings;
  growthRecords: typeof growthRecords;
  habits: typeof habits;
  healthRecords: typeof healthRecords;
  http: typeof http;
  pumpings: typeof pumpings;
  scheduledNotifications: typeof scheduledNotifications;
  seed: typeof seed;
  sleepSessions: typeof sleepSessions;
  timeline: typeof timeline;
  users: typeof users;
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

export declare const components: {};
