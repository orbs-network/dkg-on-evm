const dkg = artifacts.require("./dkg_OPT.sol");
const util = require('util');
const happyFlow = require('./dkg/happyFlow.js');
const pubPrivComplaint = require('./dkg/pubPrivComplaint.js');

const params = require('../test/testsData/params.js');
const n = params.n;
const t = params.t;

const complaintData = require(
    util.format('./testsData/t%sn%s/pubPrivComplaintData.js', t,n));


contract('Interactive public-private commitment complaint - justified', async (accounts) => {
    accounts.shift(); // the first account will only deploy the contract

    it("Post-Deploy check", async() => {
        let instance = await dkg.deployed();
        await happyFlow.postDeploy(instance, complaintData.params);
      });
    
    it("Join", async() => {
    let instance = await dkg.deployed();
    let gasUsedAll = await happyFlow.join(instance, accounts, 
        complaintData.dkgData.encPks, complaintData.dkgData.merkleCommit);
    });
    

    it("Post join - until all data received", async() => {
    let instance = await dkg.deployed();
    let gasUsed = await happyFlow.postEnrollment(instance);
    });

    it("Complain", async() => {
    let instance = await dkg.deployed();
    let gasUsed = await pubPrivComplaint.complain(instance, accounts,
        complaintData.complaint.challenger, complaintData.complaint.accused);
    });

    it("Interactive dispute", async() => {
        let instance = await dkg.deployed();
        let challengerIndex = complaintData.complaint.challenger;
        let accusedIndex = complaintData.complaint.accused;
        let res = 
            await pubPrivComplaint.initiateInteractiveDispute(instance, accounts, 
                challengerIndex, accusedIndex,
                complaintData.complaint.calculations.aggregated_commitments[accusedIndex-1]);
        console.log("Gas: " + res.gasAll);
        console.log("accusedNumTxs: " + res.countAccusedTxs);
        console.log("challengerNumTxs: " + res.countChallengerTxs);
    });

    it("Seal the dispute", async() => {
        let instance = await dkg.deployed();
        let challengerIndex = complaintData.complaint.challenger;
        let accusedIndex = complaintData.complaint.accused;
        let gasAll = await pubPrivComplaint.disputeClosure(instance, accounts,
            challengerIndex, accusedIndex,
            complaintData.dkgData.prvCommitEnc[accusedIndex-1][challengerIndex-1],
            complaintData.dkgData.encSks[challengerIndex-1]);
        console.log("Gas: " + gasAll);
    });
});


// TODO: a lot code reuse - from the last contract... 
contract('Interactive public-private commitment complaint - unjustified', async (accounts) => {
    // accounts.shift(); // the first account will only deploy the contract

    it("Post-Deploy check", async() => {
        let instance = await dkg.deployed();
        await happyFlow.postDeploy(instance, complaintData.params);
      });
    
    it("Join", async() => {
    let instance = await dkg.deployed();
    let gasUsedAll = await happyFlow.join(instance, accounts, 
        complaintData.dkgData.encPks, complaintData.dkgData.merkleCommit);
    });
    

    it("Post join - until all data received", async() => {
    let instance = await dkg.deployed();
    let gasUsed = await happyFlow.postEnrollment(instance);
    });

    it("Complain", async() => {
    let instance = await dkg.deployed();
    let challengerIndex = complaintData.complaint.accused;
    let accusedIndex = complaintData.complaint.challenger;
    let gasUsed = await pubPrivComplaint.complain(instance, accounts,
        challengerIndex, accusedIndex);
    });

    it("Interactive dispute", async() => {
        let instance = await dkg.deployed();
        let challengerIndex = complaintData.complaint.accused;
        let accusedIndex = complaintData.complaint.challenger;
        let res = 
            await pubPrivComplaint.initiateInteractiveDispute(instance, accounts, 
                challengerIndex, accusedIndex,
                complaintData.complaint.calculations.aggregated_commitments[accusedIndex-1]);
        console.log("Gas: " + res.gasAll);
        console.log("accusedNumTxs: " + res.countAccusedTxs);
        console.log("challengerNumTxs: " + res.countChallengerTxs);
    });

    it("Seal the dispute", async() => {
        let instance = await dkg.deployed();
        let challengerIndex = complaintData.complaint.accused;
        let accusedIndex = complaintData.complaint.challenger;
        let gasAll = await pubPrivComplaint.disputeClosure(instance, accounts,
            challengerIndex, accusedIndex,
            complaintData.dkgData.prvCommitEnc[accusedIndex-1][challengerIndex-1],
            complaintData.dkgData.encSks[challengerIndex-1]);
        console.log("Gas: " + gasAll);
    });
});