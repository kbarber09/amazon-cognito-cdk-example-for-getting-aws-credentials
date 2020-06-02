#!/usr/bin/env bash

set -e
source ./env.sh

echo "Building backend "

./build.sh

echo "Deploying backend stack..."

# deploy the cdk stack (ignore the error in case it's due to 'No updates are to be performed')
cd ./cdk
npm run cdk-deploy
cd ..

STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${STACK_REGION}" --query "Stacks[].StackStatus[]" --output text)

if [[ "${STACK_STATUS}" != "CREATE_COMPLETE" && "${STACK_STATUS}" != "UPDATE_COMPLETE" ]]; then
  echo "Stack is in an unexpected status: ${STACK_STATUS}"
  exit 1
fi

echo "Generating UI configuration..."

./config-ui.sh

BUCKET_NAME=$(node --print "require('./ui-react/src/config/autoGenConfig.js').uiBucketName")
APP_URL=$(node --print "require('./ui-react/src/config/autoGenConfig.js').appUrl")
COGNITO_INSTRUCTIONS="Complete the Okta Setup instructions found at ./docs/OktaInstructions.md"

if [[ "${BUCKET_NAME}" != "" ]]; then

  echo "Building frontend"

  cd ./ui-react

  npm run build &>/dev/null

  aws s3 sync --delete ./build/ "s3://${BUCKET_NAME}" &>/dev/null

  cd ..

  echo "${COGNITO_INSTRUCTIONS}"
  echo "Then visit the app at: ${APP_URL} (may take a few minutes for the distribution to finish deployment)"
fi
