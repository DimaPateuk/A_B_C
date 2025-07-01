// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

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

interface ISwapRouter {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInput(
        ExactInputParams calldata params
    ) external payable returns (uint256 amountOut);
}

interface IQuoter {
    function quoteExactInput(
        bytes calldata path,
        uint256 amountIn
    ) external returns (uint256 amountOut);
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

    function withdraw(address token, address to) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));

        SafeERC20.safeTransfer(IERC20(token), to, balance);
    }
}
