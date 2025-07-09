// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

interface IERC20_USDT {
    function approve(address spender, uint256 amount) external;
    function transfer(address recipient, uint256 amount) external;
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external;
    function balanceOf(address account) external view returns (uint256);
}

contract A_B_C is Ownable {
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    ISwapRouter public immutable swapRouter;
    IQuoter public immutable quoter;

    constructor(address _swapRouter, address _quoter) Ownable(msg.sender) {
        swapRouter = ISwapRouter(_swapRouter);
        quoter = IQuoter(_quoter);
    }

    function getQuoteAtoBtoC(
        address tokenA,
        address tokenB,
        address tokenC,
        uint24 feeAB,
        uint24 feeBC,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        bytes memory path = abi.encodePacked(
            tokenA,
            feeAB,
            tokenB,
            feeBC,
            tokenC
        );

        amountOut = quoter.quoteExactInput(path, amountIn);
    }

    function printLiquidity(
        address token0,
        address token1,
        uint24 fee
    ) public view returns (uint128 poolLiquidity) {
        address factory = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
        address pool = IUniswapV3Factory(factory).getPool(token0, token1, fee);

        require(pool != address(0), "Pool does not exist");

        poolLiquidity = IUniswapV3Pool(pool).liquidity();

        console.log("Liquidity and address:", poolLiquidity, pool); // only visible with hardhat
    }

    function swapAtoBtoC(
        address tokenA,
        address tokenB,
        address tokenC,
        uint24 feeAB,
        uint24 feeBC,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient
    ) external onlyOwner {
        printLiquidity(tokenA, tokenB, feeAB);

        SafeERC20.forceApprove(IERC20(tokenA), address(swapRouter), amountIn);
        bytes memory path = abi.encodePacked(
            tokenA,
            feeAB,
            tokenB,
            feeBC,
            tokenC
        );

        ISwapRouter.ExactInputParams memory params = ISwapRouter
            .ExactInputParams({
                path: path,
                recipient: recipient,
                deadline: block.timestamp + 300,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin
            });

        swapRouter.exactInput(params);
    }

    function swapViaTwoCalls(
        address tokenA,
        address tokenB,
        address tokenC,
        uint24 feeAB,
        uint24 feeBC,
        uint256 amountIn,
        uint256 amountOutMinTotal,
        address recipient
    ) external onlyOwner {
        // Step 1: Swap tokenA → tokenB
        SafeERC20.forceApprove(IERC20(tokenA), address(swapRouter), amountIn);

        bytes memory pathAB = abi.encodePacked(tokenA, feeAB, tokenB);
        printLiquidity(tokenA, tokenB, feeAB);
        printLiquidity(tokenB, tokenC, feeBC);
        console.log("tokenA before:", IERC20(tokenA).balanceOf(address(this)));

        ISwapRouter.ExactInputParams memory paramsAB = ISwapRouter
            .ExactInputParams({
                path: pathAB,
                recipient: address(this), // keep in contract for second swap
                deadline: block.timestamp + 300,
                amountIn: amountIn,
                amountOutMinimum: 0 // accept any amount of tokenB
            });

        uint256 tokenBReceived = swapRouter.exactInput(paramsAB);

        console.log(
            "amountB after swap:",
            IERC20(tokenB).balanceOf(address(this))
        );
        // Step 2: Swap tokenB → tokenC
        SafeERC20.forceApprove(
            IERC20(tokenB),
            address(swapRouter),
            tokenBReceived
        );

        bytes memory pathBC = abi.encodePacked(tokenB, feeBC, tokenC);

        ISwapRouter.ExactInputParams memory paramsBC = ISwapRouter
            .ExactInputParams({
                path: pathBC,
                recipient: recipient,
                deadline: block.timestamp + 300,
                amountIn: tokenBReceived,
                amountOutMinimum: amountOutMinTotal // enforce final min output
            });

        swapRouter.exactInput(paramsBC);

        console.log(
            "amountA after swap:",
            IERC20(tokenA).balanceOf(address(this))
        );

        printLiquidity(tokenA, tokenB, feeAB);
        printLiquidity(tokenB, tokenC, feeBC);
    }

    function withdraw(address token, address to) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));

        SafeERC20.safeTransfer(IERC20(token), to, balance);
    }
}
