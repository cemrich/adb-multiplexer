"use strict";

var adbBridge = require('./adbBridge');
var Device = require('./Device');

var DEVICE_ID_REGEXP = /^([a-zA-Z0-9\-]{5,})\s+(device|emulator|offline|no device)\s+product\:(.*)\s+model:(.*)\s+device:(.*)$/mg;

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
  var devices = adbBridge.execSync('devices -l');

  var match;
  while ((match = DEVICE_ID_REGEXP.exec(devices))) {
    var device = new Device(match[1]);
    device.status = match[2];
    device.product = match[3];
    device.model = match[4];
    device.device = match[5];
    deviceIds.push(device);
  }

  return deviceIds;
}

module.exports = DeviceDetector;
