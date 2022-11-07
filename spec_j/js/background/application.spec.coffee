require "../fixtures/env_stubs"
ApplicationVar  = require "../../../js/background/application"
Application     = ApplicationVar.Application
KTab            = ApplicationVar.KTab
BrowserIconView = ApplicationVar.BrowserIconView
CONFIG          = ApplicationVar.CONFIG

describe "Application", ->
  beforeEach ->
    KTab.reset()
    spyOn(BrowserIconView, "activate")
    spyOn(BrowserIconView, "deactivate")
    @tab_id = 10    

  describe "msgEvent", ->
    it "should call mixpanel controller", (done)->
      spyOn(Application.msg_controllers["mixpanel"], "getId").andReturn({ data: "STUBBING", status: "success" })
      Application.msgEvent {
        controller: "mixpanel", 
        method: "getId",
        args_array: ["arg1", "arg2", "arg3"]
      }, {}, (res)=>
        expect(res.data).toEqual "STUBBING"
        expect(Application.msg_controllers["mixpanel"].getId).toHaveBeenCalledWith("arg1", "arg2", "arg3")
        done()

  describe "iconEvent", ->

    it "should deactivate ", ->
      kwin = new KTab @tab_id
      kwin.activate()
      Application.iconEvent { id: @tab_id }
      kwin = new KTab @tab_id  
      expect(BrowserIconView.deactivate).toHaveBeenCalled()
      expect(kwin.isActive()).toBe false

    it "should activate ", ->
      Application.iconEvent { id: @tab_id }
      kwin = new KTab @tab_id
      expect(BrowserIconView.blacklisted).toHaveBeenCalled()
      expect(kwin.isActive()).toBe true

  describe "tabEvent", ->

    it "should deactivate", ->
      kwin = new KTab @tab_id  
      kwin.activate()
      Application.tabEvent { tabId: @tab_id }
      expect(BrowserIconView.blacklisted).toHaveBeenCalled()

    it "should activate", ->
      Application.tabEvent { tabId: @tab_id }
      expect(BrowserIconView.deactivate).toHaveBeenCalled()

  describe "refreshEvent", ->

    it "should deactivate", ->
      kwin = new KTab @tab_id  
      kwin.activate()
      Application.refreshEvent {}, {}, { id: @tab_id }
      expect(BrowserIconView.blacklisted).toHaveBeenCalled()

    it "should activate", ->
      Application.refreshEvent {}, {}, { id: @tab_id }
      expect(BrowserIconView.deactivate).toHaveBeenCalled()    