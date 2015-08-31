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

module.exports = Device;
