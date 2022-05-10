// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract AllySwap is Ownable {

    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    uint256 private constant PRECISION = 1e18;

    // oneToken this contract accepts for swaps
    address public immutable oneToken;

    // Ally token
    address public immutable allyToken;

    // swap rate between oneToken and Ally token
    uint256 public swapRate;

    // List of all addresses with approved terms and conditions.
    mapping (address => bool) public approvedTerms;

    string constant public termsAndConditions = "ALLY TOKENS TERMS AND CONDITIONS. CAREFULLY READ ALL OF THE TERMS OF THIS AGREEMENT BEFORE CLICKING THE 'I AGREE' BUTTON. BY CLICKING THE 'I AGREE' BUTTON AND/OR CLAIMING ALLY TOKENS (AS DEFINED BELOW), YOU ACKNOWLEDGE YOUR CONSENT AND AGREEMENT TO ALL THE TERMS AND CONDITIONS SET FORTH IN THIS AGREEMENT. IF YOU DO NOT AGREE TO ALL THE TERMS OF THIS AGREEMENT, DO NOT CLICK 'I AGREE' AND DO NOT CLAIM ALLY TOKENS. IF YOU HAVE ANY QUESTIONS REGARDING THE EFFECT OF THE TERMS AND CONDITIONS IN THIS AGREEMENT, YOU ARE ADVISED TO CONSULT INDEPENDENT LEGAL COUNSEL. NOTE THAT SECTION 3 OF THIS AGREEMENT CONTAINS A RELEASE OF CLAIMS AND LIABILITY. IF YOU DO NOT AGREE TO THE TERMS OF SUCH RELEASE OF CLAIMS AND LIABILITY, DO NOT CLICK 'I AGREE' AND DO NOT CLAIM ALLY TOKENS. This Ally Tokens Terms and Conditions (the 'Agreement') is made between you ('You'), and ICHI Foundation, an exempted foundation company limited by guarantee formed under the laws of the Cayman Islands (the 'Company'). You and The Company are sometimes referred to herein individual as a Party and collectively as the Parties. This Agreement is effective as of the earliest date You either (a) agree to the terms of this Agreement by clicking 'I Agree', or (b) claim the Ally Tokens ('Effective Date'). 1. Eligibility. 1.1. The Company reserves the right, in its sole and absolute discretion, to determine whether you are eligible to receive Ally Tokens (the 'Ally Tokens') and how many Ally Tokens you are eligible to receive, and such determination may be made prior to or following the Effective Date. 1.2. If you do not agree to this Agreement, or if you later dispute the validity or enforceability of any provision hereof, you will not be eligible to receive any Ally Tokens and you will be required to return to the Company any Tokens (as defined below) you received pursuant to this Agreement. 1.3. In the event the Company deems you are not eligible to receive any Ally Tokens, the Company may, but shall not have any obligations to, inform you of such ineligibility, and you shall not be entitled to any Ally Tokens or any other sort of remuneration. 2. Ally Tokens. 2.1. In the event the Company determines You are eligible to receive Ally Tokens, the Company will make the correct number of Ally Tokens available to you pursuant to the procedures set forth by the Company, in its sole and absolute discretion. 2.2. The Ally Tokens may be redeemed for a certain number of ICHI tokens (the 'ICHI Tokens,' and together with the Ally Tokens, the 'Tokens'); provided, however, the Company shall determine, in its sole and absolute discretion, how many ICHI Tokens your Ally Tokens are eligible to receive upon such redemption; provided, further, that the number of ICHI Tokens received upon redemption may vary based on the length of time the Ally Tokens are held prior to redemption. 2.3. You will be required to pay any fees, including gas fees or equivalent, required to claim the Tokens. 2.4. The Company's dealings with You and others who may receive Tokens need not be uniform, and, without limiting the foregoing, the Company shall be entitled to, among other things, enter into agreements with such other persons on terms different than those set forth herein. 3. Release. 3.1. General Release. You hereby release, cancel, and forever discharge the Company, DMA Labs, Inc. ('DMA Labs') and their respective directors, officers, employees, subsidiaries, lawyers, affiliates, agents, and representatives (collectively, the 'Released Parties'), from any and all claims, complaints, causes of action, demands, damages, obligations, liabilities, losses, promises, agreements, controversies, penalties, expenses, and executions of any kind or nature whatsoever, whether known or unknown, actual or potential, whether arising in law or in equity, which You may have, may have had, or may in the future obtain, arising out of or relating out of the acts, omissions, agreements, or events relating in any manner to the Company or DMA Labs, including, but not limited to, the ICHI protocol, ICHI Tokens, oneTokens and Rari Fuse Pool #136 (the 'Release'). You represent and warrant that that you have not filed any action or initiated any other proceeding with any court or government authority against or involving the Released Parties that may constitute a claim or provide the basis for any liability that is excluded from the Release provide for in this Section 3. 3.2. Effect. The Release is intended to be a general release in the broadest form. You understand and agree that You hereby expressly waive any and all laws and statutes, of all jurisdictions whatsoever, which may provide that a general release does not extend to claims not known or suspected to exist at the time of executing a release which if known would have materially affected the decision to give said release. It is expressly intended and agreed that this Release does, in fact, extend to such unknown and unsuspected claims related to anything which has happened to the Effective Date which is covered by this Release, even if knowledge thereof would have materially affected the decision to give this Release. In addition, the Parties warrant and represent to the other that the execution and delivery of this Release does not, and with the passage of time will not, violate any obligation of the Party to any third party. Each Party further represents and warrants that it has not assigned any of its rights with respect to any of the matters covered by the Release. 3.3. Third Party Beneficiaries. You acknowledge and agree that each of the Released Parties is an intended third-party beneficiary of this Agreement, and that each of the Released Parties is entitled to enforce the terms hereof as if such Released Party was an original party hereto. 3.4. No Admission. You agree and acknowledge that the Release represents the settlement and compromise of any potential claims against the Released Parties, and that by entering into this Agreement none of the Released Parties admits to or acknowledges the existence of any liability, obligation, or wrongdoing on its part. The Company expressly denies any and all liability with respect to any of the matters covered by the Release. 3.5. Waiver of Unknown Claims. You expressly waive and relinquish any and all rights or benefits afforded by California Civil Code 1542, which provides as follows: A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected their settlement with the debtor or released party. For purposes of Section 1542, 'creditor' refers to You and 'debtor' refers to the Released Parties. In connection with such waiver and relinquishment, You acknowledge that You are aware that You may later discover facts in addition to or different from those which You currently know or believe to be true with respect to the subject matter of this Agreement, but that it is nevertheless your intention hereby to fully, finally and forever settle and release all of these matters which now exist, or previously existed, whether known or unknown, suspected or unsuspected. In furtherance of such intent, the releases given herein shall be and shall remain in effect as a full and complete release, notwithstanding the discovery or existence of such additional or different facts 4. Certain Representations, Acknowledgements and Agreements of You. You understand, acknowledge and agree as follows: 4.1. By clicking 'I Agree' and / or claiming Ally Tokens, You agree that You have read, understood and accept all of the terms and conditions contained in this Agreement. You also represent that You have the legal authority to accept this Agreement on behalf of yourself and any party You represent in connection with the matters covered by the Release. If You are an individual who is entering into this Agreement on behalf of an entity, You represent and warrant that You have the power to bind that entity, and You hereby agree on that entity's behalf to be bound by this Agreement, with the terms 'You', and 'Your' applying to You and that entity. 4.2. You are fully aware of the risks associated with owning and using digital assets, including, but not limited to, the Tokens, including the inherent risk of the potential for Tokens, and/or the private keys to wallets holding the Tokens, to be lost, stolen, or hacked. By acquiring Tokens, You expressly acknowledge and assume these risks. 4.3. You have sufficient understanding of technical matters relating to the Tokens, cryptocurrency storage mechanisms (such as digital asset wallets), and blockchain technology, to understand how to acquire, store, and use the Tokens, and to appreciate the risks and implications of acquiring Tokens. 4.4. You understand that the Tokens confer no ownership or property rights of any form with respect to the Company, including, but not limited to, any ownership, distribution, redemption, liquidation, proprietary, governance, or other financial or legal rights. 4.5. You acknowledge that the Company has made no representations or warranties whatsoever regarding the Tokens and their functionality, or the assets, business, financial condition or prospects of the Company. 4.6. You understand that the Tokens have not been registered under the Securities Act and that the Company is under no obligation to so register the Tokens. 4.7. You shall execute such other documents as reasonably requested by the Company as necessary to comply with all applicable law. 4.8. You acknowledge that the Company has made no representations or warranties whatsoever regarding the income tax consequences regarding the receipt or ownership of the Tokens. 4.9. YOU UNDERSTAND THAT YOU MAY SUFFER ADVERSE TAX CONSEQUENCES AS A RESULT OF YOUR RECEIPT OR DISPOSITION OF THE TOKENS. YOU REPRESENT (i) THAT YOU HAVE CONSULTED WITH A TAX ADVISER THAT YOU DEEM ADVISABLE IN CONNECTION WITH THE RECEIPT OR DISPOSITION OF THE TOKENS, AND (i) THAT YOU ARE NOT RELYING ON THE ANY OF THE RELEASED PARTIES FOR ANY TAX ADVICE. 5. Disclaimer and Limitation of Liability. 5.1. The Company shall not be liable or responsible to You, nor be deemed to have defaulted under or breached this Agreement, for any failure or delay in fulfilling or performing any term of this Agreement, including without limitation, developing the Company's products, sending the Tokens to Your digital asset wallet, listing the Tokens on an exchange or automated market making pool, or distributing the Tokens, when and to the extent such failure or delay is caused by or results from acts beyond the affected party's reasonable control, including, without limitation: (a) acts of God; (b) flood, fire, earthquake, or explosion; (c) war, invasion, hostilities (whether war is declared or not), terrorist threats or acts, or other civil unrest; (d) applicable law or regulations; or (e) action by any governmental authority. 5.2. THE COMPANY MAKES NO WARRANTY WHATSOEVER WITH RESPECT TO THE TOKENS, INCLUDING ANY (i) WARRANTY OF MERCHANTABILITY; (ii) WARRANTY OF FITNESS FOR A PARTICULAR PURPOSE; (iii) WARRANTY OF TITLE; OR (iv) WARRANTY AGAINST INFRINGEMENT OF INTELLECTUAL PROPERTY RIGHTS OF A THIRD PARTY; WHETHER ARISING BY LAW, COURSE OF DEALING, COURSE OF PERFORMANCE, USAGE OF TRADE, OR OTHERWISE. EXCEPT AS EXPRESSLY SET FORTH HEREIN, YOU ACKNOWLEDGE THAT YOU HAVE NOT RELIED UPON ANY REPRESENTATION OR WARRANTY MADE BY THE COMPANY, OR ANY OTHER PERSON ON THE COMPANY'S BEHALF. 5.3. THE COMPANY'S (OR ANY OTHER INDIVIDUAL'S OR LEGAL ENTITY'S) AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT, WHETHER ARISING OUT OF OR RELATED TO BREACH OF CONTRACT, TORT OR OTHERWISE, SHALL NOT EXCEED USD$100. NEITHER THE COMPANY NOR THE RELEASED PARTIES OR ITS REPRESENTATIVES SHALL BE LIABLE FOR CONSEQUENTIAL, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE OR ENHANCED DAMAGES, LOST PROFITS OR REVENUES OR DIMINUTION IN VALUE, ARISING OUT OF OR RELATING TO ANY BREACH OF THIS AGREEMENT. 6. Miscellaneous 6.1. Independent Legal Counsel. The Parties acknowledge that they have had the opportunity to consult with independent legal counsel regarding the legal effect of this Agreement and the Release and that each Party enters into this Agreement freely and voluntarily 6.2. Governing Law; Venue. This Agreement shall be governed by and construed in accordance with the laws of the Cayman Islands, notwithstanding its choice of law provisions. The Parties agree that any claims or legal actions by one Party against the other to enforce the terms of this Agreement or concerning any rights under this Agreement shall be commenced and maintained in any court located in the Cayman Islands. 6.3. Confidentiality. The Parties agree to keep confidential all the terms and conditions of this Agreement, as well as all negotiations and discussions leading up to this Agreement. 6.4. Fees and Expenses. Each Party hereto shall bear its own fees and expenses (including attorneys' fees) incurred in connection with this Agreement and the consummation of the transactions contemplated hereby. 6.5. Attorneys' Fees and Costs in Enforcement of the Agreement. If either Party incurs any legal fees and/or costs and expenses in any proceeding to enforce the terms of this Agreement or any of its rights provided hereunder, the prevailing Party shall be entitled to recover its reasonable attorneys' fees and any court, arbitration, mediation, or other litigation expenses from the other Party. 6.6. Waiver. No waiver of any term or right in this Agreement shall be effective unless in writing, signed by an authorized representative of the waiving Party. The failure of either Party to enforce any provision of this Agreement shall not be construed as a waiver or modification of such provision, or impairment of its right to enforce such provision or any other provision of this Agreement thereafter. 6.7. Construction. The headings/captions appearing in this Agreement have been inserted for the purposes of convenience and ready reference, and do not purport to and shall not be deemed to define, limit or extend the scope or intent of the provisions to which they appertain. This Agreement shall not be construed more strongly against either Party regardless of which Party is more responsible for its preparation. 6.8. Entire Agreement. This Agreement sets forth the entire and complete understanding and agreement between the Parties regarding the subject matter hereof including, but not limited to the settlement of all disputes and claims with respect to the matters covered by the Release, and supersedes any and all other prior agreements or discussions, whether oral, written, electronic or otherwise, relating to the subject matter hereunder. Any additions or modifications to this Agreement must be made in writing and signed by authorized representatives of both Parties. The Parties acknowledge and agree that they are not relying upon any representations or statements made by the other Party or the other Party's employees, agents, representatives or attorneys regarding this Agreement, except to the extent such representations are expressly set forth herein. 6.9. Authority to Bind. By signing below the Parties represent that the signatories are authorized to execute this Agreement on behalf of themselves and/or their respective business entities and that the execution and delivery of this Agreement are the duly authorized and binding.";

    event EmergencyWithdrawal(address token, uint256 amount, address to);
    event SwapForAlly(address token, address to, uint256 amountToken, uint256 amountAlly);
    event ChangeSwapRate(address token, uint256 oldRate, uint256 newRate);
    event AgreedToTerms(address token, address account, bytes32 terms);

    constructor(address oneToken_, address allyToken_, uint256 swapRate_) {
        oneToken = oneToken_;
        allyToken = allyToken_;
        swapRate = swapRate_;
    }

    function termsHash(address account) public pure returns (bytes32) {
        return keccak256(abi.encode(account, termsAndConditions));
    }

    function isAgreedToTerms(address account) public view returns (bool) {
        return approvedTerms[account];
    }

    function setSwapRate(uint256 rate_) external onlyOwner {
        require(rate_ > 0, "AllySwap: swap rate must be > 0");
        emit ChangeSwapRate(oneToken, swapRate, rate_);
        swapRate = rate_;
    }

    function emergencyWithdraw(address _token, uint256 amount, address to) external onlyOwner {
        require(to != address(0), "AllySwap: to cannot be the 0x0 address");
        IERC20(_token).safeTransfer(to, amount);
        emit EmergencyWithdrawal(_token, amount, to);
    }

    function consentAndAgreeToTerms(bytes32 terms) external {
        require(!isAgreedToTerms(msg.sender), 'AllySwap: T&C already approved.');
        require(termsHash(msg.sender) == terms, 'AllySwap: wrong hash for T&C.');

        approvedTerms[msg.sender] = true;
        
        emit AgreedToTerms(oneToken, msg.sender, terms);
    }

    function swap(uint256 amountIn, address to) external {
        require(isAgreedToTerms(msg.sender), 'AllySwap: T&C must be approved.');
        require(to != address(0), "AllySwap: to cannot be the 0x0 address");
        require(amountIn <= IERC20(oneToken).balanceOf(msg.sender), 'AllySwap: insufficient oneToken balance');
        require(amountIn <= IERC20(oneToken).allowance(msg.sender, address(this)), 'AllySwap: insufficent oneToken allowance');

        uint256 amountOut = amountIn.mul(PRECISION).div(swapRate);
        require(amountOut <= IERC20(allyToken).balanceOf(address(this)), 'AllySwap: insufficient Ally balance');

        IERC20(oneToken).transferFrom(msg.sender, address(this), amountIn);
        IERC20(allyToken).transfer(to, amountOut);

        emit SwapForAlly(oneToken, to, amountIn, amountOut);
    }
}
