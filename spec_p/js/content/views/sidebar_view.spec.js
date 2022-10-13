describe("SideBarView", function() {
  var self = this;
  beforeEach(function() {
    self.tab_id   = 10;
    self.page_id  = 100;
    self.tab_view = new TabView();

    self.tab_view.tab = new Tab();
    self.tab_view.tab.set("id", self.tab_id);

    self.tab_view.page = new Page();
    self.tab_view.page.set("id", self.page_id);

    self.sidebar_view = new SideBarView({
      parent_tab: self.tab_view
    });

    self.pagination_view = new PaginationView({
      parent_view: self.sidebar_view
    });
    self.sidebar_view.paginationView = self.pagination_view;

  });

  it("should instantiate", function() {
    expect(self.sidebar_view).not.toBe(null);
  });

  describe("currentPageHasColumns", function() {

    it("should return true", function() {
      var col_model = new Column();
      col_model.set("page_id", self.page_id);
      self.sidebar_view.columns.models.push(col_model);
      expect(self.sidebar_view.currentPageHasColumns()).toBe(true);
    });

    it("should return false", function() {
      expect(self.sidebar_view.currentPageHasColumns()).toBe(false);
    });

  });

  describe("addFirstColumn", function() {
    beforeEach(function() {
      spyOn(self.sidebar_view.columns, "newColumn");
    });

    it("should call add new column", function() {
      self.sidebar_view.addFirstColumn();
      expect(self.sidebar_view.columns.newColumn).toHaveBeenCalled();
    });

    it("should call add new column", function() {
      var col_model = new Column();
      col_model.set("page_id", self.page_id);
      self.sidebar_view.columns.models.push(col_model);      
      self.sidebar_view.addFirstColumn();
      expect(self.sidebar_view.columns.newColumn).not.toHaveBeenCalled();
    });

  });

});