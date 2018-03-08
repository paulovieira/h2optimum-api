
CREATE OR REPLACE FUNCTION insert_measurements(data jsonb)
RETURNS SETOF t_measurements
AS $fn$

DECLARE
new_row t_measurements%rowtype;
query text;

-- variables for input data
_client_code text;

BEGIN

IF  jsonb_typeof(data) = 'object' THEN
    data := jsonb_build_array(data);
END IF;


for new_row in (select * from jsonb_populate_recordset(null::t_measurements, data)) loop

    insert into t_measurements(
        device_id, 
        sid,
        type,
        val,
        description,
        version
    )
    values (
        new_row.device_id,
        new_row.sid,
        new_row.type,
        new_row.val,
        new_row.description,
        new_row.version
    )
    returning * 
    into strict new_row;

    return next new_row;

end loop;

return;

END;
$fn$
LANGUAGE plpgsql;


/*
select * from insert_measurements('

  {
    "device_id": "08:00:2b:01:02:03",
    "sid": 1,
    "type": "h",
    "val": 20.1,
    "description": "desc",
    "version": 2
  }

');


select * from insert_measurements(' 
[
  {
    "device_id": "08:00:2b:01:02:03",
    "sid": 1,
    "type": "h",
    "val": 20.2,
    "description": "desc",
    "version": 3
  },
  {
    "device_id": "08:00:2b:01:02:03",
    "sid": 1,
    "type": "b",
    "val": 412
  }

]
');
*/