import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

type KindeEventData = {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string | null;
    picture?: string | null;
  };
};

type KindeEvent = {
  type: string;
  data: KindeEventData;
};

const http = httpRouter();

const handleKindeWebhook = httpAction(async (ctx, request) => {
  const event = await validateKindeRequest(request);

  if (!event) {
    return new Response("Invalid request", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
      await ctx.runMutation(internal.users.createUser, {
        kindeId: event.data.user.id,
        email: event.data.user.email,
        name:
          `${event.data.user.first_name ?? ""} ${event.data.user.last_name ?? ""}`.trim() ||
          "User",
        givenName: event.data.user.first_name ?? undefined,
        familyName: event.data.user.last_name ?? undefined,
        picture: event.data.user.picture ?? undefined,
      });
      break;

    case "user.updated": {
      const user = await ctx.runQuery(internal.users.getUserByKindeId, {
        kindeId: event.data.user.id,
      });
      if (user) {
        await ctx.runMutation(internal.users.updateUser, {
          kindeId: event.data.user.id,
          email: event.data.user.email,
          name:
            `${event.data.user.first_name ?? ""} ${event.data.user.last_name ?? ""}`.trim() ||
            "User",
          givenName: event.data.user.first_name ?? undefined,
          familyName: event.data.user.last_name ?? undefined,
          picture: event.data.user.picture ?? undefined,
        });
      }
      break;
    }

    case "user.deleted": {
      const user = await ctx.runQuery(internal.users.getUserByKindeId, {
        kindeId: event.data.user.id,
      });
      if (user) {
        await ctx.runMutation(internal.users.deleteUser, {
          kindeId: event.data.user.id,
        });
      }
      break;
    }

    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  return new Response(null, { status: 200 });
});

async function validateKindeRequest(request: Request): Promise<KindeEvent | null> {
  try {
    if (request.headers.get("content-type") !== "application/jwt") {
      console.error("Invalid Content-Type. Expected application/jwt");
      return null;
    }

    const token = await request.text(); // JWT is sent as raw text in the body.
    const JWKS_URL = `${process.env.KINDE_ISSUER_URL}/.well-known/jwks.json`;
    const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

    const { payload } = await jwtVerify(token, JWKS);

    if (
      typeof payload === "object" &&
      payload !== null &&
      "type" in payload &&
      "data" in payload
    ) {
      return {
        type: payload.type as string,
        data: payload.data as KindeEventData,
      };
    } else {
      console.error("Payload does not match the expected structure");
      return null;
    }
  } catch (error) {
    console.error("JWT verification failed", error);
    return null;
  }
}

http.route({
  path: "/kinde",
  method: "POST",
  handler: handleKindeWebhook,
});

export default http;