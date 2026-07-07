/** Dummy DATABASE_URL so unit tests can import modules without a live Neon connection. */
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/mpconnect_test";
