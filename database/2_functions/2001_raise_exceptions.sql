
-- auxiliary function used to throw an exception when arguments are missing
-- NOTE: this function is also defined in the sql scripts of the app code
CREATE OR REPLACE FUNCTION  raise_exception_invalid_or_missing_args(function_name text, arg_name text)
RETURNS void 
AS $fn$

BEGIN

RAISE EXCEPTION USING 
    ERRCODE = 'plpgsql_error',
    MESSAGE = format('function %s was called with missing or invalid arguments (%s)', function_name, arg_name);

END;

$fn$
LANGUAGE plpgsql;
