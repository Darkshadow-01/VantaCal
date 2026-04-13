/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as collaboration_index from "../collaboration/index.js";
import type * as events_index from "../events/index.js";
import type * as googleCalendar_index from "../googleCalendar/index.js";
import type * as memory from "../memory.js";
import type * as memory_index from "../memory/index.js";
import type * as sharedCalendars_index from "../sharedCalendars/index.js";
import type * as systems_index from "../systems/index.js";
import type * as taskDurations_index from "../taskDurations/index.js";
import type * as tasks_index from "../tasks/index.js";
import type * as userKeys_index from "../userKeys/index.js";
import type * as users_index from "../users/index.js";
import type * as weeklyPlans_index from "../weeklyPlans/index.js";
import type * as workspaces_index from "../workspaces/index.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "collaboration/index": typeof collaboration_index;
  "events/index": typeof events_index;
  "googleCalendar/index": typeof googleCalendar_index;
  memory: typeof memory;
  "memory/index": typeof memory_index;
  "sharedCalendars/index": typeof sharedCalendars_index;
  "systems/index": typeof systems_index;
  "taskDurations/index": typeof taskDurations_index;
  "tasks/index": typeof tasks_index;
  "userKeys/index": typeof userKeys_index;
  "users/index": typeof users_index;
  "weeklyPlans/index": typeof weeklyPlans_index;
  "workspaces/index": typeof workspaces_index;
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
