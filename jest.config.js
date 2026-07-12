/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Phase 1-2 tests are pure logic + SQLite (no React Native), so a plain
  // ts-jest/node runner is enough. Component tests (Phase 4) will add jest-expo.
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/services/**/*.ts', 'src/lib/**/*.ts'],
  // Native-module wrappers (ML Kit, image manipulator) can't run in Node.
  coveragePathIgnorePatterns: [
    'src/services/ocr-service.ts',
    'src/services/image.ts',
    'src/services/export.ts',
  ],
  coverageThreshold: {
    'src/lib/**/*.ts': { lines: 80 },
    'src/services/receipt-parser.ts': { lines: 100, functions: 100 },
    'src/services/category-rules.ts': { lines: 100, functions: 100 },
  },
};
