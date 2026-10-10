-- Migration: 005_support_youtube_banner_media_type.sql
-- Description: Tambahkan 'youtube' ke ENUM media_type pada tabel banners

ALTER TABLE banners MODIFY COLUMN media_type ENUM('image', 'video', 'youtube') DEFAULT 'image';
