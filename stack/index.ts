#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { MondoCtfStack } from './mondo-ctf-stack'

const app = new cdk.App()
new MondoCtfStack(app, 'MondoCtfStack', {
    env: {
        region: 'ap-southeast-2'
    }
})
