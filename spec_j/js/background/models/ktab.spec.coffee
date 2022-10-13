require "../../fixtures/env_stubs"
KTab    = require "../../../../js/background/models/ktab"

describe "KTab", ->
  beforeEach ->
    @tab_id = 10
    KTab.reset()

  describe "Constructor", ->
    it "should create only one instance", ->
      kwin1 = new KTab @tab_id
      kwin2 = new KTab @tab_id
      expect(KTab.instances.length).toEqual 1

  describe "isActive", ->
    it "should be active if set once", ->
      kwin1 = new KTab @tab_id
      kwin1.activate()
      kwin2 = new KTab @tab_id
      expect(kwin2.isActive()).toBe true

  describe "find", ->
    it "should return ktab", ->
      kwin1 = new KTab @tab_id
      kwin1.activate()
      kwins = KTab.find({ id: @tab_id });
      expect(kwins.length).toEqual 1
      expect(kwins[0].isActive()).toBe true

  describe "activate", ->
    it "should be emit activate event", ->
      spyOn(Env, "sendMessage")
      kwin1 = new KTab @tab_id
      kwin1.activate()
      expect(Env.sendMessage).toHaveBeenCalled()

  describe "deactivate", ->
    it "should be emit activate event", ->
      spyOn(Env, "sendMessage")
      kwin1 = new KTab @tab_id
      kwin1.deactivate()
      expect(Env.sendMessage).toHaveBeenCalled()