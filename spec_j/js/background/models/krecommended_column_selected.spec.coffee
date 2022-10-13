KRecommendedColumnSelected = require "../../../../js/background/models/krecommended_column_selected"

describe "KRecommendedColumnSelected", ->

  beforeEach ->
    KRecommendedColumnSelected.reset()  

  describe "find", -> 


    it "returns matching records", ->
      recommendation_id = 1
      tab_id = 1
      page_id = 2
      col_name = "This is a col name"
      krcs_1 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name
      krcs_2 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name
      results = KRecommendedColumnSelected.find 
        page_id: page_id

      expect(results.length).toEqual 1
      expect(results[0].col_name).toEqual col_name

    it "does not return records that don't match", ->
      recommendation_id = 1
      tab_id = 1
      page_id = 2
      col_name = "This is a col name"
      krcs_1 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name
      krcs_2 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name
      results = KRecommendedColumnSelected.find 
        page_id: 33

      expect(results.length).toEqual 0


  describe "set", ->

    it "sets a record to the instances array", ->
      recommendation_id = 1
      tab_id = 1
      page_id = 2
      col_name = "This is a col name"
      krcs_1 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name
      krcs_2 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name
      
      expect(KRecommendedColumnSelected.instances.length).toEqual 1


    it "adds another record to the instances array", ->
      recommendation_id = 1
      tab_id = 1
      page_id = 2
      col_name = "This is a col name"
      krcs_1 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name

      recommendation_id = 2
      tab_id = 1
      page_id = 2
      col_name = "This is a col name"      
      krcs_2 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name
      
      expect(KRecommendedColumnSelected.instances.length).toEqual 2


    it "overrides an record in the instances array", ->
      recommendation_id = 1
      tab_id = 1
      page_id = 2
      col_name = "This is a col name"

      krcs_1 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name

      col_name = "article_name fresh"
      krcs_2 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name
      
      expect(KRecommendedColumnSelected.instances.length).toEqual 1
      expect(KRecommendedColumnSelected.instances[0].col_name).toEqual "article_name fresh"


  describe "delete", ->
    it "deletes a matching record in the instances array", ->
      recommendation_id = 1
      tab_id = 1
      page_id = 2
      col_name = "This is a col name"

      krcs_1 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name

      KRecommendedColumnSelected.delete(krcs_1.id)

      expect(KRecommendedColumnSelected.instances.length).toEqual 0

    it "does not delete a matching record in the instances array", ->
      recommendation_id = 1
      tab_id = 1
      page_id = 2
      col_name = "This is a col name"

      krcs_1 = new KRecommendedColumnSelected recommendation_id, tab_id, page_id, col_name

      KRecommendedColumnSelected.delete(2)

      expect(KRecommendedColumnSelected.instances.length).toEqual 1