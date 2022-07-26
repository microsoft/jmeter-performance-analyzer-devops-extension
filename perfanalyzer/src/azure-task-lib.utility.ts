// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ERROR_DEFAULT_MSG } from './constant';
import { LogEvent } from './telemetry-client';
import {logInformation } from './utility'
const tl = require('azure-pipelines-task-lib/task');

export async function publishData(pathToPublish: string, artifactName: string) {
    //logInformation('Started Uploading Artifacts from : ' + pathToPublish + ' to location: ' + pathToPublish);
    //tl.setResourcePath(Path.join(__dirname, 'task.json'));
    //logInformation('ResourcePath: ' + Path.join(__dirname, 'task.json'));
    logInformation('Current Working directory: ' +  process.cwd());
    let hostType = tl.getVariable('system.hostType');
    logInformation('Host Type is: ' + hostType);
    if ((hostType && hostType.toUpperCase() != 'BUILD')) {
        logInformation('Please note this is not a build pipeline. Publishing artifacts can only be achieved in build pipeline and not in release. This is a limitation from azure itself. ' +
        'You are requested to use te extension either in build pipeline or use the azure storage static store to host your results. ' +
        'Enabling the azure blob storage in the pipeline and enabling static hosting on storage container would still allow you to publish results using azure release pipeline. ' +
        'See sample Usage here: https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/tree/main/samples');
        logInformation(ERROR_DEFAULT_MSG);
        tl.warning('Skipping Publish Artifact step for ' + artifactName + ' since it is not a build pipeline.')
        return;
    }

    let data = {
        artifacttype: 'Container',
        artifactname: artifactName,
        containerfolder: artifactName,
        localpath: pathToPublish
    };

    tl.command("artifact.upload", data, pathToPublish);
    let event = 'Completed Uploading Artifacts from : ' + pathToPublish + ' to location: ' + pathToPublish
    logInformation(event);
    LogEvent(event);
}
