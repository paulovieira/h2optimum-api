DO $$

DECLARE
patch_exists int := _v.register_patch('create_timescale', '');

BEGIN

IF patch_exists THEN
    RETURN;
END IF;

/*** BEGIN CODE FOR CHANGES  ***/

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

/*** END CODE FOR CHANGES  ***/

END;
$$;


