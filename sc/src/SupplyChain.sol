// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/// @title SupplyChain
/// @notice Smart contract para gestión de trazabilidad en cadena de suministro
/// @dev Permite crear tokens que representan productos y gestionar transferencias entre roles
contract SupplyChain {
    // ============ Enums ============
    
    /// @notice Estados posibles de un usuario en el sistema
    enum UserStatus {
        Pending,    // Esperando aprobación
        Approved,   // Aprobado y activo
        Rejected,   // Rechazado por admin
        Canceled    // Cancelado por usuario
    }
    
    /// @notice Estados posibles de una transferencia
    enum TransferStatus {
        Pending,    // Esperando aceptación
        Accepted,   // Aceptada y completada
        Rejected    // Rechazada por destinatario
    }
    
    // ============ Structs ============
    
    /// @notice Información de un usuario en el sistema
    struct User {
        uint256 id;              // ID único del usuario
        address userAddress;     // Dirección Ethereum del usuario
        string role;             // "Producer", "Factory", "Retailer", "Consumer"
        UserStatus status;       // Estado de aprobación
    }
    
    /// @notice Información de un token que representa un producto
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
    
    /// @notice Información de una transferencia entre usuarios
    struct Transfer {
        uint256 id;              // ID único de la transferencia
        address from;             // Dirección del remitente
        address to;               // Dirección del destinatario
        uint256 tokenId;          // ID del token transferido
        uint256 dateCreated;      // Timestamp de creación
        uint256 amount;           // Cantidad transferida
        TransferStatus status;    // Estado de la transferencia
    }
    
    // ============ State Variables ============
    
    /// @notice Dirección del administrador del sistema
    address public admin;
    
    /// @notice Contador para IDs de tokens (empieza en 1)
    uint256 public nextTokenId = 1;
    
    /// @notice Contador para IDs de transferencias (empieza en 1)
    uint256 public nextTransferId = 1;
    
    /// @notice Contador para IDs de usuarios (empieza en 1)
    uint256 public nextUserId = 1;
    
    /// @notice Mapeo de ID de token a Token
    mapping(uint256 => Token) public tokens;
    
    /// @notice Mapeo de ID de transferencia a Transfer
    mapping(uint256 => Transfer) public transfers;
    
    /// @notice Mapeo de ID de usuario a User
    mapping(uint256 => User) public users;
    
    /// @notice Mapeo de dirección a ID de usuario
    mapping(address => uint256) public addressToUserId;
    
    /// @notice Array de todos los IDs de tokens (para enumeración)
    uint256[] public allTokenIds;
    
    /// @notice Array de todos los IDs de transferencias (para enumeración)
    uint256[] public allTransferIds;
    
    /// @notice Array de todos los IDs de usuarios (para enumeración)
    uint256[] public allUserIds;
    
    // ============ Events ============
    
    /// @notice Emitido cuando se crea un nuevo token
    event TokenCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint256 totalSupply
    );
    
    /// @notice Emitido cuando se solicita una transferencia
    event TransferRequested(
        uint256 indexed transferId,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 amount
    );
    
    /// @notice Emitido cuando se acepta una transferencia
    event TransferAccepted(uint256 indexed transferId);
    
    /// @notice Emitido cuando se rechaza una transferencia
    event TransferRejected(uint256 indexed transferId);
    
    /// @notice Emitido cuando un usuario solicita un rol
    event UserRoleRequested(address indexed user, string role);
    
    /// @notice Emitido cuando cambia el estado de un usuario
    event UserStatusChanged(address indexed user, UserStatus status);
    
    // ============ Constructor ============
    
    /// @notice Constructor que establece el admin como el deployer y lo registra automáticamente
    constructor() {
        admin = msg.sender;
        
        // Registrar automáticamente al admin como usuario con rol "Admin" y estado Approved
        uint256 userId = nextUserId;
        unchecked {
            nextUserId++;
        }
        
        users[userId] = User({
            id: userId,
            userAddress: msg.sender,
            role: "Admin",
            status: UserStatus.Approved
        });
        
        addressToUserId[msg.sender] = userId;
        allUserIds.push(userId);
        
        emit UserRoleRequested(msg.sender, "Admin");
        emit UserStatusChanged(msg.sender, UserStatus.Approved);
    }
    
    // ============ Modifiers ============
    
    /// @notice Modificador que restringe funciones solo al admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    /// @notice Modificador que requiere que el usuario esté aprobado
    modifier onlyApprovedUser() {
        uint256 userId = addressToUserId[msg.sender];
        require(userId > 0, "User not registered");
        require(users[userId].status == UserStatus.Approved, "User not approved");
        _;
    }
    
    // ============ Helper Functions ============
    
    /// @notice Valida si un rol es válido
    /// @param role Rol a validar
    /// @return true si el rol es válido
    function _isValidRole(string memory role) internal pure returns (bool) {
        return (
            keccak256(bytes(role)) == keccak256(bytes("Producer")) ||
            keccak256(bytes(role)) == keccak256(bytes("Factory")) ||
            keccak256(bytes(role)) == keccak256(bytes("Retailer")) ||
            keccak256(bytes(role)) == keccak256(bytes("Consumer")) ||
            keccak256(bytes(role)) == keccak256(bytes("Admin"))
        );
    }
    
    /// @notice Valida si una transferencia entre dos roles es válida según el flujo
    /// @param from Dirección del remitente
    /// @param to Dirección del destinatario
    /// @return true si la transferencia es válida según el flujo de roles
    function _canTransfer(address from, address to) internal view returns (bool) {
        uint256 fromUserId = addressToUserId[from];
        uint256 toUserId = addressToUserId[to];
        
        // Verificar que ambos usuarios existen
        if (fromUserId == 0 || toUserId == 0) {
            return false;
        }
        
        // Verificar que ambos usuarios están aprobados
        if (users[fromUserId].status != UserStatus.Approved || 
            users[toUserId].status != UserStatus.Approved) {
            return false;
        }
        
        string memory fromRole = users[fromUserId].role;
        string memory toRole = users[toUserId].role;
        
        // Flujo válido: Producer → Factory → Retailer → Consumer
        bytes32 fromRoleHash = keccak256(bytes(fromRole));
        bytes32 toRoleHash = keccak256(bytes(toRole));
        
        bytes32 producerHash = keccak256(bytes("Producer"));
        bytes32 factoryHash = keccak256(bytes("Factory"));
        bytes32 retailerHash = keccak256(bytes("Retailer"));
        bytes32 consumerHash = keccak256(bytes("Consumer"));
        
        // Producer solo puede transferir a Factory
        if (fromRoleHash == producerHash) {
            return toRoleHash == factoryHash;
        }
        
        // Factory solo puede transferir a Retailer
        if (fromRoleHash == factoryHash) {
            return toRoleHash == retailerHash;
        }
        
        // Retailer solo puede transferir a Consumer
        if (fromRoleHash == retailerHash) {
            return toRoleHash == consumerHash;
        }
        
        // Consumer no puede transferir
        return false;
    }
    
    /// @notice Obtiene la información de un usuario por dirección
    /// @param userAddress Dirección del usuario
    /// @return User struct del usuario
    function _getUser(address userAddress) internal view returns (User memory) {
        uint256 userId = addressToUserId[userAddress];
        require(userId > 0, "User not registered");
        return users[userId];
    }
    
    // ============ User Management Functions ============
    
    /// @notice Solicita un rol en el sistema
    /// @param role Rol solicitado ("Producer", "Factory", "Retailer", "Consumer")
    function requestUserRole(string memory role) public {
        require(_isValidRole(role), "Invalid role");
        require(addressToUserId[msg.sender] == 0, "User already registered");
        
        uint256 userId = nextUserId;
        unchecked {
            nextUserId++;
        }
        
        users[userId] = User({
            id: userId,
            userAddress: msg.sender,
            role: role,
            status: UserStatus.Pending
        });
        
        addressToUserId[msg.sender] = userId;
        allUserIds.push(userId);
        
        emit UserRoleRequested(msg.sender, role);
    }
    
    /// @notice Cambia el estado de un usuario (solo Admin)
    /// @param userAddress Dirección del usuario
    /// @param newStatus Nuevo estado del usuario
    function changeStatusUser(address userAddress, UserStatus newStatus) public onlyAdmin {
        uint256 userId = addressToUserId[userAddress];
        require(userId > 0, "User not registered");
        require(users[userId].status != newStatus, "Status already set");
        
        // El admin no puede rechazarse o cancelarse a sí mismo
        require(userAddress != admin, "Admin cannot change their own status");
        
        users[userId].status = newStatus;
        
        emit UserStatusChanged(userAddress, newStatus);
    }
    
    /// @notice Obtiene la información de un usuario
    /// @param userAddress Dirección del usuario
    /// @return User struct con la información del usuario
    function getUserInfo(address userAddress) public view returns (User memory) {
        return _getUser(userAddress);
    }
    
    /// @notice Verifica si una dirección es admin
    /// @param userAddress Dirección a verificar
    /// @return true si la dirección es admin
    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }
    
    // ============ Token Management Functions ============
    
    /// @notice Crea un nuevo token que representa un producto o materia prima
    /// @dev El usuario debe estar aprobado. Producer solo puede crear materias primas (sin parentId).
    ///      Factory y Retailer deben especificar un parentId válido y tener balance del token padre.
    /// @param name Nombre del producto
    /// @param totalSupply Suministro total del token (debe ser > 0)
    /// @param features Metadatos JSON como string (puede ser "{}" si no hay metadatos)
    /// @param parentId ID del token padre (0 si es materia prima, > 0 si es producto derivado)
    /// @custom:requirements Usuario debe estar Approved
    /// @custom:requirements Producer: parentId debe ser 0
    /// @custom:requirements Factory/Retailer: parentId debe ser > 0 y usuario debe tener balance del token padre
    /// @custom:emits TokenCreated(tokenId, creator, name, totalSupply)
    function createToken(
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId
    ) public onlyApprovedUser {
        require(totalSupply > 0, "Total supply must be greater than 0");
        
        User memory user = _getUser(msg.sender);
        string memory userRole = user.role;
        
        // Producer solo puede crear tokens sin parentId (materias primas)
        if (keccak256(bytes(userRole)) == keccak256(bytes("Producer"))) {
            require(parentId == 0, "Producer can only create base tokens");
        } else {
            // Factory y Retailer deben especificar un parentId válido
            require(parentId > 0, "Factory/Retailer must specify parent token");
            require(tokens[parentId].creator != address(0), "Parent token does not exist");
            require(
                tokens[parentId].balance[msg.sender] > 0,
                "Insufficient balance of parent token"
            );
        }
        
        uint256 tokenId = nextTokenId;
        unchecked {
            nextTokenId++;
        }
        
        Token storage newToken = tokens[tokenId];
        newToken.id = tokenId;
        newToken.creator = msg.sender;
        newToken.name = name;
        newToken.totalSupply = totalSupply;
        newToken.features = features;
        newToken.parentId = parentId;
        newToken.dateCreated = block.timestamp;
        newToken.balance[msg.sender] = totalSupply;
        
        allTokenIds.push(tokenId);
        
        emit TokenCreated(tokenId, msg.sender, name, totalSupply);
    }
    
    /// @notice Obtiene el balance de un token para una dirección específica
    /// @param tokenId ID del token
    /// @param userAddress Dirección del usuario
    /// @return Balance del token para la dirección especificada
    function getTokenBalance(uint256 tokenId, address userAddress) public view returns (uint256) {
        require(tokens[tokenId].creator != address(0), "Token does not exist");
        return tokens[tokenId].balance[userAddress];
    }
    
    /// @notice Obtiene información básica de un token (sin el mapping de balances)
    /// @param tokenId ID del token
    /// @return id ID del token
    /// @return creator Dirección del creador
    /// @return name Nombre del token
    /// @return totalSupply Suministro total
    /// @return features Metadatos JSON
    /// @return parentId ID del token padre
    /// @return dateCreated Timestamp de creación
    function getToken(uint256 tokenId) public view returns (
        uint256 id,
        address creator,
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId,
        uint256 dateCreated
    ) {
        require(tokens[tokenId].creator != address(0), "Token does not exist");
        Token storage token = tokens[tokenId];
        return (
            token.id,
            token.creator,
            token.name,
            token.totalSupply,
            token.features,
            token.parentId,
            token.dateCreated
        );
    }
    
    /// @notice Obtiene los IDs de tokens que tienen balance > 0 para un usuario
    /// @param userAddress Dirección del usuario
    /// @return Array de IDs de tokens con balance > 0
    function getUserTokens(address userAddress) public view returns (uint256[] memory) {
        uint256[] memory userTokenIds = new uint256[](allTokenIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allTokenIds.length; i++) {
            uint256 tokenId = allTokenIds[i];
            if (tokens[tokenId].balance[userAddress] > 0) {
                userTokenIds[count] = tokenId;
                count++;
            }
        }
        
        // Redimensionar array al tamaño real
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userTokenIds[i];
        }
        
        return result;
    }
    
    // ============ Transfer Management Functions ============
    
    /// @notice Solicita una transferencia de tokens a otro usuario
    /// @dev Crea una transferencia con estado Pending que debe ser aceptada por el destinatario.
    ///      Valida el flujo de roles: Producer→Factory, Factory→Retailer, Retailer→Consumer.
    ///      Consumer no puede transferir.
    /// @param to Dirección del destinatario (debe estar registrado y aprobado)
    /// @param tokenId ID del token a transferir (debe existir)
    /// @param amount Cantidad a transferir (debe ser > 0 y <= balance del remitente)
    /// @custom:requirements Usuario debe estar Approved
    /// @custom:requirements Remitente debe tener balance suficiente
    /// @custom:requirements Destinatario debe estar registrado y aprobado
    /// @custom:requirements Flujo de roles debe ser válido según la cadena de suministro
    /// @custom:requirements Consumer no puede ser remitente
    /// @custom:emits TransferRequested(transferId, from, to, tokenId, amount)
    function transfer(address to, uint256 tokenId, uint256 amount) public onlyApprovedUser {
        require(to != address(0), "Invalid recipient address");
        require(to != msg.sender, "Cannot transfer to yourself");
        require(amount > 0, "Amount must be greater than 0");
        require(tokens[tokenId].creator != address(0), "Token does not exist");
        
        // Verificar balance suficiente
        require(
            tokens[tokenId].balance[msg.sender] >= amount,
            "Insufficient balance"
        );
        
        // Verificar que el destinatario tiene un rol válido y está aprobado
        uint256 toUserId = addressToUserId[to];
        require(toUserId > 0, "Recipient not registered");
        require(users[toUserId].status == UserStatus.Approved, "Recipient not approved");
        
        // Verificar flujo de roles válido
        require(_canTransfer(msg.sender, to), "Invalid transfer flow");
        
        // Verificar que Consumer no puede transferir
        User memory sender = _getUser(msg.sender);
        require(
            keccak256(bytes(sender.role)) != keccak256(bytes("Consumer")),
            "Consumer cannot transfer"
        );
        
        uint256 transferId = nextTransferId;
        unchecked {
            nextTransferId++;
        }
        
        transfers[transferId] = Transfer({
            id: transferId,
            from: msg.sender,
            to: to,
            tokenId: tokenId,
            dateCreated: block.timestamp,
            amount: amount,
            status: TransferStatus.Pending
        });
        
        allTransferIds.push(transferId);
        
        emit TransferRequested(transferId, msg.sender, to, tokenId, amount);
    }
    
    /// @notice Acepta una transferencia pendiente
    /// @param transferId ID de la transferencia a aceptar
    function acceptTransfer(uint256 transferId) public {
        require(transfers[transferId].from != address(0), "Transfer does not exist");
        require(transfers[transferId].to == msg.sender, "Only recipient can accept");
        require(
            transfers[transferId].status == TransferStatus.Pending,
            "Transfer already processed"
        );
        
        Transfer storage transferData = transfers[transferId];
        
        // Verificar que el remitente aún tiene balance suficiente
        require(
            tokens[transferData.tokenId].balance[transferData.from] >= transferData.amount,
            "Insufficient balance from sender"
        );
        
        // Actualizar balances
        tokens[transferData.tokenId].balance[transferData.from] -= transferData.amount;
        tokens[transferData.tokenId].balance[msg.sender] += transferData.amount;
        
        // Cambiar estado a Accepted
        transferData.status = TransferStatus.Accepted;
        
        emit TransferAccepted(transferId);
    }
    
    /// @notice Rechaza una transferencia pendiente
    /// @param transferId ID de la transferencia a rechazar
    function rejectTransfer(uint256 transferId) public {
        require(transfers[transferId].from != address(0), "Transfer does not exist");
        require(transfers[transferId].to == msg.sender, "Only recipient can reject");
        require(
            transfers[transferId].status == TransferStatus.Pending,
            "Transfer already processed"
        );
        
        transfers[transferId].status = TransferStatus.Rejected;
        
        emit TransferRejected(transferId);
    }
    
    /// @notice Obtiene información de una transferencia
    /// @param transferId ID de la transferencia
    /// @return Transfer struct con la información de la transferencia
    function getTransfer(uint256 transferId) public view returns (Transfer memory) {
        require(transfers[transferId].from != address(0), "Transfer does not exist");
        return transfers[transferId];
    }
    
    /// @notice Obtiene los IDs de transferencias relacionadas con un usuario (enviadas o recibidas)
    /// @param userAddress Dirección del usuario
    /// @return Array de IDs de transferencias
    function getUserTransfers(address userAddress) public view returns (uint256[] memory) {
        uint256[] memory userTransferIds = new uint256[](allTransferIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allTransferIds.length; i++) {
            uint256 transferId = allTransferIds[i];
            Transfer storage transferData = transfers[transferId];
            if (transferData.from == userAddress || transferData.to == userAddress) {
                userTransferIds[count] = transferId;
                count++;
            }
        }
        
        // Redimensionar array al tamaño real
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userTransferIds[i];
        }
        
        return result;
    }
}

