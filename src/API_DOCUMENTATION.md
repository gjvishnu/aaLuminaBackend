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

## Companies

### Get all companies

### `GET /api/companies`

Example response:

```json
[
  {
    "id": "7a4c2f10-9d31-4e6b-8f20-1c5b6a7d8e90",
    "name": "Example Technologies",
    "website": "https://example.com",
    "location": "Bengaluru",
    "status": "ACTIVE",
    "createdAt": "2026-10-29T10:00:00.000Z",
    "updatedAt": "2026-10-29T10:00:00.000Z"
  }
]
```

### Create a company

### `POST /api/companies`

`name` and `location` are required. `website` is optional.

```json
{
  "name": "Example Technologies",
  "website": "https://example.com",
  "location": "Bengaluru"
}
```

Example response:

```json
{
  "id": "7a4c2f10-9d31-4e6b-8f20-1c5b6a7d8e90",
  "name": "Example Technologies",
  "website": "https://example.com",
  "location": "Bengaluru",
  "status": "ACTIVE",
  "createdAt": "2026-10-29T10:00:00.000Z",
  "updatedAt": "2026-10-29T10:00:00.000Z"
}
```

### Edit a company

### `PUT /api/companies/:id`

Send only the fields that need to change.

```json
{
  "location": "Chennai",
  "website": "https://new-example.com"
}
```

### Deactivate a company

### `DELETE /api/companies/:id`

This changes the company status to `INACTIVE`. It does not permanently delete the record.

Example response:

```json
{
  "message": "Company marked as inactive",
  "company": {
    "id": "7a4c2f10-9d31-4e6b-8f20-1c5b6a7d8e90",
    "name": "Example Technologies",
    "website": "https://example.com",
    "location": "Bengaluru",
    "status": "INACTIVE",
    "createdAt": "2026-10-29T10:00:00.000Z",
    "updatedAt": "2026-10-29T10:00:00.000Z"
  }
}
```

## Campus Drives

Protected campus-drive write endpoints require the ID of an active `PLACEMENT_OFFICER` or `ADMIN` user in this header:

```text
x-user-id: user-uuid
```

The project does not currently contain a token or session authentication system. This header is the integration point for the existing authentication middleware when it is added.

### Create a campus drive

### `POST /api/drives`

Creates a drive, its roles, department eligibility links, and skill links in one transaction.

```json
{
  "companyId": "7a4c2f10-9d31-4e6b-8f20-1c5b6a7d8e90",
  "driveDate": "2026-11-20T00:00:00.000Z",
  "driveTime": "10:30",
  "venue": "Lumina Campus, Chennai",
  "registrationEndDate": "2026-11-15T00:00:00.000Z",
  "status": "UPCOMING",
  "roles": [
    {
      "jobRole": "Software Engineer",
      "jobLocation": "Bangalore",
      "jobType": "FULL_TIME",
      "ctcPackage": "6 LPA",
      "numberOfOpenings": 5,
      "departments": ["CSE", "IT"],
      "graduationYears": [2026, 2027],
      "minimumCgpa": 7,
      "maximumBacklogs": 0,
      "degree": "B.E / B.Tech",
      "otherCriteria": ["No active backlogs"],
      "jobDescription": "Develop web applications using React and Node.js.",
      "jdPdfUrl": null,
      "selectionProcesses": [
        "APTITUDE_TEST",
        "CODING_ROUND",
        "TECHNICAL_INTERVIEW",
        "HR_INTERVIEW"
      ],
      "skillIds": ["skill-uuid-1", "skill-uuid-2"]
    }
  ]
}
```

`departments` accepts existing department UUIDs or exact department names. `skillIds` must contain existing skill UUIDs.

### List campus drives

### `GET /api/drives`

Optional query parameters:

```text
page=1&pageSize=20&companyId=uuid&status=UPCOMING&driveDate=2026-11-20&jobRole=Engineer&jobType=FULL_TIME
```

The response includes role summaries and pagination information.

### Get a campus drive

### `GET /api/drives/:id`

Returns the company, complete role details, eligible departments, selection processes, and required skills.

### Update a campus drive

### `PATCH /api/drives/:id`

Updates drive information only. Roles are not changed by this endpoint.

```json
{
  "venue": "Lumina Campus, Bengaluru",
  "status": "ONGOING"
}
```

### Delete a campus drive

### `DELETE /api/drives/:id`

Permanently deletes the drive. Its roles and role junction records are deleted through cascade relationships.

### Add a role to a campus drive

### `POST /api/drives/:id/roles`

Uses the same role payload as the `roles` array in the create-drive request.

### Update a drive role

### `PATCH /api/drives/:id/roles/:roleId`

Updates only the selected role. Send only the fields that should change.

```json
{
  "numberOfOpenings": 8,
  "skillIds": ["skill-uuid-1", "skill-uuid-3"]
}
```

### Delete a drive role

### `DELETE /api/drives/:id/roles/:roleId`

Deletes only the selected role and its department and skill links.

### Campus drive enums

Drive statuses:

```text
DRAFT, UPCOMING, ONGOING, COMPLETED, CANCELLED
```

Job types:

```text
FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT, APPRENTICESHIP
```

Selection processes:

```text
ONLINE_ASSESSMENT, APTITUDE_TEST, TECHNICAL_TEST, GROUP_DISCUSSION,
TECHNICAL_INTERVIEW, HR_INTERVIEW, MANAGERIAL_INTERVIEW, CASE_STUDY,
CODING_ROUND, OTHER
```

`jdPdfUrl` accepts an existing PDF URL. No upload/storage provider exists in the current project, so PDF upload handling is not included.

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
