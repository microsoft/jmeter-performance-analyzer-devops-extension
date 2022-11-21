// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { DATE_FORMAT } from './constant';
import { trackTrace } from './telemetry-client';
import { TraceLevel } from './telemetry.constants';
import { rm } from 'node:fs/promises';

const globalAny:any = global;

const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');
const https = require('https');
const Path = require('path');
let tar = require('tar');
let UNIQUE_RUN_ID = uuidv4();
globalAny.UNIQUE_RUN_ID = UNIQUE_RUN_ID;

export function getFormatPrefix() {
    let formattedDate = (moment(Date.now())).format(DATE_FORMAT);
    return `${formattedDate} ${UNIQUE_RUN_ID} - ${process.cwd()} `;
}
export async function deleteFolderRecursive(folderName: string) {
    await rm(folderName, { recursive: true, force: true });

}

export function replaceSpaceWithUnderscore(input: string): string {
    return input.split(" ").join("");
}

export function logInformation(data: any, traceLevel: TraceLevel, printDate: boolean = true, logInTelemetry: boolean = true) {
    let formattedData = data;
    if(printDate) {
        formattedData = `${getFormatPrefix()} - ${data}`;
    }

    console.log(formattedData);
    tl.debug(formattedData)
    if(logInTelemetry) {
        trackTrace(formattedData, traceLevel);
    }
    
}

export function renameFolder(JMETER_ORIGINAL_FILE_Folder_ABS_PATH: any, JMETER_FILE_Folder_ABS: any) {
    fs.rename(JMETER_ORIGINAL_FILE_Folder_ABS_PATH, JMETER_FILE_Folder_ABS, function(err) {
        if (err) {
            trackTrace(err, TraceLevel.Critical)
        } else {
            trackTrace("Successfully renamed the directory from " + JMETER_ORIGINAL_FILE_Folder_ABS_PATH + " to " + JMETER_FILE_Folder_ABS, TraceLevel.Information)
        }
      })
}

export async function downloadFile(fileSource: string, destinationFilePath: string) {
    let event = 'Downloading File: ' + fileSource + ' to location: ' + destinationFilePath ;
    logInformation(event, TraceLevel.Verbose);
    return new Promise<void>((resolve, reject) => {
        https.get(fileSource, (response: { on: (arg0: string, arg1: (reason?: any) => void) => void; pipe: (arg0: any) => void; }) => {
            let stream = fs.createWriteStream(destinationFilePath);
            response.on("error", reject);

            stream.on("finish", () => {
                stream.close();
                logInformation("Download " + fileSource + " Completed to :" + destinationFilePath, TraceLevel.Verbose);
                resolve();
            }).on("error", reject);

            response.pipe(stream);

        }).on("error", reject);
    });
}

export async function unzipBinary(fileName: string) {
    await tar.x({file: fileName});
}


export function copyFileToDirectory(sourcefilePath: string, destinationFilePath: string) {
    let msg = 'Start Copying File to destination ' + destinationFilePath + ' from source ' + sourcefilePath;
    logInformation(msg, TraceLevel.Verbose);
    fs.copyFileSync(sourcefilePath, destinationFilePath, (err: any) => {
        if (err) throw err;
        logInformation('Completed '+ sourcefilePath + ' was copied to ' + destinationFilePath, TraceLevel.Verbose);
      });
}

export function copyDirectoryRecursiveSync(source, target, move): string[] {
    if (!fs.lstatSync(source).isDirectory())
        return [];
    let files: string[] = []
    var operation = move ? fs.renameSync : fs.copyFileSync;
    fs.readdirSync(source).forEach(function (itemName) {
        var sourcePath = Path.join(source, itemName);
        var targetPath = Path.join(target, itemName);

        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyDirectoryRecursiveSync(sourcePath, target, false);
        }
        else {
            operation(sourcePath, targetPath);
            files.push(sourcePath);
        }
    });
    return files;
}

export function isEmpty(str: string|undefined|null): boolean {
    return (!str || str.length == 0)
}
export function isNonEmpty(str: string|undefined|null): boolean {
    return !isEmpty(str);
}

export function isObjectEmpty(obj : {}): boolean {
    return (null == obj || Object.keys(obj).length === 0)
}

export function getSystemProps(prop: string) {
    try {
        return  tl.getVariable(prop);
    } catch (e) {
        console.debug('[Ignore] Telemetry System props Unable to fetch : '+ prop + ' Warning: '+ e?.message )
    }
}

export function formatStringMultiSize(str: string, ...val: string[]): string {
    for (let index = 0; index < val.length; index++) {
        str = str.replace(`{${index}}`, val[index]);
    }
    return str;
}

export function formatString(str: string, val: string[]): string {
    for (let index = 0; index < val.length; index++) {
        str = str.replace(`{${index}}`, val[index]);
    }
    return str;
}

export function getType(val: any) {
    try {
        return typeof val;
    } catch(e) {
        //Nothing required
    }
}