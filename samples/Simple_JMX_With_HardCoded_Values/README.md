![../../project-screenshots/icon.png](../../project-screenshots/icon.png)

## Running the Task on your Pipeline

### For Local testing

1. Download Apache JMeter from [Here](https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.5.tgz)

2. Unzip Apache JMeter on your machine.

3. Inside JMeter bin folder, copy the following:
    c. samplejmx.jmx

4. Once copied you can update the properties file, if needed.

5. Running Locally using GUI

    a. To open load test with property file in memory run
        ```jmeter```
    b. This should open GUI and now you can open the jmx file `samplejmx.jmx` from the bin folder.
    c. Click on run to see the data

6. Running Locally using non GUI

    a. Run the command
        ```jmeter -n -t  samplejmx.jmx -l jmeter.jtl -j jmeter.log -f -e -o Report```


This is how you can run the task in yur local.

Now you can add the jmeter task in your pipeline.
