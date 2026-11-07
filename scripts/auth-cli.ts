#!/usr/bin/env bun
/**
 * Aphrody & YOLO Universal Identity & Auth Management CLI
 * Command-line utility to migrate schemas, manage users, and test all 11 providers.
 */

import { IdentityDatabase } from "../packages/better-auth-full/src/db/adapter";
import { ProviderRegistry } from "../packages/better-auth-full/src/providers/index";
import { PasswordVaultEngine } from "../packages/better-auth-full/src/vault/index";

const [command, ...args] = process.argv.slice(2);

async function main() {
  const db = new IdentityDatabase();

  switch (command) {
    case "db:migrate": {
      console.log(
        `Running identity migrations for engine: ${db.getEngine()}...`,
      );
      await db.migrate();
      console.log("Migration executed successfully!");
      break;
    }

    case "user:create": {
      const [email, name, role] = args;
      if (!email || !name) {
        console.error(
          "Usage: bun run scripts/auth-cli.ts user:create <email> <name> [role=user|admin]",
        );
        process.exit(1);
      }
      await db.ensureReady();
      const user = await db.createUser({
        id: `usr_${Date.now()}`,
        email,
        name,
        username: email.split("@")[0],
        emailVerified: true,
        role: (role as any) || "user",
        banned: false,
      });
      console.log("Created User:", user);
      break;
    }

    case "vault:generate-password": {
      const length = Number(args[0]) || 24;
      const pwd = PasswordVaultEngine.generateStrongPassword(length);
      console.log(`Generated Password (${length} chars): ${pwd}`);
      break;
    }

    case "provider:test": {
      const provider = args[0] || "google";
      const providers = ProviderRegistry.getProviders();
      const target = (providers as any)[provider];
      if (!target) {
        console.error(
          `Unknown provider '${provider}'. Supported: ${Object.keys(providers).join(", ")}`,
        );
        process.exit(1);
      }
      const authUrl = target.getAuthorizationUrl
        ? target.getAuthorizationUrl("test-state-123")
        : "N/A";
      console.log(`[${provider.toUpperCase()}] Authorization URL:`);
      console.log(authUrl);
      break;
    }

    default: {
      console.log(`
Aphrody & YOLO Universal Auth CLI
Available Commands:
  db:migrate                      Execute PostgreSQL / SQLite identity schema migrations
  user:create <email> <name>      Create a new identity user
  vault:generate-password [len]   Generate a cryptographically strong password
  provider:test <provider>        Generate and test provider authorization URL
      `);
      break;
    }
  }
}

main().catch((err) => {
  console.error("Auth CLI Error:", err);
  process.exit(1);
});
