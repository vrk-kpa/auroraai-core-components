# AuroraAI Profile Management Mock Service
This service is used by AuroraAI core components team to test AurorAI Profile Management feature.

The source code is shared so that other AuroraAI project teams can use it as a rough example on how to connect 
an AuroraAI service with the Profile Management. 
Core component team will not provide support on running this code outside AuroraAI core environment.

As the main purpose of mock service is to act as a testing tool, 
the implementation is by no means producrtion ready. 
For example the service has no persistent data store, all sessions are stored in a memory-store.

Probably the most useful file to check for teams planning to integrate with Profile Management is `server.ts` 
that implements the backend integrations.
