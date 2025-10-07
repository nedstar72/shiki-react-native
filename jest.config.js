/**
 * @type {import('jest').Config}
 */
const config = {
  preset: 'jest-expo',
  verbose: true,
  testMatch: ['<rootDir>/src/**/*.spec.ts(x)?'],
};

module.exports = config;
