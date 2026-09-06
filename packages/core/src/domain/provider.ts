export type ProviderVerificationStatus = "unverified" | "pending" | "verified";

export type ProviderStatus = "draft" | "active" | "suspended" | "archived";

export interface Provider {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly domain: string;
  readonly canonicalUrl: string;
  readonly description: string;
  readonly verificationStatus: ProviderVerificationStatus;
  readonly status: ProviderStatus;
  readonly lastIndexedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
