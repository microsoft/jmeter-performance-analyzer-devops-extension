// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { APPINSIGHTS_CONNECTION_STRING } from "./appInsightsConnectionString";
import { APPINSIGHTS_CONNECTION_MS_CLASSIC_STRING, APPINSIGHTS_CONNECTION_MS_STRING } from "./appInsightsConnectionString-ms";
import { InputVariables } from './constant';
import { SeverityLevel, TelemetryEvents, TraceLevel } from './telemetry.constants';
import { getFormatPrefix, getSystemProps, isObjectEmpty } from "./utility";
import tl = require('azure-pipelines-task-lib/task');
const globalAny:any = global;
let appInsights = require('applicationinsights');

let appInsightsMSClient = null;
let appInsightsMSClassicClient = null;
let appInsightsClient = null;

let telemetryProps:{} = null;
let logTelemetry: boolean = true;

function logTelemetryTurnedOff() {
  try {
    appInsights.setup(APPINSIGHTS_CONNECTION_MS_STRING)
      .start();

      appInsightsMSClient = appInsights.defaultClient;         
      appInsightsMSClassicClient = new appInsights.TelemetryClient(APPINSIGHTS_CONNECTION_MS_CLASSIC_STRING);         
      appInsightsClient = new appInsights.TelemetryClient(APPINSIGHTS_CONNECTION_STRING);

      appInsightsMSClient.trackEvent({name: TelemetryEvents.TELEMETRY_TURNED_OFF});
      appInsightsClient.trackEvent({name: TelemetryEvents.TELEMETRY_TURNED_OFF});
      appInsightsMSClassicClient.trackEvent({name: TelemetryEvents.TELEMETRY_TURNED_OFF});
  } catch(exception) {
    console.log('Telemetry Logs turned off. No Updates on telemetry further.')
  }
}

function addDefaultProps() {
  try {
    appInsightsMSClient.commonProperties = GetDefaultProps();
    appInsightsMSClassicClient.commonProperties = GetDefaultProps();
    appInsightsClient.commonProperties = GetDefaultProps();
    console.log('Enabled Default props')
  } catch(e) {
    console.log('Default Props are not Enabled.')
  }
}

export function enableAppInsights() {
    logTelemetry = tl.getBoolInput(InputVariables.LOG_TELEMETRY, true);
    if(!logTelemetry) {
      console.info('Telemetry Logging Turned off.');
      logTelemetryTurnedOff();
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
        appInsightsMSClassicClient = new appInsights.TelemetryClient(APPINSIGHTS_CONNECTION_MS_CLASSIC_STRING);         
        appInsightsClient = new appInsights.TelemetryClient(APPINSIGHTS_CONNECTION_STRING);
        console.log('Successfuly Initialized Telemetry.');
        
        addDefaultProps();
        logMachineInfo();
    } catch(e) {
        console.warn('MS Application insights could not be started: ' + e?.message);
    }
}



function logMachineInfo() {
  console.log(`${getFormatPrefix()} Running Pipeline Host:  ${getSystemProps('system.hostType')}`);
  console.log(`${getFormatPrefix()} Agent Id: ${getSystemProps ('Agent.Id')}`);
  console.log(`${getFormatPrefix()} Agent OS: ${getSystemProps ('Agent.OS')}`);
  console.log(`${getFormatPrefix()} Agent Name: ${getSystemProps ('Agent.Name')}`);
  console.log(`${getFormatPrefix()} Agent OSArchitecture: ${getSystemProps ('Agent.OSArchitecture')}`);
  console.log(`${getFormatPrefix()} Agent MachineName: ${getSystemProps ('Agent.MachineName')}`); 

  trackTrace('Running Pipeline Host: ' + getSystemProps('system.hostType'), TraceLevel.Information);
  trackTrace(`Agent Id: ${getSystemProps ('Agent.Id')}`, TraceLevel.Information);
  trackTrace(`Agent OS: ${getSystemProps ('Agent.OS')}`, TraceLevel.Information);
  trackTrace(`Agent Name: ${getSystemProps ('Agent.Name')}`, TraceLevel.Information);
  trackTrace(`Agent OSArchitecture: ${getSystemProps ('Agent.OSArchitecture')}`, TraceLevel.Information);
  trackTrace(`Agent MachineName: ${getSystemProps ('Agent.MachineName')}`, TraceLevel.Information); 

  try {
    LogEvent('Running.Pipeline.Host' , {'host' : getSystemProps('system.hostType')});
    LogEvent('Agent.Id' , {'host' : getSystemProps('Agent.Id')});
    LogEvent('Agent.OS' , {'host' : getSystemProps('Agent.OS')});
    LogEvent('Agent.Name' , {'host' : getSystemProps('Agent.Name')});
    LogEvent('Agent.OSArchitecture' , {'host' : getSystemProps('Agent.OSArchitecture')});
    LogEvent('Agent.MachineName' , {'host' : getSystemProps('Agent.MachineName')});
  } catch (e) {

  }
  
}

export async function LogEvent(eventName: string, props: {} = null) {
    if(! logTelemetry) {
      return;
    }

    let loggedProps; 
    if(!isObjectEmpty(props)) {
      let defaultProps = GetDefaultProps();
      loggedProps = Object.assign(defaultProps, props)
    } else {
      loggedProps = props;
    }

    try {
        appInsightsMSClient.trackEvent({name: eventName, properties: loggedProps});
        appInsightsClient.trackEvent({name: eventName, properties: loggedProps});
        appInsightsMSClassicClient.trackEvent({name: eventName, properties: loggedProps});
    } catch(e) {
       console.warn('[Ignore] MS Telemetry LogEvent Error: ' + e?.message )
    }
}

export async function trackTrace(message: string, traceSeverity: TraceLevel) {
    if(! logTelemetry) {
      return;
    }
    let props = GetDefaultProps();
    try {
        appInsightsMSClient.trackTrace({message: message, severityLevel: getSeverity(traceSeverity)}, props);
        appInsightsClient.trackTrace({message: message, severityLevel: getSeverity(traceSeverity)}, props);
        appInsightsMSClassicClient.trackTrace({message: message, severityLevel: getSeverity(traceSeverity)}, props);
    } catch(e) {
       console.warn('[Ignore] MS Telemetry trackTrace Error: ' + e?.message )
    }
}

export async function trackException(message: any, stack: any=null) {
    if(! logTelemetry) {
      return;
    }

    try {
        let msgTrack = `${message} - ${(null == stack)? '' : stack.toString() }`;
        const error = new MyError(globalAny.UNIQUE_RUN_ID, message, stack);
        trackTrace(msgTrack, TraceLevel.Error);
        appInsightsMSClient.trackException({id: globalAny.UNIQUE_RUN_ID, error: {name: globalAny.UNIQUE_RUN_ID, message: error}, exception:stack, severityLevel: SeverityLevel.Error });
        appInsightsClient.trackException({id: globalAny.UNIQUE_RUN_ID, error: {name: globalAny.UNIQUE_RUN_ID, message: error}, exception:stack, severityLevel: SeverityLevel.Error });
        appInsightsMSClassicClient.trackException({id: globalAny.UNIQUE_RUN_ID, error: {name: globalAny.UNIQUE_RUN_ID, message: error}, exception:stack, severityLevel: SeverityLevel.Error });
    } catch(e) {
       console.warn('[Ignore] MS Telemetry trackTrace Error: ' + e?.message )
    }
}

async function getSeverity(tracelLevel: TraceLevel): Promise<SeverityLevel> {
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
    return props;
}
class MyError extends Error {

    constructor (guid: string, msg: string, stack: any) {
      super(msg)
      this.name = guid
      let stackMsg = (stack)?  stack.toString() : '';
      this.message = `${msg} - ${stackMsg}`;
      this.stack = stack;
    }

    public getErrorString() {
      return this.message;
    }
}


