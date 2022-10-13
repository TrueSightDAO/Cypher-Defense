var TabView = Backbone.View.extend({

  el: "body",

  events : {
    "click #add_columns": "addColumnEvent",
    "mouseup": "disableDragEvent",
    "mousemove": "trackDragEvent"    
  },  

  /**
    Default Constructor

    Params:
      opts:
        done:Function(boolean)  - returns true if should activate this current tab
        fail:Function(object)   - returns error obj response from background
  **/
  initialize: function() {
    var self        = this;
    Application.tab   = self.tab = new Tab();
    Application.page  = self.page = new Page();   

    _.bindAll(self, 
      "refreshPageObject",
      "trackResizeEvent",
      "processRecipe"
    );  

    $(window).on("resize", self.trackResizeEvent);
  },

  load: function() {
    var deferred  = $.Deferred();
    var self        = this;

    promise_tab   = self.tab.load();
    promise_page  = self.page.load({
      element_count: self.getElementsCount()
    });

    $.when(promise_tab, promise_page).then(
      function() {
        console.log((Date.now() - Application.sessionStartTime) + " : loaded tab view");
        deferred.resolve();
      }, 
      function(){
        console.log("Combine failed");
        console.log(arguments);
        deferred.reject();
      }
    );

    return deferred.promise();
  },

  getElementsCount: function() {
    var self = this;
    return self.$el.find("*").length;
  },

  respondToPageChanges: function() {
    var self = this;
    self.pageChangeObserver = new MutationObserver(self.refreshPageObject);
    self.pageChangeObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  },

  refreshPageObject: function(mutations) {
    var self = this;
    if(!self.tab.get('active') && self.pageLocationHasChanged()) {
      self.page = new Page();
      self.page.load({
        element_count: self.getElementsCount()
      });
    } else {
      self.page && self.page.setScrollHeight(document.body.scrollHeight);
      self.page && self.page.setElementCount(self.getElementsCount());
    }
  },

  pageLocationHasChanged: function() {
    var self = this;
    return self.page.get("origin_url") != Env.getLocation();
  },

  /** Gets the ID of this Tab **/
  tabId: function() {
    var self = this;
    return self.tab.id;
  },

  /** Gets the ID of this Page - Each URL within this Tab has a unique Page ID **/
  pageId: function() {
    var self = this;
    return self.page.get("id");
  },

  /** Activates the DataGet **/
  activate: function() {
    console.log((Date.now() - Application.sessionStartTime) + " : activating tab view");
    var deferred  = $.Deferred();
    var self = this;

    self.render();    
    self.respondToPageChanges();      

    if(!self.isRendered) { // prevents double binding issue within subviews
      self.load().then(
        function() {
          console.log((Date.now() - Application.sessionStartTime) + " : activated tab view");
          self.sidebar_view.load();
          deferred.resolve();
        }, 
        function(){
          console.log("rendering of tab view failed");
          console.log(arguments);
          deferred.reject();
        }
      );      
      
      self.isRendered = true;
    }
    return deferred.promise();
  },

  render: function() {
    var self = this;
    if(!self.sidebar_view) {
      Application.sidebar_view = self.sidebar_view = new SideBarView({
        parent_tab: self
      });        
    }

    self.$el.append(self.sidebar_view.render().el);

    if(self.tab.get("right") && self.tab.get("top") ) {
      self.setPagePanelCoordinates(self.tab.get("right"), self.tab.get("top"));  
    }

    return self;
  },


  /** Deactivation triggered via the sidepanel **/
  deactivateEvent: function() {
    var self = this;
    self.tab.deactivate();
  },

  /** Deactivation triggered via background **/
  deactivate: function() {
    var self        = this;
    self.sidebar_view.destroy();    
    if(self.tutorial) {
      self.tutorial.destroy();
    }
    self.$el.css({ paddingLeft: "0px" });
    self.isRendered = false;
    Application.sidebar_view = self.sidebar_view = null;
  },

  dispatch: function() {
    var self      = this;
    self.tab.dispatch(self.page.id);
  },

  startCrawl: function() {
    var self = this;

    // Directly download
    self.tab.fetchRecipe(self.page.id).then(
      self.processRecipe,
      self.processRecipeError
    );

  },

  processRecipe: function(response) {
    var self = this;
    recipe = response.definition;
    if(!recipe) {self.processRecipeError(response)}

    self.crawler_view = new CrawlerView({
      recipe: recipe,
      parent: self
    });

    self.crawler_view.triggerGetData();
  },

  processRecipeError: function(response) {

  },

  createDataSource: function() {
    var self = this;
    return self.tab.createDataSource(self.page.id);
  },

  saveGatheredData: function(gathered_data, download_status, download_format) {
    var self = this;
    return self.tab.saveGatheredData(self.page.id, gathered_data, download_status, download_format);
  },

  saveGatheredDataAndDisplayPopUp: function(gathered_data, download_status) {
    var self = this;
    return self.tab.saveGatheredDataAndDisplayPopUp(self.page.id, gathered_data, download_status);
  },

  enableDrag: function() {
    var self = this;

    if(self.sidebar_view) {
      self.dragging_enabled = true;
    }
  },

  disableDragEvent: function() {
    var self = this;

    if(self.sidebar_view && self.dragging_enabled) {
      self.dragging_enabled = false;
    }
  },

  trackDragEvent: function(e) {
    var self = this;

    if(self.sidebar_view && self.dragging_enabled) {   
      var new_right = window.innerWidth - e.clientX - 160;
      var new_top = e.clientY - 20;
      self.setPagePanelCoordinates(new_right, new_top);
    }
    
  },

  trackResizeEvent: function(e) {
    var self = this;

    if(self.sidebar_view) {   
      var new_right = self.sidebar_view.$el.css("right");

      if(self.sidebar_view.$el[0].offsetLeft < 0) {     
        new_right = window.innerWidth - CONFIG["sidebar_width"];
      }

      var new_top = self.sidebar_view.$el[0].offsetTop;
      if(self.sidebar_view.$el[0].offsetTop > window.innerHeight - 40) {
        new_top = window.innerHeight - 40;
      }

      self.setPagePanelCoordinates(new_right, new_top);
    }
  },

  setPagePanelCoordinates: function(new_right, new_top) {
    var self = this;
    self.sidebar_view.$el.css("right", new_right);
    self.sidebar_view.$el.css("top", new_top);    
    self.tab.set("right", new_right);
    self.tab.set("top", new_top);
    self.tab.save();
  }

});