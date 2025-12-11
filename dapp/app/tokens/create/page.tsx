"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { JsonEditor } from "@/components/ui/JsonEditor";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useUserTokens } from "@/hooks/useUserTokens";
import { useContract } from "@/hooks/useContract";
import { UserStatus, TokenWithBalance } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateTokenPage() {
  const router = useRouter();
  const { account, isConnected } = useMetaMask();
  const { data: user, isLoading: userLoading } = useUserInfo(account);
  const { data: tokens } = useUserTokens(account, { includeBalance: true });
  const { createToken, isLoading: isCreating, error: contractError } = useContract();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [features, setFeatures] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protección de ruta
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (!userLoading && user) {
      if (user.status !== UserStatus.Approved) {
        router.push("/");
        return;
      }

      // Producer no puede crear tokens con parentId
      if (user.role === "Producer") {
        setParentId("0");
      }
    }
  }, [isConnected, user, userLoading, router]);

  if (!isConnected || userLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
      </>
    );
  }

  if (!user || user.status !== UserStatus.Approved) {
    return null;
  }

  const userRole = user.role;
  const canCreateToken = userRole === "Producer" || userRole === "Factory" || userRole === "Retailer";
  const requiresParentId = userRole === "Factory" || userRole === "Retailer";
  const tokensArray = (tokens as TokenWithBalance[]) || [];
  const availableParentTokens = tokensArray.filter((t) => t.balance > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    if (!totalSupply || BigInt(totalSupply) <= 0) {
      setError("La cantidad total debe ser mayor a 0");
      return;
    }

    if (requiresParentId && (!parentId || BigInt(parentId) === BigInt(0))) {
      setError("Debes seleccionar un token padre");
      return;
    }

    if (userRole === "Producer" && parentId && BigInt(parentId) !== BigInt(0)) {
      setError("Los Producers solo pueden crear tokens base (sin padre)");
      return;
    }

    // Validar JSON antes de enviar
    if (features.trim()) {
      try {
        JSON.parse(features.trim());
      } catch {
        setError("El JSON de metadatos no es válido. Por favor, usa el botón 'Formatear' para corregirlo.");
        return;
      }
    }

    setIsSubmitting(true);

    // Formatear JSON antes de enviar
    let formattedFeatures = features.trim() || "{}";
    if (formattedFeatures) {
      try {
        const parsed = JSON.parse(formattedFeatures);
        formattedFeatures = JSON.stringify(parsed);
      } catch {
        setError("Error al formatear JSON");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const success = await createToken(
        name.trim(),
        BigInt(totalSupply),
        formattedFeatures,
        BigInt(parentId || "0")
      );

      if (success) {
        // Invalidar queries para refrescar datos
        queryClient.invalidateQueries({ queryKey: ["userTokens", account] });
        router.push("/tokens");
      } else {
        setError(contractError || "Error al crear el token");
      }
    } catch (err: any) {
      setError(err.message || "Error al crear el token");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreateToken) {
    return (
      <>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>
                Solo Producers, Factories y Retailers pueden crear tokens
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/tokens">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Crear Token</h1>
              <p className="text-muted-foreground mt-2">
                {userRole === "Producer"
                  ? "Crea una nueva materia prima"
                  : "Crea un producto derivado de un token existente"}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información del Token</CardTitle>
              <CardDescription>
                Completa los datos para crear tu token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Trigo Orgánico"
                    disabled={isSubmitting || isCreating}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalSupply">Cantidad Total *</Label>
                  <Input
                    id="totalSupply"
                    type="number"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    placeholder="1000"
                    min="1"
                    disabled={isSubmitting || isCreating}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Cantidad total de unidades del producto
                  </p>
                </div>

                {requiresParentId && (
                  <div className="space-y-2">
                    <Label htmlFor="parentId">Token Padre *</Label>
                    {availableParentTokens.length === 0 ? (
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        No tienes tokens disponibles para crear productos derivados
                      </div>
                    ) : (
                      <Select
                        value={parentId}
                        onValueChange={setParentId}
                        disabled={isSubmitting || isCreating}
                      >
                        <SelectTrigger id="parentId">
                          <SelectValue placeholder="Selecciona un token padre" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableParentTokens.map((token) => (
                            <SelectItem
                              key={token.id.toString()}
                              value={token.id.toString()}
                            >
                              {token.name} (Balance: {token.balance.toString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Selecciona el token del cual derivar este producto
                    </p>
                  </div>
                )}

                <JsonEditor
                  value={features}
                  onChange={setFeatures}
                  label="Metadatos (JSON)"
                  placeholder='{"organic": true, "certified": "USDA"}'
                  disabled={isSubmitting || isCreating}
                />

                {error && <ErrorMessage message={error} />}
                {contractError && <ErrorMessage message={contractError} />}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || isCreating}
                    className="flex-1"
                  >
                    {isSubmitting || isCreating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Creando...
                      </>
                    ) : (
                      "Crear Token"
                    )}
                  </Button>
                  <Link href="/tokens">
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

