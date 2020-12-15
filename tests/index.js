/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const {AmongUsProcess} = require("../dist/Structures/AmongUsProcess");
const fs = require("fs");


const testNames = process.argv.slice(2);

console.log("Waiting for connection to Among Us...");
AmongUsProcess.scan((p) => {
    console.log("Connected!");
    const allTests = fs.readdirSync("./tests/src");
    for (const testFile of allTests) {
        if (testNames.length && !testNames.includes(testFile)) return;
        const rtrnFnc = require(`./src/${testFile}`);
        rtrnFnc(p);
    }
}, 1000, true);
