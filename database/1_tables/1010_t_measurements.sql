DO $$

DECLARE
patch_exists int := _v.register_patch('create_table_measurements', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

create table t_measurements(
    ts timestamptz not null default now(),
	device_id macaddr not null,  -- TODO: change to device_mac, because in other tables we have device_id as int
    sid smallint, 
    type text not null,  -- TODO: change to smallint
    val real not null,
    description text,
    version smallint
);

alter table t_measurements
add column installation_id int references t_installations(id) default null on delete cascade;


-- timescale hypertable; we are not using space partioning at the moment; see
-- http://docs.timescale.com/v0.9/api#create_hypertable-best-practices

PERFORM create_hypertable('t_measurements', 'ts');


/*** END CODE FOR CHANGES  ***/

END;
$$;


