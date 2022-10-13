var CrawlerView = Backbone.View.extend({
  el: "body",

  initialize: function(opts) {
    var self = this;    
    self.recipe = opts.recipe;
    self.tab_view = opts.parent;
    self.crawler = new Crawler();

    _.bindAll(self, 
      "fetchColumnData",
      "triggerGetData",
      "gatherColumnData",
      "saveGatheredData"
    );    
  },

  triggerGetData: function() {
    var self = this;
    self.gatherColumnData();

    self.tab_view.tab.sessionStatus().then(function(response) {
      
      if(!response.member_id) {
        self.displayLoginPrompt();

      // Ask for upgrade
      // } else if(response.package == "community" && response.downloads_left < self.gathered_data.length ) {
      //   self.displayUpgradePrompt(self.gathered_data.length);
      //   self.saveGatheredData(2);

      // Download CSV file
      } else {
        // self.downloadCsvContent();
        self.saveGatheredData(0, "csv");
        // self.tab_view.sidebar_view.displaySaveNotification();

      }
    })
  },

  gatherColumnData: function() {
    var self = this;
    self.gathered_data = [];
    self.recipe.columns.forEach(function(column_obj) {
      self.fetchColumnData(column_obj);
    });
    return self.gathered_data;
  },

  nextPageUrlExists: function() {
    var self = this;
    if(self.recipe.next_page && self.recipe.next_page.dom_query) {
      return $(self.recipe.next_page.dom_query).length
    } else {
      return false;
    }
  },

  nextPageUrl: function() {
    var self = this;
    if(self.recipe.next_page && self.recipe.next_page.dom_query) {
      var next_page_url = $(self.recipe.next_page.dom_query).attr("href");
      if(next_page_url) {
        return window.location.origin + "/" + next_page_url;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },  

  downloadCsvContent: function() {
    var self = this;
    // var csvContent = self.compileCSV();  

    var file_to_save = new Blob([self.compileCSV()], {
        type: 'text/csv',
        name: document.title
    });
    saveAs(file_to_save, document.title + ".csv");

    // var encodedUri = encodeURI(csvContent);
    // window.open(encodedUri);    
  },

  displayDownloadPanel: function(page_id) {
    var self = this;
    self.crawler.displayDownloadPanel(page_id);
  },

  saveGatheredData: function(download_status, download_format) {
    var self = this;
    return self.tab_view.saveGatheredData(self.gathered_data, download_status, download_format);
  },

  saveGatheredDataAndDisplayPopUp: function(download_status) {
    var self = this;
    return self.tab_view.saveGatheredDataAndDisplayPopUp(self.gathered_data, download_status);
  },  

  displayLoginPrompt: function() {
    var self = this;
    var creation_url  = CONFIG["server_host"] + CONFIG.paths.autoclose_path + "?tab_id=" + self.tab_view.tab.id;
    var new_window = self.popupCenter(creation_url,'Please Sign In', 340, 650);
  },

  displayUpgradePrompt: function(download_attempt) {
    var self = this;
    var creation_url  = CONFIG["server_host"] + CONFIG.paths.upgrade_path + "?download_attempt=" + download_attempt;    
    self.popupCenter(creation_url,'Please Upgrade', 650, 540);
  },  

  popupCenter: function(url, title, w, h) {
    // Fixes dual-screen position                             Most browsers      Firefox
    dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
    dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;

    width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    systemZoom = width / window.screen.availWidth;
    left = (width - w) / 2 / systemZoom + dualScreenLeft
    top = (height - h) / 2 / systemZoom + dualScreenTop

    var new_window = window.open(url, title,'directories=no,titlebar=no,toolbar=no,location=no,statusbar=0,status=no,menubar=no,scrollbars=no,resizable=no,width=' + w + ',height=' + h + ',top=' + top + ',left=' + left);
    if (window.focus) new_window.focus();
    return new_window;
  },

  compileCSV: function() {
    var self = this;
    var col_names = self.getColNames();

    var csvContent = "";
    // var csvContent = "data:text/csv;charset=utf-8,";

    csvContent += col_names.map(function(col_name) {
      return '"' + col_name.replace(/\"/g, "\"\"").replace(/#/g, "&num;") + '"'; 
    }).join(',');
    csvContent += "\r\n";

    self.gathered_data.forEach(function(record_obj){
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

  getColNames: function() {
    var self = this;
    return self.recipe.columns.map(function(column_obj) {
      return column_obj.col_name;
    });
  },

  fetchColumnData: function(column_obj) {
    var self = this;
    if(column_obj.xpath) { 

    } else if (column_obj.outer_dom_query) {
      self.$el.find(column_obj.outer_dom_query).each(function(outer_index, outer_dom) {
        var child_values = [];
        $(outer_dom).find(column_obj.dom_query).each(function(index, dom) {
          child_values.push(self.fetchDomValue(dom, column_obj));
        });

        var curr_row = self.gathered_data[outer_index] = self.gathered_data[outer_index] || self.fetchNewRow();

        if(column_obj.listagg_delimiter) {
          curr_row[column_obj.col_name] = child_values.join(column_obj.listagg_delimiter);
        } else {
          curr_row[column_obj.col_name] = child_values.join(", ");
        }
      })

    } else if (column_obj.dom_query) {

      self.$el.find(column_obj.dom_query).each(function(index, dom) {
        var curr_row = self.gathered_data[index] = self.gathered_data[index] || self.fetchNewRow();
        curr_row[column_obj.col_name] = self.fetchDomValue(dom, column_obj);
      });
    }
  },

  fetchNewRow: function() {
    return {
      "origin_pattern": window.location.href,
      "origin_url": window.location.href
    };
  },

  fetchDomValue: function(dom, column_obj) {
    var self = this;
    if(column_obj.required_attribute) {
      switch(column_obj.required_attribute) {
        case "text":
          return dom.innerText;
          break;
        case "outer_html":
          return dom.outerHTML;
          break;        
        case "inner_html":
          return $(dom).html();
          break;
        case "href":
          var curr_value = $(dom).attr(column_obj.required_attribute);        
          return self.convertLink(curr_value);
          break
        case "src": 
          var curr_value = $(dom).attr(column_obj.required_attribute);
          return self.convertLink(curr_value);
          break;
        default:
          return $(dom).attr(column_obj.required_attribute);
          break;
      }

    } else {
      return dom.innerText;
    }
  },

  convertLink: function(href_value) {
    var curr_value = href_value
    
    if(!curr_value) {return ""};
    if(
      curr_value.indexOf("http") == 0 || 
      curr_value.indexOf("https") == 0 || 
      curr_value.indexOf("//") == 0 
    ) {
      return curr_value;

    } else if(curr_value.indexOf("/") == 0) {
      return window.location.origin + curr_value;

    } else if(curr_value.indexOf("mail") == 0) {
      return curr_value;            

    } else {
      return window.location.origin + "/" + curr_value;

    }         
  }
});