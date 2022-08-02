// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ERROR_DEFAULT_MSG, InputVariables } from './constant';
import { LogEvent, trackException } from './telemetry-client';
import { TraceLevel } from './telemetry.constants';
import { logInformation } from './utility';
const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');
const sh = require('shelljs');

export async function replaceTokens(fileName: string | null | undefined) {
    
    try {
        let event = 'Starting Replace Tokens task for file: ' + fileName
        logInformation(event, TraceLevel.Verbose);
        LogEvent(event);

        // get the task vars
        let sourcePath: string | null | undefined= fileName;
        if (!sourcePath || sourcePath.length === 0) {
           tl.setResult(tl.TaskResult.Failed, "No File Found to replace token");
           return;
        }

        // clear leading and trailing quotes for paths with spaces
        sourcePath = sourcePath.replace(/"/g, "");

        // remove trailing slash
        if (sourcePath.endsWith("\\") || sourcePath.endsWith("/")) {
            logInformation("Trimming separator off sourcePath", TraceLevel.Verbose);
            sourcePath = sourcePath.substr(0, sourcePath.length - 1);
        }

        tl.checkPath(sourcePath, "sourcePath");

        var tokenRegex = tl.getInput(InputVariables.TOKEN_REGEX, true);

        const warning = (message: string) => tl.warning(message);

        logInformation(`sourcePath: [${sourcePath}]`, TraceLevel.Information);
        logInformation(`tokenRegex: [${tokenRegex}]`, TraceLevel.Information);

        if (!tokenRegex || tokenRegex.length === 0){
            tokenRegex = "__(\\w+)__";
        }
        let files = [sourcePath];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            logInformation(`Starting regex replacement in [${file}]`, TraceLevel.Verbose);

            var contents = fs.readFileSync(file).toString();
            var reg = new RegExp(tokenRegex, "g");

            var match: RegExpExecArray | null;
            var newContents = contents;
            while((match = reg.exec(contents)) !== null) {
                var vName = match[1];
                var vIsArray = vName.endsWith("[]");
                if (vIsArray) {
                    vName = vName.substring(0, vName.length - 2);
                    logInformation(`Detected that ${vName} is an array token`, TraceLevel.Warning);
                }

                // find the variable value in the environment
                var vValue = tl.getVariable(vName);

                if (typeof vValue === 'undefined') {
                    warning(`Token [${vName}] does not have an environment value`);
                } else {
                    if (vIsArray) {
                        newContents = newContents.replace(match[0], vValue.replace(/,/g, "\",\""));
                    } else {
                        newContents = newContents.replace(match[0], vValue);
                    }
                    logInformation(`Replaced token [${vName }]`, TraceLevel.Verbose);
                }

            }
            logInformation("Updating Values into new file", TraceLevel.Information);

            sh.chmod(666, file);
            fs.writeFileSync(file, newContents);
        }

    } catch (err :any) {
        tl.error(err);
        logInformation(ERROR_DEFAULT_MSG, TraceLevel.Error);
        let msg = err;
        if (err.message) {
            msg = err.message;
        }
        trackException(msg, err);
        tl.setResult(tl.TaskResult.Failed, msg);
    }

    logInformation("Completed Replace Token Step.", TraceLevel.Information);
}
