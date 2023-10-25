create table
  user_details (
    id bigint primary key generated always as identity,
    user_id uuid not null,
    resource_name text,
    given_name text default '',
    family_name text default '',
    phone_number text default '',
    street_address text default '',
    extended_address text default '',
    postal_code text default '',
    city text default '',
    birthday date,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

create
or replace function create_details_for_new_user () returns trigger language plpgsql as $$
    begin
     insert into user_details (user_id)
     values (NEW.id);
     return new;
    END;
$$;

create
or replace function update_user_metadata_from_details () returns trigger language plpgsql as $$
    begin
      perform update_user_metadata(
        NEW.user_id,
        json_build_object(
          'givenName', NEW.given_name,
          'familyName', NEW.family_name
        )::jsonb
      );
      RETURN NEW;
    end;
$$;

create trigger create_for_new_user
after insert on auth.users for each row
execute procedure create_details_for_new_user ();

create trigger update_user_metadata
after
update on user_details for each row
execute procedure update_user_metadata_from_details ();
