// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
// Este contrato Cuy Collection Nft implementa el estándar ERC721 que debe ser convertido a actualizable.
// Posee el método safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) que solo puede ser llamado por el Relayer de Open Zeppelin en Mumbai. Los ids permitidos van del 0 al 999 para este método. Lleva el modifier whenNotPaused.
// Posee el método safeMintWhiteList(address to, uint256 tokenId, bytes32[] proofs) public que será llamado por cada una de las 1000 billeteras de la lista blanca. Internamente este método valida que to y tokenId sean parte de la lista. Así también, se debe habilitar en el front-end una manera de solicitar las pruebas. Dado un address y un uint256, el front-end te entregará el array de pruebas a usarse como argumento de este método. Lleva whenNotPaused. Puede ser llamado por cualquiera.
// Posee el método buyBack(uint256 id) public que permite a los dueños de los ids en el rango de 1000 y 1999 (inclusivo) quemar sus NFTs a cambio de un repago de BBTKN en la red de Ethereum (Goerli). Este método emite el evento Burn(address account, uint256 id) que finalmente, cross-chain, dispara mint() en el token BBTKN en la cantidad de 10,000 BBTKNs.

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract CuyCollectionNft is
    Initializable,
    ERC721Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ERC721BurnableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    mapping(uint256 id => address owner) private owners;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _name,
        string memory _symbol
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __Pausable_init();
        __AccessControl_init();
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);


    }

    bytes32 public root;

    event Burn(address account, uint256 id);

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmWJ3udcvB2XjvgWjcn8YrC7w8VEL2VWaUMq1x6Ns4t29k/";
    }
    function actualizarRaiz(bytes32 _root) public {
        root = _root;
    }
    // Posee el método safeMint(address to, uint256 tokenId) public onlyRole(MINTER_ROLE) que solo puede ser llamado por el Relayer de Open Zeppelin en Mumbai. Los ids permitidos van del 0 al 999 para este método. Lleva el modifier whenNotPaused.
    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyRole(MINTER_ROLE) whenNotPaused {
        require(tokenId >= 0 && tokenId <= 999, "Wrong token ID"); // IDs permitidos del 0 al 999
        _safeMint(to, tokenId);
        owners[tokenId] = to;
    }

    // Posee el método safeMintWhiteList(address to, uint256 tokenId, bytes32[] proofs) public que será llamado por cada una de las 1000 billeteras de la lista blanca. Internamente este método valida que to y tokenId sean parte de la lista. Así también, se debe habilitar en el front-end una manera de solicitar las pruebas. Dado un address y un uint256, el front-end te entregará el array de pruebas a usarse como argumento de este método. Lleva whenNotPaused. Puede ser llamado por cualquiera.
    function safeMintWhiteList(
        address to,
        uint256 tokenId,
        bytes32[] calldata proofs
    ) public whenNotPaused {
        require(
            verify(_hashearInfo(to, tokenId), proofs),
            "No eres parte de la lista"
        );
        _safeMint(to, tokenId);
        owners[tokenId] = to;
    }

    function _hashearInfo(
        address to,
        uint256 tokenId
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenId, to));
    }

    function verify(
        bytes32 leaf,
        bytes32[] memory proofs
    ) public view returns (bool) {
        return MerkleProof.verify(proofs, root, leaf);
    }

    // Posee el método buyBack(uint256 id) public que permite a los dueños de los ids en el rango de 1000 y 1999 (inclusivo) quemar sus NFTs a cambio de un repago de BBTKN en la red de Ethereum (Goerli). Este método emite el evento Burn(address account, uint256 id) que finalmente, cross-chain, dispara mint() en el token BBTKN en la cantidad de 10,000 BBTKNs.
    function buyBack(uint256 id) public {
        // Asegurarse de que el NFT esté dentro del rango permitido (1000-1999).
        require(id >= 1000 && id <= 1999, "NFT out of range.");
        require(owners[id] == msg.sender, "You are not the owner of this Nft.");
        _burn(id);
        // Emitir el evento de quema.
        emit Burn(msg.sender, id);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface( 
        bytes4 interfaceId
    )
        public
        view
        override(AccessControlUpgradeable, ERC721Upgradeable)
        returns (bool)
    {}

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override {}
}
