"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";


// Both authentication and application API requests use the Next.js proxy.
export const authClient = createAuthClient({
  plugins: [adminClient()],
});
