const general = require('./general.js');
const constants = require('../testsData/constants.js');
const happyFlow = require('./happyFlow');


async function contractEndFail(instance) {
  await general.verifyPhase(constants.phase.endFail, instance);
  await general.verifyContractBalance(0);
  await general.assertError(happyFlow.phaseChange(instance), constants.errTypes.revert);
}

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

module.exports = {
  contractEndFail,
  complainPrvCommitment,
  complainPubCommitment,
  complainNotInG1
};