// Provider abstraction for e-signing. Real providers (BankID, Signicat, etc.)
// implement this interface. The mock adapter is used in dev/test.

export interface SigningProvider {
  name: string;
  // Initiate a signing request. Returns an external reference ID.
  initiateRequest(params: {
    signerEmail: string;
    signerName: string;
    documentTitle: string;
    documentKey: string;   // storage path
    expiresInDays?: number;
  }): Promise<{ externalId: string; expiresAt: Date }>;

  // Get current status from provider (for webhook fallback / polling).
  getStatus(externalId: string): Promise<"PENDING" | "SIGNED" | "REJECTED" | "EXPIRED">;
}
