var child_process = require('child_process');
var ArgumentParser = require('argparse').ArgumentParser;

var DEVICE_ID_REGEXP = /^[a-zA-Z0-9]{5,}/;
var COMMAND_TIMEOUT_MILLIS = 10000;
var ADB_PATH = 'adb';

var args = new ArgumentParser({
  version: '1.0',
  addHelp: true,
  description: 'Executes ADB commands on all connected devices.',
  epilog: 'Example usage: main.js -t 0 "adb install myApp.apk"'
});

args.addArgument([ 'command' ], {
    help: 'ADB command to execute, for example "adb install <path to apk>". Use quotation marks for multiword commands. The "adb" prefix is optional.'
});

args.addArgument([ '-t', '--timeout'], {
    help: 'Timeout in milliseconds after which a command will be canceled. Defaults to 10000 (10 seconds). Set 0 for no timeout.',
    dest: 'timeout',
    type: 'int',
    defaultValue: COMMAND_TIMEOUT_MILLIS
});


var params = args.parseArgs();

if (params) {
  var devices = getDeviceIds();

  if (devices.length > 0) {
    console.log('device ids detected: ' + devices);
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
    var deviceCommand = ADB_PATH + ' -s ' + deviceId + ' ' + command;
    console.log('executing: ' + deviceCommand);
    var result = child_process.exec(deviceCommand,  { timeout: timeout },
      function (error, stdout, stderr) {
        console.log(stdout.split(/[\r|\n]+/)[0]);
        console.error(stderr);

        if (error !== null) {
          console.error(error);
        }
      }
    );
  });
}

/**
 * @return array of device ids of connected android devices,
 *  empty when no device is connected
 */
function getDeviceIds() {
  // get devices list from adb
  var devices = child_process.execSync(ADB_PATH + ' devices').toString();
  devices = devices.split(/[\r|\n]+/);

  // delete all metadata
  devices = devices.filter(function (line, index) {
    if (index === 0 || line === "") {
      return false;
    }

    if (line.match(DEVICE_ID_REGEXP) === null) {
      console.error(line.split(/\s+/)[0] + ' is no valid device id');
      return false;
    } else {
      return true;
    }
  });

  // we only need device ids
  return devices.map(function (line) {
    return line.match(DEVICE_ID_REGEXP)[0];
  });
}
