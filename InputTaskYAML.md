// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

![Screenshot](screenshots/icon.png)

## About
This explains the different variables you can use to add this task in your pipeline using YAML based pipeline file.

### Pipeline Inputs from Source Code

```
steps:
- task: id-az-pipeline.jmeter-perf-analyzer.custom-build-release-task.perfanalyzer@1
  displayName: 'Run Perf Analyzer'
  inputs:
    jmxSource: sourceCode
    jmxsourceRunFilePath: '$(System.DefaultWorkingDirectory)/<YOUR_FILE_PATH_TO JMX! Expected File Path>'
    jmxPropertySource: sourceCode
    jmxPropertySourcePath: '$(System.DefaultWorkingDirectory)/<YOUR_FILE_PATH_TO PROPERTIES! Expected File Path>'
    tokenRegex: '%(\w+)%'
    jmxInputFilesSource: sourceCode
    jmxInputFolderSourcePath: '$(System.DefaultWorkingDirectory)/<YOUR_FILE_PATH_TO Input files folder! Expected Folder Path>''
    publishResultsToBuildArtifact: true
    failPipelineIfJMeterFails: true
    maxFailureCountForJMeter: 5
    copyResultToAzureBlobStorage: true
    azureSubscription: '<Your Subscription Name>'
    storage: <Your Storage Account Name>
    BlobPrefix: '<Your Release Prefix>/Release_$(Release.ReleaseId)' <-- (For Release Pipeline) OR  (For Build Pipeline) --> '<Your Release Prefix>/Release_$(Build.BuildNumber)'
    outputStorageUri: '<Your Storage Account's Primary Endpoint for Static Hosting>'
```

### Pipeline Inputs from External URLs

```
steps:
- task: id-az-pipeline.jmeter-perf-analyzer.custom-build-release-task.perfanalyzer@1
  displayName: 'Run Perf Analyzer'
  inputs:
    jmxSource: url
    jmxsourceRunFileURL: 'https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/blob/main/samples/samplejmx.jmx'
    jmxPropertySource: url
    jmxPropertySourceURL: 'https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/blob/main/samples/jmx.properties'
    tokenRegex: '%(\w+)%'
    jmxInputFilesSource: urls
    jmxInputFilesUrls: |
     https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/blob/main/samples/sampleInputFile.csv,
     https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/blob/main/samples/sampleInputFile2.csv
    failPipelineIfJMeterFails: true
    publishResultsToBuildArtifact: true
    failPipelineIfJMeterFails: true
    maxFailureCountForJMeter: 5
    copyResultToAzureBlobStorage: true
    azureSubscription: '<Your Subscription Name>'
    storage: <Your StorageAccount Name>
    BlobPrefix: '<Your Release Prefix>/Release_$(Release.ReleaseId)' <-- (For Release Pipeline) OR  (For Build Pipeline) --> '<Your Release Prefix>/Release_$(Build.BuildNumber)'
    outputStorageUri: '<Your Storage Account's Primary Endpoint for Static Hosting>'
```

### Pipeline Inputs from External URLs with no Property File and no input files.

```
steps:
- task: id-az-pipeline.jmeter-perf-analyzer.custom-build-release-task.perfanalyzer@1
  displayName: 'Run Perf Analyzer'
  inputs:
    jmxSource: url
    jmxsourceRunFileURL: 'https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/blob/main/samples/samplejmx.jmx'
    jmxPropertySource: none
    failPipelineIfJMeterFails: true
    publishResultsToBuildArtifact: true
    failPipelineIfJMeterFails: true
    maxFailureCountForJMeter: 5
    copyResultToAzureBlobStorage: true
    azureSubscription: '<Your Subscription Name>'
    storage: <Your StorageAccount Name>
    BlobPrefix: '<Your Release Prefix>/Release_$(Release.ReleaseId)' <-- (For Release Pipeline) OR  (For Build Pipeline) --> '<Your Release Prefix>/Release_$(Build.BuildNumber)'
    outputStorageUri: '<Your Storage Account's Primary Endpoint for Static Hosting>'
```

### Pipeline Inputs from External URLs with property file from Source but no input files.


```
steps:
- task: id-az-pipeline.jmeter-perf-analyzer.custom-build-release-task.perfanalyzer@1
  displayName: 'Run Perf Analyzer'
  inputs:
    jmxSource: url
    jmxsourceRunFileURL: 'https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/blob/main/samples/samplejmx.jmx'
    jmxPropertySource: sourceCode
    jmxPropertySourcePath: '$(System.DefaultWorkingDirectory)/<YOUR_FILE_PATH_TO PROPERTIES! Expected File Path>'
    tokenRegex: '%(\w+)%'
    jmxInputFilesSource: none
    failPipelineIfJMeterFails: true
    publishResultsToBuildArtifact: true
    failPipelineIfJMeterFails: true
    maxFailureCountForJMeter: 5
    copyResultToAzureBlobStorage: true
    azureSubscription: '<Your Subscription Name>'
    storage: <Your StorageAccount Name>
    BlobPrefix: '<Your Release Prefix>/Release_$(Release.ReleaseId)' <-- (For Release Pipeline) OR  (For Build Pipeline) --> '<Your Release Prefix>/Release_$(Build.BuildNumber)'
    outputStorageUri: '<Your Storage Account's Primary Endpoint for Static Hosting>'
```


## Note
 - The `publishResultsToBuildArtifact` should be false if this task is used in release pipeline. This is because Azure DevOps dose not provide capability to post artifact in release pipeline. If turned on, will skip and show warnings in log.
 - The Blob Prefix can be set to `Release_$(Release.ReleaseId)` in Release Pipeline and `Release_$(Build.BuildNumber)` in Build pipeline. The reason is that this will enable help create unique path per build/release. The system variable release id and build number will be populated as per the run.
 - JMX Source is compulsoty however property and input files are not. Hence can be set to `none`
 - In case you do not want to publish the html you can set 'copyResultToAzureBlobStorage' to false. In this case variables {azureSubscription, storage, BlobPrefix, outputStorageUri} will also not be required.
 - You can try different combinations (Jmx from source, property from External url, inputs from source). All 3 inputs can be either sourceCode or url (urls in case of input file).
 - In case you do not want the pipeline to fail even if the JMeter test has failed, you can set `failPipelineIfJMeterFails` to false. Also then variable `maxFailureCountForJMeter` won't be used.
