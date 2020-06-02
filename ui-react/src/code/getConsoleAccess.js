import AWS from "aws-sdk";
import { Auth } from "aws-amplify";
import { config } from "../config/config";
const fetch = require("node-fetch");

AWS.config.region = config.Auth.region;
const cognitoIdentity = new AWS.CognitoIdentity();
const apiURL = config.apiURL;

const ENDPOINT = `${apiURL}signin`;


async function getIdentityId(identityPoolId, logins) {
  const res = await cognitoIdentity
    .getId({
      IdentityPoolId: identityPoolId,
      Logins: logins,
    })
    .promise();

  return res.IdentityId;
}

async function getCredentialsForIdentity(identityId, roleArn, logins) {
  const res = await cognitoIdentity
    .getCredentialsForIdentity({
      CustomRoleArn: roleArn,
      IdentityId: identityId,
      Logins: logins,
    })
    .promise();

  return res.Credentials;
}

//https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_enable-console-custom-url.html

export async function getConsoleAccess(roleArn) {
  const user = await Auth.currentAuthenticatedUser();
  const idToken = user.signInUserSession.idToken.jwtToken;

  const { region } = AWS.config;
  const { identityPoolId, userPoolId } = config.Auth;
  const logins = {
    [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
  };

  const identityId = await getIdentityId(identityPoolId, logins);

  const {
    AccessKeyId,
    SecretKey,
    SessionToken,
  } = await getCredentialsForIdentity(identityId, roleArn, logins);

  let sessionstring = {
    sessionId: AccessKeyId,
    sessionKey: SecretKey,
    sessionToken: SessionToken,
  };
  sessionstring = encodeURIComponent(JSON.stringify(sessionstring));

  const headers = {
    "Content-Type": "application/json",
    Authorization: `${idToken}`,
  };

  fetch(ENDPOINT, { method: "POST", body: sessionstring, headers: headers})
    .then((res) => res.json())
    .then(
      (json) => 
      window.open(
        `https://signin.aws.amazon.com/federation?Action=login&Destination=https://console.aws.amazon.com/&SigninToken=${json.SigninToken}`,
        "_blank"
      )
    );
}
