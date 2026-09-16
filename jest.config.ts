import type { Config } from "jest";
import nextJest from "next/jest.js";

// Times in the profile are rendered in the viewer's own zone, so a test machine
// in another country must not change a result. UTC everywhere.
process.env.TZ = "UTC";

// Matches PDGMS-Frontend's setup deliberately: the tests here are written to be
// ported into that repo unchanged, so they must run under the same transform.
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default createJestConfig(config);
