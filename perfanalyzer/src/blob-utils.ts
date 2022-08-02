// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { AzureRMEndpoint } from 'azure-pipelines-tasks-azure-arm-rest-v2/azure-arm-endpoint';
import { AzureEndpoint, StorageAccount } from 'azure-pipelines-tasks-azure-arm-rest-v2/azureModels';
import { AZURE_STORAGE_ACCOUNT_NAME_PLACEHOLDER, AZURE_STORAGE_ACCOUNT_URI, ERROR_DEFAULT_MSG, InputVariables, JMETER_LOG_FILE_NAME, JMETER_REPORT_INDEX_FILE_NAME, LOG_JTL_FILE_NAME, TraceLevel, URL_SEPERATOR } from './constant';
import { LogEvent, trackException } from './telemetry-client';
import { isNonEmpty, logInformation } from './utility';
const fs = require('fs');
const tl = require('azure-pipelines-task-lib/task');
const Path = require('path');
const armStorage = require('azure-pipelines-tasks-azure-arm-rest-v2/azure-arm-storage');

export async function copyResultsToAzureBlob(reportFolderName: string, logFolderName: string) {

    logInformation('Starting copyResultsToAzureBlob', TraceLevel.Verbose)
    let connectedServiceName = tl.getInput(InputVariables.CONNECTED_SERVICE_ARM_NAME, true);
    let storageAccountName = tl.getInput(InputVariables.STORAGE_ACCOUNT_RM, true);
    var azureEndpoint: AzureEndpoint = await new AzureRMEndpoint(connectedServiceName).getEndpoint();
    const storageArmClient = new armStorage.StorageManagementClient(azureEndpoint.applicationTokenCredentials, azureEndpoint.subscriptionID?? '');
    let storageAccount: StorageAccount = await storageArmClient.storageAccounts.get(storageAccountName);
    let storageAccountResourceGroupName = getResourceGroupNameFromUri(storageAccount.id);
    let accessKeys = await storageArmClient.storageAccounts.listKeys(storageAccountResourceGroupName, storageAccountName, null);
    let accessKey: string = accessKeys[0];

    let storageAccountURI = AZURE_STORAGE_ACCOUNT_URI.replace(AZURE_STORAGE_ACCOUNT_NAME_PLACEHOLDER, storageAccountName);
    const cert = new StorageSharedKeyCredential(storageAccountName,accessKey);
    const blobServiceClient = new BlobServiceClient(storageAccountURI, cert) ;
    let destContainerName = tl.getInput(InputVariables.CONTAINER_NAME);
    if(!destContainerName || destContainerName.length == 0) {
        logInformation('Missing required variable: ' + InputVariables.CONTAINER_NAME, TraceLevel.Error);
        tl.setResult(tl.TaskResult.Failed, "Missing required variable: " + InputVariables.CONTAINER_NAME);
    }
    const destContainerClient = blobServiceClient.getContainerClient(destContainerName);

    let blobPrefix = tl.getInput(InputVariables.BLOB_PREFIX);

    let reportFolderABSPath = Path.join(process.cwd(), reportFolderName);
    let event1 = 'Uploading Reports to Blob Storage from path: ' + reportFolderABSPath + ' to BlobStorageAccount: ' + storageAccountName + ' and container Name: ' + destContainerName + " at path: " + Path.join(blobPrefix,reportFolderName);
    logInformation(event1, TraceLevel.Information);
    LogEvent(event1);
    try {
        await uploadBlob(reportFolderABSPath, reportFolderName, blobPrefix, destContainerClient);
    } catch (e) {
        tl.error(e);
        let msg = 'Error Publishing report to blob storage: ' + e?.message;
        logInformation(msg, TraceLevel.Error);
        logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
        trackException(msg,e)
    }

    let logFolderABSPath = Path.join(process.cwd(), logFolderName);
    let event2 = 'Uploading Logs to Blob Storage from path: ' + logFolderABSPath + ' to BlobStorageAccount: ' + storageAccountName + ' and container Name: ' + destContainerName + " at path: " + Path.join(blobPrefix,logFolderName);
    logInformation(event2, TraceLevel.Information);
    LogEvent(event2);
    try {
        await uploadBlob(logFolderABSPath, logFolderName, blobPrefix, destContainerClient);
    } catch (e) {
        tl.error(e);
        let msg = 'Error Publishing LOGS to blob storage: ' + e?.message;;
        logInformation(msg, TraceLevel.Error);
        logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
        trackException(msg,e)
    }

    let outputStorageUri = tl.getInput(InputVariables.OUTPUT_STORAGE_URI);
    if(!outputStorageUri || outputStorageUri.length == 0) {
        logInformation('No Output Storage URL Provided. Hence unable to create performance test Result.', TraceLevel.Warning)
    } else {
        if(!outputStorageUri.endsWith(URL_SEPERATOR)) {
            outputStorageUri = outputStorageUri + URL_SEPERATOR;
        }
        if(!blobPrefix.endsWith(URL_SEPERATOR)) {
            blobPrefix = blobPrefix + URL_SEPERATOR;
        }
        let REPORT_URL = outputStorageUri + blobPrefix + reportFolderName + URL_SEPERATOR + JMETER_REPORT_INDEX_FILE_NAME;
        let JTL_URL = outputStorageUri + blobPrefix  + logFolderName + URL_SEPERATOR + LOG_JTL_FILE_NAME;
        let LOG_URL = outputStorageUri + blobPrefix  + logFolderName + URL_SEPERATOR + JMETER_LOG_FILE_NAME;

        logInformation(' Performance Test Result Available at: ' + REPORT_URL, TraceLevel.Information);
        logInformation(' JMeter JTL File Available at: ' + JTL_URL, TraceLevel.Information);
        logInformation(' JMeter Log File Available at: ' + LOG_URL, TraceLevel.Information);
        tl.warning(' Performance Test Result Available at: ' + REPORT_URL);
        tl.warning(' JMeter JTL File Available at: ' + JTL_URL);
        tl.warning(' JMeter Log File Available at: ' + LOG_URL);
    }
}

export async function uploadBlob(src: string, uploadFolderName: string,  blobPrefix: string, destContainerClient: any  ) {

    await fs.readdir(src, {withFileTypes: true},
        async (err, files) => {

        if (err) {
            logInformation(err, TraceLevel.Error);
            trackException(err,err);
            tl.error(err);
        }
        else {
            for(let entry of files) {
                const srcPath = Path.join(src, entry.name);
                let uploadFileName = srcPath.substring(srcPath.indexOf(uploadFolderName));
                if(entry.isDirectory()) {
                    await uploadBlob(srcPath, uploadFolderName, blobPrefix, destContainerClient);
                } else {
                    let path: string = '';
                    if(!blobPrefix || blobPrefix.length == 0) {
                        path = uploadFileName
                    } else {
                        path = Path.join(blobPrefix, uploadFileName);
                    }
                    const blockBlobClient = destContainerClient.getBlockBlobClient(path);
                    await blockBlobClient.uploadFile(srcPath, getBlobOptions(uploadFileName));
                }
            }
        }
    });
}

function getResourceGroupNameFromUri(resourceUri: string): string {
    if (isNonEmpty(resourceUri)) {
        resourceUri = resourceUri.toLowerCase();
        return resourceUri.substring(resourceUri.indexOf("resourcegroups/") + "resourcegroups/".length, resourceUri.indexOf("/providers"));
    }

    return "";
}

function getBlobOptions(fileName: string) {
    let type= '';
    if(fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        type = 'text/html';
    } else if(fileName.endsWith('.css')) {
        type = 'text/css';
    } else if(fileName.endsWith('.js')) {
        type = 'text/javascript';
    } else if(fileName.endsWith('.png')) {
        type = 'image/png';
    } else if(fileName.endsWith('.svg')) {
        type = 'image/svg+xml';
    } else if(fileName.endsWith('.woff') ) {
        type = 'font/woff';
    } else if(fileName.endsWith('.woff2')) {
        type = 'font/woff2';
    } else if(fileName.endsWith('.ttf')) {
        type = 'font/ttf';
    } else if(fileName.endsWith('.eot')) {
        type = 'font/eot';
    }  else if(fileName.endsWith('.jpg')) {
        type = 'images/jpg';
    } else if(fileName.endsWith('.jpeg')) {
        type = 'images/jpeg';
    } else if(fileName.endsWith('.json') || fileName.endsWith('.md') || fileName.endsWith('.less')) {
        type = 'text/plain';
    } else {
        type = 'text/plain';
    }
    const blobOptions = { blobHTTPHeaders: { blobContentType: type } };
    return blobOptions;
}
