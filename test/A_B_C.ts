import { ethers } from "hardhat";
import { A_B_C } from "../typechain-types";
import dotenv from "dotenv";
import { expect } from "chai";
import JSBI from "jsbi";
dotenv.config();

export function normalizeAmount(
  rawAmount: JSBI,
  fromDecimals: number,
  toDecimals: number
): JSBI {
  if (fromDecimals === toDecimals) {
    return rawAmount;
  }

  const scaleFactor = Math.abs(toDecimals - fromDecimals);
  const multiplier = JSBI.exponentiate(
    JSBI.BigInt(10),
    JSBI.BigInt(scaleFactor)
  );

  return toDecimals > fromDecimals
    ? JSBI.multiply(rawAmount, multiplier)
    : JSBI.divide(rawAmount, multiplier);
}

const SCALING_FACTOR = JSBI.BigInt(1_000_000); // 6 decimal fixed point for profit/PnL

const MULTICALL_ADDRESS = "0x5ba1e12693dc8f9c48aad8770482f4739beed696";
const MULTICALL_ABI = [
  "function aggregate(tuple(address target, bytes callData)[] calls) external view returns (uint256 blockNumber, bytes[] returnData)",
];
const USDT = ethers.getAddress("0xdac17f958d2ee523a2206206994597c13d831ec7");
const USDC = ethers.getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
const DAI = ethers.getAddress("0x6b175474e89094c44da98b954eedeac495271d0f");
const WETH = ethers.getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
const WBTC = ethers.getAddress("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599");

const USDT_WHALE = ethers.getAddress(
  "0x5754284f345afc66a98fbb0a0afe71e0f007b949"
);
const USDC_WHALE = ethers.getAddress(
  "0x55fe002aeff02f77364de339a1292923a15844b8"
);
const DAI_WHALE = ethers.getAddress(
  "0x28c6c06298d514db089934071355e5743bf21d60"
);

const UNISWAP_V3_ROUTER = ethers.getAddress(
  "0xe592427a0aece92de3edee1f18e0157c05861564"
);
const UNISWAP_V3_QUOTER = ethers.getAddress(
  "0xb27308f9f90d607463bb33ea1bebb41c27ce5ab6"
);
const BINANCE_WALLET = ethers.getAddress(
  "0x28c6c06298d514db089934071355e5743bf21d60"
);
const FACTORY_ADDRESS = ethers.getAddress(
  "0x1f98431c8ad98523631ae4a59f267346ea31f984"
);
const IUniswapV3Factory = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
];

const RPC = process.env.MAINNET_RPC_URL || "";
type TokenInfo = {
  name: string;
  address: string;
  decimals: number;
  whale: string;
  usdPrice: number;
  initialAmount: JSBI;
};

const RAW_TOKENS: Omit<TokenInfo, "initialAmount">[] = [
  // {
  //   name: "USDT",
  //   address: ethers.getAddress("0xdac17f958d2ee523a2206206994597c13d831ec7"),
  //   whale: ethers.getAddress("0x5754284f345afc66a98fbb0a0afe71e0f007b949"),
  //   decimals: 6,
  //   usdPrice: 1,
  // },
  // {
  //   name: "USDC",
  //   address: ethers.getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
  //   whale: ethers.getAddress("0x55fe002aeff02f77364de339a1292923a15844b8"),
  //   decimals: 6,
  //   usdPrice: 1,
  // },
  // {
  //   name: "DAI",
  //   address: ethers.getAddress("0x6b175474e89094c44da98b954eedeac495271d0f"),
  //   whale: ethers.getAddress("0x28c6c06298d514db089934071355e5743bf21d60"),
  //   decimals: 18,
  //   usdPrice: 1,
  // },
  // {
  //   name: "WETH",
  //   address: ethers.getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  //   whale: BINANCE_WALLET,
  //   decimals: 18,
  //   usdPrice: 2623.34,
  // },
  // {
  //   name: "WBTC",
  //   address: ethers.getAddress("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"),
  //   whale: BINANCE_WALLET,
  //   decimals: 8,
  //   usdPrice: 108818,
  // },
  {
    name: "UNI",
    address: ethers.getAddress("0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"),
    whale: BINANCE_WALLET,
    decimals: 18,
    usdPrice: 7.73,
  },
  {
    name: "LINK",
    address: ethers.getAddress("0x514910771af9ca656af840dff83e8264ecf986ca"),
    whale: BINANCE_WALLET,
    decimals: 18,
    usdPrice: 14.15,
  },
  {
    name: "MKR",
    address: ethers.getAddress("0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2"),
    whale: BINANCE_WALLET,
    decimals: 18,
    usdPrice: 1920,
  },
  {
    name: "AAVE",
    address: ethers.getAddress("0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"),
    whale: BINANCE_WALLET,
    decimals: 18,
    usdPrice: 299,
  },
  {
    name: "LDO",
    address: ethers.getAddress("0x5a98fcbea516cf06857215779fd812ca3bef1b32"),
    whale: BINANCE_WALLET,
    decimals: 18,
    usdPrice: 0.724,
  },
];

const USD_TARGET = 10;

export const TOKENS: TokenInfo[] = RAW_TOKENS.map((t) => {
  const amountInToken = USD_TARGET / t.usdPrice;
  const amountStr = amountInToken.toFixed(t.decimals);
  const initialAmount = ethers.parseUnits(amountStr, t.decimals);

  return { ...t, initialAmount: JSBI.BigInt(initialAmount.toString()) };
});

const MIDDLES = TOKENS;

const FEES = [
  100, 500,

  3000, 10000,
];
const INPUT_AMOUNT = 100;
type Route = {
  tokenA: (typeof TOKENS)[0];
  middle: (typeof MIDDLES)[0];
  tokenC: (typeof TOKENS)[0];
  feeAB: number;
  feeBC: number;
  label: string;
};
const rawRoutes = [
  "USDT → USDC(100) → USDT(500)",
  "USDT → USDC(100) → USDT(3000)",
  "USDT → USDC(100) → USDT(10000)",
  "USDT → USDC(500) → USDT(100)",
  "USDT → USDC(500) → USDT(3000)",
  "USDT → USDC(500) → USDT(10000)",
  "USDT → USDC(3000) → USDT(100)",
  "USDT → USDC(3000) → USDT(500)",
  "USDT → USDC(3000) → USDT(10000)",
  "USDT → USDC(10000) → USDT(100)",
  "USDT → USDC(10000) → USDT(500)",
  "USDT → USDC(10000) → USDT(3000)",
  "USDT → DAI(100) → USDT(500)",
  "USDT → DAI(100) → USDT(3000)",
  "USDT → DAI(500) → USDT(100)",
  "USDT → DAI(500) → USDT(3000)",
  "USDT → DAI(3000) → USDT(100)",
  "USDT → DAI(3000) → USDT(500)",
  "USDT → WETH(100) → USDT(500)",
  "USDT → WETH(100) → USDT(3000)",
  "USDT → WETH(100) → USDT(10000)",
  "USDT → WETH(500) → USDT(100)",
  "USDT → WETH(500) → USDT(3000)",
  "USDT → WETH(500) → USDT(10000)",
  "USDT → WETH(3000) → USDT(100)",
  "USDT → WETH(3000) → USDT(500)",
  "USDT → WETH(3000) → USDT(10000)",
  "USDT → WETH(10000) → USDT(100)",
  "USDT → WETH(10000) → USDT(500)",
  "USDT → WETH(10000) → USDT(3000)",
  "USDT → WBTC(100) → USDT(500)",
  "USDT → WBTC(100) → USDT(3000)",
  "USDT → WBTC(100) → USDT(10000)",
  "USDT → WBTC(500) → USDT(100)",
  "USDT → WBTC(500) → USDT(3000)",
  "USDT → WBTC(500) → USDT(10000)",
  "USDT → WBTC(3000) → USDT(100)",
  "USDT → WBTC(3000) → USDT(500)",
  "USDT → WBTC(3000) → USDT(10000)",
  "USDT → WBTC(10000) → USDT(100)",
  "USDT → WBTC(10000) → USDT(500)",
  "USDT → WBTC(10000) → USDT(3000)",
  "USDT → UNI(500) → USDT(3000)",
  "USDT → UNI(500) → USDT(10000)",
  "USDT → UNI(3000) → USDT(500)",
  "USDT → UNI(3000) → USDT(10000)",
  "USDT → UNI(10000) → USDT(500)",
  "USDT → UNI(10000) → USDT(3000)",
  "USDT → LINK(500) → USDT(3000)",
  "USDT → LINK(500) → USDT(10000)",
  "USDT → LINK(3000) → USDT(500)",
  "USDT → LINK(3000) → USDT(10000)",
  "USDT → LINK(10000) → USDT(500)",
  "USDT → LINK(10000) → USDT(3000)",
  "USDT → MKR(500) → USDT(3000)",
  "USDT → MKR(500) → USDT(10000)",
  "USDT → MKR(3000) → USDT(500)",
  "USDT → MKR(3000) → USDT(10000)",
  "USDT → MKR(10000) → USDT(500)",
  "USDT → MKR(10000) → USDT(3000)",
  "USDT → LDO(500) → USDT(3000)",
  "USDT → LDO(500) → USDT(10000)",
  "USDT → LDO(3000) → USDT(500)",
  "USDT → LDO(3000) → USDT(10000)",
  "USDT → LDO(10000) → USDT(500)",
  "USDT → LDO(10000) → USDT(3000)",
  "USDC → USDT(100) → USDC(500)",
  "USDC → USDT(100) → USDC(3000)",
  "USDC → USDT(100) → USDC(10000)",
  "USDC → USDT(500) → USDC(100)",
  "USDC → USDT(500) → USDC(3000)",
  "USDC → USDT(500) → USDC(10000)",
  "USDC → USDT(3000) → USDC(100)",
  "USDC → USDT(3000) → USDC(500)",
  "USDC → USDT(3000) → USDC(10000)",
  "USDC → USDT(10000) → USDC(100)",
  "USDC → USDT(10000) → USDC(500)",
  "USDC → USDT(10000) → USDC(3000)",
  "USDC → DAI(100) → USDC(500)",
  "USDC → DAI(100) → USDC(3000)",
  "USDC → DAI(100) → USDC(10000)",
  "USDC → DAI(500) → USDC(100)",
  "USDC → DAI(500) → USDC(3000)",
  "USDC → DAI(500) → USDC(10000)",
  "USDC → DAI(3000) → USDC(100)",
  "USDC → DAI(3000) → USDC(500)",
  "USDC → DAI(3000) → USDC(10000)",
  "USDC → DAI(10000) → USDC(100)",
  "USDC → DAI(10000) → USDC(500)",
  "USDC → DAI(10000) → USDC(3000)",
  "USDC → WETH(100) → USDC(500)",
  "USDC → WETH(100) → USDC(3000)",
  "USDC → WETH(100) → USDC(10000)",
  "USDC → WETH(500) → USDC(100)",
  "USDC → WETH(500) → USDC(3000)",
  "USDC → WETH(500) → USDC(10000)",
  "USDC → WETH(3000) → USDC(100)",
  "USDC → WETH(3000) → USDC(500)",
  "USDC → WETH(3000) → USDC(10000)",
  "USDC → WETH(10000) → USDC(100)",
  "USDC → WETH(10000) → USDC(500)",
  "USDC → WETH(10000) → USDC(3000)",
  "USDC → WBTC(100) → USDC(500)",
  "USDC → WBTC(100) → USDC(3000)",
  "USDC → WBTC(100) → USDC(10000)",
  "USDC → WBTC(500) → USDC(100)",
  "USDC → WBTC(500) → USDC(3000)",
  "USDC → WBTC(500) → USDC(10000)",
  "USDC → WBTC(3000) → USDC(100)",
  "USDC → WBTC(3000) → USDC(500)",
  "USDC → WBTC(3000) → USDC(10000)",
  "USDC → WBTC(10000) → USDC(100)",
  "USDC → WBTC(10000) → USDC(500)",
  "USDC → WBTC(10000) → USDC(3000)",
  "USDC → UNI(100) → USDC(500)",
  "USDC → UNI(100) → USDC(3000)",
  "USDC → UNI(100) → USDC(10000)",
  "USDC → UNI(500) → USDC(100)",
  "USDC → UNI(500) → USDC(3000)",
  "USDC → UNI(500) → USDC(10000)",
  "USDC → UNI(3000) → USDC(100)",
  "USDC → UNI(3000) → USDC(500)",
  "USDC → UNI(3000) → USDC(10000)",
  "USDC → UNI(10000) → USDC(100)",
  "USDC → UNI(10000) → USDC(500)",
  "USDC → UNI(10000) → USDC(3000)",
  "USDC → LINK(500) → USDC(3000)",
  "USDC → LINK(500) → USDC(10000)",
  "USDC → LINK(3000) → USDC(500)",
  "USDC → LINK(3000) → USDC(10000)",
  "USDC → LINK(10000) → USDC(500)",
  "USDC → LINK(10000) → USDC(3000)",
  "USDC → MKR(500) → USDC(3000)",
  "USDC → MKR(500) → USDC(10000)",
  "USDC → MKR(3000) → USDC(500)",
  "USDC → MKR(3000) → USDC(10000)",
  "USDC → MKR(10000) → USDC(500)",
  "USDC → MKR(10000) → USDC(3000)",
  "USDC → AAVE(500) → USDC(3000)",
  "USDC → AAVE(500) → USDC(10000)",
  "USDC → AAVE(3000) → USDC(500)",
  "USDC → AAVE(3000) → USDC(10000)",
  "USDC → AAVE(10000) → USDC(500)",
  "USDC → AAVE(10000) → USDC(3000)",
  "USDC → LDO(3000) → USDC(10000)",
  "USDC → LDO(10000) → USDC(3000)",
  "DAI → USDT(100) → DAI(500)",
  "DAI → USDT(100) → DAI(3000)",
  "DAI → USDT(500) → DAI(100)",
  "DAI → USDT(500) → DAI(3000)",
  "DAI → USDT(3000) → DAI(100)",
  "DAI → USDT(3000) → DAI(500)",
  "DAI → USDC(100) → DAI(500)",
  "DAI → USDC(100) → DAI(3000)",
  "DAI → USDC(100) → DAI(10000)",
  "DAI → USDC(500) → DAI(100)",
  "DAI → USDC(500) → DAI(3000)",
  "DAI → USDC(500) → DAI(10000)",
  "DAI → USDC(3000) → DAI(100)",
  "DAI → USDC(3000) → DAI(500)",
  "DAI → USDC(3000) → DAI(10000)",
  "DAI → USDC(10000) → DAI(100)",
  "DAI → USDC(10000) → DAI(500)",
  "DAI → USDC(10000) → DAI(3000)",
  "DAI → WETH(100) → DAI(500)",
  "DAI → WETH(100) → DAI(3000)",
  "DAI → WETH(100) → DAI(10000)",
  "DAI → WETH(500) → DAI(100)",
  "DAI → WETH(500) → DAI(3000)",
  "DAI → WETH(500) → DAI(10000)",
  "DAI → WETH(3000) → DAI(100)",
  "DAI → WETH(3000) → DAI(500)",
  "DAI → WETH(3000) → DAI(10000)",
  "DAI → WETH(10000) → DAI(100)",
  "DAI → WETH(10000) → DAI(500)",
  "DAI → WETH(10000) → DAI(3000)",
  "DAI → WBTC(500) → DAI(3000)",
  "DAI → WBTC(500) → DAI(10000)",
  "DAI → WBTC(3000) → DAI(500)",
  "DAI → WBTC(3000) → DAI(10000)",
  "DAI → WBTC(10000) → DAI(500)",
  "DAI → WBTC(10000) → DAI(3000)",
  "DAI → UNI(500) → DAI(3000)",
  "DAI → UNI(500) → DAI(10000)",
  "DAI → UNI(3000) → DAI(500)",
  "DAI → UNI(3000) → DAI(10000)",
  "DAI → UNI(10000) → DAI(500)",
  "DAI → UNI(10000) → DAI(3000)",
  "DAI → LINK(500) → DAI(3000)",
  "DAI → LINK(3000) → DAI(500)",
  "DAI → MKR(3000) → DAI(10000)",
  "DAI → MKR(10000) → DAI(3000)",
  "WETH → USDT(100) → WETH(500)",
  "WETH → USDT(100) → WETH(3000)",
  "WETH → USDT(100) → WETH(10000)",
  "WETH → USDT(500) → WETH(100)",
  "WETH → USDT(500) → WETH(3000)",
  "WETH → USDT(500) → WETH(10000)",
  "WETH → USDT(3000) → WETH(100)",
  "WETH → USDT(3000) → WETH(500)",
  "WETH → USDT(3000) → WETH(10000)",
  "WETH → USDT(10000) → WETH(100)",
  "WETH → USDT(10000) → WETH(500)",
  "WETH → USDT(10000) → WETH(3000)",
  "WETH → USDC(100) → WETH(500)",
  "WETH → USDC(100) → WETH(3000)",
  "WETH → USDC(100) → WETH(10000)",
  "WETH → USDC(500) → WETH(100)",
  "WETH → USDC(500) → WETH(3000)",
  "WETH → USDC(500) → WETH(10000)",
  "WETH → USDC(3000) → WETH(100)",
  "WETH → USDC(3000) → WETH(500)",
  "WETH → USDC(3000) → WETH(10000)",
  "WETH → USDC(10000) → WETH(100)",
  "WETH → USDC(10000) → WETH(500)",
  "WETH → USDC(10000) → WETH(3000)",
  "WETH → DAI(100) → WETH(500)",
  "WETH → DAI(100) → WETH(3000)",
  "WETH → DAI(100) → WETH(10000)",
  "WETH → DAI(500) → WETH(100)",
  "WETH → DAI(500) → WETH(3000)",
  "WETH → DAI(500) → WETH(10000)",
  "WETH → DAI(3000) → WETH(100)",
  "WETH → DAI(3000) → WETH(500)",
  "WETH → DAI(3000) → WETH(10000)",
  "WETH → DAI(10000) → WETH(100)",
  "WETH → DAI(10000) → WETH(500)",
  "WETH → DAI(10000) → WETH(3000)",
  "WETH → WBTC(100) → WETH(500)",
  "WETH → WBTC(100) → WETH(3000)",
  "WETH → WBTC(100) → WETH(10000)",
  "WETH → WBTC(500) → WETH(100)",
  "WETH → WBTC(500) → WETH(3000)",
  "WETH → WBTC(500) → WETH(10000)",
  "WETH → WBTC(3000) → WETH(100)",
  "WETH → WBTC(3000) → WETH(500)",
  "WETH → WBTC(3000) → WETH(10000)",
  "WETH → WBTC(10000) → WETH(100)",
  "WETH → WBTC(10000) → WETH(500)",
  "WETH → WBTC(10000) → WETH(3000)",
  "WETH → UNI(500) → WETH(3000)",
  "WETH → UNI(500) → WETH(10000)",
  "WETH → UNI(3000) → WETH(500)",
  "WETH → UNI(3000) → WETH(10000)",
  "WETH → UNI(10000) → WETH(500)",
  "WETH → UNI(10000) → WETH(3000)",
  "WETH → LINK(100) → WETH(500)",
  "WETH → LINK(100) → WETH(3000)",
  "WETH → LINK(100) → WETH(10000)",
  "WETH → LINK(500) → WETH(100)",
  "WETH → LINK(500) → WETH(3000)",
  "WETH → LINK(500) → WETH(10000)",
  "WETH → LINK(3000) → WETH(100)",
  "WETH → LINK(3000) → WETH(500)",
  "WETH → LINK(3000) → WETH(10000)",
  "WETH → LINK(10000) → WETH(100)",
  "WETH → LINK(10000) → WETH(500)",
  "WETH → LINK(10000) → WETH(3000)",
  "WETH → MKR(500) → WETH(3000)",
  "WETH → MKR(500) → WETH(10000)",
  "WETH → MKR(3000) → WETH(500)",
  "WETH → MKR(3000) → WETH(10000)",
  "WETH → MKR(10000) → WETH(500)",
  "WETH → MKR(10000) → WETH(3000)",
  "WETH → AAVE(500) → WETH(3000)",
  "WETH → AAVE(500) → WETH(10000)",
  "WETH → AAVE(3000) → WETH(500)",
  "WETH → AAVE(3000) → WETH(10000)",
  "WETH → AAVE(10000) → WETH(500)",
  "WETH → AAVE(10000) → WETH(3000)",
  "WETH → LDO(100) → WETH(500)",
  "WETH → LDO(100) → WETH(3000)",
  "WETH → LDO(100) → WETH(10000)",
  "WETH → LDO(500) → WETH(100)",
  "WETH → LDO(500) → WETH(3000)",
  "WETH → LDO(500) → WETH(10000)",
  "WETH → LDO(3000) → WETH(100)",
  "WETH → LDO(3000) → WETH(500)",
  "WETH → LDO(3000) → WETH(10000)",
  "WETH → LDO(10000) → WETH(100)",
  "WETH → LDO(10000) → WETH(500)",
  "WETH → LDO(10000) → WETH(3000)",
  "WBTC → USDT(100) → WBTC(500)",
  "WBTC → USDT(100) → WBTC(3000)",
  "WBTC → USDT(100) → WBTC(10000)",
  "WBTC → USDT(500) → WBTC(100)",
  "WBTC → USDT(500) → WBTC(3000)",
  "WBTC → USDT(500) → WBTC(10000)",
  "WBTC → USDT(3000) → WBTC(100)",
  "WBTC → USDT(3000) → WBTC(500)",
  "WBTC → USDT(3000) → WBTC(10000)",
  "WBTC → USDT(10000) → WBTC(100)",
  "WBTC → USDT(10000) → WBTC(500)",
  "WBTC → USDT(10000) → WBTC(3000)",
  "WBTC → USDC(100) → WBTC(500)",
  "WBTC → USDC(100) → WBTC(3000)",
  "WBTC → USDC(100) → WBTC(10000)",
  "WBTC → USDC(500) → WBTC(100)",
  "WBTC → USDC(500) → WBTC(3000)",
  "WBTC → USDC(500) → WBTC(10000)",
  "WBTC → USDC(3000) → WBTC(100)",
  "WBTC → USDC(3000) → WBTC(500)",
  "WBTC → USDC(3000) → WBTC(10000)",
  "WBTC → USDC(10000) → WBTC(100)",
  "WBTC → USDC(10000) → WBTC(500)",
  "WBTC → USDC(10000) → WBTC(3000)",
  "WBTC → DAI(500) → WBTC(3000)",
  "WBTC → DAI(500) → WBTC(10000)",
  "WBTC → DAI(3000) → WBTC(500)",
  "WBTC → DAI(3000) → WBTC(10000)",
  "WBTC → DAI(10000) → WBTC(500)",
  "WBTC → DAI(10000) → WBTC(3000)",
  "WBTC → WETH(100) → WBTC(500)",
  "WBTC → WETH(100) → WBTC(3000)",
  "WBTC → WETH(100) → WBTC(10000)",
  "WBTC → WETH(500) → WBTC(100)",
  "WBTC → WETH(500) → WBTC(3000)",
  "WBTC → WETH(500) → WBTC(10000)",
  "WBTC → WETH(3000) → WBTC(100)",
  "WBTC → WETH(3000) → WBTC(500)",
  "WBTC → WETH(3000) → WBTC(10000)",
  "WBTC → WETH(10000) → WBTC(100)",
  "WBTC → WETH(10000) → WBTC(500)",
  "WBTC → WETH(10000) → WBTC(3000)",
  "WBTC → UNI(3000) → WBTC(10000)",
  "WBTC → UNI(10000) → WBTC(3000)",
  "WBTC → MKR(100) → WBTC(500)",
  "WBTC → MKR(100) → WBTC(3000)",
  "WBTC → MKR(100) → WBTC(10000)",
  "WBTC → MKR(500) → WBTC(100)",
  "WBTC → MKR(500) → WBTC(3000)",
  "WBTC → MKR(500) → WBTC(10000)",
  "WBTC → MKR(3000) → WBTC(100)",
  "WBTC → MKR(3000) → WBTC(500)",
  "WBTC → MKR(3000) → WBTC(10000)",
  "WBTC → MKR(10000) → WBTC(100)",
  "WBTC → MKR(10000) → WBTC(500)",
  "WBTC → MKR(10000) → WBTC(3000)",
  "UNI → USDT(500) → UNI(3000)",
  "UNI → USDT(500) → UNI(10000)",
  "UNI → USDT(3000) → UNI(500)",
  "UNI → USDT(3000) → UNI(10000)",
  "UNI → USDT(10000) → UNI(500)",
  "UNI → USDT(10000) → UNI(3000)",
  "UNI → USDC(100) → UNI(500)",
  "UNI → USDC(100) → UNI(3000)",
  "UNI → USDC(100) → UNI(10000)",
  "UNI → USDC(500) → UNI(100)",
  "UNI → USDC(500) → UNI(3000)",
  "UNI → USDC(500) → UNI(10000)",
  "UNI → USDC(3000) → UNI(100)",
  "UNI → USDC(3000) → UNI(500)",
  "UNI → USDC(3000) → UNI(10000)",
  "UNI → USDC(10000) → UNI(100)",
  "UNI → USDC(10000) → UNI(500)",
  "UNI → USDC(10000) → UNI(3000)",
  "UNI → DAI(500) → UNI(3000)",
  "UNI → DAI(500) → UNI(10000)",
  "UNI → DAI(3000) → UNI(500)",
  "UNI → DAI(3000) → UNI(10000)",
  "UNI → DAI(10000) → UNI(500)",
  "UNI → DAI(10000) → UNI(3000)",
  "UNI → WETH(500) → UNI(3000)",
  "UNI → WETH(500) → UNI(10000)",
  "UNI → WETH(3000) → UNI(500)",
  "UNI → WETH(3000) → UNI(10000)",
  "UNI → WETH(10000) → UNI(500)",
  "UNI → WETH(10000) → UNI(3000)",
  "UNI → WBTC(3000) → UNI(10000)",
  "UNI → WBTC(10000) → UNI(3000)",
  "UNI → LINK(3000) → UNI(10000)",
  "UNI → LINK(10000) → UNI(3000)",
  "UNI → AAVE(500) → UNI(3000)",
  "UNI → AAVE(500) → UNI(10000)",
  "UNI → AAVE(3000) → UNI(500)",
  "UNI → AAVE(3000) → UNI(10000)",
  "UNI → AAVE(10000) → UNI(500)",
  "UNI → AAVE(10000) → UNI(3000)",
  "LINK → USDT(500) → LINK(3000)",
  "LINK → USDT(500) → LINK(10000)",
  "LINK → USDT(3000) → LINK(500)",
  "LINK → USDT(3000) → LINK(10000)",
  "LINK → USDT(10000) → LINK(500)",
  "LINK → USDT(10000) → LINK(3000)",
  "LINK → USDC(500) → LINK(3000)",
  "LINK → USDC(500) → LINK(10000)",
  "LINK → USDC(3000) → LINK(500)",
  "LINK → USDC(3000) → LINK(10000)",
  "LINK → USDC(10000) → LINK(500)",
  "LINK → USDC(10000) → LINK(3000)",
  "LINK → DAI(500) → LINK(3000)",
  "LINK → DAI(3000) → LINK(500)",
  "LINK → WETH(100) → LINK(500)",
  "LINK → WETH(100) → LINK(3000)",
  "LINK → WETH(100) → LINK(10000)",
  "LINK → WETH(500) → LINK(100)",
  "LINK → WETH(500) → LINK(3000)",
  "LINK → WETH(500) → LINK(10000)",
  "LINK → WETH(3000) → LINK(100)",
  "LINK → WETH(3000) → LINK(500)",
  "LINK → WETH(3000) → LINK(10000)",
  "LINK → WETH(10000) → LINK(100)",
  "LINK → WETH(10000) → LINK(500)",
  "LINK → WETH(10000) → LINK(3000)",
  "LINK → UNI(3000) → LINK(10000)",
  "LINK → UNI(10000) → LINK(3000)",
  "LINK → AAVE(500) → LINK(3000)",
  "LINK → AAVE(3000) → LINK(500)",
  "MKR → USDT(500) → MKR(3000)",
  "MKR → USDT(500) → MKR(10000)",
  "MKR → USDT(3000) → MKR(500)",
  "MKR → USDT(3000) → MKR(10000)",
  "MKR → USDT(10000) → MKR(500)",
  "MKR → USDT(10000) → MKR(3000)",
  "MKR → USDC(500) → MKR(3000)",
  "MKR → USDC(500) → MKR(10000)",
  "MKR → USDC(3000) → MKR(500)",
  "MKR → USDC(3000) → MKR(10000)",
  "MKR → USDC(10000) → MKR(500)",
  "MKR → USDC(10000) → MKR(3000)",
  "MKR → DAI(3000) → MKR(10000)",
  "MKR → DAI(10000) → MKR(3000)",
  "MKR → WETH(500) → MKR(3000)",
  "MKR → WETH(500) → MKR(10000)",
  "MKR → WETH(3000) → MKR(500)",
  "MKR → WETH(3000) → MKR(10000)",
  "MKR → WETH(10000) → MKR(500)",
  "MKR → WETH(10000) → MKR(3000)",
  "MKR → WBTC(100) → MKR(500)",
  "MKR → WBTC(100) → MKR(3000)",
  "MKR → WBTC(100) → MKR(10000)",
  "MKR → WBTC(500) → MKR(100)",
  "MKR → WBTC(500) → MKR(3000)",
  "MKR → WBTC(500) → MKR(10000)",
  "MKR → WBTC(3000) → MKR(100)",
  "MKR → WBTC(3000) → MKR(500)",
  "MKR → WBTC(3000) → MKR(10000)",
  "MKR → WBTC(10000) → MKR(100)",
  "MKR → WBTC(10000) → MKR(500)",
  "MKR → WBTC(10000) → MKR(3000)",
  "AAVE → USDC(500) → AAVE(3000)",
  "AAVE → USDC(500) → AAVE(10000)",
  "AAVE → USDC(3000) → AAVE(500)",
  "AAVE → USDC(3000) → AAVE(10000)",
  "AAVE → USDC(10000) → AAVE(500)",
  "AAVE → USDC(10000) → AAVE(3000)",
  "AAVE → WETH(500) → AAVE(3000)",
  "AAVE → WETH(500) → AAVE(10000)",
  "AAVE → WETH(3000) → AAVE(500)",
  "AAVE → WETH(3000) → AAVE(10000)",
  "AAVE → WETH(10000) → AAVE(500)",
  "AAVE → WETH(10000) → AAVE(3000)",
  "AAVE → UNI(500) → AAVE(3000)",
  "AAVE → UNI(500) → AAVE(10000)",
  "AAVE → UNI(3000) → AAVE(500)",
  "AAVE → UNI(3000) → AAVE(10000)",
  "AAVE → UNI(10000) → AAVE(500)",
  "AAVE → UNI(10000) → AAVE(3000)",
  "AAVE → LINK(500) → AAVE(3000)",
  "AAVE → LINK(3000) → AAVE(500)",
  "LDO → USDT(500) → LDO(3000)",
  "LDO → USDT(500) → LDO(10000)",
  "LDO → USDT(3000) → LDO(500)",
  "LDO → USDT(3000) → LDO(10000)",
  "LDO → USDT(10000) → LDO(500)",
  "LDO → USDT(10000) → LDO(3000)",
  "LDO → USDC(3000) → LDO(10000)",
  "LDO → USDC(10000) → LDO(3000)",
  "LDO → WETH(100) → LDO(500)",
  "LDO → WETH(100) → LDO(3000)",
  "LDO → WETH(100) → LDO(10000)",
  "LDO → WETH(500) → LDO(100)",
  "LDO → WETH(500) → LDO(3000)",
  "LDO → WETH(500) → LDO(10000)",
  "LDO → WETH(3000) → LDO(100)",
  "LDO → WETH(3000) → LDO(500)",
  "LDO → WETH(3000) → LDO(10000)",
  "LDO → WETH(10000) → LDO(100)",
  "LDO → WETH(10000) → LDO(500)",
  "LDO → WETH(10000) → LDO(3000)",
];

const routes: Route[] = rawRoutes
  .map((label) => {
    const m = label.match(/^(\w+)\s+→\s+(\w+)\((\d+)\)\s+→\s+(\w+)\((\d+)\)$/);
    if (!m) throw new Error(`Bad route format: ${label}`);
    const [, A, B, feeAB, C, feeBC] = m;

    const tokenA = TOKENS.find((t) => t.name === A);
    const tokenC = TOKENS.find((t) => t.name === C);
    // allow middle to come from either list if you also want USDC/DAI as mids:
    const middle =
      MIDDLES.find((m) => m.name === B) || TOKENS.find((t) => t.name === B);

    if (!tokenA || !middle || !tokenC) {
      return null as unknown as Route; // skip invalid routes
    }

    return {
      tokenA,
      middle,
      tokenC,
      feeAB: Number(feeAB),
      feeBC: Number(feeBC),
      label,
    };
  })
  .filter((item) => Boolean(item));

describe("A_B_C multi-swap tests", function () {
  let contract: A_B_C;
  before(async () => {
    // deploy contract once
    const ContractFactory = await ethers.getContractFactory("A_B_C");
    contract = await ContractFactory.deploy(
      ethers.getAddress(UNISWAP_V3_ROUTER),
      ethers.getAddress(UNISWAP_V3_QUOTER)
    );
    await contract.waitForDeployment();

    // get Uniswap V3 factory
    const factory = await ethers.getContractAt(
      IUniswapV3Factory,
      FACTORY_ADDRESS
    );

    // // build valid (A→B→C) routes
    // for (const tokenA of TOKENS) {
    //   for (const tokenC of TOKENS) {
    //     for (const middle of MIDDLES) {
    //       if (tokenA.address !== tokenC.address) continue;
    //       if (tokenA.address === middle.address) continue;
    //       if (tokenC.address === middle.address) continue;

    //       for (const feeAB of FEES) {
    //         // only proceed if A→B pool exists
    //         const poolAB = await factory.getPool(
    //           tokenA.address,
    //           middle.address,
    //           feeAB
    //         );
    //         if (poolAB === ethers.ZeroAddress) continue;

    //         for (const feeBC of FEES) {
    //           // skip identical A→C direct
    //           if (tokenA.address === tokenC.address && feeAB === feeBC)
    //             continue;
    //           // only proceed if B→C pool exists
    //           const poolBC = await factory.getPool(
    //             middle.address,
    //             tokenC.address,
    //             feeBC
    //           );
    //           if (poolBC === ethers.ZeroAddress) continue;

    //           // valid route!
    //           const label = `${tokenA.name} → ${middle.name}(${feeAB}) → ${tokenC.name}(${feeBC})`;
    //           console.log(`Adding route: ${label}`);
    //           routes.push({ tokenA, middle, tokenC, feeAB, feeBC, label });
    //         }
    //       }
    //     }
    //   }
    // }
  });
  beforeEach(async () => {
    await ethers.provider.send("hardhat_reset", [
      { forking: { jsonRpcUrl: RPC } },
    ]);

    const ContractFactory = await ethers.getContractFactory("A_B_C");
    contract = await ContractFactory.deploy(
      UNISWAP_V3_ROUTER,
      UNISWAP_V3_QUOTER
    );
    await contract.waitForDeployment();
  });

  describe("the tests", () => {
    for (const { tokenA, middle, tokenC, feeAB, feeBC, label } of routes) {
      it(`should quote and swap ${label}`, async function () {
        // 1) pool existence guard
        const factory = await ethers.getContractAt(
          IUniswapV3Factory,
          FACTORY_ADDRESS
        );
        const poolAB = await factory.getPool(
          tokenA.address,
          middle.address,
          feeAB
        );
        if (poolAB === ethers.ZeroAddress) {
          console.log(`[${label}] no pool AB, skipping`);
          return expect.fail("No pool AB found");
        }
        const poolBC = await factory.getPool(
          middle.address,
          tokenC.address,
          feeBC
        );
        if (poolBC === ethers.ZeroAddress) {
          console.log(`[${label}] no pool BC, skipping`);
          return expect.fail("No pool BC found");
        }
        const tokenAContract = await ethers.getContractAt(
          "IERC20",
          tokenA.address
        );
        const tokenCContract = await ethers.getContractAt(
          "IERC20",
          tokenC.address
        );

        await ethers.provider.send("hardhat_impersonateAccount", [
          tokenA.whale,
        ]);
        await ethers.provider.send("hardhat_setBalance", [
          tokenA.whale,
          "0x1000000000000000000",
        ]);
        const whaleSigner = await ethers.getSigner(tokenA.whale);

        await tokenAContract
          .connect(whaleSigner)
          .transfer(
            await contract.getAddress(),
            tokenA.initialAmount.toString()
          );

        const quote = await contract.getQuoteAtoBtoC.staticCall(
          tokenA.address,
          middle.address,
          tokenC.address,
          feeAB,
          feeBC,
          INPUT_AMOUNT
        );
        const preBalanceOfTokenA = await tokenAContract.balanceOf(
          await contract.getAddress()
        );
        await contract.swapAtoBtoC(
          tokenA.address,
          middle.address,
          tokenC.address,
          feeAB,
          feeBC,
          INPUT_AMOUNT,
          quote,
          await contract.getAddress()
        );

        const postBalanceOfTokenC = await tokenCContract.balanceOf(
          await contract.getAddress()
        );
        const inputAmount = JSBI.BigInt(preBalanceOfTokenA.toString());
        const outputAmount = JSBI.BigInt(postBalanceOfTokenC.toString());
        const inputNormalized = inputAmount;
        // normalizeAmount(
        //   inputAmount,
        //   tokenA.decimals,
        //   6
        // );
        const outputNormalized = outputAmount;
        //  normalizeAmount(
        //   outputAmount,
        //   tokenC.decimals,
        //   6
        // );
        const SCALE = JSBI.BigInt(100); // 2 decimal places: 100.00%
        const percents = JSBI.divide(
          JSBI.multiply(outputNormalized, SCALE),
          inputNormalized
        );
        const profitInPercents = JSBI.subtract(percents, JSBI.BigInt(100));

        // Logs
        console.log(`[${label}] Input: ${inputNormalized.toString()}`);
        console.log(`[${label}] OUTPUT: ${outputNormalized.toString()}`);
        console.log(`[${label}] profit: ${profitInPercents.toString()} %`);
      });
    }
  });

  for (const token of TOKENS) {
    it.skip(`should withdraw entire balance of ${token.name}`, async () => {
      await ethers.provider.send("hardhat_impersonateAccount", [token.whale]);
      await ethers.provider.send("hardhat_setBalance", [
        token.whale,
        "0x1000000000000000000", // 1 ETH
      ]);
      const whale = await ethers.getSigner(token.whale);

      const tokenContract = await ethers.getContractAt("IERC20", token.address);

      const ContractFactory = await ethers.getContractFactory("A_B_C", whale);

      contract = await ContractFactory.deploy(
        UNISWAP_V3_ROUTER,
        UNISWAP_V3_QUOTER
      );
      await contract.waitForDeployment();

      const contractAddress = await contract.getAddress();

      const whaleBalanceBefore = await tokenContract.balanceOf(whale.address);

      expect(whaleBalanceBefore).to.be.gt(0n);

      await tokenContract
        .connect(whale)
        .transfer(contractAddress, whaleBalanceBefore);

      expect(await tokenContract.balanceOf(whale.address)).to.be.eq(0n);

      const contractBalanceAfterTransfer = await tokenContract.balanceOf(
        contractAddress
      );

      expect(contractBalanceAfterTransfer).to.be.eq(whaleBalanceBefore);

      await contract.connect(whale).withdraw(token.address, whale.address);

      const whaleBalanceAfter = await tokenContract.balanceOf(
        await whale.getAddress()
      );

      expect(whaleBalanceAfter).to.be.eq(whaleBalanceBefore);

      const contractBalanceAfter = await tokenContract.balanceOf(
        contractAddress
      );

      expect(contractBalanceAfter).to.equal(0n);
    });
  }

  it.skip("should multicall getQuoteAtoBtoC and log results", async () => {
    const multicall = new ethers.Contract(
      MULTICALL_ADDRESS,
      MULTICALL_ABI,
      ethers.provider
    );

    const calls: { target: string; callData: string }[] = [];

    for (const tokenA of TOKENS) {
      for (const tokenC of TOKENS) {
        for (const middle of MIDDLES) {
          for (const feeAB of FEES) {
            for (const feeBC of FEES) {
              if (tokenA.address === tokenC.address && feeAB === feeBC) {
                continue;
              }

              const callData = contract.interface.encodeFunctionData(
                "getQuoteAtoBtoC",
                [
                  tokenA.address,
                  middle.address,
                  tokenC.address,
                  feeAB,
                  feeBC,
                  INPUT_AMOUNT,
                ]
              );

              calls.push({
                target: await contract.getAddress(),
                callData,
              });
            }
          }
        }
      }
    }

    const [, results] = await multicall.aggregate(calls);

    let i = 0;
    for (const tokenA of TOKENS) {
      for (const tokenC of TOKENS) {
        for (const middle of MIDDLES) {
          for (const feeAB of FEES) {
            for (const feeBC of FEES) {
              if (tokenA.address === tokenC.address && feeAB === feeBC) {
                continue;
              }

              const label = `${tokenA.name} → ${middle.name}(${feeAB}) → ${tokenC.name}(${feeBC})`;
              const [quote] = contract.interface.decodeFunctionResult(
                "getQuoteAtoBtoC",
                results[i]
              );

              const diff = quote - INPUT_AMOUNT;
              const percent = (Number(diff) / Number(INPUT_AMOUNT)) * 100;
              console.log(
                `[${label}] Quote: ${quote} | PnL: ${percent.toFixed(2)}%`
              );
              i++;
            }
          }
        }
      }
    }

    expect(results.length).to.be.greaterThan(0);
  });
});
