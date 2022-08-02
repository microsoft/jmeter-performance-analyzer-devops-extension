// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { APPINSIGHTS_CONNECTION_STRING } from "./appInsightsConnectionString";
import { APPINSIGHTS_CONNECTION_MS_CLASSIC_STRING, APPINSIGHTS_CONNECTION_MS_STRING } from "./appInsightsConnectionString-ms";
import { InputVariables, SeverityLevel, TraceLevel } from './constant';
import tl = require('azure-pipelines-task-lib/task');
import { getSystemProps } from "./utility";
const globalAny:any = global;
let appInsights = require('applicationinsights');

let appInsightsMSClient = null;
let appInsightsMSClassicClient = null;
let appInsightsClient = null;

let telemetryProps:{} = null;
let logTelemetry: boolean = true;

export function enableAppInsights() {
    logTelemetry = tl.getBoolInput(InputVariables.LOG_TELEMETRY, true);
    if(!logTelemetry) {
      console.info('Telemetry Logging Turned off.')
      return;
    }

    try {
        appInsights.setup(APPINSIGHTS_CONNECTION_MS_STRING)
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
        console.log('Successfuly Initialized MS Telemetry.');
        
        appInsightsMSClassicClient = new appInsights.TelemetryClient(APPINSIGHTS_CONNECTION_MS_CLASSIC_STRING);
        console.log('Successfuly Initialized MS Classic Telemetry.');
        
        appInsightsClient = new appInsights.TelemetryClient(APPINSIGHTS_CONNECTION_STRING);
        console.log('Successfuly Initialized Telemetry.');

        console.log('Running Pipeline Host: ' + getSystemProps('system.hostType'));
        trackTrace('Running Pipeline Host: ' + getSystemProps('system.hostType'), TraceLevel.Verbose);
      

    } catch(e) {
        console.warn('MS Application insights could not be started: ' + e?.message);
        trackException(' Application insights could not be started: ' + e?.message, e);
    }
}


export async function LogEvent(eventName: string) {
    if(! logTelemetry) {
      console.info('Telemetry Logging Turned off.');
      return;
    }

    try {
        appInsightsMSClient.trackEvent({name: eventName, properties: GetDefaultProps()});
        appInsightsClient.trackEvent({name: eventName, properties: GetDefaultProps()});
        appInsightsMSClassicClient.trackEvent({name: eventName, properties: GetDefaultProps()});
    } catch(e) {
       console.warn('[Ignore] MS Telemetry LogEvent Error: ' + e?.message,e )
    }
}

export async function trackTrace(message: string, traceSeverity: TraceLevel) {
    if(! logTelemetry) {
      console.info('Telemetry Logging Turned off.');
      return;
    }
    let props = GetDefaultProps();
    try {
        appInsightsMSClient.trackTrace({message: message, severityLevel: this.getSeverity(traceSeverity)}, props);
        appInsightsClient.trackTrace({message: message, severityLevel: this.getSeverity(traceSeverity)}, props);
        appInsightsMSClassicClient.trackTrace({message: message, severityLevel: this.getSeverity(traceSeverity)}, props);
    } catch(e) {
       console.warn('[Ignore] MS Telemetry trackTrace Error: ' + e?.message,e )
    }
}

export async function trackException(message: any, stack: any=null) {
    if(! logTelemetry) {
      console.info('Telemetry Logging Turned off.');
      return;
    }

    try {
        const error = new MyError(globalAny.UNIQUE_RUN_ID, message, stack);
        trackTrace(error.getErrorString(), TraceLevel.Error);
        appInsightsMSClient.trackException({id: globalAny.UNIQUE_RUN_ID, error: {name: globalAny.UNIQUE_RUN_ID, message: error}, exception:stack, severityLevel: SeverityLevel.Error });
        appInsightsClient.trackException({id: globalAny.UNIQUE_RUN_ID, error: {name: globalAny.UNIQUE_RUN_ID, message: error}, exception:stack, severityLevel: SeverityLevel.Error });
        appInsightsMSClassicClient.trackException({id: globalAny.UNIQUE_RUN_ID, error: {name: globalAny.UNIQUE_RUN_ID, message: error}, exception:stack, severityLevel: SeverityLevel.Error });
    } catch(e) {
       console.warn('[Ignore] MS Telemetry trackTrace Error: ' + e?.message,e )
    }
}

export function getSeverity(tracelLevel: TraceLevel): SeverityLevel {
  switch( tracelLevel) {
      case TraceLevel.Verbose:
          return SeverityLevel.Verbose;

      case TraceLevel.Information:
          return SeverityLevel.Information

      case TraceLevel.Warning:
          return SeverityLevel.Warning

      case TraceLevel.Error:
          return SeverityLevel.Error

      case TraceLevel.Critical:
          return SeverityLevel.Critical
          
      default:
          return SeverityLevel.Verbose;
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

    constructor (guid: string,msg, stack) {
      super(msg)
      this.name = guid
      this.message = `${msg} - ${(null == stack)? '' : stack.toString() }`;
      this.stack = stack;
    }

    public getErrorString() {
      return this.message;
    }
}


