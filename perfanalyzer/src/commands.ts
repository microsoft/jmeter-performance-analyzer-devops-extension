import { Commands, CommandTypes, OSTypes } from "./constant";
import { LogEvent } from "./telemetry-client";
import { TelemetryEvents, TraceLevel } from "./telemetry.constants";
import { formatString, getSystemProps, logInformation } from "./utility";

export function getCommands(commandName: CommandTypes, ...props: string[]) {

    let systemHostType:string = getSystemProps('Agent.OS').trim().toLowerCase();
    LogEvent(TelemetryEvents.AGENT_OS_TYPE, {'OS_TYPE': systemHostType});
    LogEvent(`OS_TYPE: ${systemHostType}`);

    let osType = getOSType(systemHostType);
    LogEvent(TelemetryEvents.AGENT_OS_TYPE_IDENTIFIED, {'OS_TYPE_IDENTIFIED': osType});
    LogEvent(`OS_TYPE_IDENTIFIED: ${osType}`);

    logInformation(`Fetching command for ${commandName} for Host Type: ${systemHostType}`, TraceLevel.Information);

    switch(commandName) {
        case CommandTypes.JMETER_RUN_WITH_PROPERTY:

            switch(osType) {
                case OSTypes.Windows:
                    return formatString(Commands.JMETER_RUN_WITH_PROPERTY_WINDOWS, props);

                case OSTypes.LINUX:
                    return formatString(Commands.JMETER_RUN_WITH_PROPERTY_LINUX, props);

                case OSTypes.MAC:
                    return formatString(Commands.JMETER_RUN_WITH_PROPERTY_MACOS, props);

                case OSTypes.UNKNOWN:
                    return formatString(Commands.JMETER_RUN_WITH_PROPERTY_LINUX, props);
            }
            
        case CommandTypes.JMETER_RUN_WITHOUT_PROPERTY:
            switch(osType) {
                case OSTypes.Windows:
                    return formatString(Commands.JMETER_RUN_WITHOUT_PROPERTY_WINDOWS, props);

                case OSTypes.LINUX:
                    return formatString(Commands.JMETER_RUN_WITHOUT_PROPERTY_LINUX, props);

                case OSTypes.MAC:
                    return formatString(Commands.JMETER_RUN_WITHOUT_PROPERTY_MACOS, props);

                case OSTypes.UNKNOWN:
                    return formatString(Commands.JMETER_RUN_WITHOUT_PROPERTY_LINUX, props);
            }
    }
}

function getOSType(systemHostType: string) {
    if(systemHostType.indexOf('windows') > -1) {
        return OSTypes.Windows;
    } else if(systemHostType.indexOf('linux') > -1 || systemHostType.indexOf('ubuntu') > -1) {
        return OSTypes.LINUX;
    } else if(systemHostType.indexOf('mac') > -1 || systemHostType.indexOf('darwin') ) {
        return OSTypes.MAC;
    } else {
        return OSTypes.UNKNOWN;
    }
}