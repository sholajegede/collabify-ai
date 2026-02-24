/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessLogs from "../accessLogs.js";
import type * as actions_ai from "../actions/ai.js";
import type * as actions_email from "../actions/email.js";
import type * as ai from "../ai.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as documentShares from "../documentShares.js";
import type * as documentVersions from "../documentVersions.js";
import type * as documents from "../documents.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_documentAccess from "../lib/documentAccess.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_tokens from "../lib/tokens.js";
import type * as organizations from "../organizations.js";
import type * as presence from "../presence.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accessLogs: typeof accessLogs;
  "actions/ai": typeof actions_ai;
  "actions/email": typeof actions_email;
  ai: typeof ai;
  comments: typeof comments;
  crons: typeof crons;
  documentShares: typeof documentShares;
  documentVersions: typeof documentVersions;
  documents: typeof documents;
  files: typeof files;
  http: typeof http;
  invitations: typeof invitations;
  "lib/auth": typeof lib_auth;
  "lib/documentAccess": typeof lib_documentAccess;
  "lib/permissions": typeof lib_permissions;
  "lib/tokens": typeof lib_tokens;
  organizations: typeof organizations;
  presence: typeof presence;
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
