/** Node environmental dependencies **/
try { var BrowserIconView               = require('./views/browser_icon_view'); } catch(e) {}
try { var CONFIG                        = require('../config/config'); } catch(e) {}
try { var KTab                          = require('./models/ktab'); } catch(e) {}
try { var MixPanelController            = require('./controllers/mix_panel_controller'); } catch(e) {}
try { var KColumnsController            = require('./controllers/kcolumns_controller'); } catch(e) {}
try { var KRecommendedColumnsController = require('./controllers/krecommended_columns_controller'); } catch(e) {}
try { var KTabController                = require('./controllers/ktab_controller'); } catch(e) {}
try { var KPageController               = require('./controllers/kpage_controller'); } catch(e) {}
try { var KPaginationController         = require('./controllers/kpagination_controller'); } catch(e) {}
try { var TutorialController            = require('./controllers/tutorial_controller'); } catch(e) {}
try { var CrawlerController             = require('./controllers/crawler_controller'); } catch(e) {}

var Application = {};

Application.msg_controllers = {
  mixpanel:             new MixPanelController(CONFIG["mixpanel_key"], CONFIG["version"], CONFIG["server_host"] + CONFIG.paths.muuid_path),
  kcolumns:             KColumnsController,
  ktab:                 KTabController,
  kpage:                KPageController,
  kpagination:          KPaginationController,
  krecommended_columns: KRecommendedColumnsController,
  tutorial:             TutorialController,
  crawler:              CrawlerController
};

/**
  When served a request calls a controller's method

  Params:
    request:Object
      controller:String - the name of the controller register with the Application object
      method:String     - the name of the method
      args_array:Array  - the arguments to be past into the method

    sender:Object
    sendResponse:Object

**/
Application.msgEvent = function(request, sender, sendResponse){
  var controller = request.controller;
  var method     = request.method;
  var args_array = request.args_array || [];

  if(sender.tab) args_array.push(sender.tab);
  res = {}
  if(!controller) {
    res.status  = "error";
    res.err_msg = "controller needs to be specificed";
    
  } else if (!Application.msg_controllers[controller]) {
    res.status  = "error";
    res.err_msg = "controller is not registered: " + controller;
    
  } else if (Application.msg_controllers[controller] && !Application.msg_controllers[controller][method]) {
    res.status  = "error";
    res.err_msg = "controller " + controller + ", method " + method + " does not exist"
    
  } else {
    console.group(controller);
    console.log((Date.now() - request.sessionStartTime) + " : executing " + method);
    console.log(args_array);
    controller_obj  = Application.msg_controllers[controller];
    res             = controller_obj[method].apply(controller_obj, args_array);
    console.log((Date.now() - request.sessionStartTime) + " : executed  " + method);
    console.groupEnd();

  }
  sendResponse && sendResponse(res);

}


/** Called when the icon on the top right hand corner of the browser is clicked **/
Application.iconEvent = function(tab) {  
  var tab_id = tab.id;
  var kwin = new KTab(tab_id);
  
  if(kwin.isActive()) {
    kwin.deactivate();
    BrowserIconView.deactivate();
    Application.msg_controllers.mixpanel.trackExtensionDeactivation();

  } else {
    kwin.activate();
    BrowserIconView.activate();
    Application.msg_controllers.mixpanel.trackExtensionActivation();  
    
  }
};

/** Called when user clicks to activate another window in the browser **/
Application.tabEvent = function(action_info) {
  var tab_id = action_info.tabId;
  var kwin = new KTab(tab_id);  
  if(kwin.isActive()) BrowserIconView.activate();
  else BrowserIconView.deactivate();

  Env.fetchTabById(tab_id, function(tab) {
    Application.syncDomainRecommendations(tab)
      .then(Application.setBadgeText)
      .then(function() {
        kwin.refreshRecommendations();
      })
  })
  
}

/** Called when user refreshes a window in the browser **/
Application.refreshEvent = function(tabId, changeInfo, tab) {
  
  if(tab && tab.url && tab.status && tab.status == "complete") {
    console.log("refresh event started - ");
    var kwin = new KTab(tab.id);

    // Automatically starts the tutorial for the use if she lands on the tutorial page
    if(tab.url.includes("start.getdata.io")) {
      Application.startTutorial(tab);    

    // Handle autoclose path
    } else if (Application.shouldHandleFirstLogin(tab) ) {
      Application.handleFirstLogin(tab);

    // Avoiding race condition versus start tutorial page
    } else if(kwin.isActive() ) {
      if(!tab.url.includes("start.getdata.io") ) {
        kwin.activate();
        BrowserIconView.activate();          
      }
      
    } else {
      BrowserIconView.deactivate();    
    }  

    // Checks to see if there are any public data sources available for this URL
    Application.syncDomainRecommendations(tab)
      .then(Application.setBadgeText)
      .then(function(datasources_response) {
        var kwin = new KTab(tab.id);
        kwin.refreshRecommendations();
        kwin.setDataSourceCount(datasources_response.count);
        kwin.setDataSourceCommunityUrl( "https://getdata.io" + datasources_response.url);
        kwin.setDomain(tab.url);
    });
  }
}

// When user clicked the Get Data button for the first time and has yet logged in
Application.shouldHandleFirstLogin = function(tab) {
  return tab.url.includes(CONFIG["server_host"] + CONFIG.paths.autoclose_path)
}

// Closes the popup window
Application.handleFirstLogin = function(tab) {
  var target_tab_id = tab.url.match(/tab_id=([0-9]+)/)[1] * 1;
  var kwin = new KTab(target_tab_id);
  kwin.triggerGetData();
  Env.closeTab(tab.id);
}

Application.syncDomainRecommendations = function(tab) {
  var deferred  = $.Deferred();

  var domain_name = Env.fetchHostName(tab.url);
  var kwin = new KTab(tab.id);
  var hard_refresh = kwin.isActive();

  KRecommendedColumn.syncRecommendedColumns(domain_name, hard_refresh).then(function() {
    deferred.resolve();
  });      
  return deferred.promise();
}

Application.startTutorial = function(tab) {
  var tab_id = tab.id;
  var kwin = new KTab(tab_id);
  kwin.activate();
  BrowserIconView.activate();
  Application.msg_controllers.mixpanel.trackExtensionActivation();  
}

Application.onInstall = function(details) {
  if(details.reason == "install"){
    Env.setInstalledCookie();    
    Env.fetchCurrentTab(function(tab) {
      Env.redirectTo(tab.id, "https://start.getdata.io");
    })
  }
  // else if(details.reason == "update"){
  //   var thisVersion = chrome.runtime.getManifest().version;
  //   console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
  // }
}

Application.onUninstall = function(details) {}

Application.setBadgeText = function() {
  var deferred  = $.Deferred();

  Env.fetchCurrentTab(function(tab) {
    if(!tab) {return;}
    var the_domain = Env.fetchHostName(tab.url);

    // Don't recommend any data source when we are on GetData.IO
    if((/getdata.io/i).test(the_domain)) {
      Env.setIconText('');
      deferred.resolve({count: 0 });
      return;
    }

    if(Application.public_count && Application.public_count[the_domain]) {
      if(Application.public_count[the_domain]["count"] > 1000) {
        Env.setIconText( Math.round(Application.public_count[the_domain]["count"] / 1000) + 'k');
        deferred.resolve({
          count: Application.public_count[the_domain]["count"],
          url:  Application.public_count[the_domain]["url"]
        });

      } else if(Application.public_count[the_domain]["count"] > 0) {
        Env.setIconText(Application.public_count[the_domain]["count"] + '');
        deferred.resolve({
          count: Application.public_count[the_domain]["count"],
          url:  Application.public_count[the_domain]["url"] 
        });

      } else {
        Env.setIconText('');
        deferred.resolve({
          count: 0,
          url: null
        });
      }

    } else {
      Env.setIconText('');
      deferred.resolve({
        count: 0,
        url: null
       });
    }    
  }); 

  return deferred.promise();

}

Application.loadPublicCountCache = function() {
  var deferred  = $.Deferred();

  $.get( 'https://cache.getdata.io/PUBLIC_KRAKE/domain_counts_new.json', function (data) {
    Application.public_count = Application.public_count  || {};
    var server_response = JSON.parse(data);
    for(var i = 0; i < Object.keys(server_response).length ; i++) {
      var domain_name = Object.keys(server_response)[i]
      Application.public_count[domain_name] = Application.public_count[domain_name] || {};
      Application.public_count[domain_name]["count"] = server_response[domain_name]["count"];
      Application.public_count[domain_name]["url"] = server_response[domain_name]["url"];
      Application.public_count[domain_name]["last_update"] = server_response[domain_name]["last_update"];
    };
    deferred.resolve();    
  });

  return deferred.promise();
}


// @Description : Listens for message calls from the front end
Env.registerListener("runtime_on_message", Application.msgEvent);

// @Description : handles page reload event
Env.registerListener("tabs_on_update", Application.refreshEvent);

// @Description : handles extension Icon click event
Env.registerListener("browser_action_onclick", Application.iconEvent);

// @Description : handles for tab change event
Env.registerListener("tabs_on_activate", Application.tabEvent);

// @Description : handles for tab change event
Env.registerListener("first_install", Application.onInstall);

// @Description : handles for tab change event
// Env.registerListener("tabs_on_close", Application.onTabClosed);

// @Description : handles for uninstall event
// Env.registerListener("uninstall", Application.onUninstall);


Application.loadPublicCountCache();
setInterval(function() {
  console.log("Refreshing cache every 30 minutes");
  Application.loadPublicCountCache();

}, 30* 60 * 1000); 

/** Export for node testing **/
try { 
  module && (module.exports = { 
    Application:            Application,     
    BrowserIconView:        BrowserIconView,
    CONFIG:                 CONFIG,
    KTab:                   KTab,    
    MixPanelController:     MixPanelController,
    KColumnsController:     KColumnsController,
    KPaginationController:  KPaginationController
  }); 
} catch(e){}