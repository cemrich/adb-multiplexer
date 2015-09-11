"use strict";

var child_process = require('child_process');

var ADB_PATH = 'adb';

exports.execAsync = function (command, deviceId) {
  var adbCommand = getAdbCommand(command, deviceId);

  // TODO: this only works on windows machines, fix later
  return child_process.spawn('cmd', ['/c', adbCommand], { env: process.env });
};

exports.execSync = function (command, deviceId) {
  command = sanitizeAdbCommand(command);
  var adbCommand = getAdbCommand(command, deviceId);
  return child_process.execSync(adbCommand).toString();
};

/**
 * Removes trailing "adb" keyword from command.
 * @param  {string} command   adb command to execute,
 *                            leading "adb" keyword is optional
 * @return {string}           sanitized command string
 */
function sanitizeAdbCommand(command) {
  // TODO: refactor this function and getAdbCommand
  return command.replace(/^adb /, '');
}

function getAdbCommand(command, deviceId) {
  var adbCommand = ADB_PATH;
  if (deviceId) {
    adbCommand += ' -s ' + deviceId;
  }
  adbCommand += ' ' + command;
  return adbCommand;
}
