# Product Requirements Document (PRD)
## Supply Chain Tracker - DApp de Trazabilidad Blockchain

**Versión:** 1.0  
**Fecha:** 2025-01-XX  
**Autor:** Product Management Team  
**Estado:** Draft

---

## 1. Visión del Producto

### 1.1 Resumen Ejecutivo

Supply Chain Tracker es una aplicación descentralizada (DApp) construida sobre blockchain Ethereum que permite rastrear productos y materias primas a lo largo de toda la cadena de suministro, desde el productor hasta el consumidor final. La aplicación garantiza transparencia, seguridad e inmutabilidad mediante contratos inteligentes.

### 1.2 Objetivos del Producto

- **Transparencia**: Proporcionar visibilidad completa del recorrido de productos
- **Seguridad**: Garantizar la integridad de los datos mediante blockchain
- **Trazabilidad**: Rastrear productos desde origen hasta destino final
- **Control de Acceso**: Gestionar permisos por roles con aprobación administrativa
- **Tokenización**: Representar productos físicos como tokens digitales

### 1.3 Alcance

**Incluido:**
- Sistema de gestión de usuarios con roles y aprobación
- Creación y gestión de tokens que representan productos
- Sistema de transferencias controladas entre roles
- Trazabilidad completa de productos
- Interfaz web moderna y responsive

**Excluido (Fase 1):**
- Integración con sistemas ERP externos
- Notificaciones push en tiempo real
- Sistema de pagos integrado
- Deploy en mainnet (solo desarrollo local)

---

## 2. Actores y Roles

### 2.1 Definición de Roles

| Rol | Descripción | Permisos Clave |
|-----|-------------|----------------|
| **Producer** | Productor de materias primas | Crear tokens de materias primas, transferir solo a Factory |
| **Factory** | Transformador de materias primas | Recibir de Producer, crear productos derivados, transferir solo a Retailer |
| **Retailer** | Distribuidor minorista | Recibir de Factory, transferir solo a Consumer |
| **Consumer** | Consumidor final | Recibir productos, consultar trazabilidad completa |
| **Admin** | Administrador del sistema | Aprobar/rechazar usuarios, supervisar sistema completo |

### 2.2 Flujo de Roles en la Cadena

```
Producer → Factory → Retailer → Consumer
```

**Restricciones:**
- Producer solo puede transferir a Factory
- Factory solo puede transferir a Retailer
- Retailer solo puede transferir a Consumer
- Consumer no puede transferir (punto final)

---

## 3. Historias de Usuario

### 3.1 Autenticación y Registro

#### US-001: Conexión a Wallet
**Como** usuario nuevo  
**Quiero** conectar mi wallet a la aplicación  
**Para** poder acceder al sistema

**Criterios de Aceptación:**
- [ ] El usuario puede conectar su wallet mediante conexión directa a Anvil
- [ ] La conexión persiste en localStorage al recargar la página
- [ ] El sistema detecta cambios de cuenta automáticamente
- [ ] Se muestra el estado de conexión en la interfaz

**Prioridad:** Crítica  
**Estimación:** 3 puntos

---

#### US-002: Solicitud de Registro por Rol
**Como** usuario conectado  
**Quiero** solicitar un rol específico (Producer, Factory, Retailer, Consumer)  
**Para** poder operar en el sistema según mi función

**Criterios de Aceptación:**
- [ ] El usuario puede seleccionar un rol de una lista
- [ ] El sistema valida que el rol seleccionado sea válido
- [ ] Se envía una transacción al contrato inteligente
- [ ] El estado del usuario cambia a "Pending"
- [ ] Se muestra un mensaje de confirmación

**Prioridad:** Crítica  
**Estimación:** 5 puntos

---

#### US-003: Visualización de Estado de Registro
**Como** usuario registrado  
**Quiero** ver el estado de mi solicitud (Pending, Approved, Rejected)  
**Para** saber si puedo usar el sistema

**Criterios de Aceptación:**
- [ ] Se muestra el estado actual del usuario
- [ ] El estado se actualiza en tiempo real
- [ ] Se muestran mensajes informativos según el estado
- [ ] Los usuarios con estado "Pending" ven un mensaje de espera

**Prioridad:** Alta  
**Estimación:** 2 puntos

---

### 3.2 Gestión de Usuarios (Admin)

#### US-004: Aprobar Usuario
**Como** administrador  
**Quiero** aprobar solicitudes de registro de usuarios  
**Para** permitirles usar el sistema

**Criterios de Aceptación:**
- [ ] El admin ve una lista de usuarios pendientes
- [ ] Puede ver detalles del usuario (dirección, rol solicitado, fecha)
- [ ] Puede aprobar o rechazar la solicitud
- [ ] Se emite un evento en blockchain
- [ ] El usuario recibe notificación visual del cambio de estado

**Prioridad:** Crítica  
**Estimación:** 5 puntos

---

#### US-005: Rechazar Usuario
**Como** administrador  
**Quiero** rechazar solicitudes de registro  
**Para** mantener la seguridad del sistema

**Criterios de Aceptación:**
- [ ] El admin puede rechazar usuarios pendientes
- [ ] Se puede agregar un motivo de rechazo (opcional)
- [ ] El estado del usuario cambia a "Rejected"
- [ ] El usuario ve el estado actualizado

**Prioridad:** Alta  
**Estimación:** 3 puntos

---

#### US-006: Ver Lista de Usuarios
**Como** administrador  
**Quiero** ver todos los usuarios del sistema  
**Para** gestionar el sistema eficientemente

**Criterios de Aceptación:**
- [ ] Se muestra una tabla con todos los usuarios
- [ ] Se puede filtrar por rol y estado
- [ ] Se muestra información relevante (dirección, rol, estado, fecha registro)
- [ ] La tabla es responsive y paginada

**Prioridad:** Media  
**Estimación:** 3 puntos

---

### 3.3 Gestión de Tokens

#### US-007: Crear Token (Producer)
**Como** Producer aprobado  
**Quiero** crear tokens que representen materias primas  
**Para** registrar productos en el sistema

**Criterios de Aceptación:**
- [ ] Puedo crear un token con nombre, cantidad total y metadatos JSON
- [ ] El token se crea sin parentId (materia prima)
- [ ] El balance inicial se asigna al creador
- [ ] Se emite un evento TokenCreated
- [ ] El token aparece en mi lista de tokens

**Prioridad:** Crítica  
**Estimación:** 5 puntos

---

#### US-008: Crear Token Derivado (Factory/Retailer)
**Como** Factory o Retailer aprobado  
**Quiero** crear tokens derivados de materias primas existentes  
**Para** representar productos transformados

**Criterios de Aceptación:**
- [ ] Debo seleccionar un token padre (parentId)
- [ ] Puedo crear un nuevo token con nombre y metadatos
- [ ] El sistema valida que tengo balance del token padre
- [ ] Se establece la relación de parentesco
- [ ] El nuevo token aparece en mi lista

**Prioridad:** Crítica  
**Estimación:** 6 puntos

---

#### US-009: Ver Lista de Mis Tokens
**Como** usuario aprobado  
**Quiero** ver todos los tokens que poseo  
**Para** gestionar mi inventario

**Criterios de Aceptación:**
- [ ] Se muestra una lista de tokens con balance > 0
- [ ] Cada token muestra nombre, cantidad, fecha creación
- [ ] Puedo hacer clic para ver detalles completos
- [ ] La lista se actualiza automáticamente

**Prioridad:** Alta  
**Estimación:** 3 puntos

---

#### US-010: Ver Detalles de Token
**Como** usuario  
**Quiero** ver información detallada de un token  
**Para** conocer su trazabilidad completa

**Criterios de Aceptación:**
- [ ] Se muestra información completa del token (ID, creador, nombre, supply, metadatos)
- [ ] Se muestra el token padre si existe (trazabilidad hacia atrás)
- [ ] Se muestra el balance del usuario actual
- [ ] Se muestra fecha de creación
- [ ] Puedo ver el historial de transferencias relacionadas

**Prioridad:** Alta  
**Estimación:** 4 puntos

---

### 3.4 Transferencias

#### US-011: Iniciar Transferencia
**Como** propietario de tokens  
**Quiero** transferir tokens a otro usuario  
**Para** mover productos en la cadena de suministro

**Criterios de Aceptación:**
- [ ] Puedo seleccionar un token de mi lista
- [ ] Puedo especificar cantidad y destinatario
- [ ] El sistema valida que tengo balance suficiente
- [ ] El sistema valida que el destinatario tiene el rol correcto
- [ ] Se crea una transferencia con estado "Pending"
- [ ] Se emite un evento TransferRequested

**Prioridad:** Crítica  
**Estimación:** 6 puntos

---

#### US-012: Aceptar Transferencia
**Como** destinatario de transferencia  
**Quiero** aceptar transferencias pendientes  
**Para** recibir productos en mi inventario

**Criterios de Aceptación:**
- [ ] Veo una lista de transferencias pendientes dirigidas a mí
- [ ] Puedo ver detalles (remitente, token, cantidad, fecha)
- [ ] Puedo aceptar la transferencia
- [ ] El balance se actualiza automáticamente
- [ ] El estado cambia a "Accepted"
- [ ] Se emite un evento TransferAccepted

**Prioridad:** Crítica  
**Estimación:** 5 puntos

---

#### US-013: Rechazar Transferencia
**Como** destinatario de transferencia  
**Quiero** rechazar transferencias  
**Para** no recibir productos no deseados

**Criterios de Aceptación:**
- [ ] Puedo rechazar transferencias pendientes
- [ ] El estado cambia a "Rejected"
- [ ] El balance del remitente no cambia
- [ ] Se emite un evento TransferRejected
- [ ] El remitente puede ver el rechazo

**Prioridad:** Alta  
**Estimación:** 3 puntos

---

#### US-014: Ver Historial de Transferencias
**Como** usuario  
**Quiero** ver mi historial completo de transferencias  
**Para** auditar mis movimientos

**Criterios de Aceptación:**
- [ ] Veo transferencias enviadas y recibidas
- [ ] Puedo filtrar por estado (Pending, Accepted, Rejected)
- [ ] Se muestra información completa de cada transferencia
- [ ] El historial está ordenado por fecha (más reciente primero)

**Prioridad:** Media  
**Estimación:** 4 puntos

---

### 3.5 Trazabilidad

#### US-015: Consultar Trazabilidad Completa
**Como** Consumer o usuario autorizado  
**Quiero** ver la trazabilidad completa de un producto  
**Para** conocer su origen y recorrido

**Criterios de Aceptación:**
- [ ] Puedo ver la cadena completa: Producer → Factory → Retailer → Consumer
- [ ] Se muestra el árbol de parentesco de tokens
- [ ] Se muestran todas las transferencias relacionadas
- [ ] Se muestra información de cada actor en la cadena
- [ ] La visualización es clara y fácil de entender

**Prioridad:** Alta  
**Estimación:** 6 puntos

---

### 3.6 Dashboard y Navegación

#### US-016: Ver Dashboard Personalizado
**Como** usuario aprobado  
**Quiero** ver un dashboard con información relevante a mi rol  
**Para** tener una visión general de mi actividad

**Criterios de Aceptación:**
- [ ] El dashboard muestra estadísticas según mi rol
- [ ] Se muestran tokens en mi inventario
- [ ] Se muestran transferencias pendientes
- [ ] Se muestran accesos rápidos a funcionalidades principales
- [ ] El diseño es responsive

**Prioridad:** Alta  
**Estimación:** 5 puntos

---

#### US-017: Navegación por Rol
**Como** usuario  
**Quiero** ver solo las opciones de navegación relevantes a mi rol  
**Para** tener una experiencia simplificada

**Criterios de Aceptación:**
- [ ] Producer ve opciones para crear tokens y transferir
- [ ] Factory/Retailer ven opciones para crear tokens derivados
- [ ] Consumer ve opciones para consultar trazabilidad
- [ ] Admin ve opciones adicionales de administración
- [ ] La navegación se oculta automáticamente según permisos

**Prioridad:** Media  
**Estimación:** 3 puntos

---

## 4. Restricciones Técnicas

### 4.1 Arquitectura del Sistema

#### 4.1.1 Stack Tecnológico

**Smart Contracts:**
- Solidity 0.8.20+
- Foundry (Forge, Anvil, Cast)
- Testing con Foundry Test

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Ethers.js v6
- Shadcn UI (componentes base)

**Blockchain:**
- Anvil (blockchain local para desarrollo)
- Chain ID: 31337
- RPC URL: http://localhost:8545

#### 4.1.2 Conexión a Blockchain

**CRÍTICO:** La aplicación DEBE integrarse con la extensión de navegador MetaMask inyectada en window.ethereum. Y tambien:
- Conexión directa a Anvil mediante `ethers.JsonRpcProvider`
- Gestión de estado global mediante `MetaMaskContext`
- Uso obligatorio del hook `useMetaMask` para todas las interacciones
- Persistencia en localStorage para mantener sesión

**Restricciones:**
- NO instanciar `ethers.Wallet`, `ethers.JsonRpcProvider`, o `ethers.HDNodeWallet` directamente en componentes
- Debes usar `window.ethereum`
- SIEMPRE usar el hook `useMetaMask` para operaciones de wallet

### 4.2 Estructura del Proyecto

```
final-project/
├── sc/                    # Smart Contracts
│   ├── src/
│   │   └── SupplyChain.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   ├── test/
│   │   └── SupplyChain.t.sol
│   └── foundry.toml
├── dapp/                  # Frontend Next.js
│   ├── src/
│   │   ├── app/          # Páginas (App Router)
│   │   ├── components/   # Componentes React
│   │   ├── contexts/     # Contextos (MetaMaskContext)
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Servicios Web3
│   │   └── contracts/    # ABI y configuración
│   └── package.json
└── README.md
```

### 4.3 Limitaciones de Gas y Costos

**Desarrollo Local (Anvil):**
- Sin límite de gas en desarrollo
- Transacciones gratuitas
- Tiempo de bloque instantáneo

**Consideraciones para Producción:**
- Optimizar funciones para minimizar gas
- Evitar loops grandes en contratos
- Usar eventos para almacenar datos históricos

### 4.4 Seguridad

**Restricciones de Seguridad:**
- Validación de permisos en cada función del contrato
- Verificación de estados (usuario aprobado) antes de operaciones
- Validación de roles en transferencias
- Protección contra reentrancy (si aplica)
- Validación de inputs (cantidades > 0, direcciones válidas)

### 4.5 Rendimiento

**Límites de Rendimiento:**
- Máximo 1000 tokens por usuario (consideración de diseño)
- Máximo 100 transferencias pendientes simultáneas
- Paginación en listas de más de 50 elementos
- Cacheo de datos del contrato en frontend (React Query)

### 4.6 Compatibilidad

**Navegadores Soportados:**
- Chrome/Edge (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)

**Requisitos del Sistema:**
- Node.js 18+
- Foundry instalado
- Anvil corriendo en puerto 8545

---

## 5. Esquema de Datos (Ethereum VM)

### 5.1 Estructuras de Datos en Smart Contract

#### 5.1.1 Enums

```solidity
enum UserStatus {
    Pending,    // Esperando aprobación
    Approved,   // Aprobado y activo
    Rejected,   // Rechazado por admin
    Canceled    // Cancelado por usuario
}

enum TransferStatus {
    Pending,    // Esperando aceptación
    Accepted,   // Aceptada y completada
    Rejected    // Rechazada por destinatario
}
```

#### 5.1.2 Structs

**User:**
```solidity
struct User {
    uint256 id;              // ID único del usuario
    address userAddress;     // Dirección Ethereum del usuario
    string role;             // "Producer", "Factory", "Retailer", "Consumer"
    UserStatus status;       // Estado de aprobación
}
```

**Token:**
```solidity
struct Token {
    uint256 id;                      // ID único del token
    address creator;                 // Dirección del creador
    string name;                     // Nombre del producto
    uint256 totalSupply;             // Suministro total
    string features;                 // Metadatos JSON como string
    uint256 parentId;                // ID del token padre (0 si es materia prima)
    uint256 dateCreated;             // Timestamp de creación
    mapping(address => uint256) balance;  // Balance por dirección
}
```

**Transfer:**
```solidity
struct Transfer {
    uint256 id;              // ID único de la transferencia
    address from;            // Dirección del remitente
    address to;              // Dirección del destinatario
    uint256 tokenId;         // ID del token transferido
    uint256 dateCreated;     // Timestamp de creación
    uint256 amount;          // Cantidad transferida
    TransferStatus status;   // Estado de la transferencia
}
```

#### 5.1.3 Mappings y Arrays

```solidity
// Contadores para IDs
uint256 public nextTokenId = 1;
uint256 public nextTransferId = 1;
uint256 public nextUserId = 1;

// Almacenamiento principal
mapping(uint256 => Token) public tokens;
mapping(uint256 => Transfer) public transfers;
mapping(uint256 => User) public users;
mapping(address => uint256) public addressToUserId;

// Arrays para enumeración (opcional, para facilitar queries)
uint256[] public allTokenIds;
uint256[] public allTransferIds;
uint256[] public allUserIds;
```

### 5.2 Modelo de Datos Relacional (Conceptual)

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ address     │──┐
│ role        │  │
│ status      │  │
└─────────────┘  │
                 │
                 │ 1:N
                 │
┌─────────────┐  │
│   Token     │  │
├─────────────┤  │
│ id (PK)     │  │
│ creator (FK)│──┘
│ name        │
│ totalSupply │
│ features    │
│ parentId    │──┐ (self-reference)
│ dateCreated │  │
└─────────────┘  │
                 │
                 │ 1:N
                 │
┌─────────────┐  │
│  Transfer   │  │
├─────────────┤  │
│ id (PK)     │  │
│ from (FK)   │──┘
│ to (FK)     │──┐
│ tokenId (FK)│──┤
│ amount      │  │
│ status      │  │
│ dateCreated │  │
└─────────────┘  │
                 │
                 └─── (User.address)
```

### 5.3 Eventos (Logs de Blockchain)

```solidity
event TokenCreated(
    uint256 indexed tokenId,
    address indexed creator,
    string name,
    uint256 totalSupply
);

event TransferRequested(
    uint256 indexed transferId,
    address indexed from,
    address indexed to,
    uint256 tokenId,
    uint256 amount
);

event TransferAccepted(uint256 indexed transferId);
event TransferRejected(uint256 indexed transferId);
event UserRoleRequested(address indexed user, string role);
event UserStatusChanged(address indexed user, UserStatus status);
```

### 5.4 Índices y Optimizaciones

**Índices Implícitos (por mappings):**
- `addressToUserId`: O(1) lookup de usuario por dirección
- `tokens[tokenId]`: O(1) acceso a token por ID
- `transfers[transferId]`: O(1) acceso a transferencia por ID

**Consideraciones de Gas:**
- Usar `indexed` en eventos para filtrado eficiente
- Evitar arrays grandes en structs (usar mappings)
- Paginar resultados en funciones view que retornan arrays

---

## 6. Endpoints y Funciones

### 6.1 Funciones del Smart Contract

#### 6.1.1 Gestión de Usuarios

**`requestUserRole(string memory role) public`**
- **Descripción:** Solicita un rol en el sistema
- **Parámetros:** `role` - Rol solicitado ("Producer", "Factory", "Retailer", "Consumer")
- **Retorna:** Nada (emite evento)
- **Evento:** `UserRoleRequested`
- **Restricciones:** Usuario no debe estar ya registrado

**`changeStatusUser(address userAddress, UserStatus newStatus) public`**
- **Descripción:** Cambia el estado de un usuario (solo Admin)
- **Parámetros:** 
  - `userAddress` - Dirección del usuario
  - `newStatus` - Nuevo estado (Approved, Rejected, Canceled)
- **Retorna:** Nada (emite evento)
- **Evento:** `UserStatusChanged`
- **Restricciones:** Solo Admin puede ejecutar

**`getUserInfo(address userAddress) public view returns (User memory)`**
- **Descripción:** Obtiene información de un usuario
- **Parámetros:** `userAddress` - Dirección del usuario
- **Retorna:** Struct `User` completo
- **Restricciones:** Ninguna (función view)

**`isAdmin(address userAddress) public view returns (bool)`**
- **Descripción:** Verifica si una dirección es admin
- **Parámetros:** `userAddress` - Dirección a verificar
- **Retorna:** `true` si es admin, `false` en caso contrario

#### 6.1.2 Gestión de Tokens

**`createToken(string memory name, uint totalSupply, string memory features, uint parentId) public`**
- **Descripción:** Crea un nuevo token
- **Parámetros:**
  - `name` - Nombre del producto
  - `totalSupply` - Cantidad total del token
  - `features` - Metadatos JSON como string
  - `parentId` - ID del token padre (0 si es materia prima)
- **Retorna:** Nada (emite evento)
- **Evento:** `TokenCreated`
- **Restricciones:** 
  - Usuario debe estar Approved
  - Producer solo puede crear tokens sin parentId
  - Factory/Retailer deben especificar parentId válido

**`getToken(uint tokenId) public view returns (Token memory)`**
- **Descripción:** Obtiene información de un token
- **Parámetros:** `tokenId` - ID del token
- **Retorna:** Struct `Token` (sin balances, usar función separada)
- **Nota:** Los balances se obtienen con `getTokenBalance`

**`getTokenBalance(uint tokenId, address userAddress) public view returns (uint)`**
- **Descripción:** Obtiene el balance de un token para un usuario
- **Parámetros:**
  - `tokenId` - ID del token
  - `userAddress` - Dirección del usuario
- **Retorna:** Cantidad del token que posee el usuario

**`getUserTokens(address userAddress) public view returns (uint[] memory)`**
- **Descripción:** Obtiene lista de IDs de tokens que posee un usuario
- **Parámetros:** `userAddress` - Dirección del usuario
- **Retorna:** Array de IDs de tokens con balance > 0
- **Nota:** Puede requerir iteración, considerar paginación

#### 6.1.3 Gestión de Transferencias

**`transfer(address to, uint tokenId, uint amount) public`**
- **Descripción:** Inicia una transferencia de tokens
- **Parámetros:**
  - `to` - Dirección del destinatario
  - `tokenId` - ID del token a transferir
  - `amount` - Cantidad a transferir
- **Retorna:** Nada (emite evento)
- **Evento:** `TransferRequested`
- **Restricciones:**
  - Usuario debe estar Approved
  - Debe tener balance suficiente
  - Destinatario debe tener rol válido según flujo
  - Consumer no puede transferir

**`acceptTransfer(uint transferId) public`**
- **Descripción:** Acepta una transferencia pendiente
- **Parámetros:** `transferId` - ID de la transferencia
- **Retorna:** Nada (emite evento)
- **Evento:** `TransferAccepted`
- **Restricciones:**
  - Solo el destinatario puede aceptar
  - Transferencia debe estar en estado Pending
  - Balance del remitente debe ser suficiente

**`rejectTransfer(uint transferId) public`**
- **Descripción:** Rechaza una transferencia pendiente
- **Parámetros:** `transferId` - ID de la transferencia
- **Retorna:** Nada (emite evento)
- **Evento:** `TransferRejected`
- **Restricciones:**
  - Solo el destinatario puede rechazar
  - Transferencia debe estar en estado Pending

**`getTransfer(uint transferId) public view returns (Transfer memory)`**
- **Descripción:** Obtiene información de una transferencia
- **Parámetros:** `transferId` - ID de la transferencia
- **Retorna:** Struct `Transfer` completo

**`getUserTransfers(address userAddress) public view returns (uint[] memory)`**
- **Descripción:** Obtiene lista de IDs de transferencias de un usuario
- **Parámetros:** `userAddress` - Dirección del usuario
- **Retorna:** Array de IDs de transferencias (enviadas y recibidas)
- **Nota:** Puede requerir iteración, considerar paginación

### 6.2 Rutas del Frontend (Next.js App Router)

#### 6.2.1 Rutas Públicas

**`GET /`**
- **Descripción:** Página principal / Landing
- **Estados:**
  - No conectado: Invitación a conectar wallet
  - Conectado pero no registrado: Formulario de registro
  - Conectado y pendiente: Mensaje de espera
  - Conectado y aprobado: Redirección a dashboard

**`GET /profile`**
- **Descripción:** Perfil del usuario actual
- **Contenido:** Información del usuario, portfolio de tokens, estadísticas
- **Restricciones:** Requiere conexión

#### 6.2.2 Rutas de Usuario Aprobado

**`GET /dashboard`**
- **Descripción:** Dashboard principal según rol
- **Contenido:** Estadísticas, tokens recientes, transferencias pendientes
- **Restricciones:** Usuario debe estar Approved

**`GET /tokens`**
- **Descripción:** Lista de tokens del usuario
- **Contenido:** Grid/Lista de tokens con balance > 0
- **Restricciones:** Usuario debe estar Approved

**`GET /tokens/create`**
- **Descripción:** Formulario para crear nuevo token
- **Contenido:** Campos para nombre, cantidad, metadatos, parentId (si aplica)
- **Restricciones:** Usuario debe estar Approved

**`GET /tokens/[id]`**
- **Descripción:** Detalles de un token específico
- **Parámetros:** `id` - ID del token
- **Contenido:** Información completa, trazabilidad, historial
- **Restricciones:** Usuario debe estar Approved

**`GET /tokens/[id]/transfer`**
- **Descripción:** Formulario para transferir un token
- **Parámetros:** `id` - ID del token
- **Contenido:** Selección de destinatario, cantidad
- **Restricciones:** Usuario debe ser propietario y Approved

**`GET /transfers`**
- **Descripción:** Gestión de transferencias
- **Contenido:** Lista de transferencias pendientes y historial
- **Restricciones:** Usuario debe estar Approved

#### 6.2.3 Rutas de Administración

**`GET /admin`**
- **Descripción:** Panel de administración
- **Contenido:** Estadísticas del sistema, accesos rápidos
- **Restricciones:** Solo Admin

**`GET /admin/users`**
- **Descripción:** Gestión de usuarios
- **Contenido:** Tabla de usuarios, filtros, acciones de aprobación/rechazo
- **Restricciones:** Solo Admin

### 6.3 Hooks y Servicios del Frontend

#### 6.3.1 Hooks Personalizados

**`useMetaMask()`**
- **Ubicación:** `dapp/hooks/useMetaMask.ts`
- **Retorna:**
  - `account: string | null` - Dirección conectada
  - `isConnected: boolean` - Estado de conexión
  - `provider: JsonRpcProvider | null` - Proveedor ethers
  - `signer: JsonRpcSigner | null` - Firmante actual
  - `signMessage(message: string): Promise<string>` - Firmar mensaje
  - `getSigner(): Promise<JsonRpcSigner>` - Obtener firmante
  - `connect(): Promise<void>` - Conectar wallet
  - `disconnect(): void` - Desconectar wallet

**`useContract()`**
- **Ubicación:** `dapp/hooks/useContract.ts`
- **Retorna:**
  - `contract: Contract | null` - Instancia del contrato
  - `isLoading: boolean` - Estado de carga
  - `error: Error | null` - Errores
  - Funciones wrapper para cada función del contrato

**`useUserInfo(address: string)`**
- **Ubicación:** `dapp/hooks/useUserInfo.ts`
- **Descripción:** Hook para obtener información de usuario
- **Retorna:** `{ user: User | null, isLoading: boolean, error: Error | null }`

**`useUserTokens(address: string)`**
- **Ubicación:** `dapp/hooks/useUserTokens.ts`
- **Descripción:** Hook para obtener tokens de un usuario
- **Retorna:** `{ tokens: Token[], isLoading: boolean, error: Error | null }`

**`useUserTransfers(address: string)`**
- **Ubicación:** `dapp/hooks/useUserTransfers.ts`
- **Descripción:** Hook para obtener transferencias de un usuario
- **Retorna:** `{ transfers: Transfer[], isLoading: boolean, error: Error | null }`

#### 6.3.2 Servicios

**`Web3Service`**
- **Ubicación:** `dapp/lib/web3.ts`
- **Descripción:** Servicio para interacciones con blockchain
- **Métodos:**
  - `connectWallet(): Promise<string>` - Conectar wallet
  - `getContract(address: string, abi: any): Contract` - Obtener instancia de contrato
  - `formatAddress(address: string): string` - Formatear dirección
  - `parseBigInt(value: bigint): string` - Convertir BigInt a string

---

## 7. Criterios de Aceptación Globales

### 7.1 Funcionalidad

- [ ] Todos los tests del smart contract pasan (`forge test`)
- [ ] El contrato se despliega exitosamente en Anvil
- [ ] El frontend se conecta correctamente a Anvil
- [ ] Todas las funciones del contrato son accesibles desde el frontend
- [ ] Los eventos se emiten correctamente y son escuchables

### 7.2 Usabilidad

- [ ] La interfaz es responsive (mobile, tablet, desktop)
- [ ] Los mensajes de error son claros y útiles
- [ ] Los estados de carga se muestran durante transacciones
- [ ] La navegación es intuitiva según el rol del usuario
- [ ] Los formularios tienen validación en cliente

### 7.3 Seguridad

- [ ] Solo usuarios aprobados pueden crear tokens
- [ ] Solo usuarios aprobados pueden transferir
- [ ] Solo Admin puede aprobar/rechazar usuarios
- [ ] Las transferencias validan roles correctamente
- [ ] No hay vulnerabilidades de reentrancy

### 7.4 Rendimiento

- [ ] Las páginas cargan en menos de 2 segundos
- [ ] Las transacciones se confirman en menos de 5 segundos (Anvil)
- [ ] Las listas grandes están paginadas
- [ ] Los datos se cachean apropiadamente

### 7.5 Documentación

- [ ] El código está comentado apropiadamente
- [ ] El README tiene instrucciones claras de instalación
- [ ] Los contratos tienen NatSpec comments
- [ ] Los componentes tienen JSDoc cuando es necesario

---

## 8. Roadmap y Priorización

### 8.1 Fase 1: Fundamentos (Sprint 1-2)

**Objetivo:** Establecer base técnica y funcionalidad core

- [ ] Configuración del entorno de desarrollo
- [ ] Implementación del smart contract completo
- [ ] Tests unitarios del smart contract (100% passing)
- [ ] Deploy del contrato en Anvil
- [ ] Configuración del frontend Next.js
- [ ] Implementación de conexión a wallet
- [ ] Sistema de registro de usuarios

**Prioridad:** Crítica  
**Estimación:** 2-3 semanas

### 8.2 Fase 2: Funcionalidad Core (Sprint 3-4)

**Objetivo:** Implementar funcionalidades principales de negocio

- [ ] Panel de administración (aprobación de usuarios)
- [ ] Creación de tokens (Producer)
- [ ] Creación de tokens derivados (Factory/Retailer)
- [ ] Sistema de transferencias
- [ ] Aceptar/rechazar transferencias
- [ ] Dashboard personalizado por rol

**Prioridad:** Crítica  
**Estimación:** 2-3 semanas

### 8.3 Fase 3: Trazabilidad y UX (Sprint 5)

**Objetivo:** Mejorar experiencia de usuario y trazabilidad

- [ ] Visualización de trazabilidad completa
- [ ] Historial de transferencias
- [ ] Mejoras en UI/UX
- [ ] Manejo de errores robusto
- [ ] Optimizaciones de rendimiento

**Prioridad:** Alta  
**Estimación:** 1-2 semanas

### 8.4 Fase 4: Testing y Refinamiento (Sprint 6)

**Objetivo:** Asegurar calidad y completitud

- [ ] Tests de integración end-to-end
- [ ] Pruebas de flujos completos
- [ ] Corrección de bugs
- [ ] Optimización de gas
- [ ] Documentación final

**Prioridad:** Alta  
**Estimación:** 1 semana

---

## 9. Métricas de Éxito

### 9.1 Métricas Técnicas

- **Cobertura de Tests:** > 90% en smart contracts
- **Tiempo de Build:** < 30 segundos
- **Tiempo de Carga de Página:** < 2 segundos
- **Tasa de Errores:** < 1% de transacciones fallidas

### 9.2 Métricas de Negocio

- **Usuarios Registrados:** Al menos 5 usuarios de prueba (uno por rol)
- **Tokens Creados:** Al menos 10 tokens en el sistema
- **Transferencias Completadas:** Al menos 1 flujo completo Producer → Consumer
- **Trazabilidad Completa:** 100% de productos con trazabilidad completa

### 9.3 Métricas de Usabilidad

- **Tiempo de Onboarding:** < 5 minutos para registro completo
- **Tasa de Éxito de Transacciones:** > 95%
- **Satisfacción de Usuario:** Feedback positivo en demo

---

## 10. Riesgos y Mitigaciones

### 10.1 Riesgos Técnicos

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| Errores en smart contract | Alto | Media | Tests exhaustivos, auditoría de código |
| Problemas de conexión con Anvil | Medio | Alta | Documentación clara, scripts de inicio |
| Problemas de rendimiento con listas grandes | Medio | Media | Paginación, cacheo, optimización de queries |
| Incompatibilidad de versiones | Bajo | Baja | Lock de versiones en package.json |

### 10.2 Riesgos de Negocio

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| Usuarios no entienden el flujo | Medio | Media | UI clara, tutoriales, mensajes informativos |
| Errores en transferencias | Alto | Baja | Validación exhaustiva, mensajes de error claros |
| Problemas de aprobación de usuarios | Medio | Baja | Panel admin intuitivo, documentación |

---

## 11. Glosario

- **DApp:** Aplicación Descentralizada
- **Smart Contract:** Contrato inteligente ejecutado en blockchain
- **Token:** Representación digital de un producto o materia prima
- **Trazabilidad:** Capacidad de rastrear el origen y recorrido de un producto
- **Gas:** Unidad de medida del costo de ejecución en Ethereum
- **Anvil:** Herramienta de Foundry para blockchain local
- **EVM:** Ethereum Virtual Machine
- **ABI:** Application Binary Interface (interfaz del contrato)
- **RPC:** Remote Procedure Call (comunicación con blockchain)

---

## 12. Anexos

### 12.1 Referencias

- [Documentación de Solidity](https://docs.soliditylang.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/)

### 12.2 Contactos

- **Product Owner:** [Nombre]
- **Tech Lead:** [Nombre]
- **Blockchain Developer:** [Nombre]
- **Frontend Developer:** [Nombre]

---

**Fin del Documento**

