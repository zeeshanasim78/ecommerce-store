-- v1.12 owner decision: customers send the payment slip within 24 hours (v1.11 used 48).
-- Only the v1.11 default is changed; a value the owner set in Shop settings is kept.
UPDATE `settings` SET `value` = '1440', `updated_at` = CURRENT_TIMESTAMP WHERE `key` = 'manual_tid_ttl_minutes' AND `value` = '2880';
