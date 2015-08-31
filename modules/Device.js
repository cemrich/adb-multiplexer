"use strict";

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

Device.prototype.equals = function (other) {
  return this.id === other.id &&
    this.product === other.product &&
    this.model === other.model &&
    this.device === other.device &&
    this.status === other.status;
};

module.exports = Device;
