# Second Brain v1

## Software Requirements Specification (SRS)

**Document Version:** 1.1\
**Status:** Revised Baseline Specification (incorporates the agreed v1 decisions)\
**Product Type:** Personal Productivity Web Application\
**Primary Users:** Individual users\
**Document Purpose:** Define the product requirements, system behavior, architecture, data model, constraints, and acceptance criteria for Second Brain v1.

---

# 1. Introduction

## 1.1 Purpose

Second Brain is a personal productivity application designed to help users capture, organize, schedule, and complete their responsibilities from one unified workspace.

The application combines task management, time-blocked daily planning, recurring habit tracking, and AI-assisted task creation.

This document defines the requirements for the first release of Second Brain. It serves as the reference for product design, software architecture, database implementation, API development, frontend development, testing, and deployment.

The system shall be developed from a clean project foundation, using the requirements in this document as the initial implementation baseline.

## 1.2 Product Vision

Second Brain is built around the principle that productivity requires more than maintaining a list of tasks. Users need a reliable way to translate intentions into an actionable schedule.

The application follows a continuous workflow:

1. Capture responsibilities through manual entry or natural-language input.
2. Organize them into structured tasks.
3. Allocate time to tasks, events, and habits.
4. Execute the planned activities.
5. Record completion and review progress.

The application should reduce the effort required to organize daily responsibilities while helping users develop consistent planning habits.

## 1.3 Product Objectives

The primary objectives are:

- Provide a secure, personalized workspace for each user.
- Support complete task management, including priorities, categories, deadlines, notes, and subtasks.
- Provide an interactive daily calendar with movable and resizable task blocks.
- Support calendar events independently of tasks.
- Support recurring habits with individual occurrence tracking and historical analytics.
- Convert unstructured natural-language transcripts into editable task drafts using AI.
- Maintain consistent data across all application views.
- Prevent scheduling conflicts and data inconsistencies.
- Provide a maintainable architecture that supports future enhancements.

## 1.4 Intended Audience

This document is intended for:

- Product and UI/UX design.
- Frontend developers.
- Backend developers.
- Database designers.
- AI integration developers.
- Test engineers.
- Project maintainers.

## 1.5 Definitions

| Term | Definition |
| --- | --- |
| Task | A unit of work that a user intends to complete. |
| Deadline | The date, with an optional time of day, by which a task should be completed. |
| Task block | A specific time allocation for a task. Events and habit occurrences carry their own times; My Day combines all three. |
| Event | A calendar commitment associated with a particular time interval. |
| Habit | A recurring behavior defined by a frequency and optional scheduling preferences. |
| Habit occurrence | One instance of a habit on a particular date. |
| Transcript | Unstructured natural-language input describing one or more responsibilities. |
| AI draft | A collection of structured tasks proposed by the AI but not yet committed to the database. |
| Completion history | Historical records of completed tasks, events where applicable, and habit occurrences. |
| User time zone | The time zone used to interpret local dates, recurring schedules, and displayed times. |

---

# 2. Product Scope

## 2.1 In-Scope Features

Second Brain v1 shall include the following capabilities.

### Account management

- Email and password registration.
- Email verification using the authentication provider's verification link.
- Login and logout.
- Google sign-in and registration.
- User profile management.
- Session persistence and secure account access.

### All Tasks

- Task creation, editing, completion, deletion, and retrieval.
- Priority management.
- Category management.
- Deadlines.
- Estimated durations.
- Notes and subtasks.
- Search, filtering, and sorting.
- AI-assisted task extraction.
- Task scheduling and rescheduling.

### My Day

- Date-specific daily timeline.
- Task blocks.
- Calendar events.
- Habit occurrences.
- Drag-and-drop scheduling.
- Resizing scheduled blocks.
- Date navigation.
- Conflict detection.
- Completion controls.
- Unscheduled and overdue task handling.

### My Habits

- Habit creation and editing.
- Recurrence configuration.
- Preferred time and duration.
- Habit occurrence generation.
- Daily completion tracking.
- Completion history and basic statistics.
- Pause, archive, and resume functionality.

### Platform capabilities

- Responsive web interface.
- Persistent database storage.
- Backend validation and authorization.
- Automated tests.
- Deployment configuration.
- Error handling and operational logging.

## 2.2 Out-of-Scope Features

The following features are excluded from v1 unless explicitly approved as later scope additions:

- Two-way Google Calendar synchronization.
- Collaborative tasks and shared workspaces.
- Team accounts and organizational administration.
- Native Android or iOS applications.
- Email inbox integration.
- Voice recording and speech-to-text.
- AI agents that autonomously execute tasks.
- Automatic task completion.
- Advanced AI schedule optimization.
- AI-proposed scheduling of extracted tasks.
- A vector database or retrieval-augmented generation system.
- Public profiles, social features, and leaderboards.
- Subscription billing and payments.
- Advanced gamification.
- Complex project management, including dependencies and Gantt charts.
- Account deletion.
- Custom email one-time-code verification.
- Date of birth collection.
- Habit recurrence expressed as a number of occurrences per week.
- Task blocks and events that cross midnight.
- Weekly and monthly habit progress summaries.
- Configurable time-grid density and planning-window comparison.
- Optimistic concurrency control.
- A full WCAG 2.2 AA audit.

These exclusions keep the first release focused on the core productivity loop.

---

# 3. User Roles and Permissions

## 3.1 Individual User

The initial release supports one primary role: the authenticated individual user.

Each user shall have access only to their own private application data.

The user can:

- Manage their profile.
- Create and manage tasks.
- Create and manage events.
- Create and manage habits.
- View and modify their schedule.
- Use AI-assisted task creation.
- View their own completion history.

There shall be no cross-user sharing in v1.

## 3.2 Unauthenticated Visitor

An unauthenticated visitor may access public authentication screens but shall not access private application data.

The visitor may:

- Register an account.
- Log in.
- Verify an email address.
- Initiate supported account-recovery procedures.

## 3.3 Authorization Rules

Every protected backend operation shall verify the authenticated identity and ownership of the requested resources.

The backend shall not rely on a user ID supplied by the frontend as proof of ownership.

Attempts to access another user's records shall be rejected without disclosing private record details.

---

# 4. Functional Requirements

Requirements are identified using stable identifiers so they can be referenced in implementation tasks and test cases.

## 4.1 Authentication and Account Management

### FR-AUTH-001: Email Registration

The system shall allow users to register using an email address and password.

Required fields:

- Name.
- Email address.
- Password.

The system shall validate the input before initiating account creation.

The system shall reject invalid email addresses, invalid password values, and duplicate account registrations according to the authentication provider's supported behavior.

### FR-AUTH-002: Email Verification

Email registrations shall require verification before the user receives normal access to the application.

The system shall use the authentication provider's built-in email verification, which sends a verification link to the registered email address.

The verification mechanism shall:

- Use secure, unpredictable verification links generated by the provider.
- Associate the link with the relevant registration or account.
- Enforce the provider's expiration period.
- Limit resend frequency.
- Invalidate a link after successful use, according to the provider's behavior.
- Prevent repeated successful use of the same link.

An unverified account shall not be able to access protected productivity features. The backend shall enforce this on protected endpoints.

### FR-AUTH-003: Google Authentication

The system shall support registration and login using Google authentication.

The application shall use a trusted OAuth 2.0/OpenID Connect implementation through the selected authentication provider.

The system shall obtain the user's identity from validated provider claims.

Google authentication shall not require the user to enter a separate password into Second Brain.

### FR-AUTH-004: Account Identity

The system shall maintain a stable internal user identifier.

The internal identifier shall be used to associate tasks, events, habits, categories, and other private resources with their owner.

Email addresses shall not be used as primary database relationship keys.

### FR-AUTH-005: Login and Logout

The system shall support login and logout through the configured authentication mechanism.

Protected pages and API endpoints shall reject unauthenticated requests.

Logout shall terminate or invalidate the applicable session according to the authentication architecture.

### FR-AUTH-006: Session Persistence

The system shall maintain authentication across page refreshes and normal application navigation according to the selected provider's session mechanism.

The frontend shall send the authentication provider's ID token to the backend in the `Authorization` header as a Bearer token, and the backend shall verify it on every protected request. Cookie-based sessions are not used in v1.

Authentication tokens and session credentials shall not be stored in insecure locations merely for implementation convenience.

### FR-AUTH-007: Account Linking

Account linking behavior shall be delegated to the authentication provider's secure account-linking settings. The application shall not implement custom account-merging logic.

The system shall not automatically merge accounts without satisfying the authentication provider's secure account-linking requirements.

### FR-AUTH-008: Profile Management

Users shall be able to view and update supported profile fields.

The profile shall include:

- Name.
- Email address.
- Email verification status.
- User time zone.
- Account creation timestamp.
- Relevant application preferences.

Users shall not be permitted to change their account identifier directly.

### FR-AUTH-009: Password Recovery

The system shall provide a secure password recovery flow for email/password accounts.

Password recovery shall not reveal whether an arbitrary email address belongs to an account.

Google-authenticated users shall be directed to the appropriate provider-managed recovery process where applicable.

### FR-AUTH-010: Account Deletion

Account deletion is not included in v1.

The architecture shall support eventual account deletion.

---

## 4.2 All Tasks

### FR-TASK-001: Task Creation

Users shall be able to create a task manually.

A task shall contain:

| Field | Requirement |
| --- | --- |
| Title | Required |
| Description or notes | Optional |
| Priority | Optional |
| Category | Optional |
| Deadline | Optional (a date, with an optional time of day) |
| Estimated duration | Optional (a number of minutes) |
| Status | System-managed |
| Created timestamp | System-managed |
| Updated timestamp | System-managed |

The task shall initially be unscheduled unless the user supplies a scheduling request.

Task creation shall accept an optional idempotency key so that a retried submission does not create a duplicate task.

### FR-TASK-002: Priority

The system shall support the following priority levels:

- No priority.
- Low.
- Medium.
- High.
- Urgent.

Priority shall be independent of task status and deadline.

The user shall be able to modify priority after creation.

### FR-TASK-003: Categories

Users shall be able to organize tasks using categories.

The system may provide default categories such as Academics, Work, Personal, and Health.

Users shall be able to create, rename, recolor, and delete custom categories.

Deleting a category shall not delete the tasks associated with it. Those tasks shall become uncategorized unless the user explicitly selects another supported operation.

Category names shall be scoped to the owning user or to explicitly defined system defaults.

### FR-TASK-004: Deadlines

Users shall be able to assign a deadline to a task.

A deadline consists of a date and an optional time of day, interpreted in the user's time zone.

The deadline shall be independent of scheduled work sessions.

Changing a task block shall not automatically change the task deadline.

Tasks whose deadlines have passed and which remain incomplete shall be identifiable as overdue.

The system shall distinguish between a date-only deadline and a deadline with a specific time.

### FR-TASK-005: Subtasks

Users shall be able to create, edit, reorder, and complete subtasks associated with a parent task.

A subtask shall belong to exactly one parent task.

Completing a subtask shall not automatically complete the parent task unless an explicit, documented rule is introduced.

The system shall not permit orphaned subtasks.

The initial implementation shall support one level of subtasks. Nested subtasks are excluded unless separately approved.

### FR-TASK-006: Notes

Users shall be able to attach textual notes or descriptions to tasks.

The notes shall persist across application sessions.

Rich-text editing and file attachments are not required in v1.

### FR-TASK-007: Task Editing

Users shall be able to update supported task fields.

The system shall validate modifications before saving them.

Changes shall be reflected in relevant application views after the backend confirms the update.

### FR-TASK-008: Task Completion

Users shall be able to mark a task complete and reopen it when appropriate.

The system shall record completion timestamps.

Completing a task shall not automatically delete its task-block history. When a task is completed, its existing task blocks shall be retained and marked done. Reopening the task shall unmark them.

### FR-TASK-009: Task Deletion

Users shall be able to delete their own tasks.

Deletion shall not affect resources belonging to other users.

Deleting a task shall delete its dependent subtasks and task blocks in a single transaction.

### FR-TASK-010: Search and Filtering

The system shall support searching tasks by title and, where appropriate, description.

Users shall be able to filter tasks by:

- Status.
- Priority.
- Category.
- Deadline range.
- Scheduled versus unscheduled state.
- Overdue state.

Filters shall be combinable.

### FR-TASK-011: Sorting

Users shall be able to sort tasks by supported fields, including:

- Creation date.
- Deadline.
- Priority.
- Title.
- Updated date.

The application shall provide useful default sorting behavior without requiring the user to configure filters every time.

### FR-TASK-012: Task Views

All Tasks shall provide a unified view of active tasks, including unscheduled tasks and future tasks.

Completed tasks shall be accessible through a supported completed-task view or filter.

Overdue tasks shall remain accessible until resolved.

### FR-TASK-013: Scheduling Integration

Users shall be able to schedule a task from All Tasks.

Scheduling shall create or update a task-block record associated with the task. A task may have multiple task blocks.

The task itself shall remain in the task collection independently of its schedule.

Moving or resizing a task block shall update the relevant schedule data without changing unrelated task fields.

### FR-TASK-014: Task Rescheduling

Users shall be able to reschedule a task to another date or time.

The system shall preserve the task deadline unless the user explicitly changes it.

The system shall validate scheduling changes and communicate any conflicts.

### FR-TASK-015: Duration

The system shall support estimated task durations, stored as a number of minutes.

The estimated duration shall be used as a default when creating a task block if a duration is available. If a task has no estimate, the default block duration shall be 30 minutes.

The user shall be able to override the duration for an individual task block without necessarily changing the task's general estimate.

---

## 4.3 My Day

### FR-DAY-001: Daily Timeline

My Day shall display a chronological timeline for a selected local calendar date.

The timeline shall support scheduled task blocks, calendar events, and habit occurrences.

The user shall be able to navigate to previous and future dates.

The current date shall be the default selection.

### FR-DAY-002: Scheduled Task Blocks

A task block shall display sufficient information to identify the associated task.

At minimum, it shall show the task title and scheduled time interval.

Where space permits, it may show priority, category, and status.

Selecting a block shall provide access to the associated task details.

### FR-DAY-003: Drag and Drop

Users shall be able to move task blocks and supported event or habit blocks through drag-and-drop interactions.

A successful move shall update the persisted schedule through the backend.

Moving a habit occurrence shall override the time for that single occurrence only and shall not modify the habit definition.

The frontend shall not permanently represent a change as saved before the backend confirms it.

### FR-DAY-004: Resizing

Users shall be able to resize supported scheduled blocks to adjust their durations.

The system shall validate the resulting time interval before accepting the update.

Durations shall remain positive, and invalid intervals shall be rejected.

### FR-DAY-005: Time Grid

The timeline shall use a fixed time grid with a reasonable default time-slot increment.

The grid shall give access to all 24 hours of the day. The application may emphasize typical waking hours.

The exact visual density shall be determined during UI design. Configurable grid density is not required in v1.

### FR-DAY-006: Events

Users shall be able to create, edit, view, and delete calendar events.

An event shall contain:

- Title.
- Optional description.
- Start time.
- End time.
- Optional location.
- Creation and update timestamps.

An event shall be distinct from a task.

An event shall not require a task to exist.

An event owns its own start and end times; those times shall not be duplicated in another record.

An event may optionally be associated with a task in a future extension, but such a relationship is not required in v1.

### FR-DAY-007: Scheduling Conflicts

The system shall detect overlapping scheduled intervals belonging to the same user.

The conflict policy is advisory: overlapping items shall always be allowed after an appropriate warning, and the system shall never block an operation because of an overlap.

The application shall not silently move unrelated blocks to resolve conflicts.

### FR-DAY-008: Unscheduled Tasks

My Day shall provide access to unscheduled tasks.

Users shall be able to select or drag an unscheduled task onto the timeline.

The resulting task block shall use the task's estimated duration as its default duration.

If the task has no estimate, the system shall use a default duration of 30 minutes.

### FR-DAY-009: Unfinished Tasks

Incomplete tasks shall not disappear when their scheduled dates pass.

The system shall provide a carryover view for tasks that were scheduled in the past but remain incomplete.

The user shall decide whether to reschedule a carried-over task.

The application shall not automatically schedule every overdue task into the current day.

### FR-DAY-010: Daily Workload

The system shall calculate the total scheduled duration for the selected date.

Overlapping blocks shall not be counted twice when calculating actual occupied time.

The system shall clearly distinguish scheduled duration from task estimates.

### FR-DAY-011: Time Zone Behavior

The application shall display times in the user's selected time zone.

Stored timestamps shall be normalized consistently to UTC.

Date-only values, such as habit dates and date-only deadlines, shall not be converted in ways that shift them to an adjacent date.

If the user changes their time zone, existing habit occurrences shall keep their stored local dates, and only future occurrences shall be generated using the new time zone.

---

## 4.4 My Habits

### FR-HABIT-001: Habit Creation

Users shall be able to create a habit with:

- Title.
- Optional description.
- Frequency.
- Preferred time.
- Target duration.
- Start date.
- Optional end date.
- Active or paused state.

The system shall validate the configuration before saving it.

### FR-HABIT-002: Recurrence

The initial release shall support:

- Daily recurrence.
- Selected weekdays.

The recurrence model shall be explicit and deterministic.

Advanced recurrence patterns, such as complex calendar rules, are excluded from v1. A configurable number of occurrences per week is also excluded from v1.

### FR-HABIT-003: Habit Occurrences

Each scheduled habit instance shall be represented as an occurrence associated with a particular habit and local date.

An occurrence shall include:

- Habit reference.
- Local occurrence date.
- Status (pending, done, or skipped).
- Preferred time, with an optional per-occurrence time override.
- Completion timestamp, where applicable.

The system shall prevent duplicate occurrences for the same habit and recurrence date.

Occurrences shall be generated idempotently for a rolling window (the current date plus 14 days) and on demand when a date is viewed.

### FR-HABIT-004: My Day Integration

Eligible habit occurrences shall appear as blocks on My Day.

Users shall be able to mark a habit occurrence complete from My Day.

Completing an occurrence shall update the corresponding habit history.

The system shall not treat one completed occurrence as completion of every future occurrence.

### FR-HABIT-005: Habit History

Users shall be able to view the history of a selected habit.

The history shall identify completed, pending, skipped, and missed occurrences.

The application shall distinguish a habit that was not scheduled on a particular date from a scheduled habit that was not completed.

### FR-HABIT-006: Habit Analytics

The system shall provide basic habit statistics, including:

- Total completed occurrences.
- Completion rate over a selected period.
- Recent completion history.

The completion rate shall be calculated with the following denominator: the occurrences scheduled within the period that are done, skipped, or missed. Future dates, dates on which the habit was not scheduled, and paused periods shall be excluded.

### FR-HABIT-007: Habit Editing

Users shall be able to edit habit settings.

Changes to recurrence settings or preferred time shall regenerate only future pending occurrences. Done and skipped occurrences and all past occurrences shall never be modified.

Historical occurrences shall not be rewritten merely because a habit's recurrence or preferred time changes.

### FR-HABIT-008: Habit Pause and Archive

Users shall be able to pause or archive a habit.

Pausing shall prevent future occurrences from being scheduled while retaining history. Future pending occurrences shall be removed. Resuming a paused habit shall regenerate occurrences from the current date.

Archiving shall remove the habit from active views without destroying its historical records.

### FR-HABIT-009: Missed Occurrences

The system shall distinguish between a pending occurrence, a completed occurrence, a skipped occurrence, and a missed occurrence.

Missed status shall be derived at read time: an occurrence is missed when its date is in the past in the user's time zone and its status is still pending. Missed status shall not be stored, and no background job is required.

The application shall not mark a habit completed simply because its scheduled time has passed.

---

## 4.5 AI-Assisted Task Creation

### FR-AI-001: Transcript Input

Users shall be able to submit unstructured natural-language text describing their responsibilities.

A single transcript may describe multiple tasks.

The interface shall support reviewing and editing the transcript before processing.

### FR-AI-002: Structured Extraction

The AI service shall attempt to extract structured task drafts containing:

- Task title.
- Description or notes.
- Priority, with a flag indicating whether it was explicit or inferred.
- Category.
- Deadline.
- Estimated duration.
- Subtasks, where appropriate.
- Uncertainty or missing information, where relevant.

Fields not supported by the input shall remain unset or explicitly uncertain.

The model shall not be required to populate every optional field.

### FR-AI-003: Structured Output Validation

The AI service shall return structured output conforming to a defined schema.

The backend shall validate the response before returning it to the frontend.

Invalid responses shall not be written directly into the production task tables.

The system shall handle malformed responses, timeouts, provider errors, and missing fields.

### FR-AI-004: Priority Inference

The AI may infer priority from explicit wording and contextual cues.

Explicit user instructions shall take precedence over weak contextual inference.

The system shall distinguish explicitly stated priority from inferred priority using a flag.

The AI shall not claim that an inferred priority was explicitly specified by the user.

### FR-AI-005: Date Interpretation

The AI workflow shall use the current date and user's time zone when interpreting relative expressions such as "tomorrow" or "next Friday."

Resolved dates shall be validated by backend date-handling logic.

Ambiguous expressions shall be left unresolved or presented for clarification rather than silently converted into arbitrary deadlines.

### FR-AI-006: Category Assignment

The AI may assign tasks to existing categories.

If no appropriate category exists, the draft shall remain uncategorized or show a suggested category as a hint only.

The AI shall not create category records.

### FR-AI-007: Review and Approval

The system shall display extracted tasks as editable drafts before saving.

Users shall be able to:

- Edit task fields.
- Change priorities.
- Change categories.
- Modify deadlines.
- Add or remove subtasks.
- Remove unwanted drafts.
- Approve individual drafts or approve the entire batch.

The application shall not create persistent tasks solely because the model returned them.

### FR-AI-008: Batch Creation

Upon approval, the backend shall validate the submitted drafts again and create the selected tasks.

Batch creation shall be atomic: all approved tasks and their subtasks are created in a single transaction, or none are. If validation fails, the error shall identify the failing draft and field.

The confirmation request shall carry an idempotency key. A repeated request with the same key from the same user shall return the previously created tasks and shall not create new ones.

### FR-AI-009: No AI Scheduling

In v1, the AI shall not propose dates, times, or durations for scheduling extracted tasks.

Extracted tasks shall be created unscheduled. Users schedule them afterward through My Day or All Tasks.

### FR-AI-010: AI Service Isolation

AI functionality shall be isolated behind a backend service interface.

The model provider, prompt templates, response schema, and validation logic shall not be tightly coupled to task CRUD operations.

The application shall support changing the model provider without redesigning the entire task management subsystem.

### FR-AI-011: AI Failure Handling

If the AI provider is unavailable or returns invalid output, the user shall receive an understandable error message.

Existing tasks shall remain accessible.

AI failure shall not compromise authentication, task persistence, or the ordinary manual task workflow.

### FR-AI-012: Privacy

The system shall send only the information required for the AI request.

API credentials shall remain server-side.

The application shall document the processing of user-submitted transcripts by the configured model provider.

---

# 5. Business Rules

The following rules apply across the system.

## BR-001: Unified Data

All Tasks, My Day, and My Habits shall use the same underlying records.

They shall not maintain separate copies of the same task or habit definition.

## BR-002: Deadline Independence

A deadline represents when work is due. A task block represents when the user intends to work.

Updating one shall not silently modify the other.

## BR-003: Ownership

Every private resource shall belong to a user or have an explicit ownership relationship.

## BR-004: Task Persistence

Tasks shall remain in the task system until they are completed, deleted, or otherwise resolved.

A task shall not be deleted automatically because its scheduled date has passed.

## BR-005: Habit History

Habit history shall preserve past occurrence outcomes even when future recurrence settings change.

## BR-006: Schedule Consistency

Every accepted schedule modification shall be persisted through the backend and reflected in subsequent queries.

## BR-007: AI Approval

AI-generated drafts shall remain uncommitted until the user approves them.

## BR-008: Time Intervals

Scheduled intervals shall have a valid start and end, with the end later than the start.

Task blocks and events shall not cross midnight: the start and end must fall on the same local date in the user's time zone. The end may equal the next local midnight.

## BR-009: Completion

Task completion, event attendance, and habit completion shall be distinct states.

The system shall not conflate these operations.

## BR-010: Historical Integrity

Editing a current task, habit, or recurrence definition shall not unintentionally rewrite unrelated historical records.

---

# 6. System Architecture

## 6.1 Architecture Overview

Second Brain v1 shall use a modular client-server architecture.

The application shall consist of:

1. A web frontend.
2. A backend API.
3. An authentication provider.
4. A relational database.
5. An AI provider integration.
6. Email delivery for verification and password recovery, provided by the authentication provider.

The initial release shall not require a microservices architecture.

## 6.2 Proposed Technology Stack

### Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query for server-state management.
- A suitable calendar or time-grid library, such as FullCalendar, subject to interaction requirements.

The frontend shall be responsible for rendering, user interaction, client-side validation, and presenting API results.

It shall not be the authoritative source of application business rules.

### Backend

- Python.
- FastAPI.
- Pydantic.
- SQLAlchemy 2.x.
- Alembic for database migrations.

The backend shall own domain validation, authorization, task and habit rules, schedule validation, and AI orchestration.

### Database

- PostgreSQL.

PostgreSQL shall store persistent application data.

The database shall use foreign keys, appropriate indexes, unique constraints, and transactions where needed.

### Authentication

Firebase Authentication is the proposed authentication provider.

It shall support the required email and Google authentication flows, including its built-in email verification link.

The frontend shall send the provider's ID token as a Bearer token. The backend shall validate the token and derive the current user identity from trusted claims.

### AI

- Gemini API or another configurable LLM provider.
- Structured model output.
- Pydantic validation.
- Versioned prompt templates.

The initial release shall not require embeddings, a vector database, or a RAG pipeline.

### Testing

- Pytest for backend tests.
- Vitest for frontend unit tests.
- Playwright for end-to-end browser tests.

### Deployment

The frontend and backend may be deployed separately.

PostgreSQL shall use a managed or otherwise properly maintained deployment.

Environment-specific configuration and secrets shall be kept outside committed source code.

## 6.3 Backend Modules

The backend should be organized by domain rather than implemented as one large route file.

Recommended modules:

- Authentication and identity.
- User profiles.
- Tasks and subtasks.
- Categories.
- Events.
- Scheduling.
- Habits and occurrences.
- AI task extraction.
- Shared validation and error handling.

The implementation may initially run as one deployable FastAPI application.

## 6.4 Architectural Boundaries

The following boundaries shall be maintained:

- Authentication identifies the user; authorization determines which resources they may access.
- API schemas define accepted inputs and returned outputs.
- Domain services enforce application rules.
- Database models represent persistent entities.
- AI services generate drafts but do not independently bypass normal validation.
- The frontend communicates with the backend through documented API contracts.

---

# 7. Data Model

The following entities define the initial relational model.

The final schema shall be validated against the implemented workflows before migrations are finalized.

## 7.1 User

Fields:

- `id`: internal primary key.
- `auth_provider_uid`: unique identity reference from the authentication provider, where applicable.
- `name`: display name.
- `email`: normalized email address.
- `email_verified`: verification state.
- `timezone`: IANA time zone identifier.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

Authentication credentials managed by the identity provider shall not be duplicated unnecessarily in the application database.

## 7.2 Task

Fields:

- `id`: primary key.
- `user_id`: owner.
- `title`: required title.
- `description`: optional notes.
- `status`: task lifecycle state.
- `priority`: nullable priority value.
- `category_id`: optional category reference.
- `due_date`: optional local date deadline.
- `due_time`: optional local time of day (requires `due_date`).
- `estimated_duration_minutes`: optional estimated duration.
- `completed_at`: optional completion timestamp.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

Deadlines shall be stored as `due_date` and an optional `due_time`, interpreted in the user's time zone. There shall be no separate deadline timestamp column that could disagree with them.

## 7.3 Subtask

Fields:

- `id`.
- `task_id`.
- `title`.
- `status`.
- `position`.
- `created_at`.
- `updated_at`.
- `completed_at`, where applicable.

The parent task shall be validated through ownership checks.

## 7.4 Category

Fields:

- `id`.
- `user_id`.
- `name`.
- `color`.
- `created_at`.
- `updated_at`.

System-defined defaults may be represented separately or through an explicit system-category mechanism.

## 7.5 Event

Fields:

- `id`.
- `user_id`.
- `title`.
- `description`.
- `location`.
- `start_at`.
- `end_at`.
- `created_at`.
- `updated_at`.

Event times shall be stored using a consistent timezone-aware representation (UTC). An event owns its own times; they are not duplicated in any other table.

## 7.6 TaskBlock

Fields:

- `id`.
- `user_id`.
- `task_id`.
- `start_at`.
- `end_at`.
- `done`.
- `created_at`.
- `updated_at`.

A task block represents one time allocation for one task. There is no polymorphic scheduled-block table: events carry their own times, and habit occurrences carry their own preferred time and optional time override. My Day combines task blocks, events, and habit occurrences at read time.

A task may have multiple task blocks. Completing a task keeps its blocks and marks them done. Deleting a task deletes its blocks.

## 7.7 Habit

Fields:

- `id`.
- `user_id`.
- `title`.
- `description`.
- `recurrence_type` (daily or weekdays).
- `recurrence_config`.
- `preferred_local_time`.
- `duration_minutes`.
- `start_date`.
- `end_date`.
- `status` (active, paused, or archived).
- `created_at`.
- `updated_at`.

Recurrence configuration shall be validated. Historical meaning is preserved because past occurrences are stored as rows and are never rewritten.

## 7.8 HabitOccurrence

Fields:

- `id`.
- `habit_id`.
- `occurrence_date`.
- `status` (pending, done, or skipped).
- `time_override`, where applicable.
- `completed_at`.
- `created_at`.
- `updated_at`.

A uniqueness constraint shall prevent duplicate occurrences for the same habit and occurrence date.

The effective status "missed" is derived at read time and is not stored.

## 7.9 Supporting Entities

Additional entities may be introduced when justified:

- Idempotency key record, used by task creation and AI draft confirmation, scoped per user and expiring after a fixed period.
- AI extraction job or audit record.
- User preferences.
- Task change history, if needed for reliable auditing.
- Notification records, when reminders are introduced.

The first release should not add supporting tables without a clear use case.

---

# 8. API Requirements

## 8.1 API Design Principles

The backend shall expose a versioned API, initially under `/api/v1`.

Endpoints shall:

- Use consistent resource naming.
- Validate inputs.
- Return predictable response structures.
- Apply authentication and ownership checks.
- Use appropriate HTTP status codes.
- Provide useful, non-sensitive error messages.
- Support pagination for collections where appropriate.
- Avoid exposing internal exception details.

## 8.2 Proposed Endpoint Inventory

### Authentication and profile

The authentication provider shall handle supported login, registration, and email verification flows.

The backend shall expose application profile endpoints such as:

- `GET /api/v1/me`
- `PATCH /api/v1/me`

### Tasks

- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/{task_id}`
- `PATCH /api/v1/tasks/{task_id}`
- `DELETE /api/v1/tasks/{task_id}`
- `POST /api/v1/tasks/{task_id}/complete`
- `POST /api/v1/tasks/{task_id}/reopen`

`POST /api/v1/tasks` shall accept an optional `Idempotency-Key` header.

### Subtasks

- `GET /api/v1/tasks/{task_id}/subtasks`
- `POST /api/v1/tasks/{task_id}/subtasks`
- `PATCH /api/v1/subtasks/{subtask_id}`
- `DELETE /api/v1/subtasks/{subtask_id}`

### Categories

- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/{category_id}`
- `DELETE /api/v1/categories/{category_id}`

### Events

- `GET /api/v1/events`
- `POST /api/v1/events`
- `PATCH /api/v1/events/{event_id}`
- `DELETE /api/v1/events/{event_id}`

### Scheduling

- `GET /api/v1/schedule?date=YYYY-MM-DD`
- `GET /api/v1/schedule/carryover`
- `POST /api/v1/scheduled-blocks`
- `PATCH /api/v1/scheduled-blocks/{block_id}`
- `DELETE /api/v1/scheduled-blocks/{block_id}`

The schedule endpoint shall return the supported scheduled item types (task blocks, events, and habit occurrences) for the requested local date.

The carryover endpoint shall return open tasks that have a past task block and no future task block.

The `scheduled-blocks` endpoints operate on task blocks.

### Habits

- `GET /api/v1/habits`
- `POST /api/v1/habits`
- `GET /api/v1/habits/{habit_id}`
- `PATCH /api/v1/habits/{habit_id}`
- `POST /api/v1/habits/{habit_id}/pause`
- `POST /api/v1/habits/{habit_id}/resume`
- `POST /api/v1/habits/{habit_id}/archive`
- `GET /api/v1/habits/{habit_id}/history`
- `GET /api/v1/habits/{habit_id}/statistics`

### Habit occurrences

- `GET /api/v1/habit-occurrences?date=YYYY-MM-DD`
- `PATCH /api/v1/habit-occurrences/{occurrence_id}`
- `POST /api/v1/habit-occurrences/{occurrence_id}/complete`
- `POST /api/v1/habit-occurrences/{occurrence_id}/skip`

The `PATCH` endpoint sets the time override for a single occurrence.

### AI extraction

- `POST /api/v1/ai/task-drafts`
- `POST /api/v1/ai/task-drafts/confirm`

The AI endpoint shall return validated drafts rather than writing tasks automatically.

The confirmation endpoint shall revalidate approved fields before persisting them, shall create all tasks atomically, and shall require an idempotency key.

## 8.3 Error Handling

The API shall distinguish between common failure categories:

- Invalid request data.
- Unauthenticated request.
- Unauthorized resource access.
- Missing resource.
- Conflicting state.
- Rate limit exceeded.
- External AI provider failure.
- Internal server error.

Error responses shall not reveal database credentials, access tokens, internal stack traces, or private information about another user.

## 8.4 Concurrency

Optimistic concurrency control is not required in v1. Concurrent updates to the same resource are resolved by last write wins.

The frontend shall refetch affected data after mutations so that views converge on the persisted state.

---

# 9. Non-Functional Requirements

## 9.1 Security

The system shall:

- Use HTTPS in production.
- Keep provider secrets and API keys server-side.
- Validate authentication on protected endpoints.
- Enforce resource ownership checks.
- Validate all client-supplied data on the backend.
- Protect against common web vulnerabilities.
- Apply rate limits to AI endpoints. Authentication abuse protections are provided by the authentication provider.
- Use secure authentication and session handling.
- Avoid logging passwords, access tokens, or verification links.
- Restrict cross-origin access to explicitly approved origins.
- Keep dependencies updated and review security advisories.

## 9.2 Privacy

The system shall collect only information required for the product's functionality.

The system shall document the handling of personal data sent to external AI and authentication providers.

User data shall not be exposed across accounts.

## 9.3 Performance

The following are proposed initial targets under ordinary operating conditions, not guaranteed service-level commitments:

- Typical task-list API requests should complete within 500 ms at the 95th percentile, excluding network latency outside the application's control.
- Typical schedule retrieval should complete within 500 ms at the 95th percentile.
- Common user interactions should feel responsive, with immediate visual feedback where appropriate.
- AI extraction latency shall be measured separately because it depends on the model provider.

Performance tests shall use a documented test dataset and environment.

## 9.4 Reliability

The application shall:

- Preserve successfully committed changes.
- Handle transient API failures without corrupting local UI state.
- Prevent duplicate habit occurrences.
- Avoid duplicate task creation from repeated submissions by using idempotency keys.
- Recover from AI provider failures without disabling ordinary task management.
- Provide understandable failure states and retry behavior.

## 9.5 Usability

The interface shall:

- Provide consistent navigation among All Tasks, My Day, and My Habits.
- Support common desktop and mobile browser sizes.
- Provide clear empty states and validation messages.
- Make overdue tasks and scheduling conflicts understandable.
- Distinguish unscheduled tasks from scheduled blocks.
- Allow users to correct AI-generated drafts before saving.

## 9.6 Accessibility

A full WCAG 2.2 AA audit is out of scope for v1. The interface shall nevertheless provide keyboard navigation, visible focus states, adequate contrast, and accessible labels.

Drag-and-drop functionality shall have a keyboard-accessible alternative, such as selecting a block and choosing a new time.

## 9.7 Maintainability

The codebase shall use:

- Clear module boundaries.
- Type-safe frontend interfaces.
- Validated backend schemas.
- Database migrations.
- Automated tests.
- Environment-based configuration.
- Consistent logging and error handling.
- Documented setup and deployment procedures.

## 9.8 Scalability

The initial architecture shall support a single deployable backend and a relational database.

The application should be designed so that expensive workloads, scheduled notifications, or other background operations can be separated later without rewriting the core domain model.

Premature microservices are not required.

---

# 10. Data Integrity and Edge Cases

The implementation shall explicitly address the following scenarios.

## 10.1 Scheduling

- A user attempts to create a zero-duration block.
- A user moves a block into an occupied time interval.
- A task is completed while a future block still exists.
- A task is deleted while it has scheduled blocks.
- A scheduled block is moved to a different date.
- A user changes their time zone.
- A user attempts to create or move a block so that it crosses midnight.
- Two browser sessions attempt to modify the same block.

## 10.2 Tasks

- A task has no priority.
- A task has no deadline.
- A deadline passes while the task remains incomplete.
- A category is deleted while tasks use it.
- A subtask is completed while the parent task remains active.
- A task is submitted twice because of a retry.
- An unauthorized user requests another user's task ID.

## 10.3 Habits

- A habit is paused.
- A habit is archived.
- A recurrence rule changes.
- A user changes a preferred time.
- A habit occurrence is completed twice.
- A missed occurrence is revisited.
- A user changes their time zone.
- A recurrence crosses a month or year boundary.

## 10.4 AI

- The provider returns malformed structured output.
- The provider times out.
- The transcript contains ambiguous dates.
- The transcript contains several tasks with different priorities.
- The user edits a draft before approval.
- The user removes one draft from a batch.
- A duplicate submission occurs.
- A draft references a category that no longer exists.
- The provider returns a task with an invalid duration.

The system shall handle these cases without silently corrupting persisted data.

---

# 11. User Interface Requirements

## 11.1 Global Navigation

The authenticated application shall provide access to:

- All Tasks.
- My Day.
- My Habits.
- Profile and settings.

The three primary productivity views shall remain clearly distinguishable.

## 11.2 All Tasks Interface

The page shall provide:

- Task list or table.
- Search and filters.
- Task creation action.
- AI transcript input.
- Task details and editing.
- Priority and category indicators.
- Deadline and scheduled-state indicators.
- Access to completed tasks.

The interface shall make it easy to distinguish task metadata from scheduling information.

## 11.3 My Day Interface

The page shall provide:

- Selected-date navigation.
- Chronological time grid.
- Scheduled blocks.
- Event blocks.
- Habit blocks.
- Drag-and-drop and resizing.
- Conflict warnings.
- Unscheduled-task access.
- A way to carry forward incomplete tasks.
- Daily scheduled-duration information.

## 11.4 My Habits Interface

The page shall provide:

- List of active habits.
- Habit creation and editing.
- Recurrence and scheduling controls.
- Completion history.
- Basic analytics.
- Pause and archive controls.

## 11.5 Authentication Interface

The application shall provide:

- Login screen.
- Registration screen.
- Google authentication action.
- Email verification screen.
- Password recovery flow.
- Profile setup or completion flow where needed.

Authentication errors shall be presented without unnecessarily exposing sensitive account information.

---

# 12. Testing Strategy

Testing shall be organized into three main levels.

## 12.1 Unit Tests

Backend unit tests shall cover:

- Priority and status validation.
- Deadline handling.
- Recurrence calculations.
- Habit occurrence generation.
- Scheduling interval validation.
- Overlap detection.
- AI response validation.
- Date and time zone conversion.

Frontend unit tests shall cover:

- Form validation.
- Task filters.
- Display logic.
- Calendar interaction helpers.
- Error and loading states.

## 12.2 Integration Tests

Integration tests shall cover:

- Database persistence.
- Task creation and editing.
- Scheduled-block creation and movement.
- Habit occurrence generation.
- Completion history.
- Authentication verification.
- Ownership enforcement.
- AI draft confirmation.
- Transactional batch creation.

Tests involving external providers shall use controlled mocks or test environments where appropriate.

## 12.3 End-to-End Tests

End-to-end tests shall verify complete user journeys.

### Journey A: Registration

1. A user registers with email and password.
2. The system sends a verification link.
3. The user opens the verification link.
4. The user gains access to the application.
5. The user refreshes the page and remains authenticated according to the session policy.

### Journey B: Task Scheduling

1. A user creates a task.
2. The task appears in All Tasks.
3. The user schedules it in My Day.
4. The scheduled block appears at the selected time.
5. The user moves the block.
6. The updated time persists after refreshing the page.

### Journey C: Habit Tracking

1. A user creates a daily habit.
2. The system creates or exposes the appropriate occurrence for the selected date.
3. The habit appears in My Day.
4. The user completes the occurrence.
5. My Habits displays the updated history and statistics.

### Journey D: AI Task Extraction

1. A user enters a transcript.
2. The AI returns a structured draft.
3. The user edits or removes one proposed task.
4. The user approves the remaining tasks.
5. The approved tasks appear in All Tasks.
6. Refreshing the application does not duplicate them.

### Journey E: Data Isolation

1. User A creates a task.
2. User B attempts to access that task.
3. The backend rejects the request.
4. User B cannot read, modify, delete, or schedule User A's task.

---

# 13. Acceptance Criteria

Second Brain v1 shall be considered ready for release when all mandatory criteria below are satisfied.

## Account Management

- Email signup and verification work.
- Google login works.
- Authenticated sessions behave correctly.
- Private endpoints enforce user ownership.
- Profile updates persist.

## Task Management

- Users can create, update, complete, reopen, and delete tasks.
- Priority, categories, deadlines, notes, and subtasks behave as specified.
- Search and filtering work.
- Overdue tasks remain accessible.
- Tasks persist across sessions.

## My Day

- Tasks, events, and habit occurrences appear on the appropriate dates.
- Scheduled blocks can be moved and resized.
- Schedule changes persist.
- Invalid intervals are rejected.
- Overlaps are detected and handled according to the defined policy.
- Moving a block does not silently modify a task deadline.

## My Habits

- Users can create and configure habits.
- Recurrence works across relevant dates.
- Occurrences are not duplicated.
- Completion updates the correct occurrence.
- Historical results remain consistent after future recurrence changes.

## AI

- Transcript input produces structured drafts.
- Invalid model output is rejected or safely handled.
- Users can review and edit drafts.
- Only approved drafts are persisted.
- AI failure does not prevent manual task management.

## Quality

- Required unit and integration tests pass.
- Critical end-to-end journeys pass.
- No known critical authorization vulnerabilities remain.
- The application handles expected errors without corrupting data.
- Deployment and setup instructions are complete.

---

# 14. Development Milestones

Development shall proceed in the following order.

## Milestone 1: Foundation

- Initialize the repository.
- Configure frontend and backend projects.
- Set up PostgreSQL.
- Configure database migrations.
- Define API conventions.
- Configure environment variables.
- Establish linting and automated testing.
- Implement the basic health-check endpoint.

**Exit criterion:** The application starts locally, connects to the database, and runs its initial tests.

## Milestone 2: Authentication and Profiles

- Configure the authentication provider.
- Implement email registration and verification.
- Implement Google authentication.
- Implement profile management.
- Enforce backend identity and ownership checks.
- Deploy a minimal walking skeleton (login, create a task, see it) to a real URL.

**Exit criterion:** Users can authenticate and access only their own protected workspace, and the walking skeleton is running in a deployed environment.

## Milestone 3: Core Task Management

- Implement task and subtask models.
- Implement categories.
- Implement CRUD endpoints.
- Implement search, sorting, and filtering.
- Build the All Tasks interface.
- Add task completion and deadline handling.

**Exit criterion:** All Tasks works independently of AI and calendar scheduling.

## Milestone 4: Scheduling and Events

- Implement events and task blocks.
- Build My Day.
- Implement timeline interactions.
- Add move and resize persistence.
- Implement overlap detection.
- Add unscheduled-task handling and overdue carryover.

**Exit criterion:** Users can plan and modify a daily schedule reliably.

## Milestone 5: Habits

- Implement habit definitions.
- Implement recurrence calculations.
- Implement habit occurrences.
- Integrate habits with My Day.
- Implement history and statistics.

**Exit criterion:** Habit completion and historical records remain correct across dates and recurrence changes.

## Milestone 6: AI Task Extraction

- Define the AI output schema.
- Implement model integration.
- Add response validation.
- Build the review interface.
- Implement approval and batch creation.
- Add error handling and duplicate-submission protection.

**Exit criterion:** A transcript can be converted into validated, user-approved tasks.

## Milestone 7: Hardening and Release

- Complete critical integration and end-to-end tests.
- Improve responsive design and accessibility.
- Test failure scenarios.
- Finalize production deployment.
- Verify secrets and access controls.
- Document setup, architecture, and operational procedures.

**Exit criterion:** The application satisfies the acceptance criteria and can be used reliably by individual users.

---

# 15. Future Enhancements

The following capabilities may be considered after v1 has been validated.

- Google Calendar synchronization.
- AI-assisted schedule recommendations.
- Automatic identification of available time slots.
- Scheduled reminders and notifications.
- Weekly planning and review.
- Advanced habit analytics, including weekly and monthly summaries.
- Mobile application.
- Calendar recurrence for events.
- Multiple work sessions for tasks.
- Import and export.
- Offline support.
- Natural-language editing of existing tasks.
- Advanced scheduling optimization.
- Account deletion.
- Habit recurrence expressed as a number of occurrences per week.
- Cross-midnight task blocks and events.
- Configurable time-grid density and planning-window comparison.
- Optimistic concurrency control.
- A full WCAG 2.2 AA audit.

These features shall not delay completion of the mandatory v1 requirements unless a new requirement is explicitly approved.

---

# 16. Assumptions and Decisions

The following assumptions form the initial baseline.

1. The initial product is a responsive web application.
2. The application serves individual users rather than teams.
3. PostgreSQL is the primary application database.
4. Authentication is handled by an established identity provider.
5. AI-generated tasks require user approval.
6. My Day is a date-specific time-blocked calendar.
7. Tasks, events, and habits are distinct domain concepts.
8. Task blocks are separate from the tasks they represent.
9. Habit history is retained independently of current recurrence settings.
10. The initial architecture is a modular monolith rather than a microservices system.

The following decisions are finalized for v1:

- Deadlines are stored as `due_date` plus an optional `due_time`, interpreted in the user's time zone. There is no `due_at` column.
- A task may have multiple task blocks. Completing a task keeps its blocks and marks them done.
- Overlaps produce a warning and are never blocked or auto-moved.
- Missed habit occurrences are derived at read time (past date and still pending). No background job is used.
- AI batch creation is atomic and protected by an idempotency key.
- Stored timestamps are UTC. Habit dates are local dates. If the user changes time zone, existing occurrences keep their date and only future occurrences use the new zone.
- Sessions use the Firebase ID token as a Bearer header verified by the backend. No cookies are used.
- The default block duration is 30 minutes when a task has no estimate.
- Date of birth is not collected.
- Email verification uses the authentication provider's built-in verification link.
- Task blocks and events cannot cross midnight.
- There is no polymorphic scheduled-block table. Tasks have task blocks; events and habit occurrences carry their own times.
- Habit recurrence is limited to daily or selected weekdays.
- Habit statistics are limited to total completed and completion rate over a period.
- Habit occurrences are generated idempotently for a rolling window (today plus 14 days) and on demand. Editing a habit regenerates only future pending occurrences.
- AI does not propose scheduling and does not create categories.
- Optimistic concurrency control is not included. Rate limiting applies to AI endpoints only.
- Account deletion is not included.

The following decisions must still be finalized during design and implementation:

- Exact password policy configuration.
- Whether events can be marked attended or completed.
- The selected calendar library and its licensing constraints.
- The deployment provider and operational limits.

Decisions shall be documented before they materially affect the database schema or API contracts.

---

# 17. Definition of Done

A feature is not complete merely because its interface renders.

A feature shall be considered complete when:

- Its requirements are implemented.
- Its data model and API behavior are defined.
- Backend validation is in place.
- Authorization is enforced.
- Loading, success, and error states are handled.
- Relevant tests pass.
- Changes persist correctly.
- Related application views remain consistent.
- The feature is documented where necessary.

The release shall be considered complete when all mandatory acceptance criteria in this specification have been satisfied.

---

# 18. Final Product Definition

Second Brain v1 is a personal productivity application that combines structured task management, interactive time-blocked planning, recurring habit tracking, and AI-assisted task capture in a unified workspace.

Its defining characteristics are:

- A single source of truth for productivity data.
- A clear separation between tasks, deadlines, and scheduled blocks.
- Reliable handling of recurring habits and historical completion.
- AI-assisted organization with explicit user control.
- Secure ownership of personal data.
- Consistent behavior across the application's three primary views.

The primary engineering objective is not to maximize the number of features. It is to deliver a coherent, reliable system in which task management, scheduling, habits, and AI work together without duplicating data or producing inconsistent results.

**Release principle:** Build the smallest complete version of Second Brain that reliably supports the full capture, organize, schedule, execute, and review workflow.
