import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request): Promise<NextResponse> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  // using ngrok for local development and fallback to the public URL for production or staging
  let callbackUrl: string;
  if (process.env.NODE_ENV === "development") {
    callbackUrl = `${process.env.NEXT_PUBLIC_NGROK_URL}/api/blob/upload/client/webhook`;
  } else {
    callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/blob/upload/client/webhook`;
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Generate a client token for the browser to upload the file
        // Make sure to authenticate and authorize users before generating the token.
        // Otherwise, you're allowing anonymous uploads.

        const metadata = clientPayload ? JSON.parse(clientPayload) : {};
        console.log("client payload / metadata:", metadata);

        // Note: File type validation is handled on the frontend
        // We allow all content types here for flexibility
        return {
          // Commented out to allow all content types for flexibility
          /*  allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "text/plain",
            "text/markdown",
            "application/pdf",
            "application/mp4",
            "video/mp4",
            "video/quicktime", // .mov
            "application/x-mpegURL",
          ], */
          addRandomSuffix: true,
          // callbackUrl: 'https://example.com/api/avatar/upload',
          // optional, `callbackUrl` is automatically computed when hosted on Vercel

          callbackUrl: callbackUrl,
          tokenPayload: JSON.stringify({
            clerkUserId: clerkUserId,
            ...metadata,
            // optional, sent to your server on upload completion
            // you could pass a user id from auth, or a value from clientPayload
          }),
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Called by Vercel API on client upload completion
        // Use tools like ngrok if you want this to work locally

        console.log("blob upload completed", blob, tokenPayload);
        console.log(
          "handled by a webhook, url passed to the client as call back url"
        );
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}
