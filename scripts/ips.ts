import AWS from 'aws-sdk'
import fs from 'fs'

const ecs = new AWS.ECS()
const ec2 = new AWS.EC2()

const ctfCluster = new RegExp('MondoCtfStack')

function getTeamList(): string[] {
    return JSON.parse(fs.readFileSync('./participants.json', 'utf-8')) as string[]
}

async function main(): Promise<void> {

    const team = getTeamList()
    const clusterList = await ecs.listClusters().promise()

    const mondoCtfClusterArn = clusterList.clusterArns?.find(x => x.match(ctfCluster))

    if (!mondoCtfClusterArn)
        throw new Error('No matches for cluster')
    
    const tasks = await ecs.listTasks({cluster: mondoCtfClusterArn}).promise()

    if (!tasks.taskArns)
        throw new Error('No tasks found')

    const taskDefinitions = await ecs.describeTasks({cluster: mondoCtfClusterArn, tasks: tasks.taskArns}).promise()

    if (!taskDefinitions.tasks || taskDefinitions.tasks.length === 0)
        throw new Error('No tasks found')

    const enis = taskDefinitions.tasks.map(x => {
        const eni = x.attachments?.flatMap(x => x.details?.find(x => x.name === 'networkInterfaceId'))
        if (!eni || !eni[0]?.value)
            throw new Error('No eni found')
        return eni[0]?.value
    })

    const networkInterface = await ec2.describeNetworkInterfaces({NetworkInterfaceIds: enis}).promise()

    const publicIps = networkInterface.NetworkInterfaces?.map(x => x.Association?.PublicIp).filter(x => x)

    const assignedIps = publicIps?.map((ip, i) => {
        return {
            ip, name: team[i]
        }
    })

    console.log(assignedIps)
}

main()