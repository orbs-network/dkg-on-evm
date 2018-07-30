const phase = {
  enrollment: 0,
  commit: 1,
  postCommit: 2,
  endSuccess: 3,
  endFail: 4
};

const EXCEPTION_PREFIX = "VM Exception while processing transaction: ";
const errTypes = {
  revert            : "revert",
  outOfGas          : "out of gas",
  invalidJump       : "invalid JUMP",
  invalidOpcode     : "invalid opcode",
  stackOverflow     : "stack overflow",
  stackUnderflow    : "stack underflow",
  staticStateChange : "static state change"
};


module.exports = {
  phase,
  EXCEPTION_PREFIX,
  errTypes
};