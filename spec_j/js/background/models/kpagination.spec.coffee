KPagination = require "../../../../js/background/models/kpagination"

describe "KPagination", ->

  beforeEach ->
    KPagination.reset()
    @page_id        = 1
    @page_url       = "http://google.com"
    @tab_id         = 10
    @parent_url     = "http://google.com"
    @parent_col_id  = 11111
    @page_title     = "what to do"

  describe "setPagination", ->
    it "should return true when given dom_array with anchor element in lineage", ->
      pagin1 = new KPagination @page_id
      setting_res = pagin1.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          position: 2
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "span"
          class: ".prop-img"
      }]
      expect(setting_res).toEqual true
      expect(pagin1.dom_array).toEqual [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          position: 2
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
      }]

    it "should return false when given dom_array with no anchor element", ->
      pagin1 = new KPagination @page_id
      setting_res = pagin1.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          position: 2
          class: ".contact-info"
        },{
          el: "b"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "span"
          class: ".prop-img"
      }]
      expect(setting_res).toEqual false
      expect(pagin1.dom_array).toEqual []

  describe "isSet", ->
    it "should return true when set", ->
      pagin1 = new KPagination @page_id
      setting_res = pagin1.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          position: 2
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "span"
          class: ".prop-img"
      }]
      expect(setting_res).toEqual true
      expect(pagin1.isSet()).toEqual true

    it "should return false when not set", ->
      pagin1 = new KPagination @page_id
      expect(pagin1.isSet()).toEqual false

  describe "domQuery", ->
    it "should return well defined dom_query", ->
      pagin1 = new KPagination @page_id
      setting_res = pagin1.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          position: 2
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
          contains: "next page"
        },{
          el: "span"
          class: ".street"
        },{
          el: "span"
          class: ".prop-img"
      }]
      expect(setting_res).toEqual true      
      expect(pagin1.domQuery()).toEqual "td.row#clementi div:nth-child(2).contact-info a.address:contains('next page')"


  describe "toParams", ->
    it "should return well formated pagination object", ->
      pagin1 = new KPagination @page_id
      setting_res = pagin1.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          position: 2
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
          contains: "next page"
        },{
          el: "span"
          class: ".street"
        },{
          el: "span"
          class: ".prop-img"
      }]
      expect(setting_res).toEqual true      
      expect(pagin1.toParams()).toEqual {
        dom_query: "td.row#clementi div:nth-child(2).contact-info a.address:contains('next page')"
        click : true   
      }