/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    "**/*.test.ts",
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testPathIgnorePatterns : [
    "<rootDir>/dist"
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-tests.ts']
};