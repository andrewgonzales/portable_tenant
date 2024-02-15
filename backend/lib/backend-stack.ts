import * as path from "path";
import { Duration, RemovalPolicy, Stack, StackProps, Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  AccessLogFormat,
  Cors,
  IdentitySource,
  LambdaIntegration,
  LogGroupLogDestination,
  RestApi,
  TokenAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

import { TenantStage } from "./types";

const JWT_REGEX = "eyJ[A-Za-z0-9-_]+.eyJ[A-Za-z0-9-_]+.[A-Za-z0-9-_.+/]*";

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambda
    const handler = new NodejsFunction(this, "tenant-handler", {
      functionName: "TenantHandler",
      runtime: Runtime.NODEJS_20_X,
      description: `TenantHandler: ${new Date().toISOString()}`,
      entry: path.join(__dirname, "..", "src/tenant-handler/index.ts"),
      environment: {},
      memorySize: 1769,
      // TODO: Add DDB policy statement
      initialPolicy: [],
    });

    const handlerProxy = new LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    // Auth
    const authorizer = new NodejsFunction(this, "authorizer-handler", {
      functionName: "LambdaAuthorizer",
      runtime: Runtime.NODEJS_20_X,
      description: `Authorizer: ${new Date().toISOString()}`,
      entry: path.join(__dirname, "..", "src/authorizer/index.ts"),
      environment: {
        JWT_AUDIENCE: "https://portable-tenant-jwt-authorizer",
        JWT_ISSUER: "https://dev-jkt2t1ffhfzk8kgy.us.auth0.com",
      },
      memorySize: 1769,
    });

    const apiAuth = new TokenAuthorizer(this, "tenant-authorizer", {
      identitySource: IdentitySource.header("x-tenant-auth"),
      resultsCacheTtl: Duration.seconds(3600),
      validationRegex: JWT_REGEX,
      handler: authorizer,
    });

    // API
    const apiLogGroup = new LogGroup(this, "TenantGatewayAccessLog", {
      removalPolicy: RemovalPolicy.RETAIN,
      retention: RetentionDays.TEN_YEARS,
    });

    const api = new RestApi(this, "tenant-api", {
      cloudWatchRole: true,
      deploy: true,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(apiLogGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
        metricsEnabled: true,
        // TODO handle stages
        stageName: TenantStage.BETA,
        tracingEnabled: false,
      },
    });

    const tenantHandlerResource = api.root.addResource("tenant-handler");
    tenantHandlerResource.addMethod("GET", handlerProxy, {
      authorizer: apiAuth,
    });

    // TODO Make cors stage-dependent
    api.root.addCorsPreflight({
      allowMethods: Cors.ALL_METHODS,
      allowOrigins: ["*"],
    });
  }
}
