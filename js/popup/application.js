var Application = {};

Application.init = function() {
  Application.setupForm();
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

Application.setupForm = function() {
  $("#flag_form").attr("action", Application.flagPath());
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
      console.log(response)
      switch(response["status"]) {
        case "blacklisted":
          $("#blacklisted").show();
          $("#validated").hide();
          $("#deactive").hide();

          $(".flagger_profile_holders").html("");


          response["flaggers"].forEach(function(flagger) {
            console.log(flagger);
            var flagger_link = $("<a>");
            flagger_link.attr("href", flagger["profile_url"]);
            flagger_link.attr("target", "_blank");

            var flagger_profile_img = $("<img>");
            flagger_profile_img.attr("class", "blacklist_flagger_profile");
            flagger_profile_img.attr("src", flagger["avatar_url"]);

            flagger_link.append(flagger_profile_img)
            $(".flagger_profile_holders").append(flagger_link);
          });
          
          // $("#blacklisted #blacklist_flagger_name").html(response["flagger"]["name"]);
          // $("#blacklisted #blacklist_flagger_profile").attr("src", response["flagger"]["avatar_url"]);

          // $("#blacklisted #blacklist_validator_name").html(response["validator"]["name"]);
          // $("#blacklisted #blacklist_validator_profile").attr("src", response["validator"]["avatar_url"]);

          break;

        case "verified":
        $("#blacklisted").hide();
          $("#validated").show();
          $("#deactive").hide();
          break;

        default:
          $("#flagged_url").val(tab.url);
          $("#flagged_domain").val(tab.url);
          $("#blacklisted").hide();
          $("#validated").hide();
          $("#deactive").show();
      }
    });
  });  
  
}

Application.flagPath = function() {
  return CONFIG["server_host"] + CONFIG["paths"]["flag_path"] 
}


Application.init();  
