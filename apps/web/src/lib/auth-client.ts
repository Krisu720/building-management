"use client";

import { createAuthClient } from "better-auth/react";

// Same-origin requests are forwarded to NestJS by next.config.ts.
export const authClient = createAuthClient({});

