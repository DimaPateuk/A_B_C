# A_B_C – Uniswap V3 Multi-hop Swap Contract

## Overview

`A_B_C` is a Solidity smart contract that executes a multi-hop token swap using [Uniswap V3](https://docs.uniswap.org/). The swap performs two hops:  
**TokenA → TokenB (middle) → TokenC**, using configurable fee tiers for each hop.

This project includes:
- Solidity smart contract (`A_B_C.sol`) with owner-only swap execution
- Forked mainnet testing via Hardhat
- Automated multi-token swap test suite with real token whales

---

## Features

- ✅ Multi-hop Uniswap V3 swaps via encoded `path`
- ✅ Quoting output via Uniswap V3 `Quoter`
- ✅ Safe ERC20 interaction with `SafeERC20`
- ✅ Support for tokens with non-standard approvals (e.g., USDT)
- ✅ Owner-only swap restrictions
- ✅ Forked tests with impersonated whales for USDT, USDC, and DAI

---