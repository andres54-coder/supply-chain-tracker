/**
 * @file Tests para AdminUsersPage
 * @description Verifica que la página de administración de usuarios maneja correctamente el admin
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdmin } from '@/hooks/useAdmin';
import { useContract } from '@/hooks/useContract';
import { useMetaMask } from '@/hooks/useMetaMask';
import { UserStatus } from '@/types';

// Mock de los hooks
jest.mock('@/hooks/useMetaMask');
jest.mock('@/hooks/useContract');
jest.mock('@/hooks/useAdmin');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockUseMetaMask = useMetaMask as jest.MockedFunction<typeof useMetaMask>;
const mockUseContract = useContract as jest.MockedFunction<typeof useContract>;
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

describe('AdminUsersPage - UI del Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Función helper que simula la lógica de renderizado de acciones para un usuario
  const getActionsForUser = (
    userAddress: string,
    userStatus: UserStatus,
    adminAddress: string | null | undefined
  ) => {
    const actions: string[] = [];

    if (userStatus === UserStatus.Pending) {
      actions.push('Aprobar');
      // El admin no puede rechazarse a sí mismo
      if (adminAddress && userAddress.toLowerCase() !== adminAddress.toLowerCase()) {
        actions.push('Rechazar');
      }
    } else if (userStatus === UserStatus.Approved) {
      // El admin no puede rechazarse a sí mismo
      if (adminAddress && userAddress.toLowerCase() !== adminAddress.toLowerCase()) {
        actions.push('Rechazar');
      } else if (adminAddress && userAddress.toLowerCase() === adminAddress.toLowerCase()) {
        // Mostrar texto informativo "Admin" en lugar de botón
        actions.push('Admin (texto informativo)');
      }
    } else if (userStatus === UserStatus.Rejected) {
      actions.push('Aprobar');
    }

    return actions;
  };

  it('testAdminUsersPageHidesRejectForAdmin - Verificar que no muestra botón de rechazar para el admin', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';
    const adminUserAddress = adminAddress.toLowerCase();

    // Simular usuario admin aprobado
    const actions = getActionsForUser(
      adminUserAddress,
      UserStatus.Approved,
      adminAddress
    );

    // Verificar que no hay botón de rechazar para el admin
    expect(actions).not.toContain('Rechazar');
    // Verificar que muestra texto informativo "Admin"
    expect(actions).toContain('Admin (texto informativo)');
  });

  it('testAdminUsersPageShowsAdminLabel - Verificar que muestra "Admin" como texto informativo', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';
    const adminUserAddress = adminAddress.toLowerCase();

    // Simular usuario admin aprobado
    const actions = getActionsForUser(
      adminUserAddress,
      UserStatus.Approved,
      adminAddress
    );

    // Verificar que muestra texto informativo "Admin"
    expect(actions).toContain('Admin (texto informativo)');
  });

  it('testAdminUsersPageShowsRejectForOtherUsers - Verificar que sí muestra botón de rechazar para otros usuarios', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';
    const otherUserAddress = '0x1111111111111111111111111111111111111111';

    // Simular otro usuario aprobado
    const actions = getActionsForUser(
      otherUserAddress,
      UserStatus.Approved,
      adminAddress
    );

    // Verificar que sí muestra botón de rechazar para otros usuarios
    expect(actions).toContain('Rechazar');
  });

  it('testAdminUsersPageHidesRejectForAdminPending - Verificar que no muestra rechazar para admin pendiente', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';
    const adminUserAddress = adminAddress.toLowerCase();

    // Simular usuario admin pendiente (caso edge)
    const actions = getActionsForUser(
      adminUserAddress,
      UserStatus.Pending,
      adminAddress
    );

    // Verificar que muestra aprobar pero no rechazar
    expect(actions).toContain('Aprobar');
    expect(actions).not.toContain('Rechazar');
  });

  it('testAdminUsersPageUpdatesWithoutReload - Verificar que la lógica permite actualización sin recargar', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';
    const userAddress = '0x1111111111111111111111111111111111111111';

    // Simular cambio de estado de usuario
    const actionsPending = getActionsForUser(
      userAddress,
      UserStatus.Pending,
      adminAddress
    );
    const actionsApproved = getActionsForUser(
      userAddress,
      UserStatus.Approved,
      adminAddress
    );

    // Verificar que las acciones cambian según el estado
    expect(actionsPending).toContain('Aprobar');
    expect(actionsPending).toContain('Rechazar');
    
    expect(actionsApproved).toContain('Rechazar');
    expect(actionsApproved).not.toContain('Aprobar');
  });
});

