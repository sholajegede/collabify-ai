import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup stale presence",
  { minutes: 5 },
  internal.presence.cleanupStale
);

export default crons;