import { ethers } from "hardhat";
import { A_B_C } from "../typechain-types";
import dotenv from "dotenv";
import { expect } from "chai";
dotenv.config();

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

const RPC = process.env.MAINNET_RPC_URL || "";

const TOKENS = [
  { name: "USDT", address: USDT, whale: USDT_WHALE },
  { name: "USDC", address: USDC, whale: USDC_WHALE },
  { name: "DAI", address: DAI, whale: DAI_WHALE },
];

const MIDDLES = [
  { name: "WETH", address: WETH },
  { name: "WBTC", address: WBTC },
];

const FEES = [100, 500];
const INPUT_AMOUNT = 1000n * 10n ** 6n; // 1000 units with 6 decimals

describe("A_B_C multi-swap tests", function () {
  let contract: A_B_C;

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

  for (const tokenA of TOKENS) {
    for (const tokenC of TOKENS) {
      for (const middle of MIDDLES) {
        for (const feeAB of FEES) {
          for (const feeBC of FEES) {
            if (tokenA.address === tokenC.address && feeAB === feeBC) {
              continue;
            }
            const label = `${tokenA.name} → ${middle.name}(${feeAB}) → ${tokenC.name}(${feeBC})`;

            it(`should quote and swap ${label}, expect profit/loss`, async () => {
              const tokenContract = await ethers.getContractAt(
                "IERC20",
                tokenA.address
              );

              await ethers.provider.send("hardhat_impersonateAccount", [
                tokenA.whale,
              ]);
              await ethers.provider.send("hardhat_setBalance", [
                tokenA.whale,
                "0x1000000000000000000",
              ]);
              const whaleSigner = await ethers.getSigner(tokenA.whale);

              await tokenContract
                .connect(whaleSigner)
                .transfer(await contract.getAddress(), INPUT_AMOUNT);

              const quote = await contract.getQuoteAtoBtoC.staticCall(
                tokenA.address,
                middle.address,
                tokenC.address,
                feeAB,
                feeBC,
                INPUT_AMOUNT
              );

              console.log(
                `\n[${label}] Quote potential output: ${quote.toString()}`
              );

              const preBalance = await tokenContract.balanceOf(
                await contract.getAddress()
              );

              await contract.swapAtoBtoC(
                tokenA.address,
                middle.address,
                tokenC.address,
                feeAB,
                feeBC,
                INPUT_AMOUNT,
                quote, //0,
                await contract.getAddress()
              );

              const postBalance = await tokenContract.balanceOf(
                await contract.getAddress()
              );
              const actualOut = postBalance - preBalance + INPUT_AMOUNT;

              const pnl =
                (Number(actualOut - INPUT_AMOUNT) / Number(INPUT_AMOUNT)) * 100;

              console.log(`[${label}] Actual Output: ${actualOut.toString()}`);
              console.log(`[${label}] PnL: ${pnl.toFixed(2)}%`);
            });
          }
        }
      }
    }
  }

  for (const token of TOKENS) {
    it(`should withdraw entire balance of ${token.name}`, async () => {
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

      const whaleBalance = await tokenContract.balanceOf(whale.address);
      expect(whaleBalance).to.be.gt(0n);
      console.log(whaleBalance);

      // Transfer entire whale balance to contract
      await tokenContract
        .connect(whale)
        .transfer(contractAddress, whaleBalance);

      const contractTokenBalance = await tokenContract.balanceOf(
        contractAddress
      );

      console.log(contractTokenBalance);
      expect(contractTokenBalance).to.equal(whaleBalance);
      const recipientBefore = await tokenContract.balanceOf(contractAddress);
      console.log(await contract.owner(), whale.address);
      // Withdraw all tokens to recipient
      await contract.connect(whale).withdraw(token.address, whale.address);

      // const recipientAfter = await tokenContract.balanceOf(
      //   await whale.getAddress()
      // );
      // const contractAfter = await tokenContract.balanceOf(contractAddress);

      // expect(recipientAfter - recipientBefore).to.equal(contractTokenBalance);
      // expect(contractAfter).to.equal(0n);
    });
  }
});
