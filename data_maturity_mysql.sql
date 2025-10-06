-- MySQL Database Schema for Data Maturity Assessment
-- Converted from SQLite to MySQL

SET FOREIGN_KEY_CHECKS = 0;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` VARCHAR(255) PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` TEXT NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'admin',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_login` TIMESTAMP NULL,
    `is_active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Alternative table name for admin users (compatibility)
CREATE TABLE IF NOT EXISTS `admins` (
    `id` VARCHAR(255) PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `password` TEXT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `active` BOOLEAN DEFAULT TRUE,
    `last_login` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create assessment_codes table
CREATE TABLE IF NOT EXISTS `assessment_codes` (
    `code` VARCHAR(255) PRIMARY KEY,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_by` VARCHAR(255) NOT NULL,
    `expires_at` TIMESTAMP NULL,
    `is_used` BOOLEAN DEFAULT FALSE,
    `organization_name` VARCHAR(500),
    `intended_recipient` VARCHAR(500),
    `notes` TEXT,
    `usage_count` INTEGER DEFAULT 0,
    `max_uses` INTEGER DEFAULT 1,
    `assessment_type` VARCHAR(50) DEFAULT 'full',
    INDEX `idx_code` (`code`),
    INDEX `idx_is_used` (`is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create domains table
CREATE TABLE IF NOT EXISTS `domains` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name_en` VARCHAR(500) NOT NULL,
    `name_ar` VARCHAR(500) NOT NULL,
    `description_en` TEXT,
    `description_ar` TEXT,
    `display_order` INTEGER,
    INDEX `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create subdomains table
CREATE TABLE IF NOT EXISTS `subdomains` (
    `id` VARCHAR(255) PRIMARY KEY,
    `domain_id` VARCHAR(255) NOT NULL,
    `name_en` VARCHAR(500) NOT NULL,
    `name_ar` VARCHAR(500) NOT NULL,
    `description_en` TEXT,
    `description_ar` TEXT,
    `display_order` INTEGER,
    INDEX `idx_domain_id` (`domain_id`),
    INDEX `idx_display_order` (`display_order`),
    FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create roles table
CREATE TABLE IF NOT EXISTS `roles` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name_en` VARCHAR(500) NOT NULL,
    `name_ar` VARCHAR(500) NOT NULL,
    `description_en` TEXT,
    `description_ar` TEXT,
    `focus_en` TEXT,
    `focus_ar` TEXT,
    `recommendations_en` TEXT,
    `recommendations_ar` TEXT,
    `display_order` INTEGER,
    INDEX `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create questions table
CREATE TABLE IF NOT EXISTS `questions` (
    `id` VARCHAR(255) PRIMARY KEY,
    `subdomain_id` VARCHAR(255),
    `title_en` VARCHAR(1000),
    `title_ar` VARCHAR(1000),
    `text_en` TEXT,
    `text_ar` TEXT,
    `scenario_en` TEXT,
    `scenario_ar` TEXT,
    `icon` VARCHAR(255),
    `display_order` INTEGER,
    `priority` INTEGER DEFAULT 0,
    INDEX `idx_subdomain_id` (`subdomain_id`),
    INDEX `idx_display_order` (`display_order`),
    FOREIGN KEY (`subdomain_id`) REFERENCES `subdomains`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create question_options table
CREATE TABLE IF NOT EXISTS `question_options` (
    `id` VARCHAR(255) PRIMARY KEY,
    `question_id` VARCHAR(255) NOT NULL,
    `option_key` VARCHAR(50) NOT NULL,
    `option_text_en` TEXT NOT NULL,
    `option_text_ar` TEXT NOT NULL,
    `score_value` INTEGER NOT NULL,
    `maturity_level` VARCHAR(100),
    `explanation_en` TEXT,
    `explanation_ar` TEXT,
    `display_order` INTEGER,
    INDEX `idx_question_id` (`question_id`),
    INDEX `idx_option_key` (`option_key`),
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(500) NOT NULL,
    `organization` VARCHAR(500) NOT NULL,
    `role_title` VARCHAR(500) NOT NULL,
    `email` VARCHAR(255),
    `assessment_code` VARCHAR(255),
    `selected_role_id` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_assessment_code` (`assessment_code`),
    INDEX `idx_selected_role_id` (`selected_role_id`),
    FOREIGN KEY (`selected_role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create assessment_sessions table
CREATE TABLE IF NOT EXISTS `assessment_sessions` (
    `id` VARCHAR(255) PRIMARY KEY,
    `user_id` VARCHAR(255) NOT NULL,
    `session_start` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `session_end` TIMESTAMP NULL,
    `status` VARCHAR(50) DEFAULT 'in_progress',
    `language_preference` VARCHAR(10) DEFAULT 'en',
    `total_questions` INTEGER,
    `answered_questions` INTEGER DEFAULT 0,
    `completion_percentage` DECIMAL(5,2) DEFAULT 0,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create user_responses table
CREATE TABLE IF NOT EXISTS `user_responses` (
    `id` VARCHAR(255) PRIMARY KEY,
    `session_id` VARCHAR(255) NOT NULL,
    `question_id` VARCHAR(255) NOT NULL,
    `option_key` VARCHAR(50) NOT NULL,
    `score_value` INTEGER NOT NULL,
    `answered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `assessment_code` VARCHAR(255),
    UNIQUE KEY `unique_session_question` (`session_id`, `question_id`),
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_question_id` (`question_id`),
    INDEX `idx_assessment_code` (`assessment_code`),
    FOREIGN KEY (`session_id`) REFERENCES `assessment_sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create assessment_results table
CREATE TABLE IF NOT EXISTS `assessment_results` (
    `id` VARCHAR(255) PRIMARY KEY,
    `session_id` VARCHAR(255),
    `user_id` VARCHAR(255),
    `assessment_code` VARCHAR(255),
    `overall_score` DECIMAL(4,2) NOT NULL,
    `overall_maturity_level` VARCHAR(100) NOT NULL,
    `strengths_summary_en` TEXT,
    `strengths_summary_ar` TEXT,
    `improvement_areas_en` TEXT,
    `improvement_areas_ar` TEXT,
    `recommendations_en` TEXT,
    `recommendations_ar` TEXT,
    `completion_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `total_questions_answered` INTEGER,
    `results_data` JSON,
    `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_assessment_code` (`assessment_code`),
    FOREIGN KEY (`session_id`) REFERENCES `assessment_sessions`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(255) PRIMARY KEY,
    `user_type` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(255),
    `category` VARCHAR(100),
    `action` VARCHAR(255) NOT NULL,
    `details` TEXT,
    `ip_address` VARCHAR(45),
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_user_type` (`user_type`),
    INDEX `idx_action` (`action`),
    INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create session_scores table
CREATE TABLE IF NOT EXISTS `session_scores` (
    `id` VARCHAR(255) PRIMARY KEY,
    `session_id` VARCHAR(255) NOT NULL,
    `domain_id` VARCHAR(255),
    `subdomain_id` VARCHAR(255),
    `score_type` VARCHAR(100) NOT NULL,
    `raw_score` DECIMAL(6,2) NOT NULL,
    `percentage_score` DECIMAL(5,2) NOT NULL,
    `maturity_level` VARCHAR(100) NOT NULL,
    `questions_answered` INTEGER NOT NULL,
    `total_questions` INTEGER NOT NULL,
    `calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_domain_id` (`domain_id`),
    INDEX `idx_subdomain_id` (`subdomain_id`),
    FOREIGN KEY (`session_id`) REFERENCES `assessment_sessions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`subdomain_id`) REFERENCES `subdomains`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create maturity_levels table
CREATE TABLE IF NOT EXISTS `maturity_levels` (
    `level_number` INTEGER PRIMARY KEY,
    `level_name` VARCHAR(255) NOT NULL,
    `level_description_en` TEXT NOT NULL,
    `level_description_ar` TEXT NOT NULL,
    `score_range_min` DECIMAL(4,2) NOT NULL,
    `score_range_max` DECIMAL(4,2) NOT NULL,
    `color_code` VARCHAR(20),
    INDEX `idx_score_range` (`score_range_min`, `score_range_max`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create email_logs table
CREATE TABLE IF NOT EXISTS `email_logs` (
    `id` VARCHAR(255) PRIMARY KEY,
    `session_id` VARCHAR(255) NOT NULL,
    `recipient_email` VARCHAR(255) NOT NULL,
    `email_type` VARCHAR(100) NOT NULL,
    `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` VARCHAR(50) DEFAULT 'pending',
    `error_message` TEXT,
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_email_type` (`email_type`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`session_id`) REFERENCES `assessment_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;