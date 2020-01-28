import { expect as expectCDK, haveResource, SynthUtils } from '@aws-cdk/assert';
import { App, Stack, SecretValue } from '@aws-cdk/core';
import { StaticSite } from '../lib';

describe('static site construct', () => {
  it('creates the S3 Bucket', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    new StaticSite(stack, 'StaticSiteConstruct');
    expectCDK(stack).to(haveResource("AWS::S3::Bucket"));
  });
})