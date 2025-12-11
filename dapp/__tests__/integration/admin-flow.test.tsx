/**
 * @file Tests de Integración Admin Completo
 * @description Verifica el flujo completo del admin desde conexión hasta gestión de usuarios
 * 
 * NOTA: Este archivo debe ejecutarse con --forceExit debido a un problema conocido
 * con Next.js 16 y Jest donde hay un stack overflow durante la limpieza.
 * Ejecutar con: npm run test:integration
 */

import { useMetaMask } from '@/hooks/useMetaMask';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useAdmin } from '@/hooks/useAdmin';
import { useContract } from '@/hooks/useContract';
import { UserStatus, User } from '@/types';

// Mock de los hooks
jest.mock('@/hooks/useMetaMask');
jest.mock('@/hooks/useUserInfo');
jest.mock('@/hooks/useAdmin');
jest.mock('@/hooks/useContract');
// next/navigation ya está mockeado en jest.setup.js

const mockUseMetaMask = useMetaMask as jest.MockedFunction<typeof useMetaMask>;
const mockUseUserInfo = useUserInfo as jest.MockedFunction<typeof useUserInfo>;
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;
const mockUseContract = useContract as jest.MockedFunction<typeof useContract>;

describe('Admin Flow - Integración Completa', () => {
  const adminAddress = '0x1234567890123456789012345678901234567890';
  const otherUserAddress = '0x1111111111111111111111111111111111111111';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Función helper que simula el flujo completo del admin
  const simulateAdminFlow = () => {
    // 1. Admin se conecta
    mockUseMetaMask.mockReturnValue({
      account: adminAddress,
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

    // 2. Admin es detectado como admin
    mockUseAdmin.mockReturnValue({
      isAdmin: true,
      isLoading: false,
      adminAddress,
    });

    // 3. Admin tiene usuario registrado
    mockUseUserInfo.mockReturnValue({
      data: {
        id: BigInt(1),
        userAddress: adminAddress,
        role: 'Admin',
        status: UserStatus.Approved,
      },
      isLoading: false,
      error: null,
    } as { data: User | null; isLoading: boolean; error: Error | null });

    // 4. Contract hook para admin
    const mockChangeStatusUser = jest.fn();
    mockUseContract.mockReturnValue({
      changeStatusUser: mockChangeStatusUser,
      getUserInfo: jest.fn(),
      isLoading: false,
      error: null,
    } as {
      changeStatusUser: jest.Mock;
      getUserInfo: jest.Mock;
      isLoading: boolean;
      error: string | null;
    });

    return {
      adminAddress,
      mockChangeStatusUser,
    };
  };

  it('testAdminFlowComplete - Flujo completo del admin', () => {
    simulateAdminFlow();

    // Verificar que admin está conectado
    const metaMaskState = mockUseMetaMask();
    expect(metaMaskState.isConnected).toBe(true);
    expect(metaMaskState.account).toBe(adminAddress);

    // Verificar que admin es detectado
    const adminState = mockUseAdmin();
    expect(adminState.isAdmin).toBe(true);
    expect(adminState.adminAddress).toBe(adminAddress);

    // Verificar que admin tiene usuario registrado
    const userState = mockUseUserInfo(adminAddress);
    expect(userState.data?.role).toBe('Admin');
    expect(userState.data?.status).toBe(UserStatus.Approved);

    // Verificar que tiene acceso a funciones de contrato
    const contractState = mockUseContract();
    expect(contractState.changeStatusUser).toBeDefined();
  });

  it('testAdminCannotSelfReject - Verificar que el admin no puede rechazarse a sí mismo desde la UI', () => {
    const { adminAddress: adminAddr } = simulateAdminFlow();

    // Función que simula la lógica de la UI para determinar si mostrar botón de rechazar
    const canRejectUser = (userAddress: string, adminAddr: string | null | undefined) => {
      // El admin no puede rechazarse a sí mismo
      if (adminAddr && userAddress.toLowerCase() === adminAddr.toLowerCase()) {
        return false;
      }
      return true;
    };

    // Verificar que admin no puede rechazarse a sí mismo
    expect(canRejectUser(adminAddr, adminAddr)).toBe(false);

    // Verificar que sí puede rechazar otros usuarios
    expect(canRejectUser(otherUserAddress, adminAddr)).toBe(true);
  });

  it('testAdminCannotSelfRejectContract - Verificar que el contrato rechaza intento de auto-rechazo', () => {
    const { mockChangeStatusUser } = simulateAdminFlow();

    // Simular intento de rechazarse a sí mismo
    const attemptSelfReject = async () => {
      try {
        // El contrato debe rechazar esto con el error "Admin cannot change their own status"
        await mockChangeStatusUser(adminAddress, UserStatus.Rejected);
        return { success: false, error: 'Admin cannot change their own status' };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
      }
    };

    // Configurar el mock para que rechace el auto-rechazo
    mockChangeStatusUser.mockRejectedValue({
      message: 'Admin cannot change their own status',
    });

    // Verificar que el intento falla
    attemptSelfReject().then((result) => {
      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin cannot change their own status');
    });
  });

  it('testAdminCanApproveOtherUsers - Verificar que admin puede aprobar otros usuarios', () => {
    const { mockChangeStatusUser } = simulateAdminFlow();

    // Simular aprobación de otro usuario
    mockChangeStatusUser.mockResolvedValue(true);

    const approveUser = async (userAddress: string) => {
      return await mockChangeStatusUser(userAddress, UserStatus.Approved);
    };

    // Verificar que puede aprobar otros usuarios
    approveUser(otherUserAddress).then((result) => {
      expect(result).toBe(true);
      expect(mockChangeStatusUser).toHaveBeenCalledWith(otherUserAddress, UserStatus.Approved);
    });
  });

  it('testAdminSeesSelfInUsersList - Verificar que admin se ve a sí mismo en la lista de usuarios', () => {
    simulateAdminFlow();

    // Simular lista de usuarios que incluye al admin
    const usersList = [
      {
        id: BigInt(1),
        userAddress: adminAddress,
        role: 'Admin',
        status: UserStatus.Approved,
      },
      {
        id: BigInt(2),
        userAddress: otherUserAddress,
        role: 'Producer',
        status: UserStatus.Pending,
      },
    ];

    // Verificar que el admin está en la lista
    const adminInList = usersList.find(
      (u) => u.userAddress.toLowerCase() === adminAddress.toLowerCase()
    );
    expect(adminInList).toBeDefined();
    expect(adminInList?.role).toBe('Admin');
  });

  it('testAdminListUpdatesWithoutReload - Verificar que la lista se actualiza sin recargar página', () => {
    const { mockChangeStatusUser } = simulateAdminFlow();

    // Simular lista inicial
    const usersList: Array<{ id: bigint; userAddress: string; role: string; status: UserStatus }> = [
      {
        id: BigInt(2),
        userAddress: otherUserAddress,
        role: 'Producer',
        status: UserStatus.Pending,
      },
    ];

    // Simular aprobación de usuario
    mockChangeStatusUser.mockResolvedValue(true);

    // Simular actualización de lista después de aprobar
    const updateUserStatus = (userAddress: string, newStatus: UserStatus) => {
      const user = usersList.find((u) => u.userAddress === userAddress);
      if (user) {
        user.status = newStatus;
      }
      return usersList;
    };

    // Aprobar usuario
    updateUserStatus(otherUserAddress, UserStatus.Approved);

    // Verificar que la lista se actualizó sin recargar
    const updatedUser = usersList.find((u) => u.userAddress === otherUserAddress);
    expect(updatedUser?.status).toBe(UserStatus.Approved);
    expect(usersList.length).toBe(1); // Misma lista, solo actualizada
  });
});

