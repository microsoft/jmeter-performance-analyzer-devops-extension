// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { APPINSIGHTS_CONNECTION_MS_STRING } from "./appInsightsConnectionString-ms";
import { logInformation } from "./utility";
import {InputVariables} from './constant'


let appInsightsMS = require('applicationinsights');
let appInsightsMSClient = appInsightsMS.defaultClient;

let telemetryProps:{} = null;
import tl = require('azure-pipelines-task-lib/task');

let logTelemetry: boolean = true;

export function enableAppInsights() {
  logTelemetry = tl.getBoolInput(InputVariables.LOG_TELEMETRY, true);
  if(logTelemetry) {
    configureAppInsightsMS(APPINSIGHTS_CONNECTION_MS_STRING);
  } else {
    console.info('Telemetry Logging Turned off.')
  }
}



function configureAppInsightsMS(key: string) {
    try {
        appInsightsMS.setup(key)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(appInsightsMS.DistributedTracingModes.AI)
        .start();
        appInsightsMSClient = appInsightsMS.defaultClient;
    } catch(e) {
        console.warn('MS Application insights could not be started: ' + e?.message);
    }
}

export function LogEvent(eventName: string) {
    if(! logTelemetry) {
      console.info('Telemetry Logging Turned off.');
      return;
    }

    try {
        appInsightsMSClient.trackEvent({name: eventName, properties: GetDefaultProps()});
    } catch(e) {
       console.warn('[Ignore] MS Telemetry LogEvent Error: ' + e?.message,e )
    }

}

export function trackTrace(message: string) {
    if(! logTelemetry) {
      console.info('Telemetry Logging Turned off.');
      return;
    }

    try {
        appInsightsMSClient.trackTrace({message: message, properties: GetDefaultProps()});
    } catch(e) {
       console.warn('[Ignore] Telemetry trackTrace Error: ' + e?.message,e )
    }

}
export function trackException(message: string) {
    if(! logTelemetry) {
      console.info('Telemetry Logging Turned off.');
      return;
    }

    try {
        const error = new MyError(message);
        appInsightsMSClient.trackException({ exception: error , properties: GetDefaultProps()});
    } catch(e) {
       console.warn('[Ignore] Telemetry trackTrace Error: ' + e?.message,e )
    }

}

function GetDefaultProps() {
    if(null != telemetryProps && Object.keys(telemetryProps).length > 0) {
      //logInformation('Using Telemetry Props Count: ' + Object.keys(telemetryProps).length);
      return telemetryProps;
    }

    let props = {

        buildQueuedBy	: getSystemProps ('Build.QueuedBy'),
        buildQueuedById: getSystemProps ('Build.QueuedById'),
        buildReason: getSystemProps ('Build.Reason'),
        buildRepositoryLocalPath: getSystemProps ('Build.ReasonBuild.Repository.LocalPath'),
        buildRepositoryName: getSystemProps ('Build.Repository.Name'),
        buildRepositoryURI: getSystemProps ('Build.Repository.Uri'),
        buildDefinitionName: getSystemProps ('Build.DefinitionName'),
    		buildId: getSystemProps ('Build.BuildId'),
        buildArtifactStagingDirectory: getSystemProps('Build.ArtifactStagingDirectory'),
        buildNumber: getSystemProps('Build.BuildNumber'),
        buildRequestedFor	: getSystemProps('Build.RequestedFor'),
        buildRequestedForEmail	: getSystemProps('Build.RequestedForEmail'),
        buildRequestedForId	: getSystemProps('Build.RequestedForId'),
        buildSourceBranch	: getSystemProps('Build.SourceBranch'),

    		agentId: getSystemProps ('Agent.Id'),
    		agentOS: getSystemProps ('Agent.OS'),
    		agentName: getSystemProps ('Agent.Name'),
        agentOSArchitecture: getSystemProps ('Agent.OSArchitecture'),
    		agentMachineName: getSystemProps ('Agent.MachineName'),

        systemHostType: getSystemProps('system.hostType'),
        systemDefinitionId: getSystemProps('system.DefinitionId'),
        systemJobDisplayName: getSystemProps('system.JobDisplayName'),
        systemCollectionId: getSystemProps ('system.CollectionId'),
        systemJobId: getSystemProps ('System.JobId'),
        systemJobAttempt: getSystemProps ('System.JobAttempt'),

    		environmentName: getSystemProps ('Environment.Name'),
        environmentId: getSystemProps ('Environment.Id'),
        environmentResourceName: getSystemProps ('Environment.ResourceName'),
        environmentResourceId: getSystemProps ('Environment.ResourceId'),
        strategyName: getSystemProps ('Strategy.Name'),

        releaseEnvironmentUri: getSystemProps ('Release.EnvironmentUri'),
    		releaseName	: getSystemProps ('Release.ReleaseName'),
    		releaseURI	: getSystemProps ('Release.ReleaseUri'),
    		releaseRequestedForEmail: getSystemProps ('Release.RequestedForEmail'),
    		releaseDeploymentID: getSystemProps ('Release.DeploymentID'),
    		releaseDefinitionId: getSystemProps ('Release.DefinitionId'),
    		releaseDefinitionName: getSystemProps ('Release.DefinitionName'),
        releaseDeploymentRequestedFor: getSystemProps ('Release.Deployment.RequestedFor'),
        releaseDeploymentRequestedForEmail: getSystemProps ('Release.Deployment.RequestedForEmail'),
        releaseEnvironmentName: getSystemProps ('Release.EnvironmentName'),
        releaseReleaseId: getSystemProps ('Release.ReleaseId'),
        releaseRequestedFor: getSystemProps ('Release.RequestedFor')
    }
    telemetryProps = props;
    console.log('Created Telemetry Props Count: ' + Object.keys(props).length);
    return props;
}
class MyError extends Error {

    constructor (msg) {
      super(msg)
      this.name = 'MyError'
    }
}

function getSystemProps(prop: string) {
    try {
        return  tl.getVariable(prop);
    } catch (e) {
        trackTrace('[Ignore] Telemetry System props Unable to fetch : '+ prop + ' Warning: '+ e?.message )
    }
}
