const phase = {
  enrollment: 0,
  postEnrollment: 1,
  allDataReceived: 2,
  allDataValid: 3,
  postGroupPK: 4,
  complaint: 5,
  endSuccess: 6,
  endFail: 7
};

const complaintPhase = {
  accusedTurn: 0,
  challengerTurn: 1, 
  allAgree: 2
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
  complaintPhase,
  EXCEPTION_PREFIX,
  errTypes
};