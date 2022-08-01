![Screenshot](./../../screenshots/icon.png)

## Running the Task on your Pipeline

### For Local testing

1. Download Apache JMeter from [Here](https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.5.tgz)

2. Unzip Apache JMeter on your machine.

3. Inside JMeter bin folder, copy the following:
    a. user_data_with_property_values.properties
    c. SampleTokenGeneration.jmx

4. Once copied you can update the properties file, if needed.

5. Running Locally using GUI

    a. To open load test with property file in memory run
        ```jmeter -q  user_data_with_property_values.properties```
    b. This should open GUI and now you can open the jmx file `SampleTokenGeneration.jmx` from the bin folder.
    c. Click on run to see the data

6. Running Locally using non GUI

    a. Run the command
        ```jmeter -q  user_data_with_property_values.properties -n -t  SampleTokenGeneration.jmx -l jmeter.jtl -j jmeter.log -f -e -o Report```


This is how you can run the task in yur local. You can create your own jmx and test it like this. Once done, create a paramerized version of property file like `user_data_with_placeholders.properties` here. 

Now you can add the jmeter task in your pipeline, and provide the variable value in `Variables` section of your azure pipeline.


### Note

1. Token generation is a part of JMX script and there can be different ways of generating different token. Your application token can be 
oauth2 server or a simple password based authentication. Based on the library you can generate the token.

2. This example uses Microsoft AAD token generation, however the process will be similar for other oauth2 servers.