// Temporary API service without Firebase
// This will be replaced with Firebase later

interface User {
  id: string;
  name: string;
  email: string;
}

// Mock data for development
const mockUsers: User[] = [
  { id: '1', name: 'Test User', email: 'test@example.com' }
];

export const api = {
  // Auth
  login: async (email: string, _password?: string) => {
    console.log('Mock login:', email);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { user: mockUsers[0], token: 'mock-token' };
  },
  
  logout: async () => {
    console.log('Mock logout');
    return true;
  },
  
  // Users
  getUsers: async () => {
    return mockUsers;
  },
  
  getUser: async (id: string) => {
    return mockUsers.find(u => u.id === id);
  },
  
  // Posts/Data
  getPosts: async () => {
    return [
      { id: '1', title: 'Mock Post 1', content: 'Content 1' },
      { id: '2', title: 'Mock Post 2', content: 'Content 2' }
    ];
  }
};
