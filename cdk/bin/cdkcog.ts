#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkcogStack } from '../lib/cdkcog-stack';

const app = new cdk.App();
new CdkcogStack(app, 'CdkcogStack');
