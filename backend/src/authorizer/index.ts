import { Effect, PolicyDocument, PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

exports.handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("authorizer :>> ", event);

  const policyDocument = new PolicyDocument({
    statements: [
      new PolicyStatement({
        actions: ["execute-api:Invoke"],
        effect: Effect.ALLOW,
        resources: [
          "arn:aws:execute-api:us-west-1:975050192367:49qwdca725/beta/GET/*",
        ],
      }),
    ],
  });

  console.log("cdk policyDoc: ", policyDocument.toJSON());

  return {
    principalId: "abcdefgh", // The principal user identification associated with the token sent by the client.
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource:
            "arn:aws:execute-api:us-west-1:975050192367:49qwdca725/beta/GET/*",
        },
      ],
    },
    context: {
      stringKey: "value",
      numberKey: "1",
      booleanKey: "true",
    },
  };
  //   usageIdentifierKey: "{api-key}",
};
