# AuroraAI attributes-management microservice

## Overview
Sharing user attribute data among services in AuroraAI network is one of the
main goals of the AuroraAI project. A universal data-model of the attributes supported in the
AuroraAI network is defined in https://tietomallit.suomi.fi/model/aurora-att/
This model is maintained by the AuroraAI core team.

The attributes-management microservice provides an API that the AuroraAI service can use to access the attribute 
data model conveniently. AuroraAI services use this API to validate and localize the
user attributes passed in the service network.
