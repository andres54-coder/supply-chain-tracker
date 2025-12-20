# 🎓 Plan de Clase Magistral - Supply Chain Tracker
## Video de 5 Minutos

**Objetivo:** Demostrar conocimiento técnico del proyecto, arquitectura y decisiones de diseño.

---

## ⏱️ Estructura del Video (5 minutos)

### 1. Introducción y Visión del Proyecto (30 segundos)

**Qué decir:**
- "Hoy voy a presentar Supply Chain Tracker, una DApp completa de trazabilidad blockchain"
- "El proyecto permite rastrear productos desde el productor hasta el consumidor final usando smart contracts"
- "Es un sistema descentralizado que garantiza transparencia e inmutabilidad mediante blockchain"

**Qué mostrar:**
- Pantalla completa de la aplicación funcionando
- Navegación rápida por las páginas principales

**Puntos clave:**
- ✅ DApp completa (no solo contrato o solo frontend)
- ✅ Trazabilidad end-to-end
- ✅ Blockchain para transparencia

---

### 2. Arquitectura y Stack Tecnológico (1 minuto)

**Qué decir:**
- "La arquitectura se divide en tres capas principales"
- "Smart Contracts en Solidity usando Foundry para desarrollo y testing"
- "Frontend en Next.js 16 con TypeScript, integrado con MetaMask mediante Ethers.js v6"
- "Blockchain local con Anvil para desarrollo"

**Qué mostrar:**
- Diagrama de arquitectura (si tienes pantalla compartida)
- O mostrar estructura de carpetas del proyecto
- Código del contrato principal brevemente

**Puntos clave:**
- ✅ Monorepo: `sc/` (smart contracts) y `dapp/` (frontend)
- ✅ Foundry para desarrollo blockchain
- ✅ Next.js 16 App Router
- ✅ Integración Web3 con MetaMask

**Código a mostrar (opcional):**
```solidity
// sc/src/SupplyChain.sol - Estructura básica
contract SupplyChain {
    enum UserStatus { Pending, Approved, Rejected }
    struct Token { ... }
    struct Transfer { ... }
}
```

---

### 3. Smart Contracts - Conceptos Clave (1.5 minutos)

**Qué decir:**
- "El contrato SupplyChain gestiona tres entidades principales: Usuarios, Tokens y Transferencias"
- "Sistema de roles con flujo controlado: Producer → Factory → Retailer → Consumer"
- "El admin se registra automáticamente y gestiona aprobaciones"
- "Validaciones de seguridad: solo usuarios aprobados pueden operar, validación de flujo de roles"

**Qué mostrar:**
- Código del contrato con funciones principales
- Tests de Foundry ejecutándose (`forge test`)
- Diagrama de flujo de roles

**Puntos clave:**
- ✅ Gestión de usuarios con estados (Pending, Approved, Rejected)
- ✅ Tokenización de productos (materias primas y derivados)
- ✅ Transferencias controladas con aceptación/rechazo
- ✅ Tests exhaustivos con Foundry (>90% cobertura)

**Código a mostrar:**
```solidity
// Función clave: createToken
function createToken(string memory name, uint totalSupply, ...) public onlyApprovedUser {
    // Validaciones según rol
    // Producer: solo materias primas (sin parentId)
    // Factory/Retailer: productos derivados (con parentId)
}

// Función clave: transfer
function transfer(address to, uint tokenId, uint amount) public onlyApprovedUser {
    // Validación de flujo de roles
    // Producer → Factory → Retailer → Consumer
}
```

**Tests a mostrar:**
```bash
forge test -vvv
# Mostrar algunos tests pasando
```

---

### 4. Frontend - Integración Web3 (1.5 minutos)

**Qué decir:**
- "El frontend usa React Query para cachear datos del contrato y evitar llamadas innecesarias"
- "MetaMaskContext centraliza toda la gestión de wallet: conexión, persistencia, reconexión automática"
- "Hooks personalizados abstraen la complejidad de interactuar con el contrato"
- "Invalidación automática de queries cuando cambia la cuenta para evitar datos mezclados"

**Qué mostrar:**
- Código del MetaMaskContext
- Hook useContract en acción
- Demostración de conexión y uso

**Puntos clave:**
- ✅ Context API para estado global de wallet
- ✅ React Query para gestión de datos on-chain
- ✅ Persistencia en localStorage
- ✅ Reconexión automática al recargar
- ✅ Invalidación de cache al cambiar cuenta

**Código a mostrar:**
```typescript
// MetaMaskContext - Gestión centralizada
export function MetaMaskProvider({ children }) {
  // Conexión, persistencia, eventos accountsChanged/chainChanged
  // Invalidación de React Query al cambiar cuenta
}

// useContract - Abstracción de llamadas al contrato
export function useContract() {
  // Wrappers para todas las funciones del contrato
  // Manejo de errores y estados de carga
  // Notificaciones toast automáticas
}
```

**Demostración práctica:**
- Conectar MetaMask
- Crear un token (Producer)
- Transferir token (mostrar validación de roles)
- Ver trazabilidad

---

### 5. Flujo Completo y Demostración (30 segundos)

**Qué decir:**
- "Voy a mostrar el flujo completo desde registro hasta transferencia"
- "Producer crea materia prima, Factory crea producto derivado, Retailer transfiere a Consumer"

**Qué mostrar:**
- Demo rápida del flujo completo (si hay tiempo)
- O mostrar capturas de pantalla de cada paso

**Pasos a mostrar:**
1. Usuario se conecta con MetaMask
2. Solicita rol (Producer)
3. Admin aprueba (mostrar panel admin)
4. Producer crea token
5. Producer transfiere a Factory
6. Factory acepta y crea producto derivado
7. Ver trazabilidad completa

---

### 6. Conclusiones y Aprendizajes (30 segundos)

**Qué decir:**
- "Este proyecto demuestra integración completa de blockchain con frontend moderno"
- "Aprendizajes clave: arquitectura de DApps, gestión de estado Web3, testing de smart contracts"
- "Desafíos superados: sincronización de estado, manejo de errores, validación de roles"

**Puntos clave:**
- ✅ Arquitectura escalable y mantenible
- ✅ Tests exhaustivos (smart contracts y frontend)
- ✅ Documentación completa
- ✅ Buenas prácticas de desarrollo Web3

**Métricas a mencionar:**
- ~100% Smart Contracts implementados y testeados
- ~95% Frontend implementado
- ~90% Cobertura de tests
- 100% Documentación completa

---

## 📝 Guión Detallado (Timing)

### [0:00 - 0:30] Introducción
```
"Hola, soy [Tu nombre] y hoy voy a presentar Supply Chain Tracker, 
una aplicación descentralizada completa que desarrollé para gestionar 
trazabilidad en cadenas de suministro usando blockchain.

El proyecto permite rastrear productos desde el productor hasta el 
consumidor final, garantizando transparencia e inmutabilidad mediante 
smart contracts en Ethereum."
```

### [0:30 - 1:30] Arquitectura
```
"La arquitectura se divide en tres capas principales:

Primero, los Smart Contracts escritos en Solidity 0.8.20, desarrollados 
con Foundry que nos permite compilar, testear y desplegar.

Segundo, el Frontend en Next.js 16 con TypeScript, usando Ethers.js v6 
para interactuar con la blockchain a través de MetaMask.

Y tercero, Anvil como blockchain local para desarrollo, con Chain ID 31337.

Es un monorepo con dos paquetes: sc/ para smart contracts y dapp/ para 
el frontend, ambos sincronizados."
```

### [1:30 - 3:00] Smart Contracts
```
"El contrato SupplyChain gestiona tres entidades principales: Usuarios, 
Tokens y Transferencias.

El sistema implementa un flujo controlado de roles: Producer puede crear 
materias primas y transferir solo a Factory. Factory puede crear productos 
derivados y transferir solo a Retailer. Retailer transfiere solo a Consumer, 
que es el punto final.

El admin se registra automáticamente al desplegar el contrato y gestiona 
las aprobaciones de usuarios.

Todas las funciones tienen validaciones de seguridad: solo usuarios aprobados 
pueden operar, se valida el flujo de roles, y se verifica el balance antes 
de transferencias.

Los tests con Foundry cubren más del 90% del código, incluyendo casos edge 
y flujos completos."
```

### [3:00 - 4:30] Frontend
```
"El frontend usa React Query para cachear datos del contrato, evitando 
llamadas innecesarias a la blockchain.

MetaMaskContext centraliza toda la gestión de wallet: conexión, persistencia 
en localStorage, reconexión automática al recargar la página, y manejo de 
eventos como cambio de cuenta o cambio de red.

Los hooks personalizados como useContract abstraen la complejidad de 
interactuar con el contrato, manejando estados de carga, errores, y 
mostrando notificaciones automáticas.

Una característica importante es la invalidación automática de queries de 
React Query cuando cambia la cuenta, para evitar mostrar datos mezclados 
de diferentes usuarios."
```

### [4:30 - 5:00] Conclusiones
```
"Este proyecto demuestra una integración completa de blockchain con frontend 
moderno, siguiendo mejores prácticas de desarrollo Web3.

Los aprendizajes clave incluyen arquitectura de DApps, gestión de estado 
descentralizado, testing exhaustivo de smart contracts, y manejo robusto 
de errores.

El proyecto está completamente documentado, con README completo, código 
comentado con NatSpec y JSDoc, y un plan de implementación detallado.

Gracias por ver esta presentación."
```

---

## 🎬 Tips para la Grabación

### Preparación
- ✅ Tener la aplicación corriendo y funcionando
- ✅ Tener Anvil corriendo con el contrato desplegado
- ✅ Tener MetaMask configurado con cuentas de prueba
- ✅ Preparar capturas de pantalla o diagramas si es necesario
- ✅ Tener el código abierto en el editor para mostrar si es necesario

### Durante la Grabación
- ✅ Hablar claro y a buen ritmo (no muy rápido)
- ✅ Mostrar código relevante cuando menciones funciones específicas
- ✅ Hacer pausas breves entre secciones
- ✅ Si algo falla, seguir adelante o hacer un corte y retomar
- ✅ Mantener el foco en los aspectos técnicos más importantes

### Post-Producción
- ✅ Agregar transiciones suaves entre secciones
- ✅ Agregar texto/etiquetas si muestras código
- ✅ Asegurar que el audio sea claro
- ✅ Verificar que no exceda los 5 minutos

---

## 📋 Checklist Pre-Grabación

- [ ] Aplicación funcionando correctamente
- [ ] Anvil corriendo con contrato desplegado
- [ ] MetaMask configurado con red Anvil
- [ ] Cuentas de prueba importadas (Admin, Producer, Factory, etc.)
- [ ] Código abierto en editor para mostrar
- [ ] Tests ejecutándose correctamente (`forge test`)
- [ ] README actualizado con diagramas
- [ ] Script de guión revisado
- [ ] Audio y video funcionando correctamente

---

## 🎯 Puntos Clave a Destacar

1. **Arquitectura Completa**: No es solo un contrato o solo un frontend, es una DApp completa
2. **Seguridad**: Validaciones exhaustivas en el contrato y manejo de errores en frontend
3. **Testing**: Tests completos tanto en smart contracts como en frontend
4. **Best Practices**: Uso de React Query, Context API, hooks personalizados
5. **Documentación**: Código bien documentado y README completo
6. **Experiencia de Usuario**: Reconexión automática, invalidación de cache, notificaciones

---

## 📚 Recursos Adicionales

Si necesitas profundizar en algún tema durante la grabación:

- **Smart Contracts**: `sc/src/SupplyChain.sol`
- **Tests**: `sc/test/SupplyChain.t.sol`
- **Frontend Context**: `dapp/contexts/MetaMaskContext.tsx`
- **Hooks**: `dapp/hooks/useContract.ts`
- **Documentación**: `README.md`, `PRD.md`, `implementation_plan.md`

---

**¡Buena suerte con tu clase magistral! 🚀**

