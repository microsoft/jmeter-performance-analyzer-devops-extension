// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export enum InputVariables {
    JMX_SOURCE = 'jmxSource',
    JMX_SOURCE_RUN_FILE_SOURCE_PATH = 'jmxsourceRunFilePath',
    JMX_SOURCE_RUN_FILE_URL ='jmxsourceRunFileURL',
    JMX_PROPERTY_FILE_SOURCE = 'jmxPropertySource',
    JMX_PROPERTY_FILE_SOURCE_PATH ='jmxPropertySourcePath',
    JMX_PROPERTY_FILE_URL ='jmxPropertySourceURL',
    JMX_INPUT_FILE_SOURCE = 'jmxInputFilesSource',
    JMX_INPUT_FOLDER_SOURCE_PATH ='jmxInputFolderSourcePath',
    JMX_INPUT_FILES_URL ='jmxInputFilesUrls',
    JMX_BINARY_URI ='jmeterURI',
    JMETER_FOLDER_NAME ='jmeterFolderName',
    JMETER_LOG_FOLDER = 'jmeterLogFolder',
    JMETER_REPORT_FOLDER = 'jmeterReportFolder',
    COPY_RESULT_TO_AZURE_BLOB_STORAGE = 'copyResultToAzureBlobStorage',
    PUBLISH_RESULTS_TO_BUILD_ARTIFACT = 'publishResultsToBuildArtifact',
    TOKEN_REGEX = 'tokenRegex',
    CONNECTED_SERVICE_ARM_NAME = 'ConnectedServiceNameARM',
    STORAGE_ACCOUNT_RM = 'StorageAccountRM',
    CONTAINER_NAME ='ContainerName',
    BLOB_PREFIX = 'BlobPrefix',
    OUTPUT_STORAGE_URI = 'outputStorageUri',
    ARTIFACT_NAME_REPORT = 'artifactNameReport',
    ARTIFACT_NAME_LOG = 'artifactNameLog',
    FAIL_PIPELINE_IF_JMETER_FAILS = 'failPipelineIfJMeterFails',
    MAX_FAILURE_COUNT_FOR_JMETER = 'maxFailureCountForJMeter',
    LOG_TELEMETRY = 'telemetryDataCollection'
}
export enum InputVariableType {
    SourceCode = 'sourceCode',
    Url = 'url',
    Urls = 'urls',
    None = 'none'
}

export const JMETER_FILE_NAME='apache-jmeter.tgz'
export const JMETER_BIN_Folder_NAME= 'bin'
export const DEFAULT_JMETER_REPORT_DIR_NAME = 'CurrentReport';
export const DEFAULT_JMETER_LOG_DIR_NAME = 'CurrentLog';
export const AZURE_STORAGE_ACCOUNT_NAME_PLACEHOLDER = '${storageAccountName}';
export const AZURE_STORAGE_ACCOUNT_URI = 'https://${storageAccountName}.blob.core.windows.net';
export const LOG_JTL_FILE_NAME = 'log.jtl';
export const JMETER_LOG_FILE_NAME = 'jmeter.log';
export const JMETER_REPORT_INDEX_FILE_NAME = 'index.html';
export const URL_SEPERATOR = '/';
export const DATE_FORMAT = 'DD-MMM-YYYY HH:mm:ss:SSS ZZ';
export const ERROR_DEFAULT_MSG = 'Please note this extension is in beta version. We will be fixing the issues as reported and hence it is important for us to be able to analyze logs and fix the issue. If you encounter any issue please create a github issue here https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/issues'

export const COMMAND_TO_SET_PERMISSION_PATH_HOLDER = '{PATH_HOLDER}';
export const COMMAND_TO_SET_PERMISSION=`
$mypath = "{PATH_HOLDER}"
$myacl = Get-Acl $mypath
$myaclentry = "username","FullControl","Allow"
$myaccessrule = New-Object System.Security.AccessControl.FileSystemAccessRule($myaclentry)
$myacl.SetAccessRule($myaccessrule)
Get-ChildItem -Path "$mypath" -Recurse -Force | Set-Acl -AclObject $myacl -Verbose
`
