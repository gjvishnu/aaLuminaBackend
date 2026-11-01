# Lumina Backend API Documentation

Base URL:

```text
http://localhost:3000
```

Start the server from the `src` folder:

```bash
yarn node server.js
```

All request bodies must use JSON:

```http
Content-Type: application/json
```

## Authentication

`POST /api/users/login` and `POST /api/users/refresh` are public. All other business APIs require a valid access token.

Send the access token exactly like this:

```http
Authorization: Bearer <access-token>
```

Do not send only the raw JWT. The `Bearer` prefix is required.

The login response includes an access token and a refresh token. Access tokens expire after 15 minutes by default. Refresh tokens expire after 7 days by default.

Configure these values in `.env`:

```env
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

After logout, both the access token and refresh token for that user are invalidated.

### Role permissions

| Role | Main access |
|---|---|
| `ADMIN` | Full access, including user CRUD |
| `PLACEMENT_OFFICER` | Manage departments, companies, students, and campus drives |
| `STUDENT` | Authenticated read access and complete skill CRUD |
| `RECRUITER` | Authenticated read access and complete skill CRUD |

The detailed permissions are listed with each API below.

## Health APIs

### `GET /`

Public server check.

Example response:

```text
Express server is running
```

### `GET /health`

Public health check.

Example response:

```json
{
  "status": "ok"
}
```

## Users

Login and refresh are public. User CRUD APIs require an `ADMIN` access token.

### Login

```http
POST /api/users/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Example response:

```json
{
  "message": "Login successful",
  "user": {
    "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
    "email": "user@example.com",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2026-10-27T18:56:42.858Z",
    "updatedAt": "2026-10-27T18:56:42.858Z"
  },
  "accessToken": "<access-token>",
  "refreshToken": "<refresh-token>",
  "tokenType": "Bearer"
}
```

Invalid credentials or an inactive user return `401`.

### Refresh tokens

```http
POST /api/users/refresh
```

Request body:

```json
{
  "refreshToken": "<refresh-token>"
}
```

Example response:

```json
{
  "accessToken": "<new-access-token>",
  "refreshToken": "<new-refresh-token>",
  "tokenType": "Bearer"
}
```

### Logout

```http
POST /api/users/logout
```

Required header:

```http
Authorization: Bearer <access-token>
```

Example response:

```json
{
  "message": "Logout successful. All active tokens have been invalidated."
}
```

### Get all users — `ADMIN` only

```http
GET /api/users
```

### Create a user — `ADMIN` only

```http
POST /api/users
```

Required fields:

```json
{
  "email": "student@example.com",
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

### Edit a user — `ADMIN` only

```http
PUT /api/users/:userUuid
```

Send one or more fields:

```json
{
  "email": "new-email@example.com",
  "password": "newPassword123",
  "role": "PLACEMENT_OFFICER",
  "status": "ACTIVE"
}
```

`status` can be `ACTIVE` or `INACTIVE`.

### Deactivate a user — `ADMIN` only

```http
DELETE /api/users/:userUuid
```

This is a soft delete. The record remains in the database and its status becomes `INACTIVE`.

## Departments

All authenticated roles can get departments. Only `ADMIN` and `PLACEMENT_OFFICER` can create, edit, or deactivate departments.

### Get departments

```http
GET /api/departments
```

### Create a department

```http
POST /api/departments
```

```json
{
  "name": "Computer Science"
}
```

### Edit a department

```http
PUT /api/departments/:id
```

```json
{
  "name": "Information Technology"
}
```

### Deactivate a department

```http
DELETE /api/departments/:id
```

This changes the department status to `INACTIVE`.

## Skills

All authenticated roles can use all skill APIs.

### Get skills

```http
GET /api/skills
```

### Create a skill

```http
POST /api/skills
```

All fields are required:

```json
{
  "skill": "JavaScript",
  "category": "Programming",
  "domain": "Web Development"
}
```

### Edit a skill

```http
PUT /api/skills/:id
```

```json
{
  "skill": "Node.js",
  "category": "Programming",
  "domain": "Backend Development"
}
```

### Deactivate a skill

```http
DELETE /api/skills/:id
```

This changes the skill status to `INACTIVE`.

## Students

Only `ADMIN` and `PLACEMENT_OFFICER` can access student APIs. Student creation and editing still require the `userUuid` to belong to an active user with the `STUDENT` role.

### Get students

```http
GET /api/students
```

### Create a student

```http
POST /api/students
```

Required fields:

```json
{
  "userUuid": "student-user-uuid",
  "registrationNumber": "LM2026001"
}
```

Optional fields:

```json
{
  "departmentId": "department-uuid",
  "program": "B.E Computer Science",
  "batch": 2026,
  "semester": 8,
  "phone": "9876543210",
  "dateOfBirth": "2004-05-10",
  "location": "Chennai"
}
```

Complete example:

```json
{
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "registrationNumber": "LM2026001",
  "departmentId": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
  "program": "B.E Computer Science",
  "batch": 2026,
  "semester": 8,
  "phone": "9876543210",
  "dateOfBirth": "2004-05-10",
  "location": "Chennai"
}
```

### Edit a student

```http
PUT /api/students/:id
```

`userUuid` is required in the request body. Other fields are optional.

```json
{
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "semester": 8,
  "location": "Bengaluru"
}
```

### Deactivate a student

```http
DELETE /api/students/:id
```

This changes the student status to `INACTIVE`.

## Companies

All authenticated roles can get companies. Only `ADMIN` and `PLACEMENT_OFFICER` can create, edit, or deactivate companies.

### Get companies

```http
GET /api/companies
```

### Create a company

```http
POST /api/companies
```

Required fields are `name` and `location`. `website` is optional.

```json
{
  "name": "Lumina Technologies",
  "website": "https://lumina.example.com",
  "location": "Chennai"
}
```

### Edit a company

```http
PUT /api/companies/:id
```

Send one or more fields:

```json
{
  "name": "Lumina Technologies Pvt Ltd",
  "website": "https://lumina.example.com",
  "location": "Bengaluru"
}
```

### Deactivate a company

```http
DELETE /api/companies/:id
```

This changes the company status to `INACTIVE`.

## Campus Drives

All authenticated roles can list and view campus drives. Only `ADMIN` and `PLACEMENT_OFFICER` can create, edit, delete, and manage drive roles.

### Create a campus drive

```http
POST /api/drives
```

Required drive fields:

Top-level drive fields:

- `companyId`
- `driveDate`
- `driveTime`
- `venue`
- `registrationEndDate`
- `status`
- `roles` — must contain at least one role object

Required fields inside every `roles` object:

- `jobRole`
- `jobLocation`
- `jobType`
- `ctcPackage`
- `numberOfOpenings`
- `departments` — at least one value
- `graduationYears` — at least one value
- `minimumCgpa`
- `maximumBacklogs`
- `degree`
- `selectionProcesses` — at least one value
- `skillIds` — at least one value

Optional fields inside a `roles` object:

- `otherCriteria` — defaults to an empty array
- `jobDescription`
- `jdPdfUrl`

One drive can contain multiple role objects in the `roles` array.

```json
{
  "companyId": "company-uuid",
  "driveDate": "2026-11-20T00:00:00.000Z",
  "driveTime": "10:30",
  "venue": "Lumina Campus, Chennai",
  "registrationEndDate": "2026-11-15T00:00:00.000Z",
  "status": "UPCOMING",
  "roles": [
    {
      "jobRole": "Software Engineer",
      "jobLocation": "Bengaluru",
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
    },
    {
      "jobRole": "Business Analyst",
      "jobLocation": "Chennai",
      "jobType": "FULL_TIME",
      "ctcPackage": "5 LPA",
      "numberOfOpenings": 3,
      "departments": ["CSE", "ECE"],
      "graduationYears": [2026],
      "minimumCgpa": 6,
      "maximumBacklogs": 0,
      "degree": "Bachelor's degree",
      "otherCriteria": [],
      "jobDescription": "Analyze business requirements and prepare reports.",
      "jdPdfUrl": null,
      "selectionProcesses": ["APTITUDE_TEST", "CASE_STUDY", "HR_INTERVIEW"],
      "skillIds": ["skill-uuid-3", "skill-uuid-4"]
    }
  ]
}
```

The required array fields must contain at least one value. Department values can be existing department UUIDs or department names. Skill IDs must belong to existing active skills.

### List campus drives

```http
GET /api/drives
```

Optional query parameters:

```text
page=1
pageSize=20
companyId=company-uuid
status=UPCOMING
driveDate=2026-11-20
driveDateFrom=2026-11-01
driveDateTo=2026-11-30
jobRole=Engineer
jobType=FULL_TIME
```

Example response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### Get a campus drive

```http
GET /api/drives/:id
```

Returns company details, all roles, eligibility criteria, departments, selection processes, and skills.

### Edit a campus drive

```http
PATCH /api/drives/:id
```

This updates drive fields only. It does not replace the roles array.

```json
{
  "venue": "Lumina Campus, Bengaluru",
  "status": "ONGOING"
}
```

### Delete a campus drive

```http
DELETE /api/drives/:id
```

This permanently deletes the drive and its associated roles and junction records.

### Add a role to an existing drive

```http
POST /api/drives/:id/roles
```

Use one role object from the create-drive payload.

### Edit a drive role

```http
PATCH /api/drives/:id/roles/:roleId
```

Send only the fields that need to change.

```json
{
  "numberOfOpenings": 8,
  "skillIds": ["skill-uuid-1", "skill-uuid-3"]
}
```

### Delete a drive role

```http
DELETE /api/drives/:id/roles/:roleId
```

This permanently deletes only the selected role and its department and skill links.

### Campus drive enum values

Drive status:

```text
DRAFT, UPCOMING, ONGOING, COMPLETED, CANCELLED
```

Job type:

```text
FULL_TIME, PART_TIME, INTERNSHIP, CONTRACT, APPRENTICESHIP
```

Selection process:

```text
ONLINE_ASSESSMENT
APTITUDE_TEST
TECHNICAL_TEST
GROUP_DISCUSSION
TECHNICAL_INTERVIEW
HR_INTERVIEW
MANAGERIAL_INTERVIEW
CASE_STUDY
CODING_ROUND
OTHER
```

`jdPdfUrl` accepts a PDF URL. PDF binary upload is not currently implemented.

## Common response codes

| Status | Meaning |
|---|---|
| `200` | Request succeeded |
| `201` | Record created |
| `400` | Invalid payload, parameter, or enum value |
| `401` | Missing, invalid, expired, or invalidated token |
| `403` | Token is valid but the role is not allowed |
| `404` | Record not found |
| `409` | Duplicate record |
| `500` | Unexpected server error |

Common error response:

```json
{
  "message": "Please log in first to continue."
}
```

Other authentication messages:

```text
Your session has expired. Please log in again.
We could not verify your login. Please log in again.
Your account is inactive. Please contact the administrator.
You do not have permission to access this feature.
```
