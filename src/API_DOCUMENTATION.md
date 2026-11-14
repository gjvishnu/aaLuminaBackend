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
| `STUDENT` | Authenticated read access, complete skill CRUD, creating and editing their own student record, management of their own skills, internships, and projects, viewing the jobs they are eligible for, applying for them, viewing their own applications, and viewing their own dashboard |
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

`ADMIN` and `PLACEMENT_OFFICER` can access all student APIs. A `STUDENT` can create their own record and edit it, and cannot change `registrationNumber` once the record exists; any other student's `userUuid` or record returns `403`. Student creation and editing still require the `userUuid` to belong to an active user with the `STUDENT` role.

### Get students

```http
GET /api/students
```

Returns an array of all students, newest first. Only `ADMIN` and `PLACEMENT_OFFICER` can use this API.

### Get a student profile

```http
GET /api/students/profile?userId=student-user-uuid
```

`userId` is required and is the user's `userUuid` from the login response, not the student record `id`.

Allowed roles: `ADMIN`, `PLACEMENT_OFFICER`, and `STUDENT`. A student can only request their own `userId`; any other value returns `403`.

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
    "name": "Priya Nair",
    "registrationNumber": "LM2026001",
    "departmentId": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
    "degreeId": "3f1c8a52-6e0b-4c1d-9a7e-2b5d4f8e1c30",
    "batch": 2026,
    "semester": 8,
    "cgpa": 8.75,
    "backlogs": 0,
    "phone": "9876543210",
    "dateOfBirth": "2004-05-10T00:00:00.000Z",
    "location": "Chennai",
    "status": "ACTIVE",
    "createdAt": "2026-11-05T10:15:30.000Z",
    "updatedAt": "2026-11-05T10:15:30.000Z"
  }
}
```

A missing or invalid `userId` returns `400`, a user who does not exist returns `404`, and a user who is not an active `STUDENT` returns `403`.

### Create a student

```http
POST /api/students
```

Allowed roles: `ADMIN`, `PLACEMENT_OFFICER`, and `STUDENT`.

A `STUDENT` can only create their own record: `userUuid` must be their own, otherwise the response is `403`. A user can have only one student record, and `registrationNumber` must be unique; a duplicate returns `409`.

Required fields:

```json
{
  "userUuid": "student-user-uuid",
  "name": "Priya Nair",
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
  "cgpa": 8.75,
  "backlogs": 0,
  "phone": "9876543210",
  "dateOfBirth": "2004-05-10",
  "location": "Chennai"
}
```

`cgpa` is a number from `0` to `10` with at most 2 decimal places, or `null`. Any other value returns `400`. Responses always include `cgpa` as a number, or `null` when it has not been set.

`backlogs` is the student's number of backlogs: a whole number of `0` or more, or `null`. Any other value (a negative number, a decimal, or a string such as `"2"`) returns `400`. Responses always include `backlogs`, which is `null` when it has not been set.

`batch` is the student's graduation year. The Jobs APIs compare it with a drive role's `graduationYears`, and they also use `cgpa`, `backlogs`, `departmentId`, and the student's skills to decide which jobs the student sees. See [Jobs](#jobs).

`name` is the student's name, up to 150 characters. Records created before this field was added return `name` as `null` until it is set with an edit.

`degreeId` must be the UUID of an active degree from `/api/degrees`, or `null` for no degree. Student responses return `degreeId`.

Complete example:

```json
{
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "name": "Priya Nair",
  "registrationNumber": "LM2026001",
  "departmentId": "8b6c3f20-2f14-4b44-9f3b-7a8d2c1e5a10",
  "degreeId": "3f1c8a52-6e0b-4c1d-9a7e-2b5d4f8e1c30",
  "batch": 2026,
  "semester": 8,
  "cgpa": 8.75,
  "backlogs": 0,
  "phone": "9876543210",
  "dateOfBirth": "2004-05-10",
  "location": "Chennai"
}
```

### Edit a student

```http
PUT /api/students/:id
```

Allowed roles: `ADMIN`, `PLACEMENT_OFFICER`, and `STUDENT`.

`userUuid` is required in the request body. Other fields are optional, and only the fields sent are updated. `name` cannot be empty when it is sent.

```json
{
  "userUuid": "30f33c17-a7c1-44e7-a58f-f23c0437bc86",
  "name": "Priya Nair",
  "semester": 8,
  "cgpa": 8.9,
  "backlogs": 1,
  "location": "Bengaluru"
}
```

A `STUDENT` can only edit their own record. The response is `403` if `userUuid` or the record belongs to someone else, or if `registrationNumber` is sent, because a student cannot change it. A missing record returns `404`.

### Deactivate a student

```http
DELETE /api/students/:id
```

Allowed roles: `ADMIN` and `PLACEMENT_OFFICER`.

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

## Jobs

The Jobs APIs power the student **Jobs** screen. They return only the jobs a given student is eligible for, with a match score for each one.

A job is a role inside a campus drive. There is no separate jobs table: jobs come straight from the drive roles that placement officers create with the Campus Drive APIs, so any change to a drive or role shows up in the Jobs APIs immediately.

Allowed roles: `ADMIN`, `PLACEMENT_OFFICER`, and `STUDENT`. A `STUDENT` can only pass their own `studentId`; any other student returns `403`. `ADMIN` and `PLACEMENT_OFFICER` can pass any `studentId` to see what that student sees.

### How eligibility works

A job is returned for a student only when **all** of these are true:

| Check | Rule |
|---|---|
| Drive status | The drive is `UPCOMING` or `ONGOING`. `DRAFT`, `COMPLETED`, and `CANCELLED` drives are hidden. |
| Company | The drive's company is `ACTIVE`. |
| Apply by | The drive's `registrationEndDate` is today or later, or is not set. |
| CGPA | The student's `cgpa` is at least the role's `minimumCgpa`. |
| Backlogs | The student's `backlogs` is at most the role's `maximumBacklogs`. |
| Department | The student's `departmentId` is one of the role's `departments`. |
| Year | The student's `batch` (graduation year) is one of the role's `graduationYears`. |
| Skills | The student has at least one of the role's skills. |

Any criterion the role leaves empty (`null`, or an empty list) is open to every student. For example, a role with no `minimumCgpa` accepts any CGPA.

If the role sets a criterion but the student's matching profile field is empty, the student is **not** eligible. For example, a student with no `cgpa` does not see roles that set a `minimumCgpa`. The list response returns `missingProfileFields` so the app can prompt the student to complete their profile.

The student must also be `ACTIVE`. An inactive student returns `403`.

The role's `degree` and `otherCriteria` are returned for display but are not used for filtering.

### Match score

`match.percentage` is the share of the role's skills that the student has, rounded to a whole number:

```text
percentage = round(matchedSkills / totalSkills * 100)
```

A role with no skills matches at `100`. Each skill in `skills` has `matched: true` when the student has that skill, so the app can show or highlight the matching skills.

`match.label`:

| Percentage | Label |
|---|---|
| 90–100 | `Excellent` |
| 80–89 | `Great` |
| 60–79 | `Good` |
| 0–59 | `Fair` |

### Get jobs for a student

```http
GET /api/jobs?studentId=student-record-uuid
```

`studentId` is required and is the student record `id`, not the user's `userUuid`. Get it from `GET /api/students/profile`.

Optional query parameters, matching the filters on the Jobs screen:

| Parameter | Description |
|---|---|
| `search` | Case-insensitive text search across company name, job role, location, and skill names |
| `companyId` | Only jobs from this company |
| `jobRole` | Job role contains this text, case-insensitive |
| `jobLocation` | Job location contains this text, case-insensitive |
| `jobType` | One of the job type values listed under Campus drive enum values |
| `sortBy` | `newest` (default, newest role first), `applyBy` (closest apply-by date first; jobs with no apply-by date last), or `match` (highest match first) |
| `page` | Page number. Default: `1` |
| `pageSize` | Jobs per page, from `1` to `100`. Default: `20` |

Example:

```http
GET /api/jobs?studentId=ae4bce82-c44b-4681-890f-d9bad6349bcd&jobType=FULL_TIME&sortBy=match&page=1&pageSize=20
```

Response:

```json
{
  "data": [
    {
      "id": "8c470353-cea6-4fd1-ad8b-6b2890c7e6fb",
      "jobRole": "Software Engineer",
      "jobLocation": "Bangalore",
      "jobType": "FULL_TIME",
      "ctcPackage": "7.5 LPA",
      "numberOfOpenings": 10,
      "company": {
        "id": "7e113ed7-cb4b-4e68-9bf4-75fcb092a9c1",
        "name": "Tata Consultancy Services",
        "website": "https://www.tcs.com",
        "location": "Mumbai"
      },
      "drive": {
        "id": "6c18b908-8e4a-4cd5-85d5-b9d926b4dc10",
        "driveDate": "2026-11-25T00:00:00.000Z",
        "driveTime": "10:00",
        "venue": "Main Auditorium",
        "status": "UPCOMING"
      },
      "applyBy": "2026-11-19T00:00:00.000Z",
      "daysLeft": 5,
      "skills": [
        { "id": "3a6e4280-c448-44d8-bad7-7bb5a0e61a7b", "skill": "Java", "category": "Programming", "domain": "Software", "matched": true },
        { "id": "58f31992-f381-4fd2-be41-6d8e0c16b109", "skill": "SQL", "category": "Database", "domain": "Software", "matched": true },
        { "id": "9b2d1c4e-7a3f-4e8b-a1c2-5d6e7f8a9b0c", "skill": "OOPs", "category": "Concepts", "domain": "Software", "matched": false }
      ],
      "match": {
        "percentage": 67,
        "label": "Good",
        "matchedSkills": 2,
        "totalSkills": 3
      },
      "eligibility": {
        "minimumCgpa": 7,
        "maximumBacklogs": 0,
        "graduationYears": [2026],
        "degree": "B.E"
      },
      "application": null,
      "createdAt": "2026-11-10T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  },
  "filterOptions": {
    "companies": [
      { "id": "7e113ed7-cb4b-4e68-9bf4-75fcb092a9c1", "name": "Tata Consultancy Services" }
    ],
    "jobRoles": ["Software Engineer"],
    "jobLocations": ["Bangalore"],
    "jobTypes": ["FULL_TIME"]
  },
  "missingProfileFields": []
}
```

Response fields:

- `id` is the drive role `id`. Use it with `GET /api/jobs/:roleId` for the job details screen.
- `applyBy` is the drive's `registrationEndDate`, and `daysLeft` is the number of days from today until then (`0` on the last day). Both are `null` when the drive has no apply-by date.
- `application` is `null` when the student has not applied for this job. After they apply, it is `{ "id", "status", "appliedAt" }`, so the app can show **Applied** instead of the Apply button. See [Applications](#applications).
- `filterOptions` lists the values for the **All Companies**, **All Roles**, **All Locations**, and **All Job Types** dropdowns. It is built from every job the student is eligible for, before `search` and the other filters are applied, so the dropdowns keep all their options while filters are selected.
- `missingProfileFields` lists the empty profile fields that hide jobs: any of `cgpa`, `backlogs`, `departmentId`, `batch`, and `skills`. It is an empty array when the profile is complete.

When no jobs match, `data` is an empty array and the response is still `200`.

A missing or invalid `studentId` or query value returns `400`, a student that does not exist returns `404`, and a `STUDENT` passing another student's `studentId`, or an inactive student, returns `403`.

### Get a job

```http
GET /api/jobs/:roleId?studentId=student-record-uuid
```

Returns one job with its full details, for the screen opened from a row's arrow. `studentId` is required. The same eligibility rules apply: if the student is not eligible for this job, or the job does not exist, the response is `404`.

The response has every field from the list response, plus:

```json
{
  "jobDescription": "Build and maintain enterprise applications.",
  "jdPdfUrl": "https://example.com/jd/tcs-software-engineer.pdf",
  "selectionProcesses": ["ONLINE_ASSESSMENT", "TECHNICAL_INTERVIEW", "HR_INTERVIEW"],
  "selectionProcess": {
    "totalSteps": 3,
    "steps": [
      { "step": 1, "key": "ONLINE_ASSESSMENT", "title": "Online Test", "description": "Aptitude, Coding & Technical" },
      { "step": 2, "key": "TECHNICAL_INTERVIEW", "title": "Technical Interview", "description": "Core CS & Problem Solving" },
      { "step": 3, "key": "HR_INTERVIEW", "title": "HR Interview", "description": "Communication & Behavioral" }
    ],
    "note": "The selection process may vary slightly depending on the role and location."
  },
  "eligibility": {
    "minimumCgpa": 7,
    "maximumBacklogs": 0,
    "graduationYears": [2026],
    "degree": "B.E",
    "departments": [
      { "id": "48ce8bfd-f067-4887-95af-9ef4d72044cc", "name": "Computer Science" }
    ],
    "otherCriteria": ["No active backlogs"]
  }
}
```

#### Selection process

`selectionProcess` drives the **Selection Process** card. Its `steps` are the role's rounds in the order the placement officer entered them, numbered from `1`. Each step has:

- `key`: the selection process value, which the app can use to pick an icon.
- `title` and `description`: the text shown under the step.

`note` is the message shown at the bottom of the card. `selectionProcesses` still returns the raw values.

| `key` | `title` | `description` |
|---|---|---|
| `ONLINE_ASSESSMENT` | Online Test | Aptitude, Coding & Technical |
| `APTITUDE_TEST` | Aptitude Test | Quantitative, Logical & Verbal Reasoning |
| `TECHNICAL_TEST` | Technical Test | Core Subjects & Technical Concepts |
| `GROUP_DISCUSSION` | Group Discussion | Topics on Current Trends |
| `TECHNICAL_INTERVIEW` | Technical Interview | Core CS & Problem Solving |
| `HR_INTERVIEW` | HR Interview | Communication & Behavioral |
| `MANAGERIAL_INTERVIEW` | Managerial Interview | Managerial Round |
| `CASE_STUDY` | Case Study | Problem Analysis & Presentation |
| `CODING_ROUND` | Coding Round | Data Structures & Algorithms |
| `OTHER` | Other Round | Details shared by the placement team |

## Applications

The Applications APIs let a student apply for a job from the Jobs screen and list their applications on the **Applications** screen.

Each application links one student to one job (a drive role). A student can apply for a job only once.

Allowed roles: `ADMIN`, `PLACEMENT_OFFICER`, and `STUDENT`. A `STUDENT` can only pass their own `studentId`; any other student returns `403`. `ADMIN` and `PLACEMENT_OFFICER` can pass any `studentId`, including to apply on a student's behalf.

Application status values:

```text
APPLIED, SHORTLISTED, INTERVIEW, REJECTED, SELECTED, WITHDRAWN
```

`INTERVIEW` means the student is in the interview stage, and `SELECTED` means they received an offer. A new application always starts as `APPLIED`. There is no API yet for changing the status.

If a placement officer deletes a drive or a drive role, the applications for it are deleted too.

### Apply for a job

```http
POST /api/applications
```

Request:

```json
{
  "studentId": "ae4bce82-c44b-4681-890f-d9bad6349bcd",
  "roleId": "8c470353-cea6-4fd1-ad8b-6b2890c7e6fb"
}
```

`studentId` is the student record `id`. `roleId` is the job `id` from `GET /api/jobs`.

A student can only apply for a job they are eligible for, using the same rules as the Jobs screen (see [How eligibility works](#how-eligibility-works)). This also means applications close once the drive's `registrationEndDate` has passed, or when the drive is no longer `UPCOMING` or `ONGOING`.

Response `201`:

```json
{
  "id": "0f9a7c52-3b1e-4d6a-9c8f-2e4b6a1d3c70",
  "status": "APPLIED",
  "appliedAt": "2026-11-14T10:30:00.000Z",
  "updatedAt": "2026-11-14T10:30:00.000Z",
  "job": {
    "id": "8c470353-cea6-4fd1-ad8b-6b2890c7e6fb",
    "jobRole": "Software Engineer",
    "jobLocation": "Bangalore",
    "jobType": "FULL_TIME",
    "ctcPackage": "7.5 LPA",
    "company": { "id": "7e113ed7-cb4b-4e68-9bf4-75fcb092a9c1", "name": "Tata Consultancy Services" },
    "applyBy": "2026-11-19T00:00:00.000Z",
    "daysLeft": 5,
    "match": { "percentage": 67, "label": "Good", "matchedSkills": 2, "totalSkills": 3 }
  }
}
```

`job` has the same fields as a job in the `GET /api/jobs` response, except `application`. The example above is shortened.

Errors:

| Status | When |
|---|---|
| `400` | `studentId` or `roleId` is missing or not a valid UUID, or the student is not eligible for the job or applications for it are closed |
| `403` | A `STUDENT` passes another student's `studentId`, or the student is inactive |
| `404` | The student or the job does not exist |
| `409` | The student has already applied for this job |

### Get a student's applications

```http
GET /api/applications?studentId=student-record-uuid
```

`studentId` is required. Applications are returned newest first, by `appliedAt`.

Optional query parameters:

| Parameter | Description |
|---|---|
| `status` | Only applications with this status |
| `search` | Case-insensitive text search across company name, job role, and location |
| `page` | Page number. Default: `1` |
| `pageSize` | Applications per page, from `1` to `100`. Default: `20` |

Response:

```json
{
  "data": [
    {
      "id": "0f9a7c52-3b1e-4d6a-9c8f-2e4b6a1d3c70",
      "status": "APPLIED",
      "appliedAt": "2026-11-14T10:30:00.000Z",
      "updatedAt": "2026-11-14T10:30:00.000Z",
      "job": {
        "id": "8c470353-cea6-4fd1-ad8b-6b2890c7e6fb",
        "jobRole": "Software Engineer",
        "company": { "id": "7e113ed7-cb4b-4e68-9bf4-75fcb092a9c1", "name": "Tata Consultancy Services" },
        "match": { "percentage": 67, "label": "Good", "matchedSkills": 2, "totalSkills": 3 }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  },
  "statusCounts": {
    "ALL": 1,
    "APPLIED": 1,
    "SHORTLISTED": 0,
    "INTERVIEW": 0,
    "REJECTED": 0,
    "SELECTED": 0,
    "WITHDRAWN": 0
  }
}
```

- `job` has the same fields as in the Apply response. The example above is shortened.
- An application stays in this list even if the student no longer meets the job's criteria, or the drive is completed or cancelled. `job.match` uses the student's current skills.
- `statusCounts` counts all of the student's applications by status, ignoring `status`, `search`, and paging, so it can drive status tabs or summary cards.

When the student has no applications, `data` is an empty array and the response is still `200`.

A missing or invalid `studentId` or query value returns `400`, a student that does not exist returns `404`, and a `STUDENT` passing another student's `studentId`, or an inactive student, returns `403`.

## Student Dashboard

One API returns everything on the student **Dashboard** screen, as one object per card:

| Object | Card |
|---|---|
| `placementOverview` | Placement Overview: profile completion, placement readiness, and application activity |
| `upcomingDrives` | Upcoming & Ongoing Drives |
| `recommendedJobs` | Recommended For You |
| `skillsInDemand` | Skills Companies Are Looking For |

### Get the student dashboard

```http
GET /api/students/dashboard?studentId=student-record-uuid
```

Allowed roles: `ADMIN`, `PLACEMENT_OFFICER`, and `STUDENT`. A `STUDENT` can only pass their own `studentId`; any other student returns `403`. `ADMIN` and `PLACEMENT_OFFICER` can pass any `studentId`.

`studentId` is required and is the student record `id`. Get it from `GET /api/students/profile`.

Optional query parameters set how many items each list card returns:

| Parameter | Card | Default | Allowed |
|---|---|---|---|
| `driveLimit` | Upcoming & Ongoing Drives | `3` | `1`–`20` |
| `recommendedLimit` | Recommended For You | `3` | `1`–`20` |
| `skillLimit` | Skills Companies Are Looking For | `6` | `1`–`20` |

Each card's **View All** link should open the full screen: the Jobs screen (`GET /api/jobs`) for drives and recommendations, and the Applications screen (`GET /api/applications`) for application activity.

Response:

```json
{
  "placementOverview": {
    "profileCompletion": {
      "percentage": 65,
      "checklist": [
        { "key": "personalDetails", "label": "Personal Details", "done": true },
        { "key": "internships", "label": "Internship Details", "done": true },
        { "key": "cgpa", "label": "CGPA", "done": true },
        { "key": "resume", "label": "Resume", "done": false },
        { "key": "skills", "label": "Skills", "done": true },
        { "key": "projects", "label": "Projects", "done": true }
      ],
      "sections": [
        { "key": "personalDetails", "weight": 20, "earned": 20 },
        { "key": "academicPerformance", "weight": 20, "earned": 20 },
        { "key": "resume", "weight": 25, "earned": 0 },
        { "key": "placementProfile", "weight": 25, "earned": 25 },
        { "key": "activities", "weight": 10, "earned": 0 }
      ],
      "missingFields": ["resume", "extracurriculars", "sports", "awards"]
    },
    "placementReadiness": {
      "percentage": 75,
      "checklist": [
        { "key": "cgpa", "label": "CGPA", "weight": 25, "done": true },
        { "key": "resume", "label": "Upload your resume", "weight": 25, "done": false },
        { "key": "skills", "label": "Skills", "weight": 20, "done": true },
        { "key": "projects", "label": "Projects", "weight": 15, "done": true },
        { "key": "internships", "label": "Internships", "weight": 15, "done": true }
      ]
    },
    "applicationActivity": {
      "total": 12,
      "applied": 12,
      "shortlisted": 6,
      "interviews": 4,
      "offers": 1,
      "rejected": 3,
      "withdrawn": 0
    }
  },
  "upcomingDrives": {
    "counts": {
      "ongoing": 1,
      "upcoming": 2
    },
    "totalJobs": 3,
    "items": [
      {
        "jobId": "8c470353-cea6-4fd1-ad8b-6b2890c7e6fb",
        "driveId": "6c18b908-8e4a-4cd5-85d5-b9d926b4dc10",
        "company": { "id": "7e113ed7-cb4b-4e68-9bf4-75fcb092a9c1", "name": "TCS" },
        "jobRole": "Software Engineer",
        "ctcPackage": "7.5 LPA",
        "driveDate": "2026-09-05T00:00:00.000Z",
        "driveTime": "10:00",
        "driveStatus": "ONGOING",
        "applyBy": "2026-09-03T00:00:00.000Z",
        "daysLeft": -2,
        "application": {
          "id": "0f9a7c52-3b1e-4d6a-9c8f-2e4b6a1d3c70",
          "status": "APPLIED",
          "appliedAt": "2026-09-01T10:30:00.000Z"
        }
      },
      {
        "jobId": "2b7e4f19-8c3d-4a6b-9e1f-5d7c8a2b4e60",
        "driveId": "9d2c4e81-5a7b-4f3c-8e6d-1b9a7c5e3f20",
        "company": { "id": "4c8e2a61-7b3d-4f9e-a5c1-8d2b6e4f7a90", "name": "Zoho" },
        "jobRole": "Developer",
        "ctcPackage": "8.0 LPA",
        "driveDate": "2026-09-12T00:00:00.000Z",
        "driveTime": "09:30",
        "driveStatus": "UPCOMING",
        "applyBy": "2026-09-10T00:00:00.000Z",
        "daysLeft": 5,
        "application": null
      }
    ]
  },
  "recommendedJobs": {
    "total": 5,
    "items": [
      {
        "jobId": "2b7e4f19-8c3d-4a6b-9e1f-5d7c8a2b4e60",
        "driveId": "9d2c4e81-5a7b-4f3c-8e6d-1b9a7c5e3f20",
        "company": { "id": "4c8e2a61-7b3d-4f9e-a5c1-8d2b6e4f7a90", "name": "Zoho" },
        "jobRole": "Developer",
        "ctcPackage": "8.0 LPA",
        "match": { "percentage": 81, "label": "Great", "matchedSkills": 4, "totalSkills": 5 },
        "departments": [
          { "id": "48ce8bfd-f067-4887-95af-9ef4d72044cc", "name": "CSE" },
          { "id": "5a1d3f72-9c4e-4b8a-b6d2-7e3f1c9a5b80", "name": "IT" }
        ],
        "graduationYears": [2026],
        "applyBy": "2026-09-10T00:00:00.000Z",
        "daysLeft": 5
      }
    ]
  },
  "skillsInDemand": {
    "totalCompanies": 30,
    "totalSkills": 42,
    "items": [
      { "skillId": "3a6e4280-c448-44d8-bad7-7bb5a0e61a7b", "skill": "React.js", "companyCount": 24, "studentHasSkill": true },
      { "skillId": "58f31992-f381-4fd2-be41-6d8e0c16b109", "skill": "Python", "companyCount": 21, "studentHasSkill": false }
    ]
  }
}
```

#### `placementOverview.profileCompletion`

Profile Completion and Placement Readiness use the same formulas as the student **My Profile** screen, so the dashboard and the profile screen always show the same percentages.

The backend does not store a resume, extracurriculars, sports, or awards yet, so these always count as not done. A student can therefore reach at most 65% profile completion and 75% placement readiness until those sections are added.

`percentage` is the sum of these sections, rounded to a whole number:

| Section (`sections[].key`) | Weight | Earned when |
|---|---|---|
| `personalDetails` | 20 | 5 points for each of name, phone, date of birth, and location. The name always counts, because the app falls back to a name built from the account email. |
| `academicPerformance` | 20 | `cgpa` is set |
| `resume` | 25 | A resume is uploaded (not stored yet, so always 0) |
| `placementProfile` | 25 | 8.33 points each for at least one skill, one project, and one internship |
| `activities` | 10 | 3.33 points each for extracurriculars, sports, and awards (not stored yet, so always 0) |

- `sections` gives the `weight` and `earned` points of each section, rounded to 2 decimal places.
- `checklist` holds the six items of the **Profile checklist**, in the same order and with the same labels as the profile screen. `done` is `false` for items to show with a warning icon.
- `missingFields` lists what is still missing, using these keys: `name`, `phone`, `dateOfBirth`, `location`, `cgpa`, `resume`, `skills`, `projects`, `internships`, `extracurriculars`, `sports`, and `awards`. Use it for the **Complete profile** link.

#### `placementOverview.placementReadiness`

`percentage` is the sum of the weights of the items that are done:

| Item (`checklist[].key`) | Weight | Done when |
|---|---|---|
| `cgpa` | 25 | `cgpa` is set |
| `resume` | 25 | A resume is uploaded (not stored yet, so always not done) |
| `skills` | 20 | The student has at least one skill |
| `projects` | 15 | The student has at least one project |
| `internships` | 15 | The student has at least one internship |

`checklist` holds these five items for the **Readiness checklist**, in the same order and with the same labels as the profile screen. An item that is not done has an action label instead, such as **Upload your resume**, **Add your CGPA**, **Add your skills**, **Add a project**, or **Add internship details**.

#### `placementOverview.applicationActivity`

Counts of the student's applications. `total` and `applied` are both the number of applications the student has made (every status); the other counts are by current status:

| Field | Application status |
|---|---|
| `shortlisted` | `SHORTLISTED` |
| `interviews` | `INTERVIEW` |
| `offers` | `SELECTED` |
| `rejected` | `REJECTED` |
| `withdrawn` | `WITHDRAWN` |

#### `upcomingDrives`

Jobs in `UPCOMING` and `ONGOING` drives, with the soonest `driveDate` first. A job is included when the student is eligible for it (see [How eligibility works](#how-eligibility-works)), or when the student has already applied for it. An applied job stays here even after its apply-by date has passed, so `daysLeft` can be negative for those jobs.

- `counts.ongoing` and `counts.upcoming` count distinct drives, for the **1 Ongoing** and **2 Upcoming** badges.
- `totalJobs` is the number of jobs before `driveLimit` is applied.
- `application` is `null` when the student has not applied, so the app shows **Apply Now**. Otherwise it holds the application, so the app shows **Applied**. Apply Now should call `POST /api/applications` with the `jobId` as `roleId`.

#### `recommendedJobs`

Jobs the student is eligible for and has **not** applied for yet, sorted by highest `match.percentage`, then closest apply-by date. `total` is the number before `recommendedLimit` is applied.

`departments` and `graduationYears` are the role's criteria, shown as **CSE, IT** and **2026 Batch** on the card. **View Drive** can open `GET /api/jobs/:roleId?studentId=...` with the `jobId`.

#### `skillsInDemand`

For each skill, `companyCount` is the number of distinct companies with an `UPCOMING` or `ONGOING` drive that asks for that skill. Skills are sorted by `companyCount`, highest first.

- `totalCompanies` is the number of companies with open drives. Use it, or the first item's `companyCount`, as 100% when drawing the bars.
- `studentHasSkill` is `true` when the student already has the skill.

A missing or invalid `studentId` or limit returns `400`, a student that does not exist returns `404`, and a `STUDENT` passing another student's `studentId`, or an inactive student, returns `403`.

## Common response codes

| Status | Meaning |
|---|---|
| `200` | Request succeeded |
| `201` | Record created |
| `400` | Invalid payload, parameter, or enum value |
| `401` | Missing, invalid, expired, or invalidated token |
| `403` | Token is valid but the role is not allowed, or the record belongs to another user |
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
