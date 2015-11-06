'use strict'

describe 'Factory: chrome', () ->

  # load the service's module
  beforeEach module 'chrome'

  # Mock chrome's chrome module
  runtimeSpy = jasmine.createSpyObj('runtime', ['sendMessage'])
  # We fake the callback callback call here
  runtimeSpy.sendMessage.andCallFake((config, callback) ->
    callback 'some callback string'
  )
  # Put it into window.chrome, since we are not in a
  # chrome extension environment and need to emulate it
  window.chrome = {
    runtime: runtimeSpy
  }

  # instantiate service
  chrome = {}
  beforeEach inject (_Chrome_) ->
    chrome = _Chrome_

  it 'installPackage should create the correct message for backend', () ->
    callback = jasmine.createSpy('callback spy')
    chrome.installPackage(123, callback)

    # sendMessage should receive the correct parameters and callback
    expect(runtimeSpy.sendMessage).toHaveBeenCalledWith({action: 'installPackage', params:{packageId: 123}}, jasmine.any(Function))
    expect(callback).toHaveBeenCalledWith('some callback string')

  it 'getProxmateGlobalStatus should create the correct message for backend', () ->
    callback = jasmine.createSpy('callback spy')
    chrome.getProxmateStatus(callback)

    # sendMessage should receive the correct parameters and callback
    expect(runtimeSpy.sendMessage).toHaveBeenCalledWith({action: 'getProxmateGlobalStatus', params:{}}, jasmine.any(Function))
    expect(callback).toHaveBeenCalledWith('some callback string')

  it 'should create the correct message for activate/deactivate proxmate', ->
    callback = jasmine.createSpy('callback spy')
    chrome.setProxmateStatus(true, callback)

    expect(runtimeSpy.sendMessage).toHaveBeenCalledWith({action: 'setProxmateGlobalStatus', params:{newStatus: true}}, jasmine.any(Function))
    expect(callback).toHaveBeenCalledWith('some callback string')

    callback = jasmine.createSpy('callback spy')
    chrome.setProxmateStatus(false, callback)

    expect(runtimeSpy.sendMessage).toHaveBeenCalledWith({action: 'setProxmateGlobalStatus', params:{newStatus: false}}, jasmine.any(Function))
    expect(callback).toHaveBeenCalledWith('some callback string')

  it 'should create the correct message for getAllPackages', ->
    callback = jasmine.createSpy('callback spy')
    chrome.getInstalledPackages(callback)

    expect(runtimeSpy.sendMessage).toHaveBeenCalledWith({action: 'getInstalledPackages', params:{}}, jasmine.any(Function))
    expect(callback).toHaveBeenCalled()

  it 'should create the correct message for remove package', ->
    callback = jasmine.createSpy('callback spy')
    chrome.removePackage(123, callback)

    expect(runtimeSpy.sendMessage).toHaveBeenCalledWith({action: 'removePackage', params:{packageId: 123}}, jasmine.any(Function))
    expect(callback).toHaveBeenCalled()

  it 'should create the correct message for retrieving donation key', ->
    callback = jasmine.createSpy('callback spy')
    chrome.getDonationkey(callback)

    expect(runtimeSpy.sendMessage).toHaveBeenCalledWith({action: 'getDonationkey', params:{}}, jasmine.any(Function))
    expect(callback).toHaveBeenCalled()

  it 'should create the correct message for setting donation key', ->
    callback = jasmine.createSpy('callback spy')
    chrome.setDonationkey('foo', callback)

    expect(runtimeSpy.sendMessage).toHaveBeenCalledWith({action: 'setDonationkey', params:{donationKey: 'foo'}}, jasmine.any(Function))
    expect(callback).toHaveBeenCalled()
