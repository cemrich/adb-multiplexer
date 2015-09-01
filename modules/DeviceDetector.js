"use strict";

var adbBridge = require('./adbBridge');
var Device = require('./Device');

var DEVICE_REGEXP = /^([a-zA-Z0-9\-]{5,})\s+(device|emulator|offline|no device|unauthorized)(?:\s+product\:(.*)\s+model:(.*)\s+device:(.*))?$/mg;
var WATCH_INTERVAL_MILLIS = 1000;

var DeviceDetector = function () {
  // get conncted devices at startup time
  this.deviceMap = getDevices();
};

DeviceDetector.prototype.watch = function (onDevicesChanged) {
  this.onDevicesChangedListener = onDevicesChanged;
  setInterval(this.informAboutChangeset.bind(this), WATCH_INTERVAL_MILLIS);
};

DeviceDetector.prototype.getDevices = function () {
  var devices = [];
  this.deviceMap.forEach(function (device, id) {
    devices.push(device);
  });
  return devices;
};

DeviceDetector.prototype.getOnlineDevices = function () {
  return this.getDevices().filter(function (device) {
    return device.isOnline();
  });
};

DeviceDetector.prototype.getOfflineDevices = function () {
  return this.getDevices().filter(function (device) {
    return !device.isOnline();
  });
};

DeviceDetector.prototype.informAboutChangeset = function () {
  // look for new or disconnected devices
  var oldDeviceMap = this.deviceMap;
  this.deviceMap = getDevices();

  var changeset = getChangeset(oldDeviceMap, this.deviceMap);
  if (changeset.added.length > 0 ||
    changeset.removed.length > 0 ||
    changeset.changed.length > 0) {
      this.onDevicesChangedListener(changeset);
  }
};

function getChangeset(oldDeviceMap, newDeviceMap) {
  var changeset = {
    added: [],
    removed: [],
    changed: []
  };

  oldDeviceMap.forEach(function (device, id) {
    if (newDeviceMap.has(id)) {
      if (!device.equals(newDeviceMap.get(id))) {
        changeset.changed.push(device);
      }
    } else {
      changeset.removed.push(device);
    }
  });

  newDeviceMap.forEach(function (device, id) {
    if (!oldDeviceMap.has(id)) {
      changeset.added.push(device);
    }
  });

  return changeset;
}

/**
 * @return array of device ids of connected android devices,
 *  empty when no device is connected
 */
function getDevices() {
  var deviceMap = new Map();
  var devices = adbBridge.execSync('devices -l');

  var match;
  while ((match = DEVICE_REGEXP.exec(devices))) {
    var device = new Device(match[1]);
    device.status = match[2];
    device.product = match[3];
    device.model = match[4];
    device.device = match[5];
    deviceMap.set(device.id, device);
  }

  return deviceMap;
}

module.exports = DeviceDetector;
