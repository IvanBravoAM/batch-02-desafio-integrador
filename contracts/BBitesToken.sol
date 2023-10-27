// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
// Este contrato es un ERC20 que debe ser convertido a actualizable. Posee 18 decimales. Es publicado en Ethereum (Goerli)
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";



/// @custom:security-contact lee.marreros@blockchainbites.co
contract BBitesToken is Initializable, ERC20Upgradeable,PausableUpgradeable, UUPSUpgradeable, OwnableUpgradeable, AccessControlUpgradeable{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");


    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // constructor() ERC20("BBites Token", "BBTKN") {
    //     _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

    //     // Configurar el rol MINTER_ROLE
    //     _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
    //     _setupRole(MINTER_ROLE, msg.sender);
    // }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    
    // En el método initialize(), usando _mint() se acuña 1 millón de tokens al que publica el contrato. Ese millón será utilizado para crear el pool de liquidez junto al USDC.
    function initialize(string memory name, string memory symbol) public initializer {
        __ERC20_init(name, symbol);
        __Ownable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Configurar el rol MINTER_ROLE
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
        _setupRole(MINTER_ROLE, msg.sender);

        uint256 initialSupply = 1_000_000 * 10**18; // 1 millón de tokens con 18 decimales
        _mint(msg.sender, initialSupply);
    }

    // Posee un método mint(address to, uint256 amount) onlyRole(MINTER_ROLE) que solo es llamado por el Relayer de Open Zeppelin. Este método es disparado cuando desde Polygon (Mumbai) se quema un NFT cuyo id está entre 1000 y 1999 (inclusivo). Se acuña 10,000 tokens al address que quemó su NFT. Su método mint posee el modifier whenNotPaused para pausarse cuando sea necesario.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
    }

    // Bonus: Implementar la extensión ERC20Permit. Aquellos compradores que no poseen gas para pagar la transacción crearán una firma digital para poner al contrato de Public Sale como el gastador de sus tokens. Esta firma digital podrá ser generada desde el front-end usando Metamask.
    // Una vez generada la firma, se llamará a un autotask desde el front-end pasando los parámetros necesarios (e.g. firma). Este autotask usará un relayer en Goerli y tendrá la tarea de llamar executePermitAndPurchase() public onlyRole(EXECUTER_ROLE) de Public Sale. Este método hace lo siguiente:

    // Ejecuta el método permit() del contrato ERC20Permit BBToken con todos sus parámetros (owner, spender, value, deadline, v, r y s)
    // Inmediatamente calcula un id aleatorio del tipo mistico (explicado más abajo) cuyos ids van del 700 al 999.
    // Emite el evento PurchaseNftWithId(owner, randomId)
    // Reutiliza la misma función aleatoria para este tipo de NFT mistico (ver cuarta modalidad de compra en el contrato Public Sale).


    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}
