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
    JMETER_CUSTOM_UNZIPPED_FOLDER_NAME ='jmeterCustomUnzippedFolderName',
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
    LOG_TELEMETRY = 'telemetryDataCollection',

    ADD_CUSTOM_PLUGIN_TO_JMETER_LIB = 'addCustomPluginsToJMeterLib',
    CUSTOM_PLUGIN_SOURCE = 'customPluginSource',
    CUSTOM_PLUGIN_SOURCE_CODE_PATH = 'customPluginSourceCodeFolderPath',
    CUSTOM_PLUGIN_URL_PATHS = 'customPluginURLs',
    ADDITIONAL_COMMAND_LINE_ARGUMENTS = 'additionalCommandLineArguments'
}

export enum CommandTypes {
    JMETER_RUN_WITH_PROPERTY = 'JMETER_RUN_WITH_PROPERTY',
    JMETER_RUN_WITHOUT_PROPERTY = 'JMETER_RUN_WITHOUT_PROPERTY',
}

export enum OSTypes {
    Windows = 'Windows',
    MAC = 'MAC_OS',
    LINUX = 'LINUX',
    UNKNOWN = 'Unknown'
}

export const Commands = {
    JMETER_RUN_WITH_PROPERTY_WINDOWS : '.\\jmeter -q {0} -n -t {1}  -l {2} -j {3} -f -e -o {4} {5}',
    JMETER_RUN_WITH_PROPERTY_LINUX : './jmeter.sh -q {0} -n -t {1}  -l {2} -j {3} -f -e -o {4} {5}',
    JMETER_RUN_WITH_PROPERTY_MACOS : './jmeter.sh -q {0} -n -t {1}  -l {2} -j {3} -f -e -o {4} {5}',

    
    JMETER_RUN_WITHOUT_PROPERTY_WINDOWS : '.\\jmeter -n -t {0} -l {1} -j {2} -f -e -o  {3} {4}',
    JMETER_RUN_WITHOUT_PROPERTY_LINUX : './jmeter.sh -n -t {0} -l {1} -j {2} -f -e -o  {3} {4}',
    JMETER_RUN_WITHOUT_PROPERTY_MACOS : './jmeter.sh -n -t {0} -l {1} -j {2} -f -e -o  {3} {4}'
}

export enum InputVariableType {
    SourceCode = 'sourceCode',
    Url = 'url',
    Urls = 'urls',
    None = 'none'
}

export const JMETER_FILE_NAME='apache-jmeter.tgz';
export const JMETER_BIN_Folder_NAME= 'bin';
export const JMETER_LIB_Folder_NAME= 'lib';
export const JMETER_EXT_Folder_NAME= 'ext';
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
