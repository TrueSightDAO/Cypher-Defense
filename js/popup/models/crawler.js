var Crawler = Backbone.Model.extend({
  destination: "content",

  supported_states: {
    idle: 1,
    crawling: 2
  },

  request_config: {
    urls: ["<all_urls>"],
    tabId: self.tab_id,
    types: ["main_frame", "sub_frame", "stylesheet", "script", "font", "object", "xmlhttprequest", "other"]
  },

  initialize: function(opts) {
    var self             = this;
    self.tab_id          = opts.tab_id;
    self.column_data     = [];   // column data
    self.next_page       = null; // 
    self.final_results   = [];
    self.recipe          = opts.recipe;
    self.original_recipe = self.duplicateRecipe(self.recipe);
    self.parent_view     = opts.parent_view;
    self.state           = self.supported_states.idle;

    _.bindAll(self, 
      "trackPageElementLoad",
      "loadedPageElement",
      "allNextPageElementsLoaded",
      "gatherDataFromPage"
    );
  },

  gatherData: function() {
    var self = this;
    self.state           = self.supported_states.crawling;
    self.final_results   = [];    
    self.deferred_gathering  = $.Deferred();

    self.goToStartPage();      


    return self.deferred_gathering.promise();
  },

  abortCrawling: function() {
    var self = this;
    self.state = self.supported_states.idle;
  },

  stillCrawling: function() {
    var self = this;
    return self.state == self.supported_states.crawling;
  },

  getColNames: function() {
    var self = this;
    var col_names = self.recipe.columns.map(function(column_obj) {
      return column_obj.col_name;
    });

    col_names.push("origin_url");
    col_names.push("origin_pattern");
    return col_names;
  },  

  gatherDataFromPage: function() {
    var self = this;    

    if(!self.stillCrawling()) { return; }
    console.log("gatherDataFromPage");

    return self.fetch({
      method: 'gatherData',
      data: {
        recipe: self.recipe
      },
      success: function(collection, response, options) {
        if(!self.stillCrawling()) { return; }

        console.log(response.column_data);
        console.log("got data from page");

        response.gathered_data.forEach(function(data_row) {

          // To be replaced when dealing with nestings and next page
          data_row.origin_pattern = self.recipe.origin_url;
          data_row.origin_url     = self.recipe.origin_url;
          self.addMoreResults(data_row);

        });

        self.parent_view.refreshDisplayData();

        // Breaks the chain
        if(response.next_page_url) {
          self.recipe.origin_url = response.next_page_url;
          self.goToNextPage();

        } else {
          self.state = self.supported_states.idle;
          self.deferred_gathering.resolve();
        }
      },
      error: function(collection, response, options) {
        self.deferred_gathering.reject();
      }
    });
  },

  duplicateRecipe: function(recipe) {
    return JSON.parse(JSON.stringify(recipe));

  },

  goToStartPage: function() {
    var self = this; 
    if(!self.stillCrawling()) { return; }

    self.recipe = self.duplicateRecipe(self.original_recipe);

    self.isOnStartPage().then(function(tab){
      if(tab.url == self.original_recipe.origin_url) {
        self.gatherDataFromPage();    
        
      } else {
        self.next_page_elements = {};
        Env.addBeforeWebRequestListener(self.trackPageElementLoad);
        Env.addCompletedWebRequestListener(self.loadedPageElement);
        Env.redirectTo(self.tab_id, self.recipe.origin_url);  
      }
    })
    
    
  },

  isOnStartPage: function() {
    var deferred  = $.Deferred();
    var self = this;

    Env.fetchTabById(self.tab_id, function(tab) {
      deferred.resolve(tab);
    });
    return deferred.promise();
  },

  goToNextPage: function() {
    var self = this; 
    if(!self.stillCrawling()) { return; }

    self.next_page_elements = {};
    Env.addBeforeWebRequestListener(self.trackPageElementLoad);
    Env.addCompletedWebRequestListener(self.loadedPageElement);

    return self.fetch({
      method: "performActions",
      data: {
        actions: [{
          "action_name": "click",
          "dom_query": self.recipe.next_page.dom_query
        }]
      }
    });;
  },

  trackPageElementLoad: function(event) {
    var self = this;
    self.next_page_elements[event.requestId] = event;
    var event_time = null;
    self.most_recent_request_time = event_time = new Date();
    self.runAfterLoaded(event_time);
  },

  loadedPageElement: function(event) {
    var self = this;
    console.log("Loaded " + event.requestId);
    delete self.next_page_elements[event.requestId];
  },

  runAfterLoaded: function(event_time) {
    var self = this;
    var time_to_wait = 3000;
    setTimeout(function() {
      // Ensures all elements on page has been loaded
      event_time == self.most_recent_request_time && 
      self.allNextPageElementsLoaded();

    }, time_to_wait);
  },

  allNextPageElementsLoaded: function() {
    var self = this;

    Env.removeBeforeWebRequestListener(self.trackPageElementLoad);
    Env.removeCompletedWebRequestListener(self.loadedPageElement);
    // self.scrollBottom().then(self.gatherDataFromPage());
    self.gatherDataFromPage();    
  },

  addMoreResults: function(data_row) {
    var self = this;
    // Logic for deduplicating data here
    if(!self.alreadyAdded(data_row)) {
      self.final_results.push(data_row);
    }
  },

  alreadyAdded: function(data_row) {
    var self = this;
    var already_exist = false;
    var matching_record = self.final_results.filter(function(curr_obj) {
      var same_obj = true;
      if (Object.keys(data_row).length != Object.keys(curr_obj).length) same_obj = false;

      Object.keys(data_row).forEach(function(curr_key) {
        if(data_row[curr_key] != curr_obj[curr_key]) same_obj = false;
      });

      Object.keys(curr_obj).forEach(function(curr_key) {
        if(data_row[curr_key] != curr_obj[curr_key]) same_obj = false;
      });
      
      return same_obj;   

    });

    return matching_record.length > 0;
  }

  // scrollBottom: function() {
  //   var deferred  = $.Deferred();
  //   var self = this;
  //   return self.fetch({
  //     method: 'performActions',
  //     data: {
  //       actions: [{
  //         action_name: "scroll_bottom"
  //       }]
  //     },
  //     success: function(collection, response, options) {
  //       deferred.resolve();
  //     },
  //     error: function(collection, response, options) {
  //       deferred.reject();
  //     }
  //   });
  //   return deferred.promise();
  // }

})  