# !! PROJECT NO LONGER MAINTAINED !!

## Disclaimer
This project is not maintained anymore starting Sep 2023. The source code and documentation in this repository 
are for reference purposes only. The Finnish Digital Agency does not encourage the use of this code for any purpose,
takes no responsibility if you decide to use the code for any purpose and provides no support whatsoever related to this project.



# AuroraAI Core Components ARCHIVED PROJECT DESCRIPTION BELOW

## Overview
The National Artificial Intelligence Programme AuroraAI is based on the strategic objective of building a dynamic 
and thriving Finland expressed in Prime Minister Marin’s Government Programme. 
The AuroraAI network developed in the programme will promote smoothly running daily life and business securely and 
in an ethically sustainable manner.

The Digital and Population Data Services Agency (The Finnish Digital Agency) is responsible for the implementation 
and maintenance of the core components of the AuroraAI network.
The Finnish Digital Agency will implement a technical platform that 
forms the backbone network of artificial intelligence.

The purpose of this repository is to publish the source code of the AuroraAI core components as open source.
The source code is published for evaluation and reference purposes only. 
The Finnish Digital Agency does not provide support for building or running these services outside
the agency.

## Public Documentation
Finnish language documentation of AuroraAI Core Components can be found in 
the [public wiki](https://wiki.dvv.fi/display/AAIJD/AuroraAI-verkon+kuvaus).

## Main Components
The AuroraAI Core Components consists of multiple microservices. Overview of
each microservice and links to more detailed documentation can be found in the service specific 
READMEs listed below:

- [service-recommender-api](recommender_api/README.md)
- [ptv-data-loader](recommender_api/ptv_data_loader/README.md)
- [profile-management](profile_management/README.md)
- [api-doc](api_doc/README.md)
- [demo-ui](demo_ui/README.md)

## AuroraAI Profile Management No Longer Maintained

The Finnish Digital Agency has decided to end hosting the AuroraAI
Profile Management service where end users were able to create AuroraAI
accounts and share user attributes in AuroraAI network.

The last version of the Profile Management service source code is available in
the branch [release/1.2.0](https://github.com/vrk-kpa/auroraai-core-components/tree/release/1.2.0)

The Profile Management source code will be removed from the master branch in upcoming releases.
