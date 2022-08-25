import { smock } from "@defi-wonderland/smock";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai, { expect } from "chai";
import { formatUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { OracleChainLink, OracleChainLink__factory } from "../typechain-types";

chai.should();
chai.use(smock.matchers);

const ETH_USD_DATA_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const BTC_USD_DATA_FEED = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c";
const WBTC_ADDRESS = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";

const USDC_USD_DATA_FEED = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe("CrossChainLending tests", () => {
  let oracleChainLink: OracleChainLink;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let account1: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer, account1] = accounts;

    const oracleChainLinkFactory = new OracleChainLink__factory(deployer);
    oracleChainLink = await oracleChainLinkFactory.deploy();

    await oracleChainLink.setAggregator(WETH_ADDRESS, ETH_USD_DATA_FEED);
    await oracleChainLink.setAggregator(WBTC_ADDRESS, BTC_USD_DATA_FEED);
    await oracleChainLink.setAggregator(USDC_ADDRESS, USDC_USD_DATA_FEED);
  });

  describe("ChainLinkOracle", () => {
    it("Should estimate right quote", async () => {
      // ETH  2929.75270932;
      // BTC 39699.93878572;
      // USDC 1.0
      let ret = await oracleChainLink.quote(WETH_ADDRESS, parseUnits("13.55377"), WBTC_ADDRESS);
      await expect(formatUnits(ret, 8)).to.be.eq("1.00023313");

      ret = await oracleChainLink.quote(WETH_ADDRESS, parseUnits("1"), USDC_ADDRESS);
      await expect(formatUnits(ret, 6)).to.be.eq("2929.752709");

      ret = await oracleChainLink.quote(USDC_ADDRESS, parseUnits("2929.75270932"), WETH_ADDRESS);
      await expect(formatUnits(ret, 18)).to.be.eq("1.0");

      ret = await oracleChainLink.quote(USDC_ADDRESS, parseUnits("2929.75270932").div(2), WETH_ADDRESS);
      await expect(formatUnits(ret, 18)).to.be.eq("0.5");
    });
  });
});
