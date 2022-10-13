require "../../fixtures/env_stubs"
MixPanelController = require "../../../../js/background/controllers/mix_panel_controller"

describe "MixPanelController", ->
  beforeEach ->
    @mxpc = new MixPanelController("SOME_MX_KEY", "SOME_CHROME_VERSION")

  describe "setId", ->
    it "should setId", ->
      @mxpc.setId()
      @mxpc.xhr.responseText = '{"muuid": "STUBBING"}'
      @mxpc.xhr.readyState = 4      
      @mxpc.xhr.onreadystatechange()
      expect(@mxpc.getId()).toEqual {
        status: "success",
        data: "STUBBING"
      }
      
