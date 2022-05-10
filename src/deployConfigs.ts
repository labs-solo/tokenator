const { network } = require("hardhat");

export const configs: any = {
  // mainnet
  1: {
    ichi: "0x111111517e4929D3dcbdfa7CCe55d30d4B6BC4d6",
    commencement: "1652382000", // Thursday, May 12, 2022 3:00:00 PM EST
    ally: "0x1aa1e61369874bae3444A8Ef6528d6b13D6952EF",
    oneUNI: "0x8290D7a64F25e6b5002d98367E8367c1b532b534",
    oneBTC: "0xEc4325F0518584F0774b483c215F65474EAbD27F",
    oneDODO: "0xcA37530E7c5968627BE470081d1C993eb1dEaf90",
    swapRate: "7224912240000000000",
  },
  // kovan
  42: {
    ichi: "0xdF2661E2E6A35B482E3F105bDE628B5e1F68aB41",
    commencement: "1651244400", // Friday, April 29, 2022 5:00:00 AM EST
    ally: "0xF9B53ea31bdC6364C1BFD84a53aA8235ee6bDf2F",
    oneUNI: "0x4238C45783551be0D848BbAdA853cCa6b265322f",
    oneBTC: "",
    oneDODO: "",
    swapRate: "7224912240000000000",
  },
};

export const getCurrentConfig = () => configs[network.config.chainId];
