CREATE TABLE reblooms (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    bloom_id BIGINT NOT NULL REFERENCES blooms(id),
    rebloom_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, bloom_id)
);