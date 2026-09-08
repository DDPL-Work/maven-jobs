# Maven Jobs — Complete Database Schema & API Association Documentation

> **Document Version:** 1.0.0  
> **Target Subsystem:** Maven Jobs Backend (`server/src`)  
> **Database Stack:** MongoDB + Mongoose ODM v9.2.1  
> **Total Models Audited:** 43 models  
> **Audit Methodology:** 100% Codebase inspection across all 43 model schemas, 28 controller files, 23 route definition files, 18 services, 5 event subscribers, realtime WebSockets, and middleware. No assumptions or approximations.

---

## Executive Summary & Architecture Overview

The Maven Jobs data architecture is designed for a multi-tenant, role-segregated recruitment marketplace and internal field sales CRM:

1. **User Identity & Multi-Tenancy Hierarchy**:
   - `User`: Primary actor collection for job candidates (`CANDIDATE`), employer recruiters (`CLIENT`), and administrative users.
   - `CandidateProfile` & `CandidateProfileHistory`: Dedicated documents storing ATS metadata, parsed resumes, skills, work experiences, education, and version-controlled audit trails for candidates.
   - `CrmUser`: Segregated internal sales management hierarchy featuring 5 organizational tiers (`LEAD_GENERATOR`, `FSE`, `STATE_MANAGER`, `ZONAL_MANAGER`, `NATIONAL_SALES_HEAD`) along with `ADMIN` and `APPROVER` roles, with target tracking.
   - `Company`: Corporate employer profiles with industry categorizations, subscription package tiers, job post limits, and verification status.

2. **Enterprise Session & Security Layer**:
   - Dual-token authentication with short-lived JWT access tokens and persistent `RefreshToken` documents linked into rotational token families.
   - `Session` collection tracking client IP, device ID, user-agent, and active session status across both `User` and `CrmUser` actors.
   - `PasswordResetOTP` with SHA-256 OTP hashing, TTL expiry (`expireAfterSeconds: 0`), entity distinction (`candidate` vs `employer`), and attempt throttling.

3. **Recruitment Marketplace & ATS**:
   - `Job`: Job postings with compensation brackets, required skills, work modes, ATS question sets, and application counters.
   - `Application`: Job applications with hiring pipeline stages (`PENDING`, `SHORTLISTED`, `INTERVIEW`, `OFFERED`, `REJECTED`, `HIRED`), resume references, and recruiter notes.
   - `CompanyReview`: Employee reviews and ratings of companies.
   - `ResdexSearch`: Saved recruiter search queries with filter tags and pinning support.
   - `Folder` & `FolderCandidate`: Candidate folder organization and talent pipelining for recruiters.
   - `Nvite`: Direct interview invitations dispatched to candidates.

4. **Monetization & Credit Ledger**:
   - `Credit` & `CreditTransaction`: Pre-paid credit ledger for resume downloads, candidate views, and searches.
   - `PaidResume`: Unlocked resume database tracking unique candidate views per company.
   - `Package` & `PackageChangeRequest`: Employer membership tiers and quota upgrade workflows with multi-step approval.
   - `PaymentTransaction`: Gateway order and payment verification log for Razorpay transactions.

5. **Sales CRM Pipeline**:
   - `Lead`: Comprehensive 7-stage sales funnel tracking companies from lead generation through field sales visits, demos, commercial closures, onboarding, and contract renewals.
   - `ClientIntake`: External employer lead generation and JD upload intake.
   - `NonVisitDay`: Field sales executive schedule management.
   - `NationalSalesPolicy`: Dynamic policy rules for commercial discounts and pricing thresholds.
   - `CrmCampaign`: Targeted outreach campaigns for lead generators.

6. **AI & Candidate Engagement**:
   - `DailyQuiz` & `CandidateQuizResult`: Daily personalized AI-generated quizzes, XP scoring, and global ranking leaderboards.
   - `ChatBotThread`, `ChatBotMessage`, `DailyUsage`: Conversational AI career assistant with OpenAI integration and tier-based quota tracking.
   - `ChatMessage` & `ChatThread`: Real-time candidate-recruiter messaging over Socket.io.
   - `Blog`: CMS articles with slug indexing, categories, tags, claps, and nested comments.
   - `QRCode`: Dynamic QR code generation for company recruitment drives and offline promotional campaigns.

---

## Table of Contents
1. [AdminAuditLog](#adminauditlog)
2. [AdminNotification](#adminnotification)
3. [AdminRole](#adminrole)
4. [AdminSetting](#adminsetting)
5. [Application](#application)
6. [Blog](#blog)
7. [Candidate](#candidate)
8. [CandidateNotification](#candidatenotification)
9. [CandidateProfile](#candidateprofile)
10. [CandidateProfileHistory](#candidateprofilehistory)
11. [CandidateQuizResult](#candidatequizresult)
12. [ChatBotMessage](#chatbotmessage)
13. [ChatBotThread](#chatbotthread)
14. [ChatMessage](#chatmessage)
15. [ChatThread](#chatthread)
16. [ClientIntake](#clientintake)
17. [Company](#company)
18. [CompanyReview](#companyreview)
19. [Credit](#credit)
20. [CreditTransaction](#credittransaction)
21. [CrmCampaign](#crmcampaign)
22. [CrmUser](#crmuser)
23. [DailyQuiz](#dailyquiz)
24. [DailyUsage](#dailyusage)
25. [Folder](#folder)
26. [FolderCandidate](#foldercandidate)
27. [Job](#job)
28. [Lead](#lead)
29. [NationalSalesPolicy](#nationalsalespolicy)
30. [NonVisitDay](#nonvisitday)
31. [NotificationPreferences](#notificationpreferences)
32. [Nvite](#nvite)
33. [Package](#package)
34. [PackageChangeRequest](#packagechangerequest)
35. [PaidResume](#paidresume)
36. [PasswordResetOTP](#passwordresetotp)
37. [PaymentTransaction](#paymenttransaction)
38. [QRCode](#qrcode)
39. [RecruiterActivity](#recruiteractivity)
40. [RefreshToken](#refreshtoken)
41. [ResdexSearch](#resdexsearch)
42. [Session](#session)
43. [User](#user)

---

## AdminAuditLog

- **File Path:** [`server/src/models/AdminAuditLog.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/AdminAuditLog.js)
- **MongoDB Collection:** `adminauditlogs`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `action` | `String` | **Yes** | - | - | Schema field for `action` |
| `entityType` | `String` | **Yes** | - | - | Schema field for `entityType` |
| `entityId` | `String` | No | `` | - | Schema field for `entityId` |
| `message` | `String` | **Yes** | - | - | Schema field for `message` |
| `severity` | `String` | No | `INFO` | **Enum:** `[INFO, MEDIUM, HIGH, CRITICAL]` | Schema field for `severity` |
| `metadata` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `metadata` |
| `performedBy.id` | `String` | No | `` | - | Schema field for `performedBy.id` |
| `performedBy.email` | `String` | No | `` | - | Schema field for `performedBy.email` |
| `performedBy.role` | `String` | No | `` | - | Schema field for `performedBy.role` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/dashboard` | `admin.controller.js` | `getDashboard` | `AdminAuditLog.find` |

---

## AdminNotification

- **File Path:** [`server/src/models/AdminNotification.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/AdminNotification.js)
- **MongoDB Collection:** `adminnotifications`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `title` | `String` | **Yes** | - | Trimmed | Schema field for `title` |
| `message` | `String` | **Yes** | - | Trimmed | Schema field for `message` |
| `type` | `String` | No | `SYSTEM` | **Enum:** `[USER, ROLE, SYSTEM, SECTION, ALERT]` | Schema field for `type` |
| `severity` | `String` | No | `INFO` | **Enum:** `[INFO, MEDIUM, HIGH, CRITICAL]` | Schema field for `severity` |
| `status` | `String` | No | `UNREAD` | **Enum:** `[UNREAD, READ]`<br>**Indexed** | Schema field for `status` |
| `actionUrl` | `String` | No | `` | - | Schema field for `actionUrl` |
| `metadata` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"status":1}` | Options: `{}`
- Index: `{"status":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/notifications` | `admin.controller.js` | `getNotifications` | `AdminNotification.find` |
| **PATCH** | `/api/v1/admin/notifications/:id/read` | `admin.controller.js` | `markNotificationRead` | `AdminNotification.findByIdAndUpdate` |
| **PATCH** | `/api/v1/admin/notifications/read-all` | `admin.controller.js` | `markAllNotificationsRead` | `AdminNotification.updateMany` |

---

## AdminRole

- **File Path:** [`server/src/models/AdminRole.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/AdminRole.js)
- **MongoDB Collection:** `adminroles`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | **Yes** | - | **Unique Index**<br>Trimmed | Schema field for `name` |
| `code` | `String` | **Yes** | - | **Unique Index**<br>Trimmed | Schema field for `code` |
| `scope` | `String` | No | `Custom` | - | Schema field for `scope` |
| `description` | `String` | No | `` | - | Schema field for `description` |
| `isSystemRole` | `Boolean` | No | `false` | - | Schema field for `isSystemRole` |
| `systemRoleKey` | `String` | No | `null` | **Enum:** `[ADMIN, CRM, FSE, CLIENT, CANDIDATE, ]` | Schema field for `systemRoleKey` |
| `permissions` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `permissions` |
| `members` | `Array` | No | `` | - | Schema field for `members` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"name":1}` | Options: `{"unique":true}`
- Index: `{"code":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/dashboard` | `admin.controller.js` | `getDashboard` | `AdminRole.find` |
| **DELETE** | `/api/v1/admin/users/:source/:id` | `admin.controller.js` | `deleteUser` | `AdminRole.updateMany` |
| **GET** | `/api/v1/admin/roles` | `admin.controller.js` | `getRoles` | `AdminRole.find` |
| **POST** | `/api/v1/admin/roles` | `admin.controller.js` | `createRole` | `AdminRole.findOne` |
| **PATCH** | `/api/v1/admin/roles/:id/permissions` | `admin.controller.js` | `updateRolePermissions` | `AdminRole.findById` |
| **POST** | `/api/v1/admin/roles/:id/assign` | `admin.controller.js` | `assignRole` | `AdminRole.findById` |

---

## AdminSetting

- **File Path:** [`server/src/models/AdminSetting.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/AdminSetting.js)
- **MongoDB Collection:** `adminsettings`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `module` | `String` | **Yes** | - | **Unique Index** | Schema field for `module` |
| `title` | `String` | **Yes** | - | - | Schema field for `title` |
| `owner` | `String` | **Yes** | - | - | Schema field for `owner` |
| `risk` | `String` | **Yes** | - | - | Schema field for `risk` |
| `currentState` | `String` | **Yes** | - | - | Schema field for `currentState` |
| `description` | `String` | No | `` | - | Schema field for `description` |
| `value` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `value` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"module":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/dashboard` | `admin.controller.js` | `getDashboard` | `AdminSetting.find` |

---

## Application

- **File Path:** [`server/src/models/Application.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Application.js)
- **MongoDB Collection:** `applications`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`, `controllers/candidate.controller.js`, `controllers/chat.controller.js`, `controllers/company-panel.controller.js`, `controllers/crm-panel.controller.js`, `controllers/landing.controller.js`, `controllers/resdex.controller.js`, `services/openai/ChatBotService.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `jobId` | `ObjectId` | **Yes** | - | **Ref:** `Job` | Schema field for `jobId` |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company` | Schema field for `companyId` |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `candidateId` |
| `status` | `String` | No | `APPLIED` | **Enum:** `[APPLIED, SCREENING, SHORTLISTED, INTERVIEW, OFFERED, HIRED, REJECTED]` | Schema field for `status` |
| `resumeUrl` | `String` | No | `` | - | Schema field for `resumeUrl` |
| `resumeFileName` | `String` | No | `` | - | Schema field for `resumeFileName` |
| `sourceQrToken` | `String` | No | `` | - | Schema field for `sourceQrToken` |
| `sourceJobId` | `ObjectId` | No | `null` | **Ref:** `Job` | Schema field for `sourceJobId` |
| `answers` | `Array` | No | - | - | Schema field for `answers` |
| `appliedFrom` | `String` | No | `JOB_DETAILS` | **Enum:** `[QUICK_APPLY, JOB_DETAILS]` | Schema field for `appliedFrom` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/dashboard` | `admin.controller.js` | `getDashboard` | `Application.countDocuments` |
| **GET** | `/api/v1/candidate/dashboard` | `candidate.controller.js` | `getDashboard` | `Application.find` |
| **POST** | `/api/v1/candidate/applications` | `candidate.controller.js` | `createApplication` | `Application.findOne` |
| **GET** | `/api/v1/candidate/applications` | `candidate.controller.js` | `getApplications` | `Application.find` |
| **GET** | `/api/v1/candidate/exports/candidates` | `candidate.controller.js` | `exportCandidateProfiles` | `Application.find` |
| **GET** | `/api/v1/company-panel/dashboard` | `company-panel.controller.js` | `getDashboard` | `Application.find` |
| **GET** | `/api/v1/company-panel/applications` | `company-panel.controller.js` | `getApplications` | `Application.find` |
| **PATCH** | `/api/v1/company-panel/applications/:applicationId/status` | `company-panel.controller.js` | `updateApplicationStatus` | `Application.findOne` |
| **GET** | `/api/v1/company-panel/applications/:applicationId/resume/preview` | `company-panel.controller.js` | `previewApplicationResume` | `Application.findOne` |
| **POST** | `/api/v1/company-panel/applications/:applicationId/resume/upload` | `company-panel.controller.js` | `uploadApplicationResume` | `Application.findOne` |
| **GET** | `/api/v1/company-panel/analytics` | `company-panel.controller.js` | `getAnalytics` | `Application.find` |
| **GET** | `/api/v1/crm-panel/dashboard` | `crm-panel.controller.js` | `getDashboard` | `Application.find` |
| **GET** | `/api/v1/crm-panel/candidates` | `crm-panel.controller.js` | `getCandidates` | `Application.aggregate` |
| **GET** | `/api/v1/crm-panel/applications` | `crm-panel.controller.js` | `getApplications` | `Application.find` |
| **PATCH** | `/api/v1/crm-panel/applications/:id/status` | `crm-panel.controller.js` | `updateApplicationStatus` | `Application.findById` |
| **GET** | `/api/v1/landing/jobs` | `landing.controller.js` | `getPublicJobs` | `Application.find` |
| **GET** | `/api/v1/landing/employer` | `landing.controller.js` | `getEmployerLandingData` | `Application.countDocuments` |

**Service & Background Integration:**
- Core business logic service: `ChatBotService.js`

---

## Blog

- **File Path:** [`server/src/models/Blog.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Blog.js)
- **MongoDB Collection:** `blogs`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Pre-save Hooks:** Yes (automated slug generation / data normalization)
- **Static Methods:** Yes
- **Referenced In:** `controllers/blog.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `title` | `String` | **Yes** | - | Trimmed | Schema field for `title` |
| `slug` | `String` | **Yes** | - | **Unique Index**<br>Trimmed | Schema field for `slug` |
| `content` | `String` | **Yes** | - | - | Schema field for `content` |
| `excerpt` | `String` | No | `` | - | Schema field for `excerpt` |
| `coverImage.url` | `String` | No | `` | - | Schema field for `coverImage.url` |
| `coverImage.publicId` | `String` | No | `` | - | Schema field for `coverImage.publicId` |
| `category` | `String` | **Yes** | - | **Enum:** `[IT, English, Career, Technology, Interview Tips, Resume & Cover Letter, Salary & Growth, Remote Work, Product Updates]` | Schema field for `category` |
| `tags` | `Array` | No | `` | - | Schema field for `tags` |
| `author.name` | `String` | No | `Admin` | - | Schema field for `author.name` |
| `author.avatar` | `String` | No | `` | - | Schema field for `author.avatar` |
| `status` | `String` | No | `draft` | **Enum:** `[draft, published]`<br>**Indexed** | Schema field for `status` |
| `publishedAt` | `Date` | No | `null` | - | Schema field for `publishedAt` |
| `metadata.viewCount` | `Number` | No | `0` | - | Schema field for `metadata.viewCount` |
| `metadata.readTimeMinutes` | `Number` | No | `0` | - | Schema field for `metadata.readTimeMinutes` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"slug":1}` | Options: `{"unique":true}`
- Index: `{"status":1}` | Options: `{}`
- Index: `{"status":1,"publishedAt":-1}` | Options: `{}`
- Index: `{"category":1,"status":1}` | Options: `{}`
- Index: `{"slug":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/blog` | `blog.controller.js` | `getBlogs` | `Blog.find` |
| **GET** | `/api/v1/admin/blogs` | `blog.controller.js` | `getBlogs` | `Blog.find` |
| **GET** | `/api/v1/blog/:slug` | `blog.controller.js` | `getBlogBySlug` | `Blog.findOne` |
| **GET** | `/api/v1/admin/blogs/:slug` | `blog.controller.js` | `getBlogBySlug` | `Blog.findOne` |
| **GET** | `/api/v1/blog/id/:id` | `blog.controller.js` | `getBlogById` | `Blog.findById` |
| **GET** | `/api/v1/admin/blogs/id/:id` | `blog.controller.js` | `getBlogById` | `Blog.findById` |
| **POST** | `/api/v1/blog` | `blog.controller.js` | `createBlog` | `Blog.create` |
| **POST** | `/api/v1/admin/blogs` | `blog.controller.js` | `createBlog` | `Blog.create` |
| **PUT** | `/api/v1/blog/:id` | `blog.controller.js` | `updateBlog` | `Blog.findById` |
| **PUT** | `/api/v1/admin/blogs/:id` | `blog.controller.js` | `updateBlog` | `Blog.findById` |
| **DELETE** | `/api/v1/blog/:id` | `blog.controller.js` | `deleteBlog` | `Blog.findById` |
| **DELETE** | `/api/v1/admin/blogs/:id` | `blog.controller.js` | `deleteBlog` | `Blog.findById` |
| **PATCH** | `/api/v1/blog/:id/toggle-status` | `blog.controller.js` | `toggleBlogStatus` | `Blog.findById` |
| **PATCH** | `/api/v1/admin/blogs/:id/toggle-status` | `blog.controller.js` | `toggleBlogStatus` | `Blog.findById` |
| **GET** | `/api/v1/blog/published` | `blog.controller.js` | `getPublishedBlogs` | `Blog.find` |
| **GET** | `/api/v1/admin/blogs/published` | `blog.controller.js` | `getPublishedBlogs` | `Blog.find` |

---

## Candidate

- **File Path:** [`server/src/models/Candidate.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Candidate.js)
- **MongoDB Collection:** `companies`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyName` | `String` | **Yes** | - | - | Schema field for `companyName` |
| `tagline` | `String` | No | - | - | Schema field for `tagline` |
| `industry` | `String` | **Yes** | - | - | Schema field for `industry` |
| `companySize` | `String` | No | - | - | Schema field for `companySize` |
| `foundedYear` | `Number` | No | - | - | Schema field for `foundedYear` |
| `email` | `String` | **Yes** | - | - | Schema field for `email` |
| `phone` | `String` | **Yes** | - | - | Schema field for `phone` |
| `altPhone` | `String` | No | - | - | Schema field for `altPhone` |
| `website` | `String` | No | - | - | Schema field for `website` |
| `linkedIn` | `String` | No | - | - | Schema field for `linkedIn` |
| `country` | `String` | No | - | - | Schema field for `country` |
| `region` | `String` | No | - | **Indexed** | Schema field for `region` |
| `city` | `String` | **Yes** | - | **Indexed** | Schema field for `city` |
| `zone` | `String` | No | - | **Indexed** | Schema field for `zone` |
| `address` | `String` | No | - | - | Schema field for `address` |
| `pincode` | `String` | No | - | - | Schema field for `pincode` |
| `packageType` | `String` | No | `STANDARD` | **Enum:** `[STANDARD, PREMIUM, ELITE]` | Schema field for `packageType` |
| `jobLimit` | `Number` | No | `2` | - | Schema field for `jobLimit` |
| `activeJobCount` | `Number` | No | `0` | - | Schema field for `activeJobCount` |
| `createdByCRM` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `createdByCRM` |
| `isActive` | `Boolean` | No | `true` | - | Schema field for `isActive` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"region":1}` | Options: `{}`
- Index: `{"city":1}` | Options: `{}`
- Index: `{"zone":1}` | Options: `{}`

### Associated APIs & Operations

*No direct standalone HTTP endpoints are mapped to this model.*

> [!WARNING]  
> **Architectural Note:** `Candidate.js` is an orphaned legacy file that duplicates the `companySchema` and registers `mongoose.model("Company", companySchema)`. In this system, Candidate accounts are stored in the `User` collection (with `role: "CANDIDATE"`) and their detailed profiles are maintained in `CandidateProfile`.

---

## CandidateNotification

- **File Path:** [`server/src/models/CandidateNotification.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/CandidateNotification.js)
- **MongoDB Collection:** `candidatenotifications`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/candidate.controller.js`, `controllers/chat.controller.js`, `controllers/company-panel.controller.js`, `controllers/crm-panel.controller.js`, `services/openai/EliteJobMatchService.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `candidateId` |
| `companyId` | `ObjectId` | No | `null` | **Ref:** `Company` | Schema field for `companyId` |
| `jobId` | `ObjectId` | No | `null` | **Ref:** `Job` | Schema field for `jobId` |
| `applicationId` | `ObjectId` | No | `null` | **Ref:** `Application` | Schema field for `applicationId` |
| `title` | `String` | **Yes** | - | Trimmed | Schema field for `title` |
| `message` | `String` | **Yes** | - | Trimmed | Schema field for `message` |
| `category` | `String` | No | `SYSTEM` | **Enum:** `[APPLICATION, JOB_ALERT, SYSTEM, CAMPAIGN, CHAT]` | Schema field for `category` |
| `status` | `String` | No | `UNREAD` | **Enum:** `[UNREAD, READ]`<br>**Indexed** | Schema field for `status` |
| `actionUrl` | `String` | No | `` | - | Schema field for `actionUrl` |
| `metadata` | `Mixed` | No | `null` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"candidateId":1}` | Options: `{}`
- Index: `{"status":1}` | Options: `{}`
- Index: `{"candidateId":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/candidate/dashboard` | `candidate.controller.js` | `getDashboard` | `CandidateNotification.find` |
| **POST** | `/api/v1/candidate/applications` | `candidate.controller.js` | `createApplication` | `CandidateNotification.create` |
| **PATCH** | `/api/v1/candidate/companies/:id/follow` | `candidate.controller.js` | `toggleCompanyFollow` | `CandidateNotification.create` |
| **POST** | `/api/v1/candidate/profile/resume` | `candidate.controller.js` | `uploadResume` | `CandidateNotification.create` |
| **DELETE** | `/api/v1/candidate/profile/resume` | `candidate.controller.js` | `deleteResume` | `CandidateNotification.create` |
| **GET** | `/api/v1/candidate/notifications` | `candidate.controller.js` | `getNotifications` | `CandidateNotification.find` |
| **POST** | `/api/v1/candidate/quiz/today/submit` | `candidate.controller.js` | `submitTodayQuiz` | `CandidateNotification.create` |
| **PATCH** | `/api/v1/candidate/notifications/:id/read` | `candidate.controller.js` | `markNotificationRead` | `CandidateNotification.findOne` |
| **POST** | `/api/v1/candidate/chats/:threadId/messages` | `chat.controller.js` | `sendCandidateMessage` | `CandidateNotification.create` |
| **PATCH** | `/api/v1/company-panel/applications/:applicationId/status` | `company-panel.controller.js` | `updateApplicationStatus` | `CandidateNotification.create` |
| **GET** | `/api/v1/company-panel/notifications` | `company-panel.controller.js` | `getNotifications` | `CandidateNotification.find` |
| **PATCH** | `/api/v1/company-panel/notifications/:id/read` | `company-panel.controller.js` | `markNotificationRead` | `CandidateNotification.findOne` |
| **PATCH** | `/api/v1/crm-panel/applications/:id/status` | `crm-panel.controller.js` | `updateApplicationStatus` | `CandidateNotification.create` |
| **POST** | `/api/v1/crm-panel/notifications` | `crm-panel.controller.js` | `createNotification` | `CandidateNotification.insertMany` |

**Service & Background Integration:**
- Core business logic service: `EliteJobMatchService.js`

---

## CandidateProfile

- **File Path:** [`server/src/models/CandidateProfile.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/CandidateProfile.js)
- **MongoDB Collection:** `candidateprofiles`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/ai.controller.js`, `controllers/auth.controller.js`, `controllers/candidate.controller.js`, `controllers/chat.controller.js`, `controllers/company-panel.controller.js`, `controllers/crm-panel.controller.js`, `controllers/folder.controller.js`, `controllers/landing.controller.js`, `controllers/nvite.controller.js`, `controllers/resdex.controller.js`, `recommendations/engine/recommendationEngine.js`, `services/openai/ChatBotService.js`, `services/openai/EliteJobMatchService.js`, `services/openai/UserContextBuilder.js`, `services/quiz.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Unique Index**<br>**Indexed** | Schema field for `userId` |
| `publicShareId` | `String` | No | `null` | **Unique Index**<br>**Indexed** | Schema field for `publicShareId` |
| `phone` | `String` | No | `` | - | Schema field for `phone` |
| `altPhone` | `String` | No | `` | - | Schema field for `altPhone` |
| `headline` | `String` | No | `` | - | Schema field for `headline` |
| `summary` | `String` | No | `` | - | Schema field for `summary` |
| `totalExperience` | `String` | No | `` | - | Schema field for `totalExperience` |
| `currentTitle` | `String` | No | `` | - | Schema field for `currentTitle` |
| `currentCompany` | `String` | No | `` | - | Schema field for `currentCompany` |
| `noticePeriod` | `String` | No | `` | - | Schema field for `noticePeriod` |
| `currentCity` | `String` | No | `` | - | Schema field for `currentCity` |
| `currentState` | `String` | No | `` | - | Schema field for `currentState` |
| `currentCountry` | `String` | No | `India` | - | Schema field for `currentCountry` |
| `preferredLocations` | `Array` | No | `` | - | Schema field for `preferredLocations` |
| `preferredRoles` | `Array` | No | `` | - | Schema field for `preferredRoles` |
| `skills` | `Array` | No | `` | - | Schema field for `skills` |
| `linkedInUrl` | `String` | No | `` | - | Schema field for `linkedInUrl` |
| `portfolioUrl` | `String` | No | `` | - | Schema field for `portfolioUrl` |
| `expectedSalary` | `String` | No | `` | - | Schema field for `expectedSalary` |
| `education` | `String` | No | `` | - | Schema field for `education` |
| `itSkills` | `String` | No | `` | - | Schema field for `itSkills` |
| `workExperiences` | `String` | No | `[]` | - | Schema field for `workExperiences` |
| `educations` | `String` | No | `[]` | - | Schema field for `educations` |
| `projects` | `String` | No | `[]` | - | Schema field for `projects` |
| `projectTitle` | `String` | No | `` | - | Schema field for `projectTitle` |
| `projectLink` | `String` | No | `` | - | Schema field for `projectLink` |
| `projectDescription` | `String` | No | `` | - | Schema field for `projectDescription` |
| `profileViews` | `Number` | No | `0` | - | Schema field for `profileViews` |
| `recruiterActions` | `Number` | No | `0` | - | Schema field for `recruiterActions` |
| `lastScannedQrToken` | `String` | No | `` | - | Schema field for `lastScannedQrToken` |
| `savedJobIds` | `Array` | No | - | - | Schema field for `savedJobIds` |
| `followedCompanyIds` | `Array` | No | - | - | Schema field for `followedCompanyIds` |
| `interestedJobIds` | `Array` | No | - | - | Schema field for `interestedJobIds` |
| `profilePic.url` | `String` | No | `` | - | Schema field for `profilePic.url` |
| `profilePic.publicId` | `String` | No | `` | - | Schema field for `profilePic.publicId` |
| `coverPic.url` | `String` | No | `` | - | Schema field for `coverPic.url` |
| `coverPic.publicId` | `String` | No | `` | - | Schema field for `coverPic.publicId` |
| `resume.fileName` | `String` | No | `` | - | Schema field for `resume.fileName` |
| `resume.url` | `String` | No | `` | - | Schema field for `resume.url` |
| `resume.publicId` | `String` | No | `` | - | Schema field for `resume.publicId` |
| `resume.storageProvider` | `String` | No | `` | - | Schema field for `resume.storageProvider` |
| `resume.sizeBytes` | `Number` | No | `0` | - | Schema field for `resume.sizeBytes` |
| `resume.mimeType` | `String` | No | `` | - | Schema field for `resume.mimeType` |
| `resume.uploadedAt` | `Date` | No | `null` | - | Schema field for `resume.uploadedAt` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"userId":1}` | Options: `{"unique":true}`
- Index: `{"publicShareId":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/ai/match-score` | `ai.controller.js` | `getMatchScore` | `CandidateProfile.findById` |
| **POST** | `/api/v1/ai/resume/enhance` | `ai.controller.js` | `enhanceResume` | `CandidateProfile.findOne` |
| **POST** | `/api/v1/ai/resume/ats-score` | `ai.controller.js` | `analyzeResumeATS` | `CandidateProfile.findOne` |
| **POST** | `/api/v1/ai/resume/analyze` | `ai.controller.js` | `analyzeResume` | `CandidateProfile.findOne` |
| **POST** | `/api/v1/ai/skills/suggest` | `ai.controller.js` | `suggestSkills` | `CandidateProfile.findOne` |
| **POST** | `/api/v1/ai/profile/analyze` | `ai.controller.js` | `analyzeProfile` | `CandidateProfile.findOne` |
| **POST** | `/api/v1/auth/google` | `auth.controller.js` | `googleLogin` | `CandidateProfile.findOne` |
| **POST** | `/api/v1/candidate/auth/google` | `auth.controller.js` | `googleLogin` | `CandidateProfile.findOne` |
| **POST** | `/api/v1/candidate/auth/register` | `candidate.controller.js` | `register` | `CandidateProfile.create` |
| **POST** | `/api/v1/candidate/jobs/:id/interest` | `candidate.controller.js` | `expressInterest` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/candidate/public/landing/:shareId` | `candidate.controller.js` | `getPublicProfileByShareId` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/candidate/exports/candidates` | `candidate.controller.js` | `exportCandidateProfiles` | `CandidateProfile.find` |
| **GET** | `/api/v1/candidate/exports/resumes` | `candidate.controller.js` | `exportCandidateResumes` | `CandidateProfile.find` |
| **GET** | `/api/v1/candidate/companies` | `candidate.controller.js` | `getCompanies` | `CandidateProfile.aggregate` |
| **GET** | `/api/v1/candidate/companies/:id` | `candidate.controller.js` | `getCompanyDetail` | `CandidateProfile.countDocuments` |
| **POST** | `/api/v1/candidate/companies/:id/reviews` | `candidate.controller.js` | `submitCompanyReview` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/candidate/ai/profile-analysis` | `candidate.controller.js` | `analyzeProfileWithAI` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/candidate/:id` | `candidate.controller.js` | `getPublicCandidateById` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/candidate/:id/resume` | `candidate.controller.js` | `getPublicCandidateResume` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/candidate/:id/resume/download` | `candidate.controller.js` | `downloadPublicCandidateResume` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/company-panel/dashboard` | `company-panel.controller.js` | `getDashboard` | `CandidateProfile.find` |
| **GET** | `/api/v1/company-panel/applications` | `company-panel.controller.js` | `getApplications` | `CandidateProfile.find` |
| **PATCH** | `/api/v1/company-panel/applications/:applicationId/status` | `company-panel.controller.js` | `updateApplicationStatus` | `CandidateProfile.find` |
| **GET** | `/api/v1/company-panel/applications/:applicationId/resume/preview` | `company-panel.controller.js` | `previewApplicationResume` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/crm-panel/dashboard` | `crm-panel.controller.js` | `getDashboard` | `CandidateProfile.find` |
| **GET** | `/api/v1/crm-panel/candidates` | `crm-panel.controller.js` | `getCandidates` | `CandidateProfile.find` |
| **GET** | `/api/v1/crm-panel/applications` | `crm-panel.controller.js` | `getApplications` | `CandidateProfile.find` |
| **GET** | `/api/v1/crm-panel/candidates/:candidateId/profile` | `crm-panel.controller.js` | `getCandidateProfile` | `CandidateProfile.findOne` |
| **PATCH** | `/api/v1/crm-panel/candidates/:candidateId` | `crm-panel.controller.js` | `updateCandidate` | `CandidateProfile.findOne` |
| **PATCH** | `/api/v1/crm-panel/applications/:id/status` | `crm-panel.controller.js` | `updateApplicationStatus` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/crm-panel/candidates/:candidateId/resume/download` | `crm-panel.controller.js` | `downloadResume` | `CandidateProfile.findOne` |
| **GET** | `/api/v1/company-panel/folders/:id` | `folder.controller.js` | `getFolder` | `CandidateProfile.find` |
| **GET** | `/api/v1/landing/companies/:id` | `landing.controller.js` | `getPublicCompanyDetail` | `CandidateProfile.countDocuments` |
| **GET** | `/api/v1/company-panel/resdex/search` | `resdex.controller.js` | `searchCandidates` | `CandidateProfile.aggregate` |
| **GET** | `/api/v1/company-panel/resdex/filters` | `resdex.controller.js` | `getFilterOptions` | `CandidateProfile.distinct` |

**Service & Background Integration:**
- Core business logic service: `ChatBotService.js`
- Core business logic service: `EliteJobMatchService.js`
- Core business logic service: `UserContextBuilder.js`
- Core business logic service: `quiz.service.js`

---

## CandidateProfileHistory

- **File Path:** [`server/src/models/CandidateProfileHistory.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/CandidateProfileHistory.js)
- **MongoDB Collection:** `candidateprofilehistories`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/candidate.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `candidateId` |
| `profileId` | `ObjectId` | **Yes** | - | **Ref:** `CandidateProfile`<br>**Indexed** | Schema field for `profileId` |
| `action` | `String` | **Yes** | - | **Enum:** `[CREATE, UPDATE, RESUME_UPLOADED]` | Schema field for `action` |
| `changedFields` | `Array` | No | `` | - | Schema field for `changedFields` |
| `changes` | `Array` | No | `` | - | Schema field for `changes` |
| `actorType` | `String` | No | `CANDIDATE` | **Enum:** `[CANDIDATE, ADMIN, CRM, SYSTEM]` | Schema field for `actorType` |
| `actorId` | `ObjectId` | No | `null` | **Ref:** `User` | Schema field for `actorId` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"candidateId":1}` | Options: `{}`
- Index: `{"profileId":1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/candidate/auth/register` | `candidate.controller.js` | `register` | `CandidateProfileHistory.create` |
| **GET** | `/api/v1/candidate/profile` | `candidate.controller.js` | `getProfile` | `CandidateProfileHistory.find` |
| **PATCH** | `/api/v1/candidate/profile` | `candidate.controller.js` | `updateProfile` | `CandidateProfileHistory.create` |
| **GET** | `/api/v1/candidate/profile/history` | `candidate.controller.js` | `getProfileHistory` | `CandidateProfileHistory.find` |
| **POST** | `/api/v1/candidate/profile/resume` | `candidate.controller.js` | `uploadResume` | `CandidateProfileHistory.create` |

---

## CandidateQuizResult

- **File Path:** [`server/src/models/CandidateQuizResult.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/CandidateQuizResult.js)
- **MongoDB Collection:** `candidatequizresults`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/candidate.controller.js`, `services/quiz.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `candidateId` |
| `quizKey` | `String` | **Yes** | - | **Indexed**<br>Trimmed | Schema field for `quizKey` |
| `score` | `Number` | **Yes** | - | - | Schema field for `score` |
| `totalQuestions` | `Number` | **Yes** | - | - | Schema field for `totalQuestions` |
| `xpEarned` | `Number` | **Yes** | - | - | Schema field for `xpEarned` |
| `answers` | `Array` | No | `` | - | Schema field for `answers` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"candidateId":1}` | Options: `{}`
- Index: `{"quizKey":1}` | Options: `{}`
- Index: `{"candidateId":1,"quizKey":1}` | Options: `{"unique":true}`
- Index: `{"xpEarned":-1,"createdAt":1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/candidate/dashboard` | `candidate.controller.js` | `getDashboard` | `CandidateQuizResult.findOne` |

**Service & Background Integration:**
- Core business logic service: `quiz.service.js`

---

## ChatBotMessage

- **File Path:** [`server/src/models/ChatBotMessage.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/ChatBotMessage.js)
- **MongoDB Collection:** `chatbotmessages`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `middleware/chatbot.middleware.js`, `services/openai/ChatBotService.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `threadId` | `ObjectId` | **Yes** | - | **Ref:** `ChatBotThread`<br>**Indexed** | Schema field for `threadId` |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `userId` |
| `senderRole` | `String` | **Yes** | - | **Enum:** `[USER, BOT, SYSTEM]`<br>**Indexed** | Schema field for `senderRole` |
| `senderId` | `ObjectId` | No | `null` | - | Schema field for `senderId` |
| `senderModel` | `String` | No | `User` | **Enum:** `[User]` | Schema field for `senderModel` |
| `type` | `String` | No | `TEXT` | **Enum:** `[TEXT]` | Schema field for `type` |
| `text` | `String` | No | `` | - | Schema field for `text` |
| `metadata` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"threadId":1}` | Options: `{}`
- Index: `{"userId":1}` | Options: `{}`
- Index: `{"senderRole":1}` | Options: `{}`
- Index: `{"threadId":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/chatbot/threads/:threadId/messages` | `chatbot.controller.js` | `getThreadMessages` | `ChatBotMessage.find (via ChatBotService.listMessages)` |
| **POST** | `/api/v1/chatbot/message` | `chatbot.controller.js` | `sendChatbotMessage` | `ChatBotMessage.create (user & assistant messages)` |
| **POST** | `/api/v1/chatbot/upload` | `chatbot.controller.js` | `uploadPdf` | `ChatBotMessage.create (extracted PDF context & prompt)` |
| **POST** | `/api/v1/chatbot/threads/:threadId/clear` | `chatbot.controller.js` | `clearHistory` | `ChatBotMessage.deleteMany (via ChatBotService.clearHistory)` |

**Service & Background Integration:**
- Core business logic service: `ChatBotService.js`

---

## ChatBotThread

- **File Path:** [`server/src/models/ChatBotThread.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/ChatBotThread.js)
- **MongoDB Collection:** `chatbotthreads`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `services/openai/ChatBotService.js`, `services/openai/EliteJobMatchService.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `userId` |
| `userRole` | `String` | No | `CLIENT` | **Enum:** `[CLIENT, CANDIDATE, COMPANY, ADMIN, CRM]`<br>**Indexed** | Schema field for `userRole` |
| `title` | `String` | No | `ChatBot` | - | Schema field for `title` |
| `userTier` | `String` | No | `FREE` | **Enum:** `[FREE, PRO, ELITE, STANDARD, PREMIUM]` | Schema field for `userTier` |
| `profileSnapshot` | `Mixed` | No | `null` | - | Schema field for `profileSnapshot` |
| `messageCount` | `Number` | No | `0` | - | Schema field for `messageCount` |
| `lastActivityAt` | `Date` | No | `function now() { [native code] }` | - | Schema field for `lastActivityAt` |
| `metadata` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"userId":1}` | Options: `{}`
- Index: `{"userRole":1}` | Options: `{}`
- Index: `{"userId":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/chatbot/threads` | `chatbot.controller.js` | `listThreads` | `ChatBotThread.find (via ChatBotService.listThreads)` |
| **GET** | `/api/v1/chatbot/threads/details` | `chatbot.controller.js` | `listThreadsWithDetails` | `ChatBotThread.find with aggregations` |
| **DELETE** | `/api/v1/chatbot/threads/:threadId` | `chatbot.controller.js` | `deleteThread` | `ChatBotThread.deleteOne (via ChatBotService.deleteThread)` |
| **POST** | `/api/v1/chatbot/threads/:threadId/clear` | `chatbot.controller.js` | `clearHistory` | `ChatBotThread.updateOne (messageCount: 0)` |
| **POST** | `/api/v1/chatbot/message` | `chatbot.controller.js` | `sendChatbotMessage` | `ChatBotThread.create (if new) / update active thread` |

**Service & Background Integration:**
- Core business logic service: `ChatBotService.js`
- Core business logic service: `EliteJobMatchService.js`

---

## ChatMessage

- **File Path:** [`server/src/models/ChatMessage.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/ChatMessage.js)
- **MongoDB Collection:** `chatmessages`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/chat.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `threadId` | `ObjectId` | **Yes** | - | **Ref:** `ChatThread`<br>**Indexed** | Schema field for `threadId` |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `candidateId` |
| `senderRole` | `String` | **Yes** | - | **Enum:** `[COMPANY, CANDIDATE, SYSTEM]`<br>**Indexed** | Schema field for `senderRole` |
| `senderId` | `ObjectId` | No | `null` | - | Schema field for `senderId` |
| `senderModel` | `String` | No | `User` | **Enum:** `[User]` | Schema field for `senderModel` |
| `type` | `String` | No | `TEXT` | **Enum:** `[TEXT, ATTACHMENT, SYSTEM, CALL]` | Schema field for `type` |
| `text` | `String` | No | `` | - | Schema field for `text` |
| `attachments` | `Array` | No | - | - | Schema field for `attachments` |
| `readAt` | `Date` | No | `null` | - | Schema field for `readAt` |
| `metadata` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"threadId":1}` | Options: `{}`
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"candidateId":1}` | Options: `{}`
- Index: `{"senderRole":1}` | Options: `{}`
- Index: `{"threadId":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/company-panel/chats/:threadId/messages` | `chat.controller.js` | `getCompanyThreadMessages` | `ChatMessage.find` |
| **GET** | `/api/v1/candidate/chats/:threadId/messages` | `chat.controller.js` | `getCandidateThreadMessages` | `ChatMessage.find` |

---

## ChatThread

- **File Path:** [`server/src/models/ChatThread.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/ChatThread.js)
- **MongoDB Collection:** `chatthreads`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/chat.controller.js`, `realtime/chat.socket.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `candidateId` |
| `candidateName` | `String` | No | `` | - | Schema field for `candidateName` |
| `candidateEmail` | `String` | No | `` | - | Schema field for `candidateEmail` |
| `candidateTitle` | `String` | No | `` | - | Schema field for `candidateTitle` |
| `applicationId` | `ObjectId` | No | `null` | **Ref:** `Application`<br>**Indexed** | Schema field for `applicationId` |
| `jobId` | `ObjectId` | No | `null` | **Ref:** `Job`<br>**Indexed** | Schema field for `jobId` |
| `companyName` | `String` | No | `` | - | Schema field for `companyName` |
| `companyLogo` | `String` | No | `` | - | Schema field for `companyLogo` |
| `jobTitle` | `String` | No | `` | - | Schema field for `jobTitle` |
| `lastMessageText` | `String` | No | `` | - | Schema field for `lastMessageText` |
| `lastMessageAt` | `Date` | No | `null` | **Indexed** | Schema field for `lastMessageAt` |
| `lastSenderRole` | `String` | No | `SYSTEM` | **Enum:** `[COMPANY, CANDIDATE, SYSTEM]` | Schema field for `lastSenderRole` |
| `companyUnreadCount` | `Number` | No | `0` | - | Schema field for `companyUnreadCount` |
| `candidateUnreadCount` | `Number` | No | `0` | - | Schema field for `candidateUnreadCount` |
| `activeCall.state` | `String` | No | `IDLE` | **Enum:** `[IDLE, RINGING, IN_CALL]` | Schema field for `activeCall.state` |
| `activeCall.mediaType` | `String` | No | `AUDIO` | **Enum:** `[AUDIO, VIDEO]` | Schema field for `activeCall.mediaType` |
| `activeCall.initiatedBy` | `String` | No | `SYSTEM` | **Enum:** `[COMPANY, CANDIDATE, SYSTEM]` | Schema field for `activeCall.initiatedBy` |
| `activeCall.startedAt` | `Date` | No | `null` | - | Schema field for `activeCall.startedAt` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"candidateId":1}` | Options: `{}`
- Index: `{"applicationId":1}` | Options: `{}`
- Index: `{"jobId":1}` | Options: `{}`
- Index: `{"lastMessageAt":1}` | Options: `{}`
- Index: `{"companyId":1,"candidateId":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/company-panel/chats/:threadId/messages` | `chat.controller.js` | `getCompanyThreadMessages` | `ChatThread.findOne` |
| **GET** | `/api/v1/candidate/chats/:threadId/messages` | `chat.controller.js` | `getCandidateThreadMessages` | `ChatThread.findOne` |
| **POST** | `/api/v1/company-panel/chats/:threadId/messages` | `chat.controller.js` | `sendCompanyMessage` | `ChatThread.findOne` |
| **POST** | `/api/v1/candidate/chats/:threadId/messages` | `chat.controller.js` | `sendCandidateMessage` | `ChatThread.findOne` |
| **PATCH** | `/api/v1/company-panel/chats/:threadId/read` | `chat.controller.js` | `markCompanyThreadRead` | `ChatThread.findOne` |
| **PATCH** | `/api/v1/candidate/chats/:threadId/read` | `chat.controller.js` | `markCandidateThreadRead` | `ChatThread.findOne` |

**Service & Background Integration:**
- WebSocket socket handler: `chat.socket.js`

---

## ClientIntake

- **File Path:** [`server/src/models/ClientIntake.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/ClientIntake.js)
- **MongoDB Collection:** `clientintakes`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/lead-generator.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `referenceId` | `String` | **Yes** | - | **Unique Index**<br>**Indexed**<br>Trimmed | Schema field for `referenceId` |
| `companyName` | `String` | **Yes** | - | Trimmed | Schema field for `companyName` |
| `email` | `String` | **Yes** | - | **Indexed**<br>Trimmed | Schema field for `email` |
| `phone` | `String` | **Yes** | - | **Indexed**<br>Trimmed | Schema field for `phone` |
| `roleTitle` | `String` | No | `` | Trimmed | Schema field for `roleTitle` |
| `roleDescription` | `String` | No | `` | Trimmed | Schema field for `roleDescription` |
| `budget` | `String` | No | `` | Trimmed | Schema field for `budget` |
| `jdAttachments` | `Array` | No | `` | - | Schema field for `jdAttachments` |
| `submissionMode` | `String` | No | `MANUAL` | **Enum:** `[MANUAL, UPLOAD_JD, BOTH]`<br>**Indexed** | Schema field for `submissionMode` |
| `qrToken` | `String` | No | `` | Trimmed | Schema field for `qrToken` |
| `sourcePath` | `String` | No | `` | Trimmed | Schema field for `sourcePath` |
| `sourceIp` | `String` | No | `` | Trimmed | Schema field for `sourceIp` |
| `sourceUserAgent` | `String` | No | `` | Trimmed | Schema field for `sourceUserAgent` |
| `status` | `String` | No | `NEW` | **Enum:** `[NEW, IN_REVIEW, CONTACTED, CLOSED]`<br>**Indexed** | Schema field for `status` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"referenceId":1}` | Options: `{"unique":true}`
- Index: `{"email":1}` | Options: `{}`
- Index: `{"phone":1}` | Options: `{}`
- Index: `{"submissionMode":1}` | Options: `{}`
- Index: `{"status":1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/lead-generator/client-intakes` | `lead-generator.controller.js` | `submitClientIntake` | `ClientIntake.create` |
| **GET** | `/api/v1/lead-generator/clients` | `lead-generator.controller.js` | `getClientIntakes` | `ClientIntake.find` |

---

## Company

- **File Path:** [`server/src/models/Company.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Company.js)
- **MongoDB Collection:** `companys`
- **Timestamps Enabled:** `false`
- **Referenced In:** `controllers/admin.controller.js`, `controllers/candidate.controller.js`, `controllers/chat.controller.js`, `controllers/company-panel.controller.js`, `controllers/company.controller.js`, `controllers/crm-panel.controller.js`, `controllers/job.controller.js`, `controllers/landing.controller.js`, `controllers/qr.controller.js`, `middleware/company-context.middleware.js`, `realtime/chat.socket.js`, `services/openai/EliteJobMatchService.js`, `services/openai/TierManager.js`, `services/openai/UserContextBuilder.js`, `services/payment.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *(Dynamic Schema)* | Mixed | - | - | - | Custom dynamic document schema |

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/dashboard` | `admin.controller.js` | `getDashboard` | `Company.countDocuments` |
| **GET** | `/api/v1/candidate/dashboard` | `candidate.controller.js` | `getDashboard` | `Company.find` |
| **PATCH** | `/api/v1/candidate/companies/:id/follow` | `candidate.controller.js` | `toggleCompanyFollow` | `Company.findById` |
| **GET** | `/api/v1/candidate/companies/filter-options` | `candidate.controller.js` | `getCompanyFilterOptions` | `Company.distinct` |
| **GET** | `/api/v1/candidate/companies/stats` | `candidate.controller.js` | `getCompanyStats` | `Company.countDocuments` |
| **GET** | `/api/v1/candidate/companies` | `candidate.controller.js` | `getCompanies` | `Company.find` |
| **GET** | `/api/v1/candidate/companies/:id` | `candidate.controller.js` | `getCompanyDetail` | `Company.findById` |
| **POST** | `/api/v1/candidate/companies/:id/reviews` | `candidate.controller.js` | `submitCompanyReview` | `Company.findById` |
| **POST** | `/api/v1/candidate/chats/:threadId/messages` | `chat.controller.js` | `sendCandidateMessage` | `Company.findById` |
| **POST** | `/api/v1/company-panel/auth/login` | `company-panel.controller.js` | `login` | `Company.findById` |
| **POST** | `/api/v1/company-panel/auth/register` | `company-panel.controller.js` | `register` | `Company.create` |
| **PATCH** | `/api/v1/company-panel/profile` | `company-panel.controller.js` | `updateProfile` | `Company.findOne` |
| **POST** | `/api/v1/company-panel/delete-account` | `company-panel.controller.js` | `deleteAccount` | `Company.findById` |
| **POST** | `/api/v1/company` | `company.controller.js` | `createCompany` | `Company.create` |
| **PUT** | `/api/v1/company/:id/package` | `company.controller.js` | `updatePackage` | `Company.findById` |
| **GET** | `/api/v1/crm-panel/dashboard` | `crm-panel.controller.js` | `getDashboard` | `Company.find` |
| **GET** | `/api/v1/crm-panel/clients` | `crm-panel.controller.js` | `getClients` | `Company.find` |
| **POST** | `/api/v1/crm-panel/clients` | `crm-panel.controller.js` | `createClient` | `Company.findOne` |
| **PUT** | `/api/v1/crm-panel/clients/:id` | `crm-panel.controller.js` | `updateClient` | `Company.findById` |
| **PATCH** | `/api/v1/crm-panel/clients/:id/credentials` | `crm-panel.controller.js` | `updateClientCredentials` | `Company.findById` |
| **POST** | `/api/v1/crm-panel/jobs` | `crm-panel.controller.js` | `createJob` | `Company.findById` |
| **PUT** | `/api/v1/crm-panel/jobs/:id` | `crm-panel.controller.js` | `updateJob` | `Company.findById` |
| **PATCH** | `/api/v1/crm-panel/job-approvals/:id` | `crm-panel.controller.js` | `updateJobApproval` | `Company.findById` |
| **GET** | `/api/v1/crm-panel/package-change-requests` | `crm-panel.controller.js` | `getPackageChangeRequests` | `Company.find` |
| **PATCH** | `/api/v1/crm-panel/package-change-requests/:id` | `crm-panel.controller.js` | `updatePackageChangeRequest` | `Company.findById` |
| **PUT** | `/api/v1/crm-panel/packages/:name` | `crm-panel.controller.js` | `upsertPackage` | `Company.find` |
| **PATCH** | `/api/v1/crm-panel/qr-codes/:id` | `crm-panel.controller.js` | `updateQRCode` | `Company.findById` |
| **POST** | `/api/v1/crm-panel/qr-codes` | `crm-panel.controller.js` | `createQRCode` | `Company.findById` |
| **POST** | `/api/v1/crm-panel/notifications` | `crm-panel.controller.js` | `createNotification` | `Company.countDocuments` |
| **GET** | `/api/v1/crm-panel/analytics` | `crm-panel.controller.js` | `getAnalytics` | `Company.find` |
| **POST** | `/api/v1/job` | `job.controller.js` | `createJob` | `Company.findById` |
| **PUT** | `/api/v1/job/approve/:id` | `job.controller.js` | `approveJob` | `Company.findById` |
| **GET** | `/api/v1/landing/companies/:id` | `landing.controller.js` | `getPublicCompanyDetail` | `Company.findById` |
| **GET** | `/api/v1/landing/employer` | `landing.controller.js` | `getEmployerLandingData` | `Company.countDocuments` |
| **GET** | `/api/v1/landing/search-suggestions` | `landing.controller.js` | `getSearchSuggestions` | `Company.distinct` |
| **GET** | `/api/v1/landing/location-suggestions` | `landing.controller.js` | `getLocationSuggestions` | `Company.distinct` |
| **POST** | `/api/v1/qr/generate` | `qr.controller.js` | `createCompanyAndGenerateQR` | `Company.create` |

**Service & Background Integration:**
- WebSocket socket handler: `chat.socket.js`
- Core business logic service: `EliteJobMatchService.js`
- Core business logic service: `TierManager.js`
- Core business logic service: `UserContextBuilder.js`
- Core business logic service: `payment.service.js`

---

## CompanyReview

- **File Path:** [`server/src/models/CompanyReview.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/CompanyReview.js)
- **MongoDB Collection:** `companyreviews`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/candidate.controller.js`, `controllers/company-panel.controller.js`, `controllers/landing.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `candidateId` |
| `candidateName` | `String` | No | `` | Trimmed | Schema field for `candidateName` |
| `candidateTitle` | `String` | No | `` | Trimmed | Schema field for `candidateTitle` |
| `candidateCity` | `String` | No | `` | Trimmed | Schema field for `candidateCity` |
| `rating` | `Number` | **Yes** | - | - | Schema field for `rating` |
| `headline` | `String` | No | `` | Trimmed | Schema field for `headline` |
| `review` | `String` | No | `` | Trimmed | Schema field for `review` |
| `isAnonymous` | `Boolean` | No | `true` | - | Schema field for `isAnonymous` |
| `status` | `String` | No | `PUBLISHED` | **Enum:** `[PUBLISHED, PENDING, HIDDEN]`<br>**Indexed** | Schema field for `status` |
| `reactions` | `Map` | No | `[object Object]` | - | Schema field for `reactions` |
| `reactions.$*` | `Number` | No | - | - | Schema field for `reactions.$*` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"candidateId":1}` | Options: `{}`
- Index: `{"status":1}` | Options: `{}`
- Index: `{"companyId":1,"status":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/candidate/companies` | `candidate.controller.js` | `getCompanies` | `CompanyReview.aggregate` |
| **GET** | `/api/v1/candidate/companies/:id` | `candidate.controller.js` | `getCompanyDetail` | `CompanyReview.find` |
| **POST** | `/api/v1/candidate/companies/:id/reviews` | `candidate.controller.js` | `submitCompanyReview` | `CompanyReview.create` |
| **GET** | `/api/v1/company-panel/dashboard` | `company-panel.controller.js` | `getDashboard` | `CompanyReview.find` |
| **POST** | `/api/v1/company-panel/reviews/react` | `company-panel.controller.js` | `toggleReviewReaction` | `CompanyReview.findById` |
| **GET** | `/api/v1/landing/jobs` | `landing.controller.js` | `getPublicJobs` | `CompanyReview.aggregate` |
| **GET** | `/api/v1/landing/companies/:id` | `landing.controller.js` | `getPublicCompanyDetail` | `CompanyReview.find` |

---

## Credit

- **File Path:** [`server/src/models/Credit.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Credit.js)
- **MongoDB Collection:** `credits`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/credit.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Unique Index**<br>**Indexed** | Schema field for `companyId` |
| `balance` | `Number` | No | `0` | - | Schema field for `balance` |
| `lifetimePurchased` | `Number` | No | `0` | - | Schema field for `lifetimePurchased` |
| `lifetimeUsed` | `Number` | No | `0` | - | Schema field for `lifetimeUsed` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/company-panel/credits/verify` | `credit.controller.js` | `verifyTopup` | `Credit.findOne` |
| **POST** | `/api/v1/company-panel/credits/use` | `credit.controller.js` | `useCredits` | `Credit.findOne` |
| **GET** | `/api/v1/company-panel/credits/check/:candidateId` | `credit.controller.js` | `checkResumeAccess` | `Credit.findOne` |
| **POST** | `/api/v1/company-panel/credits/search` | `credit.controller.js` | `searchCredits` | `Credit.findOne` |

---

## CreditTransaction

- **File Path:** [`server/src/models/CreditTransaction.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/CreditTransaction.js)
- **MongoDB Collection:** `credittransactions`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/credit.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `type` | `String` | **Yes** | - | **Enum:** `[PURCHASE, RESUME_VIEW, RESUME_DOWNLOAD, SEARCH, ADMIN_ADJUST, REFUND]` | Schema field for `type` |
| `amount` | `Number` | **Yes** | - | - | Schema field for `amount` |
| `balanceAfter` | `Number` | **Yes** | - | - | Schema field for `balanceAfter` |
| `description` | `String` | No | `` | - | Schema field for `description` |
| `referenceId` | `String` | No | `` | - | Schema field for `referenceId` |
| `metadata` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"companyId":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/company-panel/credits/history` | `credit.controller.js` | `getCreditHistory` | `CreditTransaction.find` |
| **POST** | `/api/v1/company-panel/credits/verify` | `credit.controller.js` | `verifyTopup` | `CreditTransaction.create` |
| **POST** | `/api/v1/company-panel/credits/use` | `credit.controller.js` | `useCredits` | `CreditTransaction.create` |
| **POST** | `/api/v1/company-panel/credits/search` | `credit.controller.js` | `searchCredits` | `CreditTransaction.create` |

---

## CrmCampaign

- **File Path:** [`server/src/models/CrmCampaign.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/CrmCampaign.js)
- **MongoDB Collection:** `crmcampaigns`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/crm-panel.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `title` | `String` | **Yes** | - | - | Schema field for `title` |
| `message` | `String` | **Yes** | - | - | Schema field for `message` |
| `channel` | `String` | **Yes** | - | **Enum:** `[EMAIL, APP]` | Schema field for `channel` |
| `audience` | `String` | **Yes** | - | **Enum:** `[CLIENTS, CANDIDATES]` | Schema field for `audience` |
| `companyIds` | `Array` | No | `` | **Ref:** `Company` | Schema field for `companyIds` |
| `jobIds` | `Array` | No | `` | **Ref:** `Job` | Schema field for `jobIds` |
| `status` | `String` | No | `SENT` | **Enum:** `[DRAFT, SENT]` | Schema field for `status` |
| `sentCount` | `Number` | No | `0` | - | Schema field for `sentCount` |
| `createdByCRM` | `ObjectId` | **Yes** | - | **Ref:** `CrmUser` | Schema field for `createdByCRM` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/crm-panel/dashboard` | `crm-panel.controller.js` | `getDashboard` | `CrmCampaign.find` |
| **GET** | `/api/v1/crm-panel/notifications` | `crm-panel.controller.js` | `getNotifications` | `CrmCampaign.find` |
| **POST** | `/api/v1/crm-panel/notifications` | `crm-panel.controller.js` | `createNotification` | `CrmCampaign.create` |

---

## CrmUser

- **File Path:** [`server/src/models/CrmUser.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/CrmUser.js)
- **MongoDB Collection:** `crmusers`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`, `controllers/auth.controller.js`, `controllers/crm-panel.controller.js`, `controllers/crm.controller.js`, `controllers/fse.controller.js`, `controllers/lead-generator.controller.js`, `controllers/national-sales-head.controller.js`, `controllers/state-manager.controller.js`, `controllers/zonal-manager.controller.js`, `middleware/admin.middleware.js`, `middleware/candidate.middleware.js`, `middleware/crm-panel.middleware.js`, `services/auth.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fullName` | `String` | **Yes** | - | Trimmed | Schema field for `fullName` |
| `email` | `String` | **Yes** | - | **Unique Index** | Schema field for `email` |
| `password` | `String` | **Yes** | - | - | Schema field for `password` |
| `phone` | `String` | No | - | - | Schema field for `phone` |
| `profileImageUrl` | `String` | No | `` | Trimmed | Schema field for `profileImageUrl` |
| `profileImagePublicId` | `String` | No | `` | Trimmed | Schema field for `profileImagePublicId` |
| `role` | `String` | **Yes** | - | **Enum:** `[LEAD_GENERATOR, STATE_MANAGER, ZONAL_MANAGER, FSE, APPROVER, ADMIN, NATIONAL_SALES_HEAD]` | Schema field for `role` |
| `designations` | `Array` | No | `` | **Enum:** `[LEAD_GENERATOR, STATE_MANAGER, ZONAL_MANAGER, FSE, APPROVER, ADMIN, NATIONAL_SALES_HEAD]` | Schema field for `designations` |
| `territory` | `String` | No | - | - | Schema field for `territory` |
| `state` | `String` | No | - | - | Schema field for `state` |
| `department` | `String` | No | `` | - | Schema field for `department` |
| `scope` | `String` | No | `` | - | Schema field for `scope` |
| `accessStatus` | `String` | No | `ACTIVE` | **Enum:** `[ACTIVE, PENDING_INVITE, RESTRICTED]` | Schema field for `accessStatus` |
| `isActive` | `Boolean` | No | `true` | - | Schema field for `isActive` |
| `targets.leadGeneration` | `Number` | No | `0` | - | Schema field for `targets.leadGeneration` |
| `targets.conversions` | `Number` | No | `0` | - | Schema field for `targets.conversions` |
| `targets.meetings` | `Number` | No | `0` | - | Schema field for `targets.meetings` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"email":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/admin/auth/login` | `admin.controller.js` | `login` | `CrmUser.findOne` |
| **POST** | `/api/v1/crm-panel/auth/login` | `crm-panel.controller.js` | `login` | `CrmUser.findOne` |
| **POST** | `/api/v1/crm/register` | `crm.controller.js` | `registerCrmUser` | `CrmUser.findOne` |
| **POST** | `/api/v1/fse/auth/login` | `fse.controller.js` | `login` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/fse/auth/change-password` | `fse.controller.js` | `changePassword` | `CrmUser.findById` |
| **PATCH** | `/api/v1/fse/profile/photo` | `fse.controller.js` | `uploadProfilePhoto` | `CrmUser.findById` |
| **PATCH** | `/api/v1/fse/profile` | `fse.controller.js` | `updateProfile` | `CrmUser.findById` |
| **GET** | `/api/v1/fse/transfer-candidate/:id` | `fse.controller.js` | `getTransferCandidate` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/fse/leads/:id/transfer-to-sm` | `fse.controller.js` | `transferLeadToSM` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/lead-generator/leads/:id/status` | `lead-generator.controller.js` | `updateLeadStatus` | `CrmUser.findOne` |
| **POST** | `/api/v1/lead-generator/auth/login` | `lead-generator.controller.js` | `login` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/lead-generator/auth/change-password` | `lead-generator.controller.js` | `changePassword` | `CrmUser.findById` |
| **PATCH** | `/api/v1/lead-generator/profile` | `lead-generator.controller.js` | `updateProfile` | `CrmUser.findById` |
| **PATCH** | `/api/v1/lead-generator/profile/photo` | `lead-generator.controller.js` | `uploadProfilePhoto` | `CrmUser.findById` |
| **POST** | `/api/v1/national-sales-head/auth/login` | `national-sales-head.controller.js` | `login` | `CrmUser.findOne` |
| **GET** | `/api/v1/national-sales-head/dashboard` | `national-sales-head.controller.js` | `getDashboard` | `CrmUser.countDocuments` |
| **GET** | `/api/v1/national-sales-head/zones` | `national-sales-head.controller.js` | `getZoneStats` | `CrmUser.find` |
| **GET** | `/api/v1/national-sales-head/leads` | `national-sales-head.controller.js` | `getAllLeads` | `CrmUser.find` |
| **GET** | `/api/v1/national-sales-head/performance/individual` | `national-sales-head.controller.js` | `getIndividualPerformance` | `CrmUser.find` |
| **GET** | `/api/v1/national-sales-head/approvals/pending` | `national-sales-head.controller.js` | `getPendingApprovals` | `CrmUser.find` |
| **GET** | `/api/v1/national-sales-head/zonal-managers` | `national-sales-head.controller.js` | `getZonalManagers` | `CrmUser.find` |
| **POST** | `/api/v1/national-sales-head/zonal-managers` | `national-sales-head.controller.js` | `createZonalManager` | `CrmUser.findOne` |
| **DELETE** | `/api/v1/national-sales-head/zonal-managers/:id` | `national-sales-head.controller.js` | `deleteZonalManager` | `CrmUser.findOne` |
| **GET** | `/api/v1/national-sales-head/state-managers/overview` | `national-sales-head.controller.js` | `getStateManagersOverview` | `CrmUser.find` |
| **POST** | `/api/v1/state-manager/auth/login` | `state-manager.controller.js` | `login` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/state-manager/auth/change-password` | `state-manager.controller.js` | `changePassword` | `CrmUser.findById` |
| **PATCH** | `/api/v1/state-manager/profile` | `state-manager.controller.js` | `updateProfile` | `CrmUser.findById` |
| **PATCH** | `/api/v1/state-manager/profile/photo` | `state-manager.controller.js` | `uploadProfilePhoto` | `CrmUser.findById` |
| **GET** | `/api/v1/state-manager/leads` | `state-manager.controller.js` | `getLeads` | `CrmUser.find` |
| **GET** | `/api/v1/state-manager/fses` | `state-manager.controller.js` | `getFSEs` | `CrmUser.find` |
| **POST** | `/api/v1/state-manager/team-members` | `state-manager.controller.js` | `createManagedMember` | `CrmUser.findOne` |
| **GET** | `/api/v1/state-manager/team-members` | `state-manager.controller.js` | `getManagedMembers` | `CrmUser.find` |
| **GET** | `/api/v1/state-manager/team-members/:id` | `state-manager.controller.js` | `getManagedMemberById` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/state-manager/team-members/:id` | `state-manager.controller.js` | `updateManagedMember` | `CrmUser.findOne` |
| **DELETE** | `/api/v1/state-manager/team-members/:id` | `state-manager.controller.js` | `deleteManagedMember` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/state-manager/leads/:id/assign` | `state-manager.controller.js` | `assignLead` | `CrmUser.findById` |
| **GET** | `/api/v1/state-manager/dashboard` | `state-manager.controller.js` | `getDashboard` | `CrmUser.find` |
| **PATCH** | `/api/v1/state-manager/team-members/:id/targets` | `state-manager.controller.js` | `updateMemberTargets` | `CrmUser.findOne` |
| **POST** | `/api/v1/zonal-manager/auth/login` | `zonal-manager.controller.js` | `login` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/zonal-manager/auth/change-password` | `zonal-manager.controller.js` | `changePassword` | `CrmUser.findById` |
| **PATCH** | `/api/v1/zonal-manager/profile` | `zonal-manager.controller.js` | `updateProfile` | `CrmUser.findById` |
| **PATCH** | `/api/v1/zonal-manager/profile/photo` | `zonal-manager.controller.js` | `uploadProfilePhoto` | `CrmUser.findById` |
| **GET** | `/api/v1/zonal-manager/dashboard` | `zonal-manager.controller.js` | `getDashboard` | `CrmUser.find` |
| **GET** | `/api/v1/zonal-manager/state-managers` | `zonal-manager.controller.js` | `getStateManagers` | `CrmUser.find` |
| **GET** | `/api/v1/zonal-manager/state-managers/registry` | `zonal-manager.controller.js` | `getStateManagerRegistry` | `CrmUser.find` |
| **POST** | `/api/v1/zonal-manager/state-managers` | `zonal-manager.controller.js` | `createStateManagerAccount` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/zonal-manager/state-managers/:id/review` | `zonal-manager.controller.js` | `reviewStateManagerAccount` | `CrmUser.findOne` |
| **DELETE** | `/api/v1/zonal-manager/state-managers/:id` | `zonal-manager.controller.js` | `deleteStateManagerAccount` | `CrmUser.findOne` |
| **PATCH** | `/api/v1/zonal-manager/leads/:id/assign` | `zonal-manager.controller.js` | `assignLead` | `CrmUser.findById` |

**Service & Background Integration:**
- Core business logic service: `auth.service.js`

---

## DailyQuiz

- **File Path:** [`server/src/models/DailyQuiz.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/DailyQuiz.js)
- **MongoDB Collection:** `dailyquizzes`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `services/quiz.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `userId` |
| `quizDate` | `String` | **Yes** | - | Trimmed | Schema field for `quizDate` |
| `title` | `String` | No | `Daily Skill Challenge` | - | Schema field for `title` |
| `subtitle` | `String` | No | `` | - | Schema field for `subtitle` |
| `questions` | `Array` | **Yes** | - | - | Schema field for `questions` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"userId":1,"quizDate":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/candidate/quiz/today` | `candidate.controller.js` | `getDailyQuiz` | `DailyQuiz.findOne / create (via quiz.service.js)` |
| **GET** | `/api/v1/candidate/quiz/status` | `candidate.controller.js` | `getQuizStatus` | `DailyQuiz lookup (via quiz.service.js)` |
| **POST** | `/api/v1/candidate/quiz/submit` | `candidate.controller.js` | `submitQuiz` | `DailyQuiz.findOne (verify questions & answers)` |
| **GET** | `/api/v1/candidate/quiz/leaderboard` | `candidate.controller.js` | `getQuizLeaderboard` | `DailyQuiz ranking queries (via quiz.service.js)` |

**Service & Background Integration:**
- Core business logic service: `quiz.service.js`

---

## DailyUsage

- **File Path:** [`server/src/models/DailyUsage.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/DailyUsage.js)
- **MongoDB Collection:** `dailyusages`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `services/openai/ChatBotService.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `userId` |
| `type` | `String` | **Yes** | - | **Enum:** `[JOB_RECOMMENDATION, CANDIDATE_RECOMMENDATION]` | Schema field for `type` |
| `date` | `String` | **Yes** | - | - | Schema field for `date` |
| `count` | `Number` | No | `0` | - | Schema field for `count` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"userId":1,"type":1,"date":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/chatbot/usage` | `chatbot.controller.js` | `getUsageStats` | `DailyUsage.findOne (read current day token/message usage)` |
| **POST** | `/api/v1/chatbot/message` | `chatbot.controller.js` | `sendChatbotMessage` | `DailyUsage.findOneAndUpdate (increment daily usage and enforce tier quotas)` |

**Service & Background Integration:**
- Core business logic service: `ChatBotService.js`

---

## Folder

- **File Path:** [`server/src/models/Folder.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Folder.js)
- **MongoDB Collection:** `folders`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/folder.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `employerId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `employerId` |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `name` | `String` | **Yes** | - | Trimmed | Schema field for `name` |
| `slug` | `String` | **Yes** | - | - | Schema field for `slug` |
| `description` | `String` | No | `` | Trimmed | Schema field for `description` |
| `icon` | `String` | No | `folder` | - | Schema field for `icon` |
| `color` | `String` | No | `#002366` | - | Schema field for `color` |
| `isPublic` | `Boolean` | No | `false` | - | Schema field for `isPublic` |
| `candidateCount` | `Number` | No | `0` | - | Schema field for `candidateCount` |
| `lastActivityAt` | `Date` | No | `null` | - | Schema field for `lastActivityAt` |
| `createdBy` | `String` | No | `` | - | Schema field for `createdBy` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"employerId":1}` | Options: `{}`
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"companyId":1,"name":1}` | Options: `{"unique":true}`
- Index: `{"companyId":1,"updatedAt":-1}` | Options: `{}`
- Index: `{"employerId":1,"updatedAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/company-panel/folders` | `folder.controller.js` | `listFolders` | `Folder.find` |
| **GET** | `/api/v1/company-panel/folders/:id` | `folder.controller.js` | `getFolder` | `Folder.findOne` |
| **POST** | `/api/v1/company-panel/folders` | `folder.controller.js` | `createFolder` | `Folder.findOne` |
| **PATCH** | `/api/v1/company-panel/folders/:id` | `folder.controller.js` | `updateFolder` | `Folder.findOne` |
| **POST** | `/api/v1/company-panel/folders/:id/candidates` | `folder.controller.js` | `addCandidate` | `Folder.findOne` |
| **DELETE** | `/api/v1/company-panel/folders/:id/candidates/:candidateId` | `folder.controller.js` | `removeCandidate` | `Folder.findOne` |
| **POST** | `/api/v1/company-panel/folders/:id/candidates/bulk-remove` | `folder.controller.js` | `bulkRemoveCandidates` | `Folder.findOne` |
| **POST** | `/api/v1/company-panel/folders/candidates/move` | `folder.controller.js` | `moveCandidates` | `Folder.findOne` |
| **POST** | `/api/v1/company-panel/folders/candidates/copy` | `folder.controller.js` | `copyCandidates` | `Folder.findOne` |
| **GET** | `/api/v1/company-panel/folders/duplicate/:id` | `folder.controller.js` | `duplicateFolder` | `Folder.findOne` |

---

## FolderCandidate

- **File Path:** [`server/src/models/FolderCandidate.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/FolderCandidate.js)
- **MongoDB Collection:** `foldercandidates`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/folder.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `folderId` | `ObjectId` | **Yes** | - | **Ref:** `Folder`<br>**Indexed** | Schema field for `folderId` |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `candidateId` |
| `addedBy` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `addedBy` |
| `notes` | `String` | No | `` | Trimmed | Schema field for `notes` |
| `tags` | `Array` | No | - | - | Schema field for `tags` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"folderId":1}` | Options: `{}`
- Index: `{"folderId":1,"candidateId":1}` | Options: `{"unique":true}`
- Index: `{"candidateId":1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/company-panel/folders/:id` | `folder.controller.js` | `getFolder` | `FolderCandidate.find` |
| **DELETE** | `/api/v1/company-panel/folders/:id` | `folder.controller.js` | `deleteFolder` | `FolderCandidate.deleteMany` |
| **POST** | `/api/v1/company-panel/folders/:id/candidates` | `folder.controller.js` | `addCandidate` | `FolderCandidate.findOne` |
| **DELETE** | `/api/v1/company-panel/folders/:id/candidates/:candidateId` | `folder.controller.js` | `removeCandidate` | `FolderCandidate.countDocuments` |
| **PATCH** | `/api/v1/company-panel/folders/:id/candidates/:candidateId` | `folder.controller.js` | `updateCandidate` | `FolderCandidate.findOne` |
| **POST** | `/api/v1/company-panel/folders/:id/candidates/bulk-remove` | `folder.controller.js` | `bulkRemoveCandidates` | `FolderCandidate.deleteMany` |
| **POST** | `/api/v1/company-panel/folders/candidates/move` | `folder.controller.js` | `moveCandidates` | `FolderCandidate.findOne` |
| **POST** | `/api/v1/company-panel/folders/candidates/copy` | `folder.controller.js` | `copyCandidates` | `FolderCandidate.findOne` |
| **GET** | `/api/v1/company-panel/folders/duplicate/:id` | `folder.controller.js` | `duplicateFolder` | `FolderCandidate.find` |

---

## Job

- **File Path:** [`server/src/models/Job.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Job.js)
- **MongoDB Collection:** `jobs`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`, `controllers/ai.controller.js`, `controllers/candidate.controller.js`, `controllers/company-panel.controller.js`, `controllers/crm-panel.controller.js`, `controllers/job.controller.js`, `controllers/landing.controller.js`, `controllers/qr.controller.js`, `controllers/recommendations.controller.js`, `recommendations/engine/recommendationEngine.js`, `services/openai/ChatBotService.js`, `services/openai/EliteJobMatchService.js`, `services/openai/UserContextBuilder.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `title` | `String` | **Yes** | - | - | Schema field for `title` |
| `summary` | `String` | No | `` | - | Schema field for `summary` |
| `department` | `String` | No | - | - | Schema field for `department` |
| `jobType` | `String` | No | - | - | Schema field for `jobType` |
| `workplaceType` | `String` | No | - | - | Schema field for `workplaceType` |
| `location` | `String` | No | - | - | Schema field for `location` |
| `experience` | `String` | No | - | - | Schema field for `experience` |
| `salaryMin` | `Number` | No | - | - | Schema field for `salaryMin` |
| `salaryMax` | `Number` | No | - | - | Schema field for `salaryMax` |
| `skills` | `Array` | No | - | - | Schema field for `skills` |
| `deadline` | `Date` | No | - | - | Schema field for `deadline` |
| `description` | `String` | No | - | - | Schema field for `description` |
| `approvalStatus` | `String` | No | `APPROVED` | **Enum:** `[PENDING, APPROVED, REJECTED]` | Schema field for `approvalStatus` |
| `rejectionReason` | `String` | No | `` | - | Schema field for `rejectionReason` |
| `createdBySource` | `String` | No | `CRM` | **Enum:** `[CRM, CLIENT]` | Schema field for `createdBySource` |
| `createdByCRM` | `ObjectId` | No | `null` | **Ref:** `CrmUser` | Schema field for `createdByCRM` |
| `createdByClient` | `ObjectId` | No | `null` | **Ref:** `User` | Schema field for `createdByClient` |
| `publishedByCRMAt` | `Date` | No | `null` | - | Schema field for `publishedByCRMAt` |
| `packageSlotCount` | `Number` | No | `1` | - | Schema field for `packageSlotCount` |
| `requiresPackageOverride` | `Boolean` | No | `false` | - | Schema field for `requiresPackageOverride` |
| `isActive` | `Boolean` | No | `true` | - | Schema field for `isActive` |
| `externalLink` | `String` | No | `` | - | Schema field for `externalLink` |
| `screeningQuestions` | `Array` | No | - | - | Schema field for `screeningQuestions` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"companyId":1,"isActive":1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/dashboard` | `admin.controller.js` | `getDashboard` | `Job.countDocuments` |
| **POST** | `/api/v1/ai/match-score` | `ai.controller.js` | `getMatchScore` | `Job.findById` |
| **GET** | `/api/v1/candidate/dashboard` | `candidate.controller.js` | `getDashboard` | `Job.find` |
| **GET** | `/api/v1/candidate/jobs` | `candidate.controller.js` | `getJobs` | `Job.find` |
| **GET** | `/api/v1/candidate/jobs/suggest` | `candidate.controller.js` | `getJobSuggestions` | `Job.find` |
| **GET** | `/api/v1/candidate/jobs/:id` | `candidate.controller.js` | `getJobDetail` | `Job.findById` |
| **GET** | `/api/v1/candidate/jobs/:id/similar` | `candidate.controller.js` | `getSimilarJobs` | `Job.findById` |
| **GET** | `/api/v1/candidate/jobs/:id/match-score` | `candidate.controller.js` | `getJobMatchScore` | `Job.findById` |
| **POST** | `/api/v1/candidate/applications` | `candidate.controller.js` | `createApplication` | `Job.findById` |
| **PATCH** | `/api/v1/candidate/jobs/:id/save` | `candidate.controller.js` | `toggleSavedJob` | `Job.findById` |
| **GET** | `/api/v1/candidate/jobs/saved` | `candidate.controller.js` | `getSavedJobs` | `Job.find` |
| **POST** | `/api/v1/candidate/jobs/:id/interest` | `candidate.controller.js` | `expressInterest` | `Job.findById` |
| **GET** | `/api/v1/candidate/companies/:id` | `candidate.controller.js` | `getCompanyDetail` | `Job.find` |
| **GET** | `/api/v1/company-panel/dashboard` | `company-panel.controller.js` | `getDashboard` | `Job.find` |
| **POST** | `/api/v1/company-panel/jobs` | `company-panel.controller.js` | `createJob` | `Job.countDocuments` |
| **PATCH** | `/api/v1/company-panel/jobs/:id` | `company-panel.controller.js` | `updateJob` | `Job.findOne` |
| **GET** | `/api/v1/company-panel/jobs/:id` | `company-panel.controller.js` | `getJob` | `Job.findOne` |
| **POST** | `/api/v1/company-panel/delete-account` | `company-panel.controller.js` | `deleteAccount` | `Job.updateMany` |
| **GET** | `/api/v1/company-panel/analytics` | `company-panel.controller.js` | `getAnalytics` | `Job.find` |
| **GET** | `/api/v1/crm-panel/dashboard` | `crm-panel.controller.js` | `getDashboard` | `Job.find` |
| **GET** | `/api/v1/crm-panel/jobs` | `crm-panel.controller.js` | `getJobs` | `Job.find` |
| **POST** | `/api/v1/crm-panel/jobs` | `crm-panel.controller.js` | `createJob` | `Job.countDocuments` |
| **PUT** | `/api/v1/crm-panel/jobs/:id` | `crm-panel.controller.js` | `updateJob` | `Job.findById` |
| **GET** | `/api/v1/crm-panel/job-approvals` | `crm-panel.controller.js` | `getJobApprovals` | `Job.find` |
| **PATCH** | `/api/v1/crm-panel/job-approvals/:id` | `crm-panel.controller.js` | `updateJobApproval` | `Job.findById` |
| **PATCH** | `/api/v1/crm-panel/qr-codes/:id` | `crm-panel.controller.js` | `updateQRCode` | `Job.find` |
| **POST** | `/api/v1/job` | `job.controller.js` | `createJob` | `Job.create` |
| **PUT** | `/api/v1/job/approve/:id` | `job.controller.js` | `approveJob` | `Job.findById` |
| **GET** | `/api/v1/landing/jobs` | `landing.controller.js` | `getPublicJobs` | `Job.find` |
| **GET** | `/api/v1/landing/companies/:id` | `landing.controller.js` | `getPublicCompanyDetail` | `Job.find` |
| **GET** | `/api/v1/landing/employer` | `landing.controller.js` | `getEmployerLandingData` | `Job.countDocuments` |
| **GET** | `/api/v1/landing/:token` | `landing.controller.js` | `getLandingPageData` | `Job.find` |
| **GET** | `/api/v1/landing/search-suggestions` | `landing.controller.js` | `getSearchSuggestions` | `Job.distinct` |
| **GET** | `/api/v1/landing/location-suggestions` | `landing.controller.js` | `getLocationSuggestions` | `Job.distinct` |
| **POST** | `/api/v1/qr/generate` | `qr.controller.js` | `createCompanyAndGenerateQR` | `Job.insertMany` |

**Service & Background Integration:**
- Core business logic service: `ChatBotService.js`
- Core business logic service: `EliteJobMatchService.js`
- Core business logic service: `UserContextBuilder.js`

---

## Lead

- **File Path:** [`server/src/models/Lead.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Lead.js)
- **MongoDB Collection:** `leads`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Pre-save Hooks:** Yes (automated slug generation / data normalization)
- **Static Methods:** Yes
- **Referenced In:** `controllers/fse.controller.js`, `controllers/lead-generator.controller.js`, `controllers/national-sales-head.controller.js`, `controllers/state-manager.controller.js`, `controllers/zonal-manager.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `leadCode` | `String` | No | - | **Unique Index**<br>**Indexed** | Schema field for `leadCode` |
| `contactName` | `String` | **Yes** | - | Trimmed | Schema field for `contactName` |
| `companyName` | `String` | **Yes** | - | Trimmed | Schema field for `companyName` |
| `phone` | `String` | **Yes** | - | Trimmed | Schema field for `phone` |
| `alternatePhone` | `String` | No | `` | Trimmed | Schema field for `alternatePhone` |
| `email` | `String` | No | `` | Trimmed | Schema field for `email` |
| `contacts` | `Array` | No | `` | - | Schema field for `contacts` |
| `businessCategory` | `String` | **Yes** | - | **Enum:** `[IT & Technology, Manufacturing, Retail, Healthcare, Logistics, Finance]` | Schema field for `businessCategory` |
| `leadSource` | `String` | **Yes** | - | **Enum:** `[Cold Call, Referral, Field Visit, Social Media, Inbound Inquiry]` | Schema field for `leadSource` |
| `status` | `String` | No | `NEW` | **Enum:** `[NEW, CONTACTED, QUALIFIED, FOLLOW_UP, WON, LOST, REJECTED, CONVERTED, FORWARDED, ASSIGNED]`<br>**Indexed** | Schema field for `status` |
| `priority` | `String` | No | `MEDIUM` | **Enum:** `[LOW, MEDIUM, HIGH]` | Schema field for `priority` |
| `city` | `String` | **Yes** | - | Trimmed | Schema field for `city` |
| `state` | `String` | **Yes** | - | **Indexed**<br>Trimmed | Schema field for `state` |
| `address` | `String` | No | `` | Trimmed | Schema field for `address` |
| `pincode` | `String` | No | `` | Trimmed | Schema field for `pincode` |
| `tnc` | `String` | No | `` | Trimmed | Schema field for `tnc` |
| `notes` | `String` | No | `` | Trimmed | Schema field for `notes` |
| `sourcingDate` | `Date` | No | `null` | - | Schema field for `sourcingDate` |
| `isStartup` | `Boolean` | No | `false` | - | Schema field for `isStartup` |
| `masterUnion` | `String` | No | `` | Trimmed | Schema field for `masterUnion` |
| `isOtherSource` | `Boolean` | No | `false` | - | Schema field for `isOtherSource` |
| `subStatus` | `String` | No | `` | Trimmed | Schema field for `subStatus` |
| `franchiseStatus` | `String` | No | `` | Trimmed | Schema field for `franchiseStatus` |
| `projection` | `String` | No | `` | **Enum:** `[, WP > 50, WP < 50, MP < 50, MP > 50]`<br>Trimmed | Schema field for `projection` |
| `clientType` | `String` | No | `Standard` | **Enum:** `[Standard, Premium]` | Schema field for `clientType` |
| `sourcedBy` | `String` | No | `` | Trimmed | Schema field for `sourcedBy` |
| `employeeCount` | `String` | No | `` | Trimmed | Schema field for `employeeCount` |
| `nextFollowUpAt` | `Date` | No | `null` | **Indexed** | Schema field for `nextFollowUpAt` |
| `lastContactedAt` | `Date` | No | `null` | - | Schema field for `lastContactedAt` |
| `createdBy` | `ObjectId` | **Yes** | - | **Ref:** `CrmUser`<br>**Indexed** | Schema field for `createdBy` |
| `updatedBy` | `ObjectId` | **Yes** | - | **Ref:** `CrmUser` | Schema field for `updatedBy` |
| `assignedTo` | `ObjectId` | No | `null` | **Ref:** `CrmUser`<br>**Indexed** | Schema field for `assignedTo` |
| `assignedBy` | `ObjectId` | No | `null` | **Ref:** `CrmUser` | Schema field for `assignedBy` |
| `dealValue` | `Number` | No | `0` | **Indexed** | Schema field for `dealValue` |
| `currency` | `String` | No | `INR` | Trimmed | Schema field for `currency` |
| `convertedAt` | `Date` | No | `null` | **Indexed** | Schema field for `convertedAt` |
| `requiresNationalApproval` | `Boolean` | No | `false` | **Indexed** | Schema field for `requiresNationalApproval` |
| `isStrategicDeal` | `Boolean` | No | `false` | - | Schema field for `isStrategicDeal` |
| `approvalStatus` | `String` | No | `NOT_REQUIRED` | **Enum:** `[NOT_REQUIRED, PENDING, APPROVED, REJECTED]`<br>**Indexed** | Schema field for `approvalStatus` |
| `approvalLevel` | `String` | No | `STATE_MANAGER` | **Enum:** `[STATE_MANAGER, ZONAL_MANAGER, NATIONAL_SALES_HEAD]` | Schema field for `approvalLevel` |
| `approvalRequestedBy` | `ObjectId` | No | `null` | **Ref:** `CrmUser` | Schema field for `approvalRequestedBy` |
| `approvalRequestedAt` | `Date` | No | `null` | - | Schema field for `approvalRequestedAt` |
| `approvalDecisionBy` | `ObjectId` | No | `null` | **Ref:** `CrmUser` | Schema field for `approvalDecisionBy` |
| `approvalDecisionAt` | `Date` | No | `null` | - | Schema field for `approvalDecisionAt` |
| `approvalDecisionNote` | `String` | No | `` | Trimmed | Schema field for `approvalDecisionNote` |
| `isForwardedToSM` | `Boolean` | No | `false` | - | Schema field for `isForwardedToSM` |
| `activities` | `Array` | No | - | - | Schema field for `activities` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"leadCode":1}` | Options: `{"unique":true}`
- Index: `{"status":1}` | Options: `{}`
- Index: `{"state":1}` | Options: `{}`
- Index: `{"nextFollowUpAt":1}` | Options: `{}`
- Index: `{"createdBy":1}` | Options: `{}`
- Index: `{"assignedTo":1}` | Options: `{}`
- Index: `{"dealValue":1}` | Options: `{}`
- Index: `{"convertedAt":1}` | Options: `{}`
- Index: `{"requiresNationalApproval":1}` | Options: `{}`
- Index: `{"approvalStatus":1}` | Options: `{}`
- Index: `{"leadSource":1,"createdAt":-1}` | Options: `{}`
- Index: `{"businessCategory":1,"createdAt":-1}` | Options: `{}`
- Index: `{"phone":1}` | Options: `{}`
- Index: `{"email":1}` | Options: `{}`
- Index: `{"contacts.phone":1}` | Options: `{}`
- Index: `{"contacts.email":1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/fse/leads` | `fse.controller.js` | `createLead` | `Lead.findOne` |
| **GET** | `/api/v1/fse/dashboard` | `fse.controller.js` | `getDashboard` | `Lead.countDocuments` |
| **GET** | `/api/v1/fse/leads` | `fse.controller.js` | `getLeads` | `Lead.find` |
| **PATCH** | `/api/v1/fse/leads/:id/status` | `fse.controller.js` | `updateLeadStatus` | `Lead.findById` |
| **PATCH** | `/api/v1/fse/leads/:id/projection` | `fse.controller.js` | `updateLeadProjection` | `Lead.findById` |
| **POST** | `/api/v1/fse/leads/:id/activity` | `fse.controller.js` | `logLeadActivity` | `Lead.findById` |
| **DELETE** | `/api/v1/fse/leads/:id/activity/:index` | `fse.controller.js` | `deleteLeadActivity` | `Lead.findById` |
| **PATCH** | `/api/v1/fse/leads/:id` | `fse.controller.js` | `updateLead` | `Lead.findById` |
| **GET** | `/api/v1/fse/transfer-candidate/:id` | `fse.controller.js` | `getTransferCandidate` | `Lead.findById` |
| **PATCH** | `/api/v1/fse/leads/:id/transfer-to-sm` | `fse.controller.js` | `transferLeadToSM` | `Lead.findById` |
| **GET** | `/api/v1/lead-generator/dashboard` | `lead-generator.controller.js` | `getLeadGeneratorDashboard` | `Lead.countDocuments` |
| **GET** | `/api/v1/lead-generator/leads` | `lead-generator.controller.js` | `getLeads` | `Lead.find` |
| **POST** | `/api/v1/lead-generator/leads` | `lead-generator.controller.js` | `createLead` | `Lead.findOne` |
| **PATCH** | `/api/v1/lead-generator/leads/:id/status` | `lead-generator.controller.js` | `updateLeadStatus` | `Lead.findById` |
| **POST** | `/api/v1/lead-generator/leads/:id/activity` | `lead-generator.controller.js` | `logLeadActivity` | `Lead.findById` |
| **POST** | `/api/v1/state-manager/leads/:id/activity` | `lead-generator.controller.js` | `logLeadActivity` | `Lead.findById` |
| **DELETE** | `/api/v1/lead-generator/leads/:id/activity/:index` | `lead-generator.controller.js` | `deleteLeadActivity` | `Lead.findById` |
| **DELETE** | `/api/v1/state-manager/leads/:id/activity/:index` | `lead-generator.controller.js` | `deleteLeadActivity` | `Lead.findById` |
| **POST** | `/api/v1/lead-generator/leads/:id/contacts` | `lead-generator.controller.js` | `addLeadContact` | `Lead.findById` |
| **GET** | `/api/v1/national-sales-head/dashboard` | `national-sales-head.controller.js` | `getDashboard` | `Lead.aggregate` |
| **GET** | `/api/v1/national-sales-head/leads` | `national-sales-head.controller.js` | `getAllLeads` | `Lead.find` |
| **GET** | `/api/v1/national-sales-head/performance/states` | `national-sales-head.controller.js` | `getStatePerformance` | `Lead.aggregate` |
| **GET** | `/api/v1/national-sales-head/performance/individual` | `national-sales-head.controller.js` | `getIndividualPerformance` | `Lead.aggregate` |
| **GET** | `/api/v1/national-sales-head/approvals/pending` | `national-sales-head.controller.js` | `getPendingApprovals` | `Lead.find` |
| **POST** | `/api/v1/national-sales-head/approvals/:id/decision` | `national-sales-head.controller.js` | `reviewApproval` | `Lead.findById` |
| **GET** | `/api/v1/national-sales-head/state-managers/overview` | `national-sales-head.controller.js` | `getStateManagersOverview` | `Lead.aggregate` |
| **GET** | `/api/v1/state-manager/leads` | `state-manager.controller.js` | `getLeads` | `Lead.find` |
| **GET** | `/api/v1/state-manager/fses` | `state-manager.controller.js` | `getFSEs` | `Lead.aggregate` |
| **GET** | `/api/v1/state-manager/team-members` | `state-manager.controller.js` | `getManagedMembers` | `Lead.aggregate` |
| **GET** | `/api/v1/state-manager/team-members/:id` | `state-manager.controller.js` | `getManagedMemberById` | `Lead.aggregate` |
| **DELETE** | `/api/v1/state-manager/team-members/:id` | `state-manager.controller.js` | `deleteManagedMember` | `Lead.updateMany` |
| **PATCH** | `/api/v1/state-manager/leads/:id/assign` | `state-manager.controller.js` | `assignLead` | `Lead.findById` |
| **GET** | `/api/v1/state-manager/dashboard` | `state-manager.controller.js` | `getDashboard` | `Lead.find` |
| **PATCH** | `/api/v1/state-manager/leads/:id/status` | `state-manager.controller.js` | `updateLeadStatus` | `Lead.findById` |
| **GET** | `/api/v1/zonal-manager/dashboard` | `zonal-manager.controller.js` | `getDashboard` | `Lead.find` |
| **GET** | `/api/v1/zonal-manager/leads` | `zonal-manager.controller.js` | `getLeads` | `Lead.find` |
| **GET** | `/api/v1/zonal-manager/state-managers` | `zonal-manager.controller.js` | `getStateManagers` | `Lead.aggregate` |
| **GET** | `/api/v1/zonal-manager/state-managers/registry` | `zonal-manager.controller.js` | `getStateManagerRegistry` | `Lead.aggregate` |
| **DELETE** | `/api/v1/zonal-manager/state-managers/:id` | `zonal-manager.controller.js` | `deleteStateManagerAccount` | `Lead.countDocuments` |
| **PATCH** | `/api/v1/zonal-manager/leads/:id/assign` | `zonal-manager.controller.js` | `assignLead` | `Lead.findById` |
| **PATCH** | `/api/v1/zonal-manager/leads/:id/status` | `zonal-manager.controller.js` | `updateLeadStatus` | `Lead.findById` |
| **POST** | `/api/v1/zonal-manager/leads/:id/activity` | `zonal-manager.controller.js` | `logLeadActivity` | `Lead.findById` |
| **DELETE** | `/api/v1/zonal-manager/leads/:id/activity/:index` | `zonal-manager.controller.js` | `deleteLeadActivity` | `Lead.findById` |

---

## NationalSalesPolicy

- **File Path:** [`server/src/models/NationalSalesPolicy.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/NationalSalesPolicy.js)
- **MongoDB Collection:** `nationalsalespolicies`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/national-sales-head.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `key` | `String` | **Yes** | `default` | **Unique Index**<br>Trimmed | Schema field for `key` |
| `highValueDealThreshold` | `Number` | No | `500000` | - | Schema field for `highValueDealThreshold` |
| `strategicDealThreshold` | `Number` | No | `1000000` | - | Schema field for `strategicDealThreshold` |
| `currency` | `String` | No | `INR` | Trimmed | Schema field for `currency` |
| `autoApproveBelowThreshold` | `Boolean` | No | `false` | - | Schema field for `autoApproveBelowThreshold` |
| `notes` | `String` | No | `` | Trimmed | Schema field for `notes` |
| `updatedBy` | `ObjectId` | No | `null` | **Ref:** `CrmUser` | Schema field for `updatedBy` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"key":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/national-sales-head/approval-policy` | `national-sales-head.controller.js` | `getApprovalPolicy` | `NationalSalesPolicy.findById` |

---

## NonVisitDay

- **File Path:** [`server/src/models/NonVisitDay.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/NonVisitDay.js)
- **MongoDB Collection:** `nonvisitdays`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/fse.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fse` | `ObjectId` | **Yes** | - | **Ref:** `CrmUser`<br>**Indexed** | Schema field for `fse` |
| `date` | `Date` | **Yes** | - | - | Schema field for `date` |
| `type` | `String` | No | `FULL_DAY` | **Enum:** `[FULL_DAY, HALF_DAY]` | Schema field for `type` |
| `remarks` | `String` | **Yes** | - | Trimmed | Schema field for `remarks` |
| `status` | `String` | No | `PENDING` | **Enum:** `[PENDING, APPROVED, REJECTED]` | Schema field for `status` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"fse":1}` | Options: `{}`
- Index: `{"fse":1,"date":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/fse/non-visit-days` | `fse.controller.js` | `getNonVisitDays` | `NonVisitDay.find` |
| **POST** | `/api/v1/fse/non-visit-days` | `fse.controller.js` | `addNonVisitDay` | `NonVisitDay.findOne` |
| **DELETE** | `/api/v1/fse/non-visit-days/:id` | `fse.controller.js` | `deleteNonVisitDay` | `NonVisitDay.findById` |

---

## NotificationPreferences

- **File Path:** [`server/src/models/NotificationPreferences.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/NotificationPreferences.js)
- **MongoDB Collection:** `notificationpreferences`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/notificationPreferences.controller.js`, `controllers/recommendations.controller.js`, `recommendations/scheduler/recommendationScheduler.js`, `recommendations/subscribers/recommendationSubscriber.js`, `subscribers/subscriberUtils.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `userId` |
| `role` | `String` | **Yes** | - | **Enum:** `[CANDIDATE, RECRUITER, ADMIN, CRM, FSE, CLIENT]` | Schema field for `role` |
| `applicationUpdates` | `Boolean` | No | `true` | - | Schema field for `applicationUpdates` |
| `marketingEmails` | `Boolean` | No | `true` | - | Schema field for `marketingEmails` |
| `jobRecommendations` | `Boolean` | No | `true` | - | Schema field for `jobRecommendations` |
| `jobRecommendationsEnabled` | `Boolean` | No | `true` | - | Schema field for `jobRecommendationsEnabled` |
| `recommendationFrequency` | `String` | No | `daily` | **Enum:** `[daily, twice_daily, weekly, disabled]` | Schema field for `recommendationFrequency` |
| `blogUpdates` | `Boolean` | No | `true` | - | Schema field for `blogUpdates` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"userId":1}` | Options: `{}`
- Index: `{"userId":1,"role":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/notifications/preferences` | `notificationPreferences.controller.js` | `getPreferences` | `NotificationPreferences.findOne / create default` |
| **PUT** | `/api/v1/notifications/preferences` | `notificationPreferences.controller.js` | `updatePreferences` | `NotificationPreferences.findOneAndUpdate (upsert)` |
| **GET** | `/api/v1/recommendations/preferences` | `recommendations.controller.js` | `getRecommendationPreferences` | `NotificationPreferences.findOne` |
| **PUT** | `/api/v1/recommendations/preferences` | `recommendations.controller.js` | `updateRecommendationPreferences` | `NotificationPreferences.findOneAndUpdate` |

**Service & Background Integration:**
- Event subscriber: `subscriberUtils.js`

---

## Nvite

- **File Path:** [`server/src/models/Nvite.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Nvite.js)
- **MongoDB Collection:** `nvites`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/candidate.controller.js`, `controllers/nvite.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `recruiterId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `recruiterId` |
| `recipients` | `Array` | No | - | - | Schema field for `recipients` |
| `subject` | `String` | **Yes** | - | - | Schema field for `subject` |
| `body` | `String` | **Yes** | - | - | Schema field for `body` |
| `templateId` | `String` | No | `null` | - | Schema field for `templateId` |
| `totalCount` | `Number` | No | `0` | - | Schema field for `totalCount` |
| `unknownCount` | `Number` | No | `0` | - | Schema field for `unknownCount` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"recruiterId":1}` | Options: `{}`
- Index: `{"companyId":1,"createdAt":-1}` | Options: `{}`
- Index: `{"recipients.email":1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/candidate/dashboard` | `candidate.controller.js` | `getDashboard` | `Nvite.find` |
| **GET** | `/api/v1/candidate/nvites` | `candidate.controller.js` | `getNvites` | `Nvite.find` |
| **POST** | `/api/v1/company-panel/resdex/nvite/send` | `nvite.controller.js` | `sendNvite` | `Nvite.create` |
| **GET** | `/api/v1/company-panel/resdex/nvite/list` | `nvite.controller.js` | `listNvites` | `Nvite.find` |
| **GET** | `/api/v1/company-panel/resdex/nvite/stats` | `nvite.controller.js` | `getNviteStats` | `Nvite.countDocuments` |

---

## Package

- **File Path:** [`server/src/models/Package.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Package.js)
- **MongoDB Collection:** `packages`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/crm-panel.controller.js`, `services/package-limit.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | No | - | **Enum:** `[STANDARD, PREMIUM, ELITE]`<br>**Unique Index** | Schema field for `name` |
| `jobLimit` | `Number` | **Yes** | - | - | Schema field for `jobLimit` |
| `description` | `String` | No | `` | - | Schema field for `description` |
| `isDefaultPackage` | `Boolean` | No | `true` | - | Schema field for `isDefaultPackage` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"name":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/crm-panel/clients` | `crm-panel.controller.js` | `createClient` | `Package.findOne` |
| **PUT** | `/api/v1/crm-panel/clients/:id` | `crm-panel.controller.js` | `updateClient` | `Package.findOne` |
| **GET** | `/api/v1/crm-panel/packages` | `crm-panel.controller.js` | `getPackages` | `Package.find` |
| **PUT** | `/api/v1/crm-panel/packages/:name` | `crm-panel.controller.js` | `upsertPackage` | `Package.findOne` |
| **GET** | `/api/v1/crm-panel/analytics` | `crm-panel.controller.js` | `getAnalytics` | `Package.find` |
| **GET** | `/api/v1/crm-panel/settings` | `crm-panel.controller.js` | `getSettings` | `Package.find` |

**Service & Background Integration:**
- Core business logic service: `package-limit.service.js`

---

## PackageChangeRequest

- **File Path:** [`server/src/models/PackageChangeRequest.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/PackageChangeRequest.js)
- **MongoDB Collection:** `packagechangerequests`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/company-panel.controller.js`, `controllers/crm-panel.controller.js`, `services/package-change-request.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `requestedBy` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `requestedBy` |
| `currentPackageType` | `String` | **Yes** | - | **Enum:** `[STANDARD, PREMIUM, ELITE]` | Schema field for `currentPackageType` |
| `requestedPackageType` | `String` | **Yes** | - | **Enum:** `[STANDARD, PREMIUM, ELITE]` | Schema field for `requestedPackageType` |
| `currentJobLimit` | `Number` | **Yes** | - | - | Schema field for `currentJobLimit` |
| `requestedJobLimit` | `Number` | **Yes** | - | - | Schema field for `requestedJobLimit` |
| `reason` | `String` | No | `` | Trimmed | Schema field for `reason` |
| `status` | `String` | No | `PENDING` | **Enum:** `[PENDING, APPROVED, REJECTED, CANCELLED]`<br>**Indexed** | Schema field for `status` |
| `isUpgrade` | `Boolean` | **Yes** | `false` | - | Schema field for `isUpgrade` |
| `decisionNote` | `String` | No | `` | Trimmed | Schema field for `decisionNote` |
| `reviewedBy` | `ObjectId` | No | `null` | **Ref:** `CrmUser` | Schema field for `reviewedBy` |
| `reviewedAt` | `Date` | No | `null` | - | Schema field for `reviewedAt` |
| `effectiveAt` | `Date` | **Yes** | - | **Indexed** | Schema field for `effectiveAt` |
| `appliedAt` | `Date` | No | `null` | **Indexed** | Schema field for `appliedAt` |
| `metadata` | `Mixed` | No | `null` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"status":1}` | Options: `{}`
- Index: `{"effectiveAt":1}` | Options: `{}`
- Index: `{"appliedAt":1}` | Options: `{}`
- Index: `{"companyId":1,"status":1}` | Options: `{"unique":true,"partialFilterExpression":{"status":"PENDING"}}`
- Index: `{"companyId":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/company-panel/dashboard` | `company-panel.controller.js` | `getDashboard` | `PackageChangeRequest.findOne` |
| **GET** | `/api/v1/company-panel/package-change-requests` | `company-panel.controller.js` | `getPackageChangeRequests` | `PackageChangeRequest.find` |
| **POST** | `/api/v1/company-panel/package-change-requests` | `company-panel.controller.js` | `createPackageChangeRequest` | `PackageChangeRequest.findOne` |
| **GET** | `/api/v1/crm-panel/dashboard` | `crm-panel.controller.js` | `getDashboard` | `PackageChangeRequest.countDocuments` |
| **GET** | `/api/v1/crm-panel/package-change-requests` | `crm-panel.controller.js` | `getPackageChangeRequests` | `PackageChangeRequest.find` |
| **PATCH** | `/api/v1/crm-panel/package-change-requests/:id` | `crm-panel.controller.js` | `updatePackageChangeRequest` | `PackageChangeRequest.findById` |

**Service & Background Integration:**
- Core business logic service: `package-change-request.service.js`

---

## PaidResume

- **File Path:** [`server/src/models/PaidResume.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/PaidResume.js)
- **MongoDB Collection:** `paidresumes`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/credit.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `candidateId` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `candidateId` |
| `firstViewedAt` | `Date` | No | `function now() { [native code] }` | - | Schema field for `firstViewedAt` |
| `lastViewedAt` | `Date` | No | `function now() { [native code] }` | - | Schema field for `lastViewedAt` |
| `viewCount` | `Number` | No | `1` | - | Schema field for `viewCount` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"companyId":1,"candidateId":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/company-panel/credits/use` | `credit.controller.js` | `useCredits` | `PaidResume.findOne` |
| **GET** | `/api/v1/company-panel/credits/check/:candidateId` | `credit.controller.js` | `checkResumeAccess` | `PaidResume.findOne` |

---

## PasswordResetOTP

- **File Path:** [`server/src/models/PasswordResetOTP.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/PasswordResetOTP.js)
- **MongoDB Collection:** `passwordresetotps`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `services/passwordReset.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `userId` |
| `email` | `String` | **Yes** | - | **Indexed**<br>Trimmed | Schema field for `email` |
| `entityType` | `String` | **Yes** | `candidate` | **Enum:** `[candidate, employer]`<br>**Indexed** | Schema field for `entityType` |
| `otpHash` | `String` | **Yes** | - | - | Schema field for `otpHash` |
| `purpose` | `String` | **Yes** | `password_reset` | **Enum:** `[password_reset]` | Schema field for `purpose` |
| `expiresAt` | `Date` | **Yes** | - | **Indexed** | Schema field for `expiresAt` |
| `verified` | `Boolean` | No | `false` | - | Schema field for `verified` |
| `used` | `Boolean` | No | `false` | - | Schema field for `used` |
| `attempts` | `Number` | No | `0` | - | Schema field for `attempts` |
| `maxAttempts` | `Number` | No | `5` | - | Schema field for `maxAttempts` |
| `ipAddress` | `String` | No | `` | - | Schema field for `ipAddress` |
| `userAgent` | `String` | No | `` | - | Schema field for `userAgent` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"userId":1}` | Options: `{}`
- Index: `{"email":1}` | Options: `{}`
- Index: `{"entityType":1}` | Options: `{}`
- Index: `{"expiresAt":1}` | Options: `{"expireAfterSeconds":0}`
- Index: `{"userId":1,"purpose":1,"entityType":1}` | Options: `{}`
- Index: `{"email":1,"purpose":1,"entityType":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/forgot-password` | `passwordReset.controller.js` | `forgotPassword` | `PasswordResetOTP.create (SHA-256 hash)` |
| **POST** | `/api/v1/auth/verify-reset-otp` | `passwordReset.controller.js` | `verifyResetOTP` | `PasswordResetOTP.findOne & verify attempts` |
| **POST** | `/api/v1/auth/reset-password` | `passwordReset.controller.js` | `resetPassword` | `PasswordResetOTP.updateOne (used: true)` |
| **POST** | `/api/v1/company-panel/auth/employer/forgot-password` | `passwordReset.controller.js` | `employerForgotPassword` | `PasswordResetOTP.create (entityType: 'employer')` |
| **POST** | `/api/v1/company-panel/auth/employer/verify-reset-otp` | `passwordReset.controller.js` | `employerVerifyResetOTP` | `PasswordResetOTP.findOne & verify` |
| **POST** | `/api/v1/company-panel/auth/employer/reset-password` | `passwordReset.controller.js` | `employerResetPassword` | `PasswordResetOTP.updateOne (used: true)` |

**Service & Background Integration:**
- Core business logic service: `passwordReset.service.js`

> [!IMPORTANT]  
> **Security Mechanism:** OTPs are stored as SHA-256 hashes with automatic TTL expiry via MongoDB's `expireAfterSeconds: 0` index on `expiresAt`. Throttled to 5 attempts per OTP.

---

## PaymentTransaction

- **File Path:** [`server/src/models/PaymentTransaction.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/PaymentTransaction.js)
- **MongoDB Collection:** `paymenttransactions`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`, `services/payment.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User` | Schema field for `userId` |
| `role` | `String` | **Yes** | - | **Enum:** `[CANDIDATE, CLIENT]` | Schema field for `role` |
| `companyId` | `ObjectId` | No | `null` | **Ref:** `Company` | Schema field for `companyId` |
| `razorpayOrderId` | `String` | No | `null` | - | Schema field for `razorpayOrderId` |
| `razorpayPaymentId` | `String` | No | `null` | - | Schema field for `razorpayPaymentId` |
| `razorpaySignature` | `String` | No | `null` | - | Schema field for `razorpaySignature` |
| `amount` | `Number` | **Yes** | - | - | Schema field for `amount` |
| `currency` | `String` | No | `INR` | - | Schema field for `currency` |
| `planType` | `String` | **Yes** | - | **Enum:** `[PRO, ELITE, ELITE_QUARTERLY, PREMIUM]` | Schema field for `planType` |
| `durationDays` | `Number` | No | `30` | - | Schema field for `durationDays` |
| `status` | `String` | No | `CREATED` | **Enum:** `[CREATED, PAID, FAILED, REFUNDED, EXPIRED]` | Schema field for `status` |
| `metadata` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"razorpayOrderId":1}` | Options: `{}`
- Index: `{"userId":1,"status":1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/payments` | `admin.controller.js` | `getPayments` | `PaymentTransaction.find` |
| **GET** | `/api/v1/crm-panel/payments` | `admin.controller.js` | `getPayments` | `PaymentTransaction.find` |

**Service & Background Integration:**
- Core business logic service: `payment.service.js`

---

## QRCode

- **File Path:** [`server/src/models/QRCode.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/QRCode.js)
- **MongoDB Collection:** `qrcodes`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/candidate.controller.js`, `controllers/crm-panel.controller.js`, `controllers/landing.controller.js`, `controllers/qr.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `jobId` | `ObjectId` | No | `null` | **Ref:** `Job`<br>**Indexed** | Schema field for `jobId` |
| `token` | `String` | **Yes** | - | **Unique Index**<br>**Indexed** | Schema field for `token` |
| `qrImageUrl` | `String` | No | - | - | Schema field for `qrImageUrl` |
| `pdfUrl` | `String` | No | - | - | Schema field for `pdfUrl` |
| `pdfPublicId` | `String` | No | - | - | Schema field for `pdfPublicId` |
| `scans` | `Number` | No | `0` | - | Schema field for `scans` |
| `isActive` | `Boolean` | No | `true` | **Indexed** | Schema field for `isActive` |
| `createdByCRM` | `ObjectId` | **Yes** | - | **Ref:** `CrmUser`<br>**Indexed** | Schema field for `createdByCRM` |
| `expiresAt` | `Date` | No | `null` | - | Schema field for `expiresAt` |
| `shareChannel` | `String` | No | `` | **Enum:** `[EMAIL, APP, MANUAL, ]` | Schema field for `shareChannel` |
| `sharedWithEmail` | `String` | No | `` | - | Schema field for `sharedWithEmail` |
| `lastSharedAt` | `Date` | No | `null` | - | Schema field for `lastSharedAt` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"jobId":1}` | Options: `{}`
- Index: `{"token":1}` | Options: `{"unique":true}`
- Index: `{"isActive":1}` | Options: `{}`
- Index: `{"createdByCRM":1}` | Options: `{}`
- Index: `{"expiresAt":1}` | Options: `{"expireAfterSeconds":0}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/crm-panel/dashboard` | `crm-panel.controller.js` | `getDashboard` | `QRCode.find` |
| **GET** | `/api/v1/crm-panel/qr-codes` | `crm-panel.controller.js` | `getQRCodes` | `QRCode.find` |
| **PATCH** | `/api/v1/crm-panel/qr-codes/:id` | `crm-panel.controller.js` | `updateQRCode` | `QRCode.findById` |
| **GET** | `/api/v1/landing/:token` | `landing.controller.js` | `getLandingPageData` | `QRCode.findOne` |
| **POST** | `/api/v1/qr/generate` | `qr.controller.js` | `createCompanyAndGenerateQR` | `QRCode.create` |
| **GET** | `/api/v1/qr/download/:token` | `qr.controller.js` | `downloadQRPDF` | `QRCode.findOne` |

---

## RecruiterActivity

- **File Path:** [`server/src/models/RecruiterActivity.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/RecruiterActivity.js)
- **MongoDB Collection:** `recruiteractivities`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/company-panel.controller.js`, `services/recruiter-activity.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `recruiterId` | `ObjectId` | No | `null` | **Ref:** `User` | Schema field for `recruiterId` |
| `recruiterName` | `String` | No | `Recruiter` | - | Schema field for `recruiterName` |
| `action` | `String` | **Yes** | - | **Enum:** `[SEARCH, NVITE_SENT, RESUME_VIEW, RESUME_DOWNLOAD, FOLDER_CREATED, CANDIDATE_ADDED, JOB_POSTED, CANDIDATE_APPLIED]`<br>**Indexed** | Schema field for `action` |
| `text` | `String` | **Yes** | - | - | Schema field for `text` |
| `metadata` | `Mixed` | No | `[Default Function/Object]` | - | Schema field for `metadata` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"action":1}` | Options: `{}`
- Index: `{"companyId":1,"createdAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/company-panel/activity` | `company-panel.controller.js` | `getRecentActivity` | `RecruiterActivity.find` |

**Service & Background Integration:**
- Core business logic service: `recruiter-activity.service.js`

---

## RefreshToken

- **File Path:** [`server/src/models/RefreshToken.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/RefreshToken.js)
- **MongoDB Collection:** `refreshtokens`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `services/auth.service.js`, `services/passwordReset.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tokenId` | `String` | **Yes** | - | **Unique Index**<br>**Indexed** | Schema field for `tokenId` |
| `tokenHash` | `String` | **Yes** | - | **Indexed** | Schema field for `tokenHash` |
| `userId` | `ObjectId` | **Yes** | - | **Indexed** | Schema field for `userId` |
| `userModel` | `String` | **Yes** | - | **Enum:** `[User, CrmUser]` | Schema field for `userModel` |
| `userRole` | `String` | **Yes** | - | **Indexed** | Schema field for `userRole` |
| `sessionId` | `String` | **Yes** | - | **Indexed** | Schema field for `sessionId` |
| `refreshTokenFamily` | `String` | **Yes** | - | **Indexed** | Schema field for `refreshTokenFamily` |
| `deviceId` | `String` | No | `` | **Indexed** | Schema field for `deviceId` |
| `ipAddress` | `String` | No | `` | - | Schema field for `ipAddress` |
| `userAgent` | `String` | No | `` | - | Schema field for `userAgent` |
| `expiresAt` | `Date` | **Yes** | - | - | Schema field for `expiresAt` |
| `revokedAt` | `Date` | No | `null` | - | Schema field for `revokedAt` |
| `revokedReason` | `String` | No | `` | - | Schema field for `revokedReason` |
| `replacedByTokenId` | `String` | No | `` | - | Schema field for `replacedByTokenId` |
| `lastUsedAt` | `Date` | No | `null` | - | Schema field for `lastUsedAt` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"tokenId":1}` | Options: `{"unique":true}`
- Index: `{"tokenHash":1}` | Options: `{}`
- Index: `{"userId":1}` | Options: `{}`
- Index: `{"userRole":1}` | Options: `{}`
- Index: `{"sessionId":1}` | Options: `{}`
- Index: `{"refreshTokenFamily":1}` | Options: `{}`
- Index: `{"deviceId":1}` | Options: `{}`
- Index: `{"userId":1,"userModel":1,"sessionId":1}` | Options: `{}`
- Index: `{"refreshTokenFamily":1,"revokedAt":1}` | Options: `{}`
- Index: `{"expiresAt":1}` | Options: `{"expireAfterSeconds":0}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | `auth.controller.js` | `login` | `RefreshToken.create (issue initial refresh token in family)` |
| **POST** | `/api/v1/auth/google` | `auth.controller.js` | `googleLogin` | `RefreshToken.create` |
| **POST** | `/api/v1/auth/refresh` | `auth.controller.js` | `refresh` | `RefreshToken.findOne, verify hash, rotate token & revoke old` |
| **POST** | `/api/v1/auth/logout` | `auth.controller.js` | `logout` | `RefreshToken.updateMany (mark revoked for family)` |
| **POST** | `/api/v1/auth/revoke` | `auth.controller.js` | `revoke` | `RefreshToken.updateMany (revoke all user tokens)` |
| **POST** | `/api/v1/company-panel/auth/login` | `company-panel.controller.js` | `login` | `RefreshToken.create (userModel: 'User')` |
| **POST** | `/api/v1/crm-panel/auth/login` | `crm-panel.controller.js` | `login` | `RefreshToken.create (userModel: 'CrmUser')` |
| **POST** | `/api/v1/fse/auth/login` | `fse.controller.js` | `login` | `RefreshToken.create (userModel: 'CrmUser')` |
| **POST** | `/api/v1/lead-generator/auth/login` | `lead-generator.controller.js` | `login` | `RefreshToken.create (userModel: 'CrmUser')` |
| **POST** | `/api/v1/state-manager/auth/login` | `state-manager.controller.js` | `login` | `RefreshToken.create (userModel: 'CrmUser')` |
| **POST** | `/api/v1/zonal-manager/auth/login` | `zonal-manager.controller.js` | `login` | `RefreshToken.create (userModel: 'CrmUser')` |
| **POST** | `/api/v1/national-sales-head/auth/login` | `national-sales-head.controller.js` | `login` | `RefreshToken.create (userModel: 'CrmUser')` |
| **POST** | `/api/v1/admin/auth/login` | `admin.controller.js` | `login` | `RefreshToken.create (userModel: 'CrmUser')` |
| **POST** | `/api/v1/auth/reset-password` | `passwordReset.controller.js` | `resetPassword` | `RefreshToken.updateMany (revoke all tokens on password reset)` |

**Service & Background Integration:**
- Core business logic service: `auth.service.js`
- Core business logic service: `passwordReset.service.js`

> [!NOTE]  
> **Dual-Actor Token Mechanism:** Both `RefreshToken` and `Session` use a polymorphic reference (`refPath: "userModel"` where `userModel` is either `"User"` or `"CrmUser"`), allowing seamless authentication across public users and internal staff.

---

## ResdexSearch

- **File Path:** [`server/src/models/ResdexSearch.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/ResdexSearch.js)
- **MongoDB Collection:** `resdexsearches`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/resdex.controller.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companyId` | `ObjectId` | **Yes** | - | **Ref:** `Company`<br>**Indexed** | Schema field for `companyId` |
| `userId` | `ObjectId` | **Yes** | - | **Ref:** `User`<br>**Indexed** | Schema field for `userId` |
| `name` | `String` | No | `` | - | Schema field for `name` |
| `isPinned` | `Boolean` | No | `false` | - | Schema field for `isPinned` |
| `isScheduled` | `Boolean` | No | `false` | - | Schema field for `isScheduled` |
| `scheduleCron` | `String` | No | `` | - | Schema field for `scheduleCron` |
| `filters.keyword` | `String` | No | `` | - | Schema field for `filters.keyword` |
| `filters.skills` | `Array` | No | - | - | Schema field for `filters.skills` |
| `filters.booleanQuery` | `String` | No | `` | - | Schema field for `filters.booleanQuery` |
| `filters.currentCompany` | `String` | No | `` | - | Schema field for `filters.currentCompany` |
| `filters.previousCompany` | `String` | No | `` | - | Schema field for `filters.previousCompany` |
| `filters.designation` | `String` | No | `` | - | Schema field for `filters.designation` |
| `filters.excludeKeywords` | `String` | No | `` | - | Schema field for `filters.excludeKeywords` |
| `filters.preferredSkills` | `Array` | No | - | - | Schema field for `filters.preferredSkills` |
| `filters.minExperience` | `Number` | No | `0` | - | Schema field for `filters.minExperience` |
| `filters.maxExperience` | `Number` | No | `30` | - | Schema field for `filters.maxExperience` |
| `filters.currentCity` | `Array` | No | - | - | Schema field for `filters.currentCity` |
| `filters.preferredCity` | `Array` | No | - | - | Schema field for `filters.preferredCity` |
| `filters.remote` | `Boolean` | No | `false` | - | Schema field for `filters.remote` |
| `filters.hybrid` | `Boolean` | No | `false` | - | Schema field for `filters.hybrid` |
| `filters.relocation` | `Boolean` | No | `false` | - | Schema field for `filters.relocation` |
| `filters.currency` | `String` | No | `INR` | - | Schema field for `filters.currency` |
| `filters.currentSalaryMin` | `Number` | No | `0` | - | Schema field for `filters.currentSalaryMin` |
| `filters.currentSalaryMax` | `Number` | No | `0` | - | Schema field for `filters.currentSalaryMax` |
| `filters.expectedSalaryMin` | `Number` | No | `0` | - | Schema field for `filters.expectedSalaryMin` |
| `filters.expectedSalaryMax` | `Number` | No | `0` | - | Schema field for `filters.expectedSalaryMax` |
| `filters.noticePeriod` | `Array` | No | - | - | Schema field for `filters.noticePeriod` |
| `filters.department` | `String` | No | `` | - | Schema field for `filters.department` |
| `filters.role` | `String` | No | `` | - | Schema field for `filters.role` |
| `filters.industry` | `String` | No | `` | - | Schema field for `filters.industry` |
| `filters.employmentType` | `String` | No | `` | - | Schema field for `filters.employmentType` |
| `filters.employmentStatus` | `String` | No | `` | - | Schema field for `filters.employmentStatus` |
| `filters.ug` | `String` | No | `` | - | Schema field for `filters.ug` |
| `filters.pg` | `String` | No | `` | - | Schema field for `filters.pg` |
| `filters.doctorate` | `String` | No | `` | - | Schema field for `filters.doctorate` |
| `filters.institute` | `String` | No | `` | - | Schema field for `filters.institute` |
| `filters.university` | `String` | No | `` | - | Schema field for `filters.university` |
| `filters.graduationYear` | `String` | No | `` | - | Schema field for `filters.graduationYear` |
| `filters.minPercentage` | `Number` | No | `0` | - | Schema field for `filters.minPercentage` |
| `filters.certifications` | `Array` | No | - | - | Schema field for `filters.certifications` |
| `filters.diversityGender` | `Array` | No | - | - | Schema field for `filters.diversityGender` |
| `filters.careerBreak` | `Boolean` | No | `false` | - | Schema field for `filters.careerBreak` |
| `filters.veterans` | `Boolean` | No | `false` | - | Schema field for `filters.veterans` |
| `filters.disabilities` | `Boolean` | No | `false` | - | Schema field for `filters.disabilities` |
| `filters.returnship` | `Boolean` | No | `false` | - | Schema field for `filters.returnship` |
| `filters.womenHiring` | `Boolean` | No | `false` | - | Schema field for `filters.womenHiring` |
| `filters.campusHiring` | `Boolean` | No | `false` | - | Schema field for `filters.campusHiring` |
| `filters.freshers` | `Boolean` | No | `false` | - | Schema field for `filters.freshers` |
| `filters.minAge` | `Number` | No | `0` | - | Schema field for `filters.minAge` |
| `filters.maxAge` | `Number` | No | `0` | - | Schema field for `filters.maxAge` |
| `filters.languages` | `Array` | No | - | - | Schema field for `filters.languages` |
| `filters.workPermit` | `Array` | No | - | - | Schema field for `filters.workPermit` |
| `filters.passport` | `Boolean` | No | `false` | - | Schema field for `filters.passport` |
| `filters.visa` | `String` | No | `` | - | Schema field for `filters.visa` |
| `filters.openToRemote` | `Boolean` | No | `false` | - | Schema field for `filters.openToRemote` |
| `filters.portfolio` | `String` | No | `` | - | Schema field for `filters.portfolio` |
| `filters.github` | `String` | No | `` | - | Schema field for `filters.github` |
| `filters.linkedIn` | `String` | No | `` | - | Schema field for `filters.linkedIn` |
| `resultCount` | `Number` | No | `0` | - | Schema field for `resultCount` |
| `runCount` | `Number` | No | `1` | - | Schema field for `runCount` |
| `lastRunAt` | `Date` | No | `null` | - | Schema field for `lastRunAt` |
| `sharedWith` | `Array` | No | - | - | Schema field for `sharedWith` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"companyId":1}` | Options: `{}`
- Index: `{"userId":1}` | Options: `{}`
- Index: `{"companyId":1,"isPinned":-1,"updatedAt":-1}` | Options: `{}`
- Index: `{"userId":1,"updatedAt":-1}` | Options: `{}`
- Index: `{"companyId":1,"name":1,"lastRunAt":-1}` | Options: `{}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/company-panel/resdex/search` | `resdex.controller.js` | `searchCandidates` | `ResdexSearch.create` |
| **GET** | `/api/v1/company-panel/resdex/searches` | `resdex.controller.js` | `listSearches` | `ResdexSearch.find` |
| **POST** | `/api/v1/company-panel/resdex/searches` | `resdex.controller.js` | `saveSearch` | `ResdexSearch.create` |
| **PATCH** | `/api/v1/company-panel/resdex/searches/:id/pin` | `resdex.controller.js` | `togglePin` | `ResdexSearch.findOne` |
| **GET** | `/api/v1/company-panel/resdex/searches/recent` | `resdex.controller.js` | `recentSearches` | `ResdexSearch.find` |

---

## Session

- **File Path:** [`server/src/models/Session.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/Session.js)
- **MongoDB Collection:** `sessions`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `services/auth.service.js`, `services/passwordReset.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sessionId` | `String` | **Yes** | - | **Unique Index**<br>**Indexed** | Schema field for `sessionId` |
| `userId` | `ObjectId` | **Yes** | - | **Indexed** | Schema field for `userId` |
| `userModel` | `String` | **Yes** | - | **Enum:** `[User, CrmUser]` | Schema field for `userModel` |
| `userRole` | `String` | **Yes** | - | **Indexed** | Schema field for `userRole` |
| `deviceId` | `String` | No | `` | **Indexed** | Schema field for `deviceId` |
| `ipAddress` | `String` | No | `` | - | Schema field for `ipAddress` |
| `userAgent` | `String` | No | `` | - | Schema field for `userAgent` |
| `refreshTokenFamily` | `String` | **Yes** | - | **Indexed** | Schema field for `refreshTokenFamily` |
| `isActive` | `Boolean` | No | `true` | **Indexed** | Schema field for `isActive` |
| `revokedAt` | `Date` | No | `null` | - | Schema field for `revokedAt` |
| `revokedReason` | `String` | No | `` | - | Schema field for `revokedReason` |
| `lastSeenAt` | `Date` | No | `null` | - | Schema field for `lastSeenAt` |
| `expiresAt` | `Date` | **Yes** | - | - | Schema field for `expiresAt` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"sessionId":1}` | Options: `{"unique":true}`
- Index: `{"userId":1}` | Options: `{}`
- Index: `{"userRole":1}` | Options: `{}`
- Index: `{"deviceId":1}` | Options: `{}`
- Index: `{"refreshTokenFamily":1}` | Options: `{}`
- Index: `{"isActive":1}` | Options: `{}`
- Index: `{"userId":1,"userModel":1}` | Options: `{}`
- Index: `{"expiresAt":1}` | Options: `{"expireAfterSeconds":0}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | `auth.controller.js` | `login` | `Session.create (track device, IP, userAgent, isActive)` |
| **POST** | `/api/v1/auth/google` | `auth.controller.js` | `googleLogin` | `Session.create` |
| **GET** | `/api/v1/auth/session` | `auth.controller.js` | `session` | `Session.findOne ({ sessionId, isActive: true })` |
| **POST** | `/api/v1/auth/logout` | `auth.controller.js` | `logout` | `Session.updateOne (isActive: false, revokedAt: now)` |
| **POST** | `/api/v1/auth/revoke` | `auth.controller.js` | `revoke` | `Session.updateMany (revoke all user sessions)` |
| **POST** | `/api/v1/company-panel/auth/login` | `company-panel.controller.js` | `login` | `Session.create` |
| **POST** | `/api/v1/crm-panel/auth/login` | `crm-panel.controller.js` | `login` | `Session.create` |
| **POST** | `/api/v1/fse/auth/login` | `fse.controller.js` | `login` | `Session.create` |
| **POST** | `/api/v1/lead-generator/auth/login` | `lead-generator.controller.js` | `login` | `Session.create` |
| **POST** | `/api/v1/state-manager/auth/login` | `state-manager.controller.js` | `login` | `Session.create` |
| **POST** | `/api/v1/zonal-manager/auth/login` | `zonal-manager.controller.js` | `login` | `Session.create` |
| **POST** | `/api/v1/national-sales-head/auth/login` | `national-sales-head.controller.js` | `login` | `Session.create` |
| **POST** | `/api/v1/admin/auth/login` | `admin.controller.js` | `login` | `Session.create` |
| **ALL (Protected)** | `/api/v1/* (via Auth Middleware)` | `auth.middleware.js` | `protectUser / protectCRM / protectAdmin` | `Session.findOne (validates active session and updates lastSeenAt)` |

**Service & Background Integration:**
- Core business logic service: `auth.service.js`
- Core business logic service: `passwordReset.service.js`

> [!NOTE]  
> **Dual-Actor Token Mechanism:** Both `RefreshToken` and `Session` use a polymorphic reference (`refPath: "userModel"` where `userModel` is either `"User"` or `"CrmUser"`), allowing seamless authentication across public users and internal staff.

---

## User

- **File Path:** [`server/src/models/User.js`](file:///c:/DDPL/Work/Maven-Jobs/maven-naukri/server/src/models/User.js)
- **MongoDB Collection:** `users`
- **Timestamps Enabled:** `true ({ createdAt, updatedAt })`
- **Referenced In:** `controllers/admin.controller.js`, `controllers/auth.controller.js`, `controllers/candidate.controller.js`, `controllers/chat.controller.js`, `controllers/company-panel.controller.js`, `controllers/company.controller.js`, `controllers/crm-panel.controller.js`, `controllers/folder.controller.js`, `controllers/job.controller.js`, `controllers/landing.controller.js`, `controllers/notificationPreferences.controller.js`, `controllers/nvite.controller.js`, `controllers/resdex.controller.js`, `middleware/admin.middleware.js`, `middleware/candidate.middleware.js`, `realtime/chat.socket.js`, `recommendations/engine/recommendationEngine.js`, `services/auth.service.js`, `services/openai/TierManager.js`, `services/passwordReset.service.js`, `services/payment.service.js`, `services/quiz.service.js`, `services/recruiter-activity.service.js`

### Database Schema Specification

| Field Name | Type | Required | Default Value | Constraints / Enums / References | Field Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | **Yes** | - | - | Schema field for `name` |
| `email` | `String` | **Yes** | - | **Unique Index** | Schema field for `email` |
| `password` | `String` | No | `` | - | Schema field for `password` |
| `role` | `String` | **Yes** | - | **Enum:** `[ADMIN, CRM, FSE, CLIENT, CANDIDATE]` | Schema field for `role` |
| `provider` | `String` | No | `local` | **Enum:** `[local, google]` | Schema field for `provider` |
| `googleId` | `String` | No | `` | - | Schema field for `googleId` |
| `avatar` | `String` | No | `` | - | Schema field for `avatar` |
| `emailVerified` | `Boolean` | No | `false` | - | Schema field for `emailVerified` |
| `companyId` | `ObjectId` | No | `null` | **Ref:** `Company` | Schema field for `companyId` |
| `department` | `String` | No | `` | - | Schema field for `department` |
| `scope` | `String` | No | `` | - | Schema field for `scope` |
| `accessStatus` | `String` | No | `ACTIVE` | **Enum:** `[ACTIVE, PENDING_INVITE, RESTRICTED]` | Schema field for `accessStatus` |
| `isActive` | `Boolean` | No | `true` | - | Schema field for `isActive` |
| `termsAccepted` | `Boolean` | No | `false` | - | Schema field for `termsAccepted` |
| `membership.plan` | `String` | No | `FREE` | **Enum:** `[FREE, PRO, ELITE]` | Schema field for `membership.plan` |
| `membership.active` | `Boolean` | No | `false` | - | Schema field for `membership.active` |
| `membership.startedAt` | `Date` | No | `null` | - | Schema field for `membership.startedAt` |
| `membership.expiresAt` | `Date` | No | `null` | - | Schema field for `membership.expiresAt` |
| `_id` | `ObjectId` | No | - | - | Schema field for `_id` |
| `createdAt` | `Date` | No | - | - | Schema field for `createdAt` |
| `updatedAt` | `Date` | No | - | - | Schema field for `updatedAt` |

#### Database Indexes
- Index: `{"email":1}` | Options: `{"unique":true}`

### Associated APIs & Operations

| HTTP Method | Route Endpoint | Controller File | Action / Handler | Database Operation |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/admin/auth/login` | `admin.controller.js` | `login` | `User.findOne` |
| **GET** | `/api/v1/admin/dashboard` | `admin.controller.js` | `getDashboard` | `User.countDocuments` |
| **GET** | `/api/v1/admin/payments` | `admin.controller.js` | `getPayments` | `User.countDocuments` |
| **GET** | `/api/v1/crm-panel/payments` | `admin.controller.js` | `getPayments` | `User.countDocuments` |
| **POST** | `/api/v1/auth/register` | `auth.controller.js` | `registerCandidate` | `User.findOne` |
| **POST** | `/api/v1/auth/google` | `auth.controller.js` | `googleLogin` | `User.create` |
| **POST** | `/api/v1/candidate/auth/google` | `auth.controller.js` | `googleLogin` | `User.create` |
| **POST** | `/api/v1/candidate/auth/register` | `candidate.controller.js` | `register` | `User.findOne` |
| **POST** | `/api/v1/candidate/auth/login` | `candidate.controller.js` | `login` | `User.findOne` |
| **GET** | `/api/v1/candidate/public/landing/:shareId` | `candidate.controller.js` | `getPublicProfileByShareId` | `User.findById` |
| **GET** | `/api/v1/candidate/exports/candidates` | `candidate.controller.js` | `exportCandidateProfiles` | `User.find` |
| **GET** | `/api/v1/candidate/exports/resumes` | `candidate.controller.js` | `exportCandidateResumes` | `User.find` |
| **GET** | `/api/v1/candidate/:id` | `candidate.controller.js` | `getPublicCandidateById` | `User.findById` |
| **POST** | `/api/v1/company-panel/auth/login` | `company-panel.controller.js` | `login` | `User.findOne` |
| **POST** | `/api/v1/company-panel/auth/register` | `company-panel.controller.js` | `register` | `User.findOne` |
| **PATCH** | `/api/v1/company-panel/profile` | `company-panel.controller.js` | `updateProfile` | `User.findOne` |
| **POST** | `/api/v1/company-panel/delete-account` | `company-panel.controller.js` | `deleteAccount` | `User.findById` |
| **POST** | `/api/v1/company` | `company.controller.js` | `createCompany` | `User.create` |
| **GET** | `/api/v1/crm-panel/dashboard` | `crm-panel.controller.js` | `getDashboard` | `User.countDocuments` |
| **POST** | `/api/v1/crm-panel/clients` | `crm-panel.controller.js` | `createClient` | `User.findOne` |
| **PATCH** | `/api/v1/crm-panel/clients/:id/credentials` | `crm-panel.controller.js` | `updateClientCredentials` | `User.findById` |
| **POST** | `/api/v1/crm-panel/jobs` | `crm-panel.controller.js` | `createJob` | `User.findById` |
| **PATCH** | `/api/v1/crm-panel/job-approvals/:id` | `crm-panel.controller.js` | `updateJobApproval` | `User.findById` |
| **GET** | `/api/v1/crm-panel/candidates` | `crm-panel.controller.js` | `getCandidates` | `User.find` |
| **GET** | `/api/v1/crm-panel/applications` | `crm-panel.controller.js` | `getApplications` | `User.find` |
| **GET** | `/api/v1/crm-panel/candidates/:candidateId/profile` | `crm-panel.controller.js` | `getCandidateProfile` | `User.findById` |
| **PATCH** | `/api/v1/crm-panel/candidates/:candidateId` | `crm-panel.controller.js` | `updateCandidate` | `User.findById` |
| **PATCH** | `/api/v1/crm-panel/applications/:id/status` | `crm-panel.controller.js` | `updateApplicationStatus` | `User.findById` |
| **POST** | `/api/v1/crm-panel/notifications` | `crm-panel.controller.js` | `createNotification` | `User.countDocuments` |
| **GET** | `/api/v1/company-panel/folders/:id` | `folder.controller.js` | `getFolder` | `User.find` |
| **PUT** | `/api/v1/job/approve/:id` | `job.controller.js` | `approveJob` | `User.findById` |
| **GET** | `/api/v1/landing/employer` | `landing.controller.js` | `getEmployerLandingData` | `User.countDocuments` |
| **POST** | `/api/v1/company-panel/resdex/nvite/send` | `nvite.controller.js` | `sendNvite` | `User.find` |

**Service & Background Integration:**
- WebSocket socket handler: `chat.socket.js`
- Core business logic service: `auth.service.js`
- Core business logic service: `TierManager.js`
- Core business logic service: `passwordReset.service.js`
- Core business logic service: `payment.service.js`
- Core business logic service: `quiz.service.js`
- Core business logic service: `recruiter-activity.service.js`

---

