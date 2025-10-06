-- Fix recommendation_metadata primary key to support both languages

ALTER TABLE recommendation_metadata DROP PRIMARY KEY;
ALTER TABLE recommendation_metadata ADD PRIMARY KEY (session_id, language);
