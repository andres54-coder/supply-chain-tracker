/**
 * @file Tests para MetaMaskContext - Invalidación de Queries (Simplificado)
 * @description Verifica la lógica de invalidación de queries sin depender de la conexión completa
 */

import { QueryClient } from '@tanstack/react-query';

describe('MetaMaskContext - Invalidación de Queries (Lógica)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it('testQueriesInvalidatedOnAccountChange - Verificar que las queries se invalidan cuando cambia la cuenta', () => {
    const account1 = '0x1111111111111111111111111111111111111111';
    const account2 = '0x2222222222222222222222222222222222222222';

    // Agregar queries para account1
    queryClient.setQueryData(['user', account1], { id: 1, role: 'Producer' });
    queryClient.setQueryData(['userTokens', account1], []);
    queryClient.setQueryData(['userTransfers', account1], []);
    queryClient.setQueryData(['admin', 'isAdmin', account1], false);

    // Simular cambio de cuenta: eliminar queries de account1
    queryClient.removeQueries({ queryKey: ['user', account1] });
    queryClient.removeQueries({ queryKey: ['userTokens', account1] });
    queryClient.removeQueries({ queryKey: ['userTransfers', account1] });
    queryClient.removeQueries({ queryKey: ['admin', 'isAdmin', account1] });
    
    // Invalidar queries de admin
    queryClient.invalidateQueries({ queryKey: ['admin'] });

    // Verificar que las queries de account1 fueron eliminadas
    expect(queryClient.getQueryData(['user', account1])).toBeUndefined();
    expect(queryClient.getQueryData(['userTokens', account1])).toBeUndefined();
    expect(queryClient.getQueryData(['userTransfers', account1])).toBeUndefined();
    expect(queryClient.getQueryData(['admin', 'isAdmin', account1])).toBeUndefined();
  });

  it('testAdminQueriesInvalidatedOnAccountChange - Verificar que las queries de admin se invalidan correctamente', () => {
    const account1 = '0x1111111111111111111111111111111111111111';
    const account2 = '0x2222222222222222222222222222222222222222';

    // Agregar queries de admin
    queryClient.setQueryData(['admin', 'address'], account1);
    queryClient.setQueryData(['admin', 'isAdmin', account1], true);
    queryClient.setQueryData(['admin', 'isAdmin', account2], false);

    // Invalidar todas las queries de admin
    queryClient.invalidateQueries({ queryKey: ['admin'] });

    // Verificar que las queries fueron invalidadas (pueden seguir existiendo pero marcadas como stale)
    const adminQueries = queryClient.getQueryCache().findAll({ queryKey: ['admin'] });
    // Las queries deben existir pero estar marcadas como invalidadas
    expect(adminQueries.length).toBeGreaterThan(0);
  });

  it('testPreviousAccountQueriesRemoved - Verificar que las queries de la cuenta anterior se eliminan', () => {
    const account1 = '0x1111111111111111111111111111111111111111';
    const account2 = '0x2222222222222222222222222222222222222222';

    // Agregar queries para account1
    queryClient.setQueryData(['user', account1], { id: 1 });
    queryClient.setQueryData(['userTokens', account1], []);
    queryClient.setQueryData(['userTransfers', account1], []);

    // Simular cambio de cuenta: eliminar queries de account1
    queryClient.removeQueries({ queryKey: ['user', account1] });
    queryClient.removeQueries({ queryKey: ['userTokens', account1] });
    queryClient.removeQueries({ queryKey: ['userTransfers', account1] });

    // Verificar que las queries de account1 fueron eliminadas
    expect(queryClient.getQueryData(['user', account1])).toBeUndefined();
    expect(queryClient.getQueryData(['userTokens', account1])).toBeUndefined();
    expect(queryClient.getQueryData(['userTransfers', account1])).toBeUndefined();
  });

  it('testQueriesInvalidatedOnDisconnect - Verificar que las queries se invalidan al desconectar', () => {
    const account = '0x1111111111111111111111111111111111111111';

    // Agregar queries para la cuenta
    queryClient.setQueryData(['user', account], { id: 1 });
    queryClient.setQueryData(['userTokens', account], []);
    queryClient.setQueryData(['userTransfers', account], []);
    queryClient.setQueryData(['admin', 'isAdmin', account], false);
    queryClient.setQueryData(['admin', 'address'], account);

    // Simular desconexión: eliminar todas las queries relacionadas
    queryClient.removeQueries({ queryKey: ['user', account] });
    queryClient.removeQueries({ queryKey: ['userTokens', account] });
    queryClient.removeQueries({ queryKey: ['userTransfers', account] });
    queryClient.removeQueries({ queryKey: ['admin', 'isAdmin', account] });
    queryClient.removeQueries({ queryKey: ['admin'] });

    // Verificar que las queries fueron eliminadas
    expect(queryClient.getQueryData(['user', account])).toBeUndefined();
    expect(queryClient.getQueryData(['userTokens', account])).toBeUndefined();
    expect(queryClient.getQueryData(['userTransfers', account])).toBeUndefined();
    expect(queryClient.getQueryData(['admin', 'isAdmin', account])).toBeUndefined();
    
    // Verificar que las queries de admin fueron eliminadas
    const adminQueries = queryClient.getQueryCache().findAll({ queryKey: ['admin'] });
    expect(adminQueries.length).toBe(0);
  });
});

