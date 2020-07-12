## Coding Challenge Specifications


### Video Server API

Design a server that handles HTTP requests based on the following specifications:

1. **User Management**
    
    The server should be able to register and authenticate users.

- User has: *username*, *password*, and an optional *mobile_token* (string)
- Required routes:
    - Get users (no auth required): returns a list of all users
    - Get user (no auth required): takes a username and return the user with matching username
    - Register (no auth required): takes a username, password and optional string for mobile_token. Registers the user and authenticates the client as the newly created user.
    - Sign in/authenticate: takes username and password, and authenticates the user
    - Update user (must be signed in as the user): updates password and/or mobile_token of the user
    - Delete user (must be signed in as the user): deletes the user

2. **Room Management**

    The server should be able to handle creating conference rooms.

- Room has: name (non-unique), guid, host user, participants (users) in the room, and a capacity limit. Number of users in the room must not exceed the capacity.
- Required routes:
    - Create a room (signed in as a user): creates a room hosted by the current user, with an optional capacity limit. Default is 5.
    - Change host (must be signin as the host): changes the host of the user from the current user to another user
    - Join/leave (signed in as a user): joins/leaves the room as the current user
    - Get info (no auth): given a room guid, gest information about a room
    - Search for the rooms that a user is in: given an username, returns a list of rooms that the user is in.

NOTES:

- Express + TypeScript is preferred, but feel free to implement in a framework you're familiar with as well
- This spec is not comprehensive. Feel free to add any custom behaviour (or assumptions about user input) if they are not specified in the spec. But please do document these behaviours.
- The server DOES NOT need to persist anything between runs. You can store everything in memory if you want (bonus points for persistence of the data)

## Steps to run this project locally

1. Run `npm i` or `npm install` command
2. Setup database settings inside `ormconfig.json` file
3. Run `npm start` command
