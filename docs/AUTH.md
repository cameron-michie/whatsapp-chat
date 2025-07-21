I now want you to implement an auth mechanism using Clerk. I want the basic flow to be this:
1. A user is asked to log-in to Clerk.
2. Credentials are returned to the webpage with details about their own userId and Name, accessed via Clerk react hooks
3. Authenticate with Ably using .env API key, but assign the Clerk userId to the Ably clientId (note only the ChatProvider requires a clientId).
4. Use this to get the appropriate LiveObjects notifications channel
5. You can use these api keys for Clerk 

   1   │ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVzb2x2ZWQtYmx1ZWdpbGwtMzguY2xlcmsuYWNjb3
       │ VudHMuZGV2JA
   2   │ CLERK_SECRET_KEY=sk_test_ftBNgpuaoN2nm17SginysDJlNcSFWu7tgbwyqPBhaE

6. have the ability to access the current userId using Clerk useUser() hook.
