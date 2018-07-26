#!/usr/bin/env bash

balance=10000000000000000000000000000
accounts=""

acc=( \
    0x11c98b8fa69354b26b5db98148a5bc4ef2ebae8187f651b82409f6cefc9bb0b8 \
    0xc5db67b3865454f6d129ec83204e845a2822d9fe5338ff46fe4c126859e1357e \
    0x6ac1a8c98fa298af3884406fbd9468dca5200898f065e1283fc85dff95646c25 \
    0xbd9aebf18275f8074c53036818e8583b242f9bdfb7c0e79088007cb39a96e097 \
    0x8b727508230fda8e0ec96b7c9e51c89ff0e41ba30fad221c2f0fe942158571b1 \
    0x514111937962a290ba6afa3dd0044e0720148b46cd2dbc8045e811f8157b6b1a \
    0x52f21c3eedc184eb13fcd5ec8e45e6741d97bca85a8703d733fab9c19f5e8518 \
    0xbca3035e18b3f87a38fa34fcc2561a023fe1f9b93354c04c772f37497ef08f3e \
    0x2d8676754eb3d184f3e9428c5d52eacdf1d507593ba50c3ef2a59e1a3a46b578 \
    0xabf8c2dd52f5b14ea437325854048e5daadbca80f99f9d6f8e97ab5e05d4f0ab \
    )

# Prepare a ganache accounts parameter string like --account="0x11c..,1000" --account="0xc5d...,1000" ....
for a in ${acc[@]}; do
  accounts=$accounts" --account=${a},${balance}"
done

# Helper funcs.

# Test if ganache is running on port $1.
# Result is in $?
ganache_running() {
  nc -z localhost $1
}

# Kills ganache process with its PID in $ganache_pid.
cleanup() {
  echo "cleaning up"
  # Kill the ganache instance that we started (if we started one).
  if [ -n "$ganache_pid" ]; then
    kill -9 $ganache_pid
  fi
}

