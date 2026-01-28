import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,

  roots: ["<rootDir>/tests"],

  testMatch: ["**/*.test.ts", "**/*.spec.ts"],

  // moduleNameMapper: {
  //   "^@/(.*)$": "<rootDir>/src/$1",
  //   "^@services/(.*)$": "<rootDir>/src/services/$1",
  //   "^@routes/(.*)$": "<rootDir>/src/routes/$1",
  //   "^@utils/(.*)$": "<rootDir>/src/utils/$1",
  //   "^@types/(.*)$": "<rootDir>/src/types/$1",
  //   "^@config/(.*)$": "<rootDir>/src/config/$1",
  //   "^@fixtures/(.*)$": "<rootDir>/src/fixtures/$1",
  //   "^@enums/(.*)$": "<rootDir>/src/enums/$1",
  // },

  clearMocks: true,
  moduleFileExtensions: ["ts", "js", "json", "node"],
  
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],

};

export default config;
