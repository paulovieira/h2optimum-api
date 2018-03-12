
CREATE OR REPLACE FUNCTION read_measurements(options jsonb)
RETURNS SETOF t_measurements
AS $fn$

DECLARE

query text;

-- variables for options
_period int;

BEGIN

_period := COALESCE((options->>'period')::int, 12);

-- the main query starts here

query := $$

select * from t_measurements
where now() - ts < '%s hours'
order by ts desc;

$$;

query := format(query, _period);

RETURN QUERY EXECUTE query;

RETURN;

END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_measurements('
{
    "period": 24
}
')

*/