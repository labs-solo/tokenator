import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SIPModule = buildModule("SIPModule", (m) => {
  const sip = m.contract("LiquidityToken", [
    m.getParameter("name"), 
    m.getParameter("symbol"), 
    m.getParameter("totalSupply"), 
  ]);

  return { sip };
});

export default SIPModule;