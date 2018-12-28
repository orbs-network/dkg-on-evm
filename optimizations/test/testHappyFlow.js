const dkg = artifacts.require("./dkg_OPT.sol");
const general = require('./dkg/general.js');
const util = require('util');
const happyFlow = require('./dkg/happyFlow.js');
const params = require('../test/testsData/params.js');
const n = params.n;
const t = params.t;

const happyFlowData = require(util.format('./testsData/t%sn%s/happyFlowData.js', t,n));



contract('DKG happy-flow', async (accounts) => {
  // accounts.shift(); // the first account will only deploy the contract
  
  it("Post-Deploy check", async() => {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance, happyFlowData.params);
  });

  it("Join", async() => {
    let instance = await dkg.deployed();
    let gasUsedAll = await happyFlow.join(instance, accounts, 
      happyFlowData.dkgData.encPks, happyFlowData.dkgData.merkleCommit);
  });
  

  it("Post join - until all data received", async() => {
    let instance = await dkg.deployed();
    let gasUsed = await happyFlow.postEnrollment(instance);
  });


  it("Post join - until all data is valid", async() => {
    let instance = await dkg.deployed();
    let gasUsed = await happyFlow.postDataReceived(instance);
  });


  it("Submit group PK", async () => {
    let instance = await dkg.deployed();
    let gasUsed = await happyFlow.submitGroupPk(instance, accounts, 
      happyFlowData.postDkg.groupPK, 0);
    
  });


  it("Post submit group PK", async () => {
    let instance = await dkg.deployed();
    let gasUsed = await happyFlow.postGroupPk(instance);
  });


  it("Check DKG ended successfully", async () => {
    let instance = await dkg.deployed();
    await happyFlow.contractEndSuccess(instance);
  });
});










