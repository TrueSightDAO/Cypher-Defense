/** Node environmental dependencies **/
importScripts('/js/background/browsers/chrome.js');

importScripts('/blacklist/domains.js');
importScripts('/blacklist/people.js');
importScripts('/blacklist/urls.js');

importScripts('/js/config/config.js');
importScripts('/js/background/models/domain.js');
importScripts('/js/background/controllers/cypher_controller.js');
importScripts('/js/background/views/browser_icon_view.js');

// try { var KTab                          = require('./models/ktab'); } catch(e) {}
// try { var MixPanelController            = require('./controllers/mix_panel_controller'); } catch(e) {}
// try { var KColumnsController            = require('./controllers/kcolumns_controller'); } catch(e) {}
// try { var KRecommendedColumnsController = require('./controllers/krecommended_columns_controller'); } catch(e) {}
// try { var KTabController                = require('./controllers/ktab_controller'); } catch(e) {}
// try { var KPageController               = require('./controllers/kpage_controller'); } catch(e) {}
// try { var KPaginationController         = require('./controllers/kpagination_controller'); } catch(e) {}
// try { var TutorialController            = require('./controllers/tutorial_controller'); } catch(e) {}
// try { var CrawlerController             = require('./controllers/crawler_controller'); } catch(e) {}


var Application = {};

Application.msg_controllers = {
  cypher:               CypherController
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

/** Called when user clicks to activate another window in the browser **/
Application.tabEvent = function(action_info) {
  console.log("Tab event was generated")
  var tab_id = action_info.tabId;

  chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    console.log("line 110");
    console.log(tabs[0].url);
    // use `url` here inside the callback because it's asynchronous!
  });

  Env.fetchTabById(tab_id, function(tab) {
    switch(Domain.status(tab.url)) {
      case "blacklisted":
        console.log("problem Tab id " + tab.id);
        BrowserIconView.blacklisted();
        Env.sendMessage(tab.id, { method: "activateBlocking" }, function() {});

        // chrome.scripting.executeScript({
        //   target: {tabId: tab.id},
        //   files: ['/what.js'],
        // });
        tid = tab.id;
        chrome.tabs.sendMessage(tid, { method: "activateBlocking" }, function(response) {
          console.log("line 100");
          console.log(response);
          // console.log(response.farewell);
        });

        break;

      case "verified":
        BrowserIconView.verified();
        break;

      default:
        BrowserIconView.deactivate();
    }
  })
  
}

/** Called when user refreshes a window in the browser **/
Application.refreshEvent = function(tabId, changeInfo, tab) {
  
  if(tab && tab.url && tab.status && tab.status == "complete") {

    switch(Domain.status(tab.url)) {
      case "blacklisted":
        BrowserIconView.blacklisted();
        Env.sendMessage(tab.id, { method: "activateBlocking" }, function() {});
        break;

      case "verified":
        BrowserIconView.verified();
        break;

      default:
        BrowserIconView.deactivate();
    }
  }
}


Application.onInstall = function(details) {
  if(details.reason == "install"){
    Env.fetchCurrentTab(function(tab) {
      Env.redirectTo(tab.id, "https://truesight.me/dao/chrome_installed");
    })
  }
}

Application.onUninstall = function(details) {}



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


// // Application.loadPublicCountCache();
// // setInterval(function() {
// //   console.log("Refreshing cache every 30 minutes");
// //   Application.loadPublicCountCache();

// // }, 30* 60 * 1000); 
