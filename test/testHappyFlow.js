const dkg = artifacts.require("./dkg.sol");
const general = require('./dkg/general.js');
const happyFlow = require('./dkg/happyFlow.js');
const happyFlowData = require('./testsData/happyFlowData.js');



contract('DKG happy-flow', async (accounts) => {
  accounts.shift(); // the first account will only deploy the contract
  
  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await happyFlow.join(instance, accounts, happyFlowData.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await happyFlow.commit(instance, accounts, 
      happyFlowData.pubCommitG1, happyFlowData.pubCommitG2, happyFlowData.prvCommitEnc);
  });

  it("Post-Commit", async () => {
    const callerIndex = 0;
    let instance = await dkg.deployed();
    
    let deposit = await instance.depositWei.call();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();

    let funcPostCommit = async () => {
      return await happyFlow.postCommit(instance, accounts[callerIndex]);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcPostCommit);
    
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[callerIndex] += res.gasUsed*gasPrice;        
  
    let ethReceived = deposit.toNumber();
    for(var i = 0; i < numOfParticipants; i++) {
      assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
        "Participant deposit should return");
    }
  });

  it("Check DKG ended successfully", async () => {
    let instance = await dkg.deployed();
    await happyFlow.contractEndSuccess(instance);
  });
});










