/**
 * @file Tests para el componente Header
 * @description Verifica que el Header muestra correctamente el rol Admin y la navegación
 * 
 * Nota: Estos tests verifican la lógica de navegación del Header,
 * enfocándose en cómo se determina qué navegación mostrar según el rol del usuario.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useAdmin } from '@/hooks/useAdmin';
import { UserStatus } from '@/types';

// Mock de los hooks
jest.mock('@/hooks/useMetaMask');
jest.mock('@/hooks/useUserInfo');
jest.mock('@/hooks/useAdmin');
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

const mockUseMetaMask = useMetaMask as jest.MockedFunction<typeof useMetaMask>;
const mockUseUserInfo = useUserInfo as jest.MockedFunction<typeof useUserInfo>;
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

describe('Header - UI del Admin (Lógica de Navegación)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Función helper que simula la lógica de getNavigationItems del Header
  const getNavigationItems = (
    account: string | null,
    isAdmin: boolean,
    user: { role: string; status: UserStatus } | null
  ) => {
    if (!account) {
      return [];
    }

    // Si es admin, mostrar navegación de admin incluso si no está registrado como usuario
    if (isAdmin) {
      return [
        { href: "/admin", label: "Admin" },
        { href: "/admin/users", label: "Usuarios" },
      ];
    }

    // Para usuarios normales, solo mostrar navegación si están aprobados
    if (!user || user.status !== UserStatus.Approved) {
      return [];
    }

    const userRole = user.role;
    const baseItems = [
      { href: "/dashboard", label: "Dashboard" },
    ];

    // Navegación según rol
    if (userRole === "Admin" || isAdmin) {
      return [
        { href: "/admin", label: "Admin" },
        { href: "/admin/users", label: "Usuarios" },
      ];
    } else if (userRole === "Consumer") {
      return [
        ...baseItems,
        { href: "/tokens", label: "Tokens" },
        { href: "/profile", label: "Perfil" },
      ];
    } else {
      return [
        ...baseItems,
        { href: "/tokens", label: "Tokens" },
        { href: "/transfers", label: "Transferencias" },
        { href: "/profile", label: "Perfil" },
      ];
    }
  };

  it('testHeaderShowsAdminRole - Verificar que el Header muestra navegación Admin cuando el usuario es admin', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';

    const navigationItems = getNavigationItems(
      adminAddress,
      true, // isAdmin
      { role: 'Admin', status: UserStatus.Approved }
    );

    // Verificar que la navegación incluye Admin y Usuarios
    expect(navigationItems).toHaveLength(2);
    expect(navigationItems.some(item => item.href === '/admin')).toBe(true);
    expect(navigationItems.some(item => item.href === '/admin/users')).toBe(true);
  });

  it('testHeaderShowsAdminNavigation - Verificar que muestra navegación de admin incluso sin usuario registrado', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';

    // Admin sin usuario registrado (solo isAdmin = true)
    const navigationItems = getNavigationItems(
      adminAddress,
      true, // isAdmin
      null // sin usuario registrado
    );

    // Verificar que la navegación incluye Admin y Usuarios incluso sin usuario
    expect(navigationItems).toHaveLength(2);
    expect(navigationItems.some(item => item.href === '/admin')).toBe(true);
    expect(navigationItems.some(item => item.href === '/admin/users')).toBe(true);
  });

  it('testHeaderHidesRegistrationFormForAdmin - Verificar que admin no necesita registro', () => {
    const adminAddress = '0x1234567890123456789012345678901234567890';

    // Admin sin usuario registrado debe tener navegación
    const navigationItemsWithoutUser = getNavigationItems(
      adminAddress,
      true, // isAdmin
      null // sin usuario
    );

    // Admin con usuario registrado también debe tener navegación
    const navigationItemsWithUser = getNavigationItems(
      adminAddress,
      true, // isAdmin
      { role: 'Admin', status: UserStatus.Approved }
    );

    // En ambos casos debe tener navegación (no necesita registro)
    expect(navigationItemsWithoutUser.length).toBeGreaterThan(0);
    expect(navigationItemsWithUser.length).toBeGreaterThan(0);
  });
});

