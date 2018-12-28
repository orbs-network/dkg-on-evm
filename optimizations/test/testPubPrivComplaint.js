const dkg = artifacts.require("./dkg_OPT.sol");
const util = require('util');
const general = require('./dkg/general.js');
const happyFlow = require('./dkg/happyFlow.js');
const pubPrivComplaint = require('./dkg/pubPrivComplaint.js');

const params = require('../test/testsData/params.js');
const n = params.n;
const t = params.t;

const complaintData = require(
    util.format('./testsData/t%sn%s/pubPrivComplaintData.js', t,n));


async function postDeploy() {
    let instance = await dkg.deployed();
    await happyFlow.postDeploy(instance, complaintData.params);
}

async function join(accounts) {
    let instance = await dkg.deployed();
    let gasUsedAll = await happyFlow.join(instance, accounts, 
        complaintData.dkgData.encPks, complaintData.dkgData.merkleCommit);
}

async function postJoin() {
    let instance = await dkg.deployed();
    let gasUsed = await happyFlow.postEnrollment(instance);
}


async function complainOnPubPrvCommitment(accounts, challengerIndex, accusedIndex) {
    let instance = await dkg.deployed();
    let gasUsed = await pubPrivComplaint.complain(instance, accounts,
        challengerIndex, accusedIndex);

}


async function pubPrvInteractiveDispute(accounts, challengerIndex, accusedIndex) {
    let instance = await dkg.deployed();
    let res = 
        await pubPrivComplaint.initiateInteractiveDispute(instance, accounts, 
            challengerIndex, accusedIndex,
            complaintData.complaint.calculations.prvCommitCalc[accusedIndex-1].aggregated_commitments[challengerIndex-1]);
    console.log("Gas: " + res.gasAll);
    console.log("accusedNumTxs: " + res.countAccusedTxs);
    console.log("challengerNumTxs: " + res.countChallengerTxs);
}



async function closePubPrvDispute(accounts, challengerIndex, accusedIndex, indexToSlash) {
    let instance = await dkg.deployed();
    // let challengerIndex = complaintData.complaint.challenger;
    // let accusedIndex = complaintData.complaint.accused;
    let res = await pubPrivComplaint.disputeClosure(instance, accounts,
        challengerIndex, accusedIndex,
        complaintData.dkgData.prvCommitEnc[accusedIndex-1][challengerIndex-1],
        complaintData.dkgData.encSks[challengerIndex-1]);
    assert.equal(res.slashed, indexToSlash, "slashed the wrong player!");
    console.log("Gas: " + res.gasAll);
}

contract('Interactive public-private commitment complaint - justified', async (accounts) => {
    // accounts.shift(); // the first account will only deploy the contract

    let challengerIndex = complaintData.complaint.challenger;
    let accusedIndex = complaintData.complaint.accused;

    it("Post-Deploy check", postDeploy);
    
    it("Join", join.bind(this, accounts));

    it("Post join - until all data received", postJoin);

    it("Complain", 
        complainOnPubPrvCommitment.bind(this, accounts, challengerIndex, accusedIndex));

    it("Interactive dispute", 
        pubPrvInteractiveDispute.bind(this, accounts, challengerIndex, accusedIndex));

    it("Seal the dispute", 
        closePubPrvDispute.bind(this, accounts, challengerIndex, accusedIndex, accusedIndex));
});




contract('Interactive public-private commitment complaint - unjustified', async (accounts) => {
    // accounts.shift(); // the first account will only deploy the contract

    let challengerIndex = complaintData.complaint.accused;
    let accusedIndex = complaintData.complaint.challenger;

    it("Post-Deploy check", postDeploy);
    
    it("Join", join.bind(this, accounts));

    it("Post join - until all data received", postJoin);

    it("Complain", 
        complainOnPubPrvCommitment.bind(this, accounts, challengerIndex, accusedIndex));


    it("Interactive dispute", 
        pubPrvInteractiveDispute.bind(this, accounts, challengerIndex, accusedIndex));

    it("Seal the dispute", 
        closePubPrvDispute.bind(this, accounts, challengerIndex, accusedIndex, challengerIndex));
});