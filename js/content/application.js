var Application = {}

Application.sessionStartTime = Date.now()

/** Holds all compiled handlebar templates **/
Application.templates = {}

/** 
  List of all the templates to be compiled and loaded.
  Actual templates can be found in the following location
    /js/content/templates/*.*
**/
Application.handle_bars = [
  "sidebar", 
  "community_icon",
  "column", 
  "introduction_modal",   
  "recommended_panel_column",
  "listing_panel_column", 
  "listing_panel_recommended_column",  
  "notification_panel",
  "notification_save_panel"
];

Application.path_disabled_patterns = [];

CONFIG.path_disabled_patterns.forEach(function(pattern_string) {
  Application.path_disabled_patterns.push( new RegExp(pattern_string) )
});

Application.path_injection_pattern = new RegExp(CONFIG.server_host + CONFIG.paths.create_new_path );
Application.path_trigger_start_pattern = new RegExp(CONFIG.server_host + CONFIG.paths.logged_in_holding_path );

/** 
  Executes to load all environmental variables
**/
Application.init = function() {
  Application.hideInstallButton();
  Application.handlebar_loaded = false;
  // When not on Krake domain
  if(Application.shouldRenderSubViews()) {
    console.log((Date.now() - Application.sessionStartTime) + " : loading handle bar templates");

    // TODO: load all asynchronously
    Application.loadHandleBarTemplates(Application.handleBarTemplatesLoaded);
    Env.registerListener(Application.msgEvent);
  } 
}

Application.hideInstallButton = function() {
  $("#cypher_chrome_extension_install_button").removeClass("btn-primary");
  $("#cypher_chrome_extension_install_button").addClass("btn-default");
  $("#cypher_chrome_extension_install_button").attr("disabled", true);
  $("#cypher_chrome_extension_install_button").html("Chrome Extension Installed");
}

/**
  Checks if should render sub display of chrome browser extension
**/
Application.shouldRenderSubViews = function() {
  return Application.path_disabled_patterns.reduce(function(prev_result, curr_regex) {
    return prev_result && !curr_regex.test(window.location.href)
  }, true);
}

Application.shouldInjectDefinition = function() {
  return Application.path_injection_pattern.test(window.location.href);
}

Application.shouldTriggerCreation = function() {
  return Application.path_trigger_start_pattern.test(window.location.href);
}

Application.startedTutorialBefore = false;
Application.shouldStartTutorialView = function() {
  var is_page = window.location.href.includes("start.getdata.io");
  return is_page;
}

Application.getUrlVars = function() {
  var vars = {};

  var query_string = window.location.href.slice(window.location.href.indexOf('?') + 1)

  if(query_string.indexOf('#') > -1) {
    query_string = query_string.slice(0, query_string.indexOf('#'))    
  }
  var hashes = query_string.split('&');
  hashes.forEach(function(hash) {
    hash          = hash.split('=');
    vars[hash[0]] = hash[1];
  });
  return vars;
}

/**
  Injects the krake definition into the Krake editor
**/
Application.injectDefinition = function(crawler_def) {

  self.tab = new Tab();  
  var promise = self.tab.compile(Application.getUrlVars()["page_id"]);

  promise.then(function(data_response) {
    $("#krake_name.krake_name_input").val(data_response.page_title);
    $("#krake_content.krake_json_input").html(JSON.stringify(data_response.definition));
    $("#krake_description").val(data_response.page_description);
    $("#krake_keywords").val(data_response.krake_keywords);
    $("#refresh_content").trigger("click");
    $("#to_check_submit").val("dont");
    $("#krake_submit").trigger("click");

  }, function() {
    console.log("Opps... Something went wrong");
  })

}

Application.triggerDataSourceCreation = function() {
  self.tab = new Tab();  
  self.tab.createDataSource(Application.getUrlVars()["page_id"]);
}

Application.triggerGetData = function() {
  Application && Application.tab_view.crawler_view && Application.tab_view.crawler_view.triggerGetData()
}

/**
  Handles all message events from background.js
**/
Application.msgEvent = function(request, sender, sendResponse) {
  var method      = request.method
  var args_array  = request.args_array || [];
  args_array.push(sendResponse);
  
  if(!method) {
    console.log("Controller %s, method %s does not exist", "Application", method);
    return;
  }
  
  if(method && !Application[method]) {
    console.log("Controller %s, method %s does not exist", "Application", method);
    return;
  }

  console.log((Date.now() - Application.sessionStartTime) + " : Calling method : %s", method);
  Application[method].apply(Application, args_array);
}

/**
  Makes possible the display and hiding of the sidebar
**/
Application.handleBarTemplatesLoaded = function() {
  Application.handlebar_loaded = true;
  Application.renderTabView();
}


/**
  Makes possible the display and hiding of the sidebar
**/
Application.renderTabView = function() {
  console.log("Rendering Tab View");
  Application.tab_view = new TabView();  

  console.log("Checking if should render tab")
  if(Application.should_block) {
    Application.activate();
  }
}


/** 
  Activates the Application within this Window
**/
Application.activate = function() {
  // When extension is activated before the handlebar templates are all loaded
  if(!Application.tab_view) {
    Application.to_activate = true;

  // When extension is activated after it has been deactivated on this page
  } else {
    Application.to_activate = false;
    console.log("Activating Tab View");
    console.log((Date.now() - Application.sessionStartTime) + " : activating tab view");
    Application.tab_view.activate().then(function(){
      console.log((Date.now() - Application.sessionStartTime) + " : activated tab view");
    });    
  }
  
}

Application.activateBlocking = function() {
  Application.should_block = true;
  Application.activate();
}

/** 
  Deactivates the Application within this Window
**/
Application.deactivate = function() {
  Application.tab_view.deactivate();
}

Application.refreshRecommendations = function() {
  Application.sidebar_view && Application.sidebar_view.refreshRecommendedColumns();
}

/**
  Loads and compiles all handlebar .hbs files to Application.templates for easy use in Application
**/
Application.loadHandleBarTemplates = function(callback) {
  var template_name = Application.handle_bars.pop();
  Application.templates[template_name] = Handlebars.templates[template_name + ".hbs"]

  if(Application.handle_bars.length > 0) {
    Application.loadHandleBarTemplates(callback);

  } else {
    console.log((Date.now() - Application.sessionStartTime) + " : loaded all handle bar templates");
    callback && callback();
    
  }

}

Application.getInfo = function(payload, callback) {
  response = {};
  response.status = "success";
  response.data = {
    url: window.location
  }
  callback && callback(response);
}

Application.gatherData = function(payload, callback) {
  var crawler_view = new CrawlerView({
    recipe: payload.recipe
  });
  response = {};
  response.status = "success";
  response.data = {
    gathered_data: crawler_view.gatherColumnData(),
    next_page_url: crawler_view.nextPageUrl()
  }
  callback && callback(response);
}


Application.performActions = function(payload, callback) {
  Application.crawler_triggered = true;

  payload.actions.forEach(function(action_object) {
    switch(action_object.action_name) {
      case "click": 
        Application.clickAction(action_object);
        break;

      case "scroll_bottom":
        Application.scrollBottom(action_object);
        break;
    }
  });  

  Application.crawler_triggered = false;  
  response = {};
  response.status = "success";  
  callback && callback(response);
}


Application.clickAction = function(payload) {
  if(payload.dom_query) {
    $(payload.dom_query)[0] && $(payload.dom_query)[0].click();
  }
}

Application.scrollBottom = function(payload) {
  var scrolling_element = document.body
  if(payload.dom_query) {
    scrolling_element = $(payload.dom_query)[0]
  }
  scrolling_element.scrollTop = scrolling_element.scrollHeight;  
}

Application.init();  