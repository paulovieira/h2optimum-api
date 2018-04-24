
CREATE OR REPLACE FUNCTION read_measurements(options jsonb)
RETURNS SETOF t_measurements
AS $fn$

DECLARE

query text;

-- variables for options
_period int;
_from_date timestamptz;
_to_date timestamptz;
_device_mac macaddr;
_order text;
_wildcard text;

BEGIN


_period := COALESCE((options->>'period')::int);
_from_date := COALESCE((options->>'fromDate')::timestamptz);
_to_date := COALESCE((options->>'toDate')::timestamptz);
_device_mac := COALESCE((options->>'deviceMac')::macaddr); 
_order := lower(COALESCE((options->>'order')::text, 'asc'));
_wildcard := 'false';

if _order != 'asc' and _order != 'desc' then
	PERFORM raise_exception_invalid_or_missing_args('read_measurements');
end if;

if _device_mac is null then
	PERFORM raise_exception_invalid_or_missing_args('read_measurements');
end if;

-- special mac address to by pass the where 'device_mac = ...'
if _device_mac = '12:34:56:ab:cd:ef' then
	_wildcard := 'true';
end if;

-- the main query starts here

-- TODO: don't use a dynamic query

if _period is not null then

	query := $$

	select * from t_measurements
	where 
		now() - ts < '%s hours' and
		(device_id = '%s' or %s)
	order by ts %s;

	$$;

	query := format(query, _period, _device_mac, _wildcard, _order);
	raise notice '%', query;

elseif (_from_date is not null and _to_date is not null) then

	query := $$

	select * from t_measurements
	where 
		ts > '%s' and ts < '%s' and
		(device_id = '%s' or %s)
	order by ts %s;

	$$;

	query := format(query, _from_date, _to_date, _device_mac, _wildcard, _order);
	raise notice '%', query;

else

	PERFORM raise_exception_invalid_or_missing_args('read_measurements');

end if;


RETURN QUERY EXECUTE query;

RETURN;

END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_measurements('
{
	"deviceMac": "00:01:02:03:04:05",
	"period": 1000
}
')

-- default order is asc, but can be changed
-- the mac address can be given in any format

select * from read_measurements('
{
	"deviceMac": "00-01-02-03-04-05"
	"period": 1,
	"order": "desc"
}
')


-- special mac address to bypass the condition "where device_mac = ..."

select * from read_measurements('
{
	"deviceMac": "12:34:56:ab:cd:ef",
	"period": 1000
}
')

-- instead of last N hours, we can ask for data withing a given period

select * from read_measurements('
{
	"deviceMac": "00-01-02-03-04-05",
	"fromDate": "2018-03-13",
	"toDate": "2018-03-14 8:00:00"
}
')

*/
