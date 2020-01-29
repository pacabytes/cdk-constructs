import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import { App, Stack } from '@aws-cdk/core';
import { StaticSite } from '../lib';
import { HostedZone } from '@aws-cdk/aws-route53';

describe("static site construct", () => {
  it("creates the S3 Bucket", () => {
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