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

The login response includes an access token and a refresh token. Access tokens expire after 30 minutes by default. Refresh tokens expire after 7 days by default.

Configure these values in `.env`:

```env
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
```

After logout, both the access token and refresh token for that user are invalidated.

### Role permissions

| Role | Main access |
|---|---|
| `ADMIN` | Full access, including user CRUD |
| `PLACEMENT_OFFICER` | Manage departments, degrees, companies, students, and campus drives |
| `STUDENT` | Authenticated read access, complete skill CRUD, and management of their own skills, internships, and projects |
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

## Degrees

All authenticated roles can get degrees. Only `ADMIN` and `PLACEMENT_OFFICER` can create, edit, or deactivate degrees.

`degreeName` is required, must be unique, and can be up to 150 characters. A duplicate name returns `409`, including the name of an inactive degree.

### Get degrees

```http
GET /api/degrees
```

Returns all degrees, newest first, including inactive ones.

Example response:

```json
[
  {
    "id": "3f1c8a52-6e0b-4c1d-9a7e-2b5d4f8e1c30",
    "degreeName": "B.Tech",
    "status": "ACTIVE",
    "createdAt": "2026-11-04T10:15:30.000Z"
  }
]
```

### Create a degree

```http
POST /api/degrees
```

```json
{
  "degreeName": "B.Tech"
}
```

Returns `201` with the created degree.

### Edit a degree

```http
PUT /api/degrees/:id
```

```json
{
  "degreeName": "B.E."
}
```

Returns `200` with the updated degree, or `404` if the degree does not exist.

### Deactivate a degree

```http
DELETE /api/degrees/:id
```

This changes the degree status to `INACTIVE`.

```json
{
  "message": "Degree marked as inactive"
}
```

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

Allowed roles: `ADMIN`, `PLACEMENT_OFFICER`, and `STUDENT`. The response depends on the caller:

- `STUDENT` — returns the logged-in user's own student record. The user is taken from the access token, so no ID is sent and a `userUuid` query parameter is ignored.
- `ADMIN` / `PLACEMENT_OFFICER` — returns an array of all students, as before.
- `ADMIN` / `PLACEMENT_OFFICER` with `?userUuid=student-user-uuid` — returns that user's student record.

`freshUser` is `true` when the user has no entry in the student table yet.

Student record not created yet:

```json
{
  "freshUser": true,
  "student": null
}
```

Student record exists:

```json
{
  "freshUser": false,
  "student": {
    "id": "ba4115b8-f2dd-4c0b-a98d-57f7b345a046",
    "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
    "registrationNumber": "LM2026001",
    "departmentId": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
    "degreeId": "3f1c8a52-6e0b-4c1d-9a7e-2b5d4f8e1c30",
    "batch": 2026,
    "semester": 8,
    "phone": "9876543210",
    "dateOfBirth": "2004-05-10T00:00:00.000Z",
    "location": "Chennai",
    "status": "ACTIVE",
    "createdAt": "2026-11-05T10:15:30.000Z",
    "updatedAt": "2026-11-05T10:15:30.000Z"
  }
}
```

With `?userUuid=`, a user who does not exist returns `404`, and a user who is not an active `STUDENT` returns `403`.

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
  "degreeId": "degree-uuid",
  "batch": 2026,
  "semester": 8,
  "phone": "9876543210",
  "dateOfBirth": "2004-05-10",
  "location": "Chennai"
}
```

`degreeId` must be the UUID of an active degree from `/api/degrees`, or `null` for no degree. Student responses return `degreeId`.

Complete example:

```json
{
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "registrationNumber": "LM2026001",
  "departmentId": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
  "degreeId": "3f1c8a52-6e0b-4c1d-9a7e-2b5d4f8e1c30",
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

## Student Skills

A student can manage their own skills. `ADMIN` and `PLACEMENT_OFFICER` can manage any student's skills. Other users get `403`. `:studentId` is the `id` of the student record, not the `userUuid`; a missing student returns `404`.

### Get a student's skills

```http
GET /api/students/:studentId/skills
```

```json
[
  {
    "id": "8d2f7c10-52a4-4e1b-9f3a-6c1b7e2d4a90",
    "skill": "React",
    "category": "Frontend",
    "domain": "Web Development",
    "status": "ACTIVE"
  }
]
```

### Add a skill

```http
POST /api/students/:studentId/skills
```

```json
{
  "skillId": "8d2f7c10-52a4-4e1b-9f3a-6c1b7e2d4a90"
}
```

Returns `201` with the skill. The skill must be active, otherwise the response is `404`. A skill the student already has returns `409`.

### Replace all skills

```http
PUT /api/students/:studentId/skills
```

```json
{
  "skillIds": [
    "8d2f7c10-52a4-4e1b-9f3a-6c1b7e2d4a90",
    "b2a1c4e6-7d3f-4f0a-8e21-5a9c3d6f7b12"
  ]
}
```

The list replaces the student's skills and the updated skills are returned. Send an empty array to remove all of them. New skills must be active; a skill that was deactivated after the student added it may stay in the list.

### Remove a skill

```http
DELETE /api/students/:studentId/skills/:skillId
```

## Internships

A student can manage their own internships. `ADMIN` and `PLACEMENT_OFFICER` can manage any student's internships. Other users get `403`.

| Field | Type | Rules |
|---|---|---|
| `title` | string | Required, up to 150 characters. Example: `Frontend Developer Intern` |
| `companyName` | string | Required, up to 150 characters |
| `startDate` | date | Required |
| `endDate` | date or `null` | Optional. Cannot be before `startDate`. `null` means the internship is ongoing |
| `description` | string | Required |
| `isVerified` | boolean | Optional. Only `ADMIN` and `PLACEMENT_OFFICER` can set it |

`isVerified` defaults to `false` and drives the "Verified experience" badge. A value sent by a student is ignored, and when a student edits an internship `isVerified` is reset to `false`, so the changes must be verified again.

### Get a student's internships

```http
GET /api/students/:studentId/internships
```

Returns the student's internships, latest `startDate` first.

```json
[
  {
    "id": "6e0f3a2b-91c4-4d7e-a5b8-2f4c7d1e9a33",
    "studentId": "ba4115b8-f2dd-4c0b-a98d-57f7b345a046",
    "title": "Frontend Developer Intern",
    "companyName": "BlueOrbit Technologies",
    "startDate": "2025-05-01T00:00:00.000Z",
    "endDate": "2025-07-31T00:00:00.000Z",
    "description": "Built responsive dashboard screens and reusable React components.",
    "isVerified": true,
    "createdAt": "2026-11-05T10:15:30.000Z",
    "updatedAt": "2026-11-05T10:15:30.000Z"
  }
]
```

### Get an internship

```http
GET /api/students/:studentId/internships/:id
```

### Create an internship

```http
POST /api/students/:studentId/internships
```

```json
{
  "title": "Frontend Developer Intern",
  "companyName": "BlueOrbit Technologies",
  "startDate": "2025-05-01",
  "endDate": "2025-07-31",
  "description": "Built responsive dashboard screens and reusable React components."
}
```

Returns `201` with the created internship.

### Edit an internship

```http
PUT /api/students/:studentId/internships/:id
```

Send all the required fields, as for create. An omitted `endDate` is cleared. An `ADMIN` or `PLACEMENT_OFFICER` can verify the internship:

```json
{
  "title": "Frontend Developer Intern",
  "companyName": "BlueOrbit Technologies",
  "startDate": "2025-05-01",
  "endDate": "2025-07-31",
  "description": "Built responsive dashboard screens and reusable React components.",
  "isVerified": true
}
```

### Delete an internship

```http
DELETE /api/students/:studentId/internships/:id
```

This permanently deletes the internship.

## Projects

A student can manage their own projects. `ADMIN` and `PLACEMENT_OFFICER` can manage any student's projects. Other users get `403`.

| Field | Type | Rules |
|---|---|---|
| `title` | string | Required, up to 150 characters |
| `projectType` | string | Required, up to 100 characters. Example: `Academic project` |
| `description` | string | Required |
| `technologies` | UUID array | Optional, defaults to an empty array. Each value is the `id` of an active skill from `/api/skills` |

Requests send `technologies` as skill IDs. Responses return `technologies` as skill objects, so the names can be shown directly. An unknown or inactive skill ID returns `404`; a skill deactivated after it was added to the project can stay on that project.

### Get a student's projects

```http
GET /api/students/:studentId/projects
```

Returns the student's projects, newest first.

```json
[
  {
    "id": "c47a1d58-3b2e-4f96-b0d7-8e5a6f2c1d44",
    "studentId": "ba4115b8-f2dd-4c0b-a98d-57f7b345a046",
    "title": "Placement Prep AI",
    "projectType": "Full-stack web application",
    "description": "Personalized placement preparation dashboard with job matching and interview insights.",
    "technologies": [
      {
        "id": "8d2f7c10-52a4-4e1b-9f3a-6c1b7e2d4a90",
        "skill": "React",
        "category": "Frontend",
        "domain": "Web Development",
        "status": "ACTIVE"
      }
    ],
    "createdAt": "2026-11-05T10:15:30.000Z",
    "updatedAt": "2026-11-05T10:15:30.000Z"
  }
]
```

### Get a project

```http
GET /api/students/:studentId/projects/:id
```

### Create a project

```http
POST /api/students/:studentId/projects
```

```json
{
  "title": "Placement Prep AI",
  "projectType": "Full-stack web application",
  "description": "Personalized placement preparation dashboard with job matching and interview insights.",
  "technologies": [
    "8d2f7c10-52a4-4e1b-9f3a-6c1b7e2d4a90",
    "b2a1c4e6-7d3f-4f0a-8e21-5a9c3d6f7b12"
  ]
}
```

Returns `201` with the created project.

### Edit a project

```http
PUT /api/students/:studentId/projects/:id
```

Send all the required fields, as for create. An omitted `technologies` list is cleared.

### Delete a project

```http
DELETE /api/students/:studentId/projects/:id
```

This permanently deletes the project.

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
      "departments": [
        "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
        "9c7d4f31-3f25-5c55-af4c-8b9e3d2f6b21"
      ],
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
      "departments": [
        "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
        "9c7d4f31-3f25-5c55-af4c-8b9e3d2f6b21"
      ],
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

The required array fields must contain at least one value. Every department value must be an existing active department UUID from `/api/departments`. Skill IDs must belong to existing active skills.

### List campus drives

```http
GET /api/drives
```

Optional query parameters:

```text
page=1
pageSize=20
search=chennai
companyId=company-uuid
status=UPCOMING
driveDate=2026-11-20
driveDateFrom=2026-11-01
driveDateTo=2026-11-30
jobRole=Engineer
jobType=FULL_TIME
```

`search` is a case-insensitive partial match against the company name, job role, job location, and venue. An item is returned if any of these fields match. Maximum 150 characters; a blank value is ignored. It can be combined with the other filters, which must all match as well, and `pagination.total` reflects the filtered results.

Example:

```http
GET /api/drives?search=software&status=UPCOMING&page=1&pageSize=20
```

Each role is returned as a separate drive item. Shared drive and company fields are repeated for each item, and each item contains exactly one object in its `roles` array. Use the drive `id` and `roles[0].id` when editing or deleting a role.

Example response:

```json
{
  "data": [
    {
      "id": "c90ff70b-bc5f-4273-85fd-56432c2c009a",
      "companyId": "d579d734-fea7-4c6c-8ca3-ba7e800ee8bd",
      "driveDate": "2026-11-13T00:00:00.000Z",
      "driveTime": "11:05",
      "venue": "Chennai",
      "registrationEndDate": "2026-11-30T00:00:00.000Z",
      "status": "ONGOING",
      "createdAt": "2026-11-01T17:37:55.354Z",
      "updatedAt": "2026-11-01T17:37:55.354Z",
      "company": {
        "id": "d579d734-fea7-4c6c-8ca3-ba7e800ee8bd",
        "name": "Example Company",
        "website": null,
        "location": "Chennai",
        "status": "ACTIVE"
      },
      "roles": [
        {
          "id": "1b103bfb-5b4b-4c23-b05c-97fb907c82d8",
          "jobRole": "Software Engineer",
          "jobLocation": "Chennai",
          "jobType": "FULL_TIME",
          "ctcPackage": "6 LPA",
          "numberOfOpenings": 5
        }
      ]
    },
    {
      "id": "c90ff70b-bc5f-4273-85fd-56432c2c009a",
      "companyId": "d579d734-fea7-4c6c-8ca3-ba7e800ee8bd",
      "driveDate": "2026-11-13T00:00:00.000Z",
      "driveTime": "11:05",
      "venue": "Chennai",
      "registrationEndDate": "2026-11-30T00:00:00.000Z",
      "status": "ONGOING",
      "createdAt": "2026-11-01T17:37:55.354Z",
      "updatedAt": "2026-11-01T17:37:55.354Z",
      "company": {
        "id": "d579d734-fea7-4c6c-8ca3-ba7e800ee8bd",
        "name": "Example Company",
        "website": null,
        "location": "Chennai",
        "status": "ACTIVE"
      },
      "roles": [
        {
          "id": "f7ef189b-e629-4c7a-ae5d-7883a5280900",
          "jobRole": "Business Analyst",
          "jobLocation": "Chennai",
          "jobType": "INTERNSHIP",
          "ctcPackage": "2 LPA",
          "numberOfOpenings": 4
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

The detailed `GET /api/drives/:id` endpoint still returns one drive object with all roles in its `roles` array.

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

When using the flattened `GET /api/drives` response:

- `id` is the campus drive ID.
- `roles[0].id` is the role ID.

Use both values in the URL:

```http
PATCH /api/drives/{driveId}/roles/{roleId}
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

Use the same drive ID and role ID from the list response:

```http
DELETE /api/drives/{driveId}/roles/{roleId}
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
