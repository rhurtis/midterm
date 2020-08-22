CREATE TABLE users (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  address_id INTEGER REFERENCES addresses(id) ON DELETE CASCADE
);


CREATE TABLE addresses (
  id SERIAL PRIMARY KEY NOT NULL,
  country VARCHAR(255) NOT NULL,
  province VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  street VARCHAR(255) NOT NULL,
  postal_code VARCHAR(255) NOT NULL,
);

CREATE TABLE cars (
  id SERIAL PRIMARY KEY NOT NULL, /* added an id primary key */
  make VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year SMALLINT NOT NULL,
  mileage SMALLINT NOT NULL,
  description TEXT,
  price INTEGER,
  address_id INTEGER REFERENCES addresses(id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  availability BOOLEAN,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
id SERIAL PRIMARY KEY NOT NULL,
buyer_id VARCHAR(255),
car_id VARCHAR(255),
message TEXT
);

