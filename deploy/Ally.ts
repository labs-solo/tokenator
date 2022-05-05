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

  await deploy("Ally", {
    from: deployer,
    args: [
      config.ichi,
      config.commencement,
      1095,
    ],
    log: true,
  });
};

//func.tags = ["kovan"];
func.tags = ["ethereum"];

export default func;
