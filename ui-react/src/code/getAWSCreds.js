import AWS from "aws-sdk";
import { Auth } from "aws-amplify";
import { config } from "../config/config";

AWS.config.region = config.Auth.region;
const cognitoidentity = new AWS.CognitoIdentity();

export async function getAWSCreds(RoleArn, GroupName) {
  const user = await Auth.currentAuthenticatedUser();
  const idToken = user.signInUserSession.idToken.jwtToken;
  const { region } = AWS.config;
  const { identityPoolId, userPoolId } = config.Auth;
  //https://docs.aws.amazon.com/cognito/latest/developerguide/authentication-flow.html (see: Enhanced (Simplified) Authflow)
  let params = {
    IdentityPoolId: identityPoolId,
    Logins: {
      [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
    },
  };

  //https://docs.aws.amazon.com/cognitoidentity/latest/APIReference/API_GetId.html
  let data = await cognitoidentity.getId(params).promise();

  //https://docs.aws.amazon.com/cognitoidentity/latest/APIReference/API_GetCredentialsForIdentity.html#CognitoIdentity-GetCredentialsForIdentity-request-CustomRoleArn
  params = {
    CustomRoleArn: RoleArn,
    IdentityId: data.IdentityId,
    Logins: {
      [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
    },
  };

  data = await cognitoidentity.getCredentialsForIdentity(params).promise();
  const result = {
    Group: GroupName,
    IdentityId: data.IdentityId,
    AccessKeyId: data.Credentials.AccessKeyId,
    SecretKey: data.Credentials.SecretKey,
    SessionToken: data.Credentials.SessionToken,
    ARN: RoleArn,
  };
  return result;
}
