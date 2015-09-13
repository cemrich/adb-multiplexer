"use strict";

/** @module adbBridge */

var child_process = require('child_process');

/**
 * Path to global adb installation. It is assumed that the adb
 * command is part of the sytsmes PATH.
 * @type {String}
 * @const
 */
var ADB_PATH = 'adb';

/**
 * RexExp to match {@link module:adbBridge~ADB_PATH} at the beginning of a command.
 * @type {RegExp}
 * @const
 */
var REPLACE_ADB_REGEX = new RegExp('^' + ADB_PATH);

/**
 * Executes an adb command on the connected device with the given id.
 * @param  {String} command     adb command to execute,
 *                              leading "adb" keyword is optional
 * @param  {String} [deviceId]  unique device id as reported by adb
 * @return {String}             stdout / result of executing the command
 */
exports.execSync = function (command, deviceId) {
  var adbCommand = getAdbCommand(command, deviceId);
  var stdout = child_process.execSync(adbCommand).toString();
  // as adb bridge returns very funny newlines (at least on windows),
  // remove them and only leave clean \n newlines
  stdout = stdout.replace(/\r+/gm, '');
  return stdout;
};

/**
 * Gets a clean adb command for the given device if present.
 * @param  {String} command     adb command to execute,
 *                              leading "adb" keyword is optional
 * @param  {String} [deviceId]  unique device id as reported by adb
 * @return {String}             adb command ready to be executed
 */
function getAdbCommand(command, deviceId) {
  var adbCommand = ADB_PATH;
  if (deviceId) {
    adbCommand += ' -s ' + deviceId;
  }
  adbCommand += ' ' + sanitizeAdbCommand(command);
  return adbCommand;
}

/**
 * Removes trailing "adb" keyword from command.
 * @param  {String} command   adb command to execute,
 *                            leading "adb" keyword is optional
 * @return {String}           sanitized command string
 */
function sanitizeAdbCommand(command) {
  return command.replace(REPLACE_ADB_REGEX, '');
}
