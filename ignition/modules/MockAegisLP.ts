import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockAegisLPModule = buildModule("MockAegisLPModule", (m) => {
  const mockAegisLP = m.contract("MockERC20", [
    m.getParameter("name"), 
    m.getParameter("symbol"), 
    m.getParameter("totalSupply"), 
  ]);

  return { mockAegisLP };
});

export default MockAegisLPModule;