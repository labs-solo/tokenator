const { network } = require("hardhat");

export const configs: any = {
  // mainnet
  1: {
    ichi: "0x111111517e4929D3dcbdfa7CCe55d30d4B6BC4d6",
    commencement: "1652382000", // Thursday, May 12, 2022 3:00:00 PM EST
  },
  // kovan
  42: {
    ichi: "0xdF2661E2E6A35B482E3F105bDE628B5e1F68aB41",
    commencement: "1651244400", // Friday, April 29, 2022 5:00:00 AM EST
  },
};

export const getCurrentConfig = () => configs[network.config.chainId];
