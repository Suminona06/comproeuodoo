-- Standardize company_name and fallback meta titles to PT Euodoo Plastic.
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES ('company_name', 'PT Euodoo Plastic') ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES ('meta_title_id', 'PT Euodoo Plastic - Manufaktur Kantong Plastik Ramah Lingkungan 100% Degradable') ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES ('meta_title_en', 'PT Euodoo Plastic - 100% Degradable Eco-Friendly Plastic Bag Manufacturer') ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
