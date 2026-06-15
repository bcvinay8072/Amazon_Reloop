import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ReloopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket for Returns Processing Storage
    const intakeBucket = new s3.Bucket(this, 'ReloopIntakeBucket', {
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 2. DynamoDB Table for Product Reviews
    const reviewsTable = new dynamodb.Table(this, 'ProductReviews', {
      tableName: 'ProductReviews',
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'review_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 3. Return Orchestrator Lambda (vision grading + NRV math)
    const orchestratorLambda = new lambda.Function(this, 'ReloopOrchestrator', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('backend'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(25),
      memorySize: 512,
      environment: {
        BUCKET_NAME: intakeBucket.bucketName,
      },
    });

    // 4. Review Insights Lambda (DynamoDB query + Nova Micro summarization)
    const reviewInsightsLambda = new lambda.Function(this, 'ReviewInsights', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('review-insights'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      environment: {
        REVIEWS_TABLE: reviewsTable.tableName,
      },
    });

    // 5. Pre-signed URL Lambda (generates direct-to-S3 upload URLs)
    const uploadUrlsLambda = new lambda.Function(this, 'UploadUrls', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('upload-urls'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      environment: {
        BUCKET_NAME: intakeBucket.bucketName,
      },
    });

    // 6. Security Access Grants (least privilege per Lambda)
    intakeBucket.grantReadWrite(orchestratorLambda);
    intakeBucket.grantPut(uploadUrlsLambda);

    orchestratorLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['*'],
    }));

    reviewsTable.grantReadData(reviewInsightsLambda);

    reviewInsightsLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['*'],
    }));

    // 7. API Gateway Integration Routing
    const api = new apigateway.RestApi(this, 'ReloopApi', {
      restApiName: 'Amazon Re-Loop Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const returnRoute = api.root.addResource('return');
    returnRoute.addMethod('POST', new apigateway.LambdaIntegration(orchestratorLambda));

    const reviewsRoute = api.root.addResource('reviews');
    reviewsRoute.addMethod('POST', new apigateway.LambdaIntegration(reviewInsightsLambda));

    const uploadUrlsRoute = api.root.addResource('upload-urls');
    uploadUrlsRoute.addMethod('POST', new apigateway.LambdaIntegration(uploadUrlsLambda));

    // 8. Outputs
    new cdk.CfnOutput(this, 'ReloopApiUrl', {
      value: `${api.url}return`,
      description: 'The live HTTP POST URL for return processing',
    });

    new cdk.CfnOutput(this, 'ReloopReviewsUrl', {
      value: `${api.url}reviews`,
      description: 'The live HTTP POST URL for review insights',
    });

    new cdk.CfnOutput(this, 'ReloopUploadUrlsUrl', {
      value: `${api.url}upload-urls`,
      description: 'The live HTTP POST URL for pre-signed upload URLs',
    });

    new cdk.CfnOutput(this, 'ReviewsTableName', {
      value: reviewsTable.tableName,
      description: 'DynamoDB table name for seeding reviews',
    });
  }
}
