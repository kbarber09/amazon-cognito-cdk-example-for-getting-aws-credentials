#!/usr/bin/env bash

set -e
source ./env.sh

echo "this will run npm install in all relevant sub-folders, build the project, and install the CDK toolkit"

cd ./cdk
npm install --silent
npm run cdk-bootstrap

cd ../ui-react
npm install --silent

cd ..
./build.sh
