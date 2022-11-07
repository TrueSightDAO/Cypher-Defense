var Application = {};

Application.init = function() {
  Application.fetchTabInfo();
}

Application.targetTabId = function() {
  for (var t = window.location.search.substring(1).split("&"), n = 0; n < t.length; n++) {
      var o = t[n].split("=");
      if (decodeURIComponent(o[0]) == "tabid") return decodeURIComponent(o[1]) * 1;
  }
    console.log("Query variable %s not found", e)
}

Application.targetPageId = function() {
  for (var t = window.location.search.substring(1).split("&"), n = 0; n < t.length; n++) {
      var o = t[n].split("=");
      if (decodeURIComponent(o[0]) == "page_id") return decodeURIComponent(o[1]) * 1;
  }
}

Application.fetchTabInfo = function() {

  Env.fetchCurrentTab(function(tab) {
    var payload = { 
      controller: "cypher",
      method: 'info',
      args_array: [{
        url: tab.url
      }]
    }

    // Sends request to background page
    Env.sendMessageToBackground( payload, function(response) {

      switch(response["status"]) {
        case "blacklisted":
          $("#blacklisted").show();

          $("#blacklisted #blacklist_flagger_name").html(response["flagger"]["name"]);
          $("#blacklisted #blacklist_flagger_profile").attr("src", response["flagger"]["avatar_url"]);

          $("#blacklisted #blacklist_validator_name").html(response["validator"]["name"]);
          $("#blacklisted #blacklist_validator_profile").attr("src", response["validator"]["avatar_url"]);
          $("#validated").hide();
          $("#deactive").hide();
          break;

        case "verified":
        $("#blacklisted").hide();
          $("#validated").show();
          $("#deactive").hide();
          break;

        default:
          $("#flag_button").attr("href", "https://truesight.me/domains/flag?domain=" + tab.url);
          $("#blacklisted").hide();
          $("#validated").hide();
          $("#deactive").show();
      }
    });
  });  
  
}

Application.fetchData = function(recipe) {
  var tabid = Application.targetTabId();
  // Env.sendMessageToTab(tabid, { method: "gatherData", args_array: [{recipe: recipe}] }, function(response) {
  //   if(response.status == "success") {
  //     console.log(response.column_data);
  //     debugger;
  //   }    
  // });  
  Application.crawler = new Crawler(tabid, recipe);
  Application.crawler.gatherData();
}


Application.init();  
