var FULL_CONFIG = {
  development: {
    default_engine: "chrome",
    sidebar_width: 320,
    sidebar_height: 540,
    mixpanel_key:  "",
    oauth_client_id: "",
    bugsnag_key: "",
    version:       Env.getVersion(),
    active_icon:   "/images/cypher_icon_24_warning.png",
    inactive_icon: "/images/cypher_icon_24_disabled.png",
    validated_icon: "/images/cypher_icon_24_validated.png",
    server_host:   "http://localhost:3000",
    blowfish_host:   "http://localhost:3000",
    paths: {
      flag_path:        "/domains/flag",
      create_new_path:  "/data-sources/new",
      sign_in:          "/members/sign_in",
      sign_up:          "/members/sign_up",
      session_status:   "/members/session",
      muuid_path:       "/muuid",
      session_status_path: "/extension_session",      
      logged_in_holding_path: "/extension_logged_in",
      oauth_token_path: "/oauth_token",
      post_new_path:  "/data-sources",
      uninstall_path: "/extension_uninstalled",
      autoclose_path: "/extension_autoclose",
      upgrade_path: "/extension_upgrade",
      data_path: "/data-sources/{{krake_handle}}/",
      data_edit_path: "/data-sources/{{krake_handle}}/edit",
      publish_data_path: "/data-sources/{{krake_handle}}/publish_batch/",
      record_download_path: "/downloads/track"
    }    
  },
  production: {
    default_engine: "chrome",
    sidebar_width: 320,
    sidebar_height: 540,
    mixpanel_key:  "",
    oauth_client_id: "",
    bugsnag_key: "",
    version:       Env.getVersion(),
    active_icon:   "/images/cypher_icon_24_warning.png",
    inactive_icon: "/images/cypher_icon_24_disabled.png",
    validated_icon: "/images/cypher_icon_24_validated.png",
    server_host:   "https://truesight.me",
    blowfish_host:   "http://localhost:3000",
    paths: {
      flag_path:        "/domains/flag",      
      create_new_path:  "/data-sources/new",    
      sign_in:          "/members/sign_in",
      sign_up:          "/members/sign_up",
      session_status:   "/members/session",
      muuid_path:       "/muuid",
      session_status_path: "/extension_session",      
      logged_in_holding_path: "/extension_logged_in",
      oauth_token_path: "/oauth_token",
      post_new_path:  "/data-sources",
      uninstall_path: "/extension_uninstalled",
      autoclose_path: "/extension_autoclose",
      upgrade_path: "/extension_upgrade",
      data_path: "/data-sources/{{krake_handle}}/",
      data_edit_path: "/data-sources/{{krake_handle}}/edit",
      publish_data_path: "/data-sources/{{krake_handle}}/publish_batch/",
      record_download_path: "/downloads/track"
    }    
  }
};

/** Determines which mode this extension is ran in **/
var CONFIG = FULL_CONFIG.production;
// var CONFIG = FULL_CONFIG.development;

CONFIG.path_disabled_patterns = [
  "http://localhost:3000", // TODO - disable before release
  "https://getdata.io",
  "linkedin.com.*uas.*",
  "github.com.*oauth.*authorize",
  "accounts.google.com.*signin",
  "accounts.google.com.*ServiceLogin",
  "accounts.google.com.*oauth2.*auth"
]

/** Export for node testing **/
try { 
  module && (module.exports = CONFIG); 
} catch(e){}