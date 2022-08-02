![../project-screenshots/icon.png](../project-screenshots/icon.png)

## Running with property and input files.

This sample section shows you how you can use properties file to generate test results. And then use paramerized version of these file in the load test task. The reason why parametization is important is that

1. With a single jmx you can run it in different enviornments by configuring different value for stages in azure release pipeline.
2. You should not expose any client secret while in the process.

### How to use

1. Once your jmx is created (see examples) and you have created your parametized property file, you can commit them to your source code or host it somewhere to download from.

2. In the pipeline, you can chose either the source code or provide a direct link to the hosted jmx.

3. Note that the task expects 3 things
    a. jmx file
    b. property file which it can populate during run time.
    c. input file(s) in case your test case has any

    b and c are optional. Its a cleaner way of doing parametization and updating the value in pipeline variables. In case your use case does not require it too do, you can just submit the hardcoded jmx.

4. You can see the 3 samples here

    a. Simple JMX : This just shows how you can create a jmx with input parameter and a test file and how you can first locally test and then schedule a pipeline test.

    b. Simple JMX Without Property File and Hardcoded JMX (Not recommended): This just shows how you can create a jmx without input parameter and test a plain jmx.

    c. Token Generation: In case your application does require some kind of authentication, your jmx must include the way of authenticating it. You can see how we can generate token.

    Your use case can be a combination of both as well. Hope the usage clarifies, please check the samples.

5. Once you do there you can see the usage in pipeline here:
    
    a. Classic Pipeline: [Here](https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/blob/main/InputTask.md)

    b. YAML Based Usage: [Here](https://github.com/microsoft/jmeter-performance-analyzer-devops-extension/blob/main/InputTaskYAML.md)