import { render, screen, waitFor } from '@testing-library/react';
import OAuthCallbackPage from './OAuthCallbackPage';
import { authApi } from '@/shared/api/api';

const mockFinishAuthentication = jest.fn();
const mockReplace = jest.fn();
let mockParams = new URLSearchParams();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  useSearchParams: () => mockParams,
}));
jest.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ finishAuthentication: mockFinishAuthentication }),
}));
jest.mock('@/shared/api/api', () => ({
  authApi: { me: jest.fn() },
}));

describe('OAuthCallbackPage', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams();
    jest.clearAllMocks();
  });

  it('loads /me and uses the shared post-auth completion flow', async () => {
    const user = { id: 'user-1', email: 'user@example.com', name: 'User' };
    (authApi.me as jest.Mock).mockResolvedValue({ data: user });

    render(<OAuthCallbackPage />);

    await waitFor(() =>
      expect(mockFinishAuthentication).toHaveBeenCalledWith(user),
    );
  });

  it('shows safe account collision guidance without probing /me', () => {
    mockParams = new URLSearchParams('error=account_exists');

    render(<OAuthCallbackPage />);

    expect(screen.getByText('errors.account_exists')).toBeTruthy();
    expect(screen.getByText('accountExistsHint')).toBeTruthy();
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('returns a successful link flow to profile', () => {
    mockParams = new URLSearchParams('linked=github');

    render(<OAuthCallbackPage />);

    expect(mockReplace).toHaveBeenCalledWith('/profile?oauth=linked&provider=github');
    expect(authApi.me).not.toHaveBeenCalled();
  });
});
