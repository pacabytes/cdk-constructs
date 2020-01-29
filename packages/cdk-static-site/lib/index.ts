import { Construct, SecretValue } from "@aws-cdk/core";
import { Bucket } from "@aws-cdk/aws-s3";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import { GitHubSourceAction, CodeBuildAction, S3DeployAction } from "@aws-cdk/aws-codepipeline-actions";
import { PipelineProject } from "@aws-cdk/aws-codebuild";
import { ARecord, IHostedZone, RecordTarget } from "@aws-cdk/aws-route53";
import { BucketWebsiteTarget } from "@aws-cdk/aws-route53-targets";

export interface CreateDomainConfig {
  zone: IHostedZone,
  domainName: string;
}
export interface CreatePipelineConfig {
  oauthToken: SecretValue;
  owner: string;
  repo: string;
  branch: string;
}

export interface StaticSiteProps {
  pipelineConfig?: CreatePipelineConfig;
  domainConfig?: CreateDomainConfig;
}

export class StaticSite extends Construct {
  /**
   * @returns The S3 bucket where the static site is hosted
   */
  public readonly siteBucket: Bucket;

  constructor(scope: Construct, id: string, props: StaticSiteProps = {}) {
    super(scope, id);

    const { pipelineConfig, domainConfig } = props;

    this.siteBucket = new Bucket(this, "SiteBucket", {
      publicReadAccess: true,
    })

    if (pipelineConfig) {
      this.createPipeline(pipelineConfig)
    }

    if (domainConfig) {
      this.createDomain(domainConfig);
    }

  }

  private createPipeline(pipelineConfig: CreatePipelineConfig) {

    const { oauthToken, branch, repo, owner } = pipelineConfig;

    const sourceOutput = new Artifact();
    const buildOutput = new Artifact();

    const pipeline = new Pipeline(this, "Pipeline");
    const project = new PipelineProject(this, "Project");

    const sourceAction = new GitHubSourceAction({
      actionName: "SiteSource",
      oauthToken,
      output: sourceOutput,
      owner,
      repo,
      branch
    });

    pipeline.addStage({
      stageName: "Fetch",
      actions: [sourceAction],
    });

    const buildAction = new CodeBuildAction({
      project,
      actionName: "BuildAction",
      input: sourceOutput,
      outputs: [buildOutput]
    });

    pipeline.addStage({
      stageName: "Build",
      actions: [buildAction]
    });

    const deployAction = new S3DeployAction({
      actionName: "S3Deploy",
      input: buildOutput,
      bucket: this.siteBucket
    });

    pipeline.addStage({
      stageName: "Deploy",
      actions: [deployAction]
    });
  }

  private createDomain(domainConfig: CreateDomainConfig) {
    new ARecord(this, "ARecord", {
      zone: domainConfig.zone,
      target: RecordTarget.fromAlias(new BucketWebsiteTarget(this.siteBucket))
    })
  }
}