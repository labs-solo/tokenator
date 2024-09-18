import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JUGModule = buildModule("JUGModule", (m) => {
  const jug = m.contract("Tokenator", [
    m.getParameter("name"), 
    m.getParameter("symbol"), 
    m.getParameter("totalSupply"), 
    m.getParameter("underlyingToken"), 
    m.getParameter("commencement"), 
    m.getParameter("durationDays"), 
  ]);

  return { jug };
});

export default JUGModule;
