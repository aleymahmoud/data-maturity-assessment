BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "admin_users" (
	"id"	TEXT,
	"username"	TEXT NOT NULL UNIQUE,
	"password_hash"	TEXT NOT NULL,
	"full_name"	TEXT NOT NULL,
	"email"	TEXT NOT NULL,
	"role"	TEXT DEFAULT 'admin',
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"last_login"	DATETIME,
	"is_active"	BOOLEAN DEFAULT TRUE,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "assessment_codes" (
	"code"	TEXT,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"created_by"	TEXT NOT NULL,
	"expires_at"	DATETIME,
	"is_used"	BOOLEAN DEFAULT FALSE,
	"organization_name"	TEXT,
	"intended_recipient"	TEXT,
	"notes"	TEXT,
	"usage_count"	INTEGER DEFAULT 0,
	"max_uses"	INTEGER DEFAULT 1,
	"assessment_type"	TEXT DEFAULT full,
	PRIMARY KEY("code"),
	FOREIGN KEY("created_by") REFERENCES "admin_users"("id")
);
CREATE TABLE IF NOT EXISTS "assessment_results" (
	"id"	TEXT,
	"session_id"	TEXT NOT NULL,
	"overall_score"	REAL NOT NULL,
	"overall_maturity_level"	TEXT NOT NULL,
	"strengths_summary_en"	TEXT,
	"strengths_summary_ar"	TEXT,
	"improvement_areas_en"	TEXT,
	"improvement_areas_ar"	TEXT,
	"recommendations_en"	TEXT,
	"recommendations_ar"	TEXT,
	"generated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id"),
	FOREIGN KEY("session_id") REFERENCES "assessment_sessions"("id")
);
CREATE TABLE IF NOT EXISTS "assessment_sessions" (
	"id"	TEXT,
	"user_id"	TEXT NOT NULL,
	"session_start"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"session_end"	DATETIME,
	"status"	TEXT DEFAULT 'in_progress',
	"language_preference"	TEXT DEFAULT 'en',
	"total_questions"	INTEGER,
	"answered_questions"	INTEGER DEFAULT 0,
	"completion_percentage"	REAL DEFAULT 0,
	PRIMARY KEY("id"),
	FOREIGN KEY("user_id") REFERENCES "users0"("id")
);
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id"	TEXT,
	"user_type"	TEXT NOT NULL,
	"user_id"	TEXT,
	"action"	TEXT NOT NULL,
	"details"	TEXT,
	"ip_address"	TEXT,
	"timestamp"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "domains" (
	"id"	TEXT,
	"name_en"	TEXT NOT NULL,
	"name_ar"	TEXT NOT NULL,
	"description_en"	TEXT,
	"description_ar"	TEXT,
	"display_order"	INTEGER,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "email_logs" (
	"id"	TEXT,
	"session_id"	TEXT NOT NULL,
	"recipient_email"	TEXT NOT NULL,
	"email_type"	TEXT NOT NULL,
	"sent_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"status"	TEXT DEFAULT 'pending',
	"error_message"	TEXT,
	PRIMARY KEY("id"),
	FOREIGN KEY("session_id") REFERENCES "assessment_sessions"("id")
);
CREATE TABLE IF NOT EXISTS "maturity_levels" (
	"level_number"	INTEGER,
	"level_name"	TEXT NOT NULL,
	"level_description_en"	TEXT NOT NULL,
	"level_description_ar"	TEXT NOT NULL,
	"score_range_min"	REAL NOT NULL,
	"score_range_max"	REAL NOT NULL,
	"color_code"	TEXT,
	PRIMARY KEY("level_number")
);
CREATE TABLE IF NOT EXISTS "question_options" (
	"id"	TEXT,
	"question_id"	TEXT NOT NULL,
	"option_key"	TEXT NOT NULL,
	"option_text_en"	TEXT NOT NULL,
	"option_text_ar"	TEXT NOT NULL,
	"score_value"	INTEGER NOT NULL,
	"maturity_level"	TEXT,
	"explanation_en"	TEXT,
	"explanation_ar"	TEXT,
	"display_order"	INTEGER,
	PRIMARY KEY("id"),
	FOREIGN KEY("question_id") REFERENCES "questions"("id")
);
CREATE TABLE IF NOT EXISTS "questions" (
	"id"	TEXT,
	"subdomain_id"	TEXT,
	"title_en"	TEXT,
	"title_ar"	TEXT,
	"text_en"	TEXT,
	"text_ar"	TEXT,
	"scenario_en"	TEXT,
	"scenario_ar"	TEXT,
	"icon"	TEXT,
	"display_order"	INTEGER,
	"priority"	INTEGER DEFAULT 0,
	PRIMARY KEY("id"),
	FOREIGN KEY("subdomain_id") REFERENCES "subdomains"("id")
);
CREATE TABLE IF NOT EXISTS "roles" (
	"id"	TEXT,
	"name_en"	TEXT NOT NULL,
	"name_ar"	TEXT NOT NULL,
	"description_en"	TEXT,
	"description_ar"	TEXT,
	"focus_en"	TEXT,
	"focus_ar"	TEXT,
	"recommendations_en"	TEXT,
	"recommendations_ar"	TEXT,
	"display_order"	INTEGER,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "session_scores" (
	"id"	TEXT,
	"session_id"	TEXT NOT NULL,
	"domain_id"	TEXT,
	"subdomain_id"	TEXT,
	"score_type"	TEXT NOT NULL,
	"raw_score"	REAL NOT NULL,
	"percentage_score"	REAL NOT NULL,
	"maturity_level"	TEXT NOT NULL,
	"questions_answered"	INTEGER NOT NULL,
	"total_questions"	INTEGER NOT NULL,
	"calculated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id"),
	FOREIGN KEY("domain_id") REFERENCES "domains"("id"),
	FOREIGN KEY("session_id") REFERENCES "assessment_sessions"("id"),
	FOREIGN KEY("subdomain_id") REFERENCES "subdomains"("id")
);
CREATE TABLE IF NOT EXISTS "subdomains" (
	"id"	TEXT,
	"domain_id"	TEXT NOT NULL,
	"name_en"	TEXT NOT NULL,
	"name_ar"	TEXT NOT NULL,
	"description_en"	TEXT,
	"description_ar"	TEXT,
	"display_order"	INTEGER,
	PRIMARY KEY("id"),
	FOREIGN KEY("domain_id") REFERENCES "domains"("id")
);
CREATE TABLE IF NOT EXISTS "user_responses" (
	"id"	TEXT,
	"session_id"	TEXT NOT NULL,
	"question_id"	TEXT NOT NULL,
	"option_key"	TEXT NOT NULL,
	"score_value"	INTEGER NOT NULL,
	"answered_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"assessment_code"	TEXT,
	PRIMARY KEY("id"),
	UNIQUE("session_id","question_id"),
	FOREIGN KEY("question_id") REFERENCES "questions"("id"),
	FOREIGN KEY("session_id") REFERENCES "assessment_sessions"("id")
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	TEXT,
	"name"	TEXT NOT NULL,
	"organization"	TEXT NOT NULL,
	"role_title"	TEXT NOT NULL,
	"email"	TEXT,
	"assessment_code"	TEXT,
	"selected_role_id"	TEXT,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id"),
	FOREIGN KEY("selected_role_id") REFERENCES "roles"("id")
);
CREATE TABLE IF NOT EXISTS "users0" (
	"id"	TEXT,
	"name"	TEXT NOT NULL,
	"organization"	TEXT NOT NULL,
	"role_title"	TEXT NOT NULL,
	"email"	TEXT,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"assessment_code"	TEXT,
	"selected_role"	TEXT,
	PRIMARY KEY("id")
);
INSERT INTO "admin_users" VALUES ('admin-001','admin','admin123','System Administrator','admin@system.local','super_admin','2025-07-21 19:35:35','2025-09-10 17:55:19',1);
INSERT INTO "assessment_codes" VALUES ('TEST2020','2025-08-21 12:53:29','admin-001','2025-12-31 23:59:59',1,'Test Organization 2025','Test User',NULL,1,1,'full');
INSERT INTO "assessment_codes" VALUES ('TEST2022','2025-08-21 12:53:44','admin-001','2025-12-31 23:59:59',0,'Test Organization 2025','Test User',NULL,0,1,'full');
INSERT INTO "assessment_codes" VALUES ('TEST2023','2025-08-21 12:53:46','admin-001','2025-12-31 23:59:59',0,'Test Organization 2025','Test User',NULL,0,1,'full');
INSERT INTO "assessment_codes" VALUES ('TEST2026','2025-08-21 12:54:01','admin-001','2025-12-31 23:59:59',0,'Test Organization 2025','Test User1',NULL,0,1,'full');
INSERT INTO "assessment_codes" VALUES ('TEAM2025','2025-09-04 19:16:41','admin-001','2025-12-31 23:59:59',0,'Internal Team Testing','Development Team','Shared code for internal team testing - up to 99 uses',0,99,'full');
INSERT INTO "assessment_codes" VALUES ('FFNTMO25','2025-09-07 08:25:43','admin-001','2025-12-31 23:59:59',0,'Internal Team Testing','Development & QA Team','Internal testing code - allows 99 team members to test the assessment',0,1,'full');
INSERT INTO "assessment_codes" VALUES ('FFNTGA25','2025-09-08 20:33:53','admin-001','2025-12-31 23:59:59',0,'Internal Team Testing','Development & QA Team','Internal testing code - allows 99 team members to test the assessment',0,1,'full');
INSERT INTO "assessment_codes" VALUES ('FFNTAD25','2025-09-10 08:17:07','admin-001','2025-12-31 23:59:59',1,'Internal Team Testing','Development & QA Team','Internal testing code - allows 99 team members to test the assessment',1,1,'full');
INSERT INTO "assessment_codes" VALUES ('QUICK2024','2025-09-10 15:52:16','admin','2025-12-31 23:59:59',1,'Test Organization - Quick Assessment','Testing Team',NULL,1,10,'quick');
INSERT INTO "assessment_codes" VALUES ('FULL2024','2025-09-10 15:52:16','admin','2025-12-31 23:59:59',0,'Test Organization - Full Assessment','Testing Team',NULL,0,10,'full');
INSERT INTO "assessment_codes" VALUES ('ALEY2025','2025-09-10 16:45:45','admin-001','2025-12-31 23:59:59',0,'Internal Team Testing','Development & QA Team','Internal testing code - allows 99 team members to test the assessment',0,1,'quick');
INSERT INTO "assessment_sessions" VALUES ('session_1757496004892_7h9dtehvm','user_1757496004885_8e9fnfuje','2025-09-10 09:20:04','2025-09-10 09:35:32','completed','en',NULL,35,100.0);
INSERT INTO "assessment_sessions" VALUES ('session-1757510005180','test-user-1757510005180','2025-09-10 12:13:25','2025-09-10 13:13:25','completed','en',NULL,0,100.0);
INSERT INTO "assessment_sessions" VALUES ('session_1757521776943_zxdo2g3e7','user_1757521776935_bhbq3ura2','2025-09-10 16:29:36','2025-09-10 16:30:57','completed','en',NULL,11,100.0);
INSERT INTO "audit_logs" VALUES ('log_1757494923777_i27ifv5ce','user',NULL,'code_validation_success','Code: FFNTAD25','','2025-09-10 09:02:03');
INSERT INTO "audit_logs" VALUES ('log_1757494935130_kkqbwca35','user','user_1757494935119_5s8fr8d20','session_created','Code: FFNTAD25, Session: session_1757494935125_hbxbdgmn5','','2025-09-10 09:02:15');
INSERT INTO "audit_logs" VALUES ('log_1757494939202_ls1kw8299','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 1','','2025-09-10 09:02:19');
INSERT INTO "audit_logs" VALUES ('log_1757494943361_hb28s8r37','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 2','','2025-09-10 09:02:23');
INSERT INTO "audit_logs" VALUES ('log_1757494945367_kogm38tw6','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 3','','2025-09-10 09:02:25');
INSERT INTO "audit_logs" VALUES ('log_1757494947226_pwvovp0k6','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 4','','2025-09-10 09:02:27');
INSERT INTO "audit_logs" VALUES ('log_1757494949147_ynnvims2r','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 5','','2025-09-10 09:02:29');
INSERT INTO "audit_logs" VALUES ('log_1757494951190_nhc18bdic','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 6','','2025-09-10 09:02:31');
INSERT INTO "audit_logs" VALUES ('log_1757494952914_8l3p3y9qo','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 7','','2025-09-10 09:02:32');
INSERT INTO "audit_logs" VALUES ('log_1757494955390_abp22zuve','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 8','','2025-09-10 09:02:35');
INSERT INTO "audit_logs" VALUES ('log_1757494957050_yzvmws20j','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 9','','2025-09-10 09:02:37');
INSERT INTO "audit_logs" VALUES ('log_1757494959360_vkhaw1bap','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 10','','2025-09-10 09:02:39');
INSERT INTO "audit_logs" VALUES ('log_1757494961316_zcsjge3jr','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 11','','2025-09-10 09:02:41');
INSERT INTO "audit_logs" VALUES ('log_1757494962881_g9bq2h70a','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 12','','2025-09-10 09:02:42');
INSERT INTO "audit_logs" VALUES ('log_1757494964821_78iac6k9k','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 13','','2025-09-10 09:02:44');
INSERT INTO "audit_logs" VALUES ('log_1757494967374_8s80bw23k','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 14','','2025-09-10 09:02:47');
INSERT INTO "audit_logs" VALUES ('log_1757495418461_ugwijhrso','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 15','','2025-09-10 09:10:18');
INSERT INTO "audit_logs" VALUES ('log_1757495420957_yz14dvf3z','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 16','','2025-09-10 09:10:20');
INSERT INTO "audit_logs" VALUES ('log_1757495423230_dwfykbgko','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 17','','2025-09-10 09:10:23');
INSERT INTO "audit_logs" VALUES ('log_1757495521212_im96jyes7','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 18','','2025-09-10 09:12:01');
INSERT INTO "audit_logs" VALUES ('log_1757495522935_wewlwea9c','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 19','','2025-09-10 09:12:02');
INSERT INTO "audit_logs" VALUES ('log_1757495524770_cv51moeu7','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 20','','2025-09-10 09:12:04');
INSERT INTO "audit_logs" VALUES ('log_1757495526533_hu9jrqev9','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 21','','2025-09-10 09:12:06');
INSERT INTO "audit_logs" VALUES ('log_1757495537626_u0hsdkny4','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 22','','2025-09-10 09:12:17');
INSERT INTO "audit_logs" VALUES ('log_1757495540042_ri2wb5wpq','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 23','','2025-09-10 09:12:20');
INSERT INTO "audit_logs" VALUES ('log_1757495542675_tcj4vc02y','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 24','','2025-09-10 09:12:22');
INSERT INTO "audit_logs" VALUES ('log_1757495544615_8f73oabkb','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 25','','2025-09-10 09:12:24');
INSERT INTO "audit_logs" VALUES ('log_1757495547767_9fyzvmjqd','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 26','','2025-09-10 09:12:27');
INSERT INTO "audit_logs" VALUES ('log_1757495549621_uhwwdkjty','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 27','','2025-09-10 09:12:29');
INSERT INTO "audit_logs" VALUES ('log_1757495551411_tnfgqz27b','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 28','','2025-09-10 09:12:31');
INSERT INTO "audit_logs" VALUES ('log_1757495554875_zjxy4dx1z','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 29','','2025-09-10 09:12:34');
INSERT INTO "audit_logs" VALUES ('log_1757495557409_kkb9a6ykq','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 30','','2025-09-10 09:12:37');
INSERT INTO "audit_logs" VALUES ('log_1757495559681_sfqa56qog','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 31','','2025-09-10 09:12:39');
INSERT INTO "audit_logs" VALUES ('log_1757495563113_92u15tzmf','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 32','','2025-09-10 09:12:43');
INSERT INTO "audit_logs" VALUES ('log_1757495565861_g9xe27mfp','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 33','','2025-09-10 09:12:45');
INSERT INTO "audit_logs" VALUES ('log_1757495568488_t4u8bdaq2','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 34','','2025-09-10 09:12:48');
INSERT INTO "audit_logs" VALUES ('log_1757495571371_gkk0cyczu','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 35','','2025-09-10 09:12:51');
INSERT INTO "audit_logs" VALUES ('log_1757495571440_ebhnvqmri','user',NULL,'responses_saved','Session: session_1757494935125_hbxbdgmn5, Responses: 35','','2025-09-10 09:12:51');
INSERT INTO "audit_logs" VALUES ('log_1757495571460_76rho3riq','user',NULL,'assessment_completed','Code: FFNTAD25, Session: session_1757494935125_hbxbdgmn5','','2025-09-10 09:12:51');
INSERT INTO "audit_logs" VALUES ('log_1757495992908_5wdj4vaeb','user',NULL,'code_validation_success','Code: FFNTAD25','','2025-09-10 09:19:52');
INSERT INTO "audit_logs" VALUES ('log_1757496004900_7pkad6zhy','user','user_1757496004885_8e9fnfuje','session_created','Code: FFNTAD25, Session: session_1757496004892_7h9dtehvm','','2025-09-10 09:20:04');
INSERT INTO "audit_logs" VALUES ('log_1757496483561_4iyfq0a1t','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 1','','2025-09-10 09:28:03');
INSERT INTO "audit_logs" VALUES ('log_1757496486196_fxhyeylgh','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 2','','2025-09-10 09:28:06');
INSERT INTO "audit_logs" VALUES ('log_1757496488187_6zosry7up','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 3','','2025-09-10 09:28:08');
INSERT INTO "audit_logs" VALUES ('log_1757496490312_tc4n340sh','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 4','','2025-09-10 09:28:10');
INSERT INTO "audit_logs" VALUES ('log_1757496492153_jbogz5b5s','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 5','','2025-09-10 09:28:12');
INSERT INTO "audit_logs" VALUES ('log_1757496564183_9vdhhhtpl','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 6','','2025-09-10 09:29:24');
INSERT INTO "audit_logs" VALUES ('log_1757496566033_nw8u4ilrq','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 7','','2025-09-10 09:29:26');
INSERT INTO "audit_logs" VALUES ('log_1757496567710_68ce2znjl','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 8','','2025-09-10 09:29:27');
INSERT INTO "audit_logs" VALUES ('log_1757496569754_wqfh12o9g','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 9','','2025-09-10 09:29:29');
INSERT INTO "audit_logs" VALUES ('log_1757496572479_q868f8ida','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 10','','2025-09-10 09:29:32');
INSERT INTO "audit_logs" VALUES ('log_1757496574332_aao2frvu0','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 11','','2025-09-10 09:29:34');
INSERT INTO "audit_logs" VALUES ('log_1757496576426_kq1vefudh','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 12','','2025-09-10 09:29:36');
INSERT INTO "audit_logs" VALUES ('log_1757496578152_5xonxqvze','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 13','','2025-09-10 09:29:38');
INSERT INTO "audit_logs" VALUES ('log_1757496580049_xl3w20reb','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 14','','2025-09-10 09:29:40');
INSERT INTO "audit_logs" VALUES ('log_1757496581693_iutmi9500','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 15','','2025-09-10 09:29:41');
INSERT INTO "audit_logs" VALUES ('log_1757496583254_0z0g9jbe4','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 16','','2025-09-10 09:29:43');
INSERT INTO "audit_logs" VALUES ('log_1757496585101_vytza6jry','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 17','','2025-09-10 09:29:45');
INSERT INTO "audit_logs" VALUES ('log_1757496587285_h88vr8ml4','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 18','','2025-09-10 09:29:47');
INSERT INTO "audit_logs" VALUES ('log_1757496588939_738hf3iye','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 19','','2025-09-10 09:29:48');
INSERT INTO "audit_logs" VALUES ('log_1757496591186_eym44upew','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 20','','2025-09-10 09:29:51');
INSERT INTO "audit_logs" VALUES ('log_1757496903776_n11nmxbkk','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 21','','2025-09-10 09:35:03');
INSERT INTO "audit_logs" VALUES ('log_1757496905939_ttcsrzjcl','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 22','','2025-09-10 09:35:05');
INSERT INTO "audit_logs" VALUES ('log_1757496907526_i2xcgxzka','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 23','','2025-09-10 09:35:07');
INSERT INTO "audit_logs" VALUES ('log_1757496909133_j1nlt34z8','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 24','','2025-09-10 09:35:09');
INSERT INTO "audit_logs" VALUES ('log_1757496910862_ogb3ay78v','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 25','','2025-09-10 09:35:10');
INSERT INTO "audit_logs" VALUES ('log_1757496913190_zn23g8vgx','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 26','','2025-09-10 09:35:13');
INSERT INTO "audit_logs" VALUES ('log_1757496915108_5tn6jcz4c','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 27','','2025-09-10 09:35:15');
INSERT INTO "audit_logs" VALUES ('log_1757496917501_2ekmasibb','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 28','','2025-09-10 09:35:17');
INSERT INTO "audit_logs" VALUES ('log_1757496919223_nyc6f2fan','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 29','','2025-09-10 09:35:19');
INSERT INTO "audit_logs" VALUES ('log_1757496921241_5npe9zbj9','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 30','','2025-09-10 09:35:21');
INSERT INTO "audit_logs" VALUES ('log_1757496923457_sal1ybewc','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 31','','2025-09-10 09:35:23');
INSERT INTO "audit_logs" VALUES ('log_1757496925851_6el70n6zv','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 32','','2025-09-10 09:35:25');
INSERT INTO "audit_logs" VALUES ('log_1757496927645_jmf0odbm3','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 33','','2025-09-10 09:35:27');
INSERT INTO "audit_logs" VALUES ('log_1757496929369_9vesaent7','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 34','','2025-09-10 09:35:29');
INSERT INTO "audit_logs" VALUES ('log_1757496931966_uuziktlyn','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 35','','2025-09-10 09:35:31');
INSERT INTO "audit_logs" VALUES ('log_1757496932045_b6ap0h86r','user',NULL,'responses_saved','Session: session_1757496004892_7h9dtehvm, Responses: 35','','2025-09-10 09:35:32');
INSERT INTO "audit_logs" VALUES ('log_1757496932063_n18skn8y9','user',NULL,'assessment_completed','Code: FFNTAD25, Session: session_1757496004892_7h9dtehvm','','2025-09-10 09:35:32');
INSERT INTO "audit_logs" VALUES ('log_1757508799925_a6eet74wk','user',NULL,'code_validation_failed','Code: FFNTAD25, Error: Assessment code has already been used','','2025-09-10 12:53:19');
INSERT INTO "audit_logs" VALUES ('log_1757509206201_eaj1y7ubc','user',NULL,'code_validation_failed','Code: FFNTAD25, Error: Assessment code has already been used','','2025-09-10 13:00:06');
INSERT INTO "audit_logs" VALUES ('log_1757509211273_0dow1t1fy','user',NULL,'code_validation_failed','Code: FFNTAD25, Error: Assessment code has already been used','','2025-09-10 13:00:11');
INSERT INTO "audit_logs" VALUES ('log_1757509363746_s006crbvc','user',NULL,'code_validation_failed','Code: DEMO1234, Error: Invalid assessment code','','2025-09-10 13:02:43');
INSERT INTO "audit_logs" VALUES ('log_1757509381270_fs4cs3ei8','user',NULL,'code_validation_failed','Code: TEST2020, Error: Assessment code has already been used','','2025-09-10 13:03:01');
INSERT INTO "audit_logs" VALUES ('log_1757509497485_25plc3xw7','user',NULL,'code_validation_success','Code: TEST2022','','2025-09-10 13:04:57');
INSERT INTO "audit_logs" VALUES ('log_1757509509653_arwuv39qu','user',NULL,'code_validation_failed','Code: TEST2020, Error: Assessment code has already been used','','2025-09-10 13:05:09');
INSERT INTO "audit_logs" VALUES ('log_1757509552886_q2mq7x161','user',NULL,'code_validation_failed','Code: TEST2020, Error: Assessment code has already been used','','2025-09-10 13:05:52');
INSERT INTO "audit_logs" VALUES ('log_1757509640127_8ggl8n6eh','user',NULL,'code_validation_success','Code: TEST2020','','2025-09-10 13:07:20');
INSERT INTO "audit_logs" VALUES ('log_1757510010881_bymofo53f','user','test-user-1757510005180','code_validation_completed','Code: TEST2020','','2025-09-10 13:13:30');
INSERT INTO "audit_logs" VALUES ('log_1757513916541_cq91a1fi5','user','user_1757496004885_8e9fnfuje','code_validation_completed','Code: FFNTAD25','','2025-09-10 14:18:36');
INSERT INTO "audit_logs" VALUES ('log_1757519606082_uj429hezj','user',NULL,'code_validation_success','Code: QUICK2024','','2025-09-10 15:53:26');
INSERT INTO "audit_logs" VALUES ('log_1757519674351_6uwbh02h5','user',NULL,'code_validation_success','Code: QUICK2024','','2025-09-10 15:54:34');
INSERT INTO "audit_logs" VALUES ('log_1757519679349_6dg1mvznt','user',NULL,'code_validation_success','Code: FULL2024','','2025-09-10 15:54:39');
INSERT INTO "audit_logs" VALUES ('log_1757521763006_tql52hzvf','user',NULL,'code_validation_success','Code: QUICK2024','','2025-09-10 16:29:23');
INSERT INTO "audit_logs" VALUES ('log_1757521776948_rv0rmkaf5','user','user_1757521776935_bhbq3ura2','session_created','Code: QUICK2024, Session: session_1757521776943_zxdo2g3e7','','2025-09-10 16:29:36');
INSERT INTO "audit_logs" VALUES ('log_1757521831393_4h075xr9y','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 1','','2025-09-10 16:30:31');
INSERT INTO "audit_logs" VALUES ('log_1757521834319_clcwrgcqo','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 2','','2025-09-10 16:30:34');
INSERT INTO "audit_logs" VALUES ('log_1757521837922_6ngt48hfg','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 3','','2025-09-10 16:30:37');
INSERT INTO "audit_logs" VALUES ('log_1757521840141_bl63tf843','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 4','','2025-09-10 16:30:40');
INSERT INTO "audit_logs" VALUES ('log_1757521841922_frjce8wc4','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 5','','2025-09-10 16:30:41');
INSERT INTO "audit_logs" VALUES ('log_1757521844202_vxce6hp2a','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 6','','2025-09-10 16:30:44');
INSERT INTO "audit_logs" VALUES ('log_1757521846407_wka7g8qvt','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 7','','2025-09-10 16:30:46');
INSERT INTO "audit_logs" VALUES ('log_1757521848950_zn8ej83dp','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 8','','2025-09-10 16:30:48');
INSERT INTO "audit_logs" VALUES ('log_1757521851689_fsb26zpay','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 9','','2025-09-10 16:30:51');
INSERT INTO "audit_logs" VALUES ('log_1757521854872_2x9fzgu78','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 10','','2025-09-10 16:30:54');
INSERT INTO "audit_logs" VALUES ('log_1757521857545_29wqmc4jr','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 11','','2025-09-10 16:30:57');
INSERT INTO "audit_logs" VALUES ('log_1757521857609_bu8pwvwdt','user',NULL,'responses_saved','Session: session_1757521776943_zxdo2g3e7, Responses: 11','','2025-09-10 16:30:57');
INSERT INTO "audit_logs" VALUES ('log_1757521857799_rnrgu2wcj','user',NULL,'assessment_completed','Code: QUICK2024, Session: session_1757521776943_zxdo2g3e7','','2025-09-10 16:30:57');
INSERT INTO "audit_logs" VALUES ('log_1757521896410_00r57qvni','user','user_1757521776935_bhbq3ura2','code_validation_completed','Code: QUICK2024','','2025-09-10 16:31:36');
INSERT INTO "audit_logs" VALUES ('log_1757522763909_accna4ula','user',NULL,'code_validation_success','Code: ALEY2025','','2025-09-10 16:46:03');
INSERT INTO "audit_logs" VALUES ('log_1757522828188_sc1ysyta7','user','user_1757521776935_bhbq3ura2','code_validation_completed','Code: QUICK2024','','2025-09-10 16:47:08');
INSERT INTO "audit_logs" VALUES ('log_1757524955690_htbeombve','admin','admin-001','admin_login','Username: admin','','2025-09-10 17:22:35');
INSERT INTO "audit_logs" VALUES ('log_1757525141117_nibt2480w','admin','admin-001','admin_login','Username: admin','','2025-09-10 17:25:41');
INSERT INTO "audit_logs" VALUES ('log_1757525445416_n7jg2kt1c','admin','admin-001','admin_login','Username: admin','','2025-09-10 17:30:45');
INSERT INTO "audit_logs" VALUES ('log_1757525494032_7htnflgdl','admin','admin-001','admin_login','Username: admin','','2025-09-10 17:31:34');
INSERT INTO "audit_logs" VALUES ('log_1757525900917_3vavj1oem','admin','admin-001','admin_login','Username: admin','','2025-09-10 17:38:20');
INSERT INTO "audit_logs" VALUES ('log_1757526919218_btijuwsef','admin','admin-001','admin_login','Username: admin','','2025-09-10 17:55:19');
INSERT INTO "domains" VALUES ('DATA_LIFECYCLE','Data Lifecycle','دورة حياة البيانات','The core operational capabilities for managing data from collection through strategic use','القدرات التشغيلية الأساسية لإدارة البيانات من الجمع إلى الاستخدام الاستراتيجي',1);
INSERT INTO "domains" VALUES ('GOVERNANCE_PROTECTION','Governance & Protection','الحوكمة والحماية','Risk management, compliance, and ethical frameworks that enable safe and responsible data use','إدارة المخاطر والامتثال والأطر الأخلاقية التي تمكن الاستخدام الآمن والمسؤول للبيانات',2);
INSERT INTO "domains" VALUES ('ORGANIZATIONAL_ENABLERS','Organizational Enablers','الممكنات التنظيمية','Human and cultural factors that enable or constrain organizational data maturity','العوامل البشرية والثقافية التي تمكن أو تقيد نضج البيانات التنظيمية',3);
INSERT INTO "maturity_levels" VALUES (1,'Initial','Ad-hoc, reactive approaches with minimal formalization','نهج مخصص وردود فعل مع الحد الأدنى من الرسمية',1.0,1.8,'#FF6B6B');
INSERT INTO "maturity_levels" VALUES (2,'Developing','Basic capabilities with inconsistent implementation','قدرات أساسية مع تنفيذ غير متسق',1.8,2.6,'#FFD93D');
INSERT INTO "maturity_levels" VALUES (3,'Defined','Standardized approaches with documented processes','نهج موحد مع عمليات موثقة',2.6,3.4,'#6BCF7F');
INSERT INTO "maturity_levels" VALUES (4,'Advanced','Enterprise-wide integration with proactive management','تكامل على مستوى المؤسسة مع إدارة استباقية',3.4,4.2,'#4ECDC4');
INSERT INTO "maturity_levels" VALUES (5,'Optimized','Innovative approaches with continuous improvement','نهج مبتكرة مع التحسين المستمر',4.2,5.0,'#45B7D1');
INSERT INTO "question_options" VALUES ('Q1_A','Q1','A','We collect whatever data is easily available or required by regulations','نجمع أي بيانات متاحة بسهولة أو مطلوبة بموجب اللوائح',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q1_B','Q1','B','We gather data that senior staff think might be useful','نجمع البيانات التي يعتقد كبار الموظفين أنها قد تكون مفيدة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q1_C','Q1','C','We identify data needs based on current reporting and operational requirements','نحدد احتياجات البيانات بناءً على متطلبات التقارير والعمليات الحالية',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q1_D','Q1','D','We systematically assess what data would help us achieve our strategic objectives','نقيم بشكل منهجي البيانات التي ستساعدنا في تحقيق أهدافنا الاستراتيجية',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q1_E','Q1','E','We continuously evaluate and optimize our data collection based on changing business needs','نقيم ونحسن جمع البيانات باستمرار بناءً على احتياجات العمل المتغيرة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q1_NA','Q1','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q1_NS','Q1','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q2_A','Q2','A','We begin collecting and figure out how to use it later','نبدأ في الجمع ونكتشف كيفية استخدامها لاحقاً',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q2_B','Q2','B','We start with basic collection and improve the process over time','نبدأ بالجمع الأساسي ونحسن العملية مع الوقت',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q2_C','Q2','C','We plan the collection process and test it before full implementation','نخطط لعملية الجمع ونختبرها قبل التنفيذ الكامل',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q2_D','Q2','D','We design comprehensive collection procedures with quality controls from the start','نصمم إجراءات جمع شاملة مع ضوابط الجودة من البداية',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q2_E','Q2','E','We implement sophisticated collection systems with real-time validation and feedback','ننفذ أنظمة جمع متطورة مع التحقق والتغذية الراجعة في الوقت الفعلي',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q2_NA','Q2','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q2_NS','Q2','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q3_A','Q3','A','Each department collects data in their own way','كل قسم يجمع البيانات بطريقته الخاصة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q3_B','Q3','B','We provide basic guidelines but allow flexibility in implementation','نقدم إرشادات أساسية لكن نسمح بمرونة في التنفيذ',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q3_C','Q3','C','We have standard procedures that most departments follow','لدينا إجراءات موحدة تتبعها معظم الأقسام',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q3_D','Q3','D','We enforce consistent collection standards across the organization','نطبق معايير جمع متسقة عبر المؤسسة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q3_E','Q3','E','We use automated systems that ensure uniform collection regardless of location or person','نستخدم أنظمة آلية تضمن الجمع الموحد بغض النظر عن الموقع أو الشخص',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q3_NA','Q3','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q3_NS','Q3','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q4_A','Q4','A','We usually focus on one data source at a time since combining them is complicated','عادة نركز على مصدر بيانات واحد في كل مرة لأن دمجها معقد',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q4_B','Q4','B','We can combine data but it requires someone with technical skills and takes considerable effort','يمكننا دمج البيانات لكن يتطلب شخصاً بمهارات تقنية ويستغرق جهداً كبيراً',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q4_C','Q4','C','It''s possible to do but requires planning and dedicated time to get it right','من الممكن القيام بذلك لكن يتطلب تخطيطاً ووقتاً مخصصاً لإنجازه بشكل صحيح',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q4_D','Q4','D','We have processes that make it relatively straightforward for people with the right training','لدينا عمليات تجعلها مباشرة نسبياً للأشخاص ذوي التدريب المناسب',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q4_E','Q4','E','Our systems are designed so that combining data sources is routine and easy','أنظمتنا مصممة بحيث يكون دمج مصادر البيانات روتينياً وسهلاً',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q4_NA','Q4','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q4_NS','Q4','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q5_A','Q5','A','Problems happen fairly regularly and people work around them until they''re fixed','تحدث المشاكل بانتظام والناس يتعاملون معها حتى يتم إصلاحها',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q5_B','Q5','B','When issues occur, our IT team addresses them but it usually takes some time','عندما تحدث مشاكل، يتعامل معها فريق تقنية المعلومات لكن عادة يستغرق بعض الوقت',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q5_C','Q5','C','We have occasional technical issues that are generally resolved within a day or two','لدينا مشاكل تقنية عرضية يتم حلها عموماً خلال يوم أو يومين',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q5_D','Q5','D','Technical problems are rare and usually get fixed quickly when they do occur','المشاكل التقنية نادرة وعادة يتم إصلاحها بسرعة عند حدوثها',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q5_E','Q5','E','Our systems are very reliable with monitoring that prevents most issues before they happen','أنظمتنا موثوقة جداً مع مراقبة تمنع معظم المشاكل قبل حدوثها',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q5_NA','Q5','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q5_NS','Q5','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q6_A','Q6','A','We deal with capacity issues as they come up, sometimes requiring urgent solutions','نتعامل مع مشاكل السعة عند ظهورها، أحياناً نحتاج حلول عاجلة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q6_B','Q6','B','We monitor usage and upgrade when we start approaching our limits','نراقب الاستخدام ونطور عندما نبدأ بالاقتراب من حدودنا',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q6_C','Q6','C','We plan capacity increases as part of our regular technology planning','نخطط لزيادات السعة كجزء من تخطيطنا التقني المنتظم',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q6_D','Q6','D','We proactively manage capacity with scheduled upgrades before we reach limits','نديرة السعة بشكل استباقي مع ترقيات مجدولة قبل الوصول للحدود',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q6_E','Q6','E','We have scalable systems that automatically adjust to meet changing demands','لدينا أنظمة قابلة للتوسع تتكيف تلقائياً لتلبية المتطلبات المتغيرة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q6_NA','Q6','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q6_NS','Q6','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q7_A','Q7','A','Staff mention it to their supervisor when they have time','الموظفون يذكرونها لمشرفهم عندما يكون لديهم وقت',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q7_B','Q7','B','People fix the obvious errors they come across during their regular work','الناس يصلحون الأخطاء الواضحة التي يواجهونها أثناء عملهم المعتاد',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q7_C','Q7','C','There''s an informal process where staff report issues to whoever manages that data','هناك عملية غير رسمية حيث يبلغ الموظفون عن المشاكل لمن يدير تلك البيانات',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q7_D','Q7','D','We have designated people who handle data quality issues when they''re reported','لدينا أشخاص مخصصون للتعامل مع مشاكل جودة البيانات عند الإبلاغ عنها',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q7_E','Q7','E','We have automated systems that flag potential errors for review','لدينا أنظمة آلية تشير إلى الأخطاء المحتملة للمراجعة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q7_NA','Q7','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q7_NS','Q7','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q8_A','Q8','A','We expect some differences since each system serves different purposes','نتوقع بعض الاختلافات لأن كل نظام يخدم أغراضاً مختلفة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q8_B','Q8','B','The core information usually matches, though details might vary','المعلومات الأساسية عادة تتطابق، رغم أن التفاصيل قد تختلف',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q8_C','Q8','C','Most data points are the same, with occasional discrepancies we investigate','معظم نقاط البيانات متشابهة، مع تناقضات عرضية نحققها',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q8_D','Q8','D','Our systems are well-integrated so data is typically consistent','أنظمتنا متكاملة جيداً لذا البيانات متسقة عادة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q8_E','Q8','E','All our systems automatically sync to ensure data consistency','جميع أنظمتنا تتزامن تلقائياً لضمان اتساق البيانات',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q8_NA','Q8','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q8_NS','Q8','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q9_A','Q9','A','They learn by observing how others use the data and asking questions','يتعلمون بمراقبة كيف يستخدم الآخرون البيانات وطرح الأسئلة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q9_B','Q9','B','Their supervisor provides basic guidance during their orientation period','مشرفهم يقدم إرشادات أساسية خلال فترة التوجيه',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q9_C','Q9','C','We have documentation available, though it''s not always kept up to date','لدينا وثائق متاحة، رغم أنها ليست محدثة دائماً',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q9_D','Q9','D','We provide comprehensive training materials that are regularly updated','نقدم مواد تدريبية شاملة يتم تحديثها بانتظام',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q9_E','Q9','E','We have interactive systems that guide users through proper data entry and interpretation','لدينا أنظمة تفاعلية توجه المستخدمين خلال إدخال وتفسير البيانات بشكل صحيح',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q9_NA','Q9','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q9_NS','Q9','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q10_A','Q10','A','We ask the people involved what they think caused it','نسأل الأشخاص المعنيين عما يعتقدون أنه سببها',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q10_B','Q10','B','We review our standard reports to see if there are any obvious patterns','نراجع تقاريرنا المعيارية لنرى إن كانت هناك أنماط واضحة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q10_C','Q10','C','We pull data from several sources to get a more complete picture','نسحب البيانات من عدة مصادر للحصول على صورة أكثر اكتمالاً',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q10_D','Q10','D','We conduct interviews and data analysis to understand all the contributing factors','نجري مقابلات وتحليل بيانات لفهم جميع العوامل المساهمة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q10_E','Q10','E','We use statistical analysis to identify the most significant drivers','نستخدم التحليل الإحصائي لتحديد أهم العوامل المؤثرة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q10_NA','Q10','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q10_NS','Q10','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q11_A','Q11','A','We rely on the experience and judgment of our senior staff','نعتمد على خبرة وحكم كبار الموظفين لدينا',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q11_B','Q11','B','We review what happened in previous years and assume similar patterns','نراجع ما حدث في السنوات السابقة ونفترض أنماطاً مشابهة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q11_C','Q11','C','We look at current trends and project them forward','ننظر إلى الاتجاهات الحالية ونسقطها للأمام',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q11_D','Q11','D','We develop multiple scenarios based on different assumptions about the future','نطور سيناريوهات متعددة بناء على افتراضات مختلفة حول المستقبل',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q11_E','Q11','E','We use forecasting models to estimate probabilities of different outcomes','نستخدم نماذج التنبؤ لتقدير احتماليات النتائج المختلفة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q11_NA','Q11','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q11_NS','Q11','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q12_A','Q12','A','We collect feedback from participants and staff involved in the programs','نجمع التغذية الراجعة من المشاركين والموظفين المشاركين في البرامج',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q12_B','Q12','B','We track participation numbers and basic satisfaction ratings','نتتبع أرقام المشاركة وتقييمات الرضا الأساسية',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q12_C','Q12','C','We measure specific outcomes and compare them to our original goals','نقيس النتائج المحددة ونقارنها بأهدافنا الأصلية',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q12_D','Q12','D','We compare our results to similar organizations or control groups','نقارن نتائجنا بمؤسسات مشابهة أو مجموعات ضابطة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q12_E','Q12','E','We conduct rigorous evaluations that can definitively attribute results to our programs','نجري تقييمات صارمة يمكنها أن تنسب النتائج بشكل قاطع لبرامجنا',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q12_NA','Q12','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q12_NS','Q12','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q13_A','Q13','A','We focus primarily on our own goals and don''t regularly compare to others','نركز بشكل أساسي على أهدافنا ولا نقارن بانتظام مع الآخرين',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q13_B','Q13','B','We look at published industry reports when they''re available','ننظر إلى التقارير الصناعية المنشورة عندما تكون متاحة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q13_C','Q13','C','We participate in benchmarking surveys and review the results','نشارك في استطلاعات المقارنة المرجعية ونراجع النتائج',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q13_D','Q13','D','We actively seek out data from peer organizations for comparison','نبحث بنشاط عن بيانات من المؤسسات النظيرة للمقارنة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q13_E','Q13','E','We conduct systematic competitive analysis using multiple data sources','نجري تحليلاً تنافسياً منهجياً باستخدام مصادر بيانات متعددة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q13_NA','Q13','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q13_NS','Q13','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q14_A','Q14','A','We share the findings in our regular reporting and include them in future presentations','نشارك النتائج في تقاريرنا المنتظمة ونضمنها في العروض المستقبلية',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q14_B','Q14','B','We present the insight to leadership and wait for their guidance on how to proceed','نعرض الرؤية على القيادة وننتظر توجيهاتهم حول كيفية المتابعة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q14_C','Q14','C','We document the insight and add it to our list of potential improvement areas','نوثق الرؤية ونضيفها إلى قائمة مجالات التحسين المحتملة',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q14_D','Q14','D','We immediately begin exploring what changes this insight suggests we should make','نبدأ فوراً في استكشاف التغييرات التي تقترحها هذه الرؤية',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q14_E','Q14','E','We assign someone to develop an action plan with specific timelines and resources','نكلف شخصاً بوضع خطة عمل مع جداول زمنية وموارد محددة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q14_NA','Q14','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q14_NS','Q14','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q15_A','Q15','A','We look for external factors that might explain the poor performance','نبحث عن عوامل خارجية قد تفسر الأداء الضعيف',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q15_B','Q15','B','We ask the program manager to provide context and their perspective on the numbers','نطلب من مدير البرنامج تقديم السياق ووجهة نظره حول الأرقام',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q15_C','Q15','C','We double-check our data collection methods to make sure the numbers are accurate','نتحقق مرة أخرى من طرق جمع البيانات للتأكد من دقة الأرقام',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q15_D','Q15','D','We analyze the data more deeply to understand what''s driving the poor performance','نحلل البيانات بعمق أكبر لفهم ما يؤدي إلى الأداء الضعيف',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q15_E','Q15','E','We immediately start testing different approaches to improve the results','نبدأ فوراً في اختبار مناهج مختلفة لتحسين النتائج',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q15_NA','Q15','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q15_NS','Q15','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q16_A','Q16','A','We discuss whether the data might be missing important context about why we do things this way','نناقش ما إذا كانت البيانات تفتقد سياقاً مهماً حول سبب قيامنا بالأشياء بهذه الطريقة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q16_B','Q16','B','We acknowledge the data but note that our practices have worked well for years','نعترف بالبيانات لكن نلاحظ أن ممارساتنا نجحت لسنوات',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q16_C','Q16','C','We ask our most experienced staff to review the data and share their thoughts','نطلب من أكثر موظفينا خبرة مراجعة البيانات ومشاركة أفكارهم',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q16_D','Q16','D','We dig deeper into the data to understand if this contradiction represents a real opportunity','نتعمق في البيانات لفهم ما إذا كان هذا التناقض يمثل فرصة حقيقية',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q16_E','Q16','E','We treat this as a prompt to experiment with new approaches while monitoring results','نتعامل مع هذا كحافز لتجريب مناهج جديدة مع مراقبة النتائج',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q16_NA','Q16','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q16_NS','Q16','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q17_A','Q17','A','We start with last year''s budget and adjust based on known changes','نبدأ بميزانية العام الماضي ونعدل بناء على التغييرات المعروفة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q17_B','Q17','B','We review our financial reports and discuss program manager requests','نراجع تقاريرنا المالية ونناقش طلبات مديري البرامج',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q17_C','Q17','C','We look at which programs have the highest participation or activity levels','ننظر إلى البرامج التي لديها أعلى مستويات مشاركة أو نشاط',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q17_D','Q17','D','We analyze cost per outcome and effectiveness data across different programs','نحلل التكلفة لكل نتيجة وبيانات الفعالية عبر البرامج المختلفة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q17_E','Q17','E','We use comprehensive financial modeling that includes projections and scenario analysis','نستخدم نمذجة مالية شاملة تتضمن إسقاطات وتحليل السيناريوهات',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q17_NA','Q17','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q17_NS','Q17','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q18_A','Q18','A','We pursue opportunities that align with our mission and leadership''s vision','نسعى وراء الفرص التي تتماشى مع مهمتنا ورؤية القيادة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q18_B','Q18','B','We research the basic market size and consider our organizational capacity','نبحث في حجم السوق الأساسي ونأخذ في الاعتبار قدرتنا التنظيمية',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q18_C','Q18','C','We analyze demographic data and assess competitive landscape','نحلل البيانات الديموغرافية ونقيم المشهد التنافسي',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q18_D','Q18','D','We conduct comprehensive market research including stakeholder needs assessment','نجري بحث سوق شامل يتضمن تقييم احتياجات أصحاب المصلحة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q18_E','Q18','E','We develop detailed business cases with financial projections and risk analysis','نطور حالات عمل مفصلة مع إسقاطات مالية وتحليل المخاطر',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q18_NA','Q18','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q18_NS','Q18','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q19_A','Q19','A','We share success stories and testimonials from people we''ve served','نشارك قصص النجاح والشهادات من الأشخاص الذين خدمناهم',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q19_B','Q19','B','We provide activity numbers showing how many people we''ve reached','نقدم أرقام النشاط التي تظهر كم شخص وصلنا إليه',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q19_C','Q19','C','We present outcome data showing the changes we''ve achieved','نعرض بيانات النتائج التي تظهر التغييرات التي حققناها',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q19_D','Q19','D','We offer comprehensive reports showing our impact compared to goals and benchmarks','نقدم تقارير شاملة تظهر تأثيرنا مقارنة بالأهداف والمعايير المرجعية',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q19_E','Q19','E','We provide detailed analysis showing our unique contribution and long-term outcomes','نقدم تحليلاً مفصلاً يظهر مساهمتنا الفريدة والنتائج طويلة الأمد',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q19_NA','Q19','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q19_NS','Q19','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q20_A','Q20','A','People generally ask their manager who decides based on job responsibilities','الناس عموماً يسألون مديرهم الذي يقرر بناء على مسؤوليات الوظيفة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q20_B','Q20','B','There''s a standard form to complete that goes through an approval process','هناك نموذج معياري لإكماله يمر بعملية موافقة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q20_C','Q20','C','Requests go through IT who check with the data owner before granting access','الطلبات تمر عبر تقنية المعلومات التي تتحقق مع مالك البيانات قبل منح الوصول',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q20_D','Q20','D','We have formal procedures that include security reviews for sensitive data access','لدينا إجراءات رسمية تتضمن مراجعات أمنية للوصول للبيانات الحساسة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q20_E','Q20','E','Our systems automatically manage access based on roles with continuous monitoring','أنظمتنا تدير الوصول تلقائياً بناء على الأدوار مع مراقبة مستمرة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q20_NA','Q20','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q20_NS','Q20','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q21_A','Q21','A','HR notifies IT who removes access when they get around to it','الموارد البشرية تخبر تقنية المعلومات التي تزيل الوصول عندما يجدون الوقت لذلك',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q21_B','Q21','B','IT receives a list of departing staff and removes access within a week or two','تقنية المعلومات تتلقى قائمة بالموظفين المغادرين وتزيل الوصول خلال أسبوع أو اثنين',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q21_C','Q21','C','Access removal is part of the standard departure checklist','إزالة الوصول جزء من قائمة مراجعة المغادرة المعيارية',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q21_D','Q21','D','IT automatically receives notification and removes access within 24 hours','تقنية المعلومات تتلقى إشعاراً تلقائياً وتزيل الوصول خلال 24 ساعة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q21_E','Q21','E','Systems automatically disable access immediately when someone''s employment ends','الأنظمة تعطل الوصول تلقائياً فوراً عند انتهاء توظيف شخص ما',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q21_NA','Q21','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q21_NS','Q21','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q22_A','Q22','A','We have basic backups but haven''t tested the recovery process recently','لدينا نسخ احتياطية أساسية لكننا لم نختبر عملية الاسترداد مؤخراً',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q22_B','Q22','B','Our IT team is confident they could restore most data, though it might take some time','فريق تقنية المعلومات واثق من قدرته على استرداد معظم البيانات، رغم أن ذلك قد يستغرق وقتاً',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q22_C','Q22','C','We have documented backup procedures and test them periodically','لدينا إجراءات نسخ احتياطية موثقة ونختبرها دورياً',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q22_D','Q22','D','We regularly test our backup systems and have proven recovery capabilities','نختبر أنظمة النسخ الاحتياطي بانتظام ولدينا قدرات استرداد مثبتة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q22_E','Q22','E','We have multiple backup systems with automated recovery that minimizes downtime','لدينا أنظمة نسخ احتياطية متعددة مع استرداد آلي يقلل من وقت التوقف',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q22_NA','Q22','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q22_NS','Q22','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q23_A','Q23','A','We assume people understand when they sign up for our services','نفترض أن الناس يفهمون عندما يسجلون في خدماتنا',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q23_B','Q23','B','We provide basic information about data use in our standard forms','نقدم معلومات أساسية حول استخدام البيانات في نماذجنا المعيارية',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q23_C','Q23','C','We have privacy notices that we make sure most people receive','لدينا إشعارات خصوصية نتأكد من أن معظم الناس يتلقونها',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q23_D','Q23','D','We ensure everyone gets clear, easy-to-understand information about data use','نضمن حصول الجميع على معلومات واضحة وسهلة الفهم حول استخدام البيانات',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q23_E','Q23','E','We use detailed consent processes that let people choose exactly how their data is used','نستخدم عمليات موافقة مفصلة تتيح للناس اختيار كيفية استخدام بياناتهم بالضبط',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q23_NA','Q23','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q23_NS','Q23','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q24_A','Q24','A','We address regulations when issues come up or we''re notified of changes','نتعامل مع اللوائح عند ظهور مشاكل أو عندما نُخطر بالتغييرات',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q24_B','Q24','B','We periodically review relevant regulations as part of our planning process','نراجع اللوائح ذات الصلة دورياً كجزء من عملية التخطيط',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q24_C','Q24','C','We monitor key regulations but might occasionally miss updates','نراقب اللوائح الرئيسية لكن قد نفوت التحديثات أحياناً',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q24_D','Q24','D','We have systematic processes to track and implement regulatory changes','لدينا عمليات منهجية لتتبع وتنفيذ التغييرات التنظيمية',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q24_E','Q24','E','We proactively monitor regulatory developments and often exceed requirements','نراقب التطورات التنظيمية بشكل استباقي وغالباً نتجاوز المتطلبات',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q24_NA','Q24','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q24_NS','Q24','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q25_A','Q25','A','We proceed if the new use seems reasonable and would benefit our mission','نمضي قدماً إذا بدا الاستخدام الجديد معقولاً ومفيداً لمهمتنا',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q25_B','Q25','B','We check our legal and policy requirements before proceeding','نتحقق من متطلباتنا القانونية والسياسية قبل المتابعة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q25_C','Q25','C','We consider how clients and stakeholders might feel about the new use','نأخذ في الاعتبار كيف قد يشعر العملاء وأصحاب المصلحة حول الاستخدام الجديد',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q25_D','Q25','D','We have formal processes to review ethical implications of new data uses','لدينا عمليات رسمية لمراجعة الآثار الأخلاقية لاستخدامات البيانات الجديدة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q25_E','Q25','E','We use comprehensive ethical frameworks with stakeholder input and ongoing oversight','نستخدم أطر أخلاقية شاملة مع مدخلات أصحاب المصلحة والإشراف المستمر',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q25_NA','Q25','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q25_NS','Q25','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q26_A','Q26','A','Leaders primarily rely on their experience and strategic vision for major decisions','القادة يعتمدون بشكل أساسي على خبرتهم ورؤيتهم الاستراتيجية للقرارات الرئيسية',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q26_B','Q26','B','Leaders occasionally reference data when it supports their preferred direction','القادة يشيرون أحياناً للبيانات عندما تدعم اتجاههم المفضل',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q26_C','Q26','C','Leaders regularly seek out data to inform their decision-making process','القادة يبحثون بانتظام عن البيانات لتوجيه عملية صنع القرار',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q26_D','Q26','D','Leaders consistently expect data to support most significant organizational decisions','القادة يتوقعون باستمرار أن تدعم البيانات معظم القرارات التنظيمية المهمة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q26_E','Q26','E','Leaders actively model data-driven thinking and require it from their teams','القادة يمثلون بنشاط التفكير المدفوع بالبيانات ويطلبونه من فرقهم',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q26_NA','Q26','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q26_NS','Q26','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q27_A','Q27','A','They focus on understanding why the data might not tell the complete story','يركزون على فهم لماذا قد لا تحكي البيانات القصة الكاملة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q27_B','Q27','B','They acknowledge the data but prefer to move slowly on major changes','يعترفون بالبيانات لكن يفضلون التحرك ببطء في التغييرات الرئيسية',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q27_C','Q27','C','They take the data seriously while considering other factors and context','يأخذون البيانات بجدية مع أخذ عوامل وسياق آخر في الاعتبار',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q27_D','Q27','D','They use the data to systematically review and adjust their approach','يستخدمون البيانات لمراجعة وتعديل نهجهم بشكل منهجي',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q27_E','Q27','E','They embrace challenging data as opportunities to improve and innovate','يتبنون البيانات المتحدية كفرص للتحسين والابتكار',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q27_NA','Q27','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q27_NS','Q27','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q28_A','Q28','A','Data improvements are considered along with many other competing priorities','تحسينات البيانات تُعتبر مع العديد من الأولويات المتنافسة الأخرى',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q28_B','Q28','B','Data improvements get attention when they clearly support operational needs','تحسينات البيانات تحصل على اهتمام عندما تدعم بوضوح الاحتياجات التشغيلية',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q28_C','Q28','C','Data capabilities are regularly discussed in technology planning conversations','قدرات البيانات تُناقش بانتظام في محادثات التخطيط التقني',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q28_D','Q28','D','Data improvements are recognized as important and receive dedicated resources','تحسينات البيانات معترف بها كمهمة وتحصل على موارد مخصصة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q28_E','Q28','E','Data capabilities are viewed as strategic assets deserving priority investment','قدرات البيانات تُنظر إليها كأصول استراتيجية تستحق الاستثمار الأولوي',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q28_NA','Q28','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q28_NS','Q28','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q29_A','Q29','A','Changes are announced and staff are expected to adapt over time','التغييرات تُعلن ويُتوقع من الموظفين التكيف مع الوقت',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q29_B','Q29','B','Leaders provide basic communication about why changes are needed','القادة يقدمون تواصلاً أساسياً حول لماذا التغييرات مطلوبة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q29_C','Q29','C','Leadership addresses concerns and provides support during transitions','القيادة تتعامل مع المخاوف وتقدم الدعم أثناء الانتقالات',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q29_D','Q29','D','Leaders actively manage resistance with structured change management processes','القادة يديرون المقاومة بنشاط مع عمليات إدارة تغيير منظمة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q29_E','Q29','E','Leadership creates enthusiasm and buy-in that minimizes resistance to data-driven changes','القيادة تخلق حماساً وقبولاً يقلل من المقاومة للتغييرات المدفوعة بالبيانات',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q29_NA','Q29','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q29_NS','Q29','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q30_A','Q30','A','We work with the technical skills we have and focus on simpler data projects','نعمل مع المهارات التقنية التي لدينا ونركز على مشاريع بيانات أبسط',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q30_B','Q30','B','We bring in consultants or contractors when we need specialized data expertise','نستعين بمستشارين أو متعاقدين عندما نحتاج خبرة بيانات متخصصة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q30_C','Q30','C','We have some good technical people but they''re often stretched across many projects','لدينا بعض الأشخاص التقنيين الجيدين لكنهم غالباً ممتدين عبر مشاريع كثيرة',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q30_D','Q30','D','We have solid technical capabilities that meet most of our data needs','لدينا قدرات تقنية قوية تلبي معظم احتياجاتنا من البيانات',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q30_E','Q30','E','We have exceptional technical depth and can tackle sophisticated data challenges','لدينا عمق تقني استثنائي ويمكننا التعامل مع تحديات بيانات متطورة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q30_NA','Q30','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q30_NS','Q30','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q31_A','Q31','A','We hire people with the data skills they need for their specific roles','نوظف أشخاصاً بمهارات البيانات التي يحتاجونها لأدوارهم المحددة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q31_B','Q31','B','Staff pick up data skills informally as needed for their work','الموظفون يكتسبون مهارات البيانات بشكل غير رسمي حسب الحاجة لعملهم',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q31_C','Q31','C','We provide basic data training and resources when people need them','نقدم تدريب وموارد بيانات أساسية عندما يحتاجها الناس',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q31_D','Q31','D','We have structured programs to build data literacy across the organization','لدينا برامج منظمة لبناء محو الأمية البيانات عبر المؤسسة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q31_E','Q31','E','We systematically develop advanced data fluency at every organizational level','نطور بشكل منهجي طلاقة بيانات متقدمة في كل مستوى تنظيمي',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q31_NA','Q31','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q31_NS','Q31','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q32_A','Q32','A','We focus on hiring for other skills and develop data capabilities internally','نركز على التوظيف لمهارات أخرى ونطور قدرات البيانات داخلياً',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q32_B','Q32','B','We have some success attracting data talent but face competition and turnover','لدينا بعض النجاح في جذب مواهب البيانات لكن نواجه منافسة ودوران',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q32_C','Q32','C','We generally succeed in building a team with adequate data skills','ننجح عموماً في بناء فريق بمهارات بيانات كافية',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q32_D','Q32','D','We have a strong track record of attracting and keeping good data talent','لدينا سجل قوي في جذب والاحتفاظ بمواهب بيانات جيدة',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q32_E','Q32','E','We''re recognized as a destination for top data talent and rarely lose key people','نحن معترف بنا كوجهة لأفضل مواهب البيانات ونادراً ما نفقد أشخاصاً مهمين',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q32_NA','Q32','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q32_NS','Q32','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q33_A','Q33','A','Staff are respectful of established practices and focus on executing well','الموظفون محترمون للممارسات المعمول بها ويركزون على التنفيذ الجيد',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q33_B','Q33','B','People occasionally raise questions but prefer to work within existing approaches','الناس يطرحون أسئلة أحياناً لكن يفضلون العمل ضمن المناهج الموجودة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q33_C','Q33','C','Staff feel comfortable sharing data insights that might challenge current thinking','الموظفون يشعرون بالراحة في مشاركة رؤى البيانات التي قد تتحدى التفكير الحالي',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q33_D','Q33','D','We actively encourage people to use data to question and improve our methods','نشجع الناس بنشاط على استخدام البيانات للتشكيك في وتحسين طرقنا',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q33_E','Q33','E','Challenging assumptions with data is celebrated and seen as essential to our success','تحدي الافتراضات بالبيانات يُحتفى به ويُنظر إليه كأساسي لنجاحنا',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q33_NA','Q33','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q33_NS','Q33','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q34_A','Q34','A','Technical and program teams generally work independently on their respective areas','الفرق التقنية وفرق البرامج تعمل عموماً بشكل مستقل في مجالاتها المختصة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q34_B','Q34','B','Teams coordinate when needed but maintain their separate focuses and priorities','الفرق تنسق عند الحاجة لكن تحافظ على تركيزها وأولوياتها المنفصلة',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q34_C','Q34','C','There''s regular communication and some joint projects between technical and program staff','هناك تواصل منتظم وبعض المشاريع المشتركة بين الموظفين التقنيين وموظفي البرامج',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q34_D','Q34','D','We have strong collaboration with integrated workflows across technical and program teams','لدينا تعاون قوي مع سير عمل متكامل عبر الفرق التقنية وفرق البرامج',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q34_E','Q34','E','Our technical and program teams work seamlessly together with shared goals and accountability','فرقنا التقنية وفرق البرامج تعمل بسلاسة معاً بأهداف ومساءلة مشتركة',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q34_NA','Q34','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q34_NS','Q34','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "question_options" VALUES ('Q35_A','Q35','A','We prefer to implement proven approaches rather than experiment with new methods','نفضل تنفيذ مناهج مثبتة بدلاً من التجريب مع طرق جديدة',1,'Initial',NULL,NULL,1);
INSERT INTO "question_options" VALUES ('Q35_B','Q35','B','We occasionally try new approaches when they seem likely to succeed','نجرب أحياناً مناهج جديدة عندما تبدو محتملة النجاح',2,'Developing',NULL,NULL,2);
INSERT INTO "question_options" VALUES ('Q35_C','Q35','C','We''re open to testing new ideas when we have time and resources available','نحن منفتحون لاختبار أفكار جديدة عندما يكون لدينا وقت وموارد متاحة',3,'Defined',NULL,NULL,3);
INSERT INTO "question_options" VALUES ('Q35_D','Q35','D','We regularly experiment with data-driven improvements and learn from the results','نجري تجارب بانتظام مع تحسينات مدفوعة بالبيانات ونتعلم من النتائج',4,'Advanced',NULL,NULL,4);
INSERT INTO "question_options" VALUES ('Q35_E','Q35','E','Experimentation and data-driven learning are core to how we continuously improve','التجريب والتعلم المدفوع بالبيانات أساسيان في كيفية تحسننا المستمر',5,'Optimized',NULL,NULL,5);
INSERT INTO "question_options" VALUES ('Q35_NA','Q35','NA','Not applicable to my role/organization','غير قابل للتطبيق على دوري/مؤسستي',0,'Not Applicable',NULL,NULL,6);
INSERT INTO "question_options" VALUES ('Q35_NS','Q35','NS','Not sure/Don''t know','غير متأكد/لا أعرف',0,'Not Sure',NULL,NULL,7);
INSERT INTO "questions" VALUES ('Q1','DATA_COLLECTION','Data Needs Identification','تحديد احتياجات البيانات','How does your organization typically identify what data needs to be collected?','كيف تحدد مؤسستكم عادة البيانات التي تحتاج إلى جمعها؟','Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.','تحتاج مؤسستكم إلى جمع البيانات بشكل منهجي من مصادر مختلفة بما في ذلك العملاء والعمليات والأنظمة والشركاء الخارجيين لدعم اتخاذ القرارات والعمليات.','🎯',1,1);
INSERT INTO "questions" VALUES ('Q2','DATA_COLLECTION','Collection Process Design','تصميم عملية الجمع','When your organization starts collecting data from a new source, what''s your typical approach?','عندما تبدأ مؤسستكم في جمع البيانات من مصدر جديد، ما هو نهجكم المعتاد؟','Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.','تحتاج مؤسستكم إلى جمع البيانات بشكل منهجي من مصادر مختلفة بما في ذلك العملاء والعمليات والأنظمة والشركاء الخارجيين لدعم اتخاذ القرارات والعمليات.','⚙️',2,0);
INSERT INTO "questions" VALUES ('Q3','DATA_COLLECTION','Collection Standardization','توحيد عملية الجمع','How does your organization ensure data is collected consistently across different departments or locations?','كيف تضمن مؤسستكم جمع البيانات بثبات عبر الأقسام أو المواقع المختلفة؟','Your organization needs to systematically collect data from various sources including customers, operations, systems, and external partners to support decision-making and operations.','تحتاج مؤسستكم إلى جمع البيانات بشكل منهجي من مصادر مختلفة بما في ذلك العملاء والعمليات والأنظمة والشركاء الخارجيين لدعم اتخاذ القرارات والعمليات.','📏',3,0);
INSERT INTO "questions" VALUES ('Q4','INFRASTRUCTURE','Data Integration Capability','تكامل مصادر البيانات','When your organization needs to combine data from different sources for analysis, what''s the typical experience?','عندما تحتاج مؤسستكم للجمع بين البيانات من مصادر متعددة، كيف يحدث ذلك عادة؟','Your organization relies on various technology systems to store, manage, process, and integrate data effectively to support your operations and analysis needs.','مؤسستكم تحتاج إلى أساس تقني قوي لتخزين ومعالجة ودمج البيانات من مصادر مختلفة بفعالية، مع ضمان الوصول الموثوق والأداء المناسب لجميع المستخدمين.','🔗',4,1);
INSERT INTO "questions" VALUES ('Q5','INFRASTRUCTURE','System Reliability and Performance','مرونة الأنظمة','When your organization''s data systems experience problems or slowdowns, what typically happens?','عندما تغيرت احتياجات بيانات مؤسستكم مؤخراً، كيف استجابت أنظمتكم التقنية؟','Your organization relies on various technology systems to store, manage, process, and integrate data effectively to support your operations and analysis needs.','مؤسستكم تحتاج إلى أساس تقني قوي لتخزين ومعالجة ودمج البيانات من مصادر مختلفة بفعالية، مع ضمان الوصول الموثوق والأداء المناسب لجميع المستخدمين.','🖥️',5,0);
INSERT INTO "questions" VALUES ('Q6','INFRASTRUCTURE','Scalability and Capacity Management','أداء النظام','How does your organization typically handle growing data storage and processing needs?','كيف تتعامل أنظمة البيانات في مؤسستكم مع الزيادة في حجم البيانات أو عدد المستخدمين؟','Your organization relies on various technology systems to store, manage, process, and integrate data effectively to support your operations and analysis needs.','مؤسستكم تحتاج إلى أساس تقني قوي لتخزين ومعالجة ودمج البيانات من مصادر مختلفة بفعالية، مع ضمان الوصول الموثوق والأداء المناسب لجميع المستخدمين.','📈',6,0);
INSERT INTO "questions" VALUES ('Q7','QUALITY','Error Detection and Correction','اكتشاف مشاكل الجودة','When staff notice errors or inconsistencies in your organization''s data, what typically happens?','عندما تكتشف مؤسستكم أن البيانات غير دقيقة أو غير مكتملة، كيف تتعاملون مع هذا عادة؟','Your organization collects and manages large amounts of data from multiple sources, and ensuring this data is accurate, complete, and reliable is critical for making good decisions.','مؤسستكم تعتمد على البيانات الدقيقة والموثوقة لاتخاذ القرارات، وتحتاج لضمان أن المعلومات المستخدمة في التحليل والتقارير صحيحة ومتسقة وحديثة.','🔍',7,1);
INSERT INTO "questions" VALUES ('Q8','QUALITY','Data Consistency Management','معايير البيانات','When the same information appears in multiple systems across your organization, how consistent is it?','ما مدى وضوح معايير جودة البيانات في مؤسستكم؟','Your organization collects and manages large amounts of data from multiple sources, and ensuring this data is accurate, complete, and reliable is critical for making good decisions.','مؤسستكم تعتمد على البيانات الدقيقة والموثوقة لاتخاذ القرارات، وتحتاج لضمان أن المعلومات المستخدمة في التحليل والتقارير صحيحة ومتسقة وحديثة.','⚖️',8,0);
INSERT INTO "questions" VALUES ('Q9','QUALITY','Data Standards and Documentation','منع مشاكل الجودة','When new staff join your organization, how do they learn what different data fields mean and how to use them properly?','كيف تمنع مؤسستكم مشاكل جودة البيانات من الحدوث في المقام الأول؟','Your organization collects and manages large amounts of data from multiple sources, and ensuring this data is accurate, complete, and reliable is critical for making good decisions.','مؤسستكم تعتمد على البيانات الدقيقة والموثوقة لاتخاذ القرارات، وتحتاج لضمان أن المعلومات المستخدمة في التحليل والتقارير صحيحة ومتسقة وحديثة.','📚',9,0);
INSERT INTO "questions" VALUES ('Q10','ANALYSIS','Causal Analysis Capability','عمق التحليل','When trying to understand why something happened in your organization, what''s your typical approach?','عندما تحتاج مؤسستكم لفهم الاتجاهات أو الأنماط في البيانات، ما هو نهجكم المعتاد؟','Your organization faces complex operational challenges and needs to understand what''s causing certain outcomes, identify patterns, and predict future trends to make informed decisions.','مؤسستكم تحتاج لاستخراج رؤى مفيدة من البيانات لفهم الأداء وتحديد الفرص والمخاطر واتخاذ قرارات مدروسة بناءً على الأدلة.','🔬',10,1);
INSERT INTO "questions" VALUES ('Q11','ANALYSIS','Predictive Analysis and Planning','التحليل التنبؤي','When planning for the upcoming year, how does your organization typically approach potential future challenges?','إلى أي مدى تستخدم مؤسستكم البيانات للتنبؤ بالنتائج أو الاتجاهات المستقبلية؟','Your organization faces complex operational challenges and needs to understand what''s causing certain outcomes, identify patterns, and predict future trends to make informed decisions.','مؤسستكم تحتاج لاستخراج رؤى مفيدة من البيانات لفهم الأداء وتحديد الفرص والمخاطر واتخاذ قرارات مدروسة بناءً على الأدلة.','🔮',11,0);
INSERT INTO "questions" VALUES ('Q12','ANALYSIS','Program Evaluation Rigor','تعقيد التحليل','How does your organization typically investigate whether your programs are working effectively?','ما هو مستوى تعقيد التحليل الذي يمكن لمؤسستكم التعامل معه؟','Your organization faces complex operational challenges and needs to understand what''s causing certain outcomes, identify patterns, and predict future trends to make informed decisions.','مؤسستكم تحتاج لاستخراج رؤى مفيدة من البيانات لفهم الأداء وتحديد الفرص والمخاطر واتخاذ قرارات مدروسة بناءً على الأدلة.','📊',12,0);
INSERT INTO "questions" VALUES ('Q13','ANALYSIS','Comparative Analysis and Benchmarking','الوصول للتحليل','When comparing your organization''s performance to others, what approach do you typically take?','من يستطيع إجراء تحليل متقدم للبيانات في مؤسستكم؟','Your organization faces complex operational challenges and needs to understand what''s causing certain outcomes, identify patterns, and predict future trends to make informed decisions.','مؤسستكم تحتاج لاستخراج رؤى مفيدة من البيانات لفهم الأداء وتحديد الفرص والمخاطر واتخاذ قرارات مدروسة بناءً على الأدلة.','📈',13,0);
INSERT INTO "questions" VALUES ('Q14','APPLICATION','Insight Implementation Process','تطبيق الرؤى','When your organization identifies a significant data insight, what typically happens next?','عندما يكتشف التحليل رؤية مهمة، ماذا يحدث عادة بعد ذلك؟','Your organization has been analyzing data and has identified interesting patterns and insights. Now you need to decide what to do with these findings to improve operations and achieve better results.','مؤسستكم تحتاج لتحويل رؤى البيانات إلى إجراءات ملموسة وتحسينات تشغيلية تؤدي إلى نتائج أفضل للمؤسسة.','⚡',14,0);
INSERT INTO "questions" VALUES ('Q15','APPLICATION','Performance Problem Response','الاستجابة للأداء الضعيف','When a program shows poor performance in your data, how does your organization typically respond?','عندما تظهر البيانات أداءً ضعيفاً لبرنامج ما، كيف تستجيب مؤسستكم عادة؟','Your organization has been analyzing data and has identified interesting patterns and insights. Now you need to decide what to do with these findings to improve operations and achieve better results.','مؤسستكم تحتاج لتحويل رؤى البيانات إلى إجراءات ملموسة وتحسينات تشغيلية تؤدي إلى نتائج أفضل للمؤسسة.','🔧',15,0);
INSERT INTO "questions" VALUES ('Q16','APPLICATION','Change Management for Data-Driven Insights','التحدي للممارسات الحالية','How does your organization typically handle situations where data contradicts established practices?','عندما تشير البيانات إلى أن شيئاً تفعلونه قد لا يكون فعالاً، كيف تتفاعل مؤسستكم؟','Your organization has been analyzing data and has identified interesting patterns and insights. Now you need to decide what to do with these findings to improve operations and achieve better results.','مؤسستكم تحتاج لتحويل رؤى البيانات إلى إجراءات ملموسة وتحسينات تشغيلية تؤدي إلى نتائج أفضل للمؤسسة.','🔄',16,1);
INSERT INTO "questions" VALUES ('Q17','STRATEGY','Data-Driven Resource Allocation','توثيق الاستراتيجية','When budget discussions arise, what information does your organization typically reference first?','عندما تطلب القيادة رؤية استراتيجية البيانات في مؤسستكم، ماذا يحدث عادة؟','Your organization is making important strategic decisions about resource allocation, new initiatives, market expansion, and communicating value to stakeholders using data insights.','مؤسستكم تحتاج لدمج رؤى البيانات في اتخاذ القرارات رفيعة المستوى والتخطيط الاستراتيجي لضمان أن البيانات تدعم الأهداف التنظيمية.','💰',17,0);
INSERT INTO "questions" VALUES ('Q18','STRATEGY','Strategic Expansion Analysis','محاذاة الاستراتيجية','How does your organization typically make decisions about entering new markets or program areas?','كيف ترتبط جهود البيانات في مؤسستكم بأهدافكم التنظيمية الأوسع؟','Your organization is making important strategic decisions about resource allocation, new initiatives, market expansion, and communicating value to stakeholders using data insights.','مؤسستكم تحتاج لدمج رؤى البيانات في اتخاذ القرارات رفيعة المستوى والتخطيط الاستراتيجي لضمان أن البيانات تدعم الأهداف التنظيمية.','🚀',18,0);
INSERT INTO "questions" VALUES ('Q19','STRATEGY','Impact Communication and Accountability','الاستثمار في البيانات','When stakeholders ask about your organization''s impact and effectiveness, how do you typically respond?','كيف تتخذ مؤسستكم قرارات حول الاستثمار في قدرات البيانات الجديدة؟','Your organization is making important strategic decisions about resource allocation, new initiatives, market expansion, and communicating value to stakeholders using data insights.','مؤسستكم تحتاج لدمج رؤى البيانات في اتخاذ القرارات رفيعة المستوى والتخطيط الاستراتيجي لضمان أن البيانات تدعم الأهداف التنظيمية.','📢',19,1);
INSERT INTO "questions" VALUES ('Q20','SECURITY','Access Control Management','ضوابط الوصول','How does your organization typically handle requests for access to sensitive data?','كيف تتحكم مؤسستكم في من يمكنه الوصول لأنواع مختلفة من البيانات؟','Your organization handles sensitive information that needs to be protected from unauthorized access, breaches, and loss while still allowing authorized staff to access the data they need for their work.','مؤسستكم تحتاج لحماية أصول البيانات من الوصول غير المصرح به، والانتهاكات، وفقدان البيانات مع الحفاظ على إمكانية الوصول المناسب للمستخدمين المصرح لهم.','🔐',20,0);
INSERT INTO "questions" VALUES ('Q21','SECURITY','Security Lifecycle Management','مراقبة الأمان','When staff leave your organization, what happens to their access to data systems?','كيف تراقب مؤسستكم الوصول غير المعتاد أو المشبوه للبيانات؟','Your organization handles sensitive information that needs to be protected from unauthorized access, breaches, and loss while still allowing authorized staff to access the data they need for their work.','مؤسستكم تحتاج لحماية أصول البيانات من الوصول غير المصرح به، والانتهاكات، وفقدان البيانات مع الحفاظ على إمكانية الوصول المناسب للمستخدمين المصرح لهم.','👋',21,0);
INSERT INTO "questions" VALUES ('Q22','SECURITY','Disaster Recovery and Business Continuity','استرداد البيانات','If your organization''s data systems were compromised, how confident are you in your ability to recover?','إذا فقدت مؤسستكم الوصول لبيانات مهمة غداً، كم من الوقت ستحتاجون لاستردادها؟','Your organization handles sensitive information that needs to be protected from unauthorized access, breaches, and loss while still allowing authorized staff to access the data they need for their work.','مؤسستكم تحتاج لحماية أصول البيانات من الوصول غير المصرح به، والانتهاكات، وفقدان البيانات مع الحفاظ على إمكانية الوصول المناسب للمستخدمين المصرح لهم.','🛡️',22,1);
INSERT INTO "questions" VALUES ('Q23','RESPONSIBLE','Privacy and Consent Management','الشفافية مع العملاء','When collecting personal information from clients or customers, how does your organization ensure they understand how their data will be used?','كيف تتعامل مؤسستكم مع شفافية استخدام بيانات العملاء؟','Your organization collects personal information from clients and customers, and you need to ensure this data is used ethically, transparently, and in compliance with relevant regulations and privacy laws.','مؤسستكم تحتاج لضمان أن جميع استخدامات البيانات أخلاقية ومتوافقة مع القوانين وتحافظ على ثقة أصحاب المصلحة من خلال الممارسات الشفافة والمسؤولة.','🔒',23,0);
INSERT INTO "questions" VALUES ('Q24','RESPONSIBLE','Regulatory Compliance Management','الامتثال التنظيمي','How does your organization stay current with regulations that affect your data practices?','كيف تبقى مؤسستكم محدثة مع متطلبات حماية البيانات والخصوصية؟','Your organization collects personal information from clients and customers, and you need to ensure this data is used ethically, transparently, and in compliance with relevant regulations and privacy laws.','مؤسستكم تحتاج لضمان أن جميع استخدامات البيانات أخلاقية ومتوافقة مع القوانين وتحافظ على ثقة أصحاب المصلحة من خلال الممارسات الشفافة والمسؤولة.','📋',24,0);
INSERT INTO "questions" VALUES ('Q25','RESPONSIBLE','Ethical Data Use Evaluation','تقييم الاستخدامات الجديدة','When considering new uses for existing data, how does your organization evaluate whether those uses are appropriate?','عند النظر في استخدامات جديدة للبيانات الموجودة، كيف تقيم مؤسستكم ما إذا كانت هذه الاستخدامات مناسبة؟','Your organization collects personal information from clients and customers, and you need to ensure this data is used ethically, transparently, and in compliance with relevant regulations and privacy laws.','مؤسستكم تحتاج لضمان أن جميع استخدامات البيانات أخلاقية ومتوافقة مع القوانين وتحافظ على ثقة أصحاب المصلحة من خلال الممارسات الشفافة والمسؤولة.','⚖️',25,1);
INSERT INTO "questions" VALUES ('Q26','LEADERSHIP','Leadership Data Advocacy','دعم القيادة لاتخاذ القرارات المبنية على البيانات','How actively does senior leadership champion data-driven decision making throughout the organization?','كم تدعم القيادة العليا بنشاط اتخاذ القرارات المبنية على البيانات في جميع أنحاء المؤسسة؟','Your organization''s senior leadership team is responsible for setting direction, making strategic decisions, investing in capabilities, and creating an environment where data can be effectively used throughout the organization.','القيادة العليا في مؤسستكم مسؤولة عن تحديد الاتجاه واتخاذ القرارات الاستراتيجية والاستثمار في القدرات وخلق بيئة يمكن فيها استخدام البيانات بفعالية في جميع أنحاء المؤسسة.','👑',26,0);
INSERT INTO "questions" VALUES ('Q27','LEADERSHIP','Leadership Adaptability to Data Insights','الاستجابة للحقائق الصعبة','When data reveals uncomfortable truths, how constructively does your organization''s leadership respond and adapt?','عندما تكشف البيانات حقائق غير مريحة، كم تستجيب قيادة مؤسستكم بشكل بناء وتتكيف؟','Your organization''s senior leadership team is responsible for setting direction, making strategic decisions, investing in capabilities, and creating an environment where data can be effectively used throughout the organization.','القيادة العليا في مؤسستكم مسؤولة عن تحديد الاتجاه واتخاذ القرارات الاستراتيجية والاستثمار في القدرات وخلق بيئة يمكن فيها استخدام البيانات بفعالية في جميع أنحاء المؤسسة.','🎯',27,0);
INSERT INTO "questions" VALUES ('Q28','LEADERSHIP','Strategic Investment in Data Capabilities','الاستثمار في التكنولوجيا','When investing in new technology or capabilities, how does your leadership prioritize data-related improvements?','عند الاستثمار في تكنولوجيا أو قدرات جديدة، كيف تعطي قيادتكم الأولوية للتحسينات المتعلقة بالبيانات؟','Your organization''s senior leadership team is responsible for setting direction, making strategic decisions, investing in capabilities, and creating an environment where data can be effectively used throughout the organization.','القيادة العليا في مؤسستكم مسؤولة عن تحديد الاتجاه واتخاذ القرارات الاستراتيجية والاستثمار في القدرات وخلق بيئة يمكن فيها استخدام البيانات بفعالية في جميع أنحاء المؤسسة.','💡',28,1);
INSERT INTO "questions" VALUES ('Q29','LEADERSHIP','Change Management for Data Initiatives','النمذجة القيادية','When implementing data-driven changes, how effectively does leadership manage organizational resistance and change?','كم تُظهر القيادة العليا في مؤسستكم استخدام البيانات في قراراتهم الخاصة؟','Your organization''s senior leadership team is responsible for setting direction, making strategic decisions, investing in capabilities, and creating an environment where data can be effectively used throughout the organization.','القيادة العليا في مؤسستكم مسؤولة عن تحديد الاتجاه واتخاذ القرارات الاستراتيجية والاستثمار في القدرات وخلق بيئة يمكن فيها استخدام البيانات بفعالية في جميع أنحاء المؤسسة.','🌟',29,0);
INSERT INTO "questions" VALUES ('Q30','TALENT','Technical and Analytical Talent Adequacy','المهارات الحالية','To what extent does your organization have the right mix of technical and analytical talent to support data initiatives?','كيف تصف مستوى مهارات البيانات الحالي في مؤسستكم؟','Your organization needs people with the right skills and capabilities to collect, analyze, and use data effectively at all levels, and must develop these capabilities over time as needs evolve.','مؤسستكم تحتاج للأشخاص المناسبين بالمهارات المناسبة لجمع وتحليل واستخدام البيانات بفعالية، سواء من خلال الموظفين الحاليين أو التوظيف الجديد أو التدريب والتطوير.','🧠',30,0);
INSERT INTO "questions" VALUES ('Q31','TALENT','Organization-wide Data Literacy Development','التدريب والتطوير','How well does your organization develop data fluency among staff at all levels, not just technical roles?','كيف تطور مؤسستكم مهارات البيانات بين موظفيكم؟','Your organization needs people with the right skills and capabilities to collect, analyze, and use data effectively at all levels, and must develop these capabilities over time as needs evolve.','مؤسستكم تحتاج للأشخاص المناسبين بالمهارات المناسبة لجمع وتحليل واستخدام البيانات بفعالية، سواء من خلال الموظفين الحاليين أو التوظيف الجديد أو التدريب والتطوير.','🎓',31,1);
INSERT INTO "questions" VALUES ('Q32','TALENT','Analytical Talent Acquisition and Retention','التوظيف والاحتفاظ','How successfully does your organization recruit and retain talent with strong analytical and data interpretation skills?','كم تنجح مؤسستكم في جذب والاحتفاظ بالأشخاص ذوي مهارات البيانات القوية؟','Your organization needs people with the right skills and capabilities to collect, analyze, and use data effectively at all levels, and must develop these capabilities over time as needs evolve.','مؤسستكم تحتاج للأشخاص المناسبين بالمهارات المناسبة لجمع وتحليل واستخدام البيانات بفعالية، سواء من خلال الموظفين الحاليين أو التوظيف الجديد أو التدريب والتطوير.','🏆',32,0);
INSERT INTO "questions" VALUES ('Q33','CULTURE','Data-Driven Innovation Culture','ثقافة البيانات','How effectively does your organization foster a culture where staff feel empowered to question assumptions using data?','كم يشعر الناس في مؤسستكم بالراحة في استخدام البيانات في عملهم اليومي؟','Your organization''s culture determines how comfortable people feel using data, sharing insights, collaborating across departments, experimenting with new approaches, and learning from both successes and failures.','ثقافة مؤسستكم تحدد مدى شعور الناس بالراحة في استخدام البيانات ومشاركة الرؤى والتعاون عبر الأقسام وتجريب أساليب جديدة والتعلم من النجاحات والإخفاقات.','💡',33,1);
INSERT INTO "questions" VALUES ('Q34','CULTURE','Cross-Functional Data Collaboration','التعاون متعدد الوظائف','How well does your organization create cross-functional collaboration between technical data teams and program staff?','كم تنجح مؤسستكم في خلق التعاون متعدد الوظائف بين فرق البيانات التقنية وموظفي البرامج؟','Your organization''s culture determines how comfortable people feel using data, sharing insights, collaborating across departments, experimenting with new approaches, and learning from both successes and failures.','ثقافة مؤسستكم تحدد مدى شعور الناس بالراحة في استخدام البيانات ومشاركة الرؤى والتعاون عبر الأقسام وتجريب أساليب جديدة والتعلم من النجاحات والإخفاقات.','🤝',34,0);
INSERT INTO "questions" VALUES ('Q35','CULTURE','Experimentation and Learning Culture','ثقافة التجريب والتعلم','To what extent does your organization''s culture encourage experimentation and learning from data-driven pilot programs?','إلى أي مدى تشجع ثقافة مؤسستكم التجريب والتعلم من البرامج التجريبية المبنية على البيانات؟','Your organization''s culture determines how comfortable people feel using data, sharing insights, collaborating across departments, experimenting with new approaches, and learning from both successes and failures.','ثقافة مؤسستكم تحدد مدى شعور الناس بالراحة في استخدام البيانات ومشاركة الرؤى والتعاون عبر الأقسام وتجريب أساليب جديدة والتعلم من النجاحات والإخفاقات.','🔬',35,0);
INSERT INTO "roles" VALUES ('executive','Executive/C-Suite Level','المستوى التنفيذي/كبار القادة','CEO, COO, CTO, CDO, VP Strategy','الرئيس التنفيذي، مدير العمليات، مدير التكنولوجيا، نائب رئيس الاستراتيجية','Strategic decision-making and direction','اتخاذ القرارات الاستراتيجية والتوجيه','Strategic leadership recommendations','توصيات القيادة الاستراتيجية',1);
INSERT INTO "roles" VALUES ('it-technology','IT/Technology Department','قسم تكنولوجيا المعلومات/التكنولوجيا','IT Director, Data Engineer, System Admin','مدير تكنولوجيا المعلومات، مهندس البيانات، مدير النظم','Technical systems and infrastructure','الأنظمة التقنية والبنية التحتية','Technical infrastructure recommendations','توصيات البنية التحتية التقنية',2);
INSERT INTO "roles" VALUES ('operations','Operations & Program Management','العمليات وإدارة البرامج','Program Manager, Operations Director','مدير البرامج، مدير العمليات','Day-to-day operations and program delivery','العمليات اليومية وتسليم البرامج','Operational efficiency recommendations','توصيات الكفاءة التشغيلية',3);
INSERT INTO "roles" VALUES ('analytics','Data & Analytics','البيانات والتحليلات','Data Analyst, Business Intelligence, Researcher','محلل البيانات، ذكاء الأعمال، باحث','Data analysis and insights generation','تحليل البيانات وتوليد الرؤى','Analytics and insights recommendations','توصيات التحليلات والرؤى',4);
INSERT INTO "roles" VALUES ('compliance','Compliance & Risk Management','الامتثال وإدارة المخاطر','Compliance Officer, Risk Manager, Legal','مسؤول الامتثال، مدير المخاطر، قانوني','Governance, risk, and regulatory compliance','الحوكمة والمخاطر والامتثال التنظيمي','Governance and compliance recommendations','توصيات الحوكمة والامتثال',5);
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_DATA_COLLECTION_subdomain','session_1757496004892_7h9dtehvm',NULL,'DATA_COLLECTION','subdomain',2.67,53.3,'Developing',3,3,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_INFRASTRUCTURE_subdomain','session_1757496004892_7h9dtehvm',NULL,'INFRASTRUCTURE','subdomain',2.67,53.3,'Developing',3,3,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_QUALITY_subdomain','session_1757496004892_7h9dtehvm',NULL,'QUALITY','subdomain',3.0,60.0,'Defined',3,3,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_ANALYSIS_subdomain','session_1757496004892_7h9dtehvm',NULL,'ANALYSIS','subdomain',3.25,65.0,'Defined',4,4,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_APPLICATION_subdomain','session_1757496004892_7h9dtehvm',NULL,'APPLICATION','subdomain',3.67,73.3,'Advanced',3,3,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_STRATEGY_subdomain','session_1757496004892_7h9dtehvm',NULL,'STRATEGY','subdomain',3.33,66.7,'Defined',3,3,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_SECURITY_subdomain','session_1757496004892_7h9dtehvm',NULL,'SECURITY','subdomain',3.33,66.7,'Defined',3,3,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_RESPONSIBLE_subdomain','session_1757496004892_7h9dtehvm',NULL,'RESPONSIBLE','subdomain',3.0,60.0,'Defined',3,3,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_LEADERSHIP_subdomain','session_1757496004892_7h9dtehvm',NULL,'LEADERSHIP','subdomain',3.0,60.0,'Defined',4,4,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_TALENT_subdomain','session_1757496004892_7h9dtehvm',NULL,'TALENT','subdomain',3.0,60.0,'Defined',2,2,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_CULTURE_subdomain','session_1757496004892_7h9dtehvm',NULL,'CULTURE','subdomain',4.0,80.0,'Advanced',3,3,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757496004892_7h9dtehvm_overall','session_1757496004892_7h9dtehvm',NULL,NULL,'overall',3.18,63.5,'Defined',34,35,'2025-09-10 09:38:59');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_DATA_COLLECTION_subdomain','session_1757521776943_zxdo2g3e7',NULL,'DATA_COLLECTION','subdomain',4.0,80.0,'Advanced',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_INFRASTRUCTURE_subdomain','session_1757521776943_zxdo2g3e7',NULL,'INFRASTRUCTURE','subdomain',3.0,60.0,'Defined',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_QUALITY_subdomain','session_1757521776943_zxdo2g3e7',NULL,'QUALITY','subdomain',2.0,40.0,'Developing',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_ANALYSIS_subdomain','session_1757521776943_zxdo2g3e7',NULL,'ANALYSIS','subdomain',5.0,100.0,'Optimized',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_APPLICATION_subdomain','session_1757521776943_zxdo2g3e7',NULL,'APPLICATION','subdomain',2.0,40.0,'Developing',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_STRATEGY_subdomain','session_1757521776943_zxdo2g3e7',NULL,'STRATEGY','subdomain',3.0,60.0,'Defined',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_SECURITY_subdomain','session_1757521776943_zxdo2g3e7',NULL,'SECURITY','subdomain',4.0,80.0,'Advanced',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_RESPONSIBLE_subdomain','session_1757521776943_zxdo2g3e7',NULL,'RESPONSIBLE','subdomain',4.0,80.0,'Advanced',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_LEADERSHIP_subdomain','session_1757521776943_zxdo2g3e7',NULL,'LEADERSHIP','subdomain',5.0,100.0,'Optimized',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_TALENT_subdomain','session_1757521776943_zxdo2g3e7',NULL,'TALENT','subdomain',1.0,20.0,'Initial',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_CULTURE_subdomain','session_1757521776943_zxdo2g3e7',NULL,'CULTURE','subdomain',5.0,100.0,'Optimized',1,1,'2025-09-10 16:30:57');
INSERT INTO "session_scores" VALUES ('session_1757521776943_zxdo2g3e7_overall','session_1757521776943_zxdo2g3e7',NULL,NULL,'overall',3.45,69.1,'Defined',11,35,'2025-09-10 16:30:57');
INSERT INTO "subdomains" VALUES ('DATA_COLLECTION','DATA_LIFECYCLE','Data Collection','جمع البيانات','The organization''s approach to systematically identifying, gathering, and capturing data from various sources','نهج المؤسسة لتحديد وجمع والتقاط البيانات بشكل منهجي من مصادر مختلفة',1);
INSERT INTO "subdomains" VALUES ('INFRASTRUCTURE','DATA_LIFECYCLE','Infrastructure','البنية التحتية','Technical foundation and systems capability for storing, processing, and integrating data effectively','الأساس التقني وقدرات الأنظمة لتخزين ومعالجة ودمج البيانات بفعالية',2);
INSERT INTO "subdomains" VALUES ('QUALITY','DATA_LIFECYCLE','Quality','الجودة','Systematic management of data accuracy, consistency, and reliability throughout the organization','الإدارة المنهجية لدقة البيانات واتساقها وموثوقيتها في جميع أنحاء المؤسسة',3);
INSERT INTO "subdomains" VALUES ('ANALYSIS','DATA_LIFECYCLE','Analysis','التحليل','Sophistication and depth of organizational capability to examine data, understand patterns, and generate insights','تطور وعمق القدرة التنظيمية لفحص البيانات وفهم الأنماط وتوليد الرؤى',4);
INSERT INTO "subdomains" VALUES ('APPLICATION','DATA_LIFECYCLE','Application','التطبيق','Organizational effectiveness in converting data insights into concrete actions and operational improvements','الفعالية التنظيمية في تحويل رؤى البيانات إلى إجراءات ملموسة وتحسينات تشغيلية',5);
INSERT INTO "subdomains" VALUES ('STRATEGY','DATA_LIFECYCLE','Strategy','الاستراتيجية','Integration of data insights into high-level organizational decision-making and strategic planning','دمج رؤى البيانات في صنع القرار التنظيمي عالي المستوى والتخطيط الاستراتيجي',6);
INSERT INTO "subdomains" VALUES ('SECURITY','GOVERNANCE_PROTECTION','Security','الأمان','Protection of data assets through access controls, monitoring, and recovery capabilities','حماية أصول البيانات من خلال ضوابط الوصول والمراقبة وقدرات الاسترداد',7);
INSERT INTO "subdomains" VALUES ('RESPONSIBLE','GOVERNANCE_PROTECTION','Responsible Use','الاستخدام المسؤول','Ethical data practices, regulatory compliance, and stakeholder trust through transparent and responsible data use','ممارسات البيانات الأخلاقية والامتثال التنظيمي وثقة أصحاب المصلحة من خلال الاستخدام الشفاف والمسؤول للبيانات',8);
INSERT INTO "subdomains" VALUES ('LEADERSHIP','ORGANIZATIONAL_ENABLERS','Leadership','القيادة','Executive commitment, support, and modeling of data-driven decision making throughout the organization','التزام التنفيذيين ودعمهم ونمذجة صنع القرار المدفوع بالبيانات في جميع أنحاء المؤسسة',9);
INSERT INTO "subdomains" VALUES ('TALENT','ORGANIZATIONAL_ENABLERS','Talent','المواهب','Organizational capability to attract, develop, and retain the human skills necessary for effective data use','القدرة التنظيمية على جذب وتطوير والاحتفاظ بالمهارات البشرية اللازمة للاستخدام الفعال للبيانات',10);
INSERT INTO "subdomains" VALUES ('CULTURE','ORGANIZATIONAL_ENABLERS','Culture','الثقافة','Organizational attitudes, behaviors, and norms that encourage or inhibit effective data use and collaboration','المواقف والسلوكيات والمعايير التنظيمية التي تشجع أو تثبط الاستخدام الفعال للبيانات والتعاون',11);
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q1','session_1757496004892_7h9dtehvm','Q1','3',3,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q2','session_1757496004892_7h9dtehvm','Q2','1',1,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q3','session_1757496004892_7h9dtehvm','Q3','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q4','session_1757496004892_7h9dtehvm','Q4','1',1,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q5','session_1757496004892_7h9dtehvm','Q5','5',5,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q6','session_1757496004892_7h9dtehvm','Q6','2',2,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q7','session_1757496004892_7h9dtehvm','Q7','3',3,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q8','session_1757496004892_7h9dtehvm','Q8','2',2,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q9','session_1757496004892_7h9dtehvm','Q9','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q10','session_1757496004892_7h9dtehvm','Q10','2',2,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q11','session_1757496004892_7h9dtehvm','Q11','3',3,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q12','session_1757496004892_7h9dtehvm','Q12','3',3,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q13','session_1757496004892_7h9dtehvm','Q13','5',5,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q14','session_1757496004892_7h9dtehvm','Q14','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q15','session_1757496004892_7h9dtehvm','Q15','2',2,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q16','session_1757496004892_7h9dtehvm','Q16','5',5,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q17','session_1757496004892_7h9dtehvm','Q17','5',5,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q18','session_1757496004892_7h9dtehvm','Q18','1',1,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q19','session_1757496004892_7h9dtehvm','Q19','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q20','session_1757496004892_7h9dtehvm','Q20','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q21','session_1757496004892_7h9dtehvm','Q21','5',5,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q22','session_1757496004892_7h9dtehvm','Q22','1',1,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q23','session_1757496004892_7h9dtehvm','Q23','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q24','session_1757496004892_7h9dtehvm','Q24','1',1,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q25','session_1757496004892_7h9dtehvm','Q25','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q26','session_1757496004892_7h9dtehvm','Q26','1',1,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q27','session_1757496004892_7h9dtehvm','Q27','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q28','session_1757496004892_7h9dtehvm','Q28','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q29','session_1757496004892_7h9dtehvm','Q29','3',3,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q30','session_1757496004892_7h9dtehvm','Q30','1',1,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q31','session_1757496004892_7h9dtehvm','Q31','5',5,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q32','session_1757496004892_7h9dtehvm','Q32','na',0,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q33','session_1757496004892_7h9dtehvm','Q33','3',3,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q34','session_1757496004892_7h9dtehvm','Q34','4',4,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757496004892_7h9dtehvm_Q35','session_1757496004892_7h9dtehvm','Q35','5',5,'2025-09-10 09:35:32','FFNTAD25');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q1','session_1757521776943_zxdo2g3e7','Q1','4',4,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q4','session_1757521776943_zxdo2g3e7','Q4','3',3,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q7','session_1757521776943_zxdo2g3e7','Q7','2',2,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q10','session_1757521776943_zxdo2g3e7','Q10','5',5,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q16','session_1757521776943_zxdo2g3e7','Q16','2',2,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q19','session_1757521776943_zxdo2g3e7','Q19','3',3,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q22','session_1757521776943_zxdo2g3e7','Q22','4',4,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q25','session_1757521776943_zxdo2g3e7','Q25','4',4,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q28','session_1757521776943_zxdo2g3e7','Q28','5',5,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q31','session_1757521776943_zxdo2g3e7','Q31','1',1,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "user_responses" VALUES ('response_session_1757521776943_zxdo2g3e7_Q33','session_1757521776943_zxdo2g3e7','Q33','5',5,'2025-09-10 16:30:57','QUICK2024');
INSERT INTO "users" VALUES ('user_1757344108451_0ojhgt1cy','Momen Mohamed Zaki','Internal Team Testing','Strategy Consultant ','momen.zaki@forefront.consulting','FFNTMO25','executive','2025-09-08 15:08:28','2025-09-08 15:08:28');
INSERT INTO "users" VALUES ('user_1757496004885_8e9fnfuje','Ali El din','Internal Team Testing','Data Analyst','Ali.mahmoud@gmail.com','FFNTAD25','analytics','2025-09-10 09:20:04','2025-09-10 09:20:04');
INSERT INTO "users" VALUES ('test-user-1757510005180','Test User','Test Org','Test Role','test@example.com','TEST2020','1','2025-09-10 13:13:25','2025-09-10 13:13:25');
INSERT INTO "users" VALUES ('user_1757521776935_bhbq3ura2','Ali El din','Test Organization - Quick Assessment','Data Analyst','Ali.mahmoud@gmail.com','QUICK2024','executive','2025-09-10 16:29:36','2025-09-10 16:29:36');
INSERT INTO "users0" VALUES ('user_1755782282013_a4349xf9t','Aley Mahmoud','Test Organization 2025','Data Analyst','AleyMahmoud@Mail.com','2025-08-21 13:18:02','2025-08-21 13:18:02','TEST2020','operations');
CREATE INDEX IF NOT EXISTS "idx_session_scores_session" ON "session_scores" (
	"session_id"
);
CREATE INDEX IF NOT EXISTS "idx_sessions_user" ON "assessment_sessions" (
	"user_id"
);
CREATE INDEX IF NOT EXISTS "idx_user_responses_question" ON "user_responses" (
	"question_id"
);
CREATE INDEX IF NOT EXISTS "idx_user_responses_session" ON "user_responses" (
	"session_id"
);
COMMIT;
