import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      department: { type: "string", required: false, input: false },
      title: { type: "string", required: false, input: false },
      avatarColor: { type: "string", required: false, input: false },
    },
  },
  plugins: [
    admin({
      defaultRole: "employee",
      adminRoles: ["admin"],
    }),
  ],
  advanced: {
    database: {
      joins: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
