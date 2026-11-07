/**
 * Aphrody Better-Auth Production Suite (2026 Edition)
 * Pure Bun v1.4.4+ / Cloudflare D1 + SQLite / rqlite mesh storage.
 * Integrated with Cloudflare Turnstile, Multi-Provider Mail Dispatcher, and full plugin suite.
 */

import { betterAuth } from "better-auth";
import {
  admin,
  bearer,
  captcha,
  magicLink,
  twoFactor,
  organization,
  emailOTP,
  jwt,
  openAPI,
  username,
} from "better-auth/plugins";
import { Database } from "bun:sqlite";
import { MailDispatcher } from "../../mail-templates/src/dispatcher.js";

export interface CreateAphrodyAuthConfig {
  database?: any; // Cloudflare D1 binding or bun:sqlite Database instance
  baseURL?: string;
  secret?: string;
  turnstileSecretKey?: string;
  mailDispatcher?: MailDispatcher;
}

export function createAphrodyAuth(config?: CreateAphrodyAuthConfig) {
  const mail = config?.mailDispatcher || new MailDispatcher();
  const db = config?.database || new Database(":memory:");
  const baseURL = config?.baseURL || process.env.BETTER_AUTH_URL || "https://auth.aphrody.app";
  const secret =
    config?.secret ||
    process.env.BETTER_AUTH_SECRET ||
    "aphrody-production-secret-auth-key-2026-canary-mesh-token";

  // Cloudflare Turnstile credentials
  const turnstileSecret =
    config?.turnstileSecretKey ||
    process.env.TURNSTILE_SECRET_KEY ||
    "0x4AAAAAAF3EuNXkB9uPkUj9KF3_NTlBDsI";

  const auth = betterAuth({
    database: db,
    baseURL,
    secret,
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
        },
        plan: {
          type: "string",
          defaultValue: "starter",
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async (data, request) => {
        const ip = request?.headers?.get("cf-connecting-ip") || "127.0.0.1";
        await mail.send({
          to: data.user.email,
          template: "password-reset",
          templateData: {
            email: data.user.email,
            resetUrl: data.url,
            ipAddress: ip,
          },
        });
      },
    },
    plugins: [
      // 1. Passwordless Magic Link
      magicLink({
        sendMagicLink: async (data, request) => {
          const ip = request?.headers?.get("cf-connecting-ip") || "127.0.0.1";
          await mail.send({
            to: data.email,
            template: "magic-link",
            templateData: {
              email: data.email,
              url: data.url,
              ipAddress: ip,
            },
          });
        },
      }),

      // 2. Two-Factor Authentication (OTP / TOTP)
      twoFactor({
        otpOptions: {
          sendOTP: async (data) => {
            await mail.send({
              to: data.user.email,
              template: "two-factor-code",
              templateData: {
                email: data.user.email,
                code: data.otp,
              },
            });
          },
        },
      }),

      // 3. Organization & Multi-Tenancy
      organization({
        allowUserToCreateOrganization: true,
      }),

      // 4. Admin Role-Based Access Control
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
      }),

      // 5. Bearer Token Authentication
      bearer(),

      // 6. Email OTP Verification
      emailOTP({
        sendVerificationOTP: async (data) => {
          await mail.send({
            to: data.email,
            template: "two-factor-code",
            templateData: {
              email: data.email,
              code: data.otp,
            },
          });
        },
      }),

      // 7. Cloudflare Turnstile Captcha Protection
      captcha({
        provider: "cloudflare-turnstile",
        secretKey: turnstileSecret,
      }),

      // 8. JWT Token Engine
      jwt(),

      // 9. OpenAPI Documentation & Endpoint Discovery
      openAPI(),

      // 10. Username Sign-In
      username(),
    ],
  });

  return auth;
}
