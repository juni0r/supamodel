insert into
  public.records (
    given_name,
    family_name,
    email,
    date_of_birth,
    score,
    data
  )
values
  (
    'Stella',
    'Goldbacke',
    'stella@mail.com',
    '2001-02-01',
    4395627846735478384,
    '{"mehr":"info", "viele":"inhalte", "neue":"sichtweisen"}'::jsonb
  ),
  (
    'Tom',
    'Unfried',
    'tom@mail.com',
    '1989-09-11',
    6309018409120687410,
    '"{}"'::jsonb
  );