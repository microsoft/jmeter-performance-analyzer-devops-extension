import { Commands, CommandTypes } from "./constant";
import { TraceLevel } from "./telemetry.constants";
import { formatString, getSystemProps, logInformation } from "./utility";

export function getCommands(commandName: CommandTypes, ...props: string[]) {

    let systemHostType:string = getSystemProps('Agent.OS').trim().toLowerCase();
    logInformation(`Fetching command for ${commandName} for Host Type: ${systemHostType}`, TraceLevel.Information);

    switch(commandName) {
        case CommandTypes.JMETER_RUN_WITH_PROPERTY:
            if(systemHostType.indexOf('windows') > -1) {
                return formatString(Commands.JMETER_RUN_WITH_PROPERTY_WINDOWS, props);
            } else if(systemHostType.indexOf('linux') > -1 || systemHostType.indexOf('ubuntu') > -1) {
                return formatString(Commands.JMETER_RUN_WITH_PROPERTY_LINUX, props);
            } else if(systemHostType.indexOf('mac') > -1 || systemHostType.indexOf('darwin') ) {
                return formatString(Commands.JMETER_RUN_WITH_PROPERTY_MACOS, props);
            } else {
                return formatString(Commands.JMETER_RUN_WITH_PROPERTY_LINUX, props);
            }
        
        case CommandTypes.JMETER_RUN_WITHOUT_PROPERTY:
            if(systemHostType.indexOf('windows') > -1) {
                return formatString(Commands.JMETER_RUN_WITHOUT_PROPERTY_WINDOWS, props);
            } else if(systemHostType.indexOf('linux') > -1 || systemHostType.indexOf('ubuntu') > -1) {
                return formatString(Commands.JMETER_RUN_WITHOUT_PROPERTY_LINUX, props);
            } else if(systemHostType.indexOf('mac') > -1 || systemHostType.indexOf('darwin') ) {
                return formatString(Commands.JMETER_RUN_WITHOUT_PROPERTY_MACOS, props);
            } else {
                return formatString(Commands.JMETER_RUN_WITHOUT_PROPERTY_LINUX, props);
            }
    }
}
