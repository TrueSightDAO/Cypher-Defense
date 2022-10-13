KPageVar            = require "../../../../js/background/models/kpage"
global.KPage        = KPageVar.KPage
global.KColumn      = KPageVar.KColumn
global.KPagination  = KPageVar.KPagination

describe "KColumn", ->
  beforeEach ->
    KPage.reset()
    KPagination.reset()
    KColumn.reset()
    @page_url       = "http://google.com"
    @tab_id         = 10
    @parent_url     = "http://google.com"
    @parent_col_id  = 11111
    @page_title     = "what to do"

    @page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
    @page_id = @page.id
    KColumn.reset()
    @def_array = [{
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
        el: "img"
        class: ".prop-img"
      }]

    @def_array2 = [{
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
        el: "b"
        class: ".prop-img"
      }]

    @def_array3 = [{
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

  it "should create a new Column with an id", ->
    col = new KColumn @page_id
    expect(col.id).toEqual 1
    expect(KColumn.find().length).toEqual 1

  describe "delete", ->
    it "removes column from records given an id", ->
      col_1 = new KColumn @page_id
      col_2 = new KColumn @page_id
      col_3 = new KColumn @page_id
      expect(KColumn.instances.length).toEqual 3

      KColumn.delete(col_2.id)
      expect(KColumn.instances.length).toEqual 2
      remaining_ids = KColumn.instances.map (kc)=> kc.id
      expect(remaining_ids.indexOf(col_2.id)).toEqual -1

      KColumn.delete(col_1.id)
      expect(KColumn.instances.length).toEqual 1
      remaining_ids = KColumn.instances.map (kc)=> kc.id
      expect(remaining_ids.indexOf(col_1.id)).toEqual -1      

  describe "parentKPage", ->
    beforeEach ->
      @main_page = new KPage "http://some_url", 1, null, null, "my website main"
      @col_1 = new KColumn @main_page.id

      @sub_page = new KPage "http://some_url/category", 1, "http://some_url", @col_1.id, "my sub page"
      @col_2 = new KColumn @sub_page.id

      @detail_page = new KPage "http://some_url/category/detail", 1, "http://some_url/category", @col_2.id, "my detail page"
      @col_3 = new KColumn @detail_page.id

    it "should return parent kcolumn", ->
      expect(@col_1.parentKPage()).toEqual @main_page      
      expect(@col_2.parentKPage()).toEqual @sub_page      
      expect(@col_3.parentKPage()).toEqual @detail_page

  describe "parentKColumn", ->
    beforeEach ->
      @main_page = new KPage "http://some_url", 1, null, null, "my website main"
      @col_1 = new KColumn @main_page.id

      @sub_page = new KPage "http://some_url/category", 1, "http://some_url", @col_1.id, "my sub page"
      @col_2 = new KColumn @sub_page.id

      @detail_page = new KPage "http://some_url/category/detail", 1, "http://some_url/category", @col_2.id, "my detail page"
      @col_3 = new KColumn @detail_page.id

    it "should return parent kcolumn", ->
      expect(@col_3.parentKColumn()).toEqual @col_2
      expect(@col_2.parentKColumn()).toEqual @col_1

  describe "paginationIsSet", ->
    it "should return true for page with pagination", ->
      pagin1 = new KPagination @page_id
      pagin1.set [{
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
      @col = new KColumn @page_id      
      expect(@col.paginationIsSet()).toBe true

    it "should return false for page without pagination", ->
      @col = new KColumn @page_id
      expect(@col.paginationIsSet()).toBe false

  describe "getColorSticks", ->
    beforeEach ->
      @main_page = new KPage "http://some_url", 1, null, null, "my website main"
      @col_1 = new KColumn @main_page.id

      @sub_page = new KPage "http://some_url/category", 1, "http://some_url", @col_1.id, "my sub page"
      @col_2 = new KColumn @sub_page.id

      @detail_page = new KPage "http://some_url/category/detail", 1, "http://some_url/category", @col_2.id, "my detail page"
      @col_3 = new KColumn @detail_page.id

    it "should return color sticks for root", ->
      expect(@col_1.getColorSticks()).toEqual [{ 
        selecting:    'rgba(89, 233, 100, 0.7 )' 
        selected:     'rgba(89, 233, 100, 1 )'
        recommending: 'rgba(89, 233, 100, 0.3 )'
      }]

    it "should return color sticks for second level and root", ->
      expect(@col_2.getColorSticks()).toEqual [{ 
        selecting:    'rgba(89, 233, 100, 0.7 )' 
        selected:     'rgba(89, 233, 100, 1 )'
        recommending: 'rgba(89, 233, 100, 0.3 )'
      },{ 
        selecting:    'rgba(122, 34, 116, 0.7 )'
        selected:     'rgba(122, 34, 116, 1 )'
        recommending: 'rgba(122, 34, 116, 0.3 )' 
      }]

    it "should return color sticks for third level, second level and root", ->
      expect(@col_3.getColorSticks()).toEqual [{ 
        selecting:    'rgba(89, 233, 100, 0.7 )' 
        selected:     'rgba(89, 233, 100, 1 )'
        recommending: 'rgba(89, 233, 100, 0.3 )'
      },{ 
        selecting:    'rgba(122, 34, 116, 0.7 )'
        selected:     'rgba(122, 34, 116, 1 )'
        recommending: 'rgba(122, 34, 116, 0.3 )' 
      },{ 
        selecting:    'rgba(67, 97, 149, 0.7 )', 
        selected:     'rgba(67, 97, 149, 1 )', 
        recommending: 'rgba(67, 97, 149, 0.3 )' 
      }]

  describe "parentKPageUrl", ->
    it "should return url or parent kpage", ->
      col = new KColumn @page_id
      expect(col.parentKPageUrl()).toEqual @page_url

  describe "set", ->
    it "should lowercase the element attribute", ->
      col = new KColumn @page_id
      dom_array = [{
        el: "TD"
        class: ".row"
        id: "#clementi"
      }]
      result = col.set dom_array
      expect(result).toEqual true      
      expect(col.dom_array[0].el).toEqual "td"

    it "should return false if the input is null", ->
      col = new KColumn @page_id
      result = col.set null;
      expect(result).toEqual false
      expect(col.dom_array.length).toEqual 0

    it "should return false if the input is a variable but not an array", ->
      col = new KColumn @page_id
      result = col.set "ccc";
      expect(result).toEqual false
      expect(col.dom_array.length).toEqual 0

  describe "copyDomArray", ->
    it "should return an array if input was valid", ->
      copied_array = KColumn.copyDomArray @def_array
      expect(KColumn.isArray(copied_array)).toBe true
      expect(copied_array.length).toEqual 5

    it "should return an empty array if input is a variable but not an array", ->
      copied_array = KColumn.copyDomArray "c"
      expect(KColumn.isArray(copied_array)).toBe true
      expect(copied_array.length).toEqual 0

    it "should return an empty array if input is null", ->
      copied_array = KColumn.copyDomArray null
      expect(KColumn.isArray(copied_array)).toBe true
      expect(copied_array.length).toEqual 0

  describe "isIdentical", ->
    it "should return true", ->
      copied_array = KColumn.copyDomArray @def_array
      expect(KColumn.isIdentical copied_array, @def_array).toBe true

    it "should return false", ->
      expect(KColumn.isIdentical @def_array2, @def_array).toBe false

  describe "domQuery", ->
    it "should return a well-formed query string", ->
      col = new KColumn @page_id
      col.set @def_array

      expect(col.domQuery()).toEqual "td.row#clementi div:nth-child(2).contact-info a.address span.street img.prop-img"

  describe "recommendations", ->
    beforeEach ->
      @step1_array = [{
        el: "td"
        class: ".row"
        position: 2
        id: "#clementi"
      },{                
        el: "div"
        position: 3
        class: ".contact-info"
      },{
        el: "a"
        position: 4
        class: ".address"
      },{
        el: "span"
        position: 5
        class: ".street"
      },{
        el: "img"
        position: 6
        class: ".prop-img"
      }]

      @step2_array = [{
        el: "td"
        class: ".row"
        position: 2
        id: "#clementi"
      },{                
        el: "div"
        position: 3
        class: ".contact-info"
      },{
        el: "a"
        position: 4
        class: ".address"
      },{
        el: "span"
        position: 5
        class: ".street"
      },{
        el: "img"
        class: ".prop-img"
      }]

      @step3_array = [{
        el: "td"
        class: ".row"
        position: 2
        id: "#clementi"
      },{                
        el: "div"
        position: 3
        class: ".contact-info"
      },{
        el: "a"
        position: 4
        class: ".address"
      },{
        el: "span"
        class: ".street"
      },{
        el: "img"
        class: ".prop-img"
      }]

      @step4_array = [{
        el: "td"
        class: ".row"
        position: 2
        id: "#clementi"
      },{                
        el: "div"
        position: 3
        class: ".contact-info"
      },{
        el: "a"
        class: ".address"
      },{
        el: "span"
        class: ".street"
      },{
        el: "img"
        class: ".prop-img"
      }]

      @step5_array = [{
        el: "td"
        class: ".row"
        position: 2
        id: "#clementi"
      },{                
        el: "div"
        class: ".contact-info"
      },{
        el: "a"
        class: ".address"
      },{
        el: "span"
        class: ".street"
      },{
        el: "img"
        class: ".prop-img"
      }]

      @step6_array = [{
        el: "td"
        class: ".row"
        id: "#clementi"
      },{                
        el: "div"
        class: ".contact-info"
      },{
        el: "a"
        class: ".address"
      },{
        el: "span"
        class: ".street"
      },{
        el: "img"
        class: ".prop-img"
      }]      

    describe "recommendedArray", ->

      it "should return well-formed recommendedArray", ->
        col = new KColumn @page_id
        col.set @step1_array
        expect(col.recommendedArray()).toEqual @step2_array

        col.set @step2_array
        expect(col.recommendedArray()).toEqual @step3_array

        col.set @step3_array
        expect(col.recommendedArray()).toEqual @step4_array

        col.set @step4_array
        expect(col.recommendedArray()).toEqual @step5_array

        col.set @step5_array
        expect(col.recommendedArray()).toEqual @step6_array

        col.set @step6_array
        expect(col.recommendedArray()).toBe null

    describe "recommendedQuery", ->
      it "should return well-formed recommended query", ->
        col = new KColumn @page_id
        col.set @step1_array
        expect(col.recommendedQuery()).toEqual "td:nth-child(2).row#clementi > div:nth-child(3).contact-info > a:nth-child(4).address > span:nth-child(5).street > img.prop-img"

        col.set @step2_array
        expect(col.recommendedQuery()).toEqual "td:nth-child(2).row#clementi > div:nth-child(3).contact-info > a:nth-child(4).address > span.street > img.prop-img"

        col.set @step3_array
        expect(col.recommendedQuery()).toEqual "td:nth-child(2).row#clementi > div:nth-child(3).contact-info > a.address > span.street > img.prop-img"

        col.set @step4_array
        expect(col.recommendedQuery()).toEqual "td:nth-child(2).row#clementi > div.contact-info > a.address > span.street > img.prop-img"

        col.set @step5_array
        expect(col.recommendedQuery()).toEqual "td.row#clementi > div.contact-info > a.address > span.street > img.prop-img"

        col.set @step6_array
        expect(col.recommendedQuery()).toBe null

  describe "hasAnchor", ->

    it "should be true", ->
      col = new KColumn @page_id
      col.set @def_array      
      expect(col.hasAnchor()).toBe true

    it "should be false", ->
      col = new KColumn @page_id
      dom_array = [{
        el: "td"
        class: ".row"
        id: "#clementi"        
      },{                
        el: "div"
        position: 2
        class: ".contact-info"
      }]
      col.set dom_array
      expect(col.hasAnchor()).toBe false

  describe "clone", ->
    it "should return a twin brother", ->
      col = new KColumn @page_id
      col.set @def_array
      col_clone = col.clone()
      expect(col_clone.id == col.id).toBe false
      expect(col_clone.page_id).toEqual col.page_id
      expect(col_clone.dom_array.length).toEqual col.dom_array.length
      expect(col_clone.dom_array[0].el).toEqual "td"
      expect(KColumn.instances.length).toEqual 2

    it "should not update dom_array of col if twin brother's was updated", ->
      col = new KColumn @page_id
      col.set @def_array
      col_clone = col.clone();  
      col_clone.dom_array.push 
        el: "span"
        class: ".row"
        id: "#clementi"

      expect(col_clone.dom_array.length).toEqual col.dom_array.length + 1

    it "should not update object in dom_array of col if twin brother's was updated", ->
      col = new KColumn @page_id
      col.set @def_array
      col_clone = col.clone()
      col_clone.dom_array[0].el = 'body'
      expect(col_clone.dom_array[0].el == col.dom_array[0].el).toBe false
      expect(col.dom_array[0].el).toEqual "td"
        
  describe "pruneToAnchor", ->

    it "should be true", ->
      col = new KColumn @page_id
      col.set @def_array
      expect(col.pruneToAnchor()).toBe true
      expect(col.tailElement().el).toEqual "a"

    it "should be false", ->
      col = new KColumn @page_id
      dom_array = [{
        el: "td"
        class: ".row"
        id: "#clementi"        
      },{                
        el: "div"
        position: 2
        class: ".contact-info"
      }]
      col.set dom_array
      expect(col.pruneToAnchor()).toBe false
      expect(col.tailElement().el).toEqual "div"

  describe "isEmpty", ->
    it "should be false", ->
      col = new KColumn @page_id
      col.set @def_array
      expect(col.isEmpty()).toBe false

    it "should be true", ->
      col = new KColumn @page_id
      dom_array = []
      col.set dom_array
      expect(col.isEmpty()).toBe true

  describe "hasTdTails", ->
    it "returns true when both are tds", ->
      td1 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 2
      },{
        el: "td"
        class: ".col"
        position: 2
      }]

      td2 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 3
      },{          
        el: "td"
        class: ".col"
        position: 2
      }]        
      col = new KColumn @page_id
      col.set td1
      expect(col.hasTdTails(td2)).toEqual true

    it "returns false when the currently set dom is not td", ->
      td1 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 2
      },{
        el: "span"
        class: ".col"
        position: 2
      }]

      td2 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 3
      },{          
        el: "td"
        class: ".col"
        position: 2
      }]        
      col = new KColumn @page_id
      col.set td1
      expect(col.hasTdTails(td2)).toEqual false


    it "returns false when the new dom is not td", ->
      td1 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 2
      },{
        el: "td"
        class: ".col"
        position: 2
      }]

      td2 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 3
      },{          
        el: "span"
        class: ".col"
        position: 2
      }]        
      col = new KColumn @page_id
      col.set td1
      expect(col.hasTdTails(td2)).toEqual false
  
  describe "hasSameLineage", ->
    it "should be true if lineage and type are the same", ->
      col = new KColumn @page_id
      col.set @def_array
      expect(col.hasSameLineage(@def_array)).toEqual true

    it "should be true if lineage is the same but the type is different ", ->
      col = new KColumn @page_id
      col.set @def_array
      expect(col.hasSameLineage(@def_array2)).toEqual true

    it "should be false if lineage length is different", ->
      col = new KColumn @page_id
      col.set @def_array
      new_array = @def_array.slice 1
      expect(col.hasSameLineage(new_array)).toEqual false

    it "should be false if lineage length similar but lineage links are different", ->
      col = new KColumn @page_id
      col.set @def_array
      expect(col.hasSameLineage(@def_array3)).toEqual false

    it "should be false if both definition arrays are insufficiently long", ->
      def1 = [{  el: "body" },{ el: "span" }]
      def2 = [{  el: "body" },{ el: "img" }]
      col = new KColumn @page_id
      col.set def1
      expect(col.hasSameLineage(def2)).toEqual false

    it "should be false if both definition arrays have only one single differing element", ->
      def1 = [{ el: "span" }]
      def2 = [{ el: "img" }]
      col = new KColumn @page_id
      col.set def1
      expect(col.hasSameLineage(def2)).toEqual false

    describe "td", ->
      it "true if tds are from same table, different rows, same column and same class", ->
        td1 = [{
          el: "table"
          position: 1
        },{
          el: "tr"
          position: 2
        },{
          el: "td"
          class: ".col"
          position: 2
        }]

        td2 = [{
          el: "table"
          position: 1
        },{
          el: "tr"
          position: 3
        },{          
          el: "td"
          class: ".col"
          position: 2
        }]        
        col = new KColumn @page_id
        col.set td1
        expect(col.hasSameLineage(td2)).toEqual true

      it "false if tds are from same table, different rows, different column and same class", ->
        td1 = [{
          el: "table"
          position: 1
        },{          
          el: "tr"
          position: 2
        },{          
          el: "td"
          class: ".col"
          position: 2
        }]

        td2 = [{
          el: "table"
          position: 1
        },{          
          el: "tr"
          position: 3
        },{          
          el: "td"
          class: ".col"
          position: 3
        }]        
        col = new KColumn @page_id
        col.set td1
        expect(col.hasSameLineage(td2)).toEqual false

      it "false if tds are from same table, different rows, same column and different class", ->
        td1 = [{
          el: "table"
          position: 1
        },{
          el: "tr"
          position: 2
        },{
          el: "td"
          class: ".col1"
          position: 2
        }]

        td2 = [{
          el: "table"
          position: 1
        },{
          el: "tr"
          position: 3
        },{          
          el: "td"
          class: ".col2"
          position: 2
        }]        
        col = new KColumn @page_id
        col.set td1
        expect(col.hasSameLineage(td2)).toEqual false      

  describe "hasTDWithSameClassAndPosition", ->
    it "true if tds are from same table, different rows, same column and same class", ->
      td1 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 2
      },{
        el: "td"
        class: ".col"
        position: 2
      }]

      td2 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 3
      },{          
        el: "td"
        class: ".col"
        position: 2
      }]        
      col = new KColumn @page_id
      col.set td1
      expect(col.hasTDWithSameClassAndPosition(td2)).toEqual true

    it "false if tds are from same table, different rows, different column and same class", ->
      td1 = [{
        el: "table"
        position: 1
      },{          
        el: "tr"
        position: 2
      },{          
        el: "td"
        class: ".col"
        position: 2
      }]

      td2 = [{
        el: "table"
        position: 1
      },{          
        el: "tr"
        position: 3
      },{          
        el: "td"
        class: ".col"
        position: 3
      }]        
      col = new KColumn @page_id
      col.set td1
      expect(col.hasTDWithSameClassAndPosition(td2)).toEqual false

    it "false if tds are from same table, different rows, same column and different class", ->
      td1 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 2
      },{
        el: "td"
        class: ".col1"
        position: 2
      }]

      td2 = [{
        el: "table"
        position: 1
      },{
        el: "tr"
        position: 3
      },{          
        el: "td"
        class: ".col2"
        position: 2
      }]        
      col = new KColumn @page_id
      col.set td1
      expect(col.hasTDWithSameClassAndPosition(td2)).toEqual false

  describe "hasSameTailType", ->
    it "should be true if lineage and type are the same", ->
      col = new KColumn @page_id
      col.set @def_array
      expect(col.hasSameTailType(@def_array)).toEqual true

    it "should be true if lineage is differnt but type is the same", ->
      col = new KColumn @page_id
      col.set @def_array
      new_dom_array = [{ el: "img" }]
      expect(col.hasSameTailType(new_dom_array)).toEqual true

    it "should be false when the tail types are differents", ->
      col = new KColumn @page_id
      col.set @def_array
      expect(col.hasSameTailType(@def_array2)).toEqual false

    describe "td", ->
      it "true if tds are from same table, different rows, same column and same class", ->
        td1 = [{
          el: "table"
          position: 1
        },{
          el: "tr"
          position: 2
        },{
          el: "td"
          class: ".col"
          position: 2
        }]

        td2 = [{
          el: "table"
          position: 1
        },{
          el: "tr"
          position: 3
        },{          
          el: "td"
          class: ".col"
          position: 2
        }]        
        col = new KColumn @page_id
        col.set td1
        expect(col.hasSameTailType(td2)).toEqual true

      it "false if tds are from same table, different rows, different column and same class", ->
        td1 = [{
          el: "table"
          position: 1
        },{          
          el: "tr"
          position: 2
        },{          
          el: "td"
          class: ".col"
          position: 2
        }]

        td2 = [{
          el: "table"
          position: 1
        },{          
          el: "tr"
          position: 3
        },{          
          el: "td"
          class: ".col"
          position: 3
        }]        
        col = new KColumn @page_id
        col.set td1
        expect(col.hasSameTailType(td2)).toEqual false

      it "false if tds are from same table, different rows, same column and different class", ->
        td1 = [{
          el: "table"
          position: 1
        },{
          el: "tr"
          position: 2
        },{
          el: "td"
          class: ".col1"
          position: 2
        }]

        td2 = [{
          el: "table"
          position: 1
        },{
          el: "tr"
          position: 3
        },{          
          el: "td"
          class: ".col2"
          position: 2
        }]        
        col = new KColumn @page_id
        col.set td1
        expect(col.hasSameTailType(td2)).toEqual false  

  describe "fullLineageMerge", ->

    describe "same tail", ->
      it "should return full merged array with generic position", ->
        def_array1 = [{
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
            el: "img"
            class: ".prop-img"
          }]

        def_array2 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "div"
            position: 3
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        def_array3 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "div"
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        merged_array = KColumn.fullLineageMerge def_array1, def_array2
        expect(KColumn.isIdentical merged_array, def_array3).toBe true

    describe "different tail", ->
      it "should not return full merged array with generic position", ->
        def_array1 = [{
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
            el: "img"
            class: ".prop-img"
          }]

        def_array2 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "div"
            position: 3
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

        def_array3 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "div"
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "*"
            class: ".prop-img"
          }]

        merged_array = KColumn.fullLineageMerge def_array1, def_array2
        expect(KColumn.isIdentical merged_array, def_array3).toBe false


    describe "broken lineage", ->
      it "should return full merged array with generic position", ->
        def_array1 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "div"
            position: 3
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        def_array2 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "p"
            position: 3
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        merged_array = KColumn.fullLineageMerge def_array1, def_array2
        expect(merged_array).toBe false

  describe "partialLineageMerge", ->
    describe "broken lineage", ->
      it "should return full merged array with generic position", ->
        def_array1 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "div"
            position: 3
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        def_array2 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "p"
            position: 3
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        def_array3 = [{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        merged_array = KColumn.partialLineageMerge def_array1, def_array2
        expect(KColumn.isIdentical merged_array, def_array3).toBe true    

    describe "uneven lineage", ->
      it "should return full merged array with generic position", ->
        def_array1 = [{
            el: "td"
            class: ".row"
            id: "#clementi"
          },{                
            el: "div"
            position: 3
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        def_array2 = [{         
            el: "div"
            position: 3
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        def_array3 = [{
            el: "div"
            position: 3
            class: ".contact-info"
          },{
            el: "a"
            class: ".address"
          },{
            el: "span"
            class: ".street"
          },{
            el: "img"
            class: ".prop-img"
          }]

        merged_array = KColumn.partialLineageMerge def_array1, def_array2
        expect(KColumn.isIdentical merged_array, def_array3).toBe true
  
  describe "merge", ->
    it "should merge by setting", ->
      def_array1 = [{
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
          el: "img"
          class: ".prop-img"
        }]

      col = new KColumn @page_id
      expect(col.merge def_array1).toBe true
      expect(KColumn.isIdentical col.dom_array, def_array1).toBe true        

    it "should merge successfully with full lineage and same tail", ->
      def_array1 = [{
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
          el: "img"
          class: ".prop-img"
        }]

      def_array2 = [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          position: 3
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "img"
          class: ".prop-img"
        }]

      def_array3 = [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "img"
          class: ".prop-img"
        }]

      col = new KColumn @page_id
      col.set def_array1
      expect(col.merge def_array2).toBe true
      expect(KColumn.isIdentical col.dom_array, def_array3).toBe true

    it "should merge successfully with full lineage merge and differing tail", ->
      def_array1 = [{
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
          el: "img"
          class: ".prop-img"
        }]

      def_array2 = [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          position: 3
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

      def_array3 = [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "div"
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "*"
          class: ".prop-img"
        }]
      col = new KColumn @page_id
      col.set def_array1
      expect(col.merge def_array2).toBe false
      expect(KColumn.isIdentical col.dom_array, def_array3).toBe false

    it "should merge successfully with partial lineage merge", ->
      def_array1 = [{
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

      def_array2 = [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "td"
          position: 3
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

      def_array3 = [{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "span"
          class: ".prop-img"
        }]
      col = new KColumn @page_id
      col.set def_array1
      expect(col.merge def_array2).toBe true
      expect(KColumn.isIdentical col.dom_array, def_array3).toBe true   

    it "should not merge successfully with non-matching lineage and differing tail", ->
      def_array1 = [{
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

      def_array2 = [{
          el: "td"
          class: ".row"
          id: "#clementi"
        },{                
          el: "td"
          position: 3
          class: ".contact-info"
        },{
          el: "a"
          class: ".address"
        },{
          el: "span"
          class: ".street"
        },{
          el: "img"
          class: ".prop-img"
        }]

      col = new KColumn @page_id
      col.set def_array1
      expect(col.merge def_array2).toBe false

  describe "toParams", ->
    it "should return valid params", ->
      col = new KColumn @page_id
      def_array1 = [{
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
      col.set def_array1
      expect(col.toParams()).toEqual 
        col_name: "Column 1"
        dom_query: 'td.row#clementi div:nth-child(2).contact-info a.address span.street span.prop-img'
      
    it "should return valid params with required_attribute param", ->
      col = new KColumn @page_id
      def_array1 = [{
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
      col.set def_array1
      col.required_attribute = "data"
      expect(col.toParams()).toEqual 
        col_name: "Column 1"
        dom_query: 'td.row#clementi div:nth-child(2).contact-info a.address span.street span.prop-img'
        required_attribute: "data"

  describe "fibonaci", ->
    it "should return sequences accurately", ->
      col = new KColumn @page_id
      expect(col.fibonaci(1)).toEqual 34
      expect(col.fibonaci(2)).toEqual 55
      expect(col.fibonaci(3)).toEqual 89
      expect(col.fibonaci(4)).toEqual 144
      expect(col.fibonaci(5)).toEqual 233

  describe "getColors", ->
    it "should return colors", ->
      col = new KColumn @page_id
      color_hash = col.getColors()
      expect(color_hash.selected).toEqual "rgba(89, 233, 100, 1 )"
      expect(color_hash.selecting).toEqual "rgba(89, 233, 100, 0.7 )"
      expect(color_hash.recommending).toEqual "rgba(89, 233, 100, 0.3 )"

  describe "requiredAttribute", ->
    it "should return a src if selected attribute type is image", ->
      img_array = [{
          el: "span"
          class: ".street"
        },{
          el: "img"
          class: ".prop-img"
        }]      
      col = new KColumn @page_id
      col.set img_array
      expect(col.requiredAttribute()).toEqual "src"

    it "should return a src if selected attribute type is iframe", ->
      img_array = [{
          el: "span"
          class: ".street"
        },{
          el: "iframe"
          class: ".prop-img"
        }]      
      col = new KColumn @page_id
      col.set img_array
      expect(col.requiredAttribute()).toEqual "src"
      
