-- Migration 025: Restore 'ditolak' status value on inquiries.status ENUM
ALTER TABLE inquiries
  MODIFY COLUMN status ENUM('baru', 'dibaca', 'ditindaklanjuti', 'ditolak') DEFAULT 'baru';
