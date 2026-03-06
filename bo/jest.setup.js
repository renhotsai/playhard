// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock fetch for contract tests
global.fetch = jest.fn()

// Reset mocks after each test
afterEach(() => {
  jest.resetAllMocks()
})