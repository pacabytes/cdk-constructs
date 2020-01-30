import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import { App, Stack, SecretValue } from '@aws-cdk/core';
import { HostedZone } from '@aws-cdk/aws-route53';

import { StaticSite } from '../lib';

describe("static site construct", () => {
  it("creates the S3 hosting bucket", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack", {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      }
    });
    new StaticSite(stack, "StaticSiteConstruct");
    expectCDK(stack).to(haveResource("AWS::S3::Bucket"));
  });

  it("creates the ci/cd pipeline", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack", {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      }
    });
    new StaticSite(stack, "StaticSiteConstruct", {
      pipelineConfig: {
        branch: "master",
        owner: "pacabytes",
        repo: "cdk-constructs",
        oauthToken: new SecretValue("test")
      }
    });
    expectCDK(stack).to(haveResource("AWS::CodeBuild::Project"));
    expectCDK(stack).to(haveResource("AWS::CodePipeline::Pipeline"));
  });

  it("does not create the ci/cd pipeline without config", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack", {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      }
    });
    new StaticSite(stack, "StaticSiteConstruct");
    expectCDK(stack).notTo(haveResource("AWS::CodeBuild::Project"));
    expectCDK(stack).notTo(haveResource("AWS::CodePipeline::Pipeline"));
  });

  it("Creates a A record", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack", {
      env: {
        account: "123456789101112",
        region: "us-east-1"
      }
    });
    new StaticSite(stack, "StaticSiteConstruct", {
      domainConfig: {
        zone: HostedZone.fromLookup(stack, "TestZone", {
          domainName: "example.com",
        }),
        domainName: "foo.example.com"
      }
    });
    expectCDK(stack).to(haveResource("AWS::Route53::RecordSet", {
      "Type": "A"
    }));
  });
})