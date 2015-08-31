"use strict";

var colors = require('colors');
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

args.addArgument([ '-c', '--continue' ], {
  action: 'storeTrue',
  required: false,
  dest: 'continue',
  help: 'Continues to execute the given command on every device that will be connected for as long as this tool is running.'
});

args.addArgument([ '--no-color' ], {
  action: 'storeTrue',
  required: false,
  help: 'Disables coloring of adb command output.'
});


var params = args.parseArgs();
var deviceDetector = new DeviceDetector();
executeForOnlineDevices(deviceDetector, params.command);

if (params.continue) {
  executeForFutureDevices(deviceDetector, params.command);
}


function executeForFutureDevices(deviceDetector, command) {
  deviceDetector.watch(function (changeset) {
    if (changeset.added.length > 0 || changeset.changed.length > 0) {
      executeForOnlineDevices(deviceDetector, params.command);
    }
  });
}

function executeForOnlineDevices(deviceDetector, command) {
  var onlineDevices = deviceDetector.getOnlineDevices();
  var offlineDevices = deviceDetector.getOfflineDevices();

  if (onlineDevices.length > 0) {
    executeCommandOnDevices(onlineDevices, command);
  } else {
    if (offlineDevices.length > 0) {
        console.log('offline devices detected:\n' + formatDeviceList(offlineDevices).red);
    } else {
      console.error('no devices detected\n'.red);
    }
  }
}

function sanitizeAdbCommand(command) {
  // remove adb at beginning
  return command.replace(/^adb /, '');
}

function executeCommandOnDevices(deviceIds, command) {
  console.log('devices detected:\n' + formatDeviceList(deviceIds).green);
  var sanitizedCommand = sanitizeAdbCommand(command);

  deviceIds.forEach(function (device) {
    console.log();
    console.log('========================================');
    console.log('Result for', device.id, '(' + device.model + ')');
    console.log('========================================');

    var result = adbBridge.execSync(sanitizedCommand, device.id);
    console.log(result.cyan);
  });
}

function formatDeviceList(deviceList) {
  return deviceList.reduce(function (previousValue, device) {
    var line = '- ' + device.id;
    line += ' (' + (device.model ? device.model : device.status) + ')';
    return previousValue + line + '\n';
  }, '');
}
