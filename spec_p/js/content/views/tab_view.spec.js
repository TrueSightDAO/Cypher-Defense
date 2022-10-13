describe("TabView", function() {
  var self = this;

  new AsyncSpec(self).beforeEach(function(done){
    self.tab_view = new TabView();
    self.tab_view.tab = new Tab();
    self.tab_view.tab.set("id", 10)

    self.tab_view.page = new Page();
    self.tab_view.page.set("id", 100)
    done();
  });

  it("should instantiate", function() {
    expect(self.tab_view).not.toBe(null);      
  });

  describe("tabId", function() {
    it("should return valid TabId", function() {
      expect(self.tab_view.tabId()).toEqual(10);
    });
  });  

  describe("pageId", function() {
    it("should return valid PageId", function() {
      expect(self.tab_view.pageId()).toEqual(100);
    });
  });

  describe("activate", function() {
  
    it("should instantiate sidebar", function() {
      spyOn(self.tab_view, "render");
      self.tab_view.activate();
      expect(self.tab_view.render).toHaveBeenCalled();
    })
  });

});