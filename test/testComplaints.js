const dkg = artifacts.require("./dkg.sol");
const general = require('./dkg/general.js');
const happyFlow = require('./dkg/happyFlow.js');
const complaint = require('./dkg/complaint.js');
const happyFlowData = require('./testsData/happyFlowData.js');
const corruptedData = require('./testsData/corruptedData.js');
const corruptedData2 = require('./testsData/corruptedData2.js');



contract('DKG unjustified complaint - private commitment', async (accounts) => {

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

  it("Unjustified Complaint: private commitment", async () => {
    const complainer = 0;
    const accused = 1;
    let instance = await dkg.deployed();
    let deposit = await instance.depositWei.call();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();

    let funcComplain = async () => {
      return await complaint.complainPrvCommitment(instance, accounts, complainer, accused, happyFlowData.sks[complainer]);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
    let gasPrice = dkg.class_defaults.gasPrice;
    let slashedGas = -res.balancesAfter[complainer]/gasPrice;    
    assert.equal(Math.round(slashedGas), res.gasUsed, "Slashed participant pays only the gas");
  
    let ethReceived = deposit.toNumber() * numOfParticipants / (numOfParticipants-1);
    for(var i = 0; i < numOfParticipants; i++) {
      if(i != complainer)
      {
        assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
          "Participant reward from slashing error");
      }
    }
  });

  it("Check DKG ended with failure", async () => {
    let instance = await dkg.deployed();
    await complaint.contractEndFail(instance);
  });
});


contract('DKG unjustified complaint - public commitment', async (accounts) => {

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

  it("Unjustified Complaint: public commitment", async () => {
    const complainer = 0;
    const accused = 1;
    let instance = await dkg.deployed();
    let deposit = await instance.depositWei.call();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();
    let t = await instance.t.call();
    let threshold = t.toNumber();

    let funcComplain = async () => {
      let pubCommitInd = Math.floor((Math.random() * (threshold+1)));      
      return await complaint.complainPubCommitment(instance, accounts, complainer, accused, pubCommitInd);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
    let gasPrice = dkg.class_defaults.gasPrice;
    let slashedGas = -res.balancesAfter[complainer]/gasPrice;    
    assert.equal(Math.round(slashedGas), res.gasUsed, "Slashed participant pays only the gas");
  
    let ethReceived = deposit.toNumber() * numOfParticipants / (numOfParticipants-1);
    for(var i = 0; i < numOfParticipants; i++) {
      if(i != complainer)
      {
        assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
          "Participant reward from slashing error");
      }
    }
  });

  it("Check DKG ended with failure", async () => {
    let instance = await dkg.deployed();
    await complaint.contractEndFail(instance);
  });
});


contract('DKG justified complaint - private commitment', async (accounts) => {

  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await happyFlow.join(instance, accounts, corruptedData.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await happyFlow.commit(instance, accounts, 
      corruptedData.pubCommitG1, corruptedData.pubCommitG2, corruptedData.prvCommitEnc);
  });

  it("Justified Complaint: private commitment", async () => {
    const complainer = 0;
    const accused = 1;
    let instance = await dkg.deployed();
    let deposit = await instance.depositWei.call();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();

    let funcComplain = async () => {
      return await complaint.complainPrvCommitment(instance, accounts, complainer, accused, corruptedData.sks[complainer]);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[complainer] += res.gasUsed * gasPrice;
  
    let ethReceived = deposit.toNumber() * numOfParticipants / (numOfParticipants-1);
    for(var i = 0; i < numOfParticipants; i++) {
      if(i != accused)
      {
        assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
          "Participant reward from slashing error");
      }
      else
      {
        assert.equal(res.balancesAfter[i], 0, 
          "Slashed participant balance should remain unchanged");
      }
    }
  });

  it("Check DKG ended with failure", async () => {
    let instance = await dkg.deployed();
    await complaint.contractEndFail(instance);
  });
});


contract('DKG justified complaint - public commitment', async (accounts) => {

  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await happyFlow.join(instance, accounts, corruptedData.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await happyFlow.commit(instance, accounts, 
      corruptedData.pubCommitG1, corruptedData.pubCommitG2, corruptedData.prvCommitEnc);
  });

  it("Justified Complaint: public commitment", async () => {
    const complainer = 0;
    const accused = 1;
    const complainPubCommitIndex = 1;
    let instance = await dkg.deployed();
    let deposit = await instance.depositWei.call();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();

    let funcComplain = async () => {
      return await complaint.complainPubCommitment(instance, accounts, complainer, accused, complainPubCommitIndex);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[complainer] += res.gasUsed * gasPrice;
  
    let ethReceived = deposit.toNumber() * numOfParticipants / (numOfParticipants-1);
    for(var i = 0; i < numOfParticipants; i++) {
      if(i != accused)
      {
        assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
          "Participant reward from slashing error");
      }
      else
      {
        assert.equal(res.balancesAfter[i], 0, 
          "Slashed participant balance should remain unchanged");
      }
    }
  });

  it("Check DKG ended with failure", async () => {
    let instance = await dkg.deployed();
    await complaint.contractEndFail(instance);
  });
});


contract('DKG unjustified complaint - public commitment G1 not on the curve', async (accounts) => {
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

  it("Unjustified Complaint: public commitment G1 IS(!) on the curve", async () => {
    const complainer = 0;
    const accused = 1;
    let instance = await dkg.deployed();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();
    let t = await instance.t.call();
    let threshold = t.toNumber();

    let funcComplain = async () => {
      let pubCommitInd = Math.floor((Math.random() * (threshold+1)));   
      return await complaint.complainNotInG1(instance, accounts, complainer, accused, pubCommitInd);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[complainer] += gasPrice * res.gasUsed;
    for(var i = 0; i < numOfParticipants; i++) {
      assert.equal(Math.round(res.balancesAfter[i]/gasPrice), 0, "No reward nor slashing should occur");
    }
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

contract('DKG justified complaint - public commitment G1 not on the curve', async (accounts) => {
  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await happyFlow.join(instance, accounts, corruptedData2.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await happyFlow.commit(instance, accounts, 
      corruptedData2.pubCommitG1, corruptedData2.pubCommitG2, corruptedData2.prvCommitEnc);
  });

  it("Justified Complaint: public commitment G1 is NOT on the curve", async () => {
    const complainer = 0;
    const accused = 1;
    const pubCommitInd = 0;
    let instance = await dkg.deployed();
    let deposit = await instance.depositWei.call();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();

    let funcComplain = async () => {
      return await complaint.complainNotInG1(instance, accounts, complainer, accused, pubCommitInd);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[complainer] += gasPrice * res.gasUsed;
    let ethReceived = deposit.toNumber() * numOfParticipants / (numOfParticipants-1);
    for(var i = 0; i < numOfParticipants; i++) {
      if(i != accused)
      {
        assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
          "Participant reward from slashing error");
      }
      else
      {
        assert.equal(res.balancesAfter[i], 0, 
          "Slashed participant balance should remain unchanged");
      }
    }
  });

  it("Check DKG ended with failure", async () => {
    let instance = await dkg.deployed();
    await complaint.contractEndFail(instance);
  });
});

contract('DKG unjustified complaint - public commitment G2 not on the curve', async (accounts) => {
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

  it("Unjustified Complaint: public commitment G2 IS(!) on the curve", async () => {
    const complainer = 0;
    const accused = 1;
    let instance = await dkg.deployed();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();
    let t = await instance.t.call();
    let threshold = t.toNumber();

    let funcComplain = async () => {
      let pubCommitInd = Math.floor((Math.random() * (threshold+1)));   
      return await complaint.complainNotInG2(instance, accounts, complainer, accused, pubCommitInd);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[complainer] += gasPrice * res.gasUsed;
    for(var i = 0; i < numOfParticipants; i++) {
      assert.equal(Math.round(res.balancesAfter[i]/gasPrice), 0, "No reward nor slashing should occur");
    }
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

contract('DKG justified complaint - public commitment G2 not on the curve', async (accounts) => {
  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await happyFlow.join(instance, accounts, corruptedData2.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await happyFlow.commit(instance, accounts, 
      corruptedData2.pubCommitG1, corruptedData2.pubCommitG2, corruptedData2.prvCommitEnc);
  });

  it("Justified Complaint: public commitment G2 is NOT on the curve", async () => {
    const complainer = 0;
    const accused = 1;
    const pubCommitInd = 0;
    let instance = await dkg.deployed();
    let deposit = await instance.depositWei.call();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();

    let funcComplain = async () => {
      return await complaint.complainNotInG2(instance, accounts, complainer, accused, pubCommitInd);
    }
    let res = await general.getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
    let gasPrice = dkg.class_defaults.gasPrice;
    res.balancesAfter[complainer] += gasPrice * res.gasUsed;
    let ethReceived = deposit.toNumber() * numOfParticipants / (numOfParticipants-1);
    for(var i = 0; i < numOfParticipants; i++) {
      if(i != accused)
      {
        assert.equal(Math.round(res.balancesAfter[i]/gasPrice), Math.round(ethReceived/gasPrice), 
          "Participant reward from slashing error");
      }
      else
      {
        assert.equal(res.balancesAfter[i], 0, 
          "Slashed participant balance should remain unchanged");
      }
    }
  });

  it("Check DKG ended with failure", async () => {
    let instance = await dkg.deployed();
    await complaint.contractEndFail(instance);
  });
});