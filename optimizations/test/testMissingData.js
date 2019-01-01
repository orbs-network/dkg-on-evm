const dkg = artifacts.require("./dkg_OPT.sol");
const util = require('util');
const general = require('./dkg/general.js');
const happyFlow = require('./dkg/happyFlow.js');
const missingData = require('./dkg/missingDataComplaint.js');


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
    
    async function complainMissingData(accounts, challengerIndex, accusedIndex) {
        let instance = await dkg.deployed();
        let gasUsed = await missingData.complain(instance, accounts, challengerIndex, accusedIndex);
    }

    async function postData(accounts, accusedIndex) {
        let instance = await dkg.deployed();
        let gasUsed = await missingData.postMissingData(instance, accounts, accusedIndex, 
            complaintData.dkgData.pubCommitG1[accusedIndex-1], complaintData.dkgData.pubCommitG2[accusedIndex-1], 
            complaintData.dkgData.prvCommitEnc[accusedIndex-1]);
        console.log(gasUsed);   
    }

    async function postDataSingleSig(accounts, accusedIndex) {
        let instance = await dkg.deployed();
        let gasUsed = await missingData.postMissingDataSingleSignature(instance, accounts, accusedIndex, 
            complaintData.dkgData.pubCommitG1[accusedIndex-1], complaintData.dkgData.pubCommitG2[accusedIndex-1], 
            complaintData.dkgData.prvCommitEnc[accusedIndex-1]);
        console.log(gasUsed);   
    }

contract('Missing data complaint - accused shows up and honest', async (accounts) => {
    // accounts.shift(); // the first account will only deploy the contract

    let challengerIndex = complaintData.complaint.challenger;
    let accusedIndex = complaintData.complaint.accused;

    it("Post-Deploy check", postDeploy);
    
    it("Join", join.bind(this, accounts));

    it("Complain missing data", complainMissingData.bind(this, accounts, challengerIndex, accusedIndex));

    it("Post valid data", postData.bind(this, accounts, accusedIndex));
});


contract('Missing data complaint - accused shows up and honest', async (accounts) => {
    // accounts.shift(); // the first account will only deploy the contract

    let challengerIndex = complaintData.complaint.challenger;
    let accusedIndex = complaintData.complaint.accused;

    it("Post-Deploy check", postDeploy);
    
    it("Join", join.bind(this, accounts));

    it("Complain missing data", complainMissingData.bind(this, accounts, challengerIndex, accusedIndex));

    it("Post valid data with single signature", postDataSingleSig.bind(this, accounts, accusedIndex));
});