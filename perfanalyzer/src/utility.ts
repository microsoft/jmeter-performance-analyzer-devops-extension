// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { DATE_FORMAT } from './constant';
import { trackTrace } from './telemetry-client';
import { TraceLevel } from './telemetry.constants';
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
    return `${formattedDate} ${UNIQUE_RUN_ID}`;
}
export function getUniqueId() {
    return UNIQUE_RUN_ID;
}

export function getMathRandom() {
    return Math.floor(Math.random() * 9999999999); 
}
export function deleteFolderRecursive(dir: string) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
        var filename = Path.join(dir, list[i]);
        var stat = fs.statSync(filename);

        if(filename == "." || filename == "..") {
            // pass these files
        } else if(stat.isDirectory()) {
            // rmdir recursively
            deleteFolderRecursive(filename);
        } else {
            // rm fiilename
            fs.unlinkSync(filename);
        }
    }
    fs.rmdirSync(dir);

}

export function replaceSpaceWithUnderscore(input: string): string {
    return input.split(" ").join("_");
}

export function logInformation(data: any, traceLevel: TraceLevel, printDate: boolean = true, logInTelemetry: boolean = true) {
    
    if(printDate) { 
        console.log( `${getFormatPrefix()} - ${data}`);
    } else {
        console.log(data);
    } 
    tl.debug(data)
    if(logInTelemetry) {
        trackTrace(data, traceLevel);
    }
    
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

export async function unzipBinary(fileName: string, path:string|null) {
    if(path && path.trim().length > 0) {
        await makeDirectory(path);
        await tar.x({file: fileName ,C: path});
    } else {
        await tar.x({file: fileName});
    }
    
}

export async function makeDirectory(filePath: string) {
    try {
        await fs.mkdir(filePath, (err) => {
            if (err) {
                logInformation('Make directory completed with error ' + err, TraceLevel.Information);
            }
            logInformation('Directory created successfully: ' + filePath, TraceLevel.Information);
        });
    } catch (err) {
        logInformation('Error creating directory ' + err, TraceLevel.Error);
    }
    
}

export function copyFileToDirectory(sourcefilePath: string, destinationFilePath: string) {
    let msg = 'Start Copying File to destination ' + destinationFilePath + ' from source ' + sourcefilePath;
    logInformation(msg, TraceLevel.Verbose);
    fs.copyFileSync(sourcefilePath, destinationFilePath, (err: any) => {
        if (err) throw err;
        logInformation('Completed '+ sourcefilePath + ' was copied to ' + destinationFilePath, TraceLevel.Verbose);
      });
}

export function copyDirectoryRecursiveSync(source:string, target:string, move: boolean, copyFileAtSameLevel: boolean): string[] {
    if (!fs.lstatSync(source).isDirectory())
        return [];
    let files: string[] = []
    var operation = move ? fs.renameSync : fs.copyFileSync;
    if(fs.lstatSync(source).isDirectory()) {
        fs.readdirSync(source).forEach(function (itemName) {
            var sourcePath = Path.join(source, itemName);
            var targetPath = Path.join(target, itemName);
    
            if (fs.lstatSync(sourcePath).isDirectory()) {
                if(copyFileAtSameLevel) {
                    copyDirectoryRecursiveSync(sourcePath, target, move, copyFileAtSameLevel);
                } else {
                    fs.mkdirSync(targetPath);
                    copyDirectoryRecursiveSync(sourcePath, targetPath, move, copyFileAtSameLevel);
                }
                
            }
            else {
                operation(sourcePath, targetPath);
                files.push(sourcePath);
            }
        });
    } else {
        console.log('Not a directory: ' + source);
    }
   
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