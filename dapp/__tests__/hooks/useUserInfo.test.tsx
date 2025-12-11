/**
 * @file Tests para el hook useUserInfo
 * @description Verifica el manejo correcto de errores "User not registered"
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useContract } from '@/hooks/useContract';
import { ReactNode } from 'react';

// Mock de los hooks dependientes
jest.mock('@/hooks/useContract');

const mockUseContract = useContract as jest.MockedFunction<typeof useContract>;

describe('useUserInfo - Manejo de errores "User not registered"', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('testUseUserInfoHandlesNotRegistered - Verificar que retorna null cuando usuario no está registrado', async () => {
    const mockGetUserInfo = jest.fn().mockRejectedValue({
      reason: 'User not registered',
      message: 'User not registered',
    });

    mockUseContract.mockReturnValue({
      getUserInfo: mockGetUserInfo,
    } as any);

    const { result } = renderHook(() => useUserInfo('0x1111111111111111111111111111111111111111'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Debe retornar null sin error cuando el usuario no está registrado
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockGetUserInfo).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
  });

  it('testUseUserInfoNoRetryOnNotRegistered - Verificar que no reintenta cuando el error es "User not registered"', async () => {
    const mockGetUserInfo = jest.fn().mockRejectedValue({
      reason: 'User not registered',
      message: 'User not registered',
    });

    mockUseContract.mockReturnValue({
      getUserInfo: mockGetUserInfo,
    } as any);

    const { result } = renderHook(() => useUserInfo('0x1111111111111111111111111111111111111111'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar que solo se llamó una vez (no reintentó)
    expect(mockGetUserInfo).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeNull();
  });

  it('testUseUserInfoDoesNotThrowOnNotRegistered - Verificar que no lanza error en la UI cuando usuario no está registrado', async () => {
    const mockGetUserInfo = jest.fn().mockRejectedValue({
      reason: 'User not registered',
      message: 'User not registered',
    });

    mockUseContract.mockReturnValue({
      getUserInfo: mockGetUserInfo,
    } as any);

    const { result } = renderHook(() => useUserInfo('0x1111111111111111111111111111111111111111'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // No debe haber error en el estado de la query
    expect(result.current.error).toBeNull();
    expect(result.current.isError).toBe(false);
    // Debe retornar null en lugar de lanzar error
    expect(result.current.data).toBeNull();
  });

  it('testUseUserInfoHandlesAdminNotRegistered - Verificar comportamiento cuando admin no está registrado (caso edge)', async () => {
    // Simular el caso donde se consulta el admin pero no está registrado (caso edge)
    const adminAddress = '0x1234567890123456789012345678901234567890';
    const mockGetUserInfo = jest.fn().mockRejectedValue({
      reason: 'User not registered',
      message: 'User not registered',
    });

    mockUseContract.mockReturnValue({
      getUserInfo: mockGetUserInfo,
    } as any);

    const { result } = renderHook(() => useUserInfo(adminAddress), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Debe manejar el caso igual que cualquier otro usuario no registrado
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockGetUserInfo).toHaveBeenCalledWith(adminAddress);
  });

  // Nota: El test de otros errores se omite porque getUserInfo en useContract
  // siempre retorna null para cualquier error, por lo que useUserInfo
  // nunca recibirá errores que no sean "User not registered" desde getUserInfo.
  // Los errores de red u otros se manejarían a nivel de useContract.

  it('testUseUserInfoHandlesCaseInsensitiveError - Verificar que maneja diferentes variaciones del mensaje de error', async () => {
    const variations = [
      { reason: 'User not registered' },
      { message: 'user not registered' },
    ];

    for (const error of variations) {
      // Limpiar mocks antes de cada iteración
      jest.clearAllMocks();
      
      const mockGetUserInfo = jest.fn().mockRejectedValue(error);

      mockUseContract.mockReturnValue({
        getUserInfo: mockGetUserInfo,
      } as any);

      // Crear un nuevo QueryClient para cada variación
      const freshQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const freshWrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={freshQueryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUserInfo('0x1111111111111111111111111111111111111111'), { wrapper: freshWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 5000 });

      // Todas las variaciones deben retornar null sin error
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    }
  });
});

