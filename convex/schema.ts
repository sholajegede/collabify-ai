// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    kindeOrgCode: v.optional(v.string()),
    ownerId: v.id("users"),
    settings: v.object({
      allowInvitations: v.boolean(),
      defaultMemberRole: v.string(),
      maxStorageMB: v.number(),
      maxJobsPerMinute: v.number(),
    }),
  })
    .index("by_slug", ["slug"])
    .index("by_kindeOrgCode", ["kindeOrgCode"])
    .index("by_owner", ["ownerId"]),

  users: defineTable({
    kindeId: v.string(),
    email: v.string(),
    name: v.string(),
    givenName: v.optional(v.string()),
    familyName: v.optional(v.string()),
    picture: v.optional(v.string()),
  })
    .index("by_kindeId", ["kindeId"])
    .index("by_email", ["email"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.string(),
    joinedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_and_user", ["organizationId", "userId"]),

  documents: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    content: v.string(),
    aiAnalysis: v.optional(
      v.object({
        summary: v.string(),
        keywords: v.array(v.string()),
        sentiment: v.string(),
        processedAt: v.number(),
      })
    ),
    createdBy: v.id("users"),
    lastModifiedAt: v.number(),
  }).index("by_organization", ["organizationId"]),

  invitations: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.string(),
    token: v.string(),
    invitedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    acceptedBy: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_org_and_email", ["organizationId", "email"]),

  documentShares: defineTable({
    documentId: v.id("documents"),
    sharedWithUserId: v.id("users"),
    sharedByUserId: v.id("users"),
    permissions: v.array(v.string()),
    expiresAt: v.optional(v.number()),
    lastAccessedAt: v.optional(v.number()),
    accessCount: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_shared_with", ["sharedWithUserId"])
    .index("by_document_and_user", ["documentId", "sharedWithUserId"]),

  comments: defineTable({
    documentId: v.id("documents"),
    authorId: v.id("users"),
    authorName: v.string(),
    authorPicture: v.optional(v.string()),
    content: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    resolved: v.optional(v.boolean()),
  })
    .index("by_document", ["documentId"])
    .index("by_author", ["authorId"]),

  accessLogs: defineTable({
    userId: v.id("users"),
    resourceType: v.string(),
    resourceId: v.string(),
    action: v.string(),
    organizationId: v.optional(v.id("organizations")),
    metadata: v.optional(
      v.object({
        sharedAccess: v.optional(v.boolean()),
      })
    ),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_organization", ["organizationId"]),

  presence: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    lastSeen: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_document_and_user", ["documentId", "userId"])
    .index("by_last_seen", ["lastSeen"]),

  documentVersions: defineTable({
    documentId: v.id("documents"),
    version: v.number(),
    title: v.string(),
    content: v.string(),
    createdBy: v.id("users"),
    changeDescription: v.optional(v.string()),
  }).index("by_document", ["documentId"]),
});