var KTabController = {};

KTabController.create = function(data_obj, tab_obj) {
  var ktab       = new KTab(tab_obj.id, data_obj.top, data_obj.right);
  response        = {}
  response.data   = ktab.toJson();
  response.status = "success";
  return response;
}


KTabController.update = function(data_obj, tab_obj) {
  var ktab       = new KTab(tab_obj.id, data_obj.top, data_obj.right);
  response        = {}
  response.data   = ktab.toJson();
  response.status = "success";
  return response;
}

KTabController.dispatch = function(data_obj, tab_obj) {
  var kpage = KPage.find({id: data_obj.page_id})[0];
  var root_kpage    = kpage.root();

  KTabController.isLoggedIn().done(function(logged_in) {
    if(logged_in) {
        KTabController.createDataSource(data_obj, tab_obj);

    } else {
      var creation_url  = CONFIG["server_host"] + CONFIG.paths.logged_in_holding_path + "?page_id=" + root_kpage.id;
      Env.redirectTo(tab_obj.id, creation_url);      
    }
  });
  Application.msg_controllers.mixpanel.trackDone();

  response        = {}
  response.data   = kpage.toJson();
  response.status = "success";
  return response;
}

KTabController.compile = function(data_obj, tab_obj) {
  var kpage       = new KPage.find({ id: data_obj.page_id })[0];
  response        = {}
  if(kpage) {
    response.data   = {
      page_title:   kpage.page_title,
      definition:   kpage.toParams(true),
      page_description:  kpage.page_description,
      page_keywords:     kpage.page_keywords
    };
    response.status   = "success";

  } else {
    response.err_msg  = "KPage does not exist";
    response.status   = "error";        
  }
  return response;

}

KTabController.sessionStatus = function(data_obj, tab_obj) {
  var session_status_url = CONFIG["server_host"] + CONFIG["paths"]["session_status_path"];
  response = {}
  $.ajax({
    method: "GET",
    async: false,
    url: session_status_url,
    success: function(server_response) {
      response.data = server_response;
      response.status = "success";
    },
    error: function(server_response) {
      response = server_response;
      response.status = "error";
    }
  })
  return response;
}

KTabController.isLoggedIn = function() {
  var self = this;
  var deferred  = $.Deferred(); 
  var session_status_url = CONFIG["server_host"] + CONFIG["paths"]["session_status_path"];
  $.ajax({
    method: "GET",
    url: session_status_url

  }).done(function(data) {
    if(data["member_id"] && self.member_id == data["member_id"]) {
      deferred.resolve(true);

    } else if (data["member_id"] && self.member_id != data["member_id"]) {
      self.oauth_token = false;
      deferred.resolve(true);

    } else {
      self.oauth_token = false;
      deferred.resolve(false);
    }

  })  
  return deferred.promise();   
}

KTabController.setOauthToken = function() {
  var deferred  = $.Deferred();  
  var self = this;
  if(self.oauth_token) {
    deferred.resolve();
  } else {
    var token_url = CONFIG["server_host"] + CONFIG["paths"]["oauth_token_path"];
    $.ajax({
      method: "GET",
      url: token_url, 
      data: {
        client_id: CONFIG["oauth_client_id"]
      }
    }).done(function(data) {
      if(data["token"]) {
        self.oauth_token  = data["token"];
        self.member_id    = data["member_id"];
        Env.registerListener("uninstall", Application.onUninstall);
        deferred.resolve();

      } else {
        // Handle error with BugSnag  
        // BugsnagController.report("error in setOauthToken - no token was returned");
        deferred.reject();

      }

    })
  }

  return deferred.promise();    
}

KTabController.createDataSource = function(data_obj, tab_obj) {
  var self = this;
  var kpage       = new KPage.find({ id: data_obj.page_id })[0];

  response        = {}
  if(kpage) {
    KTabController.setOauthToken().then(function(data_obj, tab_obj){
      KTabController.updateDataSourceOnServer(data_obj, tab_obj);
    });

    response.status   = "success";

  } else {
    response.err_msg  = "KPage does not exist";
    response.status   = "error";        
  }
  return response;
}

KTabController.dataSourceExist = function(data_obj, tab_obj) {
  var self = this;
  var deferred  = $.Deferred();      

  var kpage       = new KPage.find({ id: data_obj.page_id })[0];  

  if(kpage.krake_handle) {
    var post_url = CONFIG["server_host"] + CONFIG["paths"]["post_new_path"] + "/" + kpage.krake_handle;
    var method = "GET";  
    $.ajax({
      method: method,
      url: post_url,
      headers: {
        "Authorization": "Bearer " + self.oauth_token
      },
      data: {
        format: "json"
      },
      success: function(data) {
        console.log("success")
        console.log(data)
        if(data.id) {
          deferred.resolve(true);
        } else {
          kpage.krake_handle = null;
          deferred.resolve(false);
        }
      },
      error: function(data) {
        console.log("error")
        console.log(data)        
        kpage.krake_handle = null;
        deferred.resolve(false);
      }
    })

  } else {
    deferred.resolve(false);    
  }


  return deferred.promise();     
}

KTabController.updateDataSourceOnServer = function(data_obj, tab_obj) {
  var self = this;
  var deferred  = $.Deferred();    
  var kpage       = new KPage.find({ id: data_obj.page_id })[0];  
  var payload = {
    krake: {
      name:   kpage.page_title,
      content:   JSON.format(kpage.toParams(true)),
      description:  kpage.page_description,
      keywords:     kpage.page_keywords,

    },
    button: 'Save',
    format: 'json',
  }  

  KTabController.dataSourceExist(data_obj, tab_obj).then(function() {
    if(!kpage.krake_handle) {
      var post_url = CONFIG["server_host"] + CONFIG["paths"]["post_new_path"];
      var method = "POST";        

    } else {
      var post_url = CONFIG["server_host"] + CONFIG["paths"]["post_new_path"] + "/" + kpage.krake_handle;
      var method = "PUT";
    }

    $.ajax({
      method: method,
      url: post_url,
      headers: {
        "Authorization": "Bearer " + self.oauth_token
      },
      data: payload
    }).done(function(data) {
      if(data["handle"]) {
        kpage.krake_handle = data["handle"];
        deferred.resolve();
      } else {
        deferred.reject();
      }
    });    
  });
  return deferred.promise();   
}

KTabController.saveGatheredData = function(data_obj, tab_obj) {
  var self = this;
  var kpage       = new KPage.find({ id: data_obj.page_id })[0];  

  KTabController.setOauthToken().then(function() {
    return KTabController.updateDataSourceOnServer(data_obj, tab_obj);

  }).then(function() {
    var post_url = CONFIG["server_host"] + CONFIG["paths"]["publish_data_path"];
    post_url = post_url.replace("{{krake_handle}}", kpage.krake_handle)
    $.ajax({
      method: "POST",
      url: post_url,
      headers: {
        "Authorization": "Bearer " + self.oauth_token
      },
      data: {
        batches: data_obj.gathered_data,
        format: "json"
      }
    }).done(function(data) {

      // Recording the download      
      kpage.batch_id = data_obj.batch_id = data.batch.id;
      kpage.download_count = data_obj.gathered_data.length;
      data_obj.download_format = data_obj.download_format || "not_set";
      // KTabController.recordDownload(data_obj, tab_obj);

      // Redirect to the data source page
      var data_path = CONFIG["server_host"] + CONFIG["paths"]["data_path"] + "?page_id=" + data_obj.page_id;
      data_path = data_path.replace("{{krake_handle}}", data.krake.handle);
      Env.redirectTo(tab_obj.id, data_path);


    });    
  })

  var response      = {}
  response.status   = "success";
  return response;
}


KTabController.saveGatheredDataAndDisplayPopUp = function(data_obj, tab_obj) {
  var self = this;
  var kpage       = new KPage.find({ id: data_obj.page_id })[0];  

  KTabController.setOauthToken().then(function() {
    return KTabController.updateDataSourceOnServer(data_obj, tab_obj);

  }).then(function() {
    CrawlerController.displayDownloadPanel(data_obj, tab_obj);
    var post_url = CONFIG["server_host"] + CONFIG["paths"]["publish_data_path"];
    post_url = post_url.replace("{{krake_handle}}", kpage.krake_handle)
    $.ajax({
      method: "POST",
      url: post_url,
      headers: {
        "Authorization": "Bearer " + self.oauth_token
      },
      data: {
        batches: data_obj.gathered_data,
        format: "json"
      }
    }).done(function(data) {
      kpage.batch_id = data_obj.batch_id = data.batch.id;
      kpage.download_count = data_obj.gathered_data.length;
      data_obj.download_format = "popup";
      KTabController.recordDownload(data_obj, tab_obj);
    });    
  })


  var response      = {}
  response.status   = "success";
  return response;
}

KTabController.recordDownload = function(data_obj, tab_obj) {
  var self = this;
  var post_url  = CONFIG["server_host"] + CONFIG["paths"]["record_download_path"];
  var kpage     = new KPage.find({ id: data_obj.page_id })[0];  
  $.ajax({
    method: "POST",
    url: post_url,
    headers: {
      "Authorization": "Bearer " + self.oauth_token
    },
    data: {
      batch_id: kpage.batch_id,
      download_count: kpage.download_count,
      krake_handle: kpage.krake_handle,
      status: data_obj.download_status,
      download_format: data_obj.download_format,
      format: "json"
    }
  }).done(function(data) {});      
};


KTabController.deactivate = function(data_obj, tab_obj) {
  var kwin = new KTab(tab_obj.id);
  if(kwin.isActive()) {
    kwin.deactivate();
    BrowserIconView.deactivate();
    Application.msg_controllers.mixpanel.trackExtensionDeactivation();
  }
}


/** Export for node testing **/
try { 
  module && (module.exports = KTabController); 
} catch(e){}