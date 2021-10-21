import { Pipeline, StageProps, Artifact } from '@aws-cdk/aws-codepipeline';
import { Construct } from '@aws-cdk/core';

/**
 * @interface OpenPipelineProps to specify arguments
 */
interface OpenPipelineProps {
    readonly pipelineName: string;
}

/**
 * @class PortfolioPipeline representing an AWS CodePipeline
 * @author johnedquinn
 */
class OpenPipeline extends Construct {

    // Construct Members
    private readonly pipeline: Pipeline;
    public readonly pipelineName: string;
    public readonly arn: string;
    public sourceCode: Artifact;
    public image: Artifact;

    /**
     * Constructor
     * 
     * @param scope 
     * @param id 
     * @param props 
     */
    constructor(scope: Construct, id: string, props: OpenPipelineProps) {
        super(scope, id);

        // Initialize Members
        this.pipelineName = props.pipelineName;
        this.sourceCode = new Artifact();
        this.image = new Artifact();

        // Initialize Pipeline
        this.pipeline = new Pipeline(this, 'Pipeline', {
            pipelineName: this.pipelineName,
            crossAccountKeys: false,
            stages: [
            ]
        });

        this.arn = this.pipeline.pipelineArn;

    }

    /**
     * Adds a stage to the pipeline
     * 
     * @param stageProps stage configuration
     */
    public addStage(stageProps: StageProps) {
        this.pipeline.addStage(stageProps);
    }

}

export { OpenPipeline, OpenPipelineProps };
