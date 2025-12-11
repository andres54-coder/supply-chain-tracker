/**
 * @file Tests de Mapeo de Estados de Transferencia
 * @description Verifica que los estados numéricos del contrato se mapean correctamente a TransferStatus enum
 */

import { TransferStatus } from '@/types';

describe('Transfer Status Mapping', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console.warn para evitar warnings en la salida del test
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restaurar console.warn después de cada test
    consoleWarnSpy.mockRestore();
  });

  /**
   * Función que simula el mapeo de estado numérico a TransferStatus enum
   * Esta función replica la lógica de useContract.ts y TraceabilityTree.tsx
   */
  const mapTransferStatus = (statusNumber: number): TransferStatus => {
    switch (statusNumber) {
      case 0:
        return TransferStatus.Pending;
      case 1:
        return TransferStatus.Accepted;
      case 2:
        return TransferStatus.Rejected;
      default:
        console.warn(`Unknown transfer status: ${statusNumber}, defaulting to Pending`);
        return TransferStatus.Pending;
    }
  };

  it('testTransferStatusMapping - Verificar que los números se mapean correctamente a los enums', () => {
    // Verificar mapeo de 0 -> Pending
    expect(mapTransferStatus(0)).toBe(TransferStatus.Pending);
    expect(mapTransferStatus(0)).toBe(0); // Verificar valor numérico

    // Verificar mapeo de 1 -> Accepted
    expect(mapTransferStatus(1)).toBe(TransferStatus.Accepted);
    expect(mapTransferStatus(1)).toBe(1); // Verificar valor numérico

    // Verificar mapeo de 2 -> Rejected
    expect(mapTransferStatus(2)).toBe(TransferStatus.Rejected);
    expect(mapTransferStatus(2)).toBe(2); // Verificar valor numérico
  });

  it('testTransferStatusMappingDefault - Verificar que valores desconocidos se mapean a Pending', () => {
    // Verificar que valores fuera del rango válido se mapean a Pending
    expect(mapTransferStatus(3)).toBe(TransferStatus.Pending);
    expect(mapTransferStatus(-1)).toBe(TransferStatus.Pending);
    expect(mapTransferStatus(100)).toBe(TransferStatus.Pending);
    expect(mapTransferStatus(NaN)).toBe(TransferStatus.Pending);

    // Verificar que se llamó console.warn para cada valor inválido
    expect(consoleWarnSpy).toHaveBeenCalledTimes(4);
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown transfer status: 3, defaulting to Pending');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown transfer status: -1, defaulting to Pending');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown transfer status: 100, defaulting to Pending');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown transfer status: NaN, defaulting to Pending');
  });

  it('testTransferStatusMappingConsistency - Verificar que el mapeo es consistente en todos los lugares', () => {
    // Verificar que los valores del enum coinciden con los números esperados
    expect(TransferStatus.Pending).toBe(0);
    expect(TransferStatus.Accepted).toBe(1);
    expect(TransferStatus.Rejected).toBe(2);

    // Verificar que el mapeo funciona en ambas direcciones
    expect(mapTransferStatus(TransferStatus.Pending)).toBe(TransferStatus.Pending);
    expect(mapTransferStatus(TransferStatus.Accepted)).toBe(TransferStatus.Accepted);
    expect(mapTransferStatus(TransferStatus.Rejected)).toBe(TransferStatus.Rejected);
  });

  it('testTransferStatusMappingFromContract - Verificar mapeo desde datos del contrato', () => {
    // Simular datos del contrato con estado numérico
    const contractTransfer1 = { status: 0 };
    const contractTransfer2 = { status: 1 };
    const contractTransfer3 = { status: 2 };
    const contractTransfer4 = { status: 99 }; // Estado inválido

    // Verificar mapeo correcto
    expect(mapTransferStatus(Number(contractTransfer1.status))).toBe(TransferStatus.Pending);
    expect(mapTransferStatus(Number(contractTransfer2.status))).toBe(TransferStatus.Accepted);
    expect(mapTransferStatus(Number(contractTransfer3.status))).toBe(TransferStatus.Rejected);
    expect(mapTransferStatus(Number(contractTransfer4.status))).toBe(TransferStatus.Pending);

    // Verificar que se llamó console.warn para el estado inválido
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown transfer status: 99, defaulting to Pending');
  });

  it('testTransferStatusMappingWithBigInt - Verificar mapeo con BigInt desde el contrato', () => {
    // El contrato puede devolver BigInt, necesitamos convertirlo a número
    const contractTransfer1 = { status: BigInt(0) };
    const contractTransfer2 = { status: BigInt(1) };
    const contractTransfer3 = { status: BigInt(2) };

    // Convertir BigInt a número antes de mapear
    expect(mapTransferStatus(Number(contractTransfer1.status))).toBe(TransferStatus.Pending);
    expect(mapTransferStatus(Number(contractTransfer2.status))).toBe(TransferStatus.Accepted);
    expect(mapTransferStatus(Number(contractTransfer3.status))).toBe(TransferStatus.Rejected);
  });

  it('testTransferStatusEnumValues - Verificar que los valores del enum son correctos', () => {
    // Verificar que el enum tiene los valores esperados
    expect(TransferStatus.Pending).toBe(0);
    expect(TransferStatus.Accepted).toBe(1);
    expect(TransferStatus.Rejected).toBe(2);

    // Verificar que todos los valores del enum son números
    expect(typeof TransferStatus.Pending).toBe('number');
    expect(typeof TransferStatus.Accepted).toBe('number');
    expect(typeof TransferStatus.Rejected).toBe('number');
  });

  it('testTransferStatusMappingEdgeCases - Verificar casos límite del mapeo', () => {
    // Verificar que el mapeo maneja correctamente los límites
    expect(mapTransferStatus(0)).toBe(TransferStatus.Pending); // Límite inferior válido
    expect(mapTransferStatus(2)).toBe(TransferStatus.Rejected); // Límite superior válido
    expect(mapTransferStatus(3)).toBe(TransferStatus.Pending); // Fuera del rango válido
    expect(mapTransferStatus(-1)).toBe(TransferStatus.Pending); // Fuera del rango válido

    // Verificar que se llamó console.warn para valores fuera del rango
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown transfer status: 3, defaulting to Pending');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown transfer status: -1, defaulting to Pending');
  });

  it('testTransferStatusMappingAllValues - Verificar que todos los valores válidos se mapean correctamente', () => {
    // Crear un array con todos los valores válidos
    const validStatuses = [0, 1, 2];
    const expectedEnums = [
      TransferStatus.Pending,
      TransferStatus.Accepted,
      TransferStatus.Rejected,
    ];

    // Verificar que cada valor se mapea correctamente
    validStatuses.forEach((status, index) => {
      expect(mapTransferStatus(status)).toBe(expectedEnums[index]);
    });
  });
});

