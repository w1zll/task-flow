import { render, waitFor } from '@testing-library/react';
import AuthHydrator from './AuthHydrator';
import { authApi } from '@/shared/api/api';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/shared/store/root.store';
import {
  isBrowserOffline,
  markNetworkOffline,
} from '@/shared/lib/offline';

jest.mock('@/shared/api/api');
jest.mock('next/navigation');
jest.mock('@/shared/store/root.store', () => ({
  useAuthStore: jest.fn(),
}));
jest.mock('@/shared/lib/auth-session', () => ({
  readStoredAuthUser: jest.fn(() => ({ id: 'cached-user' })),
  writeStoredAuthUser: jest.fn(),
}));
jest.mock('@/shared/lib/offline');

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockIsBrowserOffline = isBrowserOffline as jest.MockedFunction<
  typeof isBrowserOffline
>;
const mockMarkNetworkOffline = markNetworkOffline as jest.MockedFunction<
  typeof markNetworkOffline
>;

describe('AuthHydrator', () => {
  const store = {
    user: null,
    isLoading: true,
    hydrate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector: any) => selector(store));
  });

  it('clears auth state on auth routes', () => {
    mockUsePathname.mockReturnValue('/auth/login');
    mockIsBrowserOffline.mockReturnValue(false);

    render(<AuthHydrator />);

    expect(store.hydrate).toHaveBeenCalledWith(null);
    expect(mockAuthApi.me).not.toHaveBeenCalled();
  });

  it('hydrates from /api/auth/me on protected routes when auth is missing or loading', async () => {
    mockUsePathname.mockReturnValue('/profile');
    mockIsBrowserOffline.mockReturnValue(false);
    mockAuthApi.me.mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      } as any,
    } as any);

    render(<AuthHydrator />);

    await waitFor(() => {
      expect(mockAuthApi.me).toHaveBeenCalledWith({ timeout: 5000 });
      expect(store.hydrate).toHaveBeenCalledWith({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  it('hydrates from cache and marks offline when the startup auth probe has no response', async () => {
    mockUsePathname.mockReturnValue('/workspaces');
    mockIsBrowserOffline.mockReturnValue(false);
    mockAuthApi.me.mockRejectedValue(new Error('timeout'));

    render(<AuthHydrator />);

    await waitFor(() => {
      expect(mockAuthApi.me).toHaveBeenCalledWith({ timeout: 5000 });
      expect(mockMarkNetworkOffline).toHaveBeenCalled();
      expect(store.hydrate).toHaveBeenCalledWith({ id: 'cached-user' });
    });
  });
});
