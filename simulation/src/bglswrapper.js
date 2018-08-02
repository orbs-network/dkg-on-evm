const {execSync} = require('child_process');
const CWD = __dirname;
const EXEC_PATH = `${CWD}/../simulation`;
// const OUTPUT_PATH = `${CWD}/../commit_data.json`;
const {createLogger, format, transports} = require('winston');


const SHOW_DEBUG = false;

const logger = createLogger({
  format: format.json(),
  transports: [
    new transports.Console(({
      format: format.simple(),
      level: SHOW_DEBUG ? 'debug' : 'info'
    }))
    // new winston.transports.File({ filename: 'combined.log' })
  ]
});


function runExternal(cmd) {
  logger.info(`*** Calling external command ${cmd}`);
  return execSync(cmd, {cwd: CWD}, {stdio: [0, 1, 2]});
}

// id is 1-based
function GetCommitDataForSingleParticipant(id, threshold, clientCount, sk, pks) {
  const pksStr = JSON.stringify(pks);
  const cmd = `${EXEC_PATH} -func=GetCommitDataForSingleParticipant ${id} ${threshold} ${clientCount} ${sk} ${pksStr}`;
  const resStr = runExternal(cmd);
  const res = JSON.parse(resStr);
  return res;
}

function getPKsStr(clientsData, clientsCount) {
  const pks = [];
  for(let i=0; i<clientsCount; i++) {
    pks.push(clientsData[i].pk);
  }
  const pksStr = _.flatMap(pks).join(",");
  return pksStr;
}

function GetCommitDataForAllParticipants(threshold, clientsData, clientsCount) {

  const allData = [];
  const pksStr = getPKsStr(clientsData, clientsCount);

  logger.info(`Will call get commit data with these ${clientsCount} pks: ${pksStr}`);
  for(let i=0; i<clientsCount; i++) {
    const sk = clientsData[i].sk;
    logger.info(`Calling GetCommitDataForSingleParticipant with index: ${i+1} t: ${threshold} n: ${clientsCount} sk: ${sk}`);
    const commitDataPerClient = GetCommitDataForSingleParticipant(i+1, threshold, clientsCount, sk, pksStr);
    allData.push(commitDataPerClient);
  }

  return allData;

}

// Data is written to outputPath
function GetCommitDataForAllParticipants_(threshold, clientCount, outputPath) {
  const cmd = `${EXEC_PATH} -func=GetCommitDataForAllParticipants ${threshold} ${clientCount} ${outputPath}`;

  const res = runExternal(cmd);
  const json = require(outputPath);
  logger.debug(`GetCommitDataForAllParticipants(): Read data from file: ${JSON.stringify(json)}`);
  return res;
}

function GenerateKeyPair() {
  const cmd = `${EXEC_PATH} -func=GenerateKeyPair`;
  const buf = runExternal(cmd);
  logger.debug(`GenerateKeyPair(): Returned buffer: ${buf}`);
  return buf;
}

function VerifyPrivateCommitment(complainerIndex, accusedIndex, outputPath) {
  const cmd = `${EXEC_PATH} -func=VerifyPrivateCommitment ${complainerIndex} ${accusedIndex} ${outputPath}`;
  const buf = runExternal(cmd);
  logger.debug(`VerifyPrivateCommitment(): Returned buffer: ${buf}`);
  return buf;
}


// TODO: Call Go code that does all this:
// TODO: Find how Go can retain prvCommit, pubG1, pubG2 from previous run (maybe persist in file)

// Calculate SK (GetSecretKey - returns bigint) - run this for each client
// PKs (GetAllPublicKey - return []Point, one Point for each client)
// and group PK (GetGroupPublicKey - returns Point)

// Sign and reconstruct
// Call Sign(sk, msg) returns Point (the sig)
// Take sigs of clients [0,1,2] and [2,3,4] and call SigReconstruct(sigs, signerIndices (client.id from join()))
// REMEMBER: Indexes in Solidity start from 1, not 0.
// Returns the sig (Point) of the group
// SHOW THAT BOTH SIGS ARE THE SAME AND WE ARE DONE!


function SignAndVerify(threshold, clientCount, outputPath) {
  // const json = require(outputPath);
  const cmd = `${EXEC_PATH} -func=SignAndVerify ${threshold} ${clientCount} ${outputPath}`;
  const stdoutBuffer = runExternal(cmd);
  logger.info(stdoutBuffer.toString());
  return stdoutBuffer;
}


module.exports = {
  // GetCommitDataForSingleParticipant: GetCommitDataForSingleParticipant,
  GetCommitDataForAllParticipants: GetCommitDataForAllParticipants,
  // GetCommitDataForAllParticipantsWithIntentionalErrors: GetCommitDataForAllParticipantsWithIntentionalErrors,
  SignAndVerify: SignAndVerify,
  VerifyPrivateCommitment: VerifyPrivateCommitment,
  GenerateKeyPair: GenerateKeyPair,
  logger: logger
};