import { Construct, SecretValue } from "@aws-cdk/core";
import { Bucket } from "@aws-cdk/aws-s3";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import {
  GitHubSourceAction,
  CodeBuildAction,
  S3DeployAction
} from "@aws-cdk/aws-codepipeline-actions";
import { PipelineProject } from "@aws-cdk/aws-codebuild";
import {
  ARecord,
  IHostedZone,
  RecordTarget,
  AaaaRecord,
  ARecordProps,
  AaaaRecordProps
} from "@aws-cdk/aws-route53";
import {
  BucketWebsiteTarget,
  CloudFrontTarget
} from "@aws-cdk/aws-route53-targets";
import {
  CloudFrontWebDistribution,
  ViewerCertificate
} from "@aws-cdk/aws-cloudfront";
import { Certificate } from "@aws-cdk/aws-certificatemanager";

export interface CreateDomainConfig {
  zone: IHostedZone;
  domainName: string;
}
export interface CreatePipelineConfig {
  oauthToken: SecretValue;
  owner: string;
  repo: string;
  branch: string;
}

export interface CreateCloudFrontConfig {
  zone: IHostedZone;
  alias: string;
  certificate: Certificate;
}

export interface StaticSiteProps {
  pipelineConfig?: CreatePipelineConfig;
  domainConfig?: CreateDomainConfig;
  cloudFrontConfig?: CreateCloudFrontConfig;
}

export class StaticSite extends Construct {
  /**
   * @returns The S3 bucket where the static site is hosted
   */
  public readonly siteBucket: Bucket;

  public readonly pipeline: Pipeline;

  constructor(scope: Construct, id: string, props: StaticSiteProps = {}) {
    super(scope, id);

    const { pipelineConfig, domainConfig, cloudFrontConfig } = props;

    this.pipeline = new Pipeline(this, "Pipeline");

    this.siteBucket = new Bucket(this, "SiteBucket", {
      bucketName: domainConfig?.domainName ?? undefined,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html"
    });

    if (pipelineConfig) {
      this.createPipeline(pipelineConfig);
    }

    if (domainConfig) {
      this.createDomain(domainConfig);
    }

    if (cloudFrontConfig) {
      this.createCloudfrontDistribution(cloudFrontConfig);
    }
  }

  private createPipeline(pipelineConfig: CreatePipelineConfig) {
    const { oauthToken, branch, repo, owner } = pipelineConfig;

    const sourceOutput = new Artifact();
    const buildOutput = new Artifact();

    const project = new PipelineProject(this, "Project");

    const sourceAction = new GitHubSourceAction({
      actionName: "SiteSource",
      oauthToken,
      output: sourceOutput,
      owner,
      repo,
      branch
    });

    this.pipeline.addStage({
      stageName: "Fetch",
      actions: [sourceAction]
    });

    const buildAction = new CodeBuildAction({
      project,
      actionName: "BuildAction",
      input: sourceOutput,
      outputs: [buildOutput]
    });

    this.pipeline.addStage({
      stageName: "Build",
      actions: [buildAction]
    });

    const deployAction = new S3DeployAction({
      actionName: "S3Deploy",
      input: buildOutput,
      bucket: this.siteBucket
    });

    this.pipeline.addStage({
      stageName: "Deploy",
      actions: [deployAction]
    });
  }

  private createDomain(domainConfig: CreateDomainConfig) {
    new ARecord(this, "ARecord", {
      zone: domainConfig.zone,
      target: RecordTarget.fromAlias(new BucketWebsiteTarget(this.siteBucket))
    });
  }

  private createCloudfrontDistribution(
    cloudfrontConfig: CreateCloudFrontConfig
  ) {
    const { alias, zone, certificate } = cloudfrontConfig;

    const viewerCertificate = ViewerCertificate.fromAcmCertificate(
      certificate,
      {
        aliases: [alias]
      }
    );

    const distribution = new CloudFrontWebDistribution(
      this,
      "CloudFrontDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: this.siteBucket
            },
            behaviors: [
              {
                isDefaultBehavior: true
              }
            ]
          }
        ],
        viewerCertificate
      }
    );

    const recordProps: ARecordProps | AaaaRecordProps = {
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone
    };

    new ARecord(this, "CloudFrontARecord", recordProps);
    new AaaaRecord(this, "CloudFrontAaaaRecord", recordProps);
  }
}
