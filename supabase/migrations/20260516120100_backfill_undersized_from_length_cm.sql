update catches
set undersized = (length_cm is null or length_cm < 40);
