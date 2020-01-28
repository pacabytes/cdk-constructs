# Static Site

!!! Please note this package is under development and not ready for production yet. !!!

A CDK construct that sets up a end to end pipeline to build, test and deploy 
your static site automatically when a new version is pushed to your git repository.

## Installation
`npm install @pacabytes/cdk-static-site@1.1.0-alpha.0`

## Usage

```typescript
import { Stack } from "@aws-cdk/core";

import { StaticSite } from "@pacabytes/cdk-static-site";


class MyStack extends Stack {
  constructor(scope: App, id: string) {
    super(scope, id);
    const staticSite = new StaticSite(this, "MyStaticSite", {
        oauthToken: SecretValue.secretsManager("my-github-token"),
        owner: "organization-name",
        repo: "repository-name",
        branch: "master"
    });
  }
}
```