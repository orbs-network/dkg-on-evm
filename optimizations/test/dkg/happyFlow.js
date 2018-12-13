/**
 * @typedef {number[2]} G1 
 * 
 * @typedef {number[4]} G2 
 */


const general = require('./general.js');
const util = require('util');
const dkgUtils = require('./utils.js');
const constants = require('../testsData/constants.js');


/**
 * Asserts the contract after deployment.
 * @param {*} instance 
 */
async function postDeploy(instance, params) {
  let n = await instance.n.call();
  let t = await instance.t.call();  
  assert(params.n > params.t, "the number of participants should be bigger than the threshold");
  assert.equal(n, params.n, "the contract's n is not equal to the scenario's n");
  assert.equal(t, params.t, "the contract's t is not equal to the scenario's t");
}
  
/**
 * Joins the maximum amount of participants in the enrollment phase.
 * Asserts all deposited the right amount.
 * @param {*} instance 
 * @param {string[]} accounts 
 * @param {G1[]} pks  of each of the participants
 * @param {string[]} merkleCommitments 
 * @param {number} numOfParticipants 
 */
async function join(instance, accounts, pks, merkleCommitments, numOfParticipants) {
  
  let gasUsedAll = [];

  let n = await instance.n.call();
  numOfParticipants = numOfParticipants ? numOfParticipants : n.toNumber();
  
  let indices = _.range(1, numOfParticipants+1);
  let deposit = await instance.depositWei.call();

  await general.verifyPhase(constants.phase.enrollment, instance);
  
  for (var i = 0; i < numOfParticipants; i++) {
    let args = [
      pks[i],
      merkleCommitments[i], 
      {from: accounts[i], value: deposit}
    ];
    
    let index = await instance.join.call(args[0], args[1], args[2]);
    gasUsedAll[i] = (await instance.join(args[0], args[1], args[2])).receipt.gasUsed;
     
    assert.equal(indices[i], index.toNumber(), "error in index returned for participant");

    let pkEnc = await instance.getParticipantPkEnc.call(index);
    assert(dkgUtils.isEqualPoints(pkEnc.map(x => x.toNumber()), pks[i]), "PK for encryption error")

    let merkleCommit = await instance.getParticipantMerkleCommit.call(index);
    assert.equal(merkleCommitments[i], merkleCommit, "Merkle commitment error")
    
  }

  let expectedBalance = deposit*numOfParticipants;
  await general.verifyContractBalance(expectedBalance);

  return gasUsedAll;
}


async function postEnrollment(instance, callerAccount) {
  await general.verifyPhase(constants.phase.postEnrollment, instance);
  return await postEnrollmentTimedOut(instance, callerAccount);
}


async function postEnrollmentTimedOut(instance, callerAccount) {
  let timeout = await instance.postEnrollmentTimeout.call(); 
  await general.mineEmptyBlocks(timeout.toNumber());
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.postEnrollmentTimedOut(arg);
  return res.receipt.gasUsed;
}


async function postDataReceived(instance, callerAccount) {
  await general.verifyPhase(constants.phase.allDataReceived, instance);
  return await postDataReceivedTimedOut(instance, callerAccount);
}


async function postDataReceivedTimedOut(instance, callerAccount) {
  let timeout = await instance.allDataReceivedTimeout.call(); 
  await general.mineEmptyBlocks(timeout.toNumber());
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.dataReceivedTimedOut(arg);
  return res.receipt.gasUsed;
}



async function submitGroupPk(instance, accounts, groupPk, submitterIndex) {
  await general.verifyPhase(constants.phase.allDataValid, instance);
  let args = [
    groupPk,
    submitterIndex+1,
    {from: accounts[submitterIndex]}
  ];
  
  let gasUsed = (await instance.submitGroupPK(args[0], args[1], args[2])).receipt.gasUsed;

  let contractGroupPK = await instance.getGroupPK.call();        
  assert(dkgUtils.isEqualPoints(contractGroupPK.map(x => x.toNumber()), groupPk), 
    "contract's group PK doesn't match the one sent");

  return gasUsed;
}

  
/**
 * 
 * @param {*} instance 
 * @param {string} callerAccount the account that will call the tx that 
 * closes the contract.
 */
async function postGroupPk(instance, callerAccount) {
  await general.verifyPhase(constants.phase.postGroupPK, instance);
  return await postGroupPkTimedOut(instance, callerAccount);
}


/**
 * Closes the contract after groupPk is committed (mines blocks automatically so
 * the timeout expires).
 * @param {*} instance 
 * @param {string} callerAccount the account that will call the tx that 
 * closes the contract.
 * @returns {number} gas used
 */
async function postGroupPkTimedOut(instance, callerAccount) {
  let timeout = await instance.postGroupPkTimeout.call(); 
  await general.mineEmptyBlocks(timeout.toNumber());
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.postGroupPkTimedOut(arg);
  return res.receipt.gasUsed;
}

/**
 * Asserts contract was closed successfully.
 * @param {*} instance 
 */
async function contractEndSuccess(instance) {
  await general.verifyPhase(constants.phase.endSuccess, instance);
  // await general.verifyContractBalance(0);
}


module.exports = {
  postDeploy,
  join,
  postEnrollment,
  postEnrollmentTimedOut,
  postDataReceived,
  postDataReceivedTimedOut,
  postGroupPk,
  postGroupPkTimedOut,
  submitGroupPk,
  contractEndSuccess
};