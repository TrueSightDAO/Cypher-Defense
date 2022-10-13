global.chrome = {}
chrome.runtime = {}
chrome.runtime.getManifest = ()->
  { version: "STUBBED" }

chrome.tabs = {}
chrome.tabs.getSelected = ()->

chrome.tabs.sendMessage = ()->

global.Env = {};

Env.getSelectedTab = (query, callback)->

Env.setIcon = (img_path)->

Env.sendMessage = (tab_id, payload, callback)->

Env.getVersion = ->
  "test version"

Env.registerListener = (event_type, listener)->

Env.getCookies = (domain, callback)->
  callback?([])


Env.fetchCurrentTab = (callback)->
  callback({})


Env.fetchHostName = (url)->
  if !url 
    return null
  hostname

  if (url.indexOf("//") > -1)
      hostname = url.split('/')[2];
  else
      hostname = url.split('/')[0];
  hostname = hostname.split(':')[0];
  hostname = hostname.split('?')[0];

  return hostname;

Env.setIconText = (text)->
  return