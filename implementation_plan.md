# Plan de Implementación - Supply Chain Tracker
## Análisis de Brecha y Checklist de Cambios

**Fecha de Creación:** 2025-01-XX  
**Versión:** 1.0  
**Estado:** Draft

---

## 1. Análisis del Estado Actual

### 1.1 Estado del Proyecto

#### Smart Contracts (`sc/`)
- ✅ **Configuración Foundry**: `foundry.toml` básico presente
- ✅ **Dependencias**: `forge-std` instalado
- ❌ **Contrato Principal**: Solo existe `Counter.sol` (template básico)
- ❌ **Contrato SupplyChain**: No existe
- ❌ **Script de Deploy**: Solo existe `Counter.s.sol` (template)
- ❌ **Tests**: Solo existen tests básicos de `Counter`
- ❌ **ABI Generado**: No existe

#### Frontend (`dapp/`)
- ❌ **Proyecto Next.js**: Directorio vacío, no inicializado
- ❌ **Dependencias**: No hay `package.json`
- ❌ **Estructura de Carpetas**: No existe
- ❌ **Componentes**: Ninguno implementado
- ❌ **Contextos**: No existe `MetaMaskContext`
- ❌ **Hooks**: Ninguno implementado
- ❌ **Páginas**: Ninguna implementada
- ❌ **Configuración**: No hay configuración de contrato

### 1.2 Brecha Identificada

**Brecha Crítica:** El proyecto está prácticamente vacío. Solo existe la estructura básica de Foundry con un contrato template. Se requiere implementación completa desde cero.

**Cobertura Actual vs Requerida:**
- Smart Contracts: **~5%** (solo estructura básica)
- Frontend: **0%** (directorio vacío)
- Tests: **~5%** (solo tests de template)
- Documentación: **100%** (PRD completo)

---

## 2. Checklist de Implementación Ordenado por Dependencias

### FASE 0: Configuración Base (Sin Dependencias)

#### SC-001: Configuración de Foundry
- [x] Actualizar `foundry.toml` con configuración específica del proyecto
  - [x] Configurar versión de Solidity (0.8.20)
  - [x] Configurar optimizador
  - [x] Configurar remappings si es necesario
- [x] Verificar que `forge build` funciona sin errores
- **Dependencias:** Ninguna
- **Prioridad:** Crítica
- **Estimación:** 30 min

#### DAPP-001: Inicialización del Proyecto Next.js
- [x] Crear proyecto Next.js 16 con TypeScript en `dapp/`
  cd dapp
  npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
  - [x] Instalar dependencias base:
  - [x] `ethers@^6.0.0`
  - [x] `@tanstack/react-query` (para cacheo de datos)
  - [x] `lucide-react` (para iconos)
  - [x] `clsx` y `tailwind-merge` (utilidades)
- [x] Configurar `tailwind.config.js` según estándares del proyecto
- [x] Crear estructura base de carpetas:
  ```
  dapp/
  ├── app/
  ├── components/
  ├── contexts/
  ├── hooks/
  ├── lib/
  ├── types/
  └── contracts/
  ```
- **Dependencias:** Ninguna
- **Prioridad:** Crítica
- **Estimación:** 1 hora

---

### FASE 1: Smart Contract Core (Depende de SC-001)

#### SC-002: Implementar Estructuras de Datos
- [x] Crear archivo `sc/src/SupplyChain.sol`
- [x] Definir enums:
  - [x] `enum UserStatus { Pending, Approved, Rejected, Canceled }`
  - [x] `enum TransferStatus { Pending, Accepted, Rejected }`
- [x] Definir structs:
  - [x] `struct User` (id, userAddress, role, status)
  - [x] `struct Token` (id, creator, name, totalSupply, features, parentId, dateCreated, balance mapping)
  - [x] `struct Transfer` (id, from, to, tokenId, dateCreated, amount, status)
- [x] Definir variables de estado:
  - [x] `address public admin`
  - [x] Contadores: `nextTokenId`, `nextTransferId`, `nextUserId`
  - [x] Mappings: `tokens`, `transfers`, `users`, `addressToUserId`
  - [x] Arrays: `allTokenIds`, `allTransferIds`, `allUserIds` (opcional)
- **Dependencias:** SC-001
- **Prioridad:** Crítica
- **Estimación:** 2 horas

#### SC-003: Implementar Constructor y Modificadores
- [x] Implementar constructor que establece `admin = msg.sender`
- [x] Implementar registro automático del admin como usuario con rol "Admin" y estado Approved
- [x] Crear modificador `onlyAdmin`
- [x] Crear modificador `onlyApprovedUser` (verifica que usuario esté aprobado)
- [x] Crear función helper `_isValidRole(string memory role) internal pure returns (bool)` (incluye "Admin" como rol válido)
- [x] Crear función helper `_canTransfer(address from, address to) internal view returns (bool)` (valida flujo de roles)
- **Dependencias:** SC-002
- **Prioridad:** Crítica
- **Estimación:** 1 hora

#### SC-004: Implementar Gestión de Usuarios
- [x] Implementar `requestUserRole(string memory role) public`
  - [x] Validar que el rol sea válido
  - [x] Validar que el usuario no esté ya registrado
  - [x] Crear nuevo User con estado Pending
  - [x] Emitir evento `UserRoleRequested`
- [x] Implementar `changeStatusUser(address userAddress, UserStatus newStatus) public onlyAdmin`
  - [x] Validar que el usuario exista
  - [x] Validar que el admin no puede cambiarse su propio estado
  - [x] Actualizar estado del usuario
  - [x] Emitir evento `UserStatusChanged`
- [x] Implementar `getUserInfo(address userAddress) public view returns (User memory)`
- [x] Implementar `isAdmin(address userAddress) public view returns (bool)`
- **Dependencias:** SC-003
- **Prioridad:** Crítica
- **Estimación:** 2 horas

#### SC-005: Implementar Gestión de Tokens
- [x] Implementar `createToken(string memory name, uint totalSupply, string memory features, uint parentId) public onlyApprovedUser`
  - [x] Validar que Producer solo cree tokens sin parentId
  - [x] Validar que Factory/Retailer especifiquen parentId válido
  - [x] Si parentId > 0, validar que el usuario tenga balance del token padre
  - [x] Crear nuevo Token
  - [x] Asignar balance inicial al creador
  - [x] Emitir evento `TokenCreated`
- [x] Implementar `getToken(uint tokenId) public view returns (Token memory)`
  - [x] Nota: No puede retornar mapping directamente, necesitará función auxiliar
- [x] Implementar `getTokenBalance(uint tokenId, address userAddress) public view returns (uint)`
- [x] Implementar `getUserTokens(address userAddress) public view returns (uint[] memory)`
  - [x] Iterar sobre tokens y filtrar por balance > 0
- **Dependencias:** SC-004
- **Prioridad:** Crítica
- **Estimación:** 3 horas

#### SC-006: Implementar Gestión de Transferencias
- [x] Implementar `transfer(address to, uint tokenId, uint amount) public onlyApprovedUser`
  - [x] Validar balance suficiente
  - [x] Validar que destinatario tenga rol válido según flujo (Producer→Factory, Factory→Retailer, Retailer→Consumer)
  - [x] Validar que Consumer no pueda transferir
  - [x] Crear Transfer con estado Pending
  - [x] Emitir evento `TransferRequested`
- [x] Implementar `acceptTransfer(uint transferId) public`
  - [x] Validar que msg.sender sea el destinatario
  - [x] Validar que transferencia esté en estado Pending
  - [x] Validar balance suficiente del remitente
  - [x] Actualizar balances (restar de remitente, sumar a destinatario)
  - [x] Cambiar estado a Accepted
  - [x] Emitir evento `TransferAccepted`
- [x] Implementar `rejectTransfer(uint transferId) public`
  - [x] Validar que msg.sender sea el destinatario
  - [x] Validar que transferencia esté en estado Pending
  - [x] Cambiar estado a Rejected
  - [x] Emitir evento `TransferRejected`
- [x] Implementar `getTransfer(uint transferId) public view returns (Transfer memory)`
- [x] Implementar `getUserTransfers(address userAddress) public view returns (uint[] memory)`
  - [x] Iterar sobre transfers y filtrar por from/to
- **Dependencias:** SC-005
- **Prioridad:** Crítica
- **Estimación:** 4 horas

#### SC-007: Implementar Eventos
- [x] Verificar que todos los eventos estén definidos:
  - [x] `event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply)`
  - [x] `event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount)`
  - [x] `event TransferAccepted(uint256 indexed transferId)`
  - [x] `event TransferRejected(uint256 indexed transferId)`
  - [x] `event UserRoleRequested(address indexed user, string role)`
  - [x] `event UserStatusChanged(address indexed user, UserStatus status)`
- [x] Verificar que todos los eventos se emiten en las funciones correspondientes
- **Dependencias:** SC-006
- **Prioridad:** Crítica
- **Estimación:** 30 min

#### SC-008: Compilar y Verificar Contrato
- [x] Ejecutar `forge build` y verificar que compile sin errores
- [x] Verificar que el ABI se genere correctamente en `sc/out/SupplyChain.sol/SupplyChain.json`
- [x] Revisar warnings y optimizar si es necesario
- **Dependencias:** SC-007
- **Prioridad:** Crítica
- **Estimación:** 30 min

---

### FASE 2: Tests del Smart Contract (Depende de SC-008)

#### SC-009: Setup de Tests
- [x] Crear archivo `sc/test/SupplyChain.t.sol`
- [x] Importar `Test` de forge-std y `SupplyChain` del contrato
- [x] Crear función `setUp()` que:
  - [x] Despliega el contrato
  - [x] Configura cuentas de prueba (admin, producer, factory, retailer, consumer)
  - [x] Inicializa variables de estado necesarias
- **Dependencias:** SC-008
- **Prioridad:** Crítica
- **Estimación:** 1 hora

#### SC-010: Tests de Gestión de Usuarios
- [x] `testUserRegistration()` - Registrar usuario con rol válido
- [x] `testUserRegistrationInvalidRole()` - Intentar registrar con rol inválido
- [x] `testUserRegistrationDuplicate()` - Intentar registrar usuario ya registrado
- [x] `testAdminApproveUser()` - Admin aprueba usuario
- [x] `testAdminRejectUser()` - Admin rechaza usuario
- [x] `testOnlyAdminCanChangeStatus()` - Verificar que solo admin puede cambiar estado
- [x] `testGetUserInfo()` - Obtener información de usuario
- [x] `testIsAdmin()` - Verificar función isAdmin
- [x] `testUserStatusChanges()` - Verificar cambios de estado
- **Dependencias:** SC-009
- **Prioridad:** Crítica
- **Estimación:** 2 horas

#### SC-011: Tests de Gestión de Tokens
- [x] `testCreateTokenByProducer()` - Producer crea token sin parentId
- [x] `testCreateTokenByProducerWithParent()` - Producer intenta crear token con parentId (debe fallar)
- [x] `testCreateTokenByFactory()` - Factory crea token derivado
- [x] `testCreateTokenByFactoryWithoutParent()` - Factory intenta crear sin parentId (debe fallar)
- [x] `testCreateTokenByRetailer()` - Retailer crea token derivado
- [x] `testCreateTokenUnapprovedUser()` - Usuario no aprobado intenta crear token (debe fallar)
- [x] `testTokenBalance()` - Verificar balance inicial después de creación
- [x] `testGetToken()` - Obtener información de token
- [x] `testGetUserTokens()` - Obtener lista de tokens de usuario
- [x] `testTokenMetadata()` - Verificar que metadatos se almacenan correctamente
- **Dependencias:** SC-010
- **Prioridad:** Crítica
- **Estimación:** 3 horas

#### SC-012: Tests de Transferencias
- [x] `testTransferFromProducerToFactory()` - Transferencia válida Producer → Factory
- [x] `testTransferFromProducerToRetailer()` - Transferencia inválida Producer → Retailer (debe fallar)
- [x] `testTransferFromFactoryToRetailer()` - Transferencia válida Factory → Retailer
- [x] `testTransferFromFactoryToConsumer()` - Transferencia inválida Factory → Consumer (debe fallar)
- [x] `testTransferFromRetailerToConsumer()` - Transferencia válida Retailer → Consumer
- [x] `testTransferInsufficientBalance()` - Transferir más de lo que se tiene (debe fallar)
- [x] `testAcceptTransfer()` - Aceptar transferencia pendiente
- [x] `testRejectTransfer()` - Rechazar transferencia pendiente
- [x] `testAcceptTransferWrongRecipient()` - Otro usuario intenta aceptar (debe fallar)
- [x] `testAcceptTransferAlreadyAccepted()` - Intentar aceptar transferencia ya aceptada (debe fallar)
- [x] `testConsumerCannotTransfer()` - Consumer intenta transferir (debe fallar)
- [x] `testGetTransfer()` - Obtener información de transferencia
- [x] `testGetUserTransfers()` - Obtener lista de transferencias de usuario
- [x] `testTransferZeroAmount()` - Transferir cantidad cero (debe fallar)
- **Dependencias:** SC-011
- **Prioridad:** Crítica
- **Estimación:** 4 horas

#### SC-013: Tests de Flujo Completo
- [x] `testCompleteSupplyChainFlow()` - Flujo completo Producer → Factory → Retailer → Consumer
- [x] `testMultipleTokensFlow()` - Múltiples tokens en el sistema
- [x] `testTraceabilityFlow()` - Verificar trazabilidad completa de un producto
- **Dependencias:** SC-012
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### SC-014: Tests de Eventos
- [x] `testUserRegisteredEvent()` - Verificar emisión de evento UserRoleRequested
- [x] `testUserStatusChangedEvent()` - Verificar emisión de evento UserStatusChanged
- [x] `testTokenCreatedEvent()` - Verificar emisión de evento TokenCreated
- [x] `testTransferInitiatedEvent()` - Verificar emisión de evento TransferRequested
- [x] `testTransferAcceptedEvent()` - Verificar emisión de evento TransferAccepted
- [x] `testTransferRejectedEvent()` - Verificar emisión de evento TransferRejected
- **Dependencias:** SC-012
- **Prioridad:** Alta
- **Estimación:** 1 hora

#### SC-015: Ejecutar y Validar Tests
- [x] Ejecutar `forge test` y verificar que todos los tests pasen
- [x] Ejecutar `forge test -vvv` para revisar logs detallados
- [x] Ejecutar `forge coverage` para verificar cobertura > 90%
- [x] Corregir cualquier test fallido
- **Dependencias:** SC-013, SC-014
- **Prioridad:** Crítica
- **Estimación:** 2 horas

---

### FASE 3: Script de Deploy (Depende de SC-008)

#### SC-016: Crear Script de Deploy
- [x] Crear archivo `sc/script/Deploy.s.sol`
- [x] Implementar script que despliega `SupplyChain`
- [x] Configurar para usar variables de entorno o parámetros
- [x] Agregar logs de la dirección del contrato desplegado
- [x] Verificar que el script funciona con `forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key <key> --broadcast`
- **Dependencias:** SC-008
- **Prioridad:** Crítica
- **Estimación:** 1 hora

#### SC-017: Deploy en Anvil
- [x] Iniciar Anvil en terminal separada (`anvil`) 
- [x] Ejecutar script de deploy
- [x] Copiar dirección del contrato desplegado
- [x] Verificar que el contrato esté desplegado correctamente usando `cast`
- [x] Guardar dirección del contrato para configuración del frontend
- **Dependencias:** SC-016
- **Prioridad:** Crítica
- **Estimación:** 30 min

---

### FASE 4: Frontend - Infraestructura Base (Depende de DAPP-001)

#### DAPP-002: Configuración de Tipos TypeScript
- [x] Crear archivo `dapp/types/ethereum.ts` para tipos de window.ethereum (renombrado de .d.ts a .ts)
- [x] Crear archivo `dapp/types/contract.ts` con tipos del contrato:
  - [x] Tipo `User` (id, userAddress, role, status) - incluye "Admin" como rol válido
  - [x] Tipo `Token` (id, creator, name, totalSupply, features, parentId, dateCreated)
  - [x] Tipo `Transfer` (id, from, to, tokenId, dateCreated, amount, status)
  - [x] Enums: `UserStatus`, `TransferStatus`
  - [x] Tipo `UserRole` incluye "Admin" como opción válida
- [x] Crear archivo `dapp/types/index.ts` para exportar todos los tipos
- **Dependencias:** DAPP-001
- **Prioridad:** Crítica
- **Estimación:** 1 hora

#### DAPP-003: Configuración del Contrato
- [x] Copiar ABI del contrato compilado a `dapp/contracts/SupplyChain.json`
- [x] Crear archivo `dapp/contracts/config.ts` con:
  - [x] Dirección del contrato desplegado
  - [x] ABI importado
  - [x] Dirección del admin
  - [x] Configuración de red (Chain ID 31337, RPC URL)
- [x] Crear función helper para obtener instancia del contrato
- **Dependencias:** DAPP-002, SC-017
- **Prioridad:** Crítica
- **Estimación:** 1 hora

#### DAPP-004: Configuración de Variables de Entorno
- [x] Crear archivo `dapp/.env.local` con:
  - [x] `NEXT_PUBLIC_CONTRACT_ADDRESS` (dirección del contrato)
  - [x] `NEXT_PUBLIC_MNEMONIC` (mnemónico de Anvil si es necesario)
  - [x] `NEXT_PUBLIC_RPC_URL` (http://localhost:8545)
  - [x] `NEXT_PUBLIC_CHAIN_ID` (31337)
- [x] Agregar `.env.local` al `.gitignore`
- [x] Crear archivo `.env.example` con plantilla
- **Dependencias:** DAPP-003
- **Prioridad:** Crítica
- **Estimación:** 30 min

---

### FASE 5: Frontend - Contexto y Hooks Base (Depende de DAPP-004)

#### DAPP-005: Implementar MetaMaskContext
- [x] Crear archivo `dapp/contexts/MetaMaskContext.tsx`
- [x] Implementar provider que:
  - [x] Detecta `window.ethereum`, instancia `BrowserProvider` y solicita `eth_requestAccounts`
  - [x] Gestiona estado de conexión (account, isConnected)
  - [x] Persiste conexión en localStorage
  - [x] Detecta cambios de cuenta automáticamente
  - [x] Proporciona funciones: `connect()`, `disconnect()`, `signMessage()`, `getSigner()`
- [x] Implementar lógica de reconexión automática al recargar página
- [x] Manejar errores de conexión apropiadamente
- [x] Manejo de eventos accountsChanged y chainChanged (vital para que la UI no se rompa si el usuario cambia de cuenta en la extensión)
- [x] Invalidar queries de React Query cuando cambia la cuenta para evitar datos mezclados
- [x] Invalidar queries de admin cuando cambia la cuenta
- [x] Manejo mejorado de cambio de red con switch automático
- **Dependencias:** DAPP-004
- **Prioridad:** Crítica
- **Estimación:** 4 horas

#### DAPP-006: Implementar Hook useMetaMask
- [x] Crear archivo `dapp/hooks/useMetaMask.ts`
- [x] Re-exportar hook desde `MetaMaskContext`
- [x] Verificar que expone todas las funciones necesarias:
  - [x] `account: string | null`
  - [x] `isConnected: boolean`
  - [x] `provider: JsonRpcProvider | null`
  - [x] `signer: JsonRpcSigner | null`
  - [x] `signMessage(message: string): Promise<string>`
  - [x] `getSigner(): Promise<JsonRpcSigner>`
  - [x] `connect(): Promise<void>`
  - [x] `disconnect(): void`
- **Dependencias:** DAPP-005
- **Prioridad:** Crítica
- **Estimación:** 30 min

#### DAPP-007: Implementar Hook useContract
- [x] Crear archivo `dapp/hooks/useContract.ts`
- [x] Implementar hook que:
  - [x] Obtiene instancia del contrato usando `useMetaMask`
  - [x] Maneja estado de carga (`isLoading`)
  - [x] Maneja errores (`error`)
  - [x] Expone funciones wrapper para cada función del contrato:
    - [x] `requestUserRole(role: string)`
    - [x] `changeStatusUser(userAddress: string, newStatus: UserStatus)`
    - [x] `getUserInfo(userAddress: string)`
    - [x] `isAdmin(userAddress: string)`
    - [x] `createToken(name: string, totalSupply: bigint, features: string, parentId: bigint)`
    - [x] `getToken(tokenId: bigint)`
    - [x] `getTokenBalance(tokenId: bigint, userAddress: string)`
    - [x] `getUserTokens(userAddress: string)`
    - [x] `transfer(to: string, tokenId: bigint, amount: bigint)`
    - [x] `acceptTransfer(transferId: bigint)`
    - [x] `rejectTransfer(transferId: bigint)`
    - [x] `getTransfer(transferId: bigint)`
    - [x] `getUserTransfers(userAddress: string)`
- [x] Manejar conversiones BigInt ↔ string apropiadamente
- **Dependencias:** DAPP-006
- **Prioridad:** Crítica
- **Estimación:** 4 horas

#### DAPP-008: Implementar Hooks Especializados
- [x] Crear `dapp/hooks/useUserInfo.ts`:
  - [x] Hook que obtiene información de usuario usando `useContract`
  - [x] Maneja estado de carga y error
  - [x] Usa React Query para cacheo
  - [x] Maneja error "User not registered" retornando null sin lanzar error
  - [x] Configura retry para no reintentar cuando el usuario no está registrado
- [x] Crear `dapp/hooks/useUserTokens.ts`:
  - [x] Hook que obtiene tokens de un usuario
  - [x] Maneja estado de carga y error
  - [x] Usa React Query para cacheo
- [x] Crear `dapp/hooks/useUserTransfers.ts`:
  - [x] Hook que obtiene transferencias de un usuario
  - [x] Maneja estado de carga y error
  - [x] Usa React Query para cacheo
- [x] Crear `dapp/hooks/useAdmin.ts`:
  - [x] Hook que obtiene la dirección del admin del contrato dinámicamente
  - [x] Hook que verifica si la cuenta actual es admin
  - [x] Usa React Query para cacheo
  - [x] Maneja estado de carga y error
- **Dependencias:** DAPP-007
- **Prioridad:** Alta
- **Estimación:** 3 horas

#### DAPP-009: Configurar Providers Globales
- [x] Crear archivo `dapp/app/providers.tsx`
- [x] Configurar `QueryClientProvider` para React Query
- [x] Envolver aplicación con `MetaMaskContext.Provider`
- [x] Actualizar `app/layout.tsx` para usar providers
- **Dependencias:** DAPP-005
- **Prioridad:** Crítica
- **Estimación:** 1 hora

---

### FASE 6: Frontend - Componentes UI Base (Depende de DAPP-009)

#### DAPP-010: Instalar y Configurar Shadcn UI
- [x] Instalar shadcn/ui según documentación oficial
- [x] Configurar `components.json`
- [x] Instalar componentes base necesarios:
  - [x] `button`
  - [x] `card`
  - [x] `input`
  - [x] `label`
  - [x] `select`
  - [x] `table`
  - [x] `badge`
  - [x] `dialog`
  - [x] `toast` (opcional)
- **Dependencias:** DAPP-009
- **Prioridad:** Alta
- **Estimación:** 1 hora

#### DAPP-011: Crear Componentes de UI Reutilizables
- [x] Crear `components/ui/LoadingSpinner.tsx` - Indicador de carga
- [x] Crear `components/ui/ErrorMessage.tsx` - Mensaje de error
- [x] Crear `components/ui/AddressDisplay.tsx` - Mostrar dirección Ethereum formateada
- [x] Crear `components/ui/StatusBadge.tsx` - Badge para estados (Pending, Approved, etc.)
- [x] Crear `components/ui/ConnectWalletButton.tsx` - Botón para conectar wallet
- **Dependencias:** DAPP-010
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DAPP-012: Crear Componente Header
- [x] Crear `components/Header.tsx`:
  - [x] Mostrar estado de conexión
  - [x] Mostrar dirección conectada (formateada)
  - [x] Botón de conexión/desconexión
  - [x] Navegación según rol del usuario
  - [x] Responsive design
- **Dependencias:** DAPP-011
- **Prioridad:** Alta
- **Estimación:** 2 horas

---

### FASE 7: Frontend - Páginas Principales (Depende de DAPP-012)

#### DAPP-013: Implementar Página Principal (/)
- [x] Crear `app/page.tsx`
- [x] Implementar lógica de estados:
  - [x] No conectado: Mostrar invitación a conectar wallet
  - [x] Conectado pero no registrado: Mostrar formulario de registro por rol
  - [x] Conectado y pendiente: Mostrar mensaje de espera de aprobación
  - [x] Conectado y aprobado: Redireccionar a dashboard
  - [x] Admin conectado: Mostrar mensaje de bienvenida sin formulario de registro
  - [x] Admin no redirige automáticamente (puede elegir ir a admin o dashboard)
- [x] Implementar formulario de registro con validación
- [x] Manejar errores y estados de carga
- **Dependencias:** DAPP-012
- **Prioridad:** Crítica
- **Estimación:** 3 horas

#### DAPP-014: Implementar Dashboard (/dashboard)
- [x] Crear `app/dashboard/page.tsx`
- [x] Implementar dashboard personalizado según rol:
  - [x] Producer: Estadísticas de tokens creados, transferencias pendientes
  - [x] Factory: Tokens recibidos, productos creados
  - [x] Retailer: Productos recibidos, transferencias a consumidores
  - [x] Consumer: Productos recibidos, opción de ver trazabilidad
- [x] Mostrar tokens recientes
- [x] Mostrar transferencias pendientes
- [x] Accesos rápidos a funcionalidades principales
- [x] Responsive design
- **Dependencias:** DAPP-013
- **Prioridad:** Crítica
- **Estimación:** 4 horas

#### DAPP-015: Implementar Gestión de Tokens (/tokens)
- [x] Crear `app/tokens/page.tsx` - Lista de tokens del usuario
  - [x] Mostrar grid/lista de tokens con balance > 0
  - [x] Mostrar nombre, cantidad, fecha de creación
  - [x] Enlace a detalles de cada token
  - [x] Botón para crear nuevo token
- [x] Crear `app/tokens/create/page.tsx` - Formulario para crear token
  - [x] Campos: nombre, cantidad total, metadatos JSON, parentId (si aplica)
  - [x] Validación según rol (Producer no puede poner parentId)
  - [x] Mostrar lista de tokens padre disponibles (si Factory/Retailer)
  - [x] Manejar estados de carga y error
- [x] Crear `app/tokens/[id]/page.tsx` - Detalles del token
  - [x] Mostrar información completa del token
  - [x] Mostrar balance del usuario
  - [x] Mostrar token padre si existe (trazabilidad hacia atrás)
  - [x] Mostrar historial de transferencias relacionadas
  - [x] Botón para transferir (si tiene balance)
- [x] Crear `app/tokens/[id]/transfer/page.tsx` - Formulario de transferencia
  - [x] Select con lista de usuarios aprobados (en lugar de campo de texto para dirección)
  - [x] Mostrar rol de cada usuario en el Select con badge
  - [x] Obtener usuarios del contrato filtrando solo Approved y excluyendo usuario actual
  - [x] Selección de destinatario desde dropdown (con validación de rol)
  - [x] Campo de cantidad
  - [x] Validación de balance suficiente
  - [x] Manejar estados de carga y error
  - [x] Mostrar información del destinatario seleccionado (rol y estado)
- **Dependencias:** DAPP-014
- **Prioridad:** Crítica
- **Estimación:** 6 horas

#### DAPP-016: Implementar Gestión de Transferencias (/transfers)
- [x] Crear `app/transfers/page.tsx`
- [x] Mostrar transferencias pendientes recibidas:
  - [x] Lista de transferencias con estado Pending
  - [x] Información: remitente, token, cantidad, fecha
  - [x] Botones para aceptar/rechazar
- [x] Mostrar historial de transferencias:
  - [x] Transferencias enviadas y recibidas
  - [x] Filtrar por estado (Pending, Accepted, Rejected)
  - [x] Ordenar por fecha (más reciente primero)
- [x] Manejar acciones de aceptar/rechazar
- [x] Actualizar UI después de acciones
- **Dependencias:** DAPP-015
- **Prioridad:** Crítica
- **Estimación:** 4 horas

#### DAPP-017: Implementar Panel de Administración (/admin)
- [x] Crear `app/admin/page.tsx` - Panel principal de admin
  - [x] Estadísticas del sistema (usuarios totales, tokens, transferencias)
  - [x] Accesos rápidos a gestión de usuarios
  - [x] Usa hook `useAdmin` para verificar permisos dinámicamente
- [x] Crear `app/admin/users/page.tsx` - Gestión de usuarios
  - [x] Tabla con todos los usuarios
  - [x] Filtrar por rol y estado
  - [x] Mostrar información: dirección, rol, estado, fecha registro
  - [x] Botones para aprobar/rechazar usuarios pendientes
  - [x] Ocultar botones de rechazar para el admin (no puede rechazarse a sí mismo)
  - [x] Mostrar "Admin" como texto informativo cuando el usuario es admin
  - [x] Actualizar lista sin recargar página después de aprobar/rechazar
  - [x] Paginación si hay muchos usuarios
- [x] Implementar protección de ruta (solo admin puede acceder usando `useAdmin`)
- **Dependencias:** DAPP-016
- **Prioridad:** Crítica
- **Estimación:** 5 horas

#### DAPP-018: Implementar Perfil (/profile)
- [x] Crear `app/profile/page.tsx`
- [x] Mostrar información del usuario:
  - [x] Dirección, rol, estado
  - [x] Fecha de registro
- [x] Mostrar portfolio de tokens:
  - [x] Resumen de tokens poseídos
  - [x] Estadísticas (total de tokens, valor estimado si aplica)
- [x] Mostrar estadísticas de actividad:
  - [x] Transferencias enviadas/recibidas
  - [x] Tokens creados
- **Dependencias:** DAPP-017
- **Prioridad:** Media
- **Estimación:** 2 horas

---

### FASE 8: Frontend - Funcionalidades Avanzadas (Depende de DAPP-018)

#### DAPP-019: Implementar Trazabilidad Completa
- [x] Crear componente `components/TraceabilityTree.tsx`
- [x] Implementar visualización de árbol de parentesco de tokens:
  - [x] Mostrar cadena completa: Producer → Factory → Retailer → Consumer
  - [x] Visualización jerárquica (árbol o diagrama)
  - [x] Mostrar información de cada actor en la cadena
- [x] Integrar en página de detalles de token
- [x] Mostrar todas las transferencias relacionadas
- **Dependencias:** DAPP-018
- **Prioridad:** Alta
- **Estimación:** 4 horas

#### DAPP-020: Implementar Navegación por Rol
- [x] Actualizar `components/Header.tsx` para mostrar navegación según rol:
  - [x] Producer: Dashboard, Tokens, Transferencias, Perfil
  - [x] Factory: Dashboard, Tokens, Transferencias, Perfil
  - [x] Retailer: Dashboard, Tokens, Transferencias, Perfil
  - [x] Consumer: Dashboard, Tokens (solo lectura), Perfil
  - [x] Admin: Admin, Usuarios (navegación específica para admin)
  - [x] Mostrar estado "Admin" con badge Approved cuando el usuario es admin
- [x] Ocultar opciones no disponibles según permisos
- [x] Implementar protección de rutas en middleware o componentes
- [x] Usar hook `useAdmin` para determinar navegación del admin
- **Dependencias:** DAPP-019
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DAPP-021: Mejorar Manejo de Errores
- [x] Crear componente global de manejo de errores
- [x] Implementar mensajes de error claros y útiles:
  - [x] Errores de conexión
  - [x] Errores de transacción (revert reasons)
  - [x] Errores de validación
- [x] Mostrar toasts o notificaciones para acciones exitosas/fallidas
- [x] Implementar retry logic para transacciones fallidas
- **Dependencias:** DAPP-020
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DAPP-022: Optimizaciones de Rendimiento
- [x] Implementar paginación en listas grandes (tokens, transferencias, usuarios)
- [x] Optimizar queries de React Query con cacheo apropiado
- [x] Implementar lazy loading para componentes pesados
- [x] Optimizar re-renders innecesarios con React.memo donde sea apropiado
- [x] Verificar que las páginas cargan en < 2 segundos
- **Dependencias:** DAPP-021
- **Prioridad:** Media
- **Estimación:** 3 horas

---

### FASE 9: Revisión y Ajuste (Depende de todas las fases anteriores)

#### SC-019: Tests de Registro Automático del Admin
- [ ] `testAdminAutoRegistration()` - Verificar que el admin se registra automáticamente en el constructor
  - [ ] Verificar que el admin tiene userId = 1
  - [ ] Verificar que el admin tiene rol "Admin"
  - [ ] Verificar que el admin tiene estado Approved
  - [ ] Verificar que está en el mapping `addressToUserId`
  - [ ] Verificar que está en el array `allUserIds`
- [ ] `testAdminCannotChangeOwnStatus()` - Verificar que el admin no puede cambiarse su propio estado
  - [ ] Intentar cambiar estado del admin a Rejected (debe fallar)
  - [ ] Intentar cambiar estado del admin a Canceled (debe fallar)
  - [ ] Verificar mensaje de error "Admin cannot change their own status"
- [ ] `testAdminRoleIsValid()` - Verificar que "Admin" es un rol válido según `_isValidRole`
- [ ] `testAdminGetUserInfo()` - Verificar que `getUserInfo` retorna correctamente la información del admin
- [ ] `testAdminIsRegistered()` - Verificar que `getUserInfo` no lanza error "User not registered" para el admin
- **Dependencias:** SC-015
- **Prioridad:** Crítica
- **Estimación:** 2 horas

#### SC-020: Tests de Eventos del Admin
- [ ] `testAdminRegistrationEvents()` - Verificar eventos emitidos durante registro automático del admin
  - [ ] Verificar emisión de `UserRoleRequested` con rol "Admin"
  - [ ] Verificar emisión de `UserStatusChanged` con estado Approved
- **Dependencias:** SC-019
- **Prioridad:** Alta
- **Estimación:** 1 hora

#### DAPP-026: Tests del Hook useAdmin
- [ ] Crear archivo `dapp/__tests__/hooks/useAdmin.test.tsx`
- [ ] `testUseAdminReturnsAdminAddress()` - Verificar que retorna la dirección del admin correctamente
- [ ] `testUseAdminDetectsAdmin()` - Verificar que detecta correctamente si la cuenta actual es admin
- [ ] `testUseAdminUpdatesOnAccountChange()` - Verificar que se actualiza cuando cambia la cuenta
- [ ] `testUseAdminHandlesNoContract()` - Verificar manejo cuando no hay contrato disponible
- [ ] `testUseAdminCacheInvalidation()` - Verificar que el cache se invalida correctamente
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DAPP-027: Tests de Manejo de Errores "User not registered"
- [ ] Crear archivo `dapp/__tests__/hooks/useUserInfo.test.tsx`
- [ ] `testUseUserInfoHandlesNotRegistered()` - Verificar que retorna null cuando usuario no está registrado
- [ ] `testUseUserInfoNoRetryOnNotRegistered()` - Verificar que no reintenta cuando el error es "User not registered"
- [ ] `testUseUserInfoDoesNotThrowOnNotRegistered()` - Verificar que no lanza error en la UI cuando usuario no está registrado
- [ ] `testUseUserInfoHandlesAdminNotRegistered()` - Verificar comportamiento cuando admin no está registrado (caso edge)
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DAPP-028: Tests de Invalidación de Queries
- [ ] Crear archivo `dapp/__tests__/contexts/MetaMaskContext.test.tsx`
- [ ] `testQueriesInvalidatedOnAccountChange()` - Verificar que las queries se invalidan cuando cambia la cuenta
- [ ] `testAdminQueriesInvalidatedOnAccountChange()` - Verificar que las queries de admin se invalidan correctamente
- [ ] `testPreviousAccountQueriesRemoved()` - Verificar que las queries de la cuenta anterior se eliminan
- [ ] `testQueriesInvalidatedOnDisconnect()` - Verificar que las queries se invalidan al desconectar
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DAPP-029: Tests de UI del Admin
- [ ] Crear archivo `dapp/__tests__/components/Header.test.tsx`
- [ ] `testHeaderShowsAdminRole()` - Verificar que el Header muestra "Admin" cuando el usuario es admin
- [ ] `testHeaderShowsAdminNavigation()` - Verificar que muestra navegación de admin cuando corresponde
- [ ] `testHeaderHidesRegistrationFormForAdmin()` - Verificar que no muestra formulario de registro para admin
- [ ] Crear archivo `dapp/__tests__/app/admin/users/page.test.tsx`
- [ ] `testAdminUsersPageHidesRejectForAdmin()` - Verificar que no muestra botón de rechazar para el admin
- [ ] `testAdminUsersPageShowsAdminLabel()` - Verificar que muestra "Admin" como texto informativo
- [ ] `testAdminUsersPageUpdatesWithoutReload()` - Verificar que la lista se actualiza sin recargar la página
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 3 horas

#### DAPP-030: Tests de Página Principal con Admin
- [ ] Crear archivo `dapp/__tests__/app/page.test.tsx`
- [ ] `testHomePageShowsAdminWelcome()` - Verificar que muestra mensaje de bienvenida para admin
- [ ] `testHomePageNoRedirectForAdmin()` - Verificar que no redirige automáticamente al admin
- [ ] `testHomePageHidesRegistrationForAdmin()` - Verificar que no muestra formulario de registro para admin
- [ ] `testHomePageShowsAdminButton()` - Verificar que muestra botón para ir al panel de administración
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DAPP-031: Tests de Integración Admin Completo
- [ ] Crear archivo `dapp/__tests__/integration/admin-flow.test.tsx`
- [ ] `testAdminFlowComplete()` - Flujo completo del admin:
  - [ ] Admin se conecta y ve mensaje de bienvenida
  - [ ] Admin navega a panel de administración
  - [ ] Admin ve lista de usuarios (incluyéndose a sí mismo)
  - [ ] Admin no puede rechazarse a sí mismo
  - [ ] Admin aprueba otros usuarios
  - [ ] Lista se actualiza sin recargar página
- [ ] `testAdminCannotSelfReject()` - Verificar que el admin no puede rechazarse a sí mismo desde la UI
- [ ] `testAdminCannotSelfRejectContract()` - Verificar que el contrato rechaza intento de auto-rechazo
- **Dependencias:** DAPP-029, DAPP-030
- **Prioridad:** Crítica
- **Estimación:** 3 horas

#### DAPP-032: Validación de Tipos TypeScript Actualizados
- [ ] Verificar que el tipo `UserRole` incluye "Admin"
- [ ] Verificar que la interfaz `User` acepta rol "Admin"
- [ ] Verificar que todos los componentes que usan `UserRole` manejan "Admin" correctamente
- [ ] Ejecutar `tsc --noEmit` y verificar que no hay errores de tipos
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 1 hora

#### DAPP-033: Tests de Reconexión Automática al Cambiar Cuenta
- [ ] Crear archivo `dapp/__tests__/contexts/MetaMaskContext-reconnection.test.tsx`
- [ ] `testAutoReconnectOnAccountChange()` - Verificar que se reconecta automáticamente cuando cambia la cuenta en MetaMask
  - [ ] Simular evento `accountsChanged` con nueva cuenta
  - [ ] Verificar que se llama a `checkConnection()` automáticamente
  - [ ] Verificar que el estado se actualiza con la nueva cuenta
  - [ ] Verificar que se limpian queries de la cuenta anterior
- [ ] `testAutoReconnectUsesPreviousAccountRef()` - Verificar que usa `previousAccountRef` en lugar de `state.account`
  - [ ] Verificar que no hay problemas de closure con el estado
  - [ ] Verificar que la referencia se actualiza correctamente
- [ ] `testAutoReconnectHandlesNetworkValidation()` - Verificar que valida la red antes de reconectar
  - [ ] Verificar que si la red es incorrecta, no se reconecta
  - [ ] Verificar que si la red es correcta, se reconecta exitosamente
- [ ] `testAutoReconnectClearsPreviousQueries()` - Verificar que limpia queries de cuenta anterior antes de reconectar
  - [ ] Verificar que se eliminan queries de usuario anterior
  - [ ] Verificar que se invalidan queries de admin
- **Dependencias:** DAPP-028
- **Prioridad:** Crítica
- **Estimación:** 3 horas

#### DAPP-034: Tests de TraceabilityTree Timeline
- [ ] Crear archivo `dapp/__tests__/components/TraceabilityTree.test.tsx`
- [ ] `testTraceabilityTreeShowsTimeline()` - Verificar que muestra timeline vertical
  - [ ] Verificar que existe línea vertical del timeline
  - [ ] Verificar que los nodos están posicionados correctamente
  - [ ] Verificar que las transferencias se ordenan cronológicamente (más antiguas primero)
- [ ] `testTraceabilityTreeHighlightsUserReceiver()` - Verificar diferenciación visual cuando usuario es receptor
  - [ ] Verificar que transferencias donde usuario es receptor tienen fondo destacado
  - [ ] Verificar que el nodo tiene borde y relleno en color primario
  - [ ] Verificar que la dirección del receptor está en negrita y color primario
  - [ ] Verificar que muestra badge "Tú" cuando el usuario es receptor
- [ ] `testTraceabilityTreeMapsTransferStatus()` - Verificar mapeo correcto de estados
  - [ ] Verificar que estado numérico 0 se mapea a TransferStatus.Pending
  - [ ] Verificar que estado numérico 1 se mapea a TransferStatus.Accepted
  - [ ] Verificar que estado numérico 2 se mapea a TransferStatus.Rejected
  - [ ] Verificar que StatusBadge muestra el estado correcto
- [ ] `testTraceabilityTreeShowsTransferDetails()` - Verificar que muestra detalles de transferencias
  - [ ] Verificar que muestra fecha formateada correctamente
  - [ ] Verificar que muestra direcciones de remitente y destinatario
  - [ ] Verificar que muestra roles de usuarios si están disponibles
  - [ ] Verificar que muestra cantidad de transferencia
- [ ] `testTraceabilityTreeHandlesEmptyTransfers()` - Verificar manejo cuando no hay transferencias
  - [ ] Verificar que muestra mensaje apropiado cuando no hay transferencias
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 3 horas

#### DAPP-035: Tests de Mapeo de Estados de Transferencia
- [ ] Crear archivo `dapp/__tests__/hooks/useContract-transfer-status.test.tsx`
- [ ] `testGetTransferMapsStatusCorrectly()` - Verificar que `getTransfer` mapea estados correctamente
  - [ ] Verificar mapeo de estado 0 a TransferStatus.Pending
  - [ ] Verificar mapeo de estado 1 a TransferStatus.Accepted
  - [ ] Verificar mapeo de estado 2 a TransferStatus.Rejected
  - [ ] Verificar que el tipo de retorno es correcto
- [ ] `testGetUserTransfersMapsStatusCorrectly()` - Verificar que `getUserTransfers` mapea estados en todas las transferencias
  - [ ] Verificar que todas las transferencias tienen estados mapeados correctamente
- [ ] `testTransferStatusMappingInTraceabilityTree()` - Verificar que TraceabilityTree mapea estados igual que useContract
  - [ ] Verificar consistencia entre ambos componentes
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DAPP-036: Tests de Formulario de Transferencia con Select de Usuarios
- [ ] Crear archivo `dapp/__tests__/app/tokens/[id]/transfer/page.test.tsx`
- [ ] `testTransferPageShowsUserSelect()` - Verificar que muestra Select en lugar de Input para destinatario
  - [ ] Verificar que existe componente Select
  - [ ] Verificar que no existe Input para dirección
  - [ ] Verificar placeholder "Selecciona un destinatario"
- [ ] `testTransferPageLoadsApprovedUsers()` - Verificar que carga usuarios aprobados correctamente
  - [ ] Verificar que muestra spinner mientras carga usuarios
  - [ ] Verificar que obtiene usuarios del contrato usando `nextUserId`
  - [ ] Verificar que filtra solo usuarios con estado Approved
  - [ ] Verificar que excluye al usuario actual de la lista
- [ ] `testTransferPageShowsUserRoleInSelect()` - Verificar que muestra rol de cada usuario en el Select
  - [ ] Verificar que cada SelectItem muestra dirección truncada
  - [ ] Verificar que cada SelectItem muestra rol en span con estilo badge
  - [ ] Verificar formato: `0x1234...5678` y badge con rol
- [ ] `testTransferPageSelectValueShowsAddressAndRole()` - Verificar que el valor seleccionado muestra dirección y rol
  - [ ] Seleccionar un usuario del Select
  - [ ] Verificar que SelectValue muestra formato: `0x1234...5678 (Rol)`
- [ ] `testTransferPageHandlesEmptyUsersList()` - Verificar manejo cuando no hay usuarios disponibles
  - [ ] Simular escenario sin usuarios aprobados
  - [ ] Verificar que muestra mensaje "No hay usuarios disponibles"
  - [ ] Verificar que SelectItem está deshabilitado
- [ ] `testTransferPageFiltersUsersByStatus()` - Verificar que solo muestra usuarios aprobados
  - [ ] Crear usuarios con diferentes estados (Pending, Approved, Rejected)
  - [ ] Verificar que solo aparecen usuarios Approved en el Select
- [ ] `testTransferPageExcludesCurrentUser()` - Verificar que excluye al usuario actual
  - [ ] Verificar que el usuario conectado no aparece en la lista
  - [ ] Verificar que otros usuarios sí aparecen
- [ ] `testTransferPageShowsRecipientInfo()` - Verificar que muestra información del destinatario seleccionado
  - [ ] Seleccionar un usuario del Select
  - [ ] Verificar que muestra información adicional: "Rol: [rol]" y "✓ Aprobado"
- **Dependencias:** DAPP-022
- **Prioridad:** Alta
- **Estimación:** 3 horas

---

### FASE 10: Testing y Validación Final (Depende de todas las fases anteriores)

#### DAPP-023: Testing Manual End-to-End
- [ ] Probar flujo completo de registro:
  - [ ] Conectar wallet
  - [ ] Registrar como Producer
  - [ ] Admin aprueba usuario
  - [ ] Usuario puede crear tokens
- [ ] Probar flujo completo de cadena de suministro:
  - [ ] Producer crea materia prima
  - [ ] Producer transfiere a Factory usando Select de usuarios (seleccionar Factory de la lista)
  - [ ] Verificar que Select muestra usuarios aprobados con sus roles
  - [ ] Verificar que usuario actual no aparece en la lista
  - [ ] Factory acepta transferencia
  - [ ] Factory crea producto derivado
  - [ ] Factory transfiere a Retailer usando Select de usuarios
  - [ ] Retailer acepta y transfiere a Consumer usando Select de usuarios
  - [ ] Consumer acepta y consulta trazabilidad
- [ ] Probar casos de error:
  - [ ] Transferencias inválidas (roles incorrectos)
  - [ ] Balance insuficiente
  - [ ] Usuario no aprobado intenta operar
- **Dependencias:** DAPP-032
- **Prioridad:** Crítica
- **Estimación:** 4 horas

#### DAPP-024: Validación de Responsive Design
- [ ] Probar en diferentes tamaños de pantalla:
  - [ ] Mobile (320px - 768px)
  - [ ] Tablet (768px - 1024px)
  - [ ] Desktop (> 1024px)
- [ ] Verificar que todos los componentes se adaptan correctamente
- [ ] Verificar que la navegación funciona en mobile
- [ ] Corregir problemas de responsive encontrados
- **Dependencias:** DAPP-023
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### SC-018: Optimización de Gas (Opcional)
- [ ] Revisar funciones del contrato para optimizar gas
- [ ] Usar `unchecked` blocks donde sea seguro
- [ ] Optimizar loops y operaciones costosas
- [ ] Verificar que los tests siguen pasando después de optimizaciones
- **Dependencias:** SC-015
- **Prioridad:** Media
- **Estimación:** 2 horas

#### DAPP-025: Build de Producción
- [ ] Ejecutar `npm run build` y verificar que no hay errores
- [ ] Revisar warnings y optimizar código
- [ ] Verificar que todas las rutas se generan correctamente
- [ ] Probar build de producción localmente
- **Dependencias:** DAPP-024
- **Prioridad:** Crítica
- **Estimación:** 1 hora

---

### FASE 11: Documentación Final (Depende de todas las fases anteriores)

#### DOC-001: Actualizar README Principal
- [ ] Actualizar `README.md` con:
  - [ ] Instrucciones de instalación completas
  - [ ] Instrucciones de deploy del contrato
  - [ ] Instrucciones de configuración del frontend
  - [ ] Instrucciones de ejecución
  - [ ] Troubleshooting común
- [ ] Agregar screenshots de la aplicación
- [ ] Agregar diagramas de arquitectura si es necesario
- **Dependencias:** DAPP-025, SC-017
- **Prioridad:** Alta
- **Estimación:** 2 horas

#### DOC-002: Documentar Código
- [ ] Agregar comentarios NatSpec a todas las funciones del contrato
- [ ] Agregar JSDoc a funciones complejas del frontend
- [ ] Documentar decisiones arquitectónicas importantes
- [ ] Crear guía de contribución si es necesario
- **Dependencias:** DOC-001
- **Prioridad:** Media
- **Estimación:** 2 horas

---

## 3. Resumen de Dependencias

### Gráfico de Dependencias Críticas

```
FASE 0 (Configuración Base)
├── SC-001 (Foundry Config)
└── DAPP-001 (Next.js Init)

FASE 1 (Smart Contract Core)
└── SC-001 → SC-002 → SC-003 → SC-004 → SC-005 → SC-006 → SC-007 → SC-008

FASE 2 (Tests Smart Contract)
└── SC-008 → SC-009 → SC-010 → SC-011 → SC-012 → SC-013 → SC-014 → SC-015

FASE 3 (Deploy)
└── SC-008 → SC-016 → SC-017

FASE 4 (Frontend Infraestructura)
└── DAPP-001 → DAPP-002 → DAPP-003 → DAPP-004

FASE 5 (Contextos y Hooks)
└── DAPP-004 → DAPP-005 → DAPP-006 → DAPP-007 → DAPP-008 → DAPP-009

FASE 6 (Componentes UI Base)
└── DAPP-009 → DAPP-010 → DAPP-011 → DAPP-012

FASE 7 (Páginas Principales)
└── DAPP-012 → DAPP-013 → DAPP-014 → DAPP-015 → DAPP-016 → DAPP-017 → DAPP-018

FASE 8 (Funcionalidades Avanzadas)
└── DAPP-018 → DAPP-019 → DAPP-020 → DAPP-021 → DAPP-022

FASE 9 (Revisión y Ajuste)
└── DAPP-022 → SC-019 → SC-020 → DAPP-026 → DAPP-027 → DAPP-028 → DAPP-029 → DAPP-030 → DAPP-031 → DAPP-032 → DAPP-033 → DAPP-034 → DAPP-035 → DAPP-036

FASE 10 (Testing y Validación)
└── DAPP-036 → DAPP-023 → DAPP-024 → DAPP-025

FASE 11 (Documentación)
└── DAPP-025 → DOC-001 → DOC-002
```

---

## 4. Estimaciones Totales

### Por Fase

| Fase | Tareas | Estimación Total | Prioridad |
|------|--------|------------------|------------|
| Fase 0: Configuración Base | 2 | 1.5 horas | Crítica |
| Fase 1: Smart Contract Core | 8 | 14 horas | Crítica |
| Fase 2: Tests Smart Contract | 7 | 15 horas | Crítica |
| Fase 3: Deploy | 2 | 1.5 horas | Crítica |
| Fase 4: Frontend Infraestructura | 4 | 3.5 horas | Crítica |
| Fase 5: Contextos y Hooks | 5 | 10.5 horas | Crítica |
| Fase 6: Componentes UI Base | 3 | 5 horas | Alta |
| Fase 7: Páginas Principales | 6 | 23 horas | Crítica |
| Fase 8: Funcionalidades Avanzadas | 4 | 11 horas | Alta |
| Fase 9: Revisión y Ajuste | 14 | 29 horas | Crítica |
| Fase 10: Testing y Validación | 4 | 9 horas | Crítica |
| Fase 11: Documentación | 2 | 4 horas | Alta |
| **TOTAL** | **61 tareas** | **~128 horas** | |

### Por Componente

| Componente | Estimación | % del Total |
|------------|------------|-------------|
| Smart Contracts | ~33.5 horas | 29% |
| Frontend | ~75 horas | 64% |
| Testing | ~27 horas | 23% |
| Documentación | ~4 horas | 3% |

---

## 5. Riesgos y Mitigaciones

### Riesgos Identificados

1. **Complejidad del Struct Token con Mapping**
   - **Riesgo:** No se puede retornar directamente un struct con mapping desde una función view
   - **Mitigación:** Implementar función auxiliar `getTokenBalance` separada

2. **Gestión de Arrays Grandes en getUserTokens/getUserTransfers**
   - **Riesgo:** Puede consumir mucho gas si hay muchos tokens/transfers
   - **Mitigación:** Implementar paginación o límites en el frontend

3. **Conversión BigInt en Frontend**
   - **Riesgo:** JavaScript no maneja BigInt nativamente en todos los casos
   - **Mitigación:** Usar utilidades de ethers.js y crear helpers de conversión

4. **Persistencia de Conexión en localStorage**
   - **Riesgo:** Puede causar problemas si el usuario cambia de red
   - **Mitigación:** Validar Chain ID al reconectar

5. **Validación de Roles en Transferencias**
   - **Riesgo:** Lógica compleja puede tener bugs
   - **Mitigación:** Tests exhaustivos de todos los casos de transferencia

---

## 6. Criterios de Éxito por Fase

### Fase 1-3 (Smart Contract)
- ✅ Contrato compila sin errores
- ✅ Todos los tests pasan (100%)
- ✅ Cobertura > 90%
- ✅ Contrato desplegado en Anvil

### Fase 4-5 (Frontend Base)
- ✅ Frontend se conecta a Anvil
- ✅ Wallet se conecta correctamente
- ✅ Estado persiste en localStorage
- ✅ Hooks funcionan correctamente

### Fase 6-7 (Páginas Principales)
- ✅ Todas las páginas principales funcionan
- ✅ Formularios validan correctamente
- ✅ Transacciones se ejecutan correctamente
- ✅ UI es responsive

### Fase 8 (Funcionalidades Avanzadas)
- ✅ Trazabilidad completa funciona
- ✅ Flujo completo Producer → Consumer funciona
- ✅ Manejo de errores robusto

### Fase 9 (Revisión y Ajuste)
- ✅ Tests de registro automático del admin pasan
- ✅ Tests de protección del admin pasan
- ✅ Tests de hooks y contextos pasan
- ✅ Tests de UI del admin pasan
- ✅ Tests de reconexión automática al cambiar cuenta pasan
- ✅ Tests de TraceabilityTree timeline pasan
- ✅ Tests de mapeo de estados de transferencia pasan
- ✅ Tests de formulario de transferencia con Select de usuarios pasan
- ✅ Validación de tipos TypeScript correcta

### Fase 10 (Testing y Validación)
- ✅ Build de producción sin errores
- ✅ Tests end-to-end pasan
- ✅ Responsive design validado

---

## 7. Notas de Implementación

### Consideraciones Importantes

1. **Versión de Solidity:** Usar `pragma solidity 0.8.20;` según estándares del proyecto

2. **Gestión de Wallets:** 
   - Debes usar `window.ethereum` y`BrowserProvider` para operaciones de firma.
   - SIEMPRE usar `MetaMaskContext` y `useMetaMask` hook
   - En Ethers v6, debes usar new ethers.BrowserProvider(window.ethereum) para obtener el Signer del usuario.
   - JsonRpcProvider solo debe usarse si quieres lectura pública sin wallet conectada (opcional), pero para transacciones (crear token, transferir) necesitas el BrowserProvider.

3. **Estructura de Datos:**
   - Usar mapping + array para almacenamiento eficiente
   - NO usar campo `exists` en structs, verificar por valores por defecto

4. **Eventos:**
   - Todos los eventos deben tener parámetros `indexed` para filtrado eficiente
   - Emitir eventos en todas las funciones que modifican estado

5. **Validaciones:**
   - Validar todos los inputs en el contrato
   - Validar permisos en cada función
   - Validar estados antes de operaciones

6. **Frontend:**
   - Usar React Query para cacheo de datos del contrato
   - Manejar estados de carga y error en todos los componentes
   - Implementar paginación para listas grandes
   - Invalidar queries cuando cambia la cuenta para evitar datos mezclados
   - Formulario de transferencia usa Select con lista de usuarios aprobados en lugar de campo de texto
   - El Select muestra dirección truncada y rol de cada usuario para facilitar selección

7. **Registro Automático del Admin:**
   - El admin se registra automáticamente en el constructor del contrato
   - El admin tiene rol "Admin" y estado Approved desde el despliegue
   - El admin no puede cambiarse su propio estado (protección en contrato y UI)
   - El hook `useAdmin` obtiene dinámicamente la dirección del admin del contrato

8. **Manejo de Errores "User not registered":**
   - Este error es esperado cuando un usuario no está registrado
   - Se maneja silenciosamente retornando `null` en lugar de lanzar error
   - React Query no reintenta cuando el error es "User not registered"
   - No se muestra error en la UI para este caso específico

---

## 8. Próximos Pasos Inmediatos

1. **Empezar con Fase 0:**
   - Configurar Foundry (SC-001)
   - Inicializar proyecto Next.js (DAPP-001)

2. **Continuar con Fase 1:**
   - Implementar estructuras de datos del contrato (SC-002)
   - Implementar funciones básicas (SC-003 a SC-007)

3. **Validar con Tests:**
   - Escribir tests mientras se implementa (Fase 2)
   - Asegurar que todos pasan antes de continuar

4. **Integrar Frontend:**
   - Una vez el contrato esté desplegado, empezar con frontend (Fase 4+)

---
