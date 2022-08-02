import { trackException } from './telemetry-client';
import { TraceLevel } from './telemetry.constants';
import { logInformation } from "./utility";
import tr = require('azure-pipelines-task-lib/toolrunner');
const tl = require('azure-pipelines-task-lib/task');

export async function RunPowershellCommand(command: string) {

    let powershellPath: string = ''
    try {
        powershellPath = tl.which('pwsh', true)
        logInformation(`Powershell path: '${powershellPath}'`, TraceLevel.Information)
    }
    catch (error) {
        logInformation(`Tool 'pwsh' not found. Error: ${error}`, TraceLevel.Error)
        logInformation("PowerShell core is not available on agent machine. Falling back to using Windows PowerShell.", TraceLevel.Error)
        logInformation(tl.loc('PwshNotAvailable'), TraceLevel.Error)
        powershellPath = tl.which('powershell', true);
        return;
    }
    
    try {
        let powershell = tl.tool(powershellPath)
                        .arg('-NoLogo')
                        .arg('-NoProfile')
                        .arg('-NonInteractive')
                        .arg('-Command')
                        .arg(command);
                        
    
        let options = <tr.IExecOptions>{
            failOnStdErr: false,
            errStream: process.stdout,
            outStream: process.stdout,
            ignoreReturnCode: true
        };

        let startTimeInSeconds: number = 0
        let endTimeInSeconds: number = 0

        startTimeInSeconds = Math.round(Date.now() / 1000)
        let exitCode: number = await powershell.exec(options);
        endTimeInSeconds = Math.round(Date.now() / 1000)
        let timeToRunInSeconds: number = endTimeInSeconds - startTimeInSeconds
        tl.debug(`Time to run permission command in seconds = '${timeToRunInSeconds}'`)

        if (exitCode !== 0) {
            logInformation('Warning: Failed to run command: ' + command, TraceLevel.Warning)
            trackException('Warning: Failed to run command: ' + command)
        }
    } catch (e) {
        logInformation('Ignore: Failed to run command to set permissions. Using defaults', TraceLevel.Error)
        trackException(`Warning: Failed to run command: ${command} Failed with error ${e?.message}`, e)
    }
}