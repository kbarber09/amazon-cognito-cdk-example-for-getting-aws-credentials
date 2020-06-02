import { Utils } from "./utils";
import fs = require("fs");
require("dotenv").config();


const stack_region = Utils.getEnv("STACK_REGION", "us-west-2");
const stack_name = Utils.getEnv("STACK_NAME", "");

class GenerateConfig {
  async generateConfig(
    stackName: string,
    stackRegion: string,
    filePath: string
  ) {
    const outputs = await Utils.getStackOutputs(stackName, stackRegion);
    const outputsByName = new Map<string, string>();
    for (let output of outputs) {
      outputsByName.set(output.ExportName!, output.OutputValue!);
    }

    const region = outputsByName.get(`${stackName}-RegionOutput`);
    const cognitoDomainPrefix = outputsByName.get(
      `${stackName}-CognitoDomainOutput`
    );
    const identityPoolId = outputsByName.get(`${stackName}-IdentityPoolOutput`);
    const userPoolId = outputsByName.get(`${stackName}-UserPoolIdOutput`);
    const appClientId = outputsByName.get(`${stackName}-AppClientIdOutput`);
    const apiURL = outputsByName.get(`${stackName}-APIUrlOutput`);
    const appURL = outputsByName.get(`${stackName}-AppUrl`);
    const uiBucketName = outputsByName.get(`${stackName}-UIBucketName`) || "";

    const cognitoDomain = `${cognitoDomainPrefix}.auth.${region}.amazoncognito.com`;
    const params = {
      cognitoDomain: cognitoDomain,
      region: region,
      cognitoidentityPoolId: identityPoolId,
      cognitoUserPoolId: userPoolId,
      cognitoUserPoolAppClientId: appClientId,
      apiUrl: apiURL,
      appUrl: appURL,
      uiBucketName: uiBucketName,
    };

    const autoGenConfigFile =
      "// this file is auto generated, do not edit it directly\n" +
      "module.exports = " +
      JSON.stringify(params, null, 2);

    console.log(autoGenConfigFile);

    fs.writeFileSync(filePath, autoGenConfigFile);
  }
}

const stackName = process.argv[2];
if (!stackName) {
  throw new Error("stack name is required");
}
const stackRegion = process.argv[3];
if (!stackName) {
  throw new Error("stack region is required");
}
const filePath = process.argv[4];
if (!stackName) {
  throw new Error("file path is required");

}


new GenerateConfig().generateConfig(
  stack_name,
  stack_region, 
  filePath
);
