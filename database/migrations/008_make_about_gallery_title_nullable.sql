-- Migration: 008_make_about_gallery_title_nullable.sql
-- PT Euodoo: Make about_gallery_slides title_id nullable and optional (T-137)

ALTER TABLE about_gallery_slides MODIFY COLUMN title_id VARCHAR(255) NULL DEFAULT '';
