module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@kolab/auth$': '<rootDir>/../../packages/auth/src/index.ts',
    '^@kolab/config$': '<rootDir>/../../packages/config/src/index.ts',
    '^@kolab/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@kolab/storage$': '<rootDir>/../../packages/storage/src/index.ts',
    '^@kolab/types$': '<rootDir>/../../packages/types/src/index.ts',
  },
};
