TACOCARS 
=========

## Project Description

This is a buy/sell website where buyer/ seller can sign-up and communicate through the web. The seller can create posts and delete the posts they created. The buyer can favorite the cars they are interested in, look at them in the My Garage page later and remove it if they wish to. The buyer and seller can communicate through TacoChat, a realtime chat to negotiate the price, exchange phone numbers etc.


## Getting Started

1. Create the `.env` by using `.env.example` as a reference: `cp .env.example .env`
2. Update the .env file with your correct local information 
  - username: `labber` 
  - password: `labber` 
  - database: `midterm`
3. Install dependencies: `npm i`
4. Fix to binaries for sass: `npm rebuild node-sass`
5. Reset database: `npm run db:reset`
  - Check the db folder to see what gets created and seeded in the SDB
7. Run the server: `npm run local`
  - Note: nodemon is used, so you should not have to restart your server
8. Visit `http://localhost:8080/`

## Warnings 
This is a project for learning purposes only.

## Dependencies

    "bcrypt",
    "body-parser,
    "chalk",
    "cookie-session",
    "dotenv",
    "ejs",
    "express",
    "morgan",
    "node-sass-middleware",
    "pg",
    "pg-native",
    "socket.io"
