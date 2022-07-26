// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {logInformation } from './utility'
import {ERROR_DEFAULT_MSG, InputVariables, InputVariableType } from './constant'
import { LogEvent } from './telemetry-client';
const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');
const sh = require('shelljs');

export async function replaceTokens(fileName: string | null | undefined) {
    var errCount = 0;

    try {
        let event2 = 'Starting Replace Tokens task for file: ' + fileName
        logInformation(event2);
        LogEvent(event2);

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
            logInformation("Trimming separator off sourcePath");
            sourcePath = sourcePath.substr(0, sourcePath.length - 1);
        }

        tl.checkPath(sourcePath, "sourcePath");

        var warningsAsErrors = true;

        var tokenRegex = tl.getInput(InputVariables.TOKEN_REGEX, true);

        const warning = warningsAsErrors ?
            (message: string) => { tl.error(message); errCount++ } :
            (message: string) => tl.warning(message);

        logInformation(`sourcePath: [${sourcePath}]`);
        logInformation(`tokenRegex: [${tokenRegex}]`);

        if (!tokenRegex || tokenRegex.length === 0){
            tokenRegex = "__(\\w+)__";
        }
        let files = [sourcePath];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            logInformation(`Starting regex replacement in [${file}]`);

            var contents = fs.readFileSync(file).toString();
            var reg = new RegExp(tokenRegex, "g");

            var match: RegExpExecArray | null;
            var newContents = contents;
            while((match = reg.exec(contents)) !== null) {
                var vName = match[1];
                var vIsArray = vName.endsWith("[]");
                if (vIsArray) {
                    vName = vName.substring(0, vName.length - 2);
                    logInformation(`Detected that ${vName} is an array token`);
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
                    logInformation(`Replaced token [${vName }]`);
                }

            }
            logInformation("Writing new values to file");

            sh.chmod(666, file);
            fs.writeFileSync(file, newContents);
        }

    } catch (err :any) {
        tl.error(err);
        logInformation(ERROR_DEFAULT_MSG);
        let msg = err;
        if (err.message) {
            msg = err.message;
        }
        tl.setResult(tl.TaskResult.Failed, msg);
    }

    if (errCount > 0) {
        tl.setResult(tl.TaskResult.Failed, "Errors were encountered - please check logs for details.");
    }

    logInformation("Leaving Replace Tokens task");
}
