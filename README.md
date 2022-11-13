# Cypher Defense 

## Introduction 
This is a project to help protect DAO members from the prevalent scam, impersonation and phishing attacks that are happening in the Web3 space


## Use cases
Allow members to flag and get warned on any of the following

  - A potentially fradulent DApp
  - A potentially fradulent NFT mint page 
  - A potentially fradulent NFT open sea listing
  - [LinkedIn](https://linkedin.com) Account impersonation
  - [Instagram](https://instagram.com/) Account impersonation
  - [Twitter](https://twitter.com) Account impersonation
  - [Discord](https://discord.com/app) Account impersonation
  - [Telegram](https://web.telegram.org/?legacy=1#/im) Account impersonation


## RoadMap

- 20221104 - receive warning of fradulent DApp


## Sample payload from Blockchain
```
[
  {
    "type": "domain",
    "value": "metaversegold.space",
    "status": "blacklisted"
  },
  {
    "type": "domain",
    "value": "atoplatform.com",
    "status": "blacklisted"
  },  
  {
    "type": "person",
    "network": "linkedin.com",
    "value": "carrie-eldridge-57204516",
    "status": "blacklisted"
  },
  {
    "type": "nft",
    "network": "opensea.io",
    "value": "https://opensea.io/assets/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/92576773502308227007783329158296328196738822351079709811986613407507430768641",
    "status": "blacklisted"
  }
]
```

## Pre-requisites
utilizes handlebar

Installing handlbars
```
npm install -g handlebars
```

Precompiles the templates
```
cd js/content/templates

handlebars sidebar.hbs -f sidebar.hbs.precompiled.js
handlebars column.hbs -f column.hbs.precompiled.js
handlebars community_icon.hbs -f community_icon.hbs.precompiled.js
handlebars listing_panel_column.hbs -f listing_panel_column.hbs.precompiled.js
handlebars listing_panel_recommended_column.hbs -f listing_panel_recommended_column.hbs.precompiled.js
handlebars recommended_panel_column.hbs -f recommended_panel_column.hbs.precompiled.js
handlebars introduction_modal.hbs -f introduction_modal.hbs.precompiled.js
handlebars notification_panel.hbs -f notification_panel.hbs.precompiled.js
handlebars notification_save_panel.hbs -f notification_save_panel.hbs.precompiled.js

```