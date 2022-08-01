// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {logInformation, isEmpty, copyFileToDirectory, downloadFile, copyDirectoryRecursiveSync} from './utility'
import {ERROR_DEFAULT_MSG, InputVariables, InputVariableType, LOG_JTL_FILE_NAME } from './constant'
import { JMeterTestResults } from './model'
let csv = require('csv-parser')
const fs = require('fs');
const tl = require('azure-pipelines-task-lib/task');
const Path = require('path');
export async function handleJMeterJMXFile(JMETER_BIN_Folder: string): Promise<string|undefined|null>{

    let jmxSourceInput = tl.getInput(InputVariables.JMX_SOURCE,true);
    if(jmxSourceInput==InputVariableType.SourceCode) {
        let jmxSourceRunFilePath = tl.getInput(InputVariables.JMX_SOURCE_RUN_FILE_SOURCE_PATH,true);
        if(isEmpty(jmxSourceRunFilePath)) {
            tl.setResult(tl.TaskResult.Failed, "Missing Source File Path");
            return null;
        }
        let fileName=Path.parse(jmxSourceRunFilePath).base;
        let destinationFilePath = Path.join(JMETER_BIN_Folder,fileName);
        logInformation('Copying JMX Source File from Source: ' + jmxSourceRunFilePath + " to destination: " + destinationFilePath);
        await copyFileToDirectory(jmxSourceRunFilePath,destinationFilePath);
        return fileName;
    } else {
        let jmxSourceRunFileURL = tl.getInput(InputVariables.JMX_SOURCE_RUN_FILE_URL,true);
        if(isEmpty(jmxSourceRunFileURL)) {
            tl.setResult(tl.TaskResult.Failed, "Unable to find and download JMX From External URL");
            return null;
        }
        jmxSourceRunFileURL= jmxSourceRunFileURL.trim();
        let fileName=Path.parse(jmxSourceRunFileURL).base
        logInformation('Downloading File from source ' + jmxSourceRunFileURL +  ' to destination' + fileName + ' at location preloaded: ' + JMETER_BIN_Folder);
        await downloadFile(jmxSourceRunFileURL, fileName);
        return fileName;
    }
}
export async function handleJMeterPropertyFile(JMETER_BIN_Folder: string): Promise<string|undefined|null>{

    let jmxPropertySource = tl.getInput(InputVariables.JMX_PROPERTY_FILE_SOURCE,true);
    if(jmxPropertySource == InputVariableType.None) {
        logInformation("No Property File Input");
        return null;
    } else if(jmxPropertySource== InputVariableType.SourceCode) {
        let jmxPropertyFilePath = tl.getInput(InputVariables.JMX_PROPERTY_FILE_SOURCE_PATH,true);
        if(isEmpty(jmxPropertyFilePath)) {
            tl.setResult(tl.TaskResult.Failed, "You have set jmxPropertySource to sourceCode, but provided no file path for the property file input (jmxPropertySourcePath). Missing Property File Path");
            return null;
        }
        let fileName=Path.parse(jmxPropertyFilePath).base;
        let destinationFilePath = Path.join(JMETER_BIN_Folder,fileName);
        logInformation('Copying JMX Property File from Source: ' + jmxPropertyFilePath + " to destination: " + destinationFilePath);
        await copyFileToDirectory(jmxPropertyFilePath,destinationFilePath);
        return fileName;
    } else {
       let jmxPropertyFileURL = tl.getInput(InputVariables.JMX_PROPERTY_FILE_URL,true);

       if(isEmpty(jmxPropertyFileURL)) {
        tl.setResult(tl.TaskResult.Failed, "You have set jmxPropertySource to url, but provided no http file path for the property file input (jmxPropertySourceURL). Missing Property File Path");
            return;
        }
        jmxPropertyFileURL= jmxPropertyFileURL.trim();
        let fileName=Path.parse(jmxPropertyFileURL).base
        logInformation('Downloading File from source ' + jmxPropertyFileURL +  ' to destination' + fileName + ' at location preloaded: ' + JMETER_BIN_Folder);
        await downloadFile(jmxPropertyFileURL, fileName);
        return fileName;
    }
}

export async function handleJMeterInputFile(JMETER_BIN_Folder: string): Promise<string[]|null>{
    let jmxInputFilesSource = tl.getInput(InputVariables.JMX_INPUT_FILE_SOURCE,true);

    if(jmxInputFilesSource==InputVariableType.None) {
       logInformation('Not downloading files');
       return null;
    } else if(jmxInputFilesSource==InputVariableType.SourceCode) {
        let jmxInputFolderSourcePath = tl.getInput(InputVariables.JMX_INPUT_FOLDER_SOURCE_PATH,true);
        if(! jmxInputFolderSourcePath || jmxInputFolderSourcePath.length == 0) {
            tl.setResult(tl.TaskResult.Failed, "You have set jmxInputFilesSource to sourceCode, but provided no folder path for the data input files (jmxInputFolderSourcePath). Missing Input property folder path. Either set jmxInputFilesSource to none or provide path to folder where your input files are. (jmxInputFolderSourcePath)");
           return null;
       }
        logInformation('Downloading Input File(s) from source ' + jmxInputFolderSourcePath +  ' to destination' + JMETER_BIN_Folder);
        return copyDirectoryRecursiveSync(jmxInputFolderSourcePath, JMETER_BIN_Folder, false);
    } else {
        let jmxInputFolderSourceUrls= tl.getDelimitedInput(InputVariables.JMX_INPUT_FILES_URL,',',true);
        if(isEmpty(jmxInputFolderSourceUrls)) {
            tl.setResult(tl.TaskResult.Failed, "You have set jmxInputFilesSource to urls, but provided no array of comma seperated file paths to download from (jmxInputFilesUrls). Missing comma seperated http file path(s). Either set jmxInputFilesSource to none or provide path to file for download(jmxInputFilesUrls) ");
            return null;
        }
        let fileNames: string[] = [];
        let count = 0;

        for(let file of jmxInputFolderSourceUrls) {
           if(isEmpty(file)) {
               logInformation('Skipping File');
               continue;
           }
           count++;
           file= file.trim();
           let fileName = Path.parse(file).base;
           logInformation('Downloading (' + count + '/' + jmxInputFolderSourceUrls.length + '). File from source ' + file + ' to destination' + fileName + ' to preloaded location: ' + JMETER_BIN_Folder );

           try {
                await downloadFile(file, fileName);
                fileNames.push(fileName);
           } catch(e) {
            tl.error(e);
            logInformation('Could not download File: ' + file)
            logInformation(ERROR_DEFAULT_MSG);
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
        logInformation('Reading File: ' + filePath)
        let readStream = fs.createReadStream(filePath);
        let success: number = 0 ;
        let errors: number = 0 ;
        readStream
            .pipe(csv())
            .on('data', (data) => data.success=='true' ? success++ : errors++)
            .on('end',function() {
                logInformation('*** Summary JMeter Test Run **** ')
                logInformation('SuccessCount: ' + success);
                logInformation('ErrorCount: ' + errors);

                let failTaskIFJMeterFails = tl.getBoolInput(InputVariables.FAIL_PIPELINE_IF_JMETER_FAILS,true);
                handleTestResults(errors, failTaskIFJMeterFails);
            })
            .on('error', function(){
                logInformation('Warning: Unable to analyze JTL File');
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
            let msg = 'Value Provided for Max Failure Count is not Numeric. Hence unable to run validation. Skipping this step.';
            logInformation(msg);
            tl.warning(msg);
            return;
        }

        if(failureCount > maxFailureCountVal) {
            let msg = 'Max threshold set for failure surpassed. This task will be marked as failed.';
            tl.warning(msg);
            tl.setResult(tl.TaskResult.Failed, msg);
            return;
        }
    }
}
