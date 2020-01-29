# Static Site

!!! Please note this package is under development and not ready for production yet. !!!

A CDK construct that sets up a end to end pipeline to build, test and deploy 
your static site automatically when a new version is pushed to your git repository.

## Installation
`npm install @pacabytes/cdk-static-site`

## Usage

```typescript
import { App, Stack } from "@aws-cdk/core";
import { HostedZone } from "@aws-cdk/aws-route53";

import { StaticSite } from "@pacabytes/cdk-static-site";


class MyStack extends Stack {
  constructor(scope: App, id: string) {
    super(scope, id);
    const staticSite = new StaticSite(this, "MyStaticSite", {
        // OPTIONAL - pipelineConfig will create a CodePipeline that gets the source
        //            from github, builds it with CodeBuild and deploys it via CodeDeploy
        //            to the S3 hosting bucket
        pipelineConfig: {
          // pass in the github token via the secrets manager
          oauthToken: SecretValue.secretsManager("github-oauth-token"),
          // or use context instead and add `-c github-oath-token=abcdefg12345` to the cli call
          oauthToken: this.node.tryGetContext('github-oauth-token'),
          // organization name where the repository can be found
          owner: "organization-name", 
          repo: "repository-name", 
          branch: "master"
        },
        // OPTIONAL - domainConfig will create a new A record that points to your
        //            S3 bucket. a cloudfront target will be available soon
        domainConfig: {
          // the zone where to add the new recod, currently only existing zones are supported
          zone: HostedZone.fromLookup(stack, "MytZone", {
            domainName: "example.com",
          }),
          // the domainname of the desired new A record
          domainName: "foo.example.com"
        }
    });
  }
}
```