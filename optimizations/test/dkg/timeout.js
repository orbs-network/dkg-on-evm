
/**
 * Close the DKG contract when enrollment phase timeout has expired.
 * @param {*} instance 
 * @param {string} callerAccount the account that will call the tx that 
 * closes the contract.
 */
async function endEnrollment(instance, callerAccount) {
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.joinTimedOut(arg);
  return res.receipt.gasUsed;
}


/**
 * Close the DKG contract when commit phase timeout has expired.
 * @param {*} instance 
 * @param {string} callerAccount the account that will call the tx that 
 * closes the contract.
 */
async function endCommit(instance, callerAccount) {
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.commitTimedOut(arg);
  return res.receipt.gasUsed;
}

module.exports = {
  endEnrollment,
  endCommit
};