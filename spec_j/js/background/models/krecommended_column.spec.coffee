KRecommendedColumn = require "../../../../js/background/models/krecommended_column"

describe "KRecommendedColumn", ->

  beforeEach ->
    KRecommendedColumn.reset()


  describe "set", ->
    it "sets a record to the instances array", ->
      krecommended_column_1 = new KRecommendedColumn 1, "article_name", "article a", "ul li", "news.ycombinator"
      krecommended_column_2 = new KRecommendedColumn 1, "article_name", "article a", "ul li", "news.ycombinator"
      
      expect(KRecommendedColumn.instances.length).toEqual 1

    it "overrides an record in the instances array", ->
      krecommended_column_1 = new KRecommendedColumn 1, "article_name", "article a", "ul li", "news.ycombinator"
      krecommended_column_2 = new KRecommendedColumn 1, "article_name fresh", "article a", "ul li", "news.ycombinator"
      
      expect(KRecommendedColumn.instances.length).toEqual 1
      expect(KRecommendedColumn.instances[0].col_name).toEqual "article_name fresh"


  describe "find", ->
    it "returns records based on domain name", -> 
      krecommended_column_1 = new KRecommendedColumn 1, "article_name", "article a", "ul li", "news.ycombinator"
      krecommended_column_2 = new KRecommendedColumn 2, "article_name fresh", "article a", "ul li", "news.ycombinator"
      krecommended_column_3 = new KRecommendedColumn 3, "article_name fresh", "article a", "ul li", "not.news.ycombinator"
      results = KRecommendedColumn.find {
        domain_name: "news.ycombinator"
      }
      expect(results.length).toEqual 2
      expect(results[0].domain_name).toEqual "news.ycombinator"
      expect(results[1].domain_name).toEqual "news.ycombinator"
      
    it "returns records based on recommendation_id", -> 
      krecommended_column_1 = new KRecommendedColumn 1, "article_name", "article a", "ul li", "news.ycombinator"
      krecommended_column_2 = new KRecommendedColumn 2, "article_name fresh", "article a", "ul li", "news.ycombinator"
      krecommended_column_2 = new KRecommendedColumn 3, "article_name fresh", "article a", "ul li", "not.news.ycombinator"
      results = KRecommendedColumn.find {
        recommendation_id: 1
      }
      expect(results.length).toEqual 1
      expect(results[0].recommendation_id).toEqual 1
