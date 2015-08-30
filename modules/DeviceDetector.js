"use strict";

var adbBridge = require('./adbBridge');

var DEVICE_ID_REGEXP = /^[a-zA-Z0-9]{5,}/mg;

var DeviceDetector = function () {
  this.devices = getDeviceIds();
  console.log("Devices detected:", this.devices);
};

/**
 * @return array of device ids of connected android devices,
 *  empty when no device is connected
 */
function getDeviceIds() {
  // TODO: exclude devices that are offline

  var deviceIds = [];
  var devices = adbBridge.execSync('devices');

  var match;
  while ((match = DEVICE_ID_REGEXP.exec(devices))) {
    deviceIds.push(match[0]);
  }

  return deviceIds;
}

module.exports = DeviceDetector;
