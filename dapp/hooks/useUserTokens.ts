"use client";

import { useQuery } from "@tanstack/react-query";
import { useContract } from "./useContract";
import { Token, TokenWithBalance } from "@/types";

/**
 * Hook para obtener tokens de un usuario usando React Query
 */
export function useUserTokens(
  userAddress: string | null | undefined,
  options?: { includeBalance?: boolean }
) {
  const { getUserTokens, getToken, getTokenBalance } = useContract();
  const includeBalance = options?.includeBalance ?? false;

  return useQuery<TokenWithBalance[] | bigint[]>({
    queryKey: ["userTokens", userAddress, includeBalance],
    queryFn: async () => {
      if (!userAddress) return [];

      const tokenIds = await getUserTokens(userAddress);

      if (!includeBalance) {
        return tokenIds;
      }

      // Obtener información completa de cada token con balance
      const tokensWithBalance = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const token = await getToken(tokenId);
          if (!token) return null;

          const balance = await getTokenBalance(tokenId, userAddress);

          return {
            ...token,
            balance: balance ?? BigInt(0),
          } as TokenWithBalance;
        })
      );

      return tokensWithBalance.filter((t) => t !== null) as TokenWithBalance[];
    },
    enabled: !!userAddress,
    staleTime: 30000, // 30 segundos
  });
}

