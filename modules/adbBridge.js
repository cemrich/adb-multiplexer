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
 * @throws {String}             error message when adb command was invalid,
 *                              could not be executed or timed out
 */
exports.execSync = function (command, deviceId) {
  var adbArgs = getAdbCommandArguments(command, deviceId);
  var childProcess = child_process.spawnSync(ADB_PATH, adbArgs);

  // as adb bridge returns very funny newlines (at least on windows),
  // remove them and only leave clean \n newlines
  var stdout = childProcess.stdout.toString().replace(/\r+/gm, '');
  var stderr = childProcess.stderr.toString();

  // TODO: Throwing a sting might not be best practice. Look this topic up.
  if (childProcess.error) {
    // timeout or fail
    throw childProcess.error;
  }

  if (childProcess.status !== 0) {
    // adb failed (most likely wrong arguments)
    throw stderr;
  }

  return stdout;
};

/**
 * Gets a clean adb command for the given device if present.
 * @param  {String}   command     adb command to execute,
 *                                leading "adb" keyword is optional
 * @param  {String}   [deviceId]  unique device id as reported by adb
 * @return {String[]}             adb command arguments ready to be executed
 */
function getAdbCommandArguments(command, deviceId) {
  var adbCommand = sanitizeAdbCommand(command);
  if (deviceId) {
    adbCommand = '-s ' + deviceId + ' ' + adbCommand;
  }
  return adbCommand.split(/\s+/);
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
