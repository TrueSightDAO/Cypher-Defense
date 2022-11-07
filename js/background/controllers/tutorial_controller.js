var TutorialController = {};

TutorialController.start = function(data_obj, tab_obj) {
  var ktab       = new KTab(tab_obj.id, data_obj.top, data_obj.right);
  ktab.activate();
  BrowserIconView.blacklisted();
  Application.msg_controllers.mixpanel.trackExtensionActivation();  

  response        = {}
  response.status = "success";  
  return response;
}


/** Export for node testing **/
try { 
  module && (module.exports = TutorialController); 
} catch(e){}