// Mock e-signing adapter — simulates the signing flow without any real provider.
// Replace with a real adapter (BankID, Signicat, etc.) when ready.

import type { SigningProvider } from "./provider";

export const mockSigningProvider: SigningProvider = {
  name: "MOCK",

  async initiateRequest({ expiresInDays = 30 }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    return {
      externalId: `mock-${Date.now()}`,
      expiresAt,
    };
  },

  async getStatus(_externalId) {
    // Mock always returns PENDING until the user explicitly signs in the app
    return "PENDING";
  },
};
