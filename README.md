# Bitespeed Contact Identification Service

## Prerequisites

- [Bun](https://bun.sh/) installed
- Prisma installed
- `.env` file configured with your database URL

## Setup

1. Run `bun install` to install dependencies
2. Run `bunx prisma migrate dev` to create the database and connection
3. Run `bun run prisma db seed` to seed the database with test data
4. Run `bun run start` to start the server

## Endpoints

### POST http://localhost:3000/identify

#### Request

```json
{
  "email": "test@test.com",
  "phone": "1234567890"
}
```

#### Response

```json
{
  "id": "1",
  "email": "test@test.com",
  "phone": "1234567890",
  "createdAt": "2023-03-01T00:00:00.000Z",
  "updatedAt": "2023-03-01T00:00:00.000Z"
}
```

Use these to test out endpoint

Request:

```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "828282"
}
```

```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "555555"
}
```

```json
{
  "email": "test@test.com",
  "phoneNumber": "12345"
}
```

```json
{
  "email": "alice@example.com",
}
```
