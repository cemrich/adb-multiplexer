"use strict";

var adbBridge = require('./adbBridge');
var Device = require('./Device');

var DEVICE_REGEXP = /^([a-zA-Z0-9\-]{5,})\s+(device|emulator|offline|no device|unauthorized)(?:\s+product\:(.*)\s+model:(.*)\s+device:(.*))?$/mg;
var WATCH_INTERVAL_MILLIS = 1000;

/**
 * Called when devices have been added, removed or changed since the last
 * callback or instanciation.
 * @callback DeviceDetector~devicesChangedCallback
 * @param {DeviceDetector~Changeset} changed devices since last callback or
 *                                           instanciation
 */

 /**
  * Changeset containing added, removed or changed devices.
  * @typedef {Object} DeviceDetector~Changeset
  * @property {Device[]} added    devices added since last lookup
  * @property {Device[]} removed  devices removed since last lookup
  * @property {Device[]} changed  devices with changed status since last lookup
  */


/**
 * Detects connected android devices via adb.
 * Use {@link watch} to detect cahnges in connected
 * devices.
 * @class
 */
var DeviceDetector = function () {
  // get conncted devices at startup time
  /**
   * Currently connected Device instances mapped to their ids.
   * This will be filled right after initialization.
   * @type {Map}
   */
  this.deviceMap = getDevices();
};

/**
 * Starts watching for changes in the device list, e.g. when the user connects
 * a new device, unplugs a device or grants adb access for an already connected
 * one.
 * @param  {DeviceDetector~devicesChangedCallback} onDevicesChanged callback
 */
DeviceDetector.prototype.watch = function (onDevicesChanged) {
  this.onDevicesChangedListener = onDevicesChanged;
  setInterval(this.informAboutChangeset.bind(this), WATCH_INTERVAL_MILLIS);
};

/**
 * @return {Device[]}   array of all currently connected devices
 */
DeviceDetector.prototype.getDevices = function () {
  var devices = [];
  this.deviceMap.forEach(function (device, id) {
    devices.push(device);
  });
  return devices;
};

/**
 * @return {Device[]}   array of all currently connected devices that can be
 *                      accessed via adb
 */
DeviceDetector.prototype.getOnlineDevices = function () {
  return this.getDevices().filter(function (device) {
    return device.isOnline();
  });
};

/**
 * @return {Device[]}   array of all currently connected devices that cannot
 *                      be accessed via adb
 */
DeviceDetector.prototype.getOfflineDevices = function () {
  return this.getDevices().filter(function (device) {
    return !device.isOnline();
  });
};

/**
 * Looks for changes in the device list and calls the given listener added by
 * {@link #watch} method when changes are detected.
 * @return {DeviceDetector~Changeset} changeset
 */
DeviceDetector.prototype.informAboutChangeset = function () {
  var oldDeviceMap = this.deviceMap;
  this.deviceMap = getDevices();

  var changeset = getChangeset(oldDeviceMap, this.deviceMap);
  if (changeset.added.length > 0 ||
    changeset.removed.length > 0 ||
    changeset.changed.length > 0) {
      this.onDevicesChangedListener(changeset);
  }

  return changeset;
};

/**
 * Calculates the cangeset of two given device maps.
 * @param {Map.<string, Device>} oldDeviceMap
 * @param {Map.<string, Device>} newDeviceMap
 * @private
 */
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
 * @return  {Map.<string, Device>}  Currently connected android devices.
 *                                  Empty when no device is connected.
 * @private
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
