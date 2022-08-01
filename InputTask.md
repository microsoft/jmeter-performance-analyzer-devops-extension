// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

![project-screenshots/icon.png](project-screenshots/icon.png)

## About
This explains the different steps you can add in case of Classic GUI based tasks.

### Pipeline inputs

1. Provide input to variables

![Screenshot](screenshots/P5.png)

2. The JMX , Property and Inputs file can be either from Source Code or from External URL.

3. You can provide value to all Variables
![Screenshot](screenshots/P5.png)



## Note
 - The `publishResultsToBuildArtifact` should be false if this task is used in release pipeline. This is because Azure DevOps dose not provide capability to post artifact in release pipeline. If turned on, will skip and show warnings in log.
 - The Blob Prefix can be set to `Release_DEV_$(Release.ReleaseName)_$(Release.AttemptNumber)` in Release Pipeline and `Releases/Release_DEV_$(Build.BuildNumber)` in Build pipeline. The reason is that this will enable help create unique path per build/release. The system variable release id and build number will be populated as per the run.
 - JMX Source is compulsoty however property and input files are not. Hence can be set to `none`
 - In case you do not want to publish the html you can set 'copyResultToAzureBlobStorage' to false. In this case variables {azureSubscription, storage, BlobPrefix, outputStorageUri} will also not be required.
 - You can try different combinations (Jmx from source, property from External url, inputs from source). All 3 inputs can be either sourceCode or url (urls in case of input file).
 - In case you do not want the pipeline to fail even if the JMeter test has failed, you can set `failPipelineIfJMeterFails` to false. Also then variable `maxFailureCountForJMeter` won't be used.
