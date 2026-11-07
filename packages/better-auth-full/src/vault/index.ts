/**
 * Aphrody & YOLO Zero-Knowledge Password & Credential Vault (2026 Edition)
 * Native AES-256-GCM + PBKDF2/SHA-512 encryption engine.
 * Stores credentials, OAuth tokens, and API keys securely with zero emoji.
 */

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
} from "node:crypto";

export interface EncryptedPayload {
  cipherText: string;
  nonce: string;
  tag: string;
  salt: string;
}

export interface PasswordItem {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  folder?: string;
  favorite?: boolean;
}

export class PasswordVaultEngine {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 600000; // OWASP 2026 PBKDF2-HMAC-SHA512 standard

  /**
   * Derives a 256-bit encryption key from a master secret and salt using PBKDF2-HMAC-SHA512.
   */
  public static deriveKey(masterPassword: string, salt: Buffer): Buffer {
    return pbkdf2Sync(
      masterPassword,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      "sha512",
    );
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   */
  public static encrypt(
    plainText: string,
    masterPassword: string,
  ): EncryptedPayload {
    const salt = randomBytes(this.SALT_LENGTH);
    const key = this.deriveKey(masterPassword, salt);
    const nonce = randomBytes(this.IV_LENGTH);

    const cipher = createCipheriv(this.ALGORITHM, key, nonce);
    let cipherText = cipher.update(plainText, "utf8", "base64");
    cipherText += cipher.final("base64");
    const tag = cipher.getAuthTag().toString("base64");

    return {
      cipherText,
      nonce: nonce.toString("base64"),
      tag,
      salt: salt.toString("base64"),
    };
  }

  /**
   * Decrypts an AES-256-GCM payload.
   */
  public static decrypt(
    payload: EncryptedPayload,
    masterPassword: string,
  ): string {
    const salt = Buffer.from(payload.salt, "base64");
    const key = this.deriveKey(masterPassword, salt);
    const nonce = Buffer.from(payload.nonce, "base64");
    const tag = Buffer.from(payload.tag, "base64");

    const decipher = createDecipheriv(this.ALGORITHM, key, nonce);
    decipher.setAuthTag(tag);

    let plainText = decipher.update(payload.cipherText, "base64", "utf8");
    plainText += decipher.final("utf8");
    return plainText;
  }

  /**
   * Generates a cryptographically strong, high-entropy password.
   */
  public static generateStrongPassword(
    length = 24,
    options: { symbols?: boolean; numbers?: boolean; uppercase?: boolean } = {},
  ): string {
    const lowercase = "abcdefghjkmnpqrstuvwxyz";
    const uppercase =
      options.uppercase !== false ? "ABCDEFGHJKMNPQRSTUVWXYZ" : "";
    const numbers = options.numbers !== false ? "23456789" : "";
    const symbols = options.symbols !== false ? "!@#$%^&*()-_=+[]{}<>?" : "";
    const charset = lowercase + uppercase + numbers + symbols;

    const bytes = randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset[bytes[i] % charset.length];
    }
    return password;
  }

  /**
   * Formats credentials for Chrome / Bitwarden CSV import.
   */
  public static exportToCsv(items: PasswordItem[]): string {
    const header = "name,url,username,password,note";
    const rows = items.map((item) => {
      const escape = (val = "") => `"${val.replace(/"/g, '""')}"`;
      return [
        escape(item.title),
        escape(item.url || ""),
        escape(item.username),
        escape(item.password),
        escape(item.notes || ""),
      ].join(",");
    });
    return [header, ...rows].join("\n");
  }
}
