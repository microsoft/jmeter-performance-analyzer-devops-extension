export enum TraceLevel {
    Verbose = 0,
    Information = 1,
    Warning = 2,
    Error = 3,
    Critical = 4,
    Off = 5,
  }
  
  export enum TelemetryType {
    Trace,
    PageView,
    BusinessProcess,
    FeatureUsage,
    Custom,
  }
  
  export enum SeverityLevel {
    Verbose = 0,
    Information = 1,
    Warning = 2,
    Error = 3,
    Critical = 4
  }
  
 
  export enum TelemetryEvents {
    TELEMETRY_TURNED_OFF = 'Telemetry Turned Off',
    STARTED_PERFORMANCE_TEST = 'Started Performance Test',
    COMPLETED_PERFORMANCE_TEST = 'Completed Performance Test',

    COPYING_DATA_TO_AZURE_BLOB_STORAGE = 'Copying Report Data to Azure Blob Storage',
    COPYING_LOG_DATA_TO_BUILD_ARTIFACT = 'Publishing Log data to build artifacts',

    COPYING_DATA_TO_AZURE_BLOB_STORAGE_FAILED = 'Failed: Copying Report Data to Azure Blob Storage',
    COPYING_LOG_DATA_TO_BUILD_ARTIFACT_FAILED  = 'Failed: Log Publishing data to build artifacts',

    COPYING_DATA_TO_AZURE_BLOB_STORAGE_SUCCESS = 'Success: Copying Report Data to Azure Blob Storage',
    COPYING_LOG_DATA_TO_BUILD_ARTIFACT_SUCCESS  = 'Success: Log Publishing data to build artifacts',

    PUBLISH_DATA_TO_BUILD_ARTIFACT = 'Publishing data to build artifacts',

    PUBLISH_REPORT_DATA_TO_BUILD_ARTIFACT_SUCCESS = 'Success: Publishing Report data to build artifacts',
    PUBLISH_LOG_DATA_TO_BUILD_ARTIFACT_SUCCESS = 'Success: Publishing Log data to build artifacts',

    PUBLISH_REPORT_DATA_TO_BUILD_ARTIFACT_FAILED = 'Failed: Publishing Report data to build artifacts',
    PUBLISH_LOG_DATA_TO_BUILD_ARTIFACT_FAILED = 'Failed: Publishing Log data to build artifacts',

    ARTIFACT_UPLOAD_COMPLETE = 'Artifact Upload Complete',
    REPLACE_TOKEN_INVOKED = 'Replace Token Invoked',
    DOWNLOADED_JMETER_BINARY = 'Downloaded JMeter Binary',

    DOWNLOADED_JMETER_JMX_SRC = 'Downloaded JMETER JMX From Source Code',
    DOWNLOADED_JMETER_PROPERTY_SRC = 'Downloaded JMETER Properties From Source Code',
    DOWNLOADED_JMETER_INPUT_FILES_SRC = 'Downloaded JMETER Input Files From Source Code',
    
    DOWNLOADED_JMETER_JMX_URL= 'Downloaded JMETER JMX From URL',
    DOWNLOADED_JMETER_PROPERTY_URL = 'Downloaded JMETER Properties From URL',
    DOWNLOADED_JMETER_INPUT_FILES_URL = 'Downloaded JMETER Input Files From URL',

    NO_INPUT_FILE = 'No Input Files',    
    NO_PROPERTY_FILE = 'No Property Files',

    JMETER_TASK_ANALYZER_USED  = 'JMeter Task Success Fail Task Analyzer Used',
    JMETER_TASK_ANALYZER_FAILED = 'Failed: JMeter Task Success Fail Task Analyzer',

    JMETER_TASK_ANALYZER_FAIL_PASS_OPTION_USED  = 'JMeter Task Success Fail Pass Option Used',

    JMETER_RUN_WITHOUT_PROPERTY_FILE = 'JMETER Run Without Property File',
    JMETER_RUN_WITH_PROPERTY_FILE = 'JMETER Run With Property File',
    CLOSE_CODE = 'Close Code',
    JMETER_RUN_FAILURE = 'JMeter Run Failure',

    AGENT_OS_TYPE = 'Agent OS Type',
    AGENT_OS_TYPE_IDENTIFIED = 'Agent OS Type Identified',

    NO_BLOB_PRIMARY_ENDPOINT_URI = 'No Blob Storage URI Provided',
    PROVIDED_BLOB_PRIMARY_ENDPOINT_URI = 'Blob Storage URI Provided',

    ENABLED_CUSTOM_PLUGINS = 'Enabled Custom PLugins',
    ENABLED_CUSTOM_PLUGINS_SOURCE_CODE = 'Enabled Custom PLugins download via source Code',
    ENABLED_CUSTOM_PLUGINS_URLS = 'Enabled Custom PLugins download via URLs',
    DOWNLOADED_CUSTOM_PLUGINS = 'Successfully downloaded custom plugins to jmeter lib-ext folder',
    FAILED_DOWNLOADING_CUSTOM_PLUGINS_URLS = 'Failed to download custom plugins to jmeter lib-ext folder',
  }