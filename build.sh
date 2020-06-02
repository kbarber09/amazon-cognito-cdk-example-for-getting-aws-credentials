#!/usr/bin/env bash

set -e
source ./env.sh

cd ./cdk
npm run build 
cd ..
echo "Build successful"
