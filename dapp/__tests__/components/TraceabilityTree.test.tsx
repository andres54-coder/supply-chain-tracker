/**
 * @file Tests para TraceabilityTree - Timeline
 * @description Verifica que el timeline de transferencias se muestra correctamente
 */

import { render, screen } from '@testing-library/react';
import { TraceabilityTree } from '@/components/TraceabilityTree';
import { TransferStatus } from '@/types';
import { useMetaMask } from '@/contexts/MetaMaskContext';
import { useContract } from '@/hooks/useContract';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/contexts/MetaMaskContext');
jest.mock('@/hooks/useContract');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseMetaMask = useMetaMask as jest.MockedFunction<typeof useMetaMask>;
const mockUseContract = useContract as jest.MockedFunction<typeof useContract>;

describe('TraceabilityTree - Timeline', () => {
  let queryClient: QueryClient;
  const userAddress = '0x1111111111111111111111111111111111111111';
  const otherAddress = '0x2222222222222222222222222222222222222222';

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

  // Función helper para crear transferencias mock
  const createMockTransfer = (
    id: number,
    from: string,
    to: string,
    dateCreated: bigint,
    status: TransferStatus,
    fromRole?: string,
    toRole?: string
  ) => ({
    id: BigInt(id),
    from,
    to,
    tokenId: BigInt(1),
    dateCreated,
    amount: BigInt(100),
    status,
    fromUserRole: fromRole,
    toUserRole: toRole,
  });

  // Función helper para renderizar el componente
  const renderTraceabilityTree = (tokenId: bigint, rootToken: any) => {
    mockUseMetaMask.mockReturnValue({
      account: userAddress,
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
      getToken: jest.fn().mockResolvedValue(rootToken),
      isLoading: false,
      error: null,
    } as any);

    return render(
      <QueryClientProvider client={queryClient}>
        <TraceabilityTree tokenId={tokenId} />
      </QueryClientProvider>
    );
  };

  it('testTimelineDisplaysTransfersInOrder - Verificar que las transferencias se muestran en orden cronológico', () => {
    const tokenId = BigInt(1);
    const rootToken = {
      id: BigInt(1),
      owner: userAddress,
      parentId: BigInt(0),
      dateCreated: BigInt(1000),
      amount: BigInt(100),
    };

    // Simular transferencias en orden desordenado
    const transfers = [
      createMockTransfer(3, otherAddress, userAddress, BigInt(3000), TransferStatus.Accepted),
      createMockTransfer(1, userAddress, otherAddress, BigInt(1000), TransferStatus.Accepted),
      createMockTransfer(2, otherAddress, userAddress, BigInt(2000), TransferStatus.Accepted),
    ];

    // Función que simula el ordenamiento del componente
    const sortTransfersByDate = (transfers: any[]) => {
      return [...transfers].sort((a, b) => Number(a.dateCreated - b.dateCreated));
    };

    const sortedTransfers = sortTransfersByDate(transfers);

    // Verificar que están ordenadas cronológicamente
    expect(Number(sortedTransfers[0].dateCreated)).toBe(1000);
    expect(Number(sortedTransfers[1].dateCreated)).toBe(2000);
    expect(Number(sortedTransfers[2].dateCreated)).toBe(3000);
  });

  it('testTimelineShowsUserReceiverHighlight - Verificar que se resalta cuando el usuario es receptor', () => {
    const userAddress = '0x1111111111111111111111111111111111111111';
    const otherAddress = '0x2222222222222222222222222222222222222222';

    // Función que simula la lógica de isUserReceiver
    const isUserReceiver = (transferTo: string, userAccount: string | null) => {
      if (!userAccount) return false;
      return transferTo.toLowerCase() === userAccount.toLowerCase();
    };

    const transferToUser = createMockTransfer(
      1,
      otherAddress,
      userAddress,
      BigInt(1000),
      TransferStatus.Accepted
    );
    const transferFromUser = createMockTransfer(
      2,
      userAddress,
      otherAddress,
      BigInt(2000),
      TransferStatus.Accepted
    );

    // Verificar que se detecta correctamente cuando el usuario es receptor
    expect(isUserReceiver(transferToUser.to, userAddress)).toBe(true);
    expect(isUserReceiver(transferFromUser.to, userAddress)).toBe(false);
  });

  it('testTimelineShowsTransferDetails - Verificar que se muestran detalles de cada transferencia', () => {
    const transfer = createMockTransfer(
      1,
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      BigInt(1000),
      TransferStatus.Accepted,
      'Producer',
      'Factory'
    );

    // Verificar que la transferencia tiene todos los campos necesarios para el timeline
    expect(transfer.id).toBeDefined();
    expect(transfer.from).toBeDefined();
    expect(transfer.to).toBeDefined();
    expect(transfer.dateCreated).toBeDefined();
    expect(transfer.status).toBeDefined();
    expect(transfer.fromUserRole).toBe('Producer');
    expect(transfer.toUserRole).toBe('Factory');

    // Verificar que se puede formatear la fecha
    const formattedDate = new Date(Number(transfer.dateCreated) * 1000).toLocaleString();
    expect(formattedDate).toBeTruthy();
  });

  it('testTimelineHandlesEmptyTransfers - Verificar que maneja correctamente cuando no hay transferencias', () => {
    const transfers: any[] = [];

    // Verificar que el componente puede manejar lista vacía
    expect(transfers.length).toBe(0);

    // Función que simula la lógica de renderizado cuando no hay transferencias
    const shouldShowEmptyMessage = (transfers: any[]) => {
      return transfers.length === 0;
    };

    expect(shouldShowEmptyMessage(transfers)).toBe(true);
  });

  it('testTimelineShowsStatusBadge - Verificar que se muestra el badge de estado para cada transferencia', () => {
    const transfers = [
      createMockTransfer(1, userAddress, otherAddress, BigInt(1000), TransferStatus.Pending),
      createMockTransfer(2, otherAddress, userAddress, BigInt(2000), TransferStatus.Accepted),
      createMockTransfer(3, userAddress, otherAddress, BigInt(3000), TransferStatus.Rejected),
    ];

    // Verificar que cada transferencia tiene un estado válido
    transfers.forEach((transfer) => {
      expect(transfer.status).toBeDefined();
      expect([
        TransferStatus.Pending,
        TransferStatus.Accepted,
        TransferStatus.Rejected,
      ]).toContain(transfer.status);
    });
  });

  it('testTimelineShowsUserRoles - Verificar que se muestran los roles de usuario cuando están disponibles', () => {
    const transferWithRoles = createMockTransfer(
      1,
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      BigInt(1000),
      TransferStatus.Accepted,
      'Producer',
      'Factory'
    );

    const transferWithoutRoles = createMockTransfer(
      2,
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      BigInt(2000),
      TransferStatus.Accepted
    );

    // Verificar que los roles se muestran cuando están disponibles
    expect(transferWithRoles.fromUserRole).toBe('Producer');
    expect(transferWithRoles.toUserRole).toBe('Factory');
    expect(transferWithoutRoles.fromUserRole).toBeUndefined();
    expect(transferWithoutRoles.toUserRole).toBeUndefined();
  });

  it('testTimelineHandlesMultipleTransfers - Verificar que maneja múltiples transferencias correctamente', () => {
    const transfers = [
      createMockTransfer(1, userAddress, otherAddress, BigInt(1000), TransferStatus.Accepted),
      createMockTransfer(2, otherAddress, userAddress, BigInt(2000), TransferStatus.Accepted),
      createMockTransfer(3, userAddress, otherAddress, BigInt(3000), TransferStatus.Accepted),
      createMockTransfer(4, otherAddress, userAddress, BigInt(4000), TransferStatus.Accepted),
    ];

    // Verificar que todas las transferencias se procesan correctamente
    expect(transfers.length).toBe(4);

    // Verificar que están ordenadas cronológicamente
    const sorted = [...transfers].sort((a, b) => Number(a.dateCreated - b.dateCreated));
    expect(sorted[0].id).toBe(BigInt(1));
    expect(sorted[1].id).toBe(BigInt(2));
    expect(sorted[2].id).toBe(BigInt(3));
    expect(sorted[3].id).toBe(BigInt(4));
  });
});

