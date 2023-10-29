// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
// Este contrato de Public Sale se publica en Ethereum (Goerli). Sirve como intermediario para poder realizar el pago para adquirir NFTs.

// La comunicación entre el contrato de Public Sale y el contrato de NFTs se dará a través de Open Zeppelin Defender. El contrato de Public Sale emite eventos que serán escuchados por Open Zeppelin Defender, que a su vez ordenará al contrato de NFT en Polygon (Mumbai) de acuñar un determinado NFT.

// Los ids para la venta usando BBTKN o USDC van del 0 hasta el 699 y tienen diferentes rangos de precio.

// Se puede enviar 0.01 ether para comprar NFTs en el rango de 700 - 999.

// Los ids que van del 1000 - 1999 solo se acuñan en Polygon (Mumbai) en el mismo contrato de NFTs usando la lista blanca (merkle tree).

// La siguiente tabla resume la información de ids vs tips vs precios.

// id (inclusivo)	Tipo	Precio (BBTKN)
// 0 - 199	Común	1000 BBTKN fijo
// 200 - 499	Raro	Multiplicar su id por 20
// 500 - 699	Legendario	Según días pasados*****
// 700 - 999	Místico	0.01 ether fijo
// 1000 - 1999	Whitelist	Sin precio
// *****Nota: Su precio cambia según el # de días pasados desde las 00 horas del 30 de septiembre del 2023 GMT (obtener el timestamp en epoch converter). El primer día empieza en 10,000 BBTKN. Por cada día pasado, el precio se incrementa en 2,000 BBTKN. El precio máximo es 90,000 BBTKN.

// La primera manera de compra es usando los BBTKN tokens. El método a usar es purchaseWithTokens(uint256 _id) y el usuario escoge el id a comprar y se emite el evento. Estos tokens se transfieren al contrato Public Sale. Aplica para ids en el rango 0 - 699.

// La segunda manera de compra es usando USDC. El método a usar es purchaseWithUSDC(uint256 _id) y el usuario escoge el id a comprar y se emite el evento. Internamente, en este método se usa el pool de liquidez para intercambiar los USDC por una cantidad exacta de BBTKN. Aplica para ids en el rango 0 - 699. Dado que no se sabe la cantidad de USDC a depositar, se sugiere dar el approve de un monto seguro por parte del usuario. Este método tiene que dar el vuelto del USDC que no se llegó a usar en la compra.

// BONUS: Para obtener un estimado de cuántos USDC se necesitan para comprar una cantidad exacta de BBTKN, revisar getAmountIn de Uniswap. El usuario, antes de comprar bajo este método, puede consultar getAmountIn y dar el approve en dicha cantidad de USDC estimada. Exponer getAmountIn en este contrato.

// La tercera manera de compra es enviando exactamente 0.01 ether y ejecutando, al mismo tiempo, el método purchaseWithEtherAndId(uint256 _id). El usuario escoge el id a comprar y se emite el evento. Aplica para ids en el rango 700 - 999. El ether es acumulado en el mismo contrato Public Sale. Dar vuelto si se envía más de 0.01 ether.

// La cuarta manera de compra es enviando exactamente 0.01 ether al contrato sin ejecutar ningún metodo. Aleatoriamente se escoge un id de NFT que esté disponible y se emite el evento. Aplica para ids en el rango 700 - 999. El ether es acumulado en el mismo contrato Public Sale.

// El evento que se emite luego de realizar cualquier compra tiena la siguiente forma: event PurchaseNftWithId(address account, uint256 id).

// El método llamado withdrawEther() public onlyRole(DEFAULT_ADMIN_ROLE) permite a cualquier admin transferirse el ether que fue depositado a este contrato.

// El método llamado withdrawTokens() public onlyRole(DEFAULT_ADMIN_ROLE) permite a cualquier admin transferirse los tokens BBTKN que fueron depositados a este contrato.

// Construir un método de ayuda que devuelve el precio dado un id. Este método se llamará getPriceForId(uint256 id) public view returns(uint256). Solo aplica para ids en el rango 0 y 699 (inclusivo).

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import {IUniSwapV2Router02} from "./Interfaces.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol"; 
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract PublicSale is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable
{
    IUniSwapV2Router02 router;
    IERC20 public bbtknToken;
    IERC20 public usdCoin;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    // 00 horas del 30 de septiembre del 2023 GMT
    uint256 constant startDate = 1696032000;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 90_000 * 10 ** 18;

    uint256 constant BB_DECIMALS = 10 ** 18;

    mapping(uint256 => bool) public nftPurchased;
    uint256 public etherBalance;
    address bbtknAddress;
    address usdCoinAddress;
    address routerAddress;

    event PurchaseNftWithId(address account, uint256 id);

    modifier checkAvailability(uint256 _id){
        require(!nftPurchased[_id], "NFT already purchased");
        _;
    }

    function initialize(
        address _bbtknTokenAddress,
        address _usdCoinAddress,
        address _uniswapRouter
    ) public initializer {
        __Ownable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        bbtknAddress = _bbtknTokenAddress;
        usdCoinAddress = _usdCoinAddress;
        routerAddress = _uniswapRouter;
        bbtknToken = IERC20(_bbtknTokenAddress);
        usdCoin = IERC20(_usdCoinAddress);
        router = IUniSwapV2Router02(_uniswapRouter);
    }

    // La primera manera de compra es usando los BBTKN tokens. El método a usar es purchaseWithTokens(uint256 _id) y el usuario escoge el id a comprar y se emite el evento. Estos tokens se transfieren al contrato Public Sale. Aplica para ids en el rango 0 - 699.
    function purchaseWithTokens(uint256 _id) checkAvailability(_id) public {
        require(_id <= 699, "Invalid NFT ID");
        uint256 priceInBBTKN = calculatePrice(_id); // Calcula el precio en BBTKN
        //*falta validacion de si se compro el token ya
        require(bbtknToken.balanceOf(msg.sender)>=priceInBBTKN,"Not enough tokens");
        
        require(bbtknToken.allowance(msg.sender, address(this)) >= priceInBBTKN,"Not enough allowance to transfer");
        // Realiza la transferencia de tokens desde el comprador al contrato Public Sale
        
        bool trans = bbtknToken.transferFrom(msg.sender, address(this), priceInBBTKN);
        require(trans,"Fail transfer of tokens");

        // Mark the NFT as purchased
        nftPurchased[_id] = true;
        // Emite el evento de compra
        emit PurchaseNftWithId(msg.sender, _id);
    }

    // La segunda manera de compra es usando USDC. El método a usar es purchaseWithUSDC(uint256 _id) y el usuario escoge el id a comprar y se emite el evento. Internamente, en este método se usa el pool de liquidez para intercambiar los USDC por una cantidad exacta de BBTKN. Aplica para ids en el rango 0 - 699. Dado que no se sabe la cantidad de USDC a depositar, se sugiere dar el approve de un monto seguro por parte del usuario. Este método tiene que dar el vuelto del USDC que no se llegó a usar en la compra.
    function purchaseWithUSDC(uint256 _id) checkAvailability(_id) external {
        require(_id <= 699, "Invalid NFT ID");

        uint256 _usdcAmount =usdCoin.allowance(msg.sender, address(this));
        usdCoin.transferFrom(msg.sender, address(this), _usdcAmount);

        //Allowance y transfer al router
        usdCoin.approve(routerAddress, _usdcAmount);

        // Obtener el precio en BBTKN del NFT
        uint256 price = calculatePrice(_id);
        address[] memory tokens = new address[](2);
        tokens[0] = usdCoinAddress;
        tokens[1] = bbtknAddress;
        uint256 deadline = block.timestamp + 10000;

        // Realizar el intercambio USDC a BBTKN en Uniswap
        uint[] memory amounts = router.swapTokensForExactTokens(
            uint(price),
            uint(_usdcAmount),
            tokens, // [token a entregar, token a recibir]
            address(this),
            deadline
        );

        // Calcular el cambio de USDC
        uint256 usdcChange = _usdcAmount - amounts[0];

        // Transferir el cambio de USDC al comprador
        if (usdcChange > 0) {
            require(
                usdCoin.transfer(msg.sender, usdcChange),
                "USDC transfer failed"
            );
        }

        // Mark the NFT as purchased
        nftPurchased[_id] = true;

        emit PurchaseNftWithId(msg.sender, _id);
    }

    // La tercera manera de compra es enviando exactamente 0.01 ether y ejecutando, al mismo tiempo, el método purchaseWithEtherAndId(uint256 _id). El usuario escoge el id a comprar y se emite el evento. Aplica para ids en el rango 700 - 999. El ether es acumulado en el mismo contrato Public Sale. Dar vuelto si se envía más de 0.01 ether.
    function purchaseWithEtherAndId(uint256 _id) checkAvailability(_id) public payable {
        require(_id >= 700 && _id <= 999, "Invalid NFT ID");
        // Accumulate ether in the contract
        etherBalance += msg.value;

        // Calculate ether change
        uint256 etherChange = 0;
        if (msg.value > 0.01 ether) {
            etherChange = msg.value - 0.01 ether;
            payable(msg.sender).transfer(etherChange);
            etherBalance -= etherChange;
        }
        
        // Mark the NFT as purchased
        nftPurchased[_id] = true;

        // Emit the purchase event
        emit PurchaseNftWithId(msg.sender, _id);
    }

    // La cuarta manera de compra es enviando exactamente 0.01 ether al contrato sin ejecutar ningún metodo. Aleatoriamente se escoge un id de NFT que esté disponible y se emite el evento. Aplica para ids en el rango 700 - 999. El ether es acumulado en el mismo contrato Public Sale.
    function depositEthForARandomNft() internal {
        // Check if the sent ether is exactly 0.01 ether
        require(msg.value == 0.01 ether, "Send exactly 0.01 ether");

        // Choose a random available NFT ID in the range 700-999
        uint256 randomId = generateRandomNFTId();

        // Accumulate ether in the contract
        etherBalance += msg.value;

        // Mark the NFT as purchased
        nftPurchased[randomId] = true;

        // Emit the purchase event
        emit PurchaseNftWithId(msg.sender, randomId);
    }

    function generateRandomNFTId() internal view returns (uint256) {
        uint256 id;
            uint256 seed = uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, blockhash(block.number - 1), msg.sender)
                )
            );
            id = (seed % 300) + 700;
        return id; // Generates a random ID in the range 700-999
    }

    function calculatePrice(uint256 _id) internal view returns (uint256) {
        require(_id < 1000, "Invalid NFT Id");
        uint256 price;
        if (_id <= 199) {
            // Común: 1000 BBTKN fijo
            price = 1000;
        } else if (_id <= 499) {
            // Raro: Multiplicar su id por 20
            price = _id * 20;
        } else if (_id <= 699) {
            // Legendario: Según días pasados desde una fecha constante en el contrato
            uint256 daysPassed = _calculateDaysPassed();
            // Calcula el precio legendario según los días pasados
            // El primer día empieza en 10,000 BBTKN. Por cada día pasado, el precio se incrementa en 2,000 BBTKN. El precio máximo es 90,000 BBTKN.
            price= calculateLegendaryPrice(daysPassed);
            return price;
        } else {
            return 0.01 ether;
        } 
        return price * BB_DECIMALS;
    }

    function _calculateDaysPassed() internal view returns (uint256) {
        return (block.timestamp - startDate) / 1 days;
    }

    function calculateLegendaryPrice(
        uint256 _daysPassed
    ) internal pure returns (uint256) {
        // Implementa la lógica para calcular el precio legendario según los días pasados
        uint256 price = 10000 + (_daysPassed * 2000); // Precio legendario basado en días
        if (price >= (MAX_PRICE_NFT/BB_DECIMALS)) {
            return MAX_PRICE_NFT;
        }
        return price * BB_DECIMALS;
    }

    function getUSDCAmount(
        uint amount
    ) public view returns (uint256 amountIn) {
        address[] memory tokens = new address[](2);
        tokens[0] = usdCoinAddress;
        tokens[1] = bbtknAddress;

        uint256[] memory _amounts = router.getAmountsIn(
            amount,tokens
        );
        return _amounts[0];
    }

    // El método llamado withdrawEther() public onlyRole(DEFAULT_ADMIN_ROLE) permite a cualquier admin transferirse el ether que fue depositado a este contrato.
    function withdrawEther() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Owner can withdraw accumulated ether
        require(etherBalance > 0, "No ether to withdraw");
        payable(msg.sender).transfer(etherBalance);
        etherBalance = 0;
    }

    receive() external payable {
        depositEthForARandomNft();
    }

    // El método llamado withdrawTokens() public onlyRole(DEFAULT_ADMIN_ROLE) permite a cualquier admin transferirse los tokens BBTKN que fueron depositados a este contrato.
    function withdrawTokens() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Owner can withdraw accumulated ether
        require(
            bbtknToken.balanceOf(address(this)) > 0,
            "No tokens to withdraw"
        );
        bbtknToken.approve(address(this), bbtknToken.balanceOf(address(this)));
        bbtknToken.transferFrom(
            address(this),
            msg.sender,
            bbtknToken.balanceOf(address(this))
        );
    }

    // Construir un método de ayuda que devuelve el precio dado un id. Este método se llamará getPriceForId(uint256 id) public view returns(uint256). Solo aplica para ids en el rango 0 y 699 (inclusivo).
    function getPriceForId(uint256 id) public view returns (uint256) {
        require(id <= 699, "Invalid NFT ID");
        return calculatePrice(id);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    } 

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override {}
}


