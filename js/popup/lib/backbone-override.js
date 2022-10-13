/** 
  Overriding of default Backbone.sync method to call wrapper method which 
  communicates with Background.JS to get Data from the background
**/
Backbone.sync = function (method, model, options) {
  options || (options = {});
  method        = options.method || method;
  var data      = options.data || {};
  var deferred  = $.Deferred();

  var payload = {};
  payload["controller"] = model.url;
  payload["method"]     = method;
  payload["sessionStartTime"]  = Application.sessionStartTime;
  payload["requestTime"]  = Application.sessionStartTime;

  switch(method) {
    case "compile"  :
    case "read"     :
      payload["args_array"] = [data];
      break;

    case "delete"   :
    case "update"   :
    case "new"      :
    case "create"   :
      payload["args_array"] = [Object.assign(model.attributes, data)];
      break;

    default         :
      payload["args_array"] = [data];
  }

  // Sends the message to the content window - Crawling situation
  if(model.destination == "content" && model.tab_id) {
    Env.sendMessageToTab(model.tab_id, payload, function(response) {
      if(!response) {
        options.success([]);
        deferred.resolve([]);

      } else if(response.status == "success") {
        options.success(response.data);
        deferred.resolve(response.data);

      } else if(response.status == "error") {
        console.log(response.err_msg);
        options.error(response.err_msg);
        deferred.reject(response.err_msg);
      }
    });

  // Sends message to background
  } else if (model.destination == "background") {
    Env.sendMessageToBackground(payload, function(response) {
      if(response.status == "success") {
        options.success(response.data);
        deferred.resolve(response.data);

      } else if(response.status == "error") {
        console.log(response.err_msg);
        options.error(response.err_msg);
        deferred.reject(response.err_msg);
      }
    });

  }
  
  
  return deferred.promise();

};