// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as moment from 'moment'; 
import { DATE_FORMAT } from './constant'
import { v4 as uuidv4 } from 'uuid';
import { LogEvent, trackTrace } from './telemetry-client';
const globalAny:any = global;

const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');
const https = require('https');
const Path = require('path');
let tar = require('tar');
let UNIQUE_RUN_ID = uuidv4();
globalAny.UNIQUE_RUN_ID = UNIQUE_RUN_ID;

export function logInformation(data: any, printDate: boolean = true) {
    let formattedData = data;
    if(printDate) {
        let formattedDate = (moment(Date.now())).format(DATE_FORMAT);
        formattedData = formattedDate + ": " + UNIQUE_RUN_ID + " - " + data;
    }

    console.log(formattedData);
    tl.debug(formattedData)
    trackTrace(formattedData);
}

export async function downloadFile(fileSource: string, destinationFilePath: string) {
    let event = 'Downloading File: ' + fileSource + ' to location: ' + destinationFilePath ;
    LogEvent(event);
    logInformation(event);
    return new Promise<void>((resolve, reject) => {
        https.get(fileSource, (response: { on: (arg0: string, arg1: (reason?: any) => void) => void; pipe: (arg0: any) => void; }) => {
            let stream = fs.createWriteStream(destinationFilePath);
            response.on("error", reject);

            stream.on("finish", () => {
                stream.close();
                logInformation("Download " + fileSource + " Completed to :" + destinationFilePath);
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
    let event = 'Start Copying File to destination ' + destinationFilePath + ' from source ' + sourcefilePath
    LogEvent(event);
    logInformation(event);
    fs.copyFileSync(sourcefilePath, destinationFilePath, (err: any) => {
        if (err) throw err;
        logInformation('Completed '+ sourcefilePath + ' was copied to ' + destinationFilePath);
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
