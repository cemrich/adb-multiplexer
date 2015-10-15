/* globals describe, it, beforeEach */

"use strict";

var assert = require('assert');
var DeviceDetector = require('../modules/DeviceDetector');
var Device = require('../modules/Device');


describe('DeviceDetector', function() {

  var deviceDetector = null;
  var onlineDevice = null;
  var offlineDevice = null;

  function setFullDeviceList() {
    deviceDetector.getRawDeviceList = function () {
      return 'List of devices attached\n' +
        onlineDevice.id  + '         ' + onlineDevice.status  + '\n' +
        offlineDevice.id + '         ' + offlineDevice.status + '\n\n';
    };
  }

  function setChangedDeviceList() {
    deviceDetector.getRawDeviceList = function () {
      // both devices offline
      return 'List of devices attached\n' +
        onlineDevice.id  + '         ' + offlineDevice.status  + '\n' +
        offlineDevice.id + '         ' + offlineDevice.status + '\n\n';
    };
  }

  function setEmptyDeviceList() {
    deviceDetector.getRawDeviceList = function () {
      return 'List of devices attached\n\n';
    };
  }

  beforeEach(function() {
    // mock getRawDeviceList to return empty list
    DeviceDetector.prototype.getRawDeviceList = function () {
      return 'List of devices attached\n\n';
    };

    deviceDetector = new DeviceDetector();
    onlineDevice = new Device('online-id');
    onlineDevice.status = 'device';
    offlineDevice = new Device('offline-id');
    offlineDevice.status = 'unauthorized';
    deviceDetector.watch();
  });

  describe('#getOfflineDevices()', function () {
    it('should be empty without devices', function () {
      assert.deepEqual(deviceDetector.getOfflineDevices(), []);
    });
    it('should return existing devices', function () {
      setFullDeviceList();
      deviceDetector.informAboutChangeset();
      assert.deepEqual(deviceDetector.getOfflineDevices(), [offlineDevice]);
    });
  });

  describe('#getOnlineDevices()', function () {
    it('should be empty without devices', function () {
      assert.deepEqual(deviceDetector.getOnlineDevices(), []);
    });
    it('should return existing devices', function () {
      setFullDeviceList();
      deviceDetector.informAboutChangeset();
      assert.deepEqual(deviceDetector.getOnlineDevices(), [onlineDevice]);
    });
  });

  describe('#getDevices()', function () {
    it('should be empty without devices', function () {
      assert.deepEqual(deviceDetector.getDevices(), []);
    });
    it('should return existing devices', function () {
      setFullDeviceList();
      deviceDetector.informAboutChangeset();
      assert.deepEqual(deviceDetector.getDevices(), [onlineDevice, offlineDevice]);
    });
  });

  describe('#deviceMap', function () {
    it('should be empty without devices', function () {
      assert.deepEqual(deviceDetector.deviceMap, new Map());
    });
  });

  describe('#informAboutChangeset()', function () {
    it('should return an empty changeset without devices', function () {
      var expectedChangeset = { added: [], removed: [], changed: [] };
      assert.deepEqual(deviceDetector.informAboutChangeset(), expectedChangeset);
    });
  });

  describe('#watch()', function () {

    it('should fire #devicesAdded', function (done) {
      this.timeout(6000);

      deviceDetector.on('devicesAdded', function (changeset) {
        assert.deepEqual(changeset, [onlineDevice, offlineDevice]);
        done();
      });

      setFullDeviceList();
    });

    it('should fire #devicesRemoved', function (done) {
      this.timeout(6000);

      deviceDetector.on('devicesRemoved', function (changeset) {
        assert.deepEqual(changeset, [onlineDevice, offlineDevice]);
        done();
      });

      setFullDeviceList();
      setTimeout(setEmptyDeviceList, 2000);
    });

    it('should fire #devicesChanged', function (done) {
      this.timeout(6000);

      deviceDetector.on('devicesChanged', function (changeset) {
        assert.equal(changeset.length, 1);
        assert.equal(changeset[0].id, onlineDevice.id);
        assert.equal(changeset[0].status, offlineDevice.status);
        done();
      });

      setFullDeviceList();
      setTimeout(setChangedDeviceList, 2000);
    });

    it('should fire #newChangeset for added devices', function (done) {
      var expectedChangeset = { added: [onlineDevice, offlineDevice], removed: [], changed: [] };
      this.timeout(6000);

      deviceDetector.on('newChangeset', function (changeset) {
        assert.deepEqual(changeset, expectedChangeset);
        done();
      });

      setFullDeviceList();
    });

    it('should fire #newChangeset for removed devices', function (done) {
      var expectedChangeset = { added: [], removed: [onlineDevice, offlineDevice], changed: [] };
      this.timeout(6000);

      setTimeout(function () {
        deviceDetector.on('newChangeset', function (changeset) {
          assert.deepEqual(changeset, expectedChangeset);
          done();
        });
      }, 2000);

      setFullDeviceList();
      setTimeout(setEmptyDeviceList, 2000);
    });

    it('should fire #newChangeset for changed devices', function (done) {
      this.timeout(6000);

      setTimeout(function () {
        deviceDetector.on('newChangeset', function (changeset) {
          assert.equal(changeset.added.length, 0);
          assert.equal(changeset.removed.length, 0);
          assert.equal(changeset.changed.length, 1);
          assert.equal(changeset.changed[0].id, onlineDevice.id);
          assert.equal(changeset.changed[0].status, offlineDevice.status);
          done();
        });
      }, 2000);

      setFullDeviceList();
      setTimeout(setChangedDeviceList, 2000);
    });
  });

  describe('#getChangeset()', function () {
    var testDevice = new Device('testid');
    var emptyDeviceMap = new Map();
    var singleDeviceMap = new Map();
    singleDeviceMap.set(testDevice.id, testDevice);

    it('should return an empty changeset when maps are identical', function () {
      var changeset;
      var emptyChangeset = { added: [], removed: [], changed: [] };

      // empty maps
      changeset = deviceDetector.getChangeset(emptyDeviceMap, emptyDeviceMap);
      assert.deepEqual(changeset, emptyChangeset);

      // one item
      changeset = deviceDetector.getChangeset(singleDeviceMap, singleDeviceMap);
      assert.deepEqual(changeset, emptyChangeset);
    });

    it('should return added devices', function () {
      var expectedChangeset = { added: [testDevice], removed: [], changed: [] };
      var changeset = deviceDetector.getChangeset(emptyDeviceMap, singleDeviceMap);
      assert.deepEqual(changeset, expectedChangeset);
    });

    it('should return removed devices', function () {
      var expectedChangeset = { added: [], removed: [testDevice], changed: [] };
      var changeset = deviceDetector.getChangeset(singleDeviceMap, emptyDeviceMap);
      assert.deepEqual(changeset, expectedChangeset);
    });

    it('should return changed devices', function () {
      var changedTestDevice = new Device('testid');
      changedTestDevice.status = 'online';
      var changedDeviceMap = new Map();
      var expectedChangeset = { added: [], removed: [], changed: [changedTestDevice] };
      changedDeviceMap.set(changedTestDevice.id, changedTestDevice);

      var changeset = deviceDetector.getChangeset(singleDeviceMap, changedDeviceMap);
      assert.deepEqual(changeset, expectedChangeset);
    });
  });

  describe('#getAdbDevices()', function () {
    it('should parse all offline device attributes', function () {
      // mock offline device
      deviceDetector.getRawDeviceList = function () {
        return 'List of devices attached\n' +
          offlineDevice.id + '         unauthorized\n\n';
      };

      var deviceMap = deviceDetector.getAdbDevices();
      var expectedDeviceMap = new Map();
      expectedDeviceMap.set(offlineDevice.id, offlineDevice);
      assert.deepEqual(deviceMap, expectedDeviceMap);
    });

    it('should parse all online device attributes', function () {
      var id = 'some-id';
      var product = 'some-product';
      var model = 'some-model';
      var device = 'some-device';

      // mock online device
      deviceDetector.getRawDeviceList = function () {
        return 'List of devices attached\n' +
          id + '         device ' +
          'product:' + product + ' ' +
          'model:' + model + ' ' +
          'device:' + device + ' ' +
          '\n\n';
      };

      var deviceMap = deviceDetector.getAdbDevices();
      var deviceObj = new Device(id);
      deviceObj.product = product;
      deviceObj.model = model;
      deviceObj.device = device;
      var expectedDeviceMap = new Map();
      expectedDeviceMap.set(id, deviceObj);
      assert.deepEqual(deviceMap, expectedDeviceMap);
    });
  });
});
