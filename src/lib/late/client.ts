import Late from "@getlatedev/node";

let serverClient: Late | null = null;

/**
 * Get a server-side Late API client singleton.
 * Uses the LATE_API_KEY environment variable.
 */
export function getLateClient(): Late {
  if (!serverClient) {
    const apiKey = process.env.LATE_API_KEY;
    if (!apiKey) {
      throw new Error("LATE_API_KEY environment variable is not set");
    }
    serverClient = new Late({ apiKey });
  }
  return serverClient;
}
