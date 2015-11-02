"use strict";

var adbBridge = require('./adbBridge');

/**
 * Device class representing a detected android device.
 * This could be a physical device or an emulator detected
 * by adb.
 * @param {string} id unique device id as reported by adb
 * @class
 */
var Device = function (id) {
  this.id = id;
  this.product = '';
  this.model = '';
  this.device = '';
  this.status = '';
};

/**
 * @return {Boolean}  true when adb can communicate with this device at
 *                         the moment, false when it is e.g. unauthorized.
 *                         Use the status attribute to get more information
 *                         about the devices current status.
 */
Device.prototype.isOnline = function () {
  return this.status === 'device' || this.status === 'emulator';
};

/**
 * @return {Boolean}  true when this device is an emulator, false when it is
 *                         a physical device or currently offline
 */
Device.prototype.isEmulator = function () {
  return this.status === 'emulator';
};

/**
 * Executes the given adb comand on this device and returns the result
 * as string. This method is blocking and returns when command execution
 * is finished-
 * @param  {string} command   adb command to execute, leading "adb" keyword is optional
 * @return {string}           output of the command
 * @throws {String}           error message when adb command was invalid,
 *                            could not be executed or timed out
 */
Device.prototype.executeCommandSync = function (command) {
  return adbBridge.execSync(command, this.id);
};

/**
 * @return {string} status string of the form "<id> (<model>|<status>)", e.g.
 *                         "001991674c709e (unauthorized)" or
 *                         "001991674c709e (GT_I9100)"
 */
Device.prototype.toStatusString = function () {
  return this.id + ' (' + (this.model ? this.model : this.status) + ')';
};

Device.prototype.equals = function (other) {
  return this.id === other.id &&
    this.product === other.product &&
    this.model === other.model &&
    this.device === other.device &&
    this.status === other.status;
};

module.exports = Device;
