create
or replace function update_user_metadata (uid uuid, value jsonb) returns text language plpgsql as $$
    begin
        update auth.users
        set raw_user_meta_data = raw_user_meta_data || value
        where id = uid;
        return 'ok';
    end;
$$;
