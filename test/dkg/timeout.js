

async function endEnrollment(instance, callerAccount) {
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.joinTimedOut(arg);
  return res.receipt.gasUsed;
}


async function endCommit(instance, callerAccount) {
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.commitTimedOut(arg);
  return res.receipt.gasUsed;
}

module.exports = {
  endEnrollment,
  endCommit
};