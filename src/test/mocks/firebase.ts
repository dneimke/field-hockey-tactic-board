import { vi } from 'vitest';

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    callback(null);
    return vi.fn(); // Return unsubscribe function
  }),
};

// Mock Firebase Firestore
export const mockFirestore = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ exists: false, data: () => null })),
      set: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
    })),
    getDocs: vi.fn(() => Promise.resolve({ forEach: vi.fn() })),
    query: vi.fn((ref) => ref),
    orderBy: vi.fn(() => ({})),
  })),
  doc: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve({ exists: false, data: () => null })),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  })),
};

// Mock Firebase Functions
export const mockFunctions = {
  httpsCallable: vi.fn(() => vi.fn(() => Promise.resolve({ data: { text: '{}' } }))),
};

// Mock Firebase module
vi.mock('../firebase', () => ({
  auth: mockAuth,
  db: mockFirestore,
  functions: mockFunctions,
}));

