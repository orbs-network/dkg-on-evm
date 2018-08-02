const general = require('./general.js');
const constants = require('../testsData/constants.js');
const happyFlow = require('./happyFlow');


/**
 * Asserts contract ended with failure. Verifies no ether is left 
 * in the contract.
 * @param {*} instance 
 */
async function contractEndFail(instance) {
  await general.verifyPhase(constants.phase.endFail, instance);
  await general.verifyContractBalance(0);
  await general.assertError(happyFlow.postCommitTimedOut(instance), constants.errTypes.revert);
}


/**
 * Send a complaint on private commitment.
 * @param {*} instance 
 * @param {string[]} accounts 
 * @param {number} complainerIndex 
 * @param {number} accusedIndex 
 * @param {number} complainerSk 
 */
async function complainPrvCommitment(instance, accounts, complainerIndex, accusedIndex, complainerSk) {
  await general.verifyPhase(constants.phase.postCommit, instance);
  let n = await instance.n.call();
  let numOfParticipants = n.toNumber();
  let indices = _.range(1, numOfParticipants+1);
  
  let res = await instance.complaintPrivateCommit(
    indices[complainerIndex], 
    indices[accusedIndex], 
    complainerSk, 
    {from: accounts[complainerIndex]}
  );
  return res.receipt.gasUsed;
}


/**
 * Send a complaint on public commitment.
 * @param {*} instance 
 * @param {string[]} accounts 
 * @param {number} complainerIndex 
 * @param {number} accusedIndex
 * @param {number} pubCommitIndex 
 */
async function complainPubCommitment(instance, accounts, complainerIndex, accusedIndex, pubCommitIndex) {
  await general.verifyPhase(constants.phase.postCommit, instance);
  let n = await instance.n.call();
  let numOfParticipants = n.toNumber();
  let indices = _.range(1, numOfParticipants+1);
  let res = await instance.complaintPublicCommit(
    indices[complainerIndex], 
    indices[accusedIndex], 
    pubCommitIndex, 
    {from: accounts[complainerIndex]}
  );
  return res.receipt.gasUsed;
}


/**
 * Send a complaint on a committed point not in G1.
 * @param {*} instance 
 * @param {string[]} accounts 
 * @param {number} complainerIndex 
 * @param {number} accusedIndex
 * @param {number} pubCommitIndex 
 */
async function complainNotInG1(instance, accounts, complainerIndex, accusedIndex, pubCommitIndex) {
  await general.verifyPhase(constants.phase.postCommit, instance);
  let n = await instance.n.call();
  let numOfParticipants = n.toNumber();
  let indices = _.range(1, numOfParticipants+1);
  let res = await instance.complaintNotInG1(
    indices[complainerIndex], 
    indices[accusedIndex], 
    pubCommitIndex, 
    {from: accounts[complainerIndex]}
  );
  return res.receipt.gasUsed;
}


/**
 * Send a complaint on a committed point not in G2.
 * @param {*} instance 
 * @param {string[]} accounts 
 * @param {number} complainerIndex 
 * @param {number} accusedIndex
 * @param {number} pubCommitIndex 
 */
async function complainNotInG2(instance, accounts, complainerIndex, accusedIndex, pubCommitIndex) {
  await general.verifyPhase(constants.phase.postCommit, instance);
  let n = await instance.n.call();
  let numOfParticipants = n.toNumber();
  let indices = _.range(1, numOfParticipants+1);
  let res = await instance.complaintNotInG2(
    indices[complainerIndex], 
    indices[accusedIndex], 
    pubCommitIndex, 
    {from: accounts[complainerIndex]}
  );
  return res.receipt.gasUsed;
}


module.exports = {
  contractEndFail,
  complainPrvCommitment,
  complainPubCommitment,
  complainNotInG1,
  complainNotInG2
};