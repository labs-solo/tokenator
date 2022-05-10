import { ethers, network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

import { getCurrentConfig } from "../src/deployConfigs";

const func: DeployFunction = async function ({
  getNamedAccounts,
  deployments,
}) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(deployer);

  const config = await getCurrentConfig();

  console.log(config);

  await deploy("AllySwap", {
    from: deployer,
    args: [
      config.oneUNI,
      config.ally,
      config.swapRate,
    ],
    log: true,
  });
};

func.tags = ["kovan"];
//func.tags = ["ethereum"];

export default func;
