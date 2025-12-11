// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

/// @title DeployScript
/// @notice Script para desplegar el contrato SupplyChain
/// @dev Usa variables de entorno para configuración
contract DeployScript is Script {
    /// @notice Dirección del contrato desplegado
    SupplyChain public supplyChain;
    
    /// @notice Ejecuta el script de deploy
    function run() public {
        // Obtener la clave privada desde variables de entorno o usar la cuenta por defecto de Anvil
        // Clave privada por defecto de Anvil (primera cuenta): 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying SupplyChain contract...");
        console.log("Deployer address:", deployer);
        console.log("Chain ID:", block.chainid);
        
        // Iniciar broadcast
        vm.startBroadcast(deployerPrivateKey);
        
        // Desplegar contrato
        supplyChain = new SupplyChain();
        
        // Detener broadcast
        vm.stopBroadcast();
        
        // Loggear información importante
        console.log("==========================================");
        console.log("SupplyChain deployed successfully!");
        console.log("Contract address:", address(supplyChain));
        console.log("Admin address:", supplyChain.admin());
        console.log("==========================================");
        
        // Verificar que el admin es el deployer
        require(
            supplyChain.admin() == deployer,
            "Admin should be the deployer"
        );
        
        console.log("Deployment verification: OK");
    }
}

