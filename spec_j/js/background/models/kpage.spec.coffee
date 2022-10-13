KPageVar      = require "../../../../js/background/models/kpage"
KPage         = KPageVar.KPage
KColumn       = KPageVar.KColumn
KCookie       = KPageVar.KCookie
KPagination   = KPageVar.KPagination

describe "KPage", ->

  beforeEach ->
    KPage.reset()
    KColumn.reset()
    KCookie.reset()
    KPagination.reset()
    @page_url       = "http://google.com"
    @tab_id      = 10
    @parent_url     = "http://google.com"
    @parent_col_id  = 11111
    @page_title     = "what to do"

  describe "Constructor", ->

    it "should only create page instance once for each url loaded in a window", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      expect(KPage.instances.length).toEqual 1
      expect(KPage.instances[0].tab_id).toEqual @tab_id
      expect(KPage.instances[0].origin_url).toEqual @page_url      

    it "should only create page instance once for each url loaded in a window", ->
      page1 = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      page2 = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      expect(KPage.instances.length).toEqual 1

  describe "find", ->
    it "should find page instance by parent_url", ->
      page1 = new KPage @page_url + "page1", @tab_id, @parent_url, @parent_col_id, @page_title
      page2 = new KPage @page_url + "page2", @tab_id, @parent_url, @parent_col_id + 1, @page_title
      expect(KPage.find({ parent_url: @parent_url}).length).toEqual 2

    it "should find page instance by parent_col_id", ->
      page1 = new KPage @page_url + "page1", @tab_id, @parent_url, @parent_col_id, @page_title
      page2 = new KPage @page_url + "page2", @tab_id, @parent_url, @parent_col_id + 1, @page_title
      expect(KPage.find({ parent_column_id: @parent_col_id}).length).toEqual 1
      expect(KPage.find({ parent_column_id: @parent_col_id})[0].origin_url).toEqual @page_url + "page1"

    it "should find page instance by parent_col_id and parent_url", ->
      page1 = new KPage @page_url + "page1", @tab_id, @parent_url, @parent_col_id, @page_title
      page2 = new KPage @page_url + "page2", @tab_id, @parent_url, @parent_col_id + 1, @page_title
      expect(KPage.find({ parent_column_id: @parent_col_id, parent_url: @parent_url }).length).toEqual 1
      expect(KPage.find({ parent_column_id: @parent_col_id})[0].origin_url).toEqual @page_url + "page1"

    it "should find page instance by parent_col_id, parent_url and tab_id", ->
      page1 = new KPage @page_url + "page1", @tab_id, @parent_url, @parent_col_id, @page_title
      page2 = new KPage @page_url + "page2", @tab_id, @parent_url, @parent_col_id + 1, @page_title
      page3 = new KPage @page_url + "page3", @tab_id, @parent_url, @parent_col_id + 2, @page_title
      expect(KPage.find({ parent_column_id: @parent_col_id, parent_url: @parent_url, tab_id: @tab_id }).length).toEqual 1
      expect(KPage.find({ parent_column_id: @parent_col_id})[0].origin_url).toEqual @page_url + "page1"

  describe "hasParent", ->

    it "should have parent", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      expect(page.hasParent()).toEqual true

    it "should not have parent when parent url is null", ->
      page = new KPage @page_url, @tab_id, null, null, @page_title
      expect(page.hasParent()).toEqual false

    it "should not have parent when parent url is undefined", ->
      page = new KPage @page_url, @tab_id, undefined, undefined, @page_title
      expect(page.hasParent()).toEqual false

    it "should not have parent when parent url is false", ->
      page = new KPage @page_url, @tab_id, false, false, @page_title
      expect(page.hasParent()).toEqual false

  describe "parent", ->
    it "should return its parent", ->
      page1 = new KPage @page_url, @tab_id, null, null, @page_title
      page2 = new KPage "Somewhere over the rainbow", @tab_id, @page_url, @parent_col_id, @page_title      
      expect(page2.parent()).toEqual page1

  describe "root", ->
    it "should return earliest ancestor", ->
      page1 = new KPage @page_url, @tab_id, null, null, @page_title
      page2 = new KPage "sub1", @tab_id, @page_url, @parent_col_id, @page_title
      page3 = new KPage "sub2", @tab_id, "sub1", @parent_col_id, @page_title
      page4 = new KPage "sub3", @tab_id, "sub2", @parent_col_id, @page_title
      expect(page4.root()).toEqual page1

  describe "children", ->
    it "should return its direct children", ->
      page1 = new KPage @page_url, @tab_id, null, null, @page_title
      page2 = new KPage "sub1", @tab_id, @page_url, @parent_col_id, @page_title
      page3 = new KPage "sub2", @tab_id, @page_url, @parent_col_id, @page_title
      page4 = new KPage "sub3", @tab_id, @page_url, @parent_col_id, @page_title
      expect(page1.children().length).toEqual 3

  describe "newKColumn", ->
    it "should create a column with a generated id", ->
      page1 = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      page2 = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      col = page2.newKColumn()
      expect(col.page_id).toEqual page2.id
      expect(col.id).toEqual 1

      col2 = page2.newKColumn()
      expect(col2.page_id).toEqual page2.id
      expect(col2.id).toEqual 2

      col3 = page1.newKColumn()
      expect(col3.page_id).toEqual page1.id
      expect(col3.id).toEqual 3

  describe "columns", ->
    it "should return kcolumns belonging to page only", ->
      page1 = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      col = page1.newKColumn()
      col2 = page1.newKColumn()
      expect(page1.kcolumns().length).toEqual 2
      expect(
        page1
          .kcolumns()
          .map( (column)=>
            column.id;
          ).sort()
      ).toEqual [col.id, col2.id];

      page2 = new KPage "Second page", @tab_id, @parent_url, @parent_col_id, @page_title
      col3 = page2.newKColumn()
      expect(page2.kcolumns().length).toEqual 1
      expect(page2.kcolumns()[0].id).toEqual col3.id

  describe "toParams", ->
    it "should return well formed partial for columns with no nesting", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      col1  = new KColumn page.id
      col2  = new KColumn page.id

      col1.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "p"
          position: 2
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "b"
          class: ".prop-img"
        }]
      
      col2.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        }]
      expect(page.toParams()).toEqual { 
        engine: "chrome"
        client_version : "test version"
        columns: [{ 
            col_name:   'Column 1',
            dom_query:  'td.row#clementi p:nth-child(2).contact-info a.address span.street b.prop-img' 
          }, {
            col_name:   'Column 2',
            dom_query:  'td.row#clementi' 
          }]
        cookies: []
      }

    it "should return well formed partial for columns with pagination", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      col1  = new KColumn page.id
      col1.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "p"
          position: 2
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "b"
          class: ".prop-img"
        }]
      
      pagination1 = new KPagination page.id
      pagination1.set [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "p"
          position: 2
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        }]

      expect(page.toParams()).toEqual { 
        engine: "chrome"
        client_version : "test version"
        columns: [{ 
            col_name:   'Column 1',
            dom_query:  'td.row#clementi p:nth-child(2).contact-info a.address span.street b.prop-img' 
          }],
        next_page: 
          dom_query: 'td.row#clementi p:nth-child(2).contact-info a.address'
          click: true
        cookies: []
      }

    describe "1 level columns nesting", ->
      it "should return well formed partial for columns with 1 level nesting", ->
        page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
        col1  = new KColumn page.id
        col1.set [{
            el: "td"
            class: ".row"
            id: "#col1"
          }]
        
        sub_page_l1 = new KPage @page_url + "sub1", @tab_id, @page_url, col1.id, @page_title
        col2  = new KColumn sub_page_l1.id
        col2.set [{
            el: "td"
            class: ".row"
            id: "#col2"
          }]        

        expect(page.toParams()).toEqual { 
          engine: "chrome"
          client_version : "test version"
          columns: [{ 
            col_name:   'Column 1',
            dom_query:  'td.row#col1' 
            options: 
              engine: "chrome"
              client_version : 'test version'
              origin_url : 'http://google.comsub1'
              columns: [{
                col_name:   'Column 1',
                dom_query:  'td.row#col2' 
              }]
              cookies: []
          }]
          cookies: []
        }

      it "should return well formed partial for columns with 1 level nesting and pagination", ->
        page    = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
        kpage1  = new KPagination page.id
        kpage1.set [{
            el: "a"
            class: ".next1"
          }]

        col1    = new KColumn page.id
        col1.set [{
            el: "td"
            class: ".row"
            id: "#col1"
          }]


        
        sub_page_l1 = new KPage @page_url + "sub1", @tab_id, @page_url, col1.id, @page_title
        col2        = new KColumn sub_page_l1.id
        col2.set [{
            el: "td"
            class: ".row"
            id: "#col2"
          }]
        kpage2  = new KPagination sub_page_l1.id
        kpage2.set [{
            el: "a"
            class: ".next2"
          }]

        expect(page.toParams()).toEqual { 
          engine: "chrome"
          client_version : "test version"
          columns: [{ 
            col_name:   'Column 1'
            dom_query:  'td.row#col1' 
            options: 
              engine: "chrome"
              client_version : 'test version'
              origin_url : 'http://google.comsub1'
              columns: [{
                col_name:   'Column 1',
                dom_query:  'td.row#col2'
              }]
              next_page:
                dom_query : "a.next2"
                click: true
              cookies: []
          }]
          next_page:
            dom_query : "a.next1"
            click: true
          cookies: []
        }   

    describe "2 level columns nesting", ->
      it "should return well formed partial for columns with 2 level nesting", ->
        page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
        col1  = new KColumn page.id
        col1.set [{
            el: "td"
            class: ".row"
            id: "#col1"
          }]
        
        sub_page_l1 = new KPage @page_url + "sub1", @tab_id, @page_url, col1.id, @page_title
        col2  = new KColumn sub_page_l1.id
        col2.set [{
            el: "td"
            class: ".row"
            id: "#col2"
          }]

        sub_page_l2 = new KPage @page_url + "sub2", @tab_id, @page_url + "sub1", col2.id, @page_title
        col3  = new KColumn sub_page_l2.id
        col3.set [{
            el: "td"
            class: ".row"
            id: "#col3"
          }]

        expect(page.toParams()).toEqual { 
          engine: "chrome"
          client_version : "test version"
          columns: [{ 
            col_name:   'Column 1',
            dom_query:  'td.row#col1' 
            options: 
              engine: "chrome"
              client_version : 'test version'
              origin_url : 'http://google.comsub1'
              columns: [{
                col_name:   'Column 1',
                dom_query:  'td.row#col2'
                options: 
                  engine: "chrome"
                  client_version : 'test version'
                  origin_url : 'http://google.comsub2'
                  columns: [{
                    col_name:   'Column 1',
                    dom_query:  'td.row#col3' 
                  }]
                  cookies: []
              }]
              cookies: []
          }]
          cookies: []
        }        

      it "should return well formed partial for columns with 2 level nesting and pagination", ->
        page    = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
        kpage1  = new KPagination page.id
        kpage1.set [{
            el: "a"
            class: ".next1"
          }]

        col1    = new KColumn page.id
        col1.set [{
            el: "td"
            class: ".row"
            id: "#col1"
          }]


        
        sub_page_l1 = new KPage @page_url + "sub1", @tab_id, @page_url, col1.id, @page_title
        col2        = new KColumn sub_page_l1.id
        col2.set [{
            el: "td"
            class: ".row"
            id: "#col2"
          }]
        kpage2  = new KPagination sub_page_l1.id
        kpage2.set [{
            el: "a"
            class: ".next2"
          }]



        sub_page_l2 = new KPage @page_url + "sub2", @tab_id, @page_url + "sub1", col2.id, @page_title
        col3  = new KColumn sub_page_l2.id
        col3.set [{
            el: "td"
            class: ".row"
            id: "#col3"
          }] 
        kpage3  = new KPagination sub_page_l2.id
        kpage3.set [{
            el: "a"
            class: ".next3"
          }]         

        expect(page.toParams()).toEqual { 
          engine: "chrome"
          client_version : "test version"
          columns: [{ 
            col_name:   'Column 1',
            dom_query:  'td.row#col1' 
            options: 
              engine: "chrome"
              client_version : 'test version'
              origin_url : 'http://google.comsub1'
              columns: [{
                col_name:   'Column 1'
                dom_query:  'td.row#col2'
                options:
                  engine: "chrome"
                  client_version : 'test version'
                  origin_url : 'http://google.comsub2'
                  columns: [{
                    col_name:   'Column 1'
                    dom_query:  'td.row#col3'
                  }]
                  next_page:
                    dom_query : "a.next3"
                    click: true
                  cookies: []
              }]
              next_page:
                dom_query : "a.next2"
                click: true
              cookies: []
          }]
          next_page:
            dom_query : "a.next1"
            click: true
          cookies: []
        }   

  describe "kcolumnsToParams", ->
    it "should have return well formed params", ->
      page    = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      col1    = new KColumn page.id
      col1.set [{
          el: "td"
          class: ".row"
          id: "#col1"
        }]
      expect(page.kcolumnsToParams()).toEqual [{
          col_name: "Column 1"
          dom_query: "td.row#col1"
        }]

  describe "kcolumnsIsSet", ->
    it "should have columns set", ->
      page    = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      col1    = new KColumn page.id
      col1.set [{
          el: "td"
          class: ".row"
          id: "#col1"
        }]
      expect(page.kcolumnsIsSet()).toBe true