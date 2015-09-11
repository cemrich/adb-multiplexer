"use strict";

var colors = require('colors');
var ArgumentParser = require('argparse').ArgumentParser;
var DeviceDetector = require('./modules/DeviceDetector');


//==============================
// set up argument parsing
//==============================

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


//==============================
// parse arguments and init
//==============================

var params = args.parseArgs();
var deviceDetector = new DeviceDetector();

// always execute for all currently connected devices
executeForOnlineDevices(deviceDetector, params.command);

if (params.continue) {
  // additionally execute for devices conneted in the future
  executeForFutureDevices(deviceDetector, params.command);
}


//==============================
// helper functions
//==============================

/**
 * Executes the given adb command on all devices that will be
 * connected in the future.
 * @param  {DeviceDetector} deviceDetector
 * @param  {string}         command          adb command to execute,
 *                                           leading "adb" keyword is optional
 */
function executeForFutureDevices(deviceDetector, command) {
  deviceDetector.watch(function (changeset) {
    if (changeset.added.length > 0 || changeset.changed.length > 0) {
      executeForOnlineDevices(deviceDetector, params.command);
    }
  });
}

/**
 * Executes the given adb command on all currently connected devices.
 * @param  {DeviceDetector} deviceDetector
 * @param  {string}         command          adb command to execute,
 *                                           leading "adb" keyword is optional
 */
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

/**
 * Executes the given adb command on all devices with the given ids.
 * @param  {Device[]} devices   array of Device instances
 * @param  {string}   command   sanitized adb command to execute
 */
function executeCommandOnDevices(devices, command) {
  console.log('devices detected:\n' + formatDeviceList(devices).green);

  devices.forEach(function (device) {
    console.log();
    console.log('========================================');
    console.log('Result for', device.id, '(' + device.model + ')');
    console.log('========================================');

    var result = device.executeCommandSync(command);
    console.log(result.cyan);
  });
}

/**
 * Takes a list of Device instances and transforms it into a nice
 * string output.
 * @param  {Device[]} deviceList  array of Device instances
 * @return {string}               string with the most important device infos
 *                                in list form
 */
function formatDeviceList(deviceList) {
  return deviceList.reduce(function (previousValue, device) {
    return previousValue + '- ' + device.toStatusString() + '\n';
  }, '');
}
