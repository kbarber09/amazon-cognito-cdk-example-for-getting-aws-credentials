import * as cdk from '@aws-cdk/core';
import cognito = require("../lib/cognito");

export class CdkcogStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cognito.CognitoService(this, "Auth")

  }
}
