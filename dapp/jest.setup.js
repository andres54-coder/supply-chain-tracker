// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock de react-dom/test-utils para usar React.act correctamente
// Esto es necesario porque react-dom/test-utils busca React.act pero no lo encuentra en React 19
jest.mock('react-dom/test-utils', () => {
  const React = require('react')
  return {
    ...jest.requireActual('react-dom/test-utils'),
    act: React.act || ((callback) => callback()),
  }
})

// Nota: El polyfill de React.act se ejecuta en jest.polyfill.js
// que se carga ANTES de este archivo (setupFiles vs setupFilesAfterEnv)

// Mock window.ethereum for MetaMask tests
if (typeof window !== 'undefined') {
  window.ethereum = {
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    isMetaMask: true,
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
}))

