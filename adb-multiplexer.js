"use strict";

var colors = require('colors');
var child_process = require('child_process');
var ArgumentParser = require('argparse').ArgumentParser;
var adbBridge = require('./modules/adbBridge');
var DeviceDetector = require('./modules/DeviceDetector');

var args = new ArgumentParser({
  version: '1.0',
  addHelp: true,
  description: 'Executes ADB commands on all connected devices.',
  epilog: 'Example usage: main.js "adb install myApp.apk"'
});

args.addArgument([ 'command' ], {
  help: 'ADB command to execute, for example "adb install <path to apk>". Use quotation marks for multiword commands. The "adb" prefix is optional.'
});

args.addArgument([ '--no-color' ], {
  action: 'storeTrue',
  required: false,
  help: 'Disables coloring of adb command output.'
});


var params = args.parseArgs();

if (params) {
  var devices = new DeviceDetector().devices;

  if (devices.length > 0) {
    var command = sanitizeAdbCommand(params.command);
    executeCommandOnDevices(devices, command, params.timeout);
  } else {
    console.error('no devices detected');
  }
}


function sanitizeAdbCommand(command) {
  // remove adb at beginning
  return command.replace(/^adb /, '');
}

function executeCommandOnDevices(deviceIds, command, timeout) {
  deviceIds.forEach(function (deviceId) {
    console.log();
    console.log('========================================');
    console.log('Result for', deviceId);
    console.log('========================================');

    var result = adbBridge.execSync(command, deviceId);
    console.log(result.cyan);
  });
}
