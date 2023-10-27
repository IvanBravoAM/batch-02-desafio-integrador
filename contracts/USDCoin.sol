// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
// Encontrarás una réplica del stable coin USDC en el repositorio. Al desplegarlo, el msg.sender se hace acreeder de 500,000 USDC. Esta cantidad es usada para crear el pool de liquidez junto al BBTKN.
// Este contrato no es actualizable y se publica en Ethereum (Goerli)
// Inicialmente este contrato es de 18 decimales. Debes convertirlo a un token de 6 decimales como lo es el original USDC.
// Puedes repartir USDC a cualquier comprador para que simule la posesión de fondos. Normalmente, este stable coin es adquirido en DEXes como Binance, KuCoin y otros.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract USDCoin is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 500_000 * 10 ** decimals());
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    
    function approve(address owner, address spender, uint256 amount) public{
        _approve(owner, spender, amount);
    }
}
