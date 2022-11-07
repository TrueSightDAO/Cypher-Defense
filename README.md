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