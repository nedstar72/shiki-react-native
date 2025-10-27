/**
 * @type {import('jest').Config}
 */
const config = {
  preset: 'jest-expo',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts(x)?'],
};

module.exports = config;
