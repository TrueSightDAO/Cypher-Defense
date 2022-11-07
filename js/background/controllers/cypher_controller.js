var CypherController = {};

CypherController.info = function(data_obj, tab_obj) {


  response = {
    status: "what to do!!!"
  }

  switch(Domain.status(data_obj.url)) {
    case "blacklisted":
      response["status"] = "blacklisted";
      break;

    case "verified":
      response["status"] = "verified";
      break;

    default:
      response["status"] = "deactivate";
  }  
  return response;
}