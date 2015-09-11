"use strict";

var adbBridge = require('./adbBridge');

var Device = function (id) {
  this.id = id;
  this.product = '';
  this.model = '';
  this.device = '';
  this.status = '';
};

Device.prototype.isOnline = function () {
  return this.status === 'device' || this.status === 'emulator';
};

Device.prototype.isEmulator = function () {
  return this.status === 'emulator';
};

Device.prototype.executeCommandSync = function (command) {
  return adbBridge.execSync(command, this.id);
};

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
