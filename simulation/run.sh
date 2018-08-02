#!/usr/bin/env bash

### Entry point for the BGLS demo ###
# If a Ganache instance is already running on GANACHE_PORT, the app will use it and not try to start a new instance, nor will it kill it when it's done.
# So you may run this script multiple times on an existing Ganache instance.
# Note though, that after 3 consecutive runs, your accounts might run out of ether (in the complaint flow where the accused client does not get its deposit back) so you will need to restart Ganache.


# Import common variables.
. scripts/common.sh

GANACHE_PORT=7545

CLIENT_COUNT=5 # 22
THRESHOLD=2 # 14
DEPOSIT_WEI=25000000000000000000
KEEP_GANACHE_ALIVE=false
DATA_FILE=$(pwd)/commit_data.json

### The happy flow is the default. Putting a nonzero value in all 3 indexes below will trigger the complaint flow.
### Uncomment to enable the complaint flow.

#COMPLAINER_INDEX=0 # 1-based, the client that complains about client ACCUSED_INDEX
#MALICIOUS_INDEX=0 # 1-based, the client that actually tainted its data
#ACCUSED_INDEX=0 # 1-based, the client that is accused by client COMPLAINER_INDEX of tainting its data





while getopts ":n:t:pk" opt; do
  case $opt in
    n)
      NODE_COUNT=$OPTARG
      ;;
    t)
      THRESHOLD=$OPTARG
      ;;
    p)
      GANACHE_PORT=$OPTARG
      ;;
    k)
      KEEP_GANACHE_ALIVE=true
      ;;
    c)
      COMPLAINER_INDEX=$OPTARG
      ;;
    m)
      MALICIOUS_INDEX=$OPTARG
      ;;
    a) ACCUSED_INDEX=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done

if [[ "$KEEP_GANACHE_ALIVE" = "false" ]] ; then
  echo "Will stop Ganache instance when exiting"
  trap cleanup EXIT
fi

if ganache_running $GANACHE_PORT; then
  echo "Ganache instance already running on port $GANACHE_PORT, using it."
else
  echo "Starting ganache instance"
  ../node_modules/.bin/ganache-cli --accounts ${CLIENT_COUNT} --deterministic --mnemonic "${MNEMONIC}" -p "$GANACHE_PORT" > ganache.log &
  ganache_pid=$!
  echo "Started ganache with pid $ganache_pid"
#  account_setup
fi

cmd="../node_modules/.bin/truffle exec src/app.js -n ${CLIENT_COUNT} -t ${THRESHOLD} -d ${DEPOSIT_WEI} -j ${DATA_FILE} -c ${COMPLAINER_INDEX} -m ${MALICIOUS_INDEX} -a ${ACCUSED_INDEX}"
echo "Running command: ${cmd}"
${cmd}

rc=$?
echo "Finished with rc=$rc"
if [[ $rc -ne 0 ]] ; then
  echo "Error enrolling and committing clients. Exiting."
  if [[ $ganache_pid -ne 0 ]] ; then
    echo "Ganache instance is still running, pid $ganache_pid"
  fi
  exit 1
fi

#./bls-bn-curve -func=SignAndVerify ${THRESHOLD} ${CLIENT_COUNT} ${DATA_FILE}


account_setup() {
  echo "Starting account setup"

}

