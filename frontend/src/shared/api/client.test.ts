import axios from 'axios';

jest.mock('axios');

describe('apiClient refresh handling', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  const createInstance = () => {
    const instance: any = jest.fn();
    instance.get = jest.fn();
    instance.post = jest.fn();
    instance.interceptors = {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    };
    return instance;
  };

  it('retries /api/auth/me after a refresh', async () => {
    const instance = createInstance();
    let responseErrorHandler: any;

    instance.interceptors.response.use.mockImplementation(
      (_fulfilled: unknown, rejected: unknown) => {
        responseErrorHandler = rejected;
      },
    );
    mockedAxios.create.mockReturnValue(instance);

    let apiClient: any;
    jest.isolateModules(() => {
      apiClient = require('./client').apiClient;
    });

    instance.post.mockResolvedValueOnce({ data: {} });
    instance.mockResolvedValueOnce({ data: { id: 'user-1' } });

    const error = {
      response: { status: 401 },
      config: { url: '/api/auth/me', method: 'get' },
    };

    const result = await responseErrorHandler(error);

    expect(instance.post).toHaveBeenCalledWith('/api/auth/refresh');
    expect(instance).toHaveBeenCalledWith({
      url: '/api/auth/me',
      method: 'get',
      _retry: true,
    });
    expect(result).toEqual({ data: { id: 'user-1' } });
    expect(apiClient).toBe(instance);
  });
});
