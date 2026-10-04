// Two projects:
//  - unit:        src/**/*.test.js, repositories mocked, no database.
//  - integration: tests/**/*.test.js, Supertest + repositories against the
//                 local imizamo_test database (rebuilt once by global-setup).
// Both load tests/setup-env.js so the real .env is never read.
const shared = {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['<rootDir>/tests/setup-env.js'],
}

export default {
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/server.js', '!src/db/seed*.js'],
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.js'],
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      globalSetup: '<rootDir>/tests/global-setup.js',
      setupFilesAfterEnv: ['<rootDir>/tests/setup-integration.js'],
    },
  ],
}
