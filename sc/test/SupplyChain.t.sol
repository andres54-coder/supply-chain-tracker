// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

/// @title SupplyChainTest
/// @notice Test suite para el contrato SupplyChain
contract SupplyChainTest is Test {
    SupplyChain internal supplyChain;
    
    // Cuentas de prueba
    address internal admin;
    address internal producer;
    address internal factory;
    address internal retailer;
    address internal consumer;
    address internal unauthorized;
    
    // IDs de usuarios (se asignan después del registro)
    uint256 internal producerUserId;
    uint256 internal factoryUserId;
    uint256 internal retailerUserId;
    uint256 internal consumerUserId;
    
    // IDs de tokens (se asignan después de la creación)
    uint256 internal baseTokenId;
    
    // Eventos esperados
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, SupplyChain.UserStatus status);
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply);
    event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    
    /// @notice Configuración inicial antes de cada test
    function setUp() public {
        // El deployer es el admin por defecto
        admin = address(this);
        
        // Crear cuentas de prueba etiquetadas para mejor debugging
        producer = makeAddr("producer");
        factory = makeAddr("factory");
        retailer = makeAddr("retailer");
        consumer = makeAddr("consumer");
        unauthorized = makeAddr("unauthorized");
        
        // Desplegar contrato
        supplyChain = new SupplyChain();
        
        // Verificar que el admin es el deployer
        assertEq(supplyChain.admin(), admin);
    }
    
    // ============ Helper Functions ============
    
    /// @notice Helper para registrar y aprobar un usuario
    /// @param user Dirección del usuario
    /// @param role Rol del usuario
    function _registerAndApproveUser(address user, string memory role) internal {
        vm.prank(user);
        supplyChain.requestUserRole(role);
        
        // Aprobar usuario como admin
        supplyChain.changeStatusUser(user, SupplyChain.UserStatus.Approved);
    }
    
    /// @notice Helper para crear un token base (materia prima) por Producer
    /// @param name Nombre del token
    /// @param totalSupply Suministro total
    /// @param features Metadatos JSON
    /// @return tokenId ID del token creado
    function _createBaseToken(
        string memory name,
        uint256 totalSupply,
        string memory features
    ) internal returns (uint256 tokenId) {
        vm.prank(producer);
        supplyChain.createToken(name, totalSupply, features, 0);
        return supplyChain.nextTokenId() - 1;
    }
    
    // ============ Tests de Gestión de Usuarios ============
    
    /// @notice Test: Registrar usuario con rol válido
    function testUserRegistration() public {
        vm.expectEmit(true, false, false, true);
        emit UserRoleRequested(producer, "Producer");
        
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(user.role, "Producer");
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Pending));
        assertEq(supplyChain.addressToUserId(producer), 2); // Admin tiene userId = 1
    }
    
    /// @notice Test: Intentar registrar con rol inválido
    function testUserRegistrationInvalidRole() public {
        vm.prank(producer);
        vm.expectRevert("Invalid role");
        supplyChain.requestUserRole("InvalidRole");
    }
    
    /// @notice Test: Intentar registrar usuario ya registrado
    function testUserRegistrationDuplicate() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.prank(producer);
        vm.expectRevert("User already registered");
        supplyChain.requestUserRole("Factory");
    }
    
    /// @notice Test: Admin aprueba usuario
    function testAdminApproveUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.expectEmit(true, false, false, true);
        emit UserStatusChanged(producer, SupplyChain.UserStatus.Approved);
        
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Approved));
    }
    
    /// @notice Test: Admin rechaza usuario
    function testAdminRejectUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.expectEmit(true, false, false, true);
        emit UserStatusChanged(producer, SupplyChain.UserStatus.Rejected);
        
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Rejected);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Rejected));
    }
    
    /// @notice Test: Solo admin puede cambiar estado
    function testOnlyAdminCanChangeStatus() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.prank(producer);
        vm.expectRevert("Only admin can perform this action");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
    }
    
    /// @notice Test: Obtener información de usuario
    function testGetUserInfo() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.id, 2); // Admin tiene userId = 1
        assertEq(user.userAddress, producer);
        assertEq(user.role, "Producer");
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Approved));
    }
    
    /// @notice Test: Verificar función isAdmin
    function testIsAdmin() public {
        assertTrue(supplyChain.isAdmin(admin));
        assertFalse(supplyChain.isAdmin(producer));
    }
    
    /// @notice Test: Verificar cambios de estado
    function testUserStatusChanges() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        // Estado inicial: Pending
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Pending));
        
        // Cambiar a Approved
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Approved));
        
        // Cambiar a Rejected
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Rejected);
        user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Rejected));
        
        // Cambiar a Canceled
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Canceled);
        user = supplyChain.getUserInfo(producer);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Canceled));
    }
    
    /// @notice Test: Intentar cambiar estado de usuario no registrado
    function testChangeStatusNonExistentUser() public {
        vm.expectRevert("User not registered");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
    }
    
    /// @notice Test: Intentar obtener información de usuario no registrado
    function testGetUserInfoNonExistent() public {
        vm.expectRevert("User not registered");
        supplyChain.getUserInfo(producer);
    }
    
    // ============ Tests de Gestión de Tokens ============
    
    /// @notice Test: Producer crea token sin parentId
    function testCreateTokenByProducer() public {
        _registerAndApproveUser(producer, "Producer");
        
        vm.expectEmit(true, true, false, true);
        emit TokenCreated(1, producer, "Wheat", 1000);
        
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "organic", 0);
        
        (uint256 id, address creator, string memory name, uint256 totalSupply, , uint256 parentId, ) = 
            supplyChain.getToken(1);
        
        assertEq(id, 1);
        assertEq(creator, producer);
        assertEq(name, "Wheat");
        assertEq(totalSupply, 1000);
        assertEq(parentId, 0);
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
    }
    
    /// @notice Test: Producer intenta crear token con parentId (debe fallar)
    function testCreateTokenByProducerWithParent() public {
        _registerAndApproveUser(producer, "Producer");
        
        vm.prank(producer);
        vm.expectRevert("Producer can only create base tokens");
        supplyChain.createToken("Wheat", 1000, "organic", 1);
    }
    
    /// @notice Test: Factory crea token derivado
    function testCreateTokenByFactory() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        // Crear token base
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Transferir token base a Factory
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory crea token derivado
        vm.expectEmit(true, true, false, true);
        emit TokenCreated(2, factory, "Flour", 500);
        
        vm.prank(factory);
        supplyChain.createToken("Flour", 500, "processed", baseTokenId);
        
        (uint256 id, address creator, string memory name, uint256 totalSupply, , uint256 parentId, ) = 
            supplyChain.getToken(2);
        
        assertEq(id, 2);
        assertEq(creator, factory);
        assertEq(name, "Flour");
        assertEq(totalSupply, 500);
        assertEq(parentId, baseTokenId);
        assertEq(supplyChain.getTokenBalance(2, factory), 500);
    }
    
    /// @notice Test: Factory intenta crear sin parentId (debe fallar)
    function testCreateTokenByFactoryWithoutParent() public {
        _registerAndApproveUser(factory, "Factory");
        
        vm.prank(factory);
        vm.expectRevert("Factory/Retailer must specify parent token");
        supplyChain.createToken("Flour", 500, "processed", 0);
    }
    
    /// @notice Test: Factory intenta crear token derivado sin balance del padre (debe fallar)
    function testCreateTokenByFactoryWithoutParentBalance() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        // Crear token base pero no transferirlo a Factory
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(factory);
        vm.expectRevert("Insufficient balance of parent token");
        supplyChain.createToken("Flour", 500, "processed", baseTokenId);
    }
    
    /// @notice Test: Retailer crea token derivado
    function testCreateTokenByRetailer() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        _registerAndApproveUser(retailer, "Retailer");
        
        // Crear token base y transferirlo a Factory
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory crea producto derivado
        vm.prank(factory);
        supplyChain.createToken("Flour", 500, "processed", baseTokenId);
        uint256 factoryTokenId = 2; // El segundo token creado
        
        // Transferir producto de Factory a Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, factoryTokenId, 300);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        // Retailer crea producto derivado
        vm.prank(retailer);
        supplyChain.createToken("Bread", 300, "baked", factoryTokenId);
        
        (uint256 id, address creator, string memory name, , , uint256 parentId, ) = 
            supplyChain.getToken(3);
        
        assertEq(id, 3);
        assertEq(creator, retailer);
        assertEq(name, "Bread");
        assertEq(parentId, factoryTokenId);
    }
    
    /// @notice Test: Usuario no aprobado intenta crear token (debe fallar)
    function testCreateTokenUnapprovedUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        // No aprobar usuario
        
        vm.prank(producer);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Wheat", 1000, "organic", 0);
    }
    
    /// @notice Test: Verificar balance inicial después de creación
    function testTokenBalance() public {
        _registerAndApproveUser(producer, "Producer");
        
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "organic", 0);
        
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
    }
    
    /// @notice Test: Obtener información de token
    function testGetToken() public {
        _registerAndApproveUser(producer, "Producer");
        
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "organic", 0);
        
        (uint256 id, address creator, string memory name, uint256 totalSupply, 
         string memory features, uint256 parentId, uint256 dateCreated) = 
            supplyChain.getToken(1);
        
        assertEq(id, 1);
        assertEq(creator, producer);
        assertEq(name, "Wheat");
        assertEq(totalSupply, 1000);
        assertEq(features, "organic");
        assertEq(parentId, 0);
        assertGt(dateCreated, 0);
    }
    
    /// @notice Test: Obtener lista de tokens de usuario
    function testGetUserTokens() public {
        _registerAndApproveUser(producer, "Producer");
        
        // Crear múltiples tokens
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "organic", 0);
        
        vm.prank(producer);
        supplyChain.createToken("Corn", 500, "organic", 0);
        
        uint256[] memory tokens = supplyChain.getUserTokens(producer);
        assertEq(tokens.length, 2);
        assertEq(tokens[0], 1);
        assertEq(tokens[1], 2);
    }
    
    /// @notice Test: Verificar que metadatos se almacenan correctamente
    function testTokenMetadata() public {
        _registerAndApproveUser(producer, "Producer");
        
        string memory features = '{"organic": true, "certified": "USDA"}';
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, features, 0);
        
        (, , , , string memory storedFeatures, , ) = supplyChain.getToken(1);
        assertEq(storedFeatures, features);
    }
    
    /// @notice Test: Intentar crear token con totalSupply = 0 (debe fallar)
    function testCreateTokenZeroSupply() public {
        _registerAndApproveUser(producer, "Producer");
        
        vm.prank(producer);
        vm.expectRevert("Total supply must be greater than 0");
        supplyChain.createToken("Wheat", 0, "organic", 0);
    }
    
    /// @notice Test: Intentar obtener token inexistente (debe fallar)
    function testGetTokenNonExistent() public {
        vm.expectRevert("Token does not exist");
        supplyChain.getToken(999);
    }
    
    // ============ Tests de Transferencias ============
    
    /// @notice Test: Transferencia válida Producer → Factory
    function testTransferFromProducerToFactory() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.expectEmit(true, true, true, true);
        emit TransferRequested(1, producer, factory, baseTokenId, 500);
        
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(transfer.from, producer);
        assertEq(transfer.to, factory);
        assertEq(transfer.tokenId, baseTokenId);
        assertEq(transfer.amount, 500);
        assertEq(uint256(transfer.status), uint256(SupplyChain.TransferStatus.Pending));
    }
    
    /// @notice Test: Transferencia inválida Producer → Retailer (debe fallar)
    function testTransferFromProducerToRetailer() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(retailer, "Retailer");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(producer);
        vm.expectRevert("Invalid transfer flow");
        supplyChain.transfer(retailer, baseTokenId, 500);
    }
    
    /// @notice Test: Transferencia válida Factory → Retailer
    function testTransferFromFactoryToRetailer() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        _registerAndApproveUser(retailer, "Retailer");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Producer transfiere a Factory
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory crea producto derivado
        vm.prank(factory);
        supplyChain.createToken("Flour", 500, "processed", baseTokenId);
        uint256 factoryTokenId = 2;
        
        // Factory transfiere a Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, factoryTokenId, 300);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(2);
        assertEq(transfer.from, factory);
        assertEq(transfer.to, retailer);
        assertEq(transfer.tokenId, factoryTokenId);
        assertEq(transfer.amount, 300);
    }
    
    /// @notice Test: Transferencia inválida Factory → Consumer (debe fallar)
    function testTransferFromFactoryToConsumer() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        _registerAndApproveUser(consumer, "Consumer");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Producer transfiere a Factory
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory crea producto derivado
        vm.prank(factory);
        supplyChain.createToken("Flour", 500, "processed", baseTokenId);
        uint256 factoryTokenId = 2;
        
        // Factory intenta transferir directamente a Consumer (debe fallar)
        vm.prank(factory);
        vm.expectRevert("Invalid transfer flow");
        supplyChain.transfer(consumer, factoryTokenId, 300);
    }
    
    /// @notice Test: Transferencia válida Retailer → Consumer
    function testTransferFromRetailerToConsumer() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        _registerAndApproveUser(retailer, "Retailer");
        _registerAndApproveUser(consumer, "Consumer");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Producer → Factory
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory crea producto y transfiere a Retailer
        vm.prank(factory);
        supplyChain.createToken("Flour", 500, "processed", baseTokenId);
        uint256 factoryTokenId = 2;
        vm.prank(factory);
        supplyChain.transfer(retailer, factoryTokenId, 300);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        // Retailer transfiere a Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, factoryTokenId, 200);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(3);
        assertEq(transfer.from, retailer);
        assertEq(transfer.to, consumer);
        assertEq(transfer.tokenId, factoryTokenId);
        assertEq(transfer.amount, 200);
    }
    
    /// @notice Test: Transferir más de lo que se tiene (debe fallar)
    function testTransferInsufficientBalance() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(producer);
        vm.expectRevert("Insufficient balance");
        supplyChain.transfer(factory, baseTokenId, 1500);
    }
    
    /// @notice Test: Aceptar transferencia pendiente
    function testAcceptTransfer() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Crear transferencia
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        // Verificar balance antes
        assertEq(supplyChain.getTokenBalance(baseTokenId, producer), 1000);
        assertEq(supplyChain.getTokenBalance(baseTokenId, factory), 0);
        
        // Aceptar transferencia
        vm.expectEmit(true, false, false, true);
        emit TransferAccepted(1);
        
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Verificar balances después
        assertEq(supplyChain.getTokenBalance(baseTokenId, producer), 500);
        assertEq(supplyChain.getTokenBalance(baseTokenId, factory), 500);
        
        // Verificar estado de transferencia
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(uint256(transfer.status), uint256(SupplyChain.TransferStatus.Accepted));
    }
    
    /// @notice Test: Rechazar transferencia pendiente
    function testRejectTransfer() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Crear transferencia
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        // Rechazar transferencia
        vm.expectEmit(true, false, false, true);
        emit TransferRejected(1);
        
        vm.prank(factory);
        supplyChain.rejectTransfer(1);
        
        // Verificar que los balances no cambiaron
        assertEq(supplyChain.getTokenBalance(baseTokenId, producer), 1000);
        assertEq(supplyChain.getTokenBalance(baseTokenId, factory), 0);
        
        // Verificar estado de transferencia
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(uint256(transfer.status), uint256(SupplyChain.TransferStatus.Rejected));
    }
    
    /// @notice Test: Otro usuario intenta aceptar (debe fallar)
    function testAcceptTransferWrongRecipient() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        _registerAndApproveUser(retailer, "Retailer");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Crear transferencia Producer → Factory
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        // Retailer intenta aceptar (debe fallar)
        vm.prank(retailer);
        vm.expectRevert("Only recipient can accept");
        supplyChain.acceptTransfer(1);
    }
    
    /// @notice Test: Intentar aceptar transferencia ya aceptada (debe fallar)
    function testAcceptTransferAlreadyAccepted() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Crear y aceptar transferencia
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Intentar aceptar de nuevo (debe fallar)
        vm.prank(factory);
        vm.expectRevert("Transfer already processed");
        supplyChain.acceptTransfer(1);
    }
    
    /// @notice Test: Consumer intenta transferir (debe fallar)
    function testConsumerCannotTransfer() public {
        // Registrar todos los usuarios primero
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        _registerAndApproveUser(retailer, "Retailer");
        _registerAndApproveUser(consumer, "Consumer");
        
        // Consumer recibe un token
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Producer → Factory → Retailer → Consumer
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        vm.prank(factory);
        supplyChain.createToken("Flour", 500, "processed", baseTokenId);
        uint256 factoryTokenId = 2;
        
        vm.prank(factory);
        supplyChain.transfer(retailer, factoryTokenId, 300);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        vm.prank(retailer);
        supplyChain.transfer(consumer, factoryTokenId, 200);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);
        
        // Consumer intenta transferir (debe fallar por flujo inválido)
        // Nota: La validación de flujo se ejecuta antes que la validación de Consumer
        vm.prank(consumer);
        vm.expectRevert("Invalid transfer flow");
        supplyChain.transfer(retailer, factoryTokenId, 100);
    }
    
    /// @notice Test: Obtener información de transferencia
    function testGetTransfer() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(transfer.id, 1);
        assertEq(transfer.from, producer);
        assertEq(transfer.to, factory);
        assertEq(transfer.tokenId, baseTokenId);
        assertEq(transfer.amount, 500);
        assertEq(uint256(transfer.status), uint256(SupplyChain.TransferStatus.Pending));
    }
    
    /// @notice Test: Obtener lista de transferencias de usuario
    function testGetUserTransfers() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        // Crear múltiples transferencias
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 300);
        
        uint256[] memory transfers = supplyChain.getUserTransfers(producer);
        assertGe(transfers.length, 2);
        
        // Verificar que las transferencias están relacionadas con producer
        SupplyChain.Transfer memory transfer1 = supplyChain.getTransfer(transfers[0]);
        assertTrue(transfer1.from == producer || transfer1.to == producer);
    }
    
    /// @notice Test: Transferir cantidad cero (debe fallar)
    function testTransferZeroAmount() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(producer);
        vm.expectRevert("Amount must be greater than 0");
        supplyChain.transfer(factory, baseTokenId, 0);
    }
    
    /// @notice Test: Intentar transferir a dirección cero (debe fallar)
    function testTransferToZeroAddress() public {
        _registerAndApproveUser(producer, "Producer");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(producer);
        vm.expectRevert("Invalid recipient address");
        supplyChain.transfer(address(0), baseTokenId, 500);
    }
    
    /// @notice Test: Intentar transferir a uno mismo (debe fallar)
    function testTransferToSelf() public {
        _registerAndApproveUser(producer, "Producer");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(producer);
        vm.expectRevert("Cannot transfer to yourself");
        supplyChain.transfer(producer, baseTokenId, 500);
    }
    
    // ============ Tests de Flujo Completo ============
    
    /// @notice Test: Flujo completo Producer → Factory → Retailer → Consumer
    function testCompleteSupplyChainFlow() public {
        // Registrar y aprobar todos los usuarios
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        _registerAndApproveUser(retailer, "Retailer");
        _registerAndApproveUser(consumer, "Consumer");
        
        // 1. Producer crea materia prima
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "organic", 0);
        uint256 wheatTokenId = 1;
        
        // Verificar balance inicial
        assertEq(supplyChain.getTokenBalance(wheatTokenId, producer), 1000);
        
        // 2. Producer transfiere a Factory
        vm.prank(producer);
        supplyChain.transfer(factory, wheatTokenId, 800);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        assertEq(supplyChain.getTokenBalance(wheatTokenId, producer), 200);
        assertEq(supplyChain.getTokenBalance(wheatTokenId, factory), 800);
        
        // 3. Factory crea producto derivado
        vm.prank(factory);
        supplyChain.createToken("Flour", 800, "processed", wheatTokenId);
        uint256 flourTokenId = 2;
        
        assertEq(supplyChain.getTokenBalance(flourTokenId, factory), 800);
        
        // 4. Factory transfiere a Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, flourTokenId, 600);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        assertEq(supplyChain.getTokenBalance(flourTokenId, factory), 200);
        assertEq(supplyChain.getTokenBalance(flourTokenId, retailer), 600);
        
        // 5. Retailer crea producto final
        vm.prank(retailer);
        supplyChain.createToken("Bread", 600, "baked", flourTokenId);
        uint256 breadTokenId = 3;
        
        assertEq(supplyChain.getTokenBalance(breadTokenId, retailer), 600);
        
        // 6. Retailer transfiere a Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, breadTokenId, 500);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);
        
        assertEq(supplyChain.getTokenBalance(breadTokenId, retailer), 100);
        assertEq(supplyChain.getTokenBalance(breadTokenId, consumer), 500);
        
        // Verificar trazabilidad: Bread tiene parent Flour, Flour tiene parent Wheat
        (, , , , , uint256 breadParentId, ) = supplyChain.getToken(breadTokenId);
        assertEq(breadParentId, flourTokenId);
        
        (, , , , , uint256 flourParentId, ) = supplyChain.getToken(flourTokenId);
        assertEq(flourParentId, wheatTokenId);
    }
    
    /// @notice Test: Múltiples tokens en el sistema
    function testMultipleTokensFlow() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        // Crear múltiples materias primas
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "organic", 0);
        vm.prank(producer);
        supplyChain.createToken("Corn", 500, "organic", 0);
        vm.prank(producer);
        supplyChain.createToken("Rice", 800, "organic", 0);
        
        // Verificar que todos los tokens fueron creados
        uint256[] memory producerTokens = supplyChain.getUserTokens(producer);
        assertEq(producerTokens.length, 3);
        
        // Verificar balances
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(2, producer), 500);
        assertEq(supplyChain.getTokenBalance(3, producer), 800);
    }
    
    /// @notice Test: Verificar trazabilidad completa de un producto
    function testTraceabilityFlow() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        _registerAndApproveUser(retailer, "Retailer");
        _registerAndApproveUser(consumer, "Consumer");
        
        // Crear cadena completa
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "organic", 0);
        uint256 wheatId = 1;
        
        vm.prank(producer);
        supplyChain.transfer(factory, wheatId, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        vm.prank(factory);
        supplyChain.createToken("Flour", 1000, "processed", wheatId);
        uint256 flourId = 2;
        
        vm.prank(factory);
        supplyChain.transfer(retailer, flourId, 1000);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        vm.prank(retailer);
        supplyChain.createToken("Bread", 1000, "baked", flourId);
        uint256 breadId = 3;
        
        // Verificar trazabilidad hacia atrás
        (, address breadCreator, , , , uint256 breadParent, ) = supplyChain.getToken(breadId);
        assertEq(breadCreator, retailer);
        assertEq(breadParent, flourId);
        
        (, address flourCreator, , , , uint256 flourParent, ) = supplyChain.getToken(flourId);
        assertEq(flourCreator, factory);
        assertEq(flourParent, wheatId);
        
        (, address wheatCreator, , , , uint256 wheatParent, ) = supplyChain.getToken(wheatId);
        assertEq(wheatCreator, producer);
        assertEq(wheatParent, 0); // Materia prima sin padre
    }
    
    // ============ Tests de Eventos ============
    
    /// @notice Test: Verificar emisión de evento UserRoleRequested
    function testUserRegisteredEvent() public {
        vm.expectEmit(true, false, false, true);
        emit UserRoleRequested(producer, "Producer");
        
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
    }
    
    /// @notice Test: Verificar emisión de evento UserStatusChanged
    function testUserStatusChangedEvent() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.expectEmit(true, false, false, true);
        emit UserStatusChanged(producer, SupplyChain.UserStatus.Approved);
        
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
    }
    
    /// @notice Test: Verificar emisión de evento TokenCreated
    function testTokenCreatedEvent() public {
        _registerAndApproveUser(producer, "Producer");
        
        vm.expectEmit(true, true, false, true);
        emit TokenCreated(1, producer, "Wheat", 1000);
        
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "organic", 0);
    }
    
    /// @notice Test: Verificar emisión de evento TransferRequested
    function testTransferInitiatedEvent() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.expectEmit(true, true, true, true);
        emit TransferRequested(1, producer, factory, baseTokenId, 500);
        
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
    }
    
    /// @notice Test: Verificar emisión de evento TransferAccepted
    function testTransferAcceptedEvent() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        vm.expectEmit(true, false, false, true);
        emit TransferAccepted(1);
        
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
    }
    
    /// @notice Test: Verificar emisión de evento TransferRejected
    function testTransferRejectedEvent() public {
        _registerAndApproveUser(producer, "Producer");
        _registerAndApproveUser(factory, "Factory");
        
        baseTokenId = _createBaseToken("Wheat", 1000, "organic");
        
        vm.prank(producer);
        supplyChain.transfer(factory, baseTokenId, 500);
        
        vm.expectEmit(true, false, false, true);
        emit TransferRejected(1);
        
        vm.prank(factory);
        supplyChain.rejectTransfer(1);
    }
    
    // ============ Tests de Registro Automático del Admin (SC-019) ============
    
    /// @notice Test: Verificar que el admin se registra automáticamente en el constructor
    function testAdminAutoRegistration() public {
        // Verificar que el admin tiene userId = 1 (primer usuario registrado)
        uint256 adminUserId = supplyChain.addressToUserId(admin);
        assertEq(adminUserId, 1, "Admin should have userId = 1");
        
        // Verificar que el admin tiene rol "Admin"
        SupplyChain.User memory adminUser = supplyChain.getUserInfo(admin);
        assertEq(adminUser.role, "Admin", "Admin should have role 'Admin'");
        
        // Verificar que el admin tiene estado Approved
        assertEq(
            uint256(adminUser.status),
            uint256(SupplyChain.UserStatus.Approved),
            "Admin should have status Approved"
        );
        
        // Verificar que está en el mapping addressToUserId
        assertEq(supplyChain.addressToUserId(admin), 1, "Admin should be in addressToUserId mapping");
        
        // Verificar que está en el array allUserIds
        // Como nextUserId = 2, sabemos que hay 1 usuario (admin con userId = 1)
        uint256 firstUserId = supplyChain.allUserIds(0);
        assertEq(firstUserId, 1, "First user in allUserIds should be admin with userId = 1");
        
        // Verificar que nextUserId es 2 (ya que admin es userId = 1)
        assertEq(supplyChain.nextUserId(), 2, "nextUserId should be 2 after admin registration");
    }
    
    /// @notice Test: Verificar que el admin no puede cambiarse su propio estado
    function testAdminCannotChangeOwnStatus() public {
        // Intentar cambiar estado del admin a Rejected (debe fallar)
        vm.expectRevert("Admin cannot change their own status");
        supplyChain.changeStatusUser(admin, SupplyChain.UserStatus.Rejected);
        
        // Intentar cambiar estado del admin a Canceled (debe fallar)
        vm.expectRevert("Admin cannot change their own status");
        supplyChain.changeStatusUser(admin, SupplyChain.UserStatus.Canceled);
        
        // Intentar cambiar estado del admin a Pending (debe fallar)
        vm.expectRevert("Admin cannot change their own status");
        supplyChain.changeStatusUser(admin, SupplyChain.UserStatus.Pending);
        
        // Verificar que el estado del admin sigue siendo Approved
        SupplyChain.User memory adminUser = supplyChain.getUserInfo(admin);
        assertEq(
            uint256(adminUser.status),
            uint256(SupplyChain.UserStatus.Approved),
            "Admin status should remain Approved"
        );
    }
    
    /// @notice Test: Verificar que "Admin" es un rol válido según _isValidRole
    /// @dev Este test verifica indirectamente que el rol "Admin" es válido
    ///      ya que el admin se registra con éxito en el constructor
    function testAdminRoleIsValid() public {
        // Verificar que el admin tiene rol "Admin" (lo cual confirma que es válido)
        SupplyChain.User memory adminUser = supplyChain.getUserInfo(admin);
        assertEq(adminUser.role, "Admin", "Admin role should be valid");
        
        // Verificar que un usuario puede solicitar rol "Admin" (aunque no se use normalmente)
        // Esto confirma que _isValidRole acepta "Admin"
        address testUser = makeAddr("testAdminRole");
        vm.prank(testUser);
        supplyChain.requestUserRole("Admin");
        
        SupplyChain.User memory testUserInfo = supplyChain.getUserInfo(testUser);
        assertEq(testUserInfo.role, "Admin", "Admin role should be accepted");
    }
    
    /// @notice Test: Verificar que getUserInfo retorna correctamente la información del admin
    function testAdminGetUserInfo() public {
        SupplyChain.User memory adminUser = supplyChain.getUserInfo(admin);
        
        // Verificar todos los campos del admin
        assertEq(adminUser.id, 1, "Admin should have id = 1");
        assertEq(adminUser.userAddress, admin, "Admin address should match");
        assertEq(adminUser.role, "Admin", "Admin should have role 'Admin'");
        assertEq(
            uint256(adminUser.status),
            uint256(SupplyChain.UserStatus.Approved),
            "Admin should have status Approved"
        );
    }
    
    /// @notice Test: Verificar que getUserInfo no lanza error "User not registered" para el admin
    function testAdminIsRegistered() public {
        // Verificar que getUserInfo no lanza error para el admin
        SupplyChain.User memory adminUser = supplyChain.getUserInfo(admin);
        
        // Si llegamos aquí sin revertir, el admin está registrado
        assertEq(adminUser.userAddress, admin, "Admin should be registered");
        assertEq(adminUser.id, 1, "Admin should have userId = 1");
        
        // Verificar que addressToUserId retorna un valor > 0 para el admin
        uint256 adminUserId = supplyChain.addressToUserId(admin);
        assertGt(adminUserId, 0, "Admin should have a valid userId");
    }
    
    // ============ Tests de Eventos del Admin (SC-020) ============
    
    /// @notice Test: Verificar eventos emitidos durante registro automático del admin
    /// @dev Este test verifica que el constructor emite los eventos correctos
    function testAdminRegistrationEvents() public {
        // Desplegar un nuevo contrato para capturar eventos del constructor
        vm.recordLogs();
        new SupplyChain();
        Vm.Log[] memory logs = vm.getRecordedLogs();
        
        // Verificar que se emitieron exactamente 2 eventos
        assertGe(logs.length, 2, "Should emit at least 2 events during admin registration");
        
        // Buscar eventos por su signature
        bytes32 userRoleRequestedTopic = keccak256("UserRoleRequested(address,string)");
        bytes32 userStatusChangedTopic = keccak256("UserStatusChanged(address,uint8)");
        
        bool foundUserRoleRequested = false;
        bool foundUserStatusChanged = false;
        
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == userRoleRequestedTopic) {
                foundUserRoleRequested = true;
                // Verificar que el usuario es el admin (deployer)
                address eventUser = address(uint160(uint256(logs[i].topics[1])));
                assertEq(eventUser, address(this), "UserRoleRequested should be for deployer");
            } else if (logs[i].topics[0] == userStatusChangedTopic) {
                foundUserStatusChanged = true;
                // Verificar que el usuario es el admin
                address statusEventUser = address(uint160(uint256(logs[i].topics[1])));
                assertEq(statusEventUser, address(this), "UserStatusChanged should be for deployer");
                // Verificar que el estado es Approved (1) - está en los datos del evento, no en topics
                require(logs[i].data.length >= 32, "UserStatusChanged should have status in data");
                uint8 status = uint8(uint256(bytes32(logs[i].data)));
                assertEq(status, uint8(SupplyChain.UserStatus.Approved), "Status should be Approved");
            }
        }
        
        assertTrue(foundUserRoleRequested, "UserRoleRequested event should be emitted");
        assertTrue(foundUserStatusChanged, "UserStatusChanged event should be emitted");
    }
}

