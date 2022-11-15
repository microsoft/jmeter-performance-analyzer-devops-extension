// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { publishData } from './src/azure-task-lib.utility'
import { copyResultsToAzureBlob } from './src/blob-utils'
import { getCommands } from './src/commands'
import { CommandTypes, DEFAULT_JMETER_LOG_DIR_NAME, DEFAULT_JMETER_REPORT_DIR_NAME, ERROR_DEFAULT_MSG, InputVariables, InputVariableType, JMETER_BIN_Folder_NAME, JMETER_EXT_Folder_NAME, JMETER_FILE_NAME, JMETER_LIB_Folder_NAME, JMETER_LOG_FILE_NAME, LOG_JTL_FILE_NAME } from './src/constant'
import { analyzeJTL, handleJMeterCustomPlugin, handleJMeterInputFile, handleJMeterJMXFile, handleJMeterPropertyFile, promiseFromChildProcess } from './src/jmeter-utils'
import { replaceTokens } from './src/replaceToken'
import { enableAppInsights, LogEvent, trackException, trackTrace } from './src/telemetry-client'
import { TelemetryEvents, TraceLevel } from './src/telemetry.constants'
import { downloadFile, isEmpty, logInformation, getType, unzipBinary } from './src/utility'
const tl = require('azure-pipelines-task-lib/task');
const Path = require('path');
var exec = require('child_process').exec;
const fs = require('fs');

async function PostResults(jmeterReportFolder: string, jmeterLogFolder: string, JMETER_ABS_BIN_Folder: string) {
    try {
        let copyToBlob = tl.getBoolInput(InputVariables.COPY_RESULT_TO_AZURE_BLOB_STORAGE, true);
        if(copyToBlob) {
            LogEvent(TelemetryEvents.COPYING_DATA_TO_AZURE_BLOB_STORAGE);

            logInformation('Started: Copying Test Results to Azure blob storage.', TraceLevel.Verbose)
            await copyResultsToAzureBlob(jmeterReportFolder, jmeterLogFolder);
            logInformation('Completed: Copying Test Results to Azure blob storage.', TraceLevel.Information)
        }
    } catch (e) {
        logInformation('Error Publishing report to blob storage: ' + e?.message, TraceLevel.Error);
        trackException('Error Publishing report to blob storage: ' + e?.message, e);
        console.error(e);
        tl.error(e);
        logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
    }

    let ReportABSPath = Path.join(JMETER_ABS_BIN_Folder,jmeterReportFolder);
    let LogABSPath = Path.join(JMETER_ABS_BIN_Folder,jmeterLogFolder);

    let publishResultsToBuildArtifact = tl.getBoolInput(InputVariables.PUBLISH_RESULTS_TO_BUILD_ARTIFACT, true);

    if(publishResultsToBuildArtifact) {
        let artifactReport = tl.getInput(InputVariables.ARTIFACT_NAME_REPORT,true);
        let artifactLOG = tl.getInput(InputVariables.ARTIFACT_NAME_LOG,true);
        LogEvent(TelemetryEvents.PUBLISH_DATA_TO_BUILD_ARTIFACT);
        logInformation(TelemetryEvents.PUBLISH_DATA_TO_BUILD_ARTIFACT, TraceLevel.Verbose);

        try {
            await publishData(LogABSPath, artifactLOG);
            logInformation('Completed: Publishing data to build artifacts: Log ', TraceLevel.Verbose);
            LogEvent(TelemetryEvents.PUBLISH_LOG_DATA_TO_BUILD_ARTIFACT_SUCCESS);
        } catch(e: any) {
            tl.error(e);
            logInformation('Error Publishing log: ' + e?.message, TraceLevel.Error);
            trackException('Error Publishing log: ' + e?.message, e);
            logInformation('Artifacts {LOG} are present at location: ' + LogABSPath, TraceLevel.Error);
            logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
            LogEvent(TelemetryEvents.PUBLISH_LOG_DATA_TO_BUILD_ARTIFACT_FAILED);
        }
 
        try {
            await publishData(ReportABSPath, artifactReport);
            logInformation('Completed: Publishing data to build artifacts: Report ', TraceLevel.Information);
            LogEvent(TelemetryEvents.PUBLISH_REPORT_DATA_TO_BUILD_ARTIFACT_SUCCESS);
        } catch(e: any) {
            tl.error(e);
            logInformation('Error Publishing report: ' + e?.message, TraceLevel.Error);
            trackException('Error Publishing report: ' + e?.message, e);
            logInformation('Artifacts {Report} are present at location: ' + ReportABSPath, TraceLevel.Error);
            logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
            LogEvent(TelemetryEvents.PUBLISH_REPORT_DATA_TO_BUILD_ARTIFACT_FAILED);
        }
        analyzeJTL(jmeterLogFolder);
    } else {
        analyzeJTL(jmeterLogFolder);
    }
}

async function main() {
    let startTimeInSeconds = Math.round(Date.now() / 1000)
    try {
        LogEvent(TelemetryEvents.STARTED_PERFORMANCE_TEST);

        let JMETER_URL = tl.getInput(InputVariables.JMX_BINARY_URI,true);
        let JMETER_FILE_Folder = tl.getInput(InputVariables.JMETER_FOLDER_NAME,true);
        let JMETER_BIN_Folder = Path.join(JMETER_FILE_Folder, JMETER_BIN_Folder_NAME);
        let JMETER_ABS_BIN_Folder = Path.join( process.cwd(),JMETER_FILE_Folder, JMETER_BIN_Folder_NAME);
        let JMETER_ABS_LIB_EXT_Folder = Path.join( process.cwd(),JMETER_FILE_Folder, JMETER_LIB_Folder_NAME, JMETER_EXT_Folder_NAME);

        logInformation('Current Working directory: ' +  process.cwd(), TraceLevel.Verbose);
        logInformation('JMETER_URL ' + JMETER_URL, TraceLevel.Verbose);
        logInformation('JMETER_FILE_Folder ' + JMETER_FILE_Folder, TraceLevel.Verbose);
        logInformation('JMETER_BIN_Folder ' + JMETER_BIN_Folder, TraceLevel.Verbose);
        logInformation('JMETER_ABS_BIN_Folder ' + JMETER_ABS_BIN_Folder, TraceLevel.Verbose);
        logInformation('Current Working directory: ' +  process.cwd(), TraceLevel.Verbose);
        

        logInformation('Start Downloading JMeter Binary', TraceLevel.Verbose)
        await downloadFile(JMETER_URL, JMETER_FILE_NAME);
        logInformation('Completed Downloading JMeter Binary', TraceLevel.Information)
        LogEvent(TelemetryEvents.DOWNLOADED_JMETER_BINARY);
        
        logInformation('Start Unzipping JMeter Binary', TraceLevel.Verbose)
        await unzipBinary(JMETER_FILE_NAME);
        logInformation('Completed Unzipping JMeter Binary', TraceLevel.Information)

        let addCustomPluginsToLib = tl.getBoolInput(InputVariables.ADD_CUSTOM_PLUGIN_TO_JMETER_LIB,true);
        if(addCustomPluginsToLib) {
            logInformation('Custom Plugins Enabled', TraceLevel.Information);
            LogEvent(TelemetryEvents.ENABLED_CUSTOM_PLUGINS);
            let customPluginSource = tl.getInput(InputVariables.CUSTOM_PLUGIN_SOURCE,true);
            if(isEmpty(customPluginSource))  {
                let msg = 'No Source selected for custom plugin and addCustomPlugins were turned on. Either turn off the `addCustomPluginsToJMeterLib`  or provide source input for variable `customPluginSource`';
                logInformation(msg, TraceLevel.Critical);
                tl.setResult(tl.TaskResult.Failed, msg);
                return;
            }
            let jmeterCustomPluginFileNames:string[] = await handleJMeterCustomPlugin(JMETER_ABS_LIB_EXT_Folder, customPluginSource);
            if(null == jmeterCustomPluginFileNames || jmeterCustomPluginFileNames.length == 0)  {
                logInformation('No Custom Plugins were copied to jeter lib/ext folder', TraceLevel.Warning); 
                //return;
            } else {
                logInformation(jmeterCustomPluginFileNames.length + ' Plugins were copied to jeter lib/ext folder', TraceLevel.Information); 
            }
        } else {
            logInformation('Custom Plugins not enabled', TraceLevel.Information);
        }

        await process.chdir(JMETER_ABS_BIN_Folder);
        logInformation('Change Directory to JMeter Bin Path ' + JMETER_ABS_BIN_Folder + ' completed. Current Working Directory: ' + process.cwd(), TraceLevel.Verbose);

        allowCompleteReadWriteAccess(process.cwd());
        logInformation('Start handleJMeterJMXFile. Current Working directory' + process.cwd(), TraceLevel.Verbose);
        let jmeterJMXFileName:string = await handleJMeterJMXFile(JMETER_ABS_BIN_Folder);
        logInformation('Completed handleJMeterJMXFile JMXFileName: '+ jmeterJMXFileName, TraceLevel.Information);
        
        let jmxPropertySource = tl.getInput(InputVariables.JMX_PROPERTY_FILE_SOURCE,true);
        let jmxInputFilesSource = tl.getInput(InputVariables.JMX_INPUT_FILE_SOURCE,true);
        let jmeterPropertyFileName:string = '';

        if(jmxPropertySource == InputVariableType.None) {
            logInformation('No Property File Configuration Enabled. Skipping Property Configuration Step.', TraceLevel.Information)
        } else {
            logInformation('Start Handle Property Files. Current Working directory: ' + process.cwd(), TraceLevel.Verbose);
            jmeterPropertyFileName = await handleJMeterPropertyFile(JMETER_ABS_BIN_Folder);
            if(isEmpty(jmeterPropertyFileName))  {
                logInformation('No Property Input Files Found to Use In Pipeline', TraceLevel.Critical);
                tl.setResult(tl.TaskResult.Failed, 'No Property Input Files Found to Use In Pipeline');
                return;
            }
            logInformation('Completed Handle Property Files jmeterPropertyFileName: '+ jmeterPropertyFileName, TraceLevel.Information)
        }

        if(jmxInputFilesSource == InputVariableType.None) {
            logInformation('No Input File Configuration Enabled. Skipping Input File Configuration Step.', TraceLevel.Information)
        } else {
            logInformation('Start Handle Input Files. Current Working directory: ' + process.cwd(), TraceLevel.Verbose);
            let jmeterInputFileNames:string[]|null = await handleJMeterInputFile(JMETER_ABS_BIN_Folder);
            logInformation('Completed Handle Input Files. FileCount: ' + ((null != jmeterInputFileNames) ? jmeterInputFileNames?.length : 0), TraceLevel.Information);
        }

        let jmeterLogFolder = tl.getInput(InputVariables.JMETER_LOG_FOLDER,true);
        let jmeterReportFolder = tl.getInput(InputVariables.JMETER_REPORT_FOLDER,true);

        if(isEmpty(jmeterLogFolder)) {
            jmeterLogFolder = DEFAULT_JMETER_LOG_DIR_NAME;
            logInformation('Missing JMeter Log Folder Name. Using ' + DEFAULT_JMETER_LOG_DIR_NAME + ' as default name.', TraceLevel.Information);
        }

        if(isEmpty(jmeterReportFolder)) {
            jmeterReportFolder = DEFAULT_JMETER_REPORT_DIR_NAME;
            logInformation('Missing JMeter Report Folder Name. Using ' + DEFAULT_JMETER_REPORT_DIR_NAME + ' as default name.', TraceLevel.Information);
        }

        let command = '';
        let CurrentLogJTLFile =  Path.join(jmeterLogFolder, LOG_JTL_FILE_NAME);
        let CurrentLogLogFile =  Path.join(jmeterLogFolder, JMETER_LOG_FILE_NAME);
        let additionalCommandLineArguments = tl.getInput(InputVariables.ADDITIONAL_COMMAND_LINE_ARGUMENTS,true);        
        
        logInformation('Additional command Length: ' + (null ==  additionalCommandLineArguments || additionalCommandLineArguments.length == 0) ? 0 : additionalCommandLineArguments.length, TraceLevel.Information);
        logInformation('Additional command to be appeneded while Run: ' + additionalCommandLineArguments, TraceLevel.Information);

        if(jmxPropertySource==InputVariableType.None) {
            LogEvent(TelemetryEvents.JMETER_RUN_WITHOUT_PROPERTY_FILE);
            command = getCommands(CommandTypes.JMETER_RUN_WITHOUT_PROPERTY, jmeterJMXFileName, CurrentLogJTLFile, CurrentLogLogFile, jmeterReportFolder, additionalCommandLineArguments);
            logInformation('Running JMeter Without Property File: ' + command, TraceLevel.Information);
        } else {
            LogEvent(TelemetryEvents.JMETER_RUN_WITH_PROPERTY_FILE);
            logInformation('Running Replace Tokens for file ' + jmeterPropertyFileName + ' Current Working directory: ' + process.cwd(), TraceLevel.Verbose);
            await replaceTokens(jmeterPropertyFileName)
            logInformation('Completed Replace Tokens', TraceLevel.Information);

            command = getCommands(CommandTypes.JMETER_RUN_WITH_PROPERTY, jmeterPropertyFileName, jmeterJMXFileName, CurrentLogJTLFile, CurrentLogLogFile, jmeterReportFolder, additionalCommandLineArguments);
            logInformation('Running JMeter with property file ' + command, TraceLevel.Information);
        }

        var child = exec(command);
        promiseFromChildProcess(child).then(function (result:any) {
            logInformation(`promise complete: ${result}`, TraceLevel.Information);
            
            if(getType(result) =='number' && result == 0) {
                logInformation('Closing Code Status: Success', TraceLevel.Information);
                PostResults(jmeterReportFolder, jmeterLogFolder, JMETER_ABS_BIN_Folder);
                logInformation('Task Completed.', TraceLevel.Information)
            } else {
                let msg = `Closing Status was not Success. Task to execute command failed with code: ${result}`
                logInformation(msg, TraceLevel.Error);
                trackException(msg);
                tl.setResult(tl.TaskResult.Failed, msg);
            }
            
        }, function (err) {
            tl.error(err);
            logInformation(`promise rejected: ${err}`, TraceLevel.Error);
            logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error)
        });

        child.stdout.on('data', function (data) {
            logInformation(data,TraceLevel.Verbose, false, false);
        });
        child.stderr.on('data', function (data) {
            logInformation(`stderr: ${data}`, TraceLevel.Error, false);
        });
        child.on('close', function (code) {
            logInformation(`closing code: ${code}`, TraceLevel.Information);
            LogEvent(TelemetryEvents.CLOSE_CODE, {code: code.toString()});
        });
        const { stdout, stderr } = await child;

    } catch (err: any) {
        tl.error(err);
        logInformation(err, TraceLevel.Error);
        trackException(err?.message, err)
        logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
        tl.setResult(tl.TaskResult.Failed, err?.message);
        LogEvent(TelemetryEvents.JMETER_RUN_FAILURE)
    }
    
    let endTimeInSeconds = Math.round(Date.now() / 1000)
    let timeToRunInSeconds: number = endTimeInSeconds - startTimeInSeconds;
    trackTrace(`Time to run JMeter Task in seconds = '${timeToRunInSeconds}'`, TraceLevel.Information);
    LogEvent(TelemetryEvents.COMPLETED_PERFORMANCE_TEST);
}

function allowCompleteReadWriteAccess(path: string) {
    try {
        fs.chmodSync(path, '755');
    } catch(e) {
        trackException('fs.chmodSync failed : ' + e?.message , e);
    }
    
    //let pathValue = COMMAND_TO_SET_PERMISSION.replace(COMMAND_TO_SET_PERMISSION_PATH_HOLDER, path);
    //RunPowershellCommand(pathValue);

}


enableAppInsights();
main();

