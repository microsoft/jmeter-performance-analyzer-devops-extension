// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {InputVariables, InputVariableType, JMETER_FILE_NAME, JMETER_BIN_Folder_NAME, DEFAULT_JMETER_REPORT_DIR_NAME, DEFAULT_JMETER_LOG_DIR_NAME, LOG_JTL_FILE_NAME, JMETER_LOG_FILE_NAME, ERROR_DEFAULT_MSG, COMMAND_TO_SET_PERMISSION, COMMAND_TO_SET_PERMISSION_PATH_HOLDER, CommandTypes, TraceLevel } from './src/constant'
import {replaceTokens } from './src/replaceToken'
import { publishData } from './src/azure-task-lib.utility'
import { downloadFile, unzipBinary, logInformation, isEmpty } from './src/utility'
import { copyResultsToAzureBlob} from './src/blob-utils'
import { analyzeJTL, handleJMeterInputFile, handleJMeterJMXFile, handleJMeterPropertyFile, promiseFromChildProcess} from './src/jmeter-utils'
import { enableAppInsights, LogEvent, trackException, trackTrace } from './src/telemetry-client'
import {getCommands} from './src/commands'
const tl = require('azure-pipelines-task-lib/task');
const Path = require('path');
var exec = require('child_process').exec;
const fs = require('fs');

async function PostResults(jmeterReportFolder: string, jmeterLogFolder: string, JMETER_ABS_BIN_Folder: string) {
    try {
        let copyToBlob = tl.getBoolInput(InputVariables.COPY_RESULT_TO_AZURE_BLOB_STORAGE, true);
        if(copyToBlob) {
            let event = 'Copying Test Results to Azure blob storage.';
            LogEvent(event);

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
    let LogABSPath = Path.join(JMETER_ABS_BIN_Folder,jmeterReportFolder);

    let publishResultsToBuildArtifact = tl.getBoolInput(InputVariables.PUBLISH_RESULTS_TO_BUILD_ARTIFACT, true);

    if(publishResultsToBuildArtifact) {
        let artifactReport = tl.getInput(InputVariables.ARTIFACT_NAME_REPORT,true);
        let artifactLOG = tl.getInput(InputVariables.ARTIFACT_NAME_LOG,true);
        let event1 = 'Publishing data to build artifacts: Log ';
        LogEvent(event1);
        logInformation(event1, TraceLevel.Verbose);
        try {
            await publishData(LogABSPath, artifactLOG);
            logInformation('Completed: Publishing data to build artifacts: Log ', TraceLevel.Verbose);
        } catch(e: any) {
            tl.error(e);
            logInformation('Error Publishing log: ' + e?.message, TraceLevel.Error);
            trackException('Error Publishing log: ' + e?.message, e);
            logInformation('Artifacts {LOG} are present at location: ' + LogABSPath, TraceLevel.Error);
            logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
        }

        let event2 = 'Publishing data to build artifacts: Report ';
        LogEvent(event2);
        logInformation(event2, TraceLevel.Verbose);
        try {
            await publishData(ReportABSPath, artifactReport);
            logInformation('Completed: Publishing data to build artifacts: Report ', TraceLevel.Information);
        } catch(e: any) {
            tl.error(e);
            logInformation('Error Publishing report: ' + e?.message, TraceLevel.Error);
            trackException('Error Publishing report: ' + e?.message, e);
            logInformation('Artifacts {Report} are present at location: ' + ReportABSPath, TraceLevel.Error);
            logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
        }
        analyzeJTL(jmeterLogFolder);
    } else {
        analyzeJTL(jmeterLogFolder);
    }
}

async function main() {
    let startTimeInSeconds = Math.round(Date.now() / 1000)
    try {

        let JMETER_URL = tl.getInput(InputVariables.JMX_BINARY_URI,true);
        let JMETER_FILE_Folder = tl.getInput(InputVariables.JMETER_FOLDER_NAME,true);
        let JMETER_BIN_Folder = Path.join(JMETER_FILE_Folder, JMETER_BIN_Folder_NAME);
        let JMETER_ABS_BIN_Folder = Path.join( process.cwd(),JMETER_FILE_Folder, JMETER_BIN_Folder_NAME);


        logInformation('Current Working directory: ' +  process.cwd(), TraceLevel.Verbose);
        logInformation('JMETER_URL ' + JMETER_URL, TraceLevel.Verbose);
        logInformation('JMETER_FILE_Folder ' + JMETER_FILE_Folder, TraceLevel.Verbose);
        logInformation('JMETER_BIN_Folder ' + JMETER_BIN_Folder, TraceLevel.Verbose);
        logInformation('JMETER_ABS_BIN_Folder ' + JMETER_ABS_BIN_Folder, TraceLevel.Verbose);
        logInformation('Current Working directory: ' +  process.cwd(), TraceLevel.Verbose);

        logInformation('Start Downloading JMeter Binary', TraceLevel.Verbose)
        await downloadFile(JMETER_URL, JMETER_FILE_NAME);
        logInformation('Completed Downloading JMeter Binary', TraceLevel.Information)

        logInformation('Start Unzipping JMeter Binary', TraceLevel.Verbose)
        await unzipBinary(JMETER_FILE_NAME);
        logInformation('Completed Unzipping JMeter Binary', TraceLevel.Information)

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

        if(jmxPropertySource=='none') {
            command = getCommands(CommandTypes.JMETER_RUN_WITHOUT_PROPERTY, jmeterJMXFileName, CurrentLogJTLFile, CurrentLogLogFile, jmeterReportFolder);
            logInformation('Running JMeter Without Property File: ' + command, TraceLevel.Information);
        } else {
            logInformation('Running Replace Tokens for file ' + jmeterPropertyFileName + ' Current Working directory: ' + process.cwd(), TraceLevel.Verbose);
            await replaceTokens(jmeterPropertyFileName)
            logInformation('Completed Replace Tokens', TraceLevel.Information);

            command = getCommands(CommandTypes.JMETER_RUN_WITH_PROPERTY, jmeterPropertyFileName, jmeterJMXFileName, CurrentLogJTLFile, CurrentLogLogFile, jmeterReportFolder);
            logInformation('Running JMeter with property file ' + command, TraceLevel.Information);
        }

        var child = exec(command);
        promiseFromChildProcess(child).then(function (result) {
            logInformation(`promise complete: ${result}`, TraceLevel.Information);
            PostResults(jmeterReportFolder, jmeterLogFolder, JMETER_ABS_BIN_Folder);
            logInformation('Task Completed.', TraceLevel.Information)
        }, function (err) {
            tl.error(err);
            logInformation(`promise rejected: ${err}`, TraceLevel.Error);
            logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error)
        });

        child.stdout.on('data', function (data) {
            logInformation(data,TraceLevel.Verbose, false);
        });
        child.stderr.on('data', function (data) {
            logInformation(`stderr: ${data}`, TraceLevel.Error, false);
        });
        child.on('close', function (code) {
            logInformation(`closing code: ${code}`, TraceLevel.Information);
            if(code && code.toString().trim() == '0') {
                logInformation('Closing Code Status: Success', TraceLevel.Information)
            } else {
                let msg = `Closing Status was not 0. Task to execute command failed with code: ${code}`
                logInformation(msg, TraceLevel.Error);
                trackException(msg);
                tl.setResult(tl.TaskResult.Failed, msg);
            }
        });
        const { stdout, stderr } = await child;

    } catch (err: any) {
        tl.error(err);
        logInformation(err, TraceLevel.Error);
        trackException(err?.message, err)
        logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
        tl.setResult(tl.TaskResult.Failed, err?.message);
    }

    
    let endTimeInSeconds = Math.round(Date.now() / 1000)
    let timeToRunInSeconds: number = endTimeInSeconds - startTimeInSeconds;
    trackTrace(`Time to run JMeter Task in seconds = '${timeToRunInSeconds}'`, TraceLevel.Information);
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
