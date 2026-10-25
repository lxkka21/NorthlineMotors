# Backend configuration

The backend loads the existing root `supa.env` server-side for Supabase connectivity. Its
`SUPABASE_SECRET_KEY` is privileged and must never be sent to the browser or exposed through a
`VITE_` variable.

Authentication uses a separate application signing secret. Set `JWT_SECRET` to a randomly
generated value of at least 32 characters in the backend's ignored environment configuration or
deployment secret store. Do not reuse `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, or any
other Supabase credential as the JWT secret. `JWT_EXPIRES_IN_SECONDS` controls access-token expiry
and defaults to 3600 seconds.

