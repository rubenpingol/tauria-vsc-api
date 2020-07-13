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
- **Additional assumption/s:**
    - Change host:
        - You cannot change host of a room if you're not the host
    - Leave room:
        - Cannot leave room if you are the host, unless you change the host of the room first
        - After changing the host as host, you can now leave the room
    - Join/leave room:
        - You must have selected a room to join or leave

**NOTES:**

- Express + TypeScript is preferred, but feel free to implement in a framework you're familiar with as well
- This spec is not comprehensive. Feel free to add any custom behaviour (or assumptions about user input) if they are not specified in the spec. But please do document these behaviours.
- The server DOES NOT need to persist anything between runs. You can store everything in memory if you want (bonus points for persistence of the data)

## Tools and/or Requirements

- **Postman** - used for testing the API endpoints
- **SQLite** - used for data storage, to persist data

## Steps to run this project locally

1. Run `npm i` or `npm install` command
2. Setup database settings inside `ormconfig.json` file
3. Run `npm start` command
4. Run `npm run migration:run` command (optional). This will create initial user with credentials **`admin / admin`**
5. The server is now running on `localhost:3000`

## Endpoints

### User Management

#### `GET` Get users
```
/users
```
Request body

> ```
> None
> ```

Response body `Success - 200 (OK)`

> ```
> [
>   {
>     "id": 1",
>     "username": "johndoe",
>     "mobile_token": null
>   }
>   ...
> ]
> ```

#### `GET` Get user
```
/users/:username
```

Parameters

> `username` (string)

Response body `Success - 200 (OK)`

> ```
> {
>    "id": 1,
>    "username": "admin",
>    "mobile_token": null,
>    "hosted_rooms": [
>        {
>            "id": 1,
>            "guid": "c02a64da-2d86-4bda-85d9-f6b1dfd18daa",
>            "name": "Backend API Devs",
>            "capacity": 4
>        }
>    ],
>    "joined_rooms": [
>        {
>            "id": 1,
>            "guid": "c02a64da-2d86-4bda-85d9-f6b1dfd18daa",
>            "name": "Backend API Devs",
>            "capacity": 4
>        }
>    ]
> }
> ```

#### `POST` Register user and authenticate
```
/users
```

Request body

> ```
> {
>   "username": "johndoe",
>   "password": "password",
>   "mobile_token": null (optional)
> }
> ```

Response body `Success - 201 (Created)`

> ```
> {
>   "token": "some generated token using JWT",
>   "username": "johndoe",
>   "message": "User created and authenticated"
> }
> ```

#### `POST` Sign in / authenticate
```
/auth/login
```

Request body

> ```
> {
>   "username": "johndoe",
>   "password": "password"
> }
> ```

Response body `Success - 200 (OK)`

> ```
> {
>   "token": "some generated token using JWT"
>   "username": "johndoe"
> }
> ```

#### `PATCH` Update user (password and/or mobile_token), requires authentication
```
/users
```

Request header

`Authorization: {token}`, replace `{token}` with the token you get from authentication/sign in.

> ```
> Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTU5NDY0MTgwMCwiZXhwIjoxNTk0NjQ1NDAwfQ.S8jyG3FWKOYrbdsSEtdzA5L7_dzaY7gaFccSVMNENAE
> ```

Request body

> ```
> {
>   "old_password": "oldPassword",
>   "new_password": "newPassword",
>   "mobile_token": null (optional)
> }
> ```

Response body `Success - 201 (Updated)`

> ```
> {
>   "message": "Successfully updated info"
> }
> ```

#### `DELETE` Delete a user (authenticated user itself), requires authentication
```
/users
```

Request header

`Authorization: {token}`, replace `{token}` with the token you get from authentication/sign in.

> ```
> Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTU5NDY0MTgwMCwiZXhwIjoxNTk0NjQ1NDAwfQ.S8jyG3FWKOYrbdsSEtdzA5L7_dzaY7gaFccSVMNENAE
> ```

Request body

> ```
> None
> ```

Response body `Success - 204 (No content)`

> ```
> None
> ```

### Room Management

#### `POST` Create room
```
/rooms
```

Request header

`Authorization: {token}`, replace `{token}` with the token you get from authentication/sign in.

> ```
> Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTU5NDY0MTgwMCwiZXhwIjoxNTk0NjQ1NDAwfQ.S8jyG3FWKOYrbdsSEtdzA5L7_dzaY7gaFccSVMNENAE
> ```

Request body

> ```
> {
>   "name": "Frontend Devs",
>   "capacity": 8, // (optional), default: 5
> }
> ```

Response body `Success - 201 (Created)`

> ```
> {
>    "id": 1,
>    "guid": "4060c1f4-db4d-4220-89a1-02cbe4c73285",
>    "name": "React Devs",
>    "capacity": 5,
>    "host": {
>        "id": 1,
>        "username": "johndoe"
>    },
>    "participants": [
>        {
>            "id": 1,
>            "username": "johndoe"
>        }
>    ]
> }
> ```

#### `POST` Change host
```
/rooms/:guid/change-host
```

Params

> `guid` (string)

Request header

`Authorization: {token}`, replace `{token}` with the token you get from authentication/sign in.

> ```
> Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTU5NDY0MTgwMCwiZXhwIjoxNTk0NjQ1NDAwfQ.S8jyG3FWKOYrbdsSEtdzA5L7_dzaY7gaFccSVMNENAE
> ```

Request body

> ```
> {
>   "user_id": 2
> }
> ```

Response body `Success - 200 (OK)`

> ```
> {
>   "message": "Successfully changed the host of this room"
> }
> ```

#### `POST` Join room
```
/rooms/:guid/join
```

Params

> `guid` (string)

Request header

`Authorization: {token}`, replace `{token}` with the token you get from authentication/sign in.

> ```
> Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTU5NDY0MTgwMCwiZXhwIjoxNTk0NjQ1NDAwfQ.S8jyG3FWKOYrbdsSEtdzA5L7_dzaY7gaFccSVMNENAE
> ```

Request body

> ```
> None
> ```

Response body `Success - 200 (OK)`

> ```
> {
>   "message": "Successfully joined the room"
> }
> ```

#### `POST` Leave room
```
/rooms/:guid/leave
```

Params

> `guid` (string)

Request header

`Authorization: {token}`, replace `{token}` with the token you get from authentication/sign in.

> ```
> Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoiam9obmRvZSIsImlhdCI6MTU5NDY0MTgwMCwiZXhwIjoxNTk0NjQ1NDAwfQ.S8jyG3FWKOYrbdsSEtdzA5L7_dzaY7gaFccSVMNENAE
> ```

Request body

> ```
> None
> ```

Response body `Success - 200 (OK)`

> ```
> {
>   "message": "Successfully left the room"
> }
> ```


#### `GET` Get room
```
/rooms/:guid
```

Params

> `guid` (string)

Request body

> ```
> None
> ```

Response body `Success - 200 (OK)`

> ```
> {
>   "id": 1,
>    "guid": "c02a64da-2d86-4bda-85d9-f6b1dfd18daa",
>    "name": "Backend API Devs",
>    "capacity": 4,
>    "host": {
>        "id": 1,
>        "username": "admin"
>    },
>    "participants": [
>        {
>            "id": 1,
>            "username": "admin"
>        }
>    ]
> }
> ```


#### `GET` List rooms where user is in
```
/rooms/user/:username
```

Params

> `username` (string)

Request body

> ```
> None
> ```

Response body `Success - 200 (OK)`

> ```
> [
>    {
>        "id": 1,
>        "guid": "c02a64da-2d86-4bda-85d9-f6b1dfd18daa",
>        "name": "Backend API Devs",
>        "capacity": 4
>    }
> ]
> ```
