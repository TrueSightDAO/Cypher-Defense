var PoupupView = Backbone.View.extend({
  el: "body",

  events : {    
    "click #run_crawler": "triggerCrawler",
    'click #myTab a' : "clickedShowTab",
    "click #download-csv" : "downloadCsvContent",
    "click #download-json" : "downloadJSONContent"
  },  

  supported_states: {
    idle: 1,
    crawling: 2
  },

  initialize: function(opts) {
    var self        = this;

    _.bindAll(self, 
      "triggerCrawler",
      "refreshDisplayData",
      "crawlerCompletedState",
      "downloadCsvContent",
      "downloadJSONContent"
    );

    self.page_id    = opts.page_id;
    self.tab_id     = opts.tab_id
    self.tab        = new Tab();
    self.page       = new Page();
    self.loadRecipe();
    self.loadPageDetails();
    self.render();
  },

  render: function() {
    var self = this;
  },

  loadPageDetails: function() {
    var self = this;
    self.page.load(self.page_id).then(function() {
      self.$el.find("h3").html("Results: " + self.page.get("page_title"));

      var path_url = CONFIG["server_host"] + CONFIG["paths"]["data_path"];
      path_url = path_url.replace("{{krake_handle}}", self.page.get("krake_handle"))      
      self.$el.find("#data_source_link").attr({
        href: path_url
      });
    });
  },

  loadRecipe: function() {
    var self = this;
    self.tab.compile(self.page_id).then(function(data_response) {
      self.recipe = data_response.definition;
      self.$el.find("#recipe").html(JSON.format(data_response.definition));
      self.crawler    = new Crawler({
        tab_id: self.tab_id, 
        recipe: self.recipe,
        parent_view: self
      });      
      self.triggerCrawler();
    });
  },

  triggerCrawler: function() {

    var self = this;
    if(!self.crawler.stillCrawling()) {
      console.log("starting crawl");    
      self.crawlerStartedState();
      self.crawler.gatherData().then(self.crawlerCompletedState);      

    } else {
      console.log("aborted crawler");    
      self.crawler.abortCrawling();
      self.crawlerAbortedState();

    }

  },

  stopCrawling: function() {

  },

  renderFreshDataHolder: function() {
    var self = this;

    self.$el.find("#final_results_holder").html("");
    var loading_message = $("<div>").attr({id: "fresh_message"})
    self.$el.find("#final_results_holder").append(loading_message);

    var loading_img = $("<img>").attr({
      "src": "/images/loading-icon.gif", 
      "class": "loading-gif"
    });
    $(loading_message).append(loading_img);
    var h4 = $("<h4>").html("Crawling started");
    $(loading_message).append(h4);
  },

  refreshDisplayData: function() {
    console.log("refreshing display data")
    var self = this;
    self.$el.find(".download-btn").removeAttr("disabled");

    self.$el.find("#final_results_holder").html("");
    var final_results = $("<table>").attr({id: "final_results", class: "table"});
    self.$el.find("#final_results_holder").append(final_results);

    var tr_header = $("<tr>");
    self.$el.find("#final_results").append(tr_header);

    self.crawler.getColNames().forEach(function(curr_col_name) {
      var curr_th = $("<th>");
      curr_th.html(curr_col_name);
      tr_header.append(curr_th);
    });

    var tbody = $("<tbody>");
    self.$el.find("#final_results").append(tbody);

    self.crawler.final_results.forEach(function(curr_result) {
      var tr_row = $("<tr>");
      tbody.prepend(tr_row);

      self.crawler.getColNames().forEach(function(curr_col_name) {
        var curr_td = $("<td>");
        curr_td.html(curr_result[curr_col_name]);
        tr_row.append(curr_td);
      });

    });
    self.$el.find("#results_count").html(self.crawler.final_results.length);    
  },

  crawlerStartedState: function() {
    console.log("crawling started");

    var self = this;
    self.$el.find(".download-btn").attr({"disabled": true});
    self.$el.find("#run_crawler").removeClass("btn-primary");
    self.$el.find("#run_crawler").addClass("btn-danger");
    self.$el.find("#run_crawler").html("Stop Crawler");

    self.renderFreshDataHolder();
  },

  crawlerInProgressState: function() {
    var self = this;
  },

  crawlerCompletedState: function() {
    console.log("crawling completed");
    var self = this;
    self.tab.saveGatheredData(self.page_id, self.crawler.final_results, 0);
    self.$el.find(".download-btn").removeAttr("disabled");
    self.$el.find("#run_crawler").removeClass("btn-danger");    
    self.$el.find("#run_crawler").addClass("btn-primary");
    self.$el.find("#run_crawler").html("Start Crawler");    
  },

  crawlerAbortedState: function() {
    var self = this;
    self.$el.find("#run_crawler").removeClass("btn-danger");
    self.$el.find("#run_crawler").addClass("btn-primary");
    self.$el.find("#run_crawler").html("Start Crawler");      

    if(self.crawler.final_results.length == 0 ) {
      self.$el.find("#final_results_holder").html("");
      var loading_message = $("<div>").attr({id: "fresh_message"})
      self.$el.find("#final_results_holder").append(loading_message);

      var h4 = $("<h4>").html("Crawling aborted");
      $(loading_message).append(h4);

    } else {
      console.log("crawling aborted");
      self.tab.saveGatheredData(self.page_id, self.crawler.final_results, 0);
    }
  },

  crawlerIdleState: function() {
    var self = this;
    self.$el.find(".download-btn").attr({"disabled": true});    
    self.$el.find("#run_crawler").removeClass("btn-danger");    
    self.$el.find("#run_crawler").addClass("btn-primary");
    self.$el.find("#run_crawler").html("Start Crawler");      
  },

  compileCSV: function() {
    var self = this;
    var col_names = self.crawler.getColNames();

    var csvContent = "";
    // var csvContent = "data:text/csv;charset=utf-8,";

    csvContent += col_names.map(function(col_name) {
      return '"' + col_name.replace(/\"/g, "\"\"").replace(/#/g, "&num;") + '"'; 
    }).join(',');
    csvContent += "\r\n";

    self.crawler.final_results.forEach(function(record_obj){
      csvContent += col_names.map(function(col_name) {
        col_value = record_obj[col_name];
        if(col_value) {
          return '"' + col_value.replace(/\"/g, "\"\"").replace(/#/g, "&num;") + '"';  
        } else {
          return '""'
        }
        
      }).join(',');  
      csvContent += "\r\n";
    });
    return csvContent;
  },  

  downloadCsvContent: function() {
    var self = this;
    if(self.crawler.final_results.length == 0) { return; }

    var file_name = self.page.get("page_title") + ".csv";    
    var file_to_save = new Blob([self.compileCSV()], {
        type: 'text/csv',
        name: file_name
    });
    saveAs(file_to_save, file_name);
    self.tab.recordDownload(self.page_id, "csv");
  },

  downloadJSONContent: function() {
    var self = this;
    if(self.crawler.final_results.length == 0) { return; }

    var file_name = self.page.get("page_title") + ".json";
    var file_to_save = new Blob([JSON.format(self.crawler.final_results)], {
        type: 'application/json',
        name: file_name
    });

    saveAs(file_to_save, file_name);
    self.tab.recordDownload(self.page_id, "json");
  }    


})