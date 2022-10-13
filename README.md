# Krake Browser extension
## Introduction 

This is the source code for the Krake browser extension in Google Chrome.

To download and test run the currently publish version go to the 
[Chrome Extension Gallery](https://chrome.google.com/webstore/detail/krakeio/ofncgcgajhgnbkbmkdhbgkoopfbemhfj "Krake Browser Extension")

To check out the online engine go to
[Krake.IO](https://getdata.io "Data Harvesting")

## Unit testing
Background.Js portion of Chrome browser extension. This section of the browser extension deals with all the business logic that goes into
managing, transforming and storage the schematic data
```console
jasmine-node coffee spec_j
```

Inline code debugging for Jasmine-node
```
pry = require('pryjs')
eval(pry.it)
```


Content.JS portion of Chrome browser extension. This section of the browser extension deals with all the DOM related interactions that is 
required for defining the data to crawl
```console
phantom-jasmine spec_p/specs.html
```

Content.Js portion of Chrome browser extension. This section of the browser extension deals with the user trigger events within a Window
```console
open spec_p/runner.html
```

## Backlog
#### To Do list
  - TODO : To capture meta description content and use as description for Krake
  - TODO : Clean up the nested COOKIES none-sense
  - TODO : Ability to toggle bar at the bottom between visibility and non-visibility

# Documentation
This is how this browser extension stores a single Shared Kraked data object for a page in the background.

    {
      
      // The page this Krake definition is mapping to
      "origin_url": "http://sg.yahoo.com/?p=us",
            
      // some_urls_within_the_same_shared_krakes_object
      "parent_url" : "arbitrary_string",
      
      // maps_to_categoryId_in_parent_shared_krakes
      "parent_columnId" : "arbitrary_string",
      
      // The xpath to utilize in the event there is a next page
      next_page : {
        "xpath" : "arbiturary_string"
      },
      
      // Page title
      page_title : "arbiturary_string",
      
      // cookies
      "cookies" : [{
          "domain": ".imdb.com",
          "expirationDate": 1535023661.151548,
          "hostOnly": false,
          "httpOnly": false,
          "name": "session-id",
          "path": "/",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "448-7368846-1611791"
      },
      {
          "domain": ".imdb.com",
          "expirationDate": 1535023661.15161,
          "hostOnly": false,
          "httpOnly": false,
          "name": "session-id-time",
          "path": "/",
          "secure": false,
          "session": false,
          "storeId": "0",
          "value": "1535048846"
      }],
      
      // The columns of data
      "columns": [
          {
              "columnId": 5452399814,
              "columnName": "category name",
              "colorCode": " k_highlight_FFCC00 ",
              "url": "http://sg.yahoo.com/?p=us",
              "selections" : [{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "Messenger",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              },{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[3]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "News",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              },{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[3]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "News",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              }],              
              "genericAncestorLinkXpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li/a[1]",
              "genericXpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li/a[1]/span[2]",
              "requiredAttribute": null
          },
          {
              "columnId": 5554264208,
              "columnType": "list",
              "columnName": "category icon",
              "colorCode": " k_highlight_FF6600 ",
              "url": "http://sg.yahoo.com/?p=us",
              "selections" : [{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "Messenger",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              },{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[3]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "News",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              },{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[3]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "News",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              }],              
              "genericAncestorLinkXpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li/a[1]",              
              "genericXpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li/a[1]/span[1]/img[1]",
              "requiredAttribute": "src"
          },
          {
              "columnId": 734958031,
              "columnType": "single",
              "columnName": "header",
              "colorCode": " k_highlight_3EA99F ",
              "url": "http://sg.yahoo.com/?p=us",
              "selections" : [{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "Messenger",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              },{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[3]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "News",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              },{
                  "xpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[3]/a[1]/span[2]",
                  "elementType": "SPAN",
                  "elementText": "News",
                  "elementLink": null,
                  "ancestorLinkXpath" : "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li[2]/a[1]"
              }],
              "genericAncestorLinkXpath": "/html[1]/body[1]/div/div[4]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/ol[1]/li/a[1]",              
              "genericXpath": "/html[1]/body[1]/div/div[4]/div[3]/div[5]/div[1]/div[1]/div[1]/div[1]/ul[1]/li[1]/div[1]/div[1]/div[1]/div[1]/div[1]/h2[1]",
              "requiredAttribute": null
          }
      ]
    }