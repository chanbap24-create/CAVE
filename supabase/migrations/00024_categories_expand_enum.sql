-- Extend spirit_category enum with the two new consolidated values.
-- This MUST run as its own migration because Postgres forbids using a newly
-- added enum value in other statements within the same transaction.
-- Data migration and CHECK-constraint updates live in 00025.

alter type spirit_category add value if not exists 'spirit';
alter type spirit_category add value if not exists 'traditional';
