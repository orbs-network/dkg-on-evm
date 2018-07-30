const dkg = artifacts.require("./dkg.sol");
const general = require('./dkg/general.js');
const happyFlow = require('./dkg/happyFlow.js');
const complaint = require('./dkg/complaint.js');
const timeout = require('./dkg/timeout.js');
const happyFlowData = require('./testsData/happyFlowData.js');



contract('DKG enrollment timeout', async (accounts) => {
  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance);
  });

  it("Join only some of the participants", async() => {
    let instance = await dkg.deployed();
    let numOfParticipants = 1;
    await happyFlow.join(instance, accounts, happyFlowData.pks, numOfParticipants);
  });

  it("Wait for enrollment timeout to pass", async() => {
    let instance = await dkg.deployed();
    let timeout = await instance.joinTimeout.call(); 
    await general.mineEmptyBlocks(timeout);
  });

  it("Close the contract", async() => {
    let instance = await dkg.deployed();
    
    let deposit = await instance.depositWei.call();
    let n = await instance.curN.call();
    let numOfParticipants = n.toNumber();
    const callerIndex = 0;

    let funcEndEnrollment = async () => {
      return await timeout.endEnrollment(instance, accounts[callerIndex]);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcEndEnrollment);
    
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[callerIndex] += res.gasUsed*gasPrice;        
  
    let ethReceived = deposit.toNumber();
    for(var i = 0; i < numOfParticipants; i++) {
      assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
        "Participant deposit should return");
    }
  });

  it("Check DKG ended with failure", async () => {
    let instance = await dkg.deployed();
    await complaint.contractEndFail(instance);
  });
});
  
  
contract('DKG commit timeout', async (accounts) => {
  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await happyFlow.join(instance, accounts, happyFlowData.pks);
  });

  it("Commit only some of the participants", async () => {
    let instance = await dkg.deployed();
    let numOfParticipants = 1;
    await happyFlow.commit(instance, accounts, 
      happyFlowData.pubCommitG1, happyFlowData.pubCommitG2, happyFlowData.prvCommitEnc, numOfParticipants);
  });

  it("Wait for commit timeout to pass", async() => {
    let instance = await dkg.deployed();
    let timeout = await instance.commitTimeout.call(); 
    await general.mineEmptyBlocks(timeout);
  });

  it("Close the contract", async() => {
    let instance = await dkg.deployed();
    
    let totalDeposit = await web3.eth.getBalance(dkg.address);
    const numOfParticipantsCommitted = 1;
    const callerIndex = 0;

    let funcEndCommit = async () => {
      return await timeout.endCommit(instance, accounts[callerIndex]);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcEndCommit);
    
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[callerIndex] += res.gasUsed*gasPrice;        
  
    let ethReceived = totalDeposit.toNumber()/numOfParticipantsCommitted;
    for(var i = 0; i < numOfParticipantsCommitted; i++) {
      assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
        "Participant deposit should return");
    }
  });

  it("Check DKG ended with failure", async () => {
    let instance = await dkg.deployed();
    await complaint.contractEndFail(instance);
  });
});