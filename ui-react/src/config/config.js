// auto generated based on CloudFormation stack output values
import autoGenConfig from "./autoGenConfig";
import appConfig from "./appConfig";

export const config = {
  Title: appConfig.title,
  SignInHeader: appConfig.signInHeader,
  GroupPageHeader: appConfig.groupPageHeader,
  apiURL: autoGenConfig.apiUrl, // for local test change to something such as 'http://localhost:3001/'
  Auth: {
    // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    identityPoolId: autoGenConfig.cognitoidentityPoolId,

    // REQUIRED - Amazon Cognito Region
    region: autoGenConfig.region,

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: autoGenConfig.cognitoUserPoolId,

    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: autoGenConfig.cognitoUserPoolAppClientId,
    // OPTIONAL - Hosted UI configuration
    oauth: {
      domain: autoGenConfig.cognitoDomain,
      scope: ["phone", "email", "profile", "openid"],
      redirectSignIn: autoGenConfig.appUrl,
      redirectSignOut: autoGenConfig.appUrl,
      responseType: "code", // or 'token', note that REFRESH token will only be generated when the responseType is code
    },
    federationTarget: "COGNITO_USER_POOLS",
  },
};
