import { Repository, TagMutability } from '@aws-cdk/aws-ecr';
import { CfnOutput, Construct, StackProps, Stack } from '@aws-cdk/core';
import { Duration, RemovalPolicy } from '@aws-cdk/core';
import { BuildStage } from './build-stage';
import { OpenPipeline } from './open-pipeline';
import { SourceStage } from './source-stage';
import { DeployStage } from './deploy-stage';

interface EcsApplicationProps extends StackProps {
    readonly infraName: string;
    readonly appName: string;
    readonly betaStageName: string;
    readonly betaDomain: string;
    readonly betaZoneId: string;
    readonly prodStageName: string;
    readonly prodDomain: string;
    readonly prodZoneId: string;
    readonly projectName: string;
    readonly awsEcrAccount: string;
}

/**
 * @class  PortfolioWebsiteInfraStack representing all resources necessary to maintain portfolio-website
 * @author johnedquinn
 */
class EcsApplication extends Construct {

    /**
     * Constructor
     * 
     * @param scope 
     * @param id 
     * @param props 
     */
    constructor(scope: Construct, id: string, props: EcsApplicationProps) {
        super(scope, id);

        // @TODO: Trigger Deployment of own Stack whenever pushed to main

        // ECR Shared Repository
        const repository = new Repository(this, 'Repository', {
            repositoryName: props.projectName,
            removalPolicy: RemovalPolicy.DESTROY,
            imageTagMutability: TagMutability.MUTABLE,
            imageScanOnPush: false,
            lifecycleRegistryId: props.awsEcrAccount,
            lifecycleRules: [{
                rulePriority: 1,
                description: 'Testing rule',
                maxImageAge: Duration.days(1000)
            }]
        });

        // Initialize Pipeline
        const pipeline = new OpenPipeline(this, 'Pipeline', {
            pipelineName: props.projectName
        })

        // Source Stage
        const sourceStage = new SourceStage(this, 'Source', { pipeline: pipeline });
        pipeline.addStage(sourceStage.stageConfig);

        // Build Stage
        const buildStage = new BuildStage(this, 'Build', {
            sourceCode: pipeline.sourceCode,
            image: pipeline.image
        });
        pipeline.addStage(buildStage.stageConfig);

        // Beta Testing Stage
        const betaStage = new DeployStage(this, props.betaStageName, {
            image: pipeline.image,
            repository: repository,
            minInstances: 1,
            maxInstances: 1,
            desiredInstances: 1,
            domain: props.betaDomain,
            zoneId: props.betaZoneId,
            stage: props.betaStageName
        });
        pipeline.addStage(betaStage.stageConfig);
        
        // @TODO: Load and Integration Testing on Beta Stage

        // @TODO: Manual Approval between Beta and Prod

        // Production Stage
        const prodStage = new DeployStage(this, props.prodStageName, {
            image: pipeline.image,
            repository: repository,
            minInstances: 1,
            maxInstances: 2,
            desiredInstances: 1,
            domain: props.prodDomain,
            zoneId: props.prodZoneId,
            stage: props.prodStageName
        });
        pipeline.addStage(prodStage.stageConfig);

        // @TODO: Alarm and Metrics on Prod Stage

        // Output to CloudFormation
        this.output(repository);

    }

    /**
     * Print Output
     */
    private output(repo: Repository) {
        new CfnOutput(this, 'ECRRepo_ARN', { value: repo.repositoryArn });
    }

}

export { EcsApplication, EcsApplicationProps };
