import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";

export async function getAuthenticatedUser() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
