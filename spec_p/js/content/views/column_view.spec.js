describe("ColumnView", function() {
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

    var col_model_1 = new Column();
    col_model_1.set("page_id", self.page_id);
    col_model_1.set("tab_id", self.tab_id);
    col_model_1.set("colors", {
      selecting:    "#111",
      recommending: "#222",
      selected:     "#333"
    });    
    self.sidebar_view.columns.models.push(col_model_1);

    self.column_view_1 = new ColumnView({
      model: col_model_1,
      parent_view: self.sidebar_view
    });

    var col_model_2 = new Column();
    col_model_2.set("page_id", self.page_id + 1);
    col_model_2.set("tab_id", self.tab_id);
    col_model_2.set("colors", {
      selecting:    "#111",
      recommending: "#222",
      selected:     "#333"
    });

    self.sidebar_view.columns.models.push(col_model_2);

    self.column_view_2 = new ColumnView({
      model: col_model_2,
      parent_view: self.sidebar_view
    });

  });

  it("should instantiate", function() {
    expect(self.column_view_2).not.toBe(null);
  });

  describe("belongsToCurrentPage", function() {

    it("should be true", function() {
      expect(self.column_view_1.belongsToCurrentPage()).toBe(true);
    });

    it("should be false", function() {
      expect(self.column_view_2.belongsToCurrentPage()).toBe(false);
    });

  });


  describe("activate", function() {

    describe("redirect to parent page", function() {
      it("should redirect to parent page of column model", function() {
        spyOn(self.column_view_2, "redirectToParentPage");
        self.column_view_2.activate();
        expect(self.column_view_2.redirectToParentPage).toHaveBeenCalled();
      });

      it("should redirect to parent page of column model", function() {
        spyOn(self.column_view_1, "redirectToParentPage");
        self.column_view_1.activate();
        expect(self.column_view_1.redirectToParentPage).not.toHaveBeenCalled();
      });      
    });


  });

  describe("deactivate", function() {

  });

  describe("destroy", function() {

  });

  describe("getState", function() {
    it("not_page", function() {
      expect(self.column_view_2.getState()).toEqual(
        self.column_view_2.states.not_page
      );
    });

    it("fresh", function() {
      expect(self.column_view_1.getState()).toEqual(
        self.column_view_1.states.fresh
      );      
    });

    it("recommends", function() {
      self.column_view_1.model.set("dom_array", [{
        el: "div",
        position: 1
      }]);

      self.column_view_1.model.set("recommended_array", [{
        el: "div"
      }]);

      expect(self.column_view_1.getState()).toEqual(
        self.column_view_1.states.recommends
      );
    });

    it("fixed", function() {
      self.column_view_1.model.set("dom_array", [{
        el: "div"
      }]);

      expect(self.column_view_1.getState()).toEqual(
        self.column_view_1.states.fixed
      );
    });
  });

  describe("belongsToCurrentPage", function() {

    it("is true", function() {
      expect(self.column_view_1.belongsToCurrentPage()).toBe(true);
    });

    it("is false", function() {
      expect(self.column_view_2.belongsToCurrentPage()).toBe(false);
    });

  });

  describe("redirectToParentPage", function() {
    it("calls Env.redirect", function() {
      spyOn(Env, "redirect");
      var page_url = "http://google.com";
      self.column_view_1.model.set("page_url", page_url);
      self.column_view_1.redirectToParentPage();
      expect(Env.redirect).toHaveBeenCalled();
    });
  });

  describe("selectableDoms", function() {
    
  });

  describe("isUnselectable", function() {

  });

  describe("spyOnMouseStart", function() {

  });

  describe("spyOnMouseStop", function() {

  });

  describe("mouseOverSelectableDom", function() {

  });

  describe("mouseOutSelectableDom", function() {

  });

  describe("clickedOnSelectableDom", function() {

  });


});