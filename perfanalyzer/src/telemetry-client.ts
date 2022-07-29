// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { APPINSIGHTS_CONNECTION_MS_STRING } from "./appInsightsConnectionString-ms";
import {InputVariables} from './constant'
import tl = require('azure-pipelines-task-lib/task');
import { APPINSIGHTS_CONNECTION_STRING } from "./appInsightsConnectionString";

let appInsights = require('applicationinsights');

let appInsightsMSClient = null;
let appInsightsClient = null;

let telemetryProps:{} = null;
let logTelemetry: boolean = true;

export function enableAppInsights() {
  logTelemetry = tl.getBoolInput(InputVariables.LOG_TELEMETRY, true);
  if(logTelemetry) {
    try {
        configureAppInsightsMS(APPINSIGHTS_CONNECTION_MS_STRING);
        console.log('Successfuly Initialized MS Telemetry.');
    } catch(e) {
        console.warn('MS Telemetry Unable to Initialize: ' + e?.message);
    }

  } else {
    console.info('Telemetry Logging Turned off.')
  }
}

function configureAppInsightsMS(key: string) {
    try {
        appInsights.setup(key)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(false)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
        .start();

        appInsightsMSClient = appInsights.defaultClient;
        appInsightsClient = new appInsights.TelemetryClient(APPINSIGHTS_CONNECTION_STRING);
      

    } catch(e) {
        console.warn('MS Application insights could not be started: ' + e?.message);
        trackException(' Application insights could not be started: ' + e?.message, e);
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

    try {
      appInsightsClient.trackEvent({name: eventName, properties: GetDefaultProps()});
  } catch(e) {
     console.warn('[Ignore] Telemetry LogEvent Error: ' + e?.message,e )
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
       console.warn('[Ignore] MS Telemetry trackTrace Error: ' + e?.message,e )
    }

    try {
      appInsightsClient.trackTrace({message: message, properties: GetDefaultProps()});
    } catch(e) {
      console.warn('[Ignore] Telemetry trackTrace Error: ' + e?.message,e )
    }
}

export function trackException(message: any, stack: any=null) {
    if(! logTelemetry) {
      console.info('Telemetry Logging Turned off.');
      return;
    }

    try {
        const error = new MyError(message, stack);
        appInsightsMSClient.trackException({ exception: error , properties: GetDefaultProps()});
    } catch(e) {
       console.warn('[Ignore] MS Telemetry trackTrace Error: ' + e?.message,e )
    }

    try {
      const error = new MyError(message, stack);
      appInsightsClient.trackException({ exception: error , properties: GetDefaultProps()});
    } catch(e) {
      console.warn('[Ignore] Telemetry trackTrace Error: ' + e?.message,e )
    }
}

function GetDefaultProps() {
    if(null != telemetryProps && Object.keys(telemetryProps).length > 0) {
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

    constructor (msg, stack) {
      super(msg)
      this.name = 'MyError'
      this.message = msg;
      this.stack = stack;
    }
}

function getSystemProps(prop: string) {
    try {
        return  tl.getVariable(prop);
    } catch (e) {
        trackTrace('[Ignore] Telemetry System props Unable to fetch : '+ prop + ' Warning: '+ e?.message )
    }
}
