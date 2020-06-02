// modified and extended (https://github.com/aws-samples/amazon-cognito-example-for-external-idp)

import apigateway = require("@aws-cdk/aws-apigateway");
import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import cognito = require("@aws-cdk/aws-cognito");
import sns = require("@aws-cdk/aws-sns");
import iam = require("@aws-cdk/aws-iam");
import s3 = require("@aws-cdk/aws-s3");
import cloudfront = require("@aws-cdk/aws-cloudfront");
import "source-map-support/register";
import { AuthorizationType } from "@aws-cdk/aws-apigateway";
import { CfnUserPoolClient, UserPool } from "@aws-cdk/aws-cognito";
import { Utils } from "./utils";
import { Runtime } from "@aws-cdk/aws-lambda";
import { URL } from "url";
import { Duration } from "@aws-cdk/core";
import { Bucket, BucketEncryption } from "@aws-cdk/aws-s3";
import { CloudFrontWebDistribution } from "@aws-cdk/aws-cloudfront";
import { Effect } from "@aws-cdk/aws-iam";
import subscriptions = require("@aws-cdk/aws-sns-subscriptions");

export class CognitoService extends cdk.Construct {
  constructor(scope: cdk.Stack, id: string) {
    super(scope, id);

    // ========================================================================
    // Environment variables and constants
    // ========================================================================
    const NewUserSNSSubscription = Utils.getEnv(
      "NEW_USER_SNS_SUBSCRIPTION",
      ""
    );
    const project_name = Utils.getEnv("PROJECT_NAME", "");
    const support_group_name = Utils.getEnv("SUPPORT_GROUP_NAME", "");
    const support_group_contact = Utils.getEnv("SUPPORT_GROUP_CONTACT", "");
    const stack_region = Utils.getEnv("STACK_REGION", "us-west-2");
    const authdomain = Utils.getEnv("COGNITO_DOMAIN_NAME");
    const nodeRuntime: Runtime = lambda.Runtime.NODEJS_12_X;
    const authorization_header_name = "Authorization";
    const stack_name = Utils.getStackName(this.node.path);
    // ========================================================================
    // CloudFront distribution
    // ========================================================================

    // Purpose: store the static frontend assets (the app's user interface)

    let appUrl = Utils.getEnv("APP_URL", "");
    let uiBucketName: string | undefined = undefined;
    let corsOrigin: string | undefined = undefined;

    const uiBucket: Bucket = new s3.Bucket(this, "UIBucket", {
      encryption: BucketEncryption.S3_MANAGED,
    });
    uiBucketName = uiBucket.bucketName;

    const distribution = this.createCloudFrontDistribution(uiBucket);

    if (!appUrl) {
      // if appUrl ws not specified, use the distribution URL
      appUrl = "https://" + distribution.domainName;
      corsOrigin = "https://" + distribution.domainName;
    }

    if (!corsOrigin) {
      // if corsOrigin was not set dynamically, get it from the appUrl
      corsOrigin = new URL(appUrl).origin;
    }

    // ========================================================================
    // Resource: AWS SNS - Notification API Backend
    // ========================================================================
    const NewUserSNSTopic = new sns.Topic(this, "NewUserSNSTopic", {
      displayName: "NewUserSNS",
    });
    //
    if (NewUserSNSSubscription !== "") {
      NewUserSNSTopic.addSubscription(
        new subscriptions.EmailSubscription(NewUserSNSSubscription)
      );
    }

    const apiNewUserSNSFunction = new lambda.Function(this, "NewUser_SNS", {
      runtime: nodeRuntime,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        "../lambda/NewUserSNS/Cognito_New_User_SNS.zip"
      ),
      timeout: Duration.seconds(5),
      memorySize: 128,
      environment: {
        TOPIC_ARN: NewUserSNSTopic.topicArn,
      },
    });

    apiNewUserSNSFunction.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [NewUserSNSTopic.topicArn],
        actions: ["sns:Publish"],
      })
    );
    // ========================================================================
    // create the Cognito User Pool
    // ========================================================================

    //user supportedIdentityProviders if a Federated IdP is already setup in Cognito
    
    const userPool = new UserPool(this, "CogUP", {
      signInAliases: { email: true },

      lambdaTriggers: { postConfirmation: apiNewUserSNSFunction },
    });

    // Setup the default UserPoolClient for the UserPool
    const userPoolClient = new CfnUserPoolClient(this, "CogAppClient", {
       supportedIdentityProviders: [],
      allowedOAuthFlowsUserPoolClient: true,
      allowedOAuthFlows: ["code"],
      allowedOAuthScopes: ["phone", "email", "openid", "profile"],
      generateSecret: false,
      refreshTokenValidity: 1,
      callbackUrLs: [appUrl],
      logoutUrLs: [appUrl],
      userPoolId: userPool.userPoolId,
    });

    const UserPoolDomain = new cognito.CfnUserPoolDomain(this, "CogDom", {
      domain: authdomain,
      userPoolId: userPool.userPoolId,
    });

    // ========================================================================
    // Resource: AWS Lambda Function - API Backend
    // ========================================================================

    const apiListGrpsFunction = new lambda.Function(this, "ListGrps", {
      runtime: nodeRuntime,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        "../lambda/ListGrps/Cognito_List_Users_In_Grps.zip"
      ),
      timeout: Duration.seconds(5),
      memorySize: 128,
      environment: {
        ALLOWED_ORIGIN: corsOrigin,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        AUTHORIZATION_HEADER_NAME: authorization_header_name,
      },
    });

    const apiSetupMessageFunction = new lambda.Function(this, "SetupMessage", {
      runtime: nodeRuntime,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        "../lambda/SetupMessage/Cognito_Setup_Message.zip"
      ),
      timeout: Duration.seconds(5),
      memorySize: 128,
      environment: {
        ALLOWED_ORIGIN: corsOrigin,
        PROJECT_NAME: project_name,
        SUPPORT_GROUP_NAME: support_group_name,
        SUPPORT_GROUP_CONTACT: support_group_contact,
        AUTHORIZATION_HEADER_NAME: authorization_header_name,
      },
    });

    const apiSignInFunction = new lambda.Function(this, "SignIn", {
      runtime: nodeRuntime,
      handler: "index.handler",
      code: lambda.Code.fromAsset(
        "../lambda/SignIn/Cognito_Console_Signin.zip"
      ),
      timeout: Duration.seconds(5),
      memorySize: 128,
      environment: {
        ALLOWED_ORIGIN: corsOrigin,
      },
    });

    apiListGrpsFunction.addToRolePolicy(
      new iam.PolicyStatement({
        resources: [userPool.userPoolArn],
        actions: [
          "cognito-idp:ListUsers",
          "cognito-idp:AdminListGroupsForUser",
        ],
      })
    );

    // ========================================================================
    // Resource: Amazon API Gateway - API endpoints
    // ========================================================================

    // Purpose: create API endpoints and integrate with Amazon Cognito for JWT validation
    // See also: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html

    // ------------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------------

    const api = new apigateway.RestApi(this, id + "API");

    // ------------------------------------------------------------------------
    // Cognito Authorizer
    // ------------------------------------------------------------------------

    const cfnAuthorizer = new apigateway.CfnAuthorizer(this, id, {
      name: "CognitoAuthorizer",
      type: AuthorizationType.COGNITO,

      identitySource: "method.request.header." + authorization_header_name,
      restApiId: api.restApiId,
      providerArns: [userPool.userPoolArn],
    });

    // ------------------------------------------------------------------------
    // Cognito Validator
    // ------------------------------------------------------------------------

    const reqValidator = new apigateway.RequestValidator(
      this,
      "ValidateQuery-Headers",
      {
        restApi: api,
        requestValidatorName: "ValidateQuery-Headers",
        validateRequestParameters: true,
      }
    );

    // ------------------------------------------------------------------------
    // Lambda API integration
    // ------------------------------------------------------------------------
    // see https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-create-api-as-simple-proxy

    const ListGrpsintegration = new apigateway.LambdaIntegration(
      apiListGrpsFunction,
      {
        proxy: true,
      }
    );

    const SignInintegration = new apigateway.LambdaIntegration(
      apiSignInFunction,
      {
        proxy: true,
      }
    );

    const SetupMessageintegration = new apigateway.LambdaIntegration(
      apiSetupMessageFunction,
      {
        proxy: true,
      }
    );

    // ------------------------------------------------------------------------
    // All non-root Paths  - authorization required
    // ------------------------------------------------------------------------

    const rootResource = api.root;
    const ListGrpproxyResource = rootResource.addResource("groups");
    const SignInproxyResource = rootResource.addResource("signin");
    const SetupMessageproxyResource = rootResource.addResource("info");

    const ListGrpmethod = ListGrpproxyResource.addMethod(
      "GET",
      ListGrpsintegration,
      {
        authorizer: { authorizerId: cfnAuthorizer.ref },
        authorizationType: AuthorizationType.COGNITO,
        requestValidator: reqValidator,
      }
    );

    const SignInmethod = SignInproxyResource.addMethod(
      "POST",
      SignInintegration,
      {
        authorizer: { authorizerId: cfnAuthorizer.ref },
        authorizationType: AuthorizationType.COGNITO,
        requestValidator: reqValidator,
      }
    );

    const SetupMessagemethod = SetupMessageproxyResource.addMethod(
      "GET",
      SetupMessageintegration,
      {
        authorizer: { authorizerId: cfnAuthorizer.ref },
        authorizationType: AuthorizationType.COGNITO,
        requestValidator: reqValidator,
      }
    );
    // ------------------------------------------------------------------------
    // Add CORS support to all
    // ------------------------------------------------------------------------
    Utils.addCorsOptions(SetupMessageproxyResource, corsOrigin);
    Utils.addCorsOptions(SignInproxyResource, corsOrigin);
    Utils.addCorsOptions(ListGrpproxyResource, corsOrigin);
    Utils.addCorsOptions(rootResource, corsOrigin);

    // ========================================================================
    // create the Cognito Identity Pool
    // ========================================================================

    const identityPool = new cognito.CfnIdentityPool(this, "CogIDPool", {
      allowUnauthenticatedIdentities: false,
      allowClassicFlow: false,
      cognitoIdentityProviders: [
        {
          providerName: userPool.userPoolProviderName,
          clientId: userPoolClient.ref,
          serverSideTokenCheck: true,
        },
      ],
    });

    const unauthenticatedRole = new iam.Role(
      this,
      "CognitoDefaultUnauthenticatedRole",
      {
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );

    unauthenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["mobileanalytics:PutEvents", "cognito-sync:*"],
        resources: ["*"],
      })
    );

    const authenticatedRole = new iam.Role(
      this,
      "CognitoDefaultAuthenticatedRole",
      {
        assumedBy: new iam.FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "authenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*",
        ],
        resources: ["*"],
      })
    );

    const TestGrp1Role = new iam.Role(this, "TestGrp1Role", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      description: "This is description for TestGrp1.",
      //==========================================================================================
      // ***set maxSessionDuration to larger number if more than the default one hour is needed***
      //==========================================================================================

      //maxSessionDuration: Duration.seconds(28800),
    });
    TestGrp1Role.addToPolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*",
        ],
        resources: ["*"],
      })
    );

    const TestGrp2Role = new iam.Role(this, "TestGrp2Role", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      description: "This is description for TestGrp1.",
    });
    TestGrp2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*",
        ],
        resources: ["*"],
      })
    );

    const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(
      this,
      "Default",
      {
        identityPoolId: identityPool.ref,
        roles: {
          unauthenticated: unauthenticatedRole.roleArn,
          authenticated: authenticatedRole.roleArn,
        },

        //==========================================================================================
        // this defines the use of tokens derived from the JWT token rather than the default role or rules
        // ambiguousRoleResolution is set to AuthenticatedRole so React app can gracefully inform new users who to contact to set up their cognito groups
        //==========================================================================================

        roleMappings: {
          cognitoProvider: {
            identityProvider: `${userPool.userPoolProviderName}:${userPoolClient.ref}`,
            type: "Token",
            ambiguousRoleResolution: "AuthenticatedRole",
          },
        },
      }
    );

    // ========================================================================
    // create the Cognito User Pool Groups
    // ========================================================================

    // when creating groups add a description. This will be picked up by the react-ui app

    new cognito.CfnUserPoolGroup(this, "TestGrp1", {
      groupName: "TestGrp1",
      userPoolId: userPool.userPoolId,
      roleArn: TestGrp1Role.roleArn,
      precedence: 10,
      description: "This is Test Grp 1",
    });

    new cognito.CfnUserPoolGroup(this, "TestGrp2", {
      groupName: "TestGrp2",
      userPoolId: userPool.userPoolId,
      roleArn: TestGrp2Role.roleArn,
      precedence: 10,
      description: "This is Test Grp 2",
    });

    // ========================================================================
    // Stack Outputs
    // ========================================================================

    new cdk.CfnOutput(this, "APIUrlOutput", {
      description: "API Gateway URL",
      exportName: `${stack_name}-APIUrlOutput`,
      value: api.url,
    });

    new cdk.CfnOutput(this, "UserPoolIdOutput", {
      description: "UserPool ID",
      exportName: `${stack_name}-UserPoolIdOutput`,
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "AppClientIdOutput", {
      description: "App Client ID",
      exportName: `${stack_name}-AppClientIdOutput`,
      value: userPoolClient.ref,
    });

    new cdk.CfnOutput(this, "RegionOutput", {
      description: "Region",
      exportName: `${stack_name}-RegionOutput`,
      value: stack_region,
    });

    new cdk.CfnOutput(this, "CognitoDomainOutput", {
      description: "Cognito Domain",
      exportName: `${stack_name}-CognitoDomainOutput`,
      value: UserPoolDomain.domain,
    });

    new cdk.CfnOutput(this, "IdentityPoolOutput", {
      description: "Identity Pool",
      exportName: `${stack_name}-IdentityPoolOutput`,
      value: identityPool.ref,
    });

    new cdk.CfnOutput(this, "ListGrpsOutput", {
      description: "ListGrps Function Name",
      exportName: `${stack_name}-ListGrpsOutput`,
      value: apiListGrpsFunction.functionName,
    });

    new cdk.CfnOutput(this, "SignInOutput", {
      description: "SignIn Function Name",
      exportName: `${stack_name}-SignInOutput`,
      value: apiSignInFunction.functionName,
    });

    new cdk.CfnOutput(this, "AppUrl", {
      description: "The frontend App's URL",
      exportName: `${stack_name}-AppUrl`,
      value: appUrl,
    });

    new cdk.CfnOutput(this, "NewUserSNSTopicOutput", {
      description: "SNS Topic to notify for new users",
      exportName: `${stack_name}-NewUserSNSTopic`,
      value: NewUserSNSTopic.topicName,
    });

    if (uiBucketName) {
      new cdk.CfnOutput(this, "UIBucketName", {
        description: "The frontend App's bucket name",
        exportName: `${stack_name}-UIBucketName`,
        value: uiBucketName,
      });
    }
  }

  private createCloudFrontDistribution(
    uiBucket: Bucket
  ): CloudFrontWebDistribution {
    const cloudFrontOia = new cloudfront.OriginAccessIdentity(this, "OIA", {
      comment: `OIA for ${uiBucket.bucketName}`,
    });

    // create CloudFront distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "UIDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: uiBucket,
              originAccessIdentity: cloudFrontOia,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    // grant read permissions to CloudFront
    uiBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetBucket*", "s3:GetObject*", "s3:List*"],
        resources: [uiBucket.bucketArn, uiBucket.bucketArn + "/*"],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudFrontOia.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );
    return distribution;
  }
}
