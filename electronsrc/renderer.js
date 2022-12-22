/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

console.log(window.location.href);

async function test(){
    var list = await EthereumHelper.ParseAddresses('praise you muffin lion enable neck grocery crumble super myself license ghost', 10);

    for (var i in list) {
        console.log(list[i]);
    }
}

test()
