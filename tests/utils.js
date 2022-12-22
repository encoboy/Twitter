const readline = require('readline');

var utils = {} ;

utils.consoleWaiting = function () {
    // Wait for user's response.
    // readline.question('press any key to exit.');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('press any key to exit.\n', (answer) => {
        rl.close();
    });
} ;

utils.wait = function wait(ms) {
    return new Promise(resolve=>setTimeout(()=>resolve(), ms));
};

module.exports = utils;