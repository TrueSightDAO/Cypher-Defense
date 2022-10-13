require "../../fixtures/env_stubs"
the_imports = require "../../../../js/background/controllers/krecommended_columns_controller"

KRecommendedColumnsController = the_imports.KRecommendedColumnsController

KRecommendedColumn = the_imports.KRecommendedColumn
KRecommendedColumnSelected = the_imports.KRecommendedColumnSelected
KPage = the_imports.KPage
KTab = the_imports.KTab

describe "KRecommendedColumnsController", ->

  beforeEach ->
    KRecommendedColumn.reset()  
    KRecommendedColumnSelected.reset()
    KPage.reset()

    @page_url       = "http://google.com"
    @tab_id         = 10
    @parent_url     = "http://google.com"
    @parent_col_id  = 11111
    @page_title     = "what to do"
    @tab_obj        =
      id: @tab_id

  describe "read", ->
    it "returns no recommended columns when none exist for domain", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      recommended_columns = KRecommendedColumnsController.read({
        page_id: page.id
      }, {})
      expect(recommended_columns.data.length).toEqual 0
      expect(recommended_columns.status).toEqual 'success'


    it "returns recommended columns when one exist for domain", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      krecommended_column_1 = new KRecommendedColumn 22, "article_name", "article a", "ul li", page.domain

      recommended_columns = KRecommendedColumnsController.read({
        page_id: page.id
      }, {})
      expect(recommended_columns.data.length).toEqual 1
      expect(recommended_columns.data[0].id).toEqual 22
      expect(recommended_columns.data[0].page_id).toEqual page.id            
      expect(recommended_columns.status).toEqual 'success'


    it "returns no recommended columns when one exist but not for domain", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      krecommended_column_1 = new KRecommendedColumn 22, "article_name", "article a", "ul li", "some other domain"

      recommended_columns = KRecommendedColumnsController.read({
        page_id: page.id
      }, {})
      expect(recommended_columns.data.length).toEqual 0
      expect(recommended_columns.status).toEqual 'success'


    it "returns recommended columns when one has been selected for page", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      krc_1 = new KRecommendedColumn 22, "article_name", "article a", "ul li", page.domain
      krcs_1 = new KRecommendedColumnSelected krc_1.id, @tab_id, page.id, krc_1.col_name

      recommended_columns = KRecommendedColumnsController.read({
        page_id: page.id
      }, {})
      expect(recommended_columns.data.length).toEqual 1
      expect(recommended_columns.data[0].page_id).toEqual page.id
      expect(recommended_columns.data[0].id).toEqual krc_1.id
      expect(recommended_columns.data[0].selected).toEqual true
      expect(recommended_columns.data[0].default_col_name).toEqual "article_name"
      expect(recommended_columns.data[0].col_name).toEqual "article_name"      
      expect(recommended_columns.status).toEqual 'success'

    it "returns recommended columns when one has been selected for page but with another name", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      krc_1 = new KRecommendedColumn 22, "article_name", "article a", "ul li", page.domain
      krcs_1 = new KRecommendedColumnSelected krc_1.id, @tab_id, page.id, "Another name"

      recommended_columns = KRecommendedColumnsController.read({
        page_id: page.id
      }, {})

      expect(recommended_columns.data.length).toEqual 1
      expect(recommended_columns.data[0].page_id).toEqual page.id
      expect(recommended_columns.data[0].id).toEqual krc_1.id
      expect(recommended_columns.data[0].selected).toEqual true
      expect(recommended_columns.data[0].default_col_name).toEqual "article_name"      
      expect(recommended_columns.data[0].col_name).toEqual "Another name"
      expect(recommended_columns.status).toEqual 'success'


  describe "update", ->
    it "creates a new recommended column selected object", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      krc_1 = new KRecommendedColumn 22, "article_name", "article a", "ul li", page.domain      

      recommended_column = KRecommendedColumnsController.update({
        id:       krc_1.id
        selected: true
        page_id:  page.id
        col_name: "Some new recommendations"
      }, @tab_obj).data

      expect(recommended_column.selected).toEqual true
      expect(recommended_column.id).toEqual krc_1.id
      expect(recommended_column.default_col_name).toEqual krc_1.default_col_name
      expect(recommended_column.col_name).toEqual "Some new recommendations"
      
      expect(KRecommendedColumnSelected.instances.length).toEqual 1
      expect(KRecommendedColumnSelected.instances[0].page_id).toEqual page.id
      expect(KRecommendedColumnSelected.instances[0].recommendation_id).toEqual krc_1.id


    it "destroy a recommended_column_selected object", ->
      page = new KPage @page_url, @tab_id, @parent_url, @parent_col_id, @page_title
      krc_1 = new KRecommendedColumn 22, "article_name", "article a", "ul li", page.domain            
      krcs_1 = new KRecommendedColumnSelected krc_1.id, @tab_id, page.id, "Another name"      

      recommended_column = KRecommendedColumnsController.update({
        id:       krc_1.id
        selected: false
        page_id:  page.id
      }, @tab_obj).data

      expect(recommended_column.selected).toEqual false
      expect(recommended_column.id).toEqual krc_1.id
      expect(recommended_column.default_col_name).toEqual krc_1.col_name
      expect(recommended_column.col_name).toEqual  krc_1.col_name
      
      expect(KRecommendedColumnSelected.instances.length).toEqual 0