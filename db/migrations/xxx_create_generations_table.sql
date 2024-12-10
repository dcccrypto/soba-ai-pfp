CREATE TABLE generations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    prompt TEXT NOT NULL,
    result_url TEXT NOT NULL,  -- Store the URL/link here
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    // other relevant fields...
); 