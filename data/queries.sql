--this file contains SQL CREATE TABLE queries so the person using this project
-- can create the required tables inside of his local PostgreSQL database


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(45) NOT NULL,
    username VARCHAR(20) NOT NULL,
    password VARCHAR(8) NOT NULL
);


CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    completed BOOLEAN NOT NULL,
    list_id INT NOT NULL,
    FOREIGN KEY (list_id) REFERENCES lists(id)
);