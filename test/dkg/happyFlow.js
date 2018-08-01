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
async function postDeploy(instance) {
  let n = await instance.n.call();
  let t = await instance.t.call();
  assert(n > t, "the number of participants should be bigger than the threshold");
}
  
/**
 * Joins the maximum amount of participants in the enrollment phase.
 * Asserts all deposited the right amount.
 * @param {*} instance 
 * @param {string[]} accounts 
 * @param {G1[]} pks  of each of the participants
 * @param {number} numOfParticipants 
 */
async function join(instance, accounts, pks, numOfParticipants) {
  
  let n = await instance.n.call();
  numOfParticipants = numOfParticipants ? numOfParticipants : n.toNumber();
  
  let indices = _.range(1, numOfParticipants+1);
  let deposit = await instance.depositWei.call();

  await general.verifyPhase(constants.phase.enrollment, instance);
      
  for (var i = 0; i < numOfParticipants; i++) {
    let args = [
      pks[i], 
      {from: accounts[i], value: deposit}
    ];
    
    let index = await instance.join.call(args[0], args[1]);
    await instance.join(args[0], args[1]);
    assert.equal(indices[i], index.toNumber(), "error in index returned for participant");

    let pkEnc = await instance.getParticipantPkEnc.call(index);
    assert(dkgUtils.isEqualPoints(pkEnc.map(x => x.toNumber()), pks[i]), "PK for encryption error")
  }

  let expectedBalance = deposit*numOfParticipants;
  await general.verifyContractBalance(expectedBalance);
}
  
/**
 * Commits all the participant by the given data.
 * Asserts all participant are committed successfully.
 * 
 * @param {*} instance 
 * @param {string[]} accounts 
 * @param {G1[][]} pubCommitG1Data 
 * @param {G2[][]} pubCommitG2Data 
 * @param {number[][]} prvCommitEncData 
 * @param {number} numOfParticipants 
 */
async function commit(instance, accounts, pubCommitG1Data, pubCommitG2Data, prvCommitEncData, numOfParticipants) {
  let n = await instance.n.call();
  numOfParticipants = numOfParticipants ? numOfParticipants : n.toNumber();
  let indices = _.range(1, n.toNumber()+1);
  let t = await instance.t.call();
  let threshold = t.toNumber();

  await general.verifyPhase(constants.phase.commit, instance);

  for (var i = 0; i < numOfParticipants; i++) {
    let args = [
      indices[i],
      _.flatMap(pubCommitG1Data[i]),
      _.flatMap(pubCommitG2Data[i]),
      prvCommitEncData[i],
      {from: accounts[i]}
    ];
    await instance.commit(args[0], args[1], args[2], args[3], args[4]);

    for (var j = 0; j < threshold+1; j++) {
      let pubCommitG1 = await instance.getParticipantPubCommitG1.call(indices[i], j);        
      assert(dkgUtils.isEqualPoints(pubCommitG1.map(x => x.toNumber()), pubCommitG1Data[i][j]), 
        util.format("error in public commitment G1 of %s to coefficient %s", indices[i], j));
      
      let pubCommitG2 = await instance.getParticipantPubCommitG2.call(indices[i], j);
      assert(dkgUtils.isEqualPoints(pubCommitG2.map(x => x.toNumber()), pubCommitG2Data[i][j]), 
        util.format("error in public commitment G2 of %s to coefficient %s", indices[i], j));

      let prvCommit = await instance.getParticipantPrvCommit.call(indices[i], indices[j]);
      assert.equal(prvCommit.toNumber(), prvCommitEncData[i][j]), 
        util.format("error in private encrypted commitment of %s to %s", indices[i], indices[j]);    
    }

    let isCommitted = await instance.getParticipantIsCommitted.call(indices[i]);
    assert(isCommitted, 
      util.format("error participant %s is not marked as committed", indices[i]));
  }
}
  
/**
 * Closes the contract after the commit phase .
 * @param {*} instance 
 * @param {string} callerAccount the account that will call the tx that 
 * closes the contract.
 */
async function postCommit(instance, callerAccount) {
  await general.verifyPhase(constants.phase.postCommit, instance);
  return await phaseChange(instance, callerAccount);
}


/**
 * Closes the contract after all are committed (mines blocks automatically so
 * the timeout expires).
 * @param {*} instance 
 * @param {string} callerAccount the account that will call the tx that 
 * closes the contract.
 * @returns {number} gas used
 */
async function phaseChange(instance, callerAccount) {
  let timeout = await instance.postCommitTimeout.call(); 
  await general.mineEmptyBlocks(timeout.toNumber());
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.phaseChange(arg);
  return res.receipt.gasUsed;
}

/**
 * Asserts contract was closed successfully and that no ether 
 * is left in the contract.
 * @param {*} instance 
 */
async function contractEndSuccess(instance) {
  await general.verifyPhase(constants.phase.endSuccess, instance);
  await general.verifyContractBalance(0);
}



module.exports = {
  postDeploy,
  join,
  commit,
  postCommit,
  phaseChange,
  contractEndSuccess
};