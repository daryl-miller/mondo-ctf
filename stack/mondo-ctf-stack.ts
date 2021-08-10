import * as cdk from '@aws-cdk/core'
import * as ecs from '@aws-cdk/aws-ecs'
import * as ec2 from '@aws-cdk/aws-ec2'
import fs from 'fs'

export class MondoCtfStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const vpc = new ec2.Vpc(this, 'CTFVpc', {
            cidr: '10.133.7.0/24',
            maxAzs: 1
        })

        const inboundAccess = new ec2.SecurityGroup(this, 'inboundJuiceshopAccess', {
            vpc,
            allowAllOutbound: true,

        })

        inboundAccess.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3000))

        vpc.selectSubnets({
            subnetType: ec2.SubnetType.PUBLIC
        })

        const cluster = new ecs.Cluster(this, 'Cluster', {
            vpc,
        })

        const fargateTask = new ecs.TaskDefinition(this, 'juiceshop-task', {
            compatibility: 1,
            networkMode: ecs.NetworkMode.AWS_VPC,
            cpu: '512',
            memoryMiB: '1024'
        })

        fargateTask.addContainer('juice-shop-container', {
            image: ecs.ContainerImage.fromRegistry('bkimminich/juice-shop'),
            portMappings: [{
                containerPort: 3000,
                hostPort: 3000
            }]
        })

        const participants = JSON.parse(fs.readFileSync('./participants.json', 'utf-8')) as string[]

        new ecs.FargateService(this, 'juiceshop', {
            assignPublicIp: true,
            taskDefinition: fargateTask,
            cluster,
            desiredCount: participants.length,
            securityGroups: [inboundAccess]
        })
    }
}
