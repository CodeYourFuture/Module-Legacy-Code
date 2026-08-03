CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL,
    password_salt BYTEA NOT NULL,
    password_scrypt BYTEA NOT NULL,
    UNIQUE(username)
);

CREATE TABLE IF NOT EXISTS blooms (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    send_timestamp TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower INT NOT NULL REFERENCES users(id),
    followee INT NOT NULL REFERENCES users(id),
    UNIQUE(follower, followee)
);

CREATE TABLE IF NOT EXISTS hashtags (
    id SERIAL PRIMARY KEY,
    hashtag VARCHAR NOT NULL,
    bloom_id BIGINT NOT NULL REFERENCES blooms(id),
    UNIQUE(hashtag, bloom_id)
);

CREATE TABLE IF NOT EXISTS reblooms (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  bloom_id BIGINT NOT NULL REFERENCES blooms(id),
  rebloom_timestamp TIMESTAMP NOT NULL,
  UNIQUE(user_id, bloom_id)
);
 
CREATE INDEX IF NOT EXISTS idx_reblooms_bloom_id ON reblooms (bloom_id);
CREATE INDEX IF NOT EXISTS idx_reblooms_user_id ON reblooms (user_id);
