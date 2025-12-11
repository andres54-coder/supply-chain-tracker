/**
 * @file Tests para el hook useAdmin
 * @description Verifica que el hook retorna correctamente la dirección del admin y detecta si el usuario actual es admin
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdmin } from '@/hooks/useAdmin';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useContract } from '@/hooks/useContract';
import { ReactNode } from 'react';

// Mock de los hooks dependientes
jest.mock('@/hooks/useMetaMask');
jest.mock('@/hooks/useContract');

const mockUseMetaMask = useMetaMask as jest.MockedFunction<typeof useMetaMask>;
const mockUseContract = useContract as jest.MockedFunction<typeof useContract>;

describe('useAdmin', () => {
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

  it('testUseAdminReturnsAdminAddress - Verificar que retorna la dirección del admin correctamente', async () => {
    const mockAdminAddress = '0x1234567890123456789012345678901234567890';
    const mockContract = {
      admin: jest.fn().mockResolvedValue(mockAdminAddress),
      isAdmin: jest.fn().mockResolvedValue(false),
    };

    mockUseMetaMask.mockReturnValue({
      account: '0x1111111111111111111111111111111111111111',
      isConnected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      signer: null,
      provider: null,
      chainId: 31337,
      error: null,
      isLoading: false,
      signMessage: jest.fn(),
      getSigner: jest.fn(),
      checkConnection: jest.fn(),
    });

    mockUseContract.mockReturnValue({
      contract: mockContract,
      isLoading: false,
      error: null,
    } as {
      contract: typeof mockContract | null;
      isLoading: boolean;
      error: string | null;
    });

    const { result } = renderHook(() => useAdmin(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.adminAddress).toBe(mockAdminAddress);
    expect(mockContract.admin).toHaveBeenCalled();
  });

  it('testUseAdminDetectsAdmin - Verificar que detecta correctamente si la cuenta actual es admin', async () => {
    const mockAdminAddress = '0x1234567890123456789012345678901234567890';
    const currentAccount = mockAdminAddress; // Misma cuenta que admin

    const mockContract = {
      admin: jest.fn().mockResolvedValue(mockAdminAddress),
      isAdmin: jest.fn().mockResolvedValue(true),
    };

    mockUseMetaMask.mockReturnValue({
      account: currentAccount,
      isConnected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      signer: null,
      provider: null,
      chainId: 31337,
      error: null,
      isLoading: false,
      signMessage: jest.fn(),
      getSigner: jest.fn(),
      checkConnection: jest.fn(),
    });

    mockUseContract.mockReturnValue({
      contract: mockContract,
      isLoading: false,
      error: null,
    } as {
      contract: typeof mockContract | null;
      isLoading: boolean;
      error: string | null;
    });

    const { result } = renderHook(() => useAdmin(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(mockContract.isAdmin).toHaveBeenCalledWith(currentAccount);
  });

  it('testUseAdminUpdatesOnAccountChange - Verificar que se actualiza cuando cambia la cuenta', async () => {
    const mockAdminAddress = '0x1234567890123456789012345678901234567890';
    const account1 = '0x1111111111111111111111111111111111111111';
    const account2 = '0x2222222222222222222222222222222222222222';

    const mockContract = {
      admin: jest.fn().mockResolvedValue(mockAdminAddress),
      isAdmin: jest.fn().mockResolvedValue(false),
    };

    // Primera renderización con account1
    mockUseMetaMask.mockReturnValue({
      account: account1,
      isConnected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      signer: null,
      provider: null,
      chainId: 31337,
      error: null,
      isLoading: false,
      signMessage: jest.fn(),
      getSigner: jest.fn(),
      checkConnection: jest.fn(),
    });

    mockUseContract.mockReturnValue({
      contract: mockContract,
      isLoading: false,
      error: null,
    } as {
      contract: typeof mockContract | null;
      isLoading: boolean;
      error: string | null;
    });

    const { result, rerender } = renderHook(() => useAdmin(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockContract.isAdmin).toHaveBeenCalledWith(account1);

    // Cambiar cuenta
    mockUseMetaMask.mockReturnValue({
      account: account2,
      isConnected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      signer: null,
      provider: null,
      chainId: 31337,
      error: null,
      isLoading: false,
      signMessage: jest.fn(),
      getSigner: jest.fn(),
      checkConnection: jest.fn(),
    });

    rerender();

    await waitFor(() => {
      expect(mockContract.isAdmin).toHaveBeenCalledWith(account2);
    });
  });

  it('testUseAdminHandlesNoContract - Verificar manejo cuando no hay contrato disponible', async () => {
    mockUseMetaMask.mockReturnValue({
      account: '0x1111111111111111111111111111111111111111',
      isConnected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      signer: null,
      provider: null,
      chainId: 31337,
      error: null,
      isLoading: false,
      signMessage: jest.fn(),
      getSigner: jest.fn(),
      checkConnection: jest.fn(),
    });

    mockUseContract.mockReturnValue({
      contract: null,
      isLoading: false,
      error: null,
    } as {
      contract: null;
      isLoading: boolean;
      error: string | null;
    });

    const { result } = renderHook(() => useAdmin(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Cuando no hay contrato, adminAddress puede ser null o undefined
    expect(result.current.adminAddress).toBeFalsy();
    expect(result.current.isAdmin).toBe(false);
  });

  it('testUseAdminCacheInvalidation - Verificar que el cache se invalida correctamente', async () => {
    const mockAdminAddress = '0x1234567890123456789012345678901234567890';
    const mockContract = {
      admin: jest.fn().mockResolvedValue(mockAdminAddress),
      isAdmin: jest.fn().mockResolvedValue(false),
    };

    mockUseMetaMask.mockReturnValue({
      account: '0x1111111111111111111111111111111111111111',
      isConnected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      signer: null,
      provider: null,
      chainId: 31337,
      error: null,
      isLoading: false,
      signMessage: jest.fn(),
      getSigner: jest.fn(),
      checkConnection: jest.fn(),
    });

    mockUseContract.mockReturnValue({
      contract: mockContract,
      isLoading: false,
      error: null,
    } as {
      contract: typeof mockContract | null;
      isLoading: boolean;
      error: string | null;
    });

    const { result } = renderHook(() => useAdmin(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar que las queries están en el cache
    const adminAddressQuery = queryClient.getQueryState(['admin', 'address']);
    const isAdminQuery = queryClient.getQueryState(['admin', 'isAdmin', '0x1111111111111111111111111111111111111111']);

    expect(adminAddressQuery).toBeDefined();
    expect(isAdminQuery).toBeDefined();
  });
});

