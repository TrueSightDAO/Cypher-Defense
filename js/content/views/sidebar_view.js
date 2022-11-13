var SideBarView = Backbone.View.extend({

  className: "cypher-sidebar",

  events : {    
    "click #add_columns": "addColumnEvent",
    "click #save_holder": "dispatchTabEvent",
    "click #create-icon": "dispatchTabEvent",
    "click #datasource_recommendations_holder": "goSearchDataSources",
    "delete_column":      "deleteColumnEvent",
    "mouseenter [data-toggle=tooltip]": "showTooltip",
    "mouseout [data-toggle=tooltip]"  : "hideTooltip",
    "keypress #curr_col_name"  : "validateColName",    
    "keyup #curr_col_name"     : "updateColNameEvent",
    "focus #curr_col_name"     : "focusColName",
    "focusout #curr_col_name"  : "unfocusColName",
    "counter_update_event"     : "updateCounter",
    "click .activate_listing_mode"  : "activateListingMode",
    "click .deactivate_listing_mode": "deactivateListingMode",
    "click #help-icon": "getHelpEvent",

    "click #recommended_column_tab": "activateRecommendationsMode",
    "click #manual_selection_tab": "activateActiveMode",

    "mousedown #getdata-header": "enableDragEvent",
    "click #close-icon" : "deactiveEvent",
    "click #reset_column": "clearDomEvent",
    "change #required_attribute"     : "updateRequiredAttributeEvent"
  },

  supported_modes : {
    "loading-mode"          : "loading-mode",
    "empty-mode"            : "empty-mode",
    "active-mode"           : "active-mode",
    "listing-mode"          : "listing-mode",
    "recommendations-mode"  : "recommendations-mode"

  },

  column_views: [],

  initialize: function(options) {
    var self                      = this;
    self.loading_mode             = true;
    self.parent_tab               = options && options.parent_tab;

    /** Collections **/
    Application.columns               = self.columns = new Columns();
    Application.recommended_columns   = self.recommended_columns = new RecommendedColumns();
    Application.dc_view               = self.dc_view = new DomArrayGenerator();    
    Application.listing_detector      = self.listing_detector = new ListingDetector({
      parent_view: self
    });    
    Application.recommendation_detector = self.recommendation_detector = new RecommendationDetector({
      parent_view: self
    });        

    /** Views **/
    self.column_views             = [];    
    self.recommended_column_views = [];
    self.ordered_views            = [];


    _.bindAll(self, 
      "newColumnCreated", 
      "newColumnSaved", 
      "onResize", 
      "renderColumnViews", 
      "renderRecommendedColumnViews",
      "goSearchDataSources",
      "activeModelColNameUpdated",
      "activateListingMode",
      "deactivateListingMode",
      "updateColNameEvent",
      "focusColName",
      "unfocusColName",
      "enableDragEvent",
      "deactiveEvent",
      "selectedRecommendationEvent",
      "deselectedRecommendationEvent",
      "preventDefaultKeyBehavior",
      "preventDefaultClickBehavior",
      "preventDefaultMouseDownBehavior",
      "preventDefaultMouseOverBehavior",
      "refreshRecommendedColumns"
    );
    $(window).on("resize", self.onResize);
  },

  render: function() {

    console.log((Date.now() - Application.sessionStartTime) + " : rendering sidebar view");        
    var self = this;
    var template = self.template();
    
    self.$el.html(template({
      domain: self.parent_tab.tab.attributes.domain,
      datasource_num: self.parent_tab.tab.attributes.datasource_count,
      community_url: self.parent_tab.tab.attributes.community_url,
      show_datasource_recommendations: self.parent_tab.tab.attributes.datasource_count > 0,
      loading_message: self.loadingMessage()
    }));
    self.$el.addClass(self.supported_modes["empty-mode"]);
    return self;
  },

  loadingMessage: function() {
    var message = "Some sites might take longer.";
    if(Application.shouldStartTutorialView()) {
      message = "It takes slightly longer the first time.";
    } 
    return message;
  },


  load: function() {
    var self = this;
    self.displayCommunity();
    var cl_promise = self.loadColumns();
    var rc_promise = self.loadRecommendedColumns();
    $.when(cl_promise, rc_promise).then(
      function() {
        console.log("loaded Sidebar view");
        self.loading_mode = false;
        self.renderRecommendedColumnViews();        
        self.renderColumnViews();        
        self.renderDisplayMode();
      }, 
      function(){
        
      }
    );          

    // TODO: Make this an async call
    self.listing_detector.load();    


    // TODO: Make this an async call and rerender the recommendations tab after its been loaded
    //   Deal with race condition from AWS S3 as well
    self.recommendation_detector.load();
    
    var local_rcs = self.recommendation_detector.fetchRecommendedColumns();
    var new_rec_promises = []
    local_rcs.forEach(function(local_rc) {
      new_rec_promises.push(self.addNewRecommendedColumn(local_rc));
    });

    Promise.all(new_rec_promises).then(function(values) {
      self.refreshRecommendedColumns();
    });    

  },

  displayCommunity: function() {
    var self = this;

    var datasource_num = ""
    if(self.parent_tab.tab.attributes.datasource_count > 1000) {
      datasource_num = Math.round(self.parent_tab.tab.attributes.datasource_count / 1000) + "K"
    } else {
      datasource_num = self.parent_tab.tab.attributes.datasource_count
    }

    var the_template = self.communityTemplate() 
    var the_icon = the_template({
      domain: self.parent_tab.tab.attributes.domain,
      datasource_num: datasource_num,
      community_url: self.parent_tab.tab.attributes.community_url,
      show_datasource_recommendations: self.parent_tab.tab.attributes.datasource_count > 0
    });

    self.$el.find("#community_holder").html(the_icon);
  },

  /** refresh recommended columns displayed **/
  refreshRecommendedColumns: function() {
    var self = this;
    self.loadRecommendedColumns().then(
      function() {
        console.log("reloading recommendations");
        self.renderRecommendedColumnViews();
      }, 
      function(){
        
      }
    );          
  },

  /**
    Removes this view and all its sub elements
    Called when the extension get deactivated    
  **/
  destroy: function() {
    var self = this;
    self.destroySubViews();
    self.stopColumnCountsMonitoring();
    self.spyOnMouseStop();
    self.remove();
  },

  /**
    Removing all the column views belonging to this view
  **/
  destroySubViews: function() {
    var self = this;
    self.column_views.forEach(function(col_view) {
      col_view.destroy();
    });
    
    self.recommended_column_views.forEach(function(col_view) {
      col_view.destroy();
    });
    self.paginationView.destroy();    
  },

  /**
    Event listener that handles new column adding events
  **/
  addColumnEvent: function(e) {
    var self = this;
    self.addColumn();
  },

  selectedRecommendationEvent: function(rec_col_view) {
    var self = this;
    self.enableSave();
    self.$el.find("#columns").prepend( rec_col_view.$el ); 
    self.$el.find("#listings-panel").prepend( rec_col_view.listing_panel_view.$el );
    rec_col_view.refreshSampleData();
    self.ordered_views.push(rec_col_view);
  },

  deselectedRecommendationEvent: function(rec_col_view, source) {
    var self = this;
    var col_was_active = rec_col_view.model.get("is_active");

    rec_col_view.$el.detach();
    rec_col_view.listing_panel_view.$el.detach();

    self.ordered_views = self.ordered_views.filter(function(curr_col_view) {
      return !(rec_col_view.cid == curr_col_view.cid && rec_col_view.className == curr_col_view.className);
    });
    
    if(col_was_active) {

      switch(source) {
        case rec_col_view.recommended_panel_view:

          var rec_ordered_views = self.ordered_views.filter(function(curr_col_view) {
            return rec_col_view.className == curr_col_view.className;
          });
          if(rec_ordered_views.length > 0 ) {
            var col_view_to_be_activated = rec_ordered_views[rec_ordered_views.length - 1];
            col_view_to_be_activated.activate();

          } else if (self.ordered_views.length == 0){
            self.disableSave();

          }
          break;

        case rec_col_view.listing_panel_view:
          if(self.ordered_views.length == 0) {
            self.addFirstColumn();
            
          } else {
            var col_view_to_be_activated = self.ordered_views[self.ordered_views.length - 1];
            col_view_to_be_activated.activate();
          }
          
          break;

        case rec_col_view:
          if(self.ordered_views.length == 0 && self.recommendations_mode == false) {
            self.addFirstColumn();
            
          } else if (self.ordered_views.length == 0 && self.recommendations_mode == true) {
            self.disableSave();

          } else if (self.ordered_views.length > 0) {
            var col_view_to_be_activated = self.ordered_views[self.ordered_views.length - 1];
            col_view_to_be_activated.activate();
          }

          break;
      }
    }  

    switch(source) {  
      case rec_col_view.listing_panel_view:
        var notification_message = '"' + rec_col_view.getColName() + '" de-selected.'
        self.displayNotification(notification_message);  
        break;

      case rec_col_view:
        var notification_message = '"' + rec_col_view.getColName() + '" de-selected.'
        self.displayNotification(notification_message);  
        break;
    }    
  },  

  /**
    Event listener that handles the deleting event
  **/
  deleteColumnEvent: function(e, col_view) {
    var self = this;
    var col_was_active = col_view.model.get("is_active");

    // Removing the model object corresponding to this col_view
    self.columns.remove(col_view.model)
    col_view.model.destroy();

    // Removing column view from column_views
    self.column_views = self.column_views.filter(function(curr_col_view) {
      return col_view.cid != curr_col_view.cid;
    });

    self.ordered_views = self.ordered_views.filter(function(curr_col_view) {
      return !(col_view.cid == curr_col_view.cid && col_view.className == curr_col_view.className);
    });

    var notification_message = '"' + col_view.getColName() + '" successfully removed.'
    self.displayNotification(notification_message);
    
    col_view.destroy();

    // Creates another column and have it active if there are no columns left
    if(self.ordered_views.length == 0) {
      self.addFirstColumn();

    // Selects the most recent created column if the deleted one was active
    } else if(col_was_active) {
      var col_view_to_be_activated = self.ordered_views[self.ordered_views.length - 1];
      col_view_to_be_activated.activate();
    }
  },

  /**
    Event listener that handles saving of what has already been defined
  **/
  dispatchTabEvent: function(e) {
    var self = this;
    if(!self.$el.find('#save_holder').hasClass("disabled")) {
      self.parent_tab.startCrawl();
    }
  },

  /**
    Deactivates all column views

    Params:
      exempted_model_ids:Array[Integer]
      exempt_pagination:Boolean
  **/
  deactivateSubViews: function(exempted_model_ids, exempt_pagination, exempted_recommendation_ids) {
    var self = this;

    self.column_views && self.column_views.forEach(function(col_view) {
      if( !self.viewIsExempted(exempted_model_ids, col_view) ) {
        col_view.deactivate(); 
      }
    });

    if(!exempt_pagination) {
      self.paginationView.deactivate();
    }

    self.recommended_column_views && self.recommended_column_views.forEach(function(rec_col_view) {
      if( !self.viewIsExempted(exempted_recommendation_ids, rec_col_view) ) {
        rec_col_view.deactivate(); 
      }        
    });
  },

  viewIsExempted: function(exempted_model_ids, view_obj) {
    var self = this;
    exempted_model_ids = exempted_model_ids || [];
    return exempted_model_ids.indexOf(view_obj.model.id) != -1
  },

  getPage: function() {
    var self = this;
    return self.parent_tab.page;
  },

  /** Gets the ID of current Tab Model **/
  tabId: function() {
    var self = this;
    return self.parent_tab.tabId();
  },

  /** Gets the ID this current Page Model - Each URL within this Tab has a unique Page ID **/
  pageId: function() {
    var self = this;
    return self.parent_tab.pageId();
  },  

  onResize: function() {
    var self = this;
    // self.$el.width(CONFIG["sidebar_width"]);
    // self.$el.height(CONFIG["sidebar_height"]);    
  },

  monitorAndRefreshColumnCounts: function() {
    var self  = this;

    self.total_dom_counts = $("*").length;

    if(!self.myMutationObserver) {
      self.myMutationObserver = new MutationObserver(function(mutations) {
        if(self.total_dom_counts == $("*").length) {
          return;
        } else {
          self.total_dom_counts = $("*").length;
          self.column_views.forEach(function(col_view) {
            col_view.renderCounter();
          });          
          self.recommended_column_views.forEach(function(col_view) {
            col_view.refreshCounter();
          });                    
          self.listing_detector.refreshAllContainerChildren();
        }
      });      
    } 

    self.myMutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  },

  stopColumnCountsMonitoring: function() {
    var self = this;
    self.myMutationObserver && self.myMutationObserver.disconnect();
  },

  enableDragEvent: function() {
    var self = this;
    self.parent_tab.enableDrag();
  },

  activateActiveMode: function() {
    var self = this;
    self.recommendations_mode = false;

    if(!self.currentPageHasColumns()) {
      self.addFirstColumn();
    } else {
      self.new_active_col_view.activate();
      self.renderDisplayMode();      
    }    

  },

  deactivateRecommendationsMode: function() {
    var self = this;
    self.recommendations_mode = false;
    self.renderDisplayMode();
  },

  activateRecommendationsMode: function() {
    var self = this;
    self.recommendations_mode = true;

    var exempted_ids = [];
    if(self.new_recommended_active_col_view) {
      exempted_ids = [self.new_recommended_active_col_view.model.id];
    }
    self.deactivateSubViews([], false, exempted_ids);    
    self.renderDisplayMode();
  },

  activateListingMode: function() {
    var self = this;
    self.listing_mode = true;
    if(self.ordered_views.length == 0) {
      self.addFirstColumn();
    }

    self.ordered_views.forEach(function(ordered_view) {
      ordered_view.refreshSampleData && ordered_view.refreshSampleData();
    })
    self.renderDisplayMode();
  },

  deactivateListingMode: function() {
    var self = this;
    self.listing_mode = false;
    self.renderDisplayMode();
  },  

  /**
    Applies the classes to display the correct panel
  **/
  renderDisplayMode: function() {
    var self = this;
    self.resetDisplayMode();
    self.setEmptyModeCopyrighting();    
    self.setListingHeaderCopyrighting();
    self.setTabsDisplayMode();

    
    if(self.loading_mode) {
      self.$el.addClass(self.supported_modes["loading-mode"]);

    } else if (self.listing_mode) {
      self.$el.addClass(self.supported_modes["listing-mode"]);

    } else if (self.recommendations_mode) {
      self.$el.addClass(self.supported_modes["recommendations-mode"]);   

    } else if(
      !self.currentPageHasColumns() || 
      !self.new_active_col_view || 
      !self.new_active_col_view.getCountables() || 
      self.new_active_col_view.getCountables().length == 0
    ) {
      self.$el.addClass(self.supported_modes["empty-mode"]);

    } else if (self.new_active_col_view.getCountables().length > 0) {
      self.$el.addClass(self.supported_modes["active-mode"]);
    }
  },

  /**
    Handles copyrighting for the empty state
  **/
  setEmptyModeCopyrighting: function() {
    var self = this;
    if( self.columns && self.columns.length > 1 ) {
      self.$el.find("#column_number").html("next");
      self.$el.find(".empty-panel").removeClass("is-first");

    } else {
      self.$el.find("#column_number").html("first");
      self.$el.find(".empty-panel").addClass("is-first");

    }

  },

  setListingHeaderCopyrighting: function() {
    var self = this;
    if(self.columns.length > 1) {
      // self.$el.find("#listing_header_title").html(self.columns.length + " columns");
    } else {
      // self.$el.find("#listing_header_title").html(self.columns.length + " column");
    }
    
  },

  setTabsDisplayMode: function() {
    var self = this;
    self.$el.find("#tab-panel .tab").removeClass("active");

    if (self.recommendations_mode == true) {
      self.$el.find("#recommended_column_tab").addClass("active");
    } else {
      self.$el.find("#manual_selection_tab").addClass("active");  
    }          
  },

  /**
    Hides all panels
  **/
  resetDisplayMode: function() {
    var self = this;
    Object.keys(self.supported_modes).forEach( function(display_mode) {
      self.$el.removeClass(display_mode);
    })
    
  },

  renderSampleData: function(sample_data) {
    var self = this;
    self.$el.find("#sample-data").html("");
    self.$el.find("#sample-data").append(sample_data);
  },

  renderPaginationSection: function() {
    var self = this;    
    self.paginationView = new PaginationView({
      parent_view: self
    });
    // self.$el.find("#pagination_holder").append(self.paginationView.$el);
  },  

  /**
    Loads the Column records from the background repository
  **/
  loadColumns: function() {
    var deferred  = $.Deferred();
    var self = this;
    self.$el.find("#columns").html("");
    return self.columns.fetch({
      data: {
        tab_id: self.parent_tab.tabId(),
        page_id: self.parent_tab.pageId()
      },
      success: function() {
        console.log("loaded columns")
        deferred.resolve();
      }
    });
    return deferred.promise();
  },

  /**
    Loads the recommended columns from the background repository
  **/
  loadRecommendedColumns: function() {
    var deferred  = $.Deferred();
    var self = this;
    self.recommended_columns.fetch({
      data: {
        tab_id: self.parent_tab.tabId(),
        page_id: self.parent_tab.pageId()
      },
      success: function() {
        console.log("loaded recommended columns");
        deferred.resolve();
      },
      failure: function() {
        console.log("failed to load recommended columns");        
        deferred.reject();
      }
    });    
    return deferred.promise();
  },  

  /**
    Renders the Column Views
  **/ 
  renderColumnViews: function() {
    var self = this;
    self.column_views = self.column_views || [];

    if(self.column_views.length > 0) {
      Application.startedTutorialBefore = true;
    }

    self.columns.models.forEach(function(col) {
      var col_view = new ColumnView({
        model: col,
        parent_view: self
      });
      self.$el.find("#columns").prepend( col_view.$el ); // populates the counter row
      self.$el.find("#listings-panel").prepend( col_view.listing_panel_view.$el ); // populates the listing panel
      self.column_views.push(col_view);
      self.ordered_views.push(col_view);
    });
    console.log((Date.now() - Application.sessionStartTime) + " : Adding first column");    
    self.addFirstColumn();
    console.log((Date.now() - Application.sessionStartTime) + " : Added first column");
  },

  /**
    Renders the Selected Recommendations Views
  **/   
  renderRecommendedColumnViews: function() {
    var self = this;    
    self.recommended_column_views = [];
    
    self.active_recommended_columns      = self.recommended_columns.forPage($("body"));

    self.$el.find("#tab-panel #recommended_column_tab #column_rec_num").html(self.active_recommended_columns.length);
    if (self.active_recommended_columns.length > 0) {
      self.$el.find("#column-recommendations-header").html( self.active_recommended_columns.length + " recommendations found");
      self.$el.find("#column-recommendations-subheader").html("Contributions by our community. <br>Feel free to include them.");
    } else {
      self.$el.find("#column-recommendations-header").html( "No recommendations found");      
      self.$el.find("#column-recommendations-subheader").html("Be the first to contribute one.")
    }
    
    
    self.active_recommended_columns.models.forEach(function(rec_col) {
      //   Recommendations panel - for all on page
      var col_view = new RecommendedColumnView({
        model: rec_col,
        parent_view: self
      });
      self.recommended_column_views.push(col_view);

    });
    self.reorderAndRenderRecommendedColumnViews();
    
    console.log((Date.now() - Application.sessionStartTime) + " : Rendered recommendation column views");

  },

  reorderAndRenderRecommendedColumnViews: function() {
    var self = this; 
    self.recommended_column_views = self.recommended_column_views || [];

    self.$el.find("#column-recommendations-listings").html("");

    self.recommended_column_views = self.recommended_column_views.sort(function(col_view_a, col_view_b) {
       // Social proofed recommendations
       return (col_view_a.getRankingScore() > col_view_b.getRankingScore()) ? -1 : 1;  
    });

    self.recommended_column_views.forEach(function(col_view) {
      // populates the recommendations panel
      self.$el.find("#column-recommendations-listings").append( col_view.recommended_panel_view.$el ); 
      var rec_col = col_view.model;

      //   Columns Panel - for selected
      if(rec_col.get("selected")) {
        self.$el.find("#listings-panel").prepend( col_view.listing_panel_view.$el ); // populates the listing panel           
        self.$el.find("#columns").prepend( col_view.$el ); // populates the counter row          
        self.ordered_views.push(col_view);        
      }      
    })
  },

  addFirstColumn: function() {
    var self = this;
    if(!self.currentPageHasColumns()) {
      self.addColumn(); 
    }
  },

  currentPageHasColumns: function() {
    var self = this;
    return self.columns.forPage(self.parent_tab.pageId()).length > 0;
  },

  addColumn: function(preset_attributes) {
    var self = this;
    self.deactivateSubViews([], false, []);

    preset_attributes = preset_attributes || {};
    preset_attributes.page_id = self.getPage().id;
    self.columns.newColumn( preset_attributes, self.newColumnCreated, self.errorHandler );
    self.enableSave();
  },  

  addNewRecommendedColumn: function(preset_attributes) {
    var self = this;

    preset_attributes = preset_attributes || {};
    preset_attributes.page_id = self.getPage().id;
    return self.recommended_columns.newRecommendedColumn( preset_attributes, null, null );
  },

  newColumnCreated: function(new_col, preset_attributes) {
    var self = this;
    new_col.set("is_active", true);
    if(preset_attributes) {
      Object.keys(preset_attributes).forEach(function(attribute) {
        new_col.set(attribute, preset_attributes[attribute]);
      });
    }
    $.when(new_col.save()).then( function() {
      self.newColumnSaved(new_col);
      
    } , self.errorHandler );
  },

  newColumnSaved: function(saved_col) {
    var self = this;
    var col_view = new ColumnView({
      model: saved_col,
      parent_view: self
    });
    self.activeColumnViewChanged(col_view);    
    self.$el.find("#columns").prepend( col_view.$el ); // populates counter panel
    self.$el.find("#listings-panel").prepend( col_view.listing_panel_view.$el ); // populates the listing panel    
    self.column_views.push(col_view);    
    self.ordered_views.push(col_view);

    
    // Starting tutorial after all the elements have been render
    if( !Application.startedTutorialBefore && 
        self.column_views.length == 1 && 
        Application.shouldStartTutorialView()
      ) {
        Application.startedTutorialBefore = true;
        console.log((Date.now() - Application.sessionStartTime) + " : loading tutorial");
        self.parent_tab.tutorial = new TutorialView();  
        self.disableTooltip();

    }
  },

  validateColName: function(e) {
    var self = this;
    var disallowed_keycodes = Object.keys(self.new_active_col_view.model.disabled_keycodes).map(function(key){
      return self.new_active_col_view.model.disabled_keycodes[key];
    });

    if(disallowed_keycodes.indexOf(e.keyCode) != -1 ) e.preventDefault();
    if(self.new_active_col_view.model.disabled_keycodes["break_line"] == e.keyCode) $(e.currentTarget).blur()

  },

  updateColNameEvent: function(e) {
    var self = this;
    if(self.$el.find('#curr_col_name')[0].innerText.length == 0) {
      self.$el.find("#curr_col_name").addClass("empty");
      return;
    }
    self.$el.find("#curr_col_name").removeClass("empty");
    var new_col_name = self.$el.find('#curr_col_name')[0].innerText;
    self.new_active_col_view.updateColName(new_col_name, self);
  },  

  focusColName: function(e) {
    var self = this; 
    if( self.new_active_col_view && self.getColName() == self.new_active_col_view.defaultColName() || self.getColName() == self.getEmptyColNamePrompt()) {
      self.$el.find("#curr_col_name").html("");
    }
  },

  unfocusColName: function(e) {
    var self = this;
    var col_name = self.getColName().trim();
    if( self.new_active_col_view && col_name.length == 0 ) {
      self.new_active_col_view.updateColName(self.new_active_col_view.defaultColName(), self);
    }

    if( self.new_active_col_view && col_name == self.new_active_col_view.defaultColName() || col_name == self.getEmptyColNamePrompt() || col_name == "") {
      self.$el.find("#curr_col_name").html(self.getEmptyColNamePrompt());

    }    
  },  

  getColName: function() {
    var self = this;
    return self.$el.find("#curr_col_name").text().trim();
  },  

  setColName: function(col_name) {
    var self = this;

    if( col_name == self.new_active_col_view.defaultColName() || col_name == self.getEmptyColNamePrompt() || col_name == "") {
      self.$el.find("#curr_col_name").html(self.getEmptyColNamePrompt());
      self.$el.find("#curr_col_name").addClass("empty");

    } else {
      self.$el.find("#curr_col_name").html(col_name);
      self.$el.find("#curr_col_name").removeClass("empty");
    }
  },

  getEmptyColNamePrompt: function() {
    return "Enter column title";
  },

  updateRequiredAttributeEvent: function(e) {
    var self = this;
    self.new_active_col_view.updateRequiredAttribute(self.getRequiredAttribute(), self);
  },  

  getRequiredAttribute: function() {
    var self = this;
    return self.$el.find("#required_attribute").val();
  },

  setRequiredAttribute: function(required_attribute) {
    var self = this;
    self.$el.find("#required_attribute option[value='" + required_attribute + "']").prop('selected', true);
  },  

  activeModelColNameUpdated: function() {
    var self = this;
    self.$el.find("#curr_col_name").html(self.new_active_col_view.model.get('col_name'));
  },

  deactivateColNameField: function() {
    var self = this;
    self.$el.find("#curr_col_name").attr("contenteditable", "false");
  },

  activeColumnViewChanged: function(new_active_col_view) {
    var self = this;
    
    self.new_active_col_view = new_active_col_view;
    self.$el.find("#curr_col_name").attr("contenteditable", "true");
    self.setColName(new_active_col_view.model.get('col_name'));
  },

  activeRecommendedColumnViewChanged: function(new_active_rec_col_view) {
    var self = this;
    self.new_recommended_active_col_view = new_active_rec_col_view;
  },  

  deactiveEvent: function(e) {
    var self = this;
    self.parent_tab.deactivateEvent();
  },

  clearDomEvent: function(e) {
    var self = this;
    self.new_active_col_view.clearDomArray();
  },

  updateCounter: function(the_count, source) {
    var self = this;
    if(source == self.new_active_col_view) {
      self.$el.find("#data_items_count").html(the_count);
    }
  },

  errorHandler:  function(err_msg) {
    console.log("An error has occurred: %s", err_msg);
  },

  disableTooltip: function() {
    var self = this;
    self.disable_tool_tip = true;
  },

  showTooltip: function(e) {
    var self = this;
    if(self.disable_tool_tip) {
      return;
    }
    
    $tooltip = self.$el.find("#krake-tooltip");
    $tooltip.show();

    var top = 0, left = 0;
    var element = e.currentTarget;
    var rect = element.getBoundingClientRect();

    $tooltip.css({
      left: rect.left - window.scrollX,
      top: rect.top + $(element).outerHeight()
    });
    
    $tooltip.html( $(e.currentTarget).attr("tooltip-content") );
    e.preventDefault();
  },

  displayNotification: function(notification_message) {
    var self = this;
    var template = self.notificationTemplate();
    self.$el.find("#getdata-notification-popup-positioner").html(template({
      notification_message: notification_message
    }));

    setTimeout(function(){
      self.$el.find("#getdata-notification-popup-positioner").html("");
    }, 1000);
  },


  displaySaveNotification: function() {
    var self = this;

    var data_path = CONFIG["server_host"] + CONFIG["paths"]["data_path"];
    data_path = data_path.replace("{{krake_handle}}", self.parent_tab.page.get("krake_handle"));

    var template = self.notificationSaveTemplate();
    self.$el.find("#getdata-notification-popup-positioner").html(template({
      saved_path: data_path
    }));

    setTimeout(function(){
      self.$el.find("#getdata-notification-popup-positioner").html("");
    }, 5000);
  },

  // When user clicks on datasource recommendations we send them to the search listings
  goSearchDataSources: function(e) {
    var self = this;
    var url = self.parent_tab.tab.attributes.community_url+"?utm_source=krake_chrome_recommendation";
    win = window.open(url, '_blank');
  },

  hideTooltip: function(e) {
    var self = this;    
    $tooltip = self.$el.find("#krake-tooltip");
    $tooltip.hide();
  },

  template: function() {
    return Application.templates['sidebar'];
  },

  notificationTemplate: function() {
    return Application.templates['notification_panel'];
  },

  notificationSaveTemplate: function() {
    return Application.templates['notification_save_panel'];
  },  

  communityTemplate: function() {
    return Application.templates['community_icon'];
  },

  spyOnMouseStart: function() {
    var self  = this;

    $("*").bind("click", self.preventDefaultClickBehavior);
    $("*").bind("mousedown", self.preventDefaultMouseDownBehavior);
    $("*").bind("mouseover", self.preventDefaultMouseOverBehavior);
    $("*").bind("mouseenter", self.preventDefaultMouseOverBehavior);

    $("*").bind("keydown", self.preventDefaultKeyBehavior);
    $("*").bind("keypress", self.preventDefaultKeyBehavior);
    $("*").bind("keyup", self.preventDefaultKeyBehavior);

    self.spyOnBodyChangeStart();        
  },

  spyOnMouseStop: function() {
    var self  = this;    

    $("*").unbind("click", self.preventDefaultClickBehavior);
    $("*").unbind("mousedown", self.preventDefaultMouseDownBehavior);
    $("*").unbind("mouseover", self.preventDefaultMouseOverBehavior);
    $("*").unbind("mouseenter", self.preventDefaultMouseOverBehavior);

    $("*").unbind("keydown", self.preventDefaultKeyBehavior);
    $("*").unbind("keypress", self.preventDefaultKeyBehavior);
    $("*").unbind("keyup", self.preventDefaultKeyBehavior);

    self.spyOnBodyChangeStop();
  },  

  preventDefaultClickBehavior: function(e) {
    var self = this;    
    if(!self.dc_view.isReserved(e.target)) {
      e.preventDefault();    
      e.stopPropagation();
    }
  },

  preventDefaultMouseDownBehavior: function(e) {
    var self = this;    
    if(!self.dc_view.isReserved(e.target)) {
      e.preventDefault();    
      e.stopPropagation();
    }    
  }, 

  preventDefaultMouseOverBehavior: function(e) {
    var self = this;    
    if(!self.dc_view.isReserved(e.target)) {
      e.preventDefault();    
      e.stopPropagation();
    }
  },

  preventDefaultKeyBehavior: function(e) {
    var self = this;    
    if(!(
      self.dc_view.isReserved(e.target) && 
      ( 
        e.type =='keyup' || 
        e.type == 'keypress' 
      )
    )) {
      e.stopPropagation();
    }
    console.groupEnd();
  },

  spyOnBodyChangeStart: function() {
    var self  = this;

    self.total_dom_counts = $("*").length;

    if(!self.myMutationObserver) {
      self.myMutationObserver = new MutationObserver(function(mutations) {
        if(self.total_dom_counts == $("*").length) {
          return;
        } else {
          console.log("page has changed. rebinding again ");
          self.total_dom_counts = $("*").length
        }
        
        $("*").unbind("click", self.preventDefaultClickBehavior);
        $("*").bind("click", self.preventDefaultClickBehavior);

        $("*").unbind("mousedown", self.preventDefaultMouseDownBehavior);
        $("*").bind("mousedown", self.preventDefaultMouseDownBehavior);

        $("*").unbind("mouseover", self.preventDefaultMouseOverBehavior);
        $("*").bind("mouseover", self.preventDefaultMouseOverBehavior);

        $("*").unbind("mouseenter", self.preventDefaultMouseOverBehavior);
        $("*").bind("mouseenter", self.preventDefaultMouseOverBehavior);
      });      
    } 

    self.myMutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  },

  spyOnBodyChangeStop: function() {
    var self  = this;
    self.myMutationObserver && self.myMutationObserver.disconnect();
  },

  disableSave: function() {
    var self = this;
    self.$el.find("#save_holder").addClass("disabled");
  },

  enableSave: function() {
    var self = this;
    self.$el.find("#save_holder").removeClass("disabled");
  },

  getHelpEvent: function() {
    window.open("https://www.facebook.com/GetData.IO");
  }

});