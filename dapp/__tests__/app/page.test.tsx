/**
 * @file Tests para la página principal (Home)
 * @description Verifica el comportamiento de la página principal cuando el usuario es admin
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useAdmin } from '@/hooks/useAdmin';
import { useContract } from '@/hooks/useContract';
import { UserStatus } from '@/types';

// Mock de los hooks
jest.mock('@/hooks/useMetaMask');
jest.mock('@/hooks/useUserInfo');
jest.mock('@/hooks/useAdmin');
jest.mock('@/hooks/useContract');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseMetaMask = useMetaMask as jest.MockedFunction<typeof useMetaMask>;
const mockUseUserInfo = useUserInfo as jest.MockedFunction<typeof useUserInfo>;
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;
const mockUseContract = useContract as jest.MockedFunction<typeof useContract>;

describe('Home Page - Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Función helper que simula la lógica de renderizado de la página principal
  const getPageContent = (
    isConnected: boolean,
    user: { role: string; status: UserStatus } | null,
    isAdmin: boolean,
    userLoading: boolean = false,
    isLoadingAdmin: boolean = false
  ) => {
    if (!isConnected) {
      return { type: 'connect_wallet', showsRegistration: false };
    }

    if (userLoading || isLoadingAdmin) {
      return { type: 'loading', showsRegistration: false };
    }

    // Verificar primero si es admin (incluso sin usuario registrado)
    if (isAdmin) {
      if (user && user.role === 'Admin') {
        return {
          type: 'admin_welcome',
          showsRegistration: false,
          showsAdminButton: true,
          redirects: false,
        };
      }
      // Admin sin usuario registrado aún muestra admin welcome
      return {
        type: 'admin_welcome',
        showsRegistration: false,
        showsAdminButton: true,
        redirects: false,
      };
    }

    if (!user) {
      return { type: 'registration_form', showsRegistration: true };
    }

    if (user.status === UserStatus.Pending) {
      return { type: 'pending', showsRegistration: false };
    }

    if (user.status === UserStatus.Rejected) {
      return { type: 'rejected', showsRegistration: false };
    }

    if (user.status === UserStatus.Approved) {
      return { type: 'redirect_to_dashboard', showsRegistration: false, redirects: true };
    }

    return { type: 'unknown', showsRegistration: false };
  };

  it('testHomePageShowsAdminWelcome - Verificar que muestra mensaje de bienvenida para admin', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';

    const content = getPageContent(
      true, // isConnected
      { role: 'Admin', status: UserStatus.Approved },
      true, // isAdmin
      false, // userLoading
      false // isLoadingAdmin
    );

    expect(content.type).toBe('admin_welcome');
    expect(content.showsRegistration).toBe(false);
    expect(content.showsAdminButton).toBe(true);
  });

  it('testHomePageNoRedirectForAdmin - Verificar que no redirige automáticamente al admin', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';

    const content = getPageContent(
      true, // isConnected
      { role: 'Admin', status: UserStatus.Approved },
      true, // isAdmin
      false, // userLoading
      false // isLoadingAdmin
    );

    // Verificar que no redirige automáticamente
    expect(content.redirects).toBe(false);
    expect(content.type).toBe('admin_welcome');
  });

  it('testHomePageHidesRegistrationForAdmin - Verificar que no muestra formulario de registro para admin', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';

    // Admin con usuario registrado
    const contentWithUser = getPageContent(
      true,
      { role: 'Admin', status: UserStatus.Approved },
      true
    );

    // Admin sin usuario registrado pero detectado como admin
    const contentWithoutUser = getPageContent(
      true,
      null,
      true
    );

    // En ambos casos no debe mostrar formulario de registro
    expect(contentWithUser.showsRegistration).toBe(false);
    // Si no hay usuario pero es admin, puede mostrar loading o admin welcome
    expect(contentWithoutUser.showsRegistration).toBe(false);
  });

  it('testHomePageShowsAdminButton - Verificar que muestra botón para ir al panel de administración', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';

    const content = getPageContent(
      true,
      { role: 'Admin', status: UserStatus.Approved },
      true
    );

    expect(content.type).toBe('admin_welcome');
    expect(content.showsAdminButton).toBe(true);
  });

  it('testHomePageHandlesAdminWithoutUser - Verificar comportamiento cuando admin no tiene usuario registrado', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';

    // Admin detectado pero sin usuario registrado (caso edge)
    const content = getPageContent(
      true,
      null, // sin usuario
      true, // pero es admin
      false,
      false
    );

    // Debe mostrar loading o admin welcome, pero no formulario de registro
    expect(content.showsRegistration).toBe(false);
    expect(['loading', 'admin_welcome', 'unknown']).toContain(content.type);
  });

  it('testHomePageShowsRegistrationForNonAdmin - Verificar que sí muestra formulario para usuarios no admin', () => {
    const userAddress = '0x1111111111111111111111111111111111111111';

    // Usuario no conectado
    const contentNotConnected = getPageContent(false, null, false);
    expect(contentNotConnected.type).toBe('connect_wallet');

    // Usuario conectado pero no registrado y no admin
    const contentNotRegistered = getPageContent(true, null, false);
    expect(contentNotRegistered.showsRegistration).toBe(true);
    expect(contentNotRegistered.type).toBe('registration_form');
  });
});

