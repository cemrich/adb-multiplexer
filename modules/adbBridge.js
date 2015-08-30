"use strict";

var child_process = require('child_process');

var ADB_PATH = 'adb';

exports.execAsync = function (command, deviceId) {
  var adbCommand = getAdbCommand(command, deviceId);

  // TODO: this only works on windows machines, fix later
  return child_process.spawn('cmd', ['/c', adbCommand], { env: process.env });
};

exports.execSync = function (command, deviceId) {
  var adbCommand = getAdbCommand(command, deviceId);
  return child_process.execSync(adbCommand).toString();
};

function getAdbCommand(command, deviceId) {
  var adbCommand = ADB_PATH;
  if (deviceId) {
    adbCommand += ' -s ' + deviceId;
  }
  adbCommand += ' ' + command;
  return adbCommand;
}
