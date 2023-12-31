SET
  statement_timeout=0;

SET
  lock_timeout=0;

SET
  idle_in_transaction_session_timeout=0;

SET
  client_encoding='UTF8';

SET
  standard_conforming_strings=ON;

SELECT
  pg_catalog.set_config ('search_path', '', FALSE);

SET
  check_function_bodies=FALSE;

SET
  xmloption=CONTENT;

SET
  client_min_messages=warning;

SET
  row_security=OFF;

CREATE EXTENSION IF NOT EXISTS "pg_net"
WITH
  SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium"
WITH
  SCHEMA "pgsodium";

CREATE EXTENSION IF NOT EXISTS "moddatetime"
WITH
  SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pg_graphql"
WITH
  SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"
WITH
  SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto"
WITH
  SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt"
WITH
  SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault"
WITH
  SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
WITH
  SCHEMA "extensions";

CREATE
OR REPLACE FUNCTION "public"."delete_claim" ("uid" "uuid", "claim" "text") RETURNS "text" LANGUAGE "plpgsql" SECURITY DEFINER
SET
  "search_path" TO 'public' AS $$
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN 'error: access denied';
      ELSE
        update auth.users set raw_app_meta_data =
          raw_app_meta_data - claim where id = uid;
        return 'OK';
      END IF;
    END;
$$;

ALTER FUNCTION "public"."delete_claim" ("uid" "uuid", "claim" "text") OWNER TO "postgres";

CREATE
OR REPLACE FUNCTION "public"."get_claim" ("uid" "uuid", "claim" "text") RETURNS "jsonb" LANGUAGE "plpgsql" SECURITY DEFINER
SET
  "search_path" TO 'public' AS $$
    DECLARE retval jsonb;
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN '{"error":"access denied"}'::jsonb;
      ELSE
        select coalesce(raw_app_meta_data->claim, null) from auth.users into retval where id = uid::uuid;
        return retval;
      END IF;
    END;
$$;

ALTER FUNCTION "public"."get_claim" ("uid" "uuid", "claim" "text") OWNER TO "postgres";

CREATE
OR REPLACE FUNCTION "public"."get_claims" ("uid" "uuid") RETURNS "jsonb" LANGUAGE "plpgsql" SECURITY DEFINER
SET
  "search_path" TO 'public' AS $$
    DECLARE retval jsonb;
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN '{"error":"access denied"}'::jsonb;
      ELSE
        select raw_app_meta_data from auth.users into retval where id = uid::uuid;
        return retval;
      END IF;
    END;
$$;

ALTER FUNCTION "public"."get_claims" ("uid" "uuid") OWNER TO "postgres";

CREATE
OR REPLACE FUNCTION "public"."get_my_claim" ("claim" "text") RETURNS "jsonb" LANGUAGE "sql" STABLE AS $$
  select
  	coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' -> claim, null)
$$;

ALTER FUNCTION "public"."get_my_claim" ("claim" "text") OWNER TO "postgres";

CREATE
OR REPLACE FUNCTION "public"."get_my_claims" () RETURNS "jsonb" LANGUAGE "sql" STABLE AS $$
  select
  	coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata', '{}'::jsonb)::jsonb
$$;

ALTER FUNCTION "public"."get_my_claims" () OWNER TO "postgres";

CREATE
OR REPLACE FUNCTION "public"."is_claims_admin" () RETURNS BOOLEAN LANGUAGE "plpgsql" AS $$
  BEGIN
    IF session_user = 'authenticator' THEN
      --------------------------------------------
      -- To disallow any authenticated app users
      -- from editing claims, delete the following
      -- block of code and replace it with:
      -- RETURN FALSE;
      --------------------------------------------
      IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        return false; -- jwt expired
      END IF;
      If current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
        RETURN true; -- service role users have admin rights
      END IF;
      IF coalesce((current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->'claims_admin', 'false')::bool THEN
        return true; -- user has claims_admin set to true
      ELSE
        return false; -- user does NOT have claims_admin set to true
      END IF;
      --------------------------------------------
      -- End of block
      --------------------------------------------
    ELSE -- not a user session, probably being called from a trigger or something
      return true;
    END IF;
  END;
$$;

ALTER FUNCTION "public"."is_claims_admin" () OWNER TO "postgres";

CREATE
OR REPLACE FUNCTION "public"."set_claim" ("uid" "uuid", "claim" "text", "value" "jsonb") RETURNS "text" LANGUAGE "plpgsql" SECURITY DEFINER
SET
  "search_path" TO 'public' AS $$
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN 'error: access denied';
      ELSE
        update auth.users set raw_app_meta_data =
          raw_app_meta_data ||
            json_build_object(claim, value)::jsonb where id = uid;
        return 'OK';
      END IF;
    END;
$$;

ALTER FUNCTION "public"."set_claim" ("uid" "uuid", "claim" "text", "value" "jsonb") OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";

GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."delete_claim" ("uid" "uuid", "claim" "text") TO "anon";

GRANT ALL ON FUNCTION "public"."delete_claim" ("uid" "uuid", "claim" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."delete_claim" ("uid" "uuid", "claim" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_claim" ("uid" "uuid", "claim" "text") TO "anon";

GRANT ALL ON FUNCTION "public"."get_claim" ("uid" "uuid", "claim" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_claim" ("uid" "uuid", "claim" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_claims" ("uid" "uuid") TO "anon";

GRANT ALL ON FUNCTION "public"."get_claims" ("uid" "uuid") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_claims" ("uid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_my_claim" ("claim" "text") TO "anon";

GRANT ALL ON FUNCTION "public"."get_my_claim" ("claim" "text") TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_my_claim" ("claim" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_my_claims" () TO "anon";

GRANT ALL ON FUNCTION "public"."get_my_claims" () TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_my_claims" () TO "service_role";

GRANT ALL ON FUNCTION "public"."is_claims_admin" () TO "anon";

GRANT ALL ON FUNCTION "public"."is_claims_admin" () TO "authenticated";

GRANT ALL ON FUNCTION "public"."is_claims_admin" () TO "service_role";

GRANT ALL ON FUNCTION "public"."set_claim" ("uid" "uuid", "claim" "text", "value" "jsonb") TO "anon";

GRANT ALL ON FUNCTION "public"."set_claim" ("uid" "uuid", "claim" "text", "value" "jsonb") TO "authenticated";

GRANT ALL ON FUNCTION "public"."set_claim" ("uid" "uuid", "claim" "text", "value" "jsonb") TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
GRANT ALL ON TABLES TO "service_role";

RESET ALL;
