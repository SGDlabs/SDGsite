-- LGPD: the contact form asks the visitor to accept the privacy policy; the lead keeps when.
alter table public.leads add column consent_at timestamptz;
