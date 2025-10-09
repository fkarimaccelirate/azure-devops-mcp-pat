// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it, jest, beforeEach } from "@jest/globals";

// Mock the Azure Identity modules before importing the auth module
jest.mock("@azure/identity", () => ({
  AzureCliCredential: jest.fn(),
  ChainedTokenCredential: jest.fn(),
  DefaultAzureCredential: jest.fn(),
}));

jest.mock("@azure/msal-node", () => ({
  PublicClientApplication: jest.fn(),
}));

jest.mock("open", () => jest.fn());

import { createAuthenticator } from "../../src/auth.js";

describe("createAuthenticator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("PAT authentication", () => {
    it("should return PAT when using pat authentication type", async () => {
      const testPat = "test-pat-token-12345";
      const authenticator = createAuthenticator("pat", undefined, testPat);
      
      const token = await authenticator();
      
      expect(token).toBe(testPat);
    });

    it("should throw error when PAT is not provided", () => {
      expect(() => {
        createAuthenticator("pat", undefined, undefined);
      }).toThrow("PAT (Personal Access Token) is required when using 'pat' authentication type.");
    });

    it("should throw error when PAT is empty string", () => {
      expect(() => {
        createAuthenticator("pat", undefined, "");
      }).toThrow("PAT (Personal Access Token) is required when using 'pat' authentication type.");
    });

    it("should work with long PAT tokens", async () => {
      const longPat = "a".repeat(500);
      const authenticator = createAuthenticator("pat", undefined, longPat);
      
      const token = await authenticator();
      
      expect(token).toBe(longPat);
    });
  });
});
