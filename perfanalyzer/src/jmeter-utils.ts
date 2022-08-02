// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ERROR_DEFAULT_MSG, InputVariables, InputVariableType, LOG_JTL_FILE_NAME, TraceLevel } from './constant';
import { trackException } from './telemetry-client';
import { copyDirectoryRecursiveSync, copyFileToDirectory, downloadFile, isEmpty, logInformation } from './utility';
let csv = require('csv-parser')
const fs = require('fs');
const tl = require('azure-pipelines-task-lib/task');
const Path = require('path');
export async function handleJMeterJMXFile(JMETER_BIN_Folder: string): Promise<string>{

    let jmxSourceInput = tl.getInput(InputVariables.JMX_SOURCE,true);
    if(jmxSourceInput==InputVariableType.SourceCode) {
        let jmxSourceRunFilePath = tl.getInput(InputVariables.JMX_SOURCE_RUN_FILE_SOURCE_PATH,true);
        if(isEmpty(jmxSourceRunFilePath)) {
            let msg = "You have set jmxSource to sourceCode, but provided no file path for the JMX File(jmxsourceRunFilePath). Missing JMX File Path";
            logInformation(msg, TraceLevel.Error);
            tl.setResult(tl.TaskResult.Failed, msg);
            return '';
        }
        let fileName=Path.parse(jmxSourceRunFilePath).base;
        let destinationFilePath = Path.join(JMETER_BIN_Folder,fileName);
        logInformation('Copying JMX Source File from Source: ' + jmxSourceRunFilePath + " to destination: " + destinationFilePath, TraceLevel.Information);
        await copyFileToDirectory(jmxSourceRunFilePath,destinationFilePath);
        return fileName;
    } else {
        let jmxSourceRunFileURL = tl.getInput(InputVariables.JMX_SOURCE_RUN_FILE_URL,true);
        if(isEmpty(jmxSourceRunFileURL)) {
            let msg = "You have set jmxSource to url, but provided no http url path for the JMX File(jmxsourceRunFileURL). Missing JMX File http url path";
            logInformation(msg, TraceLevel.Error);
            tl.setResult(tl.TaskResult.Failed, msg);
            return '';
        }
        jmxSourceRunFileURL= jmxSourceRunFileURL.trim();
        let fileName=Path.parse(jmxSourceRunFileURL).base
        logInformation('Downloading File from source ' + jmxSourceRunFileURL +  ' to destination' + fileName + ' at location preloaded: ' + JMETER_BIN_Folder, TraceLevel.Information);
        await downloadFile(jmxSourceRunFileURL, fileName);
        return fileName;
    }
}
export async function handleJMeterPropertyFile(JMETER_BIN_Folder: string): Promise<string>{

    let jmxPropertySource = tl.getInput(InputVariables.JMX_PROPERTY_FILE_SOURCE,true);
    if(jmxPropertySource == InputVariableType.None) {
        logInformation("No Property File Input. jmxPropertySource set to none", TraceLevel.Information);
        return '';
    } else if(jmxPropertySource== InputVariableType.SourceCode) {
        let jmxPropertyFilePath = tl.getInput(InputVariables.JMX_PROPERTY_FILE_SOURCE_PATH,true);
        if(isEmpty(jmxPropertyFilePath)) {
            let msg = "You have set jmxPropertySource to sourceCode, but provided no file path for the property file input (jmxPropertySourcePath). Missing Property File Path"
            logInformation(msg, TraceLevel.Error);
            tl.setResult(tl.TaskResult.Failed, msg);
            return '';
        }
        let fileName=Path.parse(jmxPropertyFilePath).base;
        let destinationFilePath = Path.join(JMETER_BIN_Folder,fileName);
        logInformation('Copying JMX Property File from Source: ' + jmxPropertyFilePath + " to destination: " + destinationFilePath, TraceLevel.Information);
        await copyFileToDirectory(jmxPropertyFilePath,destinationFilePath);
        return fileName;
    } else {
       let jmxPropertyFileURL = tl.getInput(InputVariables.JMX_PROPERTY_FILE_URL,true);

       if(isEmpty(jmxPropertyFileURL)) {
            let msg = "You have set jmxPropertySource to url, but provided no http file path for the property file input (jmxPropertySourceURL). Missing Property File Path";
            logInformation(msg, TraceLevel.Error);
            tl.setResult(tl.TaskResult.Failed, msg);
            
            return '';
        }
        jmxPropertyFileURL= jmxPropertyFileURL.trim();
        let fileName=Path.parse(jmxPropertyFileURL).base
        logInformation('Downloading File from source ' + jmxPropertyFileURL +  ' to destination' + fileName + ' at location preloaded: ' + JMETER_BIN_Folder, TraceLevel.Information);
        await downloadFile(jmxPropertyFileURL, fileName);
        return fileName;
    }
}

export async function handleJMeterInputFile(JMETER_BIN_Folder: string): Promise<string[]>{
    let jmxInputFilesSource = tl.getInput(InputVariables.JMX_INPUT_FILE_SOURCE,true);

    if(jmxInputFilesSource==InputVariableType.None) {
       logInformation('Not downloading files', TraceLevel.Information);
       return null;
    } else if(jmxInputFilesSource==InputVariableType.SourceCode) {
        let jmxInputFolderSourcePath = tl.getInput(InputVariables.JMX_INPUT_FOLDER_SOURCE_PATH,true);
        if(! jmxInputFolderSourcePath || jmxInputFolderSourcePath.length == 0) {
            let msg = "You have set jmxInputFilesSource to sourceCode, but provided no folder path for the data input files (jmxInputFolderSourcePath). Missing Input property folder path. Either set jmxInputFilesSource to none or provide path to folder where your input files are. (jmxInputFolderSourcePath)";
            logInformation(msg, TraceLevel.Error);
            tl.setResult(tl.TaskResult.Failed, msg);
            return [];
       }
        logInformation('Downloading Input File(s) from source ' + jmxInputFolderSourcePath +  ' to destination' + JMETER_BIN_Folder, TraceLevel.Information);
        return copyDirectoryRecursiveSync(jmxInputFolderSourcePath, JMETER_BIN_Folder, false);
    } else {
        let jmxInputFolderSourceUrls= tl.getDelimitedInput(InputVariables.JMX_INPUT_FILES_URL,',',true);
        if(isEmpty(jmxInputFolderSourceUrls)) {
            let msg = "You have set jmxInputFilesSource to urls, but provided no array of comma seperated file paths to download from (jmxInputFilesUrls). Missing comma seperated http file path(s). Either set jmxInputFilesSource to none or provide path to file for download(jmxInputFilesUrls) ";
            logInformation(msg, TraceLevel.Error);
            tl.setResult(tl.TaskResult.Failed, msg);
            return [];
        }
        let fileNames: string[] = [];
        let count = 0;

        for(let file of jmxInputFolderSourceUrls) {
           if(isEmpty(file)) {
               logInformation('Skipping Empty File name', TraceLevel.Warning);
               continue;
           }
           count++;
           file= file.trim();
           let fileName = Path.parse(file).base;
           logInformation('Downloading (' + count + '/' + jmxInputFolderSourceUrls.length + '). File from source ' + file + ' to destination' + fileName + ' to preloaded location: ' + JMETER_BIN_Folder , TraceLevel.Verbose);

           try {
                await downloadFile(file, fileName);
                fileNames.push(fileName);
           } catch(e) {
            tl.error(e);
            logInformation('Could not download File: ' + file, TraceLevel.Error)
            logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
           }

        }
        return fileNames;
    }
}

export function promiseFromChildProcess(child) {
    return new Promise(function (resolve, reject) {
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}



export function analyzeJTL(JMeterLogFolderPath: string) {

    try {
        let filePath = Path.join(JMeterLogFolderPath, LOG_JTL_FILE_NAME);
        logInformation('Reading File: ' + filePath, TraceLevel.Information)
        let readStream = fs.createReadStream(filePath);
        let success: number = 0 ;
        let errors: number = 0 ;
        readStream
            .pipe(csv())
            .on('data', (data) => data.success=='true' ? success++ : errors++)
            .on('end',function() {
                logInformation('*** Summary JMeter Test Run **** ', TraceLevel.Information)
                logInformation('SuccessCount: ' + success, TraceLevel.Information);
                logInformation('ErrorCount: ' + errors, TraceLevel.Information);

                let failTaskIFJMeterFails = tl.getBoolInput(InputVariables.FAIL_PIPELINE_IF_JMETER_FAILS,true);
                handleTestResults(errors, failTaskIFJMeterFails);
            })
            .on('error', function(){
                logInformation('Warning: Unable to analyze JTL File', TraceLevel.Warning);
            });
    } catch(e) {
        tl.warning(' JMeter JTL Analysis failed: ' + e?.message , e)
    }

}

function handleTestResults(failureCount: number, failTaskIFJMeterFails: boolean) {
    if(failTaskIFJMeterFails) {
        let maxFailureCount = tl.getInput(InputVariables.MAX_FAILURE_COUNT_FOR_JMETER,true);
        let maxFailureCountVal: number = 0;
        try {
            maxFailureCountVal = parseInt(maxFailureCount);
        } catch(e) {
            let msg = `Value Provided for Max Failure Count is not Numeric. Hence unable to run validation. Skipping this step. ${e?.message}`;
            logInformation(msg, TraceLevel.Warning);
            trackException(msg,e);
            tl.warning(msg);
            return;
        }

        if(failureCount > maxFailureCountVal) {
            let msg = 'Max threshold set for failure surpassed. This task will be marked as failed.';
            tl.warning(msg);
            logInformation(msg, TraceLevel.Warning)
            tl.setResult(tl.TaskResult.Failed, msg);
            return;
        }
    }
}
