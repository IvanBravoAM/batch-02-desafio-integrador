// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IUniSwapV2Router02 , IUniswapV2Factory} from "./Interfaces.sol";

// Address es en Ethereum y Testnets (Goerli)
// address: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D

// Factory: consultar el address del LP token
// address: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f


contract LiquidityProvider {

    IUniSwapV2Router02 router;
    address routerAddress;
    IUniswapV2Factory factory; 
    address factoryAddress;
    IERC20 tokenA;
    IERC20 tokenB;

    constructor(address _routerAddress, address _factoryAddress, address _tokenAAddress, address _tokenBAddress){
        router = IUniSwapV2Router02(_routerAddress);
        routerAddress = _routerAddress;
        factory = IUniswapV2Factory(_factoryAddress); 
        factoryAddress =  _factoryAddress;
        tokenA = IERC20(_tokenAAddress);
        tokenB =  IERC20(_tokenBAddress);

    }

    event LiquidityAddres(
        uint256 amountA,
        uint256 amountB,
        uint256 amountLpTokens
    );

    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint _amountADesired,
        uint _amountBDesired,
        uint _amountAMin,
        uint _amountBMin,
        address _to,
        uint _deadline
    ) public { 
        tokenA.approve(routerAddress, _amountADesired);
        tokenB.approve(routerAddress, _amountBDesired);

        uint256 amountA;
        uint256 amountB;
        uint256 amountLP;
        (amountA, amountB, amountLP) = router.addLiquidity(
            _tokenA,
            _tokenB,
            _amountADesired,
            _amountBDesired,
            _amountAMin,
            _amountBMin,
            _to,
            _deadline
        );

        emit LiquidityAddres(amountA, amountB, amountLP);
    }

    function getPair(
        address _tokenA,
        address _tokenB
    ) public view returns (address) {
        return factory.getPair(_tokenA, _tokenB);
    }
}
