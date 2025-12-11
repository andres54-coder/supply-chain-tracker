"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Users, ArrowLeftRight, Settings, Home } from "lucide-react";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useAdmin } from "@/hooks/useAdmin";
import { ConnectWalletButton } from "./ui/ConnectWalletButton";
import { AddressDisplay } from "./ui/AddressDisplay";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { UserStatus } from "@/types";

/**
 * Componente Header con navegación y estado de conexión
 */
export function Header() {
  const pathname = usePathname();
  const { account, isConnected, error } = useMetaMask();
  const { data: user, isLoading: userLoading, error: userError } = useUserInfo(account);
  const { isAdmin, isLoading: isLoadingAdmin } = useAdmin();

  // Construir navegación según el rol del usuario
  const getNavigationItems = () => {
    if (!account) {
      return [];
    }

    // Si es admin, mostrar navegación de admin incluso si no está registrado como usuario
    if (isAdmin) {
      return [
        { href: "/admin", label: "Admin", icon: Settings },
        { href: "/admin/users", label: "Usuarios", icon: Users },
      ];
    }

    // Para usuarios normales, solo mostrar navegación si están aprobados
    if (!user || user.status !== UserStatus.Approved) {
      return [];
    }

    const userRole = user.role;
    const baseItems = [
      { href: "/dashboard", label: "Dashboard", icon: Package },
    ];

    // Navegación según rol
    if (userRole === "Admin" || isAdmin) {
      // Admin: Admin, Usuarios
      return [
        { href: "/admin", label: "Admin", icon: Settings },
        { href: "/admin/users", label: "Usuarios", icon: Users },
      ];
    } else if (userRole === "Consumer") {
      // Consumer: Dashboard, Tokens (solo lectura), Perfil
      return [
        ...baseItems,
        { href: "/tokens", label: "Tokens", icon: Package },
        { href: "/profile", label: "Perfil", icon: Users },
      ];
    } else {
      // Producer, Factory, Retailer: Dashboard, Tokens, Transferencias, Perfil
      return [
        ...baseItems,
        { href: "/tokens", label: "Tokens", icon: Package },
        { href: "/transfers", label: "Transferencias", icon: ArrowLeftRight },
        { href: "/profile", label: "Perfil", icon: Users },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/*]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo y navegación */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Package className="h-6 w-6" />
            <span>Supply Chain</span>
          </Link>

          {/* Navegación - mostrar si está conectado y (aprobado o es admin) */}
          {isConnected && navigationItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isActive && "bg-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Estado de conexión y acciones */}
        <div className="flex items-center gap-4">
          {isConnected && account ? (
            <>
              {/* Estado del usuario */}
              {userLoading || isLoadingAdmin ? (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Cargando...</span>
                </div>
              ) : user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <StatusBadge status={user.status} type="user" />
                  {user.role && (
                    <span className="text-sm text-muted-foreground">
                      {user.role}
                    </span>
                  )}
                </div>
              ) : isAdmin ? (
                <div className="hidden sm:flex items-center gap-2">
                  <StatusBadge status={UserStatus.Approved} type="user" />
                  <span className="text-sm text-muted-foreground">Admin</span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">No registrado</span>
                </div>
              )}

              {/* Dirección */}
              <div className="hidden sm:block">
                <AddressDisplay address={account} />
              </div>

              {/* Botón desconectar */}
              <ConnectWalletButton variant="outline" size="sm" />
            </>
          ) : (
            <ConnectWalletButton />
          )}
        </div>
      </div>

      {/* Mensaje de error si hay */}
      {error && (
        <div className="container px-4 pb-2">
          <div className="rounded-md bg-destructive/10 border border-destructive/50 p-2 text-sm text-destructive">
            {error}
          </div>
        </div>
      )}

      {/* Navegación móvil */}
      {isConnected && navigationItems.length > 0 && (
        <nav className="md:hidden border-t">
          <div className="container px-4 py-2 flex items-center gap-2 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "gap-2",
                      isActive && "bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

