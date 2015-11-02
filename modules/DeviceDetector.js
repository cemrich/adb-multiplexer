"use strict";

var util = require('util');
var EventEmitter = require('events');
var adbBridge = require('./adbBridge');
var Device = require('./Device');

var DEVICE_REGEXP = /^([a-zA-Z0-9\-]{5,})\s+(device|emulator|offline|no device|unauthorized)(?:\s+product\:(.*)\s+model:(.*)\s+device:(.*))?$/mg;
var WATCH_INTERVAL_MILLIS = 1000;

 /**
  * Changeset containing added, removed or changed devices.
  * @typedef {Object} DeviceDetector~Changeset
  * @property {Device[]} added    devices added since last lookup
  * @property {Device[]} removed  devices removed since last lookup
  * @property {Device[]} changed  devices with changed status since last lookup
  */

/**
  * List of newly added devices.
  * @event DeviceDetector#devicesAdded
  * @type {Device[]}
  */
/**
  * List of newly removed devices.
  * @event DeviceDetector#devicesRemoved
  * @type {Device[]}
  */
/**
  * List of devices with changed status.
  * @event DeviceDetector#devicesChanged
  * @type {Device[]}
  */
/**
  * Complete changeset with added, removed and changes devices.
  * @event DeviceDetector#newChangeset
  * @type {DeviceDetector~Changeset}
  */


/**
 * Detects connected android devices via adb.
 * Use {@link watch} to detect cahnges in connected
 * devices.
 * @class
 */
var DeviceDetector = function () {
  EventEmitter.call(this);

  // get connceted devices at startup time
  /**
   * Currently connected Device instances mapped to their ids.
   * This will be filled right after initialization.
   * @type {Map}
   */
  this.deviceMap = this.getAdbDevices();

  this.interval = null;
};

util.inherits(DeviceDetector, EventEmitter);

/**
 * Starts watching for changes in the device list, e.g. when the user connects
 * a new device, unplugs a device or grants adb access for an already connected
 * one.
 * @fires DeviceDetector#devicesAdded
 * @fires DeviceDetector#devicesRemoved
 * @fires DeviceDetector#devicesChanged
 * @fires DeviceDetector#newChangeset
 */
DeviceDetector.prototype.watch = function () {
  this.interval = setInterval(this.informAboutChangeset.bind(this), WATCH_INTERVAL_MILLIS);
};

/**
 * Stops watching for device changes.
 */
DeviceDetector.prototype.unwatch = function () {
  if (this.interval !== null) {
    clearInterval(this.interval);
    this.interval = null;
  }
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
  this.deviceMap = this.getAdbDevices();

  var changeset = this.getChangeset(oldDeviceMap, this.deviceMap);

  if (changeset.added.length > 0) {
    this.emit('devicesAdded', changeset.added);
  }

  if (changeset.removed.length > 0) {
    this.emit('devicesRemoved', changeset.removed);
  }

  if (changeset.changed.length > 0) {
    this.emit('devicesChanged', changeset.changed);
  }

  if (changeset.added.length > 0 ||
      changeset.removed.length > 0 ||
      changeset.changed.length > 0) {
    this.emit('newChangeset', changeset);
  }

  return changeset;
};

/**
 * Calculates the cangeset of two given device maps.
 * @param {Map.<string, Device>} oldDeviceMap
 * @param {Map.<string, Device>} newDeviceMap
 * @return {DeviceDetector~Changeset} changeset
 * @private
 */
DeviceDetector.prototype.getChangeset = function (oldDeviceMap, newDeviceMap) {
  var changeset = {
    added: [],
    removed: [],
    changed: []
  };

  oldDeviceMap.forEach(function (device, id) {
    if (newDeviceMap.has(id)) {
      var newDevice = newDeviceMap.get(id);
      if (!device.equals(newDevice)) {
        changeset.changed.push(newDevice);
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
};

/**
 * @return  {Map.<string, Device>}  Currently connected android devices.
 *                                  Empty when no device is connected.
 * @private
 */
DeviceDetector.prototype.getAdbDevices = function () {
  var deviceMap = new Map();
  var devices = this.getRawDeviceList();

  var match;
  while ((match = DEVICE_REGEXP.exec(devices))) {
    var device = new Device(match[1]);
    device.status = match[2] || '';
    device.product = match[3] || '';
    device.model = match[4] || '';
    device.device = match[5] || '';
    deviceMap.set(device.id, device);
  }

  return deviceMap;
};

/**
 * @return  {String}  device list as reported by adb
 * @private
 */
DeviceDetector.prototype.getRawDeviceList = function () {
  return adbBridge.execSync('devices -l');
};

module.exports = DeviceDetector;
