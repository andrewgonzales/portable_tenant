import {
  APIGatewayAuthorizerResult,
  APIGatewayEventRequestContextV2,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";
import { JwtPayload, decode, verify } from "jsonwebtoken";
import JwksRsa from "jwks-rsa";

import { AuthorizationError, EnvironmentError } from "./errors";

const AUTH_ALGORITHM = "RS256";

const JWT_AUDIENCE_ENV_KEY = "JWT_AUDIENCE";
const JWT_ISSUER_ENV_KEY = "JWT_ISSUER";

const getAudience = () => process.env[JWT_AUDIENCE_ENV_KEY];
const get_Jwt_Issuer = () => process.env[JWT_ISSUER_ENV_KEY];

const checkEnv = () => {
  if (!getAudience()) {
    throw new EnvironmentError(`Missing env variable for audience`);
  }

  if (!get_Jwt_Issuer()) {
    throw new EnvironmentError("Missing env variable for jwt issuer");
  }
};

const validateClaims = async (
  token: string
): Promise<string | JwtPayload | undefined> => {
  const keyId = decode(token, { complete: true })?.header.kid;

  const jwksClient = JwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${get_Jwt_Issuer()}/.well-known/jwks.json`,
    timeout: 5000,
  });

  const signingKey = await jwksClient.getSigningKey(keyId);
  const publicKey = signingKey.getPublicKey();

  try {
    const authClaims = verify(token, publicKey, {
      algorithms: [AUTH_ALGORITHM],
      audience: getAudience(),
      issuer: get_Jwt_Issuer(),
    });
    console.debug("auth claims: ", authClaims);

    return authClaims;
  } catch (err) {
    console.error("Error verifying token: ", err);
    if (err instanceof Error) {
      throw new AuthorizationError(err?.message);
    }

    throw err;
  }
};

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: APIGatewayEventRequestContextV2
): Promise<APIGatewayAuthorizerResult> => {
  console.debug("Authorizer event: ", event);
  console.debug("Authorizer context: ", context);

  checkEnv();

  const token = event.authorizationToken;

  const claims = await validateClaims(token);
  console.debug("claims: ", claims);

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

handler(
  {
    type: "TOKEN",
    authorizationToken: process.env.AUTH_TOKEN || "Invalid token",
    methodArn: "abc123",
  },
  {} as any
);
