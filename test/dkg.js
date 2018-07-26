const dkg = artifacts.require("./dkg.sol");
const util = require('util');
const happyFlowData = require('./testsData/happyFlowData.js');
const corruptedData = require('./testsData/corruptedData.js');
const async = require("async");

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


contract('DKG happy-flow', async (accounts) => {
  accounts.shift(); // the first account will only deploy the contract

  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await join(instance, accounts, happyFlowData.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await commit(instance, accounts, 
      happyFlowData.pubCommitG1, happyFlowData.pubCommitG2, happyFlowData.prvCommitEnc);
  });

  it("Post-Commit", async () => {
    const callerIndex = 0;
    let instance = await dkg.deployed();
    
    let deposit = await instance.depositWei.call();
    let n = await instance.n.call();
    let numOfParticipants = n.toNumber();

    let funcPostCommit = async () => {
      return await postCommit(instance, accounts[callerIndex]);
    }
    let res = await getAccountsBalancesDiffAfterFunc(instance, accounts, funcPostCommit);
    
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
    await contractEndSuccess(instance);
  });
});


contract('DKG unjustified complaint - private commitment', async (accounts) => {

  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await join(instance, accounts, happyFlowData.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await commit(instance, accounts, 
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
      return await complainPrvCommitment(instance, accounts, complainer, accused, happyFlowData.sks[complainer]);
    }
    let res = await getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
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
    await contractEndFail(instance);
  });
});


contract('DKG unjustified complaint - public commitment', async (accounts) => {

  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await join(instance, accounts, happyFlowData.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await commit(instance, accounts, 
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
      return await complainPubCommitment(instance, accounts, complainer, accused, pubCommitInd);
    }
    let res = await getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
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
    await contractEndFail(instance);
  });
});


contract('DKG justified complaint - private commitment', async (accounts) => {

  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await join(instance, accounts, corruptedData.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await commit(instance, accounts, 
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
      return await complainPrvCommitment(instance, accounts, complainer, accused, corruptedData.sks[complainer]);
    }
    let res = await getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
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
    await contractEndFail(instance);
  });
});


contract('DKG justified complaint - public commitment', async (accounts) => {

  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await postDeploy(instance);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    await join(instance, accounts, corruptedData.pks);
  });

  it("Commit", async () => {
    let instance = await dkg.deployed();
    await commit(instance, accounts, 
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
      return await complainPubCommitment(instance, accounts, complainer, accused, complainPubCommitIndex);
    }
    let res = await getAccountsBalancesDiffAfterFunc(instance, accounts, funcComplain);
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
    await contractEndFail(instance);
  });
});




/**
 * Asserts the instance's phase is phaseNum.
 * @param {number} phaseNum 
 * @param {*} instance 
 */
async function verifyPhase(phaseNum, instance) {
  let curPhase = await instance.curPhase.call();
  assert.equal(phaseNum, curPhase.toNumber(), 
    util.format("should be in phase number %s but in phase %s", phaseNum, curPhase.toNumber()));
}

/**
 * Returns true iff the elements of 2 arrays are equal.
 * @param {Object[]} p1 
 * @param {Object[]} p2 
 */
function isEqualPoints(p1, p2) {
  if (p1.length == p2.length)
  {
    for(var i = 0; i < p1.length; i++) {
      if(p1[i] != p2[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
} 

/**
 * Mines numOfBlockToMine at once.
 * @param {number} numOfBlockToMine 
 * @param {*} cb 
 */
function forceMineBlocks(numOfBlockToMine) {
  var mineArr = [];
  for (var i = 0; i < numOfBlockToMine; i++) {
    mineArr.push(async.apply(web3.currentProvider.sendAsync, {
      jsonrpc: "2.0",
      method: "evm_mine",
      id: 12345
    }));
  }
  return new Promise( (resolve, reject) => {
    async.parallel(mineArr, (err) => { resolve() });
  });
}


async function postDeploy(instance) {
  let n = await instance.n.call();
  let t = await instance.t.call();
  assert(n > t, "the number of participants should be bigger than the threshold");
}


async function join(instance, accounts, pks) {
  let n = await instance.n.call();
  let numOfParticipants = n.toNumber();
  let indices = _.range(1, numOfParticipants+1);
  let deposit = await instance.depositWei.call();

  await verifyPhase(phase.enrollment, instance);
      
  for (var i = 0; i < numOfParticipants; i++) {
    let args = [
      pks[i], 
      {from: accounts[i], value: deposit}
    ];
    
    let index = await instance.join.call(args[0], args[1]);
    await instance.join(args[0], args[1]);
    assert.equal(indices[i], index.toNumber(), "error in index returned for participant");

    let pkEnc = await instance.getParticipantPkEnc.call(index);
    assert(isEqualPoints(pkEnc.map(x => x.toNumber()), pks[i]), "PK for encryption error")
  }

  let expectedBalance = deposit*numOfParticipants;
  await verifyContractBalance(expectedBalance);
}


async function commit(instance, accounts, pubCommitG1Data, pubCommitG2Data, prvCommitEncData) {
  let n = await instance.n.call();
  let numOfParticipants = n.toNumber();
  let indices = _.range(1, numOfParticipants+1);
  let t = await instance.t.call();
  let threshold = t.toNumber();

  await verifyPhase(phase.commit, instance);

  for (var i = 0; i < numOfParticipants; i++) {
    let args = [
      indices[i],
      _.flatMap(pubCommitG1Data[i]),
      _.flatMap(pubCommitG2Data[i]),
      prvCommitEncData[i],
      {from: accounts[i]}];
    await instance.commit(args[0], args[1], args[2], args[3], args[4]);

    for (var j = 0; j < threshold+1; j++) {
      let pubCommitG1 = await instance.getParticipantPubCommitG1.call(indices[i], j);        
      assert(isEqualPoints(pubCommitG1.map(x => x.toNumber()), pubCommitG1Data[i][j]), 
        util.format("error in public commitment G1 of %s to coefficient %s", indices[i], j));
      
      let pubCommitG2 = await instance.getParticipantPubCommitG2.call(indices[i], j);
      assert(isEqualPoints(pubCommitG2.map(x => x.toNumber()), pubCommitG2Data[i][j]), 
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


async function postCommit(instance, callerAccount) {
  await verifyPhase(phase.postCommit, instance);
  return await phaseChange(instance, callerAccount);
}


async function phaseChange(instance, callerAccount) {
  let timeout = await instance.commitTimeout.call(); 
  await forceMineBlocks(timeout.toNumber());
  let arg = callerAccount ? {from: callerAccount} : {};
  let res = await instance.phaseChange(arg);
  return res.receipt.gasUsed;
}


async function contractEndSuccess(instance) {
  await verifyPhase(phase.endSuccess, instance);
  await verifyContractBalance(0);
}


async function verifyContractBalance(expectedBalance) {
  let contractBalance = await web3.eth.getBalance(dkg.address);
  assert.equal(
    expectedBalance, contractBalance.toNumber(), 
    util.format(
      "contract balance is %s while expected balance is %s", 
      contractBalance.toNumber(), expectedBalance
  ));
}


async function contractEndFail(instance) {
  await verifyPhase(phase.endFail, instance);
  await verifyContractBalance(0);
  await assertError(phaseChange(instance), errTypes.revert);
}


async function complainPrvCommitment(instance, accounts, complainerIndex, accusedIndex, complainerSk) {
  await verifyPhase(phase.postCommit, instance);
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
  await verifyPhase(phase.postCommit, instance);
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


async function getAccountsBalancesDiffAfterFunc(instance, accounts, func) {
  
  let n = await instance.n.call();
  let numOfParticipants = n.toNumber();

  let balancesBefore = [];
  for (var i = 0; i < numOfParticipants; i++) {
    let balance = await web3.eth.getBalance(accounts[i]);
    balancesBefore.push(balance.toNumber());
  }

  let gasUsed = await func();

  let balancesAfter = [];
  for (var i = 0; i < numOfParticipants; i++) {
    let balance = await web3.eth.getBalance(accounts[i]);
    balancesAfter.push(balance.toNumber() - balancesBefore[i]);
  }
  return {
    balancesAfter,
    gasUsed
  };
}


async function assertError(promise, errorType) {
  try {
    await promise;
    throw null;
  }
  catch (error) {
    assert(error, "Expected an error but did not get one");
    assert(error.message.startsWith(EXCEPTION_PREFIX + errorType), 
      util.format("Expected an error starting with %s but got %s instead", 
      EXCEPTION_PREFIX + errorType, error.message));
  }
}