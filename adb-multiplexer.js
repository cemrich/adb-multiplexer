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

args.addArgument([ '--no-color' ], {
  action: 'storeTrue',
  required: false,
  help: 'Disables coloring of adb command output.'
});


var params = args.parseArgs();

if (params) {
  var deviceDetector = new DeviceDetector();
  var onlineDevices = deviceDetector.getOnlineDevices();
  var offlineDevices = deviceDetector.getOfflineDevices();

  if (offlineDevices.length > 0) {
      console.log('offline devices detected:\n' + formatDeviceList(offlineDevices).red);
  }

  if (onlineDevices.length > 0) {
    console.log('devices detected:\n' + formatDeviceList(onlineDevices).green);
    var command = sanitizeAdbCommand(params.command);
    executeCommandOnDevices(onlineDevices, command);
  } else {
    console.error('no devices detected'.red);
  }
}


function sanitizeAdbCommand(command) {
  // remove adb at beginning
  return command.replace(/^adb /, '');
}

function executeCommandOnDevices(deviceIds, command) {
  deviceIds.forEach(function (device) {
    console.log();
    console.log('========================================');
    console.log('Result for', device.id, '(' + device.model + ')');
    console.log('========================================');

    var result = adbBridge.execSync(command, device.id);
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
