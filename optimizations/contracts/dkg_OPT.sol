pragma solidity ^0.5.0;

import "./ecOps.sol";

contract dkg_OPT {

    /** 
     * DKG phases (optimistic case):
     * 
     * 0) Deploy the contract with a threshold (t), number of participants (n) 
     * and deposit in Wei.
     * 
     * 1) Enrollment - Each of the participants sends a deposit and a public key 
     * address (for encryption purpose) that he owns (i.e., has the corresponding 
     * secret key). At the end of the enrollment each participant receives an
     * unique index (1,...,n) that would be used with his identity for the rest
     * of the DKG protocol and the threshold signature scheme.
     *
     * (not on the contract) - each participant generates t+1 random sampled 
     * coefficients from the (mod q) field.
     *
     * 2) Each of the participants sends its public commitments (the generator 
     * exponentiated with t+1 coefficients) and encrypted private commitments 
     * for all of the other particpants.
     *
     * After all have validly committed each of the participant can take the
     * committed data and locally compute the followings:
     *  a) its own secret key and public key;
     *  b) the public keys for the rest of the participants;
     *  c) the group's public key (no one would know the corresponding secret 
     *     key);
     * With the above data each participant is able to sign, verify signature- 
     * shares and reconstruct from t+1 signatures the group signature.
     * 
     *
     *
     * In case one (or more) of the participants deviates from the instructions
     * of the protocol, we enable the other participants to file a complaint to
     * the contract. Such a complaint would terminate the DKG protocol with a
     * failure. Once a complaint is filed, a code is run to check the validity of
     * the complaint. When done the code decides which participant's deposit to 
     * slash and divide it among the other participants ("code is law").
     *
     * Each participant can send a complaint tx about one of the followings:
     *  a) 2 distinct participants offered the same public commitment
           (one is enough). (TODO)
     *  b) Some participant offered invalid commitment (invalid is: 
     *     duplicated, insufficient, unmatching commitments G1 to G2)
     *  c) Umatched private and public commitments.
     *  d) Time out.
     *
     */


    /**
     * Important note: at this point this contract purpose is as a
     * POC only, therefore its security is unreliable.
     */


    struct Participant {
        address payable ethPk; // Ethereum pk
        uint256[2] encPk; // pk for encryption
        bytes32 commit; // Merkle root of the public commitments
        bool allReceived; // True iff the participant send all is commitments on-chain 
    }

    enum Phase { 
        Enrollment, PostEnrollment, AllDataReceived, 
        AllDataValid, PostGroupPK, Complaint, EndSuccess, EndFail 
    }

    enum SubShareComplaintPhase {
        AccusedTurn, ChallengerTurn, AllAgree
    }

    event PhaseChange(
        Phase phase
    );
    
    event ParticipantJoined(
        uint32 index
    );


    Phase public curPhase;
    
     
    //uint256 public constant a = 0;
    //uint256 public constant b = 3;

    // G1 generator (on the curve)
    uint256[2] public g1 = [
        0x0000000000000000000000000000000000000000000000000000000000000001, 
        0x0000000000000000000000000000000000000000000000000000000000000002
    ];
    // G2 generator (on the curve)
    uint256[4] public g2 = [
        0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2, 
        0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed,
        0x90689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b,
        0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa
    ];

    uint256 public depositWei;
    

    uint32 public t; // threshold
    uint32 public n; // numer of participants;
    uint32 public curN; // current num of participants
    
    
    uint256 public phaseStart;
    uint256 public constant joinTimeout = 12;
    uint256 public constant postEnrollmentTimeout = 5;
    uint256 public constant allDataReceivedTimeout = 11;
    uint256 public constant postGroupPkTimeout = 5;

    uint256[4] public groupPk;
    uint32 public groupPkSubmitterIndex;


    // mapping from node's index to a participant
    mapping (uint32 => Participant) public participants;


    constructor(uint32 threshold, uint32 numParticipants, uint deposit) public 
    {
        t = threshold;
        n = numParticipants;
        depositWei = deposit;
        curPhase = Phase.Enrollment;

        require(n > t && t > 0, "wrong input");

        phaseStart = block.number;
    }



    modifier checkDeposit() {
        require(msg.value == depositWei, "wrong deposit");
        _;
    }
    modifier checkAuthorizedSender(uint32 index) {
        require(participants[index].ethPk == msg.sender, "not authorized sender");
        _; 
    }
    modifier beFalse(bool term) {
        require(!term);
        _;
    }
    modifier inPhase(Phase phase) {
        require(curPhase == phase, "wrong phase");
        _;
    }
    modifier notInPhase(Phase phase) {
        require(curPhase != phase, "wrong phase");
        _;
    }
    


    // Join the DKG (enrollment - phase 1).
    //
    // A point on G1 that represents this participant's pk for encryption have
    // to be published. The publisher have to know the secret that generates
    // this point.
    function join(uint256[2] calldata encPk, bytes32 merkleCommit) 
        checkDeposit()
        inPhase(Phase.Enrollment)
        external payable 
        returns(uint32 index)
    {

        uint32 cn = curN;
        address payable sender = msg.sender;


        cn++;
        participants[cn] = Participant({
            ethPk: sender, encPk: encPk, commit: merkleCommit, allReceived: false});

        curN = cn;
        if(cn == 1) {
            phaseStart = block.number;
        } 
        
        emit ParticipantJoined(cn);

        // Abort if capacity on participants was reached
        if(cn == n) {
            phaseStart = block.number;
            curPhase = Phase.PostEnrollment;
            emit PhaseChange(Phase.PostEnrollment);
        }

        return cn;
    }    
    

    

    // Call this when in Phase.Enrollment for more than joinTimeout
    // blocks and not enough members have joined.
    function joinTimedOut() 
        inPhase(Phase.Enrollment)
        external 
    {
        uint curBlockNum = block.number;

        require(curBlockNum > (phaseStart+joinTimeout), "hasn't reached timeout yet");
        curPhase = Phase.EndFail; 
        emit PhaseChange(Phase.EndFail);
        slash(0);  
    }



    // Call this to progress the contract to the next phase.
    // Up to this time any participant can complain for not receiving data.
    function postEnrollmentTimedOut() 
        inPhase(Phase.PostEnrollment)
        external 
    {
        require(missingDataIndex == 0, "waiting to receive data from some participant");
        uint curBlockNum = block.number;

        require(curBlockNum > (phaseStart+postEnrollmentTimeout), "hasn't reached timeout yet");
        phaseStart = block.number;
        curPhase = Phase.AllDataReceived; 
        emit PhaseChange(Phase.AllDataReceived);
    }


    // Call this to progress the contract to the next phase.
    // Up to this time any participant can complain for not having valid data data.
    function dataReceivedTimedOut() 
        inPhase(Phase.AllDataReceived)
        external 
    {
        uint curBlockNum = block.number;

        require(curBlockNum > (phaseStart+allDataReceivedTimeout), "hasn't reached timeout yet");
        curPhase = Phase.AllDataValid; 
        emit PhaseChange(Phase.AllDataValid);
    }


    function submitGroupPK(uint256[4] calldata pk, uint32 index) 
        inPhase(Phase.AllDataValid)
        checkAuthorizedSender(index)
        external 
    {
        groupPk = pk;
        groupPkSubmitterIndex = index;
        phaseStart = block.number;
        curPhase = Phase.PostGroupPK; 
        emit PhaseChange(Phase.PostGroupPK);
    }


    // Call this when in Phase.PostGroupPK for more than postGroupPKTimeout
    // blocks and no complaint has been made.
    function postGroupPkTimedOut() 
        inPhase(Phase.PostGroupPK)
        external 
    {
        
        uint curBlockNum = block.number;

        require(curBlockNum > (phaseStart+postGroupPkTimeout), "hasn't reached timeout yet");
        curPhase = Phase.EndSuccess; 
        emit PhaseChange(Phase.EndSuccess);
        // slash(0); don't retrive the participant their deposit yet  
    }


    // Divides the deposited balance in the contract between
    // the enrolled participants except for the participant
    // with the slashedIndex. Send slashedIndex = 0 in order
    // to divide it between all the participants (no slashing).
    function slash(uint32 slashedIndex) private {
        
        uint32 nParticipants = curN;
        uint256 amount;
        if (slashedIndex == 0) {
            amount = address(this).balance/nParticipants;
        }
        else {
            amount = address(this).balance/(nParticipants-1);
        }

        for (uint32 i = 1; i < (nParticipants+1); i++) {
            if (i != slashedIndex) {
                participants[i].ethPk.transfer(amount);
            }
        }
    }
    
    
    function decrypt(uint256[2] memory encrypterPk, uint256 decrypterSk, bytes32 encData)
        internal
        returns(bytes32 decryptedData)
    {
        bytes32 secret = keccak256(abi.encodePacked(ecOps.ecmul(encrypterPk, decrypterSk)));
        return encData^secret;
    }


    function verifySignature(address p, bytes32 hsh, uint8 v, bytes32 r, bytes32 s) public pure returns(bool) {
        // Note: this only verifies that signer is correct.
        // You'll also need to verify that the hash of the data
        // is also correct.
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, hsh));
        return ecrecover(prefixedHash, v, r, s) == p;
    }

/////////////////////////////////////////////////////////////////////////////
    event DataReceived(
        uint32 index,
        uint256[] pubCommitG1, 
        uint256[] pubCommitG2, 
        uint256[] encPrCommit
    );

    uint32 public missingDataIndex;
    uint256 public constant missingDataTimeout = 12;
    uint256 public complainStart;

    function complainDataMissing(uint32 accusedIndex)
        inPhase(Phase.PostEnrollment)
        external
    {
        if (!participants[accusedIndex].allReceived)
        {
            missingDataIndex = accusedIndex;
            complainStart = block.number;
        }
    }


    function dataMissingTimeout()
        inPhase(Phase.PostEnrollment)
        external
    {
        uint256 curBlock = block.number;
        require((missingDataIndex > 0) && (curBlock > complainStart + missingDataTimeout),"");

        slash(missingDataIndex);
        curPhase = Phase.EndFail; 
        emit PhaseChange(Phase.EndFail);
    }


    function postMissingData(
        uint256[] calldata pubCommitG1, uint256[] calldata pubCommitG2, uint256[] calldata encPrCommit )
        checkAuthorizedSender(missingDataIndex)
        external
    {
        require(
            pubCommitG1.length == (t*2 + 2)
            && pubCommitG2.length == (t*4 + 4)
            && encPrCommit.length == n-1, 
            "input size invalid");

        // Add signatures

        emit DataReceived(missingDataIndex, pubCommitG1, pubCommitG2, encPrCommit);
        missingDataIndex = 0;


    }



///////////////////////// Complaint: PubPriv ////////////////////////////////
    uint32 public challenger;
    uint32 public accused;

    int64 public l;
    int64 public h;
    uint256[2] public lastAgree;
    uint256[2] public lastDisagree;
    uint256[2] public temp;
    SubShareComplaintPhase public curComplaintPhase;

    modifier inComplaintPhase(SubShareComplaintPhase phase) {
        require(curComplaintPhase == phase, "wrong complaint phase");
        _;
    }

    function complainPubPrivData(uint32 challengerIndex, uint32 accusedIndex)
        checkAuthorizedSender(challengerIndex)
        inPhase(Phase.AllDataReceived)
        external
    {
        phaseStart = block.number;
        curPhase = Phase.Complaint; 
        emit PhaseChange(Phase.Complaint);
        challenger = challengerIndex;
        accused = accusedIndex;
        l = -1;
        h = t+1;
        curComplaintPhase = SubShareComplaintPhase.AccusedTurn;
    }

    function complaintAccusedTurn(uint256[2] calldata zeta)
        checkAuthorizedSender(accused)
        inComplaintPhase(SubShareComplaintPhase.AccusedTurn)
        external
    {
        temp = zeta;
        curComplaintPhase = SubShareComplaintPhase.ChallengerTurn;
    }


    function complaintChallengerTurn(bool isAgree)
        checkAuthorizedSender(challenger)
        inComplaintPhase(SubShareComplaintPhase.ChallengerTurn)
        external
    {
        if(isAgree) {
            lastAgree = temp;
            if ((h-l) % 2 == 1) {
                l += (h-l)/2 + 1;
            } 
            else {
                l += (h-l)/2;
            }
            
        }
        else {
            lastDisagree = temp;
            h = l + (h-l)/2;
        }

        if ((h-l) <= 1) {
            
            if (l == -1) {
                // The case they always disagree
                revert();
            }
            else if (h == t+1) {
                // The case they always agree
                curComplaintPhase = SubShareComplaintPhase.AllAgree;
            }
            else {
                // The case they (at least once) agree and disagree
                revert();
            }
        }
        else {
            curComplaintPhase = SubShareComplaintPhase.AccusedTurn;
        }
    }


    function agreeUponAll(uint256 encrypted, uint8 v, bytes32 r, bytes32 s, uint256 challengerSk)
        checkAuthorizedSender(challenger)
        inComplaintPhase(SubShareComplaintPhase.AllAgree)
        external 
        returns(uint32 slashed)
    {
        // Check the challenger is not lying about its sk
        uint256[2] memory allegedChallengerPk = ecOps.ecmul(g1, challengerSk);
        if (!ecOps.isEqualPoints(allegedChallengerPk, participants[challenger].encPk)) {
            //slash(challenger);
            revert();
        }
         
        address accusedAddress = participants[accused].ethPk;
        uint256[2] memory accusedEncPk = participants[accused].encPk;

        // Check the encrypted data is signed by the accused
        bytes32 hashEnc = keccak256(abi.encodePacked(bytes32(encrypted)));
        if (!verifySignature(accusedAddress, hashEnc, v, r,s)) {
            //slash(challenger);
            revert();
        }

        uint256 prvCommit = uint256(decrypt(accusedEncPk, challengerSk, bytes32(encrypted)));
        
        if (!ecOps.isEqualPoints(ecOps.ecmul(g1, prvCommit), lastAgree)) {
            slashed = accused;
            // revert();
        }
        else {
            slashed = challenger;
            // revert();
        }
        slash(slashed);

        curPhase = Phase.EndFail; 
        emit PhaseChange(Phase.EndFail);
    }



////////////////////////////////////////////////////////////////////////////

    function getParticipantPkEnc(uint32 participantIndex) 
        view 
        external 
        returns(uint256[2] memory encPk)
    {
        return participants[participantIndex].encPk;
    }


    function getParticipantMerkleCommit(uint32 participantIndex) 
        view 
        external 
        returns(bytes32 merkleCommit)
    {
        return participants[participantIndex].commit;
    }


    function getGroupPK()
        view
        external
        returns(uint256[4] memory pk)
    {
        return groupPk;
    }

}