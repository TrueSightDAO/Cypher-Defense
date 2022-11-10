var CypherController = {};

CypherController.info = function(data_obj, tab_obj) {


  response = {
    status: "what to do!!!"
  }

  switch(Domain.status(data_obj.url)) {
    case "blacklisted":
      response["status"] = "blacklisted";
      var details = Domain.details(data_obj.url)
      response["flagger"]     = details["flagger"];
      response["validator"]   = details["validator"];
      break;

    case "verified":
      response["status"] = "verified";
      break;

    default:
      response["status"] = "deactivate";
  }  
  return response;
}
