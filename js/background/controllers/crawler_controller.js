var CrawlerController = {};

CrawlerController.displayDownloadPanel = function(data_obj, tab_obj) {
  var page_id = data_obj.page_id;
  var tab_id = tab_obj.id;
  var popup_page_url = Env.filePath("html/popup.html?tabid=" + tab_id + "&page_id=" + page_id);
  CrawlerController.popupCenter(popup_page_url, "GetData", 720, 650)      
}


CrawlerController.popupCenter = function(url, title, w, h) {
  // Fixes dual-screen position                             Most browsers      Firefox
  dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
  dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;

  width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

  systemZoom = width / window.screen.availWidth;
  left = (width - w) / 2 / systemZoom + dualScreenLeft
  top = (height - h) / 2 / systemZoom + dualScreenTop

  var new_window = window.open(url, title,'directories=no,titlebar=no,toolbar=no,location=no,statusbar=0,status=no,menubar=no,scrollbars=no,resizable=no,width=' + w + ',height=' + h + ',top=' + top + ',left=' + left);
  if (window.focus) new_window.focus();
  return new_window;
}
