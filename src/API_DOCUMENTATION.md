# API Documentation

Base URL:

```text
http://localhost:3000
```

Start the server with:

```bash
node server.js
```

## Health Check

### `GET /health`

Checks whether the server is running.

Example response:

```json
{
  "status": "ok"
}
```

## Users

### Get all users

### `GET /api/users`

Example response:

```json
[
  {
    "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
    "email": "user@example.com",
    "role": "STUDENT",
    "status": "ACTIVE",
    "createdAt": "2026-10-27T18:56:42.858Z",
    "updatedAt": "2026-10-27T18:56:42.858Z"
  }
]
```

### Create a user

### `POST /api/users`

Request header:

```text
Content-Type: application/json
```

Request body:

All fields below are required.

```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

Available roles:

```text
STUDENT
PLACEMENT_OFFICER
ADMIN
RECRUITER
```

Example response:

```json
{
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "email": "user@example.com",
  "role": "STUDENT",
  "status": "ACTIVE",
  "createdAt": "2026-10-27T18:56:42.858Z",
  "updatedAt": "2026-10-27T18:56:42.858Z"
}
```

The password is stored securely and is not included in the response.

### Deactivate a user

### `DELETE /api/users/:userUuid`

This does not permanently delete the user. It changes the user's status from `ACTIVE` to `INACTIVE`.

Example URL:

```text
DELETE /api/users/30f33c17-a7c1-44e7-a58f-f23c0437bc86
```

Example response:

```json
{
  "message": "User marked as inactive",
  "user": {
    "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
    "email": "user@example.com",
    "role": "STUDENT",
    "status": "INACTIVE",
    "createdAt": "2026-10-27T18:56:42.858Z",
    "updatedAt": "2026-10-27T18:56:42.858Z"
  }
}
```

## Departments

### Get all departments

### `GET /api/departments`

Example response:

```json
[
  {
    "id": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
    "name": "Computer Science",
    "status": "ACTIVE",
    "createdAt": "2026-10-28T10:00:00.000Z"
  }
]
```

### Create a department

### `POST /api/departments`

All fields below are required.

```json
{
  "name": "Computer Science"
}
```

Example response:

```json
{
  "id": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
  "name": "Computer Science",
  "status": "ACTIVE",
  "createdAt": "2026-10-28T10:00:00.000Z"
}
```

### Deactivate a department

### `DELETE /api/departments/:id`

This changes the department status to `INACTIVE`. It does not permanently delete the record.

Example response:

```json
{
  "message": "Department marked as inactive",
  "department": {
    "id": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
    "name": "Computer Science",
    "status": "INACTIVE",
    "createdAt": "2026-10-28T10:00:00.000Z"
  }
}
```

## Skills

### Get all skills

### `GET /api/skills`

Example response:

```json
[
  {
    "id": "f3a1b2c4-8d6e-4f10-9a2b-5c7d8e9f0123",
    "skill": "JavaScript",
    "category": "Programming",
    "domain": "Web Development",
    "status": "ACTIVE",
    "createdAt": "2026-10-28T10:00:00.000Z"
  }
]
```

### Create a skill

### `POST /api/skills`

All fields below are required.

```json
{
  "skill": "JavaScript",
  "category": "Programming",
  "domain": "Web Development"
}
```

Example response:

```json
{
  "id": "f3a1b2c4-8d6e-4f10-9a2b-5c7d8e9f0123",
  "skill": "JavaScript",
  "category": "Programming",
  "domain": "Web Development",
  "status": "ACTIVE",
  "createdAt": "2026-10-28T10:00:00.000Z"
}
```

### Deactivate a skill

### `DELETE /api/skills/:id`

This changes the skill status to `INACTIVE`. It does not permanently delete the record.

Example response:

```json
{
  "message": "Skill marked as inactive",
  "skill": {
    "id": "f3a1b2c4-8d6e-4f10-9a2b-5c7d8e9f0123",
    "skill": "JavaScript",
    "category": "Programming",
    "domain": "Web Development",
    "status": "INACTIVE",
    "createdAt": "2026-10-28T10:00:00.000Z"
  }
}
```

## Students

### Get all students

### `GET /api/students`

No user-role validation is required for this endpoint.

Example response:

```json
[
  {
    "id": "f3a1b2c4-8d6e-4f10-9a2b-5c7d8e9f0123",
    "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
    "registrationNumber": "CS2026001",
    "departmentId": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
    "program": null,
    "batch": null,
    "semester": null,
    "phone": null,
    "dateOfBirth": null,
    "location": null,
    "status": "ACTIVE",
    "createdAt": "2026-10-28T10:00:00.000Z",
    "updatedAt": "2026-10-28T10:00:00.000Z"
  }
]
```

### Create a student

### `POST /api/students`

The `userUuid` is required for validation. That user must exist, be active, and have the `STUDENT` role.

`registrationNumber` is the only required student-data field. The `departmentId` is stored as the department UUID.

```json
{
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "registrationNumber": "CS2026001",
  "departmentId": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
  "program": "Computer Science",
  "batch": 2026,
  "semester": 1,
  "phone": "9876543210",
  "dateOfBirth": "2004-05-10",
  "location": "Bengaluru"
}
```

Example response:

```json
{
  "id": "f3a1b2c4-8d6e-4f10-9a2b-5c7d8e9f0123",
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "registrationNumber": "CS2026001",
  "departmentId": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
  "program": "Computer Science",
  "batch": 2026,
  "semester": 1,
  "phone": "9876543210",
  "dateOfBirth": "2004-05-10T00:00:00.000Z",
  "location": "Bengaluru",
  "status": "ACTIVE",
  "createdAt": "2026-10-28T10:00:00.000Z",
  "updatedAt": "2026-10-28T10:00:00.000Z"
}
```

### Edit a student

### `PUT /api/students/:id`

The `userUuid` is required and must belong to an active user with the `STUDENT` role. Include only the fields that need to change.

```json
{
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "semester": 2,
  "location": "Chennai"
}
```

### Deactivate a student

### `DELETE /api/students/:id`

No user-role validation is required. This changes the student status to `INACTIVE` and does not permanently delete the record.

Example response:

```json
{
  "message": "Student marked as inactive",
  "student": {
    "id": "f3a1b2c4-8d6e-4f10-9a2b-5c7d8e9f0123",
    "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
    "registrationNumber": "CS2026001",
    "status": "INACTIVE"
  }
}
```

## Common errors

### Missing required fields

```json
{
  "message": "Email, password, and role are required"
}
```

### Email already exists

```json
{
  "message": "Email is already registered"
}
```

### User not found

```json
{
  "message": "User not found"
}
```
