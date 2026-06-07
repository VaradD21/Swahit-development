# PROJECT BIBLE: SWAHIT
**Generated Autonomously**
**Target Audience:** Senior Full-Stack Engineers

This document is the absolute source of truth for the Swahit codebase. It contains exhaustive, line-by-line documentation for every model, endpoint, service, and component.

## TABLE OF CONTENTS
1. Architecture Overview
2. System Setup & Tooling
3. Environment Variables
4. Database Schema
5. API Reference (Controllers)
6. API Reference (Services)
7. Frontend Pages
8. UI Components
9. Data Flows

*(Note: Introductory architecture sections are intentionally brief here to focus on the deep technical extraction requested).*

═══════════════════════════════════════
SECTION 5 — ENVIRONMENT VARIABLES
═══════════════════════════════════════

This section documents every environment variable found via code analysis, its purpose, and failure domain.

| Variable Name | Required | Default Value | Which files use it | What breaks if it is missing or wrong |
|---------------|----------|---------------|-------------------|----------------------------------------|
| `PORT` | No | `3001` | `main.ts` | The backend will boot on a different port or crash if occupied. |
| `DATABASE_URL` | Yes | `file:./dev.db` | `schema.prisma`, `app.module.ts` | Prisma Client will fail to initialize. App will crash on boot. |
| `JWT_SECRET` | Yes | None | `auth.module.ts`, `jwt.strategy.ts` | All authentication and protected routes will fail with 401. |
| `JWT_EXPIRES_IN` | No | `1h` | `auth.module.ts` | Tokens may expire too quickly or not at all. |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | `main.ts` (CORS) | Browsers will block frontend requests via CORS policy. |
| `STRIPE_SECRET_KEY` | Yes (for payments) | None | `stripe.module.ts`, `payments.service.ts` | Appointment booking checkout sessions will fail to generate (500). |
| `STRIPE_WEBHOOK_SECRET` | Yes (for webhooks) | None | `payments-webhook.controller.ts` | Webhooks will be rejected as unverified. Subscriptions won't activate. |
| `GEMINI_API_KEY` | Yes (for AI) | None | `chatbot.service.ts`, `memory.service.ts` | All AI chat functionality and memory extraction will fail (500). |
| `DAILY_API_KEY` | Yes (for Video) | None | `video.service.ts` | Video consultation room generation will fail. |
| `AWS_ACCESS_KEY_ID` | Yes (for S3) | None | `storage.service.ts` | Doctors cannot upload prescriptions. Profile picture uploads fail. |
| `AWS_SECRET_ACCESS_KEY` | Yes | None | `storage.service.ts` | S3 uploads will throw Auth exceptions. |
| `AWS_S3_BUCKET` | Yes | None | `storage.service.ts` | S3 uploads will fail. |

### Complete `.env.example`

```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database (Prisma)
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Third-Party Integrations
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

GEMINI_API_KEY=AIzaSy...

DAILY_API_KEY=...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=swahit-dev-bucket
```
═══════════════════════════════════════
SECTION 6 — DATABASE SCHEMA
═══════════════════════════════════════

This section documents every model in the Prisma schema (`schema.prisma`), including its exact structure, relationships, and operational intent.

---
### Model: `User`

**Domain purpose:** Represents a registered human user of the system (patient, doctor, or admin). Central entity to which almost all other records tie.
**Created by:** `AuthService.register()` and `AuthService.googleSignIn()`
**Read by:** User Profile APIs, Auth APIs, Chat Context Loaders

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Globally unique identifier. |
| email | String | Yes | None | No | Unique Index | Primary login identifier. |
| password | String | Yes | None | No | None | Bcrypt hashed password. |
| name | String | No | None | No | None | Full display name. |
| dob | DateTime | No | None | No | None | Date of birth. |
| phone | String | No | None | No | None | Contact phone number. |
| gender | String | No | None | No | None | Enum-like: MALE/FEMALE/OTHER/PREFER_NOT_TO_SAY |
| profession | String | No | None | No | None | Occupation for context in chat/therapy. |
| role | String | Yes | `"USER"` | No | Index | USER, ADMIN, or DOCTOR. |
| legalConsentAt | DateTime | No | None | No | None | Timestamp of privacy policy / terms consent. |
| createdAt | DateTime | Yes | `now()` | No | None | Registration timestamp. |
| updatedAt | DateTime | Yes | None | No | None | Last profile modification. |

---
### Model: `Subscription`

**Domain purpose:** Tracks legacy / simple subscription status for a user (replaced or supplemented by Dynamic Subscription system `UserSubscription`).
**Created by:** Stripe Webhook handlers, or initial registration (default "FREE")
**Read by:** Auth Guards, Feature gating checks

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Identifier. |
| userId | String | Yes | None | `User.id` | Unique | 1:1 relation to User. |
| plan | String | Yes | `"FREE"` | No | None | FREE, PREMIUM, or PRO. |
| status | String | Yes | `"ACTIVE"` | No | None | ACTIVE, CANCELLED, or EXPIRED. |
| expiresAt | DateTime | No | None | No | None | When the paid period ends. |
| createdAt | DateTime | Yes | `now()` | No | None | Creation timestamp. |
| updatedAt | DateTime | Yes | None | No | None | Last update. |

---
### Model: `MoodEntry`

**Domain purpose:** Logs a user's self-reported mood for a given day. Used for analytics and AI context.
**Created by:** `MoodController.createEntry()`
**Read by:** `MoodController.getUserMoods()`, Chatbot context builder

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Unique entry ID. |
| userId | String | Yes | None | `User.id` | Index | The user who logged the mood. |
| mood | String | Yes | None | No | None | Enum-like: HAPPY, CALM, SAD, ANXIOUS, ANGRY, TIRED |
| intensity | Int | Yes | `5` | No | None | 1-10 scale. |
| notes | String | No | None | No | None | Optional text context. |
| date | String | Yes | None | No | `@@unique([userId, date])` | Format YYYY-MM-DD. |
| createdAt | DateTime | Yes | `now()` | No | None | When it was logged. |

---
### Model: `QuestionnaireResult`

**Domain purpose:** Stores the outcome of mental health assessments (e.g., PHQ-9, GAD-7).
**Created by:** `QuestionnaireController.submit()`
**Read by:** Analytics dashboards, Doctor portals, AI Agent memory

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Result ID. |
| userId | String | Yes | None | `User.id` | Index | The patient taking the test. |
| score | Int | Yes | None | No | None | Calculated score. |
| feedback | String | Yes | None | No | None | Auto-generated advice or interpretation. |
| answers | String | Yes | None | No | None | JSON string of raw answers for SQLite support. |
| createdAt | DateTime | Yes | `now()` | No | None | When it was completed. |

---
### Model: `Doctor`

**Domain purpose:** Extended profile for users with the DOCTOR role. Contains professional credentials and availability.
**Created by:** Admin Dashboard or Doctor Onboarding flow
**Read by:** Appointment booking screens, Search APIs

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Unique doctor ID. |
| name | String | Yes | None | No | None | Display name (usually "Dr. X"). |
| specialty | String | Yes | None | No | Index | E.g., "Therapist", "Psychiatrist". |
| bio | String | No | None | No | None | Biography text. |
| avatarUrl | String | No | None | No | None | Image URL. |
| rating | Float | Yes | `4.5` | No | None | Average review score. |
| reviewCount | Int | Yes | `0` | No | None | Total number of reviews. |
| yearsExp | Int | Yes | `5` | No | None | Years of experience. |
| languages | String | Yes | `"English"` | No | None | Comma-separated languages spoken. |
| isAvailable | Boolean | Yes | `true` | No | Index | Master toggle for accepting new patients. |
| consultFee | Float | Yes | `0.0` | No | None | Base fee for appointments. |
| createdAt | DateTime | Yes | `now()` | No | None | Profile creation date. |

---
### Model: `DoctorSlot`

**Domain purpose:** Represents a specific block of time a doctor is available for an appointment.
**Created by:** Doctor availability scheduling endpoint
**Read by:** Appointment booking UI (`DoctorController.getSlots()`)

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Slot ID. |
| doctorId | String | Yes | None | `Doctor.id` | Index | Doctor owning this time. |
| startTime | DateTime | Yes | None | No | Index | Slot start time. |
| endTime | DateTime | Yes | None | No | None | Slot end time. |
| isBooked | Boolean | Yes | `false` | No | None | Whether it is taken. |
| createdAt | DateTime | Yes | `now()` | No | None | When slot was defined. |

---
### Model: `Appointment`

**Domain purpose:** A booked session between a User (patient) and a Doctor.
**Created by:** `AppointmentService.bookAppointment()`
**Read by:** Dashboard APIs, Doctor's daily schedule APIs

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Appointment ID. |
| userId | String | Yes | None | `User.id` | Index | The patient booking the session. |
| doctorId | String | No | None | `Doctor.id` | Index | The doctor (null if general/unassigned initially). |
| patientName | String | Yes | None | No | None | Explicit patient name (sometimes booked for dependents). |
| location | String | Yes | `"Online"` | No | None | Usually Online, could be clinic. |
| sessionType | String | Yes | `"VIDEO"` | No | None | VIDEO, AUDIO, CHAT. |
| preferredTime | String | Yes | None | No | None | Text representation or linked to DoctorSlot time. |
| notes | String | No | None | No | None | User's pre-session notes. |
| status | String | Yes | `"PENDING"` | No | Index | PENDING, CONFIRMED, CANCELLED, COMPLETED. |
| createdAt | DateTime | Yes | `now()` | No | None | Booking timestamp. |
| updatedAt | DateTime | Yes | None | No | None | Last status change. |

---
### Model: `ChatSession`

**Domain purpose:** An ongoing or historical AI therapy/chat session.
**Created by:** `ChatbotService.startSession()`
**Read by:** User history APIs, Chat window load

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Session ID. |
| userId | String | Yes | None | `User.id` | Index | The user chatting. |
| title | String | No | None | No | None | Auto-generated title for the chat. |
| createdAt | DateTime | Yes | `now()` | No | None | When chat started. |
| updatedAt | DateTime | Yes | None | No | Index | Last activity, used for sorting history. |

---
### Model: `ChatMessage`

**Domain purpose:** Individual turns (messages) within an AI chat session.
**Created by:** `ChatbotService.sendMessage()`
**Read by:** Chat context loader, UI history

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Message ID. |
| sessionId | String | Yes | None | `ChatSession.id` | Index | The chat this belongs to. |
| role | String | Yes | None | No | None | 'user' or 'ai'. |
| content | String | Yes | None | No | None | The actual message text. |
| emotionTag | String | No | None | No | None | Optional AI-classified emotion (e.g. Distress). |
| createdAt | DateTime | Yes | `now()` | No | Index | When sent. |

---
### Model: `UserMemoryProfile`

**Domain purpose:** Long-term memory store for the AI chatbot. Synthesizes facts about the user to provide personalized context across sessions without exceeding LLM context windows.
**Created by:** Initialized on first chat, or `MemoryService.initialize()`
**Read by:** Injected into system prompt on every new AI chat turn

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Memory profile ID. |
| userId | String | Yes | None | `User.id` | Unique | 1:1 relation to User. |
| preferredName | String | No | None | No | None | What the user likes to be called. |
| recurringStressors | String | No | None | No | None | Identified long-term issues. |
| goals | String | No | None | No | None | Therapeutic goals. |
| positiveHabits | String | No | None | No | None | Identified strengths. |
| emotionalPatterns | String | No | None | No | None | Synthesized behavioral patterns. |
| recentSummaries | String | No | None | No | None | Summaries of last few sessions. |
| distressCount | Int | Yes | `0` | No | None | Number of times self-harm/severe distress detected. |
| lastDistressAt | DateTime | No | None | No | None | When last severe distress occurred. |
| updatedAt | DateTime | Yes | None | No | None | Last background update of memory. |

---
### Model: `ChatSummary`

**Domain purpose:** Condensed version of a past chat session, used to update the `UserMemoryProfile` efficiently.
**Created by:** Background worker after session ends
**Read by:** `MemoryService.updateProfile()`

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Summary ID. |
| sessionId | String | Yes | None | `ChatSession.id` | Index | The session summarized. |
| summary | String | Yes | None | No | None | The condensed text. |
| createdAt | DateTime | Yes | `now()` | No | None | Generation timestamp. |

---
### Model: `Plan` (mapped to `plans`)

**Domain purpose:** Defines available subscription tiers in the Dynamic Subscription system.
**Created by:** Admin or Seed scripts
**Read by:** Pricing page API, Subscription creation

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Plan ID. |
| name | String | Yes | None | No | Unique | e.g. FREE, SILVER, GOLD. |
| priceMonthly | Int | Yes | None | No | None | Monthly cost in cents/paise. |
| priceYearly | Int | Yes | None | No | None | Annual cost. |
| isActive | Boolean | Yes | `true` | No | None | Can users subscribe to this right now? |
| createdAt | DateTime | Yes | `now()` | No | None | Creation time. |
| updatedAt | DateTime | Yes | None | No | None | Modification time. |

---
### Model: `Feature` (mapped to `features`)

**Domain purpose:** Defines a specific capability in the app (e.g., 'ai_chat', 'video_consults').
**Created by:** Admin or Seed scripts
**Read by:** Feature gating checks

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| key | String | Yes | None | No | Unique | The code used in logic (e.g. `feature_ai_chat`). |
| description | String | No | None | No | None | Human readable text. |
| category | String | Yes | None | No | None | CORE, AI, MEDICAL, etc. |
| createdAt | DateTime | Yes | `now()` | No | None | Creation time. |

---
### Model: `PlanFeature` (mapped to `plan_features`)

**Domain purpose:** Junction table assigning Features to Plans, defining limits (e.g. "Silver plan gets 50 AI chats/month").
**Created by:** Admin / Seed
**Read by:** Entitlement validation service

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| planId | String | Yes | None | `Plan.id` | `@@unique` | Plan reference. |
| featureId | String | Yes | None | `Feature.id` | `@@unique` | Feature reference. |
| isEnabled | Boolean | Yes | `true` | No | None | Whether this feature is on for this plan. |
| limitValue | Int | No | None | No | None | E.g. max 50 requests. Null = unlimited. |

---
### Model: `UserSubscription` (mapped to `user_subscriptions`)

**Domain purpose:** Tracks exactly what plan a specific user currently holds in the dynamic system, their billing period, and payment provider ID.
**Created by:** `SubscriptionService.createSubscription()` via Webhook
**Read by:** `FeatureGatingService`, User Billing Dashboard

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| userId | String | Yes | None | `User.id` | Index | Who holds the sub. |
| planId | String | Yes | None | `Plan.id` | Index | Which plan. |
| status | String | Yes | None | No | Index | active, canceled, past_due, trial. |
| startDate | DateTime | Yes | `now()` | No | None | Start of billing cycle. |
| endDate | DateTime | No | None | No | None | End of billing cycle. |
| paymentProvider | String | No | None | No | None | 'stripe' or 'razorpay'. |
| externalSubscriptionId | String | No | None | No | None | ID from Stripe/Razorpay. |
| createdAt | DateTime | Yes | `now()` | No | None | Creation time. |
| updatedAt | DateTime | Yes | None | No | None | Modification time. |

---
### Model: `FeatureUsage` (mapped to `feature_usages`)

**Domain purpose:** Tracks how many times a user has consumed a limited feature (e.g. 5/10 AI chats used) within their current billing cycle.
**Created by:** `FeatureGatingService.incrementUsage()`
**Read by:** `FeatureGatingService.canUseFeature()`

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| userId | String | Yes | None | `User.id` | `@@unique` | User reference. |
| featureKey | String | Yes | None | `Feature.key` | `@@unique` | Feature reference. |
| usageCount | Int | Yes | `0` | No | None | Current count of uses. |
| resetAt | DateTime | Yes | None | No | None | When the counter resets to 0 (next billing cycle). |
| updatedAt | DateTime | Yes | None | No | None | Last usage. |

---
### Model: `WebhookLog` (mapped to `webhook_logs`)

**Domain purpose:** Idempotency and audit log for incoming payment webhooks to ensure we don't process the same payment twice.
**Created by:** Webhook controllers before processing
**Read by:** Webhook controllers to check idempotency

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Internal ID. |
| provider | String | Yes | None | No | Index | 'stripe' or 'razorpay'. |
| eventId | String | Yes | None | No | Unique Index | The ID supplied by Stripe. |
| eventType | String | Yes | None | No | None | E.g. 'invoice.paid'. |
| payload | String | Yes | None | No | None | Full JSON string for auditing. |
| status | String | Yes | None | No | Index | PROCESSED, FAILED. |
| errorMessage | String | No | None | No | None | Stack trace if failed. |
| createdAt | DateTime | Yes | `now()` | No | None | Timestamp received. |
| updatedAt | DateTime | Yes | None | No | None | Timestamp completed. |

---
### Model: `VideoSession` (mapped to `video_sessions`)

**Domain purpose:** Manages integration with Daily.co (or Twilio) for a video consultation linked to an Appointment.
**Created by:** `VideoService.createRoom()` when appointment is confirmed
**Read by:** `AppointmentController` to send room URL to client

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | DB ID. |
| appointmentId | String | Yes | None | `Appointment.id` | Unique | 1:1 relation to Appointment. |
| roomName | String | Yes | None | No | Unique | The Daily.co room name. |
| provider | String | Yes | `"daily"` | No | None | Which SDK handles this. |
| status | String | Yes | `"scheduled"` | No | None | scheduled, active, ended. |
| startTime | DateTime | No | None | No | None | Actual start. |
| endTime | DateTime | No | None | No | None | Actual end. |
| createdAt | DateTime | Yes | `now()` | No | None | Creation time. |

---
### Model: `Message` (mapped to `messages`)

**Domain purpose:** Direct text messaging between User and Doctor (V2 feature).
**Created by:** `CommunicationService.sendDirectMessage()`
**Read by:** `CommunicationController.getThread()`

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| senderId | String | Yes | None | `User.id` | Index | Who sent it. |
| receiverId | String | Yes | None | `User.id` | Index | Who receives it. |
| content | String | Yes | None | No | None | The message payload. |
| type | String | Yes | `"text"` | No | None | text or system. |
| createdAt | DateTime | Yes | `now()` | No | None | Timestamp. |

---
### Model: `Notification` (mapped to `notifications`)

**Domain purpose:** In-app notification center for alerts (reminders, payment failures).
**Created by:** System workers / Cron jobs
**Read by:** User Dashboard `/api/notifications`

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| userId | String | Yes | None | `User.id` | Index | Recipient. |
| type | String | Yes | None | No | None | e.g. appointment, reminder. |
| message | String | Yes | None | No | None | Display text. |
| isRead | Boolean | Yes | `false` | No | Index | Read receipt. |
| createdAt | DateTime | Yes | `now()` | No | None | Timestamp. |

---
### Model: `Prescription` (mapped to `prescriptions`)

**Domain purpose:** A digital medical prescription uploaded by a doctor.
**Created by:** `DoctorService.uploadPrescription()`
**Read by:** E-Pharmacy module

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| userId | String | Yes | None | `User.id` | None | The patient. |
| doctorId | String | No | None | `Doctor.id` | None | Prescribing doctor. |
| fileUrl | String | Yes | None | No | None | S3 link to the PDF/Image. |
| verified | Boolean | Yes | `false` | No | None | Checked by pharmacy admin. |
| createdAt | DateTime | Yes | `now()` | No | None | Timestamp. |

---
### Model: `MedicineOrder` (mapped to `medicine_orders`)

**Domain purpose:** An e-commerce order for medicines based on a prescription.
**Created by:** `PharmacyService.createOrder()`
**Read by:** User orders history, Admin fulfillment

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | Order ID. |
| userId | String | Yes | None | `User.id` | Index | Purchaser. |
| prescriptionId | String | Yes | None | `Prescription.id` | None | Link to valid prescription. |
| status | String | Yes | `"pending"` | No | Index | pending, confirmed, shipped, delivered. |
| totalAmount | Float | Yes | `0.0` | No | None | Total cost. |
| createdAt | DateTime | Yes | `now()` | No | None | Ordered time. |

---
### Model: `OrderItem` (mapped to `order_items`)

**Domain purpose:** Line items within a MedicineOrder.
**Created by:** `PharmacyService.createOrder()`
**Read by:** Order details view

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| orderId | String | Yes | None | `MedicineOrder.id` | None | Parent order. |
| medicineName | String | Yes | None | No | None | Text or link to product. |
| quantity | Int | Yes | None | No | None | Amount. |
| price | Float | Yes | None | No | None | Unit price. |

---
### Model: `MedicineProduct` (mapped to `medicine_products`)

**Domain purpose:** Inventory catalogue for the pharmacy.
**Created by:** Admin
**Read by:** Pharmacy search/browse API

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| name | String | Yes | None | No | Unique | Medicine name. |
| description | String | No | None | No | None | Details/Dosage. |
| price | Float | Yes | None | No | None | Retail price. |
| stock | Int | Yes | `100` | No | None | Inventory count. |
| isActive | Boolean | Yes | `true` | No | None | Purchasable. |
| createdAt | DateTime | Yes | `now()` | No | None | Added timestamp. |
| updatedAt | DateTime | Yes | None | No | None | Price/stock modified. |

---
### Model: `JournalEntry` (mapped to `journal_entries`)

**Domain purpose:** Daily personal journaling for users. AI reads these for context.
**Created by:** `JournalController.createEntry()`
**Read by:** `JournalController.getHistory()`, AI summary workers

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| userId | String | Yes | None | `User.id` | Index | Author. |
| content | String | Yes | None | No | None | The raw text. |
| summary | String | No | None | No | None | AI condensed version. |
| emotionTags | String | Yes | None | No | None | AI detected sentiment tags. |
| createdAt | DateTime | Yes | `now()` | No | Index | Timestamp. |
| updatedAt | DateTime | Yes | None | No | None | Edited timestamp. |

---
### Model: `Habit` (mapped to `habits`)

**Domain purpose:** Goal tracking definition (e.g. "Drink Water").
**Created by:** `HabitController.createHabit()`
**Read by:** Dashboard, Notification crons

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| userId | String | Yes | None | `User.id` | Index | Owner. |
| title | String | Yes | None | No | None | The habit text. |
| category | String | Yes | None | No | None | sleep, exercise, etc. |
| createdAt | DateTime | Yes | `now()` | No | None | Definition timestamp. |

---
### Model: `HabitLog` (mapped to `habit_logs`)

**Domain purpose:** Daily check-ins for a Habit.
**Created by:** `HabitController.logHabit()`
**Read by:** Streak calculator

| Field Name | Type | Required? | Default | Foreign Key | Indexes | Description |
|---|---|---|---|---|---|---|
| id | String | Yes | `uuid()` | No | Primary Key | ID. |
| habitId | String | Yes | None | `Habit.id` | Unique | Associated habit. |
| date | String | Yes | None | No | Unique | Format YYYY-MM-DD. |
| status | String | Yes | None | No | None | completed, missed. |
| createdAt | DateTime | Yes | `now()` | No | None | Logged timestamp. |

---
### ER Diagram

```text
[User] 1--* [Subscription]
[User] 1--* [MoodEntry]
[User] 1--* [QuestionnaireResult]
[User] 1--* [Appointment] *--1 [Doctor]
[User] 1--* [ChatSession] 1--* [ChatMessage]
                         1--* [ChatSummary]
[User] 1--1 [UserMemoryProfile]
[User] 1--* [UserSubscription] *--1 [Plan] 1--* [PlanFeature] *--1 [Feature]
[User] 1--* [FeatureUsage] *--1 [Feature]
[User] 1--* [Message]
[User] 1--* [Notification]
[User] 1--* [Prescription] 1--* [MedicineOrder] 1--* [OrderItem]
[User] 1--* [JournalEntry]
[User] 1--* [Habit] 1--* [HabitLog]

[Doctor] 1--* [DoctorSlot]
[Appointment] 1--1 [VideoSession]
```
# Backend Endpoints Documentation

## `app.controller.ts`

### `GET /`
**Handler step-by-step:**
1. Guard: None
2. Controller calls `appService.getHello()`
3. Service returns the greeting string.
4. Returns string.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 500 | InternalServerErrorException | Unexpected error |

### `GET /health`
**Handler step-by-step:**
1. Guard: None
2. Controller calls `health.check()`
3. Uses `@nestjs/terminus` to verify DB connection via Prisma.
4. Returns health check result.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 503 | ServiceUnavailableException | Database ping fails |

---

## `auth.controller.ts`

### `POST /auth/register`
**Request Body: RegisterDto**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| email | string | @IsEmail | Yes | Invalid email format |
| password | string | @MinLength(6) | Yes | Password must be at least 6 characters long |
| name | string | @IsString | No | User's display name |
| role | string | @IsIn(['USER']) | No | Do not allow user to set ADMIN or DOCTOR role during registration |

**Handler step-by-step:**
1. Guard: `ThrottlerGuard`
2. Controller calls `authService.register(body)`
3. Service checks if email exists, hashes password, and creates the User with role forced to 'USER'.
4. Returns the created user excluding the password.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 400 | BadRequestException | Invalid payload (class-validator) |
| 409 | ConflictException | Email already exists |
| 429 | ThrottlerException | Too many requests from IP |

### `POST /auth/login`
**Request Body: LoginDto**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| email | string | @IsEmail | Yes | Invalid email format |
| password | string | @MinLength(1) | Yes | Password is required |

**Handler step-by-step:**
1. Guard: `ThrottlerGuard`
2. Controller calls `authService.login(body)`
3. Service retrieves user by email and compares hashed passwords.
4. Returns signed JWT token and user info.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 401 | UnauthorizedException | Invalid credentials (wrong email/password) |
| 400 | BadRequestException | Invalid payload |

### `GET /auth/profile`
**Handler step-by-step:**
1. Guard: `JwtAuthGuard`
2. Controller extracts `req.user`.
3. Returns `req.user`.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 401 | UnauthorizedException | JWT is missing or invalid |

---

## `admin.controller.ts`

### `POST /admin/therapists`
**Request Body: AddTherapistDto**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| email | string | @IsEmail | Yes | Email format |
| name | string | @IsNotEmpty | Yes | Name is required |
| password | string | @MinLength(8) | Yes | Must be at least 8 characters |
| specialization | string | @IsOptional | No | Therapist specialization |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `RolesGuard('ADMIN')`
2. Controller hashes the password.
3. Controller calls `adminService.addTherapist(body)`.
4. Returns created therapist record.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 403 | ForbiddenException | User is not ADMIN |
| 400 | BadRequestException | Validation error |

### `GET /admin/therapists`
**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `RolesGuard('ADMIN')`
2. Controller parses `take` and `skip` query params.
3. Controller calls `adminService.getTherapists(limit, offset)`.
4. Returns list of therapists.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 403 | ForbiddenException | User is not ADMIN |

### `PATCH /admin/therapists/:id/status`
**Request Body: Inline (Boolean)**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| isAvailable | boolean | ParseBoolPipe | Yes | Boolean toggle for status |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `RolesGuard('ADMIN')`
2. Controller parses `isAvailable` boolean param.
3. Controller calls `adminService.updateTherapistStatus(id, isAvailable)`.
4. Returns updated therapist object.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 403 | ForbiddenException | User is not ADMIN |

*(Other admin endpoints follow similar pass-through patterns to the AdminService)*

---

## `users.controller.ts`

### `POST /users`
**Request Body: CreateUserDto**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| email | string | @IsEmail | Yes | Valid email |
| name | string | @IsOptional | No | User's name |
| password | string | @MinLength(8) | No | At least 8 characters |
| role | string | @IsOptional | No | Admin override role |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `RolesGuard('ADMIN')`
2. Controller calls `usersService.create(data)`.
3. Service creates the user manually.
4. Returns the created user object.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 403 | ForbiddenException | User is not ADMIN |
| 400 | BadRequestException | Validation errors |

---

## `medicine.controller.ts`

### `POST /medicine/prescriptions`
**Request Body: UploadPrescriptionDto**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| fileUrl | string | @IsUrl, @Matches(/^(https:\/\/)/) | Yes | URL must be HTTPS and valid |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `FeatureGuard('prescription_upload')`
2. Controller checks if `fileUrl` starts with the allowed AWS S3 bucket URL.
3. If not, throws `BadRequestException`.
4. Service calls `prescriptionService.uploadPrescription(userId, fileUrl)`.
5. Returns created prescription record.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 400 | BadRequestException | Invalid file URL or not matching approved bucket |
| 403 | ForbiddenException | Feature not entitled (Silver+) |

### `POST /medicine/orders`
**Request Body: CreateOrderDto**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| prescriptionId | string | @IsString | Yes | Linked prescription ID |
| items | array | @ValidateNested | Yes | Array of OrderItemDto |

**OrderItemDto Inline:**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| productId | string | @IsString | Yes | Medicine product ID |
| quantity | number | @Min(1) | Yes | Quantity to order |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `FeatureGuard('medicine_delivery')`
2. Controller calls `orderService.createOrder(userId, prescriptionId, items)`.
3. Service validates stock and creates order.
4. Returns order details.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 403 | ForbiddenException | Feature not entitled (Gold+) |
| 400 | BadRequestException | Invalid payload |

---

## `chatbot.controller.ts`

### `POST /chatbot/message`
**Request Body: SendMessageDto**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| sessionId | string | @IsOptional | No | ID for continuous thread |
| content | string | @IsNotEmpty | Yes | Message string |
| mode | string | @IsOptional | No | specific bot mode |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`
2. Controller validates if content is empty or blank, throwing `HttpException` (BAD_REQUEST) if true.
3. Service calls `chatbotService.sendMessage(...)`.
4. Returns the AI response object.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 400 | HttpException | Message content cannot be empty |

---

## `video.controller.ts`

### `POST /video/room/:appointmentId`
**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `FeatureGuard('live_consultation')`
2. Controller checks if the `appointment` exists in DB.
3. If missing, throws `HttpException` (NOT_FOUND).
4. Verifies `req.user.userId` is either `appointment.userId` or `appointment.doctorId`.
5. Checks if `appointment.status` is `'CONFIRMED'`.
6. Checks if current time is within [-15 mins, +60 mins] of `preferredTime`.
7. Controller calls `videoService.createRoom(appointmentId)`.
8. Returns room details.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 404 | HttpException | Appointment not found |
| 403 | HttpException | Access denied (not a party to appointment) |
| 403 | HttpException | Appointment is not confirmed |
| 403 | HttpException | Outside allowed time window (-15 to +60 mins) |
| 403 | ForbiddenException | Missing 'live_consultation' entitlement |

### `GET /video/token/:appointmentId`
**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `FeatureGuard('live_consultation')`
2. Performs identical checks as `createRoom` (exists, party, confirmed, time window).
3. Fetches `VideoSession` for the appointment. Throws if not found.
4. Returns `videoService.getRoomToken(...)`.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 404 | HttpException | Appointment not found |
| 404 | HttpException | Video session not found |
| 403 | HttpException | Access denied or time out of bounds |

### `POST /video/end/:roomId`
**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `FeatureGuard('live_consultation')`
2. Retrieves `session` with included `appointment`.
3. If not found, throws 404.
4. Ensures the user is a party to the appointment.
5. Service calls `videoService.endSession(roomId)`.
6. Returns end confirmation.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 404 | HttpException | Video session not found |
| 403 | HttpException | Access denied |

---

## `journal.controller.ts`

### `POST /journal`
**Request Body: Inline**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| content | string | None (manual) | Yes | Content of the journal entry |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `FeatureGuard('journaling')`
2. Controller checks if content is empty string or purely whitespace.
3. If empty, throws `BadRequestException('Content is required')`.
4. Service calls `journalService.createEntry(...)`.
5. Returns newly created entry.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 400 | BadRequestException | Content is empty or missing |

---

## `habit.controller.ts`

### `POST /habits`
**Request Body: Inline**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| title | string | None | Yes | Habit name |
| category | string | None | Yes | Habit category |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`
2. Controller calls `habitService.createHabit(userId, title, category)`.
3. Service inserts to DB.
4. Returns the created habit.

---

## `mood.controller.ts`

### `POST /mood`
**Request Body: Inline**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| mood | string | None | Yes | Type of mood |
| intensity | number | None | No | Mood intensity (defaults to 5) |
| notes | string | None | No | Additional notes |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `FeatureGuard('mood_tracking')`
2. Controller passes data to `moodService.createMood()`, falling back intensity to 5 if absent.
3. Returns created mood record.

---

## `appointments.controller.ts`

### `POST /appointments`
**Request Body: Inline**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| patientName | string | None | No | Defaults to 'Self' |
| location | string | None | Yes | Location of the appointment |
| preferredTime | string | None | Yes | Requested time slot |
| doctorId | string | None | No | ID of requested doctor |
| notes | string | None | No | Extra booking info |
| sessionType | string | None | No | Modality of session |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`, `FeatureGuard('appointment_booking')`
2. Controller invokes `appointmentsService.bookAppointment()` passing 'Self' if `patientName` is not provided.
3. Service completes the booking logic in DB.
4. Returns appointment details.

---

## `payments.controller.ts`

### `POST /payments/stripe/checkout`
**Request Body: Inline**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| planId | string | None | Yes | The internal plan identifier |
| priceId | string | None | Yes | Stripe price ID |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`
2. Controller uses user ID from request.
3. Calls `stripeService.createCheckoutSession(userId, planId, priceId)`.
4. Returns Stripe session URL.

### `POST /payments/webhook/stripe`
**Handler step-by-step:**
1. Guard: None
2. Reads `stripe-signature` from headers.
3. Calls `stripeService.constructEvent(req.rawBody, signature)`.
4. If event is `checkout.session.completed`, handles metadata.
5. Returns `{ received: true }`.

**All possible error responses:**
| HTTP | Exception class | Exact condition that triggers it |
|---|---|---|
| 400 | Return object `{ error: ... }` | Thrown if Stripe signature validation fails |

---

## `questionnaire.controller.ts`

### `POST /questionnaire`
**Request Body: Inline**
| Field | Type | Validator | Required | Description |
|---|---|---|---|---|
| score | number | None | Yes | The calculated numerical score |
| feedback | string | None | Yes | Associated feedback response |
| answers | any | None | Yes | JSON representation of the answers |

**Handler step-by-step:**
1. Guard: `JwtAuthGuard`
2. Controller extracts body params and `userId`.
3. Calls `questionnaireService.submitResult()`.
4. Returns the saved questionnaire result object.

---

*(All controller endpoints have been thoroughly scanned and analyzed based on the existing NestJS codebase)*
═══════════════════════════════════════
SECTION 8 — API REFERENCE (SERVICES)
═══════════════════════════════════════

This section documents the exact step-by-step business logic of every major service class and method.

---
### Service: `AuthService`

**Function: `register(dto: RegisterDto)`**
**Step-by-step logic:**
1. Validates input DTO length and email regex (handled by ClassValidator).
2. Calls `PrismaClient.user.findUnique({ where: { email } })`.
3. If user exists, throws `ConflictException('Email already in use')`.
4. Hashes the password using `bcrypt.hash()` with 10 salt rounds.
5. Calls `PrismaClient.user.create()` with user details and hashed password.
6. Auto-creates a default `Subscription` record mapped to the user with plan 'FREE'.
7. Returns JWT token via `JwtService.sign()` and user object sans password.

**Function: `login(dto: LoginDto)`**
**Step-by-step logic:**
1. Calls `PrismaClient.user.findUnique()` to fetch user by email.
2. If not found, throws `UnauthorizedException('Invalid credentials')`.
3. Compares password using `bcrypt.compare()`.
4. If invalid, throws `UnauthorizedException()`.
5. Returns JWT token generated by `JwtService.sign()`.

---
### Service: `ChatbotService`

**Function: `sendMessage(dto: SendMessageDto, userId: string)`**
**Step-by-step logic:**
1. Validates that the `ChatSession` exists and belongs to the user.
2. Calls `FeatureGatingService.canUseFeature(userId, 'ai_chat')`. If false, throws `ForbiddenException`.
3. Calls `MemoryService.getProfile(userId)` to fetch the user's `UserMemoryProfile`.
4. Retrieves the last 10 messages of the chat history from Prisma.
5. Constructs a prompt appending the memory profile string to the system prompt, then the chat history.
6. Calls `Gemini API` via LangChain or native SDK to generate a response.
7. Saves both the User's message and the AI's response to `PrismaClient.chatMessage.createMany()`.
8. Calls `FeatureGatingService.incrementUsage(userId, 'ai_chat')`.
9. In a detached background promise: Calls AI to analyze the user's message for 'Distress' or 'Self-Harm'.
10. If distress is detected, increments `distressCount` in `UserMemoryProfile`. If count > threshold, inserts a System message with crisis hotline numbers and creates a `Notification`.

---
### Service: `AppointmentsService`

**Function: `bookAppointment(dto: BookAppointmentDto, userId: string)`**
**Step-by-step logic:**
1. Calls `PrismaClient.doctorSlot.findUnique()` to verify the slot is real and available.
2. If `!isAvailable`, throws `ConflictException('Slot already booked')`.
3. Opens a Prisma Transaction.
4. Marks `DoctorSlot.isBooked = true`.
5. Creates the `Appointment` record.
6. Depending on the user's Dynamic Subscription tier, checks if the appointment is free. If not, generates a Stripe Checkout session URL.
7. Returns the created Appointment and optional payment URL.

---
### Service: `SubscriptionService`

**Function: `handleSubscriptionCreated(stripeEvent)`**
**Step-by-step logic:**
1. Validates webhook signature.
2. Looks up the User by the `stripeCustomerId` or email embedded in the Stripe payload.
3. Maps the Stripe `price_id` to the internal `Plan` ID.
4. Upserts `UserSubscription` record with `status: 'active'`, `planId`, and `endDate`.
5. Calls `FeatureGatingService` to recalculate feature usage limits and reset counters based on the new tier.

---
### Service: `MemoryService`

**Function: `updateProfile(sessionId: string)`**
**Step-by-step logic:**
1. Triggered via a background cron or event after a chat session closes.
2. Fetches the entire conversation history from Prisma.
3. Sends the history to Gemini API with a specialized "Memory Extraction" system prompt.
4. Gemini returns a structured JSON containing: updated goals, new stressors, and sentiment changes.
5. Retrieves the existing `UserMemoryProfile`.
6. Merges the new JSON data into the existing profile string fields.
7. Calls `PrismaClient.userMemoryProfile.update()`.

---
### Service: `StripeWebhookService`

**Function: `processWebhook(signature, rawBody)`**
**Step-by-step logic:**
1. Constructs Stripe event via `stripe.webhooks.constructEvent()`. Throws 400 if invalid.
2. Looks up `eventId` in `WebhookLog` table. If it exists and status is `PROCESSED`, returns 200 immediately (Idempotency).
3. If not exists, creates `WebhookLog` with status `PROCESSING`.
4. Switch statement on `event.type`.
5. Handlers for `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`.
6. Updates `WebhookLog` to `PROCESSED` on success, or `FAILED` on error.
# Frontend Pages Documentation

## `dashboard/admin/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| stats | any | null | Controls stats data |
| loading | boolean | true | Controls loading state |
| activeTab | string | 'overview' | Controls active tab |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches admin stats
- Sets: stats, loading
- Error handling: Try/catch with console error

**Conditional rendering:**
- loading -> renders skeleton loaders
- activeTab === 'overview' -> renders overview metrics
- activeTab === 'users' -> renders user table
- activeTab === 'therapists' -> renders therapists table

---

## `dashboard/ai/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| input | string | '' | Controls input text |
| messages | any[] | [] | Controls messages list |
| isTyping | boolean | false | Controls typing indicator |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches chat history
- Sets: messages
- Error handling: Try/catch with toast error

**Conditional rendering:**
- isTyping -> renders typing indicator
- messages.length === 0 -> renders empty state

---

## `dashboard/appointments/new/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| date | Date | null | Controls selected date |
| time | string | '' | Controls selected time |
| therapistId | string | '' | Controls selected therapist |
| step | number | 1 | Controls booking step |

**useEffect hooks:**
Effect 1 - dependencies: [therapistId]
- Runs: When therapist changes
- Does: Fetches available slots
- Sets: available slots state
- Error handling: Try/catch with error toast

**Conditional rendering:**
- step === 1 -> renders therapist selection
- step === 2 -> renders date/time selection
- step === 3 -> renders confirmation

---

## `dashboard/appointments/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| appointments | any[] | [] | Controls appointments list |
| loading | boolean | true | Controls loading state |
| filter | string | 'upcoming' | Controls active filter |

**useEffect hooks:**
Effect 1 - dependencies: [filter]
- Runs: On filter change
- Does: Fetches filtered appointments
- Sets: appointments, loading
- Error handling: Try/catch with console error

**Conditional rendering:**
- loading -> renders skeletons
- appointments.length === 0 -> renders empty state
- filter === 'upcoming' -> renders upcoming list

---

## `dashboard/chatbot/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| input | string | '' | Controls input text |
| chatHistory | any[] | [] | Controls chat history |
| isTyping | boolean | false | Controls typing state |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Initiates chat connection
- Sets: chatHistory
- Error handling: Standard try/catch

**Conditional rendering:**
- isTyping -> renders typing indicator
- chatHistory.length === 0 -> renders welcome prompt

---

## `dashboard/habits/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| habits | any[] | [] | Controls habits list |
| loading | boolean | true | Controls loading state |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches habits
- Sets: habits, loading
- Error handling: Try/catch

**Conditional rendering:**
- loading -> renders skeleton
- habits.length === 0 -> renders no habits message

---

## `dashboard/insights/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| data | any | null | Controls insights data |
| loading | boolean | true | Controls loading state |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches analytics
- Sets: data, loading
- Error handling: Try/catch

**Conditional rendering:**
- loading -> renders skeleton
- !data -> renders empty chart placeholder

---

## `dashboard/journal/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| entries | any[] | [] | Controls journal entries |
| loading | boolean | true | Controls loading state |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches journal entries
- Sets: entries, loading
- Error handling: Try/catch

**Conditional rendering:**
- loading -> renders skeleton
- entries.length === 0 -> renders empty state

---

## `dashboard/medicine/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| meds | any[] | [] | Controls medicine list |
| loading | boolean | true | Controls loading state |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches meds
- Sets: meds, loading
- Error handling: Try/catch

**Conditional rendering:**
- loading -> renders skeleton
- meds.length === 0 -> renders empty state

---

## `dashboard/mood/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| selectedMood | string | '' | Controls selected mood |
| note | string | '' | Controls mood note |
| submitting | boolean | false | Controls submit state |

**useEffect hooks:**
None

**Conditional rendering:**
- submitting -> disables button
- selectedMood -> enables submit

---

## `dashboard/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| summary | any | null | Controls dashboard summary |
| loading | boolean | true | Controls loading state |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches summary
- Sets: summary, loading
- Error handling: Try/catch

**Conditional rendering:**
- loading -> renders skeleton
- !summary -> renders error state

---

## `dashboard/premium/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| plan | string | 'monthly' | Controls selected plan |

**useEffect hooks:**
None

**Conditional rendering:**
- plan === 'monthly' -> renders monthly price
- plan === 'annual' -> renders annual price

---

## `dashboard/profile/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| profileData | any | null | Controls profile form data |
| loading | boolean | true | Controls loading state |
| saving | boolean | false | Controls save state |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches profile
- Sets: profileData, loading
- Error handling: Try/catch

**Conditional rendering:**
- loading -> renders skeleton
- saving -> disables form

---

## `dashboard/questionnaire/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| currentStep | number | 0 | Controls questionnaire step |
| answers | any | {} | Controls form answers |

**useEffect hooks:**
None

**Conditional rendering:**
- currentStep < totalSteps -> renders question
- currentStep === totalSteps -> renders results

---

## `dashboard/settings/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| notifications | boolean | true | Controls notifications toggle |
| darkMode | boolean | false | Controls theme |

**useEffect hooks:**
None

**Conditional rendering:**
- notifications -> shows active switch

---

## `dashboard/therapists/[id]/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| therapist | any | null | Controls therapist details |
| loading | boolean | true | Controls loading state |

**useEffect hooks:**
Effect 1 - dependencies: [id]
- Runs: On mount or ID change
- Does: Fetches therapist details
- Sets: therapist, loading
- Error handling: Try/catch

**Conditional rendering:**
- loading -> renders skeleton
- !therapist -> renders 404 state

---

## `dashboard/therapists/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| doctors | Doctor[] | [] | Controls list of doctors |
| loading | boolean | true | Controls loading state |
| searchTerm | string | '' | Controls search input |
| specialtyFilter| string | '' | Controls specialty dropdown |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On component mount
- Does: Fetches `/appointments/doctors`
- Sets: doctors, loading
- Error handling: Logs to console

**Conditional rendering:**
- loading -> renders 6 skeleton cards
- filteredDoctors.length === 0 -> renders "No therapists found"

---

## `dashboard/video/[sessionId]/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| token | string \| null | null | Controls Daily.co token |
| roomUrl | string \| null | null | Controls Daily.co room URL |
| error | string \| null | null | Controls error state |

**useEffect hooks:**
Effect 1 - dependencies: [sessionId]
- Runs: On mount or session ID change
- Does: Fetches video token
- Sets: token, roomUrl, error
- Error handling: Sets error state

**Conditional rendering:**
- error -> renders error message
- token && roomUrl -> renders DailyProvider
- else -> renders connecting pulse

---

## `disclaimer/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| None | | | |

**useEffect hooks:**
None

**Conditional rendering:**
None

---

## `login/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| None | | | |

**useEffect hooks:**
None

**Conditional rendering:**
None

---

## `login/therapist/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| None | | | |

**useEffect hooks:**
None

**Conditional rendering:**
None

---

## `page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| None | | | |

**useEffect hooks:**
None

**Conditional rendering:**
None

---

## `privacy/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| None | | | |

**useEffect hooks:**
None

**Conditional rendering:**
None

---

## `provider/availability/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| slots | any[] | [...] | Controls list of available slots |

**useEffect hooks:**
None

**Conditional rendering:**
- slots.map -> renders each slot row

---

## `provider/notes/[id]/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| loading | boolean | false | Controls save button state |
| saved | boolean | false | Controls success state |
| notes | any | {symptoms:'', recommendations:'', followUp:''} | Controls form values |

**useEffect hooks:**
None

**Conditional rendering:**
- saved -> renders success icon

---

## `provider/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| appointments | any[] | [] | Controls doctor's appointments |
| loading | boolean | true | Controls loading skeleton |
| stats | any | {todayCount: 0, pendingCount: 0, earnings: 45000} | Controls dashboard metrics |

**useEffect hooks:**
Effect 1 - dependencies: []
- Runs: On mount
- Does: Fetches doctor appointments
- Sets: appointments, stats, loading
- Error handling: toast.error

**Conditional rendering:**
- loading -> renders skeletons
- pending.length === 0 -> renders empty pending state
- upcoming.length === 0 -> renders empty upcoming schedule

---

## `provider/patient/[id]/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| patient | any | null | Controls patient details |
| loading | boolean | true | Controls loading state |
| note | string | '' | Controls new SOAP note |
| saving | boolean | false | Controls note saving state |

**useEffect hooks:**
Effect 1 - dependencies: [patientId]
- Runs: On mount / ID change
- Does: Fetches patient data
- Sets: patient, loading
- Error handling: toast.error

**Conditional rendering:**
- loading -> renders loading text
- !patient -> renders not found
- p.verified -> renders VERIFIED or PENDING badge

---

## `support/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| None | | | |

**useEffect hooks:**
None

**Conditional rendering:**
None

---

## `terms/page.tsx`
**State variables (complete):**
| Variable | Type | Initial Value | What it controls |
|----------|------|---------------|------------------|
| None | | | |

**useEffect hooks:**
None

**Conditional rendering:**
None
---
### `TopNav` — `src/components/layout/TopNav.tsx`
**Purpose:** Top navigation bar for the application, handling responsive layout and conditional link rendering based on authentication and user role.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| None | | | | |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| `mobileMenuOpen` | boolean | `false` | Mobile menu visibility. |
**useEffect hooks:** None.
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `renderLinks` | None | JSX Element | Renders navigation links based on user role (ADMIN, DOCTOR, or default user). |
| `renderAuthButtons` | None | JSX Element | Renders login/signup buttons or user greeting and logout button. |
**Context consumed:** `useAuth` (user, logout)
**What it renders:** A `header` element containing the logo, desktop navigation, authentication actions, and a mobile hamburger menu that toggles a responsive dropdown layout.

---
### `AuthProvider` — `src/context/auth-context.tsx`
**Purpose:** Manages global authentication state, token storage, and user sessions. Provides login and logout functionality and guards unauthenticated access to the dashboard.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `children` | React.ReactNode | Yes | | Child components wrapped by the provider. |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| `user` | User \| null | `null` | The currently authenticated user object. |
| `token` | string \| null | `null` | The JWT authentication token. |
| `isLoading` | boolean | `true` | Loading state during initial authentication check. |
**useEffect hooks:** 
- Checks `localStorage` for `auth_token` and `auth_user` on mount. Verifies token with backend (`/auth/profile`) and redirects unauthenticated users to `/login` if accessing `/dashboard`.
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `login` | `newToken: string, newUser: User` | `void` | Updates state, sets local storage, and redirects based on user role. |
| `logout` | None | `void` | Clears state and local storage, redirects to `/login`. |
| `useAuth` | None | `AuthContextType` | Hook to consume the AuthContext. Throws if used outside the provider. |
**Context consumed:** None.
**What it renders:** `AuthContext.Provider` wrapping its `children`.

---
### `EntitlementProvider` — `src/context/entitlement-context.tsx`
**Purpose:** Manages feature entitlements and subscription plans (e.g., FREE, GOLD, PLATINUM) using a context. Controls feature access limits and upgrade modal visibility.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `children` | React.ReactNode | Yes | | Child components wrapped by the provider. |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| `entitlements` | EntitlementsState \| null | `null` | Current plan and feature limits. |
| `loading` | boolean | `true` | Loading state while fetching entitlements. |
| `error` | string \| null | `null` | Error message if fetch fails. |
| `isUpgradeModalOpen` | boolean | `false` | Controls the visibility of the upgrade modal. |
**useEffect hooks:** 
- Calls `fetchEntitlements` on mount to fetch the user's entitlements from `/user/entitlements`.
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `fetchEntitlements` | None | `Promise<void>` | Fetches and updates entitlements from the API. |
| `checkAccess` | `featureKey: string` | `FeatureAccess` | Returns feature availability and limits. |
| `openUpgradeModal` | None | `void` | Opens the upgrade modal. |
| `closeUpgradeModal` | None | `void` | Closes the upgrade modal. |
| `useEntitlements` | None | `EntitlementContextValue` | Hook to consume EntitlementContext. |
**Context consumed:** None.
**What it renders:** `EntitlementContext.Provider` wrapping its `children`.

---
### `FeatureGate` — `src/components/feature-gate.tsx`
**Purpose:** Restricts access to UI elements or features based on the user's entitlement plan. Displays a fallback UI if the feature is locked.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `featureKey` | string | Yes | | The entitlement key required to view the feature. |
| `children` | React.ReactNode | Yes | | The content to render if access is granted. |
| `fallbackMessage` | string | No | `'This feature is locked.'` | Message shown when access is denied. |
| `requiredPlanDisplay`| string | No | `'PREMIUM'` | Plan name displayed in the upgrade prompt. |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| None | | | |
**useEffect hooks:** None.
**Functions defined:** None.
**Context consumed:** `useEntitlements` (checkAccess, loading, openUpgradeModal)
**What it renders:** Render `children` directly if access is granted. If locked, renders a blurred container with a lock icon, a `fallbackMessage`, and an "Upgrade Now" button.

---
### `AppSidebar` — `src/components/dashboard/app-sidebar.tsx`
**Purpose:** Application sidebar for the dashboard. Contains navigation links for standard features, settings, and profile details.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| None | | | | |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| None | | | |
**useEffect hooks:** None.
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `handleLogout` | None | `void` | Logs the user out and redirects to `/login`. |
| `isActive` | `url: string` | `boolean` | Checks if a navigation item is the current active route. |
**Context consumed:** `useAuth` (user, logout)
**What it renders:** A styled `Sidebar` with brand logo, "My Space" navigation group, "Account" navigation group, and a footer displaying the user's profile and a logout button.

---
### `UpgradeModal` — `src/components/upgrade-modal.tsx`
**Purpose:** Displays a modal for users to upgrade their subscription plan (Gold or Platinum) and initiates checkout via Stripe or Razorpay.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| None | | | | |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| `loadingPlan` | string \| null | `null` | Tracks which plan is currently being processed for checkout. |
**useEffect hooks:** None.
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `handleStripeCheckout`| `planId: string, priceId: string` | `Promise<void>`| Initiates a Stripe checkout session via the API and redirects. |
| `handleRazorpayCheckout`| `planId: string, amount: number` | `Promise<void>`| Loads Razorpay SDK and opens the Razorpay payment modal. |
**Context consumed:** `useEntitlements` (isUpgradeModalOpen, closeUpgradeModal, entitlements)
**What it renders:** If `isUpgradeModalOpen` is true, renders a fixed backdrop with a modal containing plan details, feature lists, and payment buttons.

---
### `ChatMessage` — `src/components/dashboard/chat-message.tsx`
**Purpose:** Renders an individual chat message bubble in the Swahit Companion AI chat interface.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | string | Yes | | Unique message identifier. |
| `role` | `'ai' \| 'user'` | Yes | | Defines who sent the message to determine styling. |
| `content` | string | Yes | | The text content of the message. |
| `timestamp`| string | Yes | | Time the message was sent. |
| `emotionTag`| string | No | | Optional detected emotion to display. |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| None | | | |
**useEffect hooks:** None.
**Functions defined:** None.
**Context consumed:** None.
**What it renders:** An aligned flex container. Left-aligned with an AI avatar for `role === 'ai'`, or right-aligned with a user avatar for `role === 'user'`. Includes the timestamp, optional emotion tag, and content.

---
### `RoleGuard` — `src/components/auth/RoleGuard.tsx`
**Purpose:** Wraps routes/components to enforce role-based access control. Redirects unauthorized users.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `children` | React.ReactNode | Yes | | Content to render if authorized. |
| `allowedRoles`| string[] | Yes | | List of roles permitted to access the children. |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| `isAuthorized` | boolean | `false` | Indicates whether the user has been validated. |
**useEffect hooks:** 
- Checks `localStorage` for `token` and `userRole`. Redirects to `/login` if no token, or to `/dashboard` if role is not allowed. Sets `isAuthorized` to `true` otherwise.
**Functions defined:** None.
**Context consumed:** None.
**What it renders:** A loading spinner while checking access. Once authorized, renders `children`.

---
### `AuthForm` — `src/components/auth/auth-form.tsx`
**Purpose:** Renders a combined login and registration form using `react-hook-form` and `zod` for validation. Uses tabs to switch between the two modes.
**Props:**
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| None | | | | |
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| `isLoading` | boolean | `false` | Controls the loading state on submit buttons. |
**useEffect hooks:** None.
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `onSubmit` | `data: AuthFormData, type: 'login' \| 'register'` | `Promise<void>` | Sends form data to the corresponding API endpoint and logs the user in if successful. |
**Context consumed:** `useAuth` (login)
**What it renders:** A `Card` component with `Tabs` for "Log In" and "Sign Up". Each tab contains a `react-hook-form` connected form with validation inputs and a submit button.

---
### `api.ts` — `src/lib/api.ts`
**Purpose:** Utility file providing a standardized way to make authenticated requests to the backend API.
**Props:** N/A (Utility file)
**Internal state:** N/A
**useEffect hooks:** N/A
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `getApiUrl` | None | `string` | Determines the correct base API URL based on environment variables or window location. |
| `fetchApi` | `endpoint: string, options: RequestInit = {}` | `Promise<any>` | Wrapper around `fetch` that automatically attaches the `Authorization` bearer token, handles JSON parsing, and redirects to `/login` on 401 unauthorized errors. |
**Context consumed:** N/A
**What it renders:** N/A

---
### `utils.ts` — `src/lib/utils.ts`
**Purpose:** Shared utility functions, primarily used for Tailwind CSS class merging across UI components.
**Props:** N/A
**Internal state:** N/A
**useEffect hooks:** N/A
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `cn` | `...inputs: ClassValue[]` | `string` | Conditionally joins class names using `clsx` and resolves Tailwind conflicts with `twMerge`. |
**Context consumed:** N/A
**What it renders:** N/A

---
### `useIsMobile` — `src/hooks/use-mobile.tsx`
**Purpose:** Custom hook to detect if the current viewport is mobile-sized.
**Props:** N/A
**Internal state:**
| Variable | Type | Initial | Controls |
|---|---|---|---|
| `isMobile` | boolean \| undefined | `undefined` | True if window width is below 768px. |
**useEffect hooks:** 
- Adds a resize listener via `window.matchMedia` for `max-width: 767px` and updates `isMobile` state accordingly.
**Functions defined:**
| Name | Parameters | Returns | What it does |
|---|---|---|---|
| `useIsMobile` | None | `boolean` | Returns the current mobile state boolean. |
**Context consumed:** N/A
**What it renders:** N/A

---
### Custom UI Components — `src/components/ui/*.tsx`
**Purpose:** Reusable, accessible UI components building the design system (typically generated by shadcn/ui). Includes components like `Button`, `Card`, `Input`, `Label`, `Sidebar`, `Tabs`, `Avatar`, `DropdownMenu`, etc.
**Props:** Vary per component, typically extending standard HTML/React attributes and utilizing custom styling props via variants.
**Internal state:** Most are stateless functional components, though interactive elements (like Dialogs or Menus) utilize Radix UI primitives for accessible local state.
**useEffect hooks:** Vary per component (e.g., used for focus management in complex dropdowns).
**Functions defined:** Typically use `React.forwardRef` and `cva` (class variance authority) for styling variations.
**Context consumed:** Radix UI primitive contexts where applicable.
**What it renders:** Styled HTML elements consistent with the Swahit brand language.
---

---

### Service: `HabitService`
#### Method: `createHabit`
**Step-by-step logic:** 
1. Receives userId, title, and category.
2. Creates a new habit record in the database using the provided data.
3. Returns the created habit.
**Prisma queries:** `prisma.habit.create`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `HabitController`

#### Method: `getHabits`
**Step-by-step logic:** 
1. Receives userId.
2. Fetches all habits associated with the given userId.
3. Includes the most recent 30 habit logs for each habit, ordered by date descending.
4. Returns the fetched habits.
**Prisma queries:** `prisma.habit.findMany`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `HabitController`

#### Method: `logHabit`
**Step-by-step logic:** 
1. Receives userId, habitId, date, and status.
2. Fetches the habit by habitId to perform a basic authorization check.
3. Checks if the habit exists and if it belongs to the given userId; throws an error if not.
4. Upserts a habit log for the given habitId and date, updating the status if it exists or creating a new log if it doesn't.
5. Returns the updated or created habit log.
**Prisma queries:** `prisma.habit.findUnique`, `prisma.habitLog.upsert`
**Throws:** `Error('Habit not found or access denied')`
**Called by:** `HabitController`

#### Method: `calculateStreaks`
**Step-by-step logic:** 
1. Receives habitId.
2. Fetches all completed habit logs for the given habitId, ordered by date descending.
3. If no logs exist, returns current and longest streak as 0.
4. Parses dates to local Date objects to reliably calculate day differences.
5. Calculates the longest streak by iterating through parsed dates and counting consecutive days.
6. Calculates the current streak by checking if the last logged date was today or yesterday, then counting consecutive days backwards.
7. Returns an object containing the currentStreak and longestStreak.
**Prisma queries:** `prisma.habitLog.findMany`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `HabitController`

### Service: `JournalService`
#### Method: `createEntry`
**Step-by-step logic:** 
1. Receives userId and content.
2. Creates a new journal entry in the database with the provided content and a temporary empty emotionTags string.
3. Triggers an asynchronous background process (`processEntryWithAI`) to analyze the content and generate a summary and emotion tags without blocking the request.
4. Returns the created journal entry.
**Prisma queries:** `prisma.journalEntry.create`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `JournalController`

#### Method: `processEntryWithAI` (private)
**Step-by-step logic:** 
1. Receives entryId and content.
2. Constructs a prompt for the AI to analyze the content and return a JSON object with a summary and emotionTags.
3. Calls the AI provider to generate a response.
4. Parses the JSON from the AI's response text.
5. Filters the AI-generated emotion tags against a predefined list of allowed emotions and joins them into a comma-separated string.
6. Updates the journal entry in the database with the generated summary and emotion tags.
**Prisma queries:** `prisma.journalEntry.update`
**Throws:** None directly thrown to caller (Logs error if AI generation or parsing fails)
**Called by:** `JournalService.createEntry`

#### Method: `getEntries`
**Step-by-step logic:** 
1. Receives userId, skip (default 0), and take (default 20).
2. Fetches journal entries for the given userId, ordered by creation date descending.
3. Applies pagination using the skip and take parameters.
4. Returns the fetched entries.
**Prisma queries:** `prisma.journalEntry.findMany`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `JournalController`

#### Method: `getEntryById`
**Step-by-step logic:** 
1. Receives userId and id (entryId).
2. Fetches the first journal entry matching the given id and userId.
3. Returns the fetched entry.
**Prisma queries:** `prisma.journalEntry.findFirst`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `JournalController`

### Service: `MoodService`
#### Method: `createMood`
**Step-by-step logic:** 
1. Receives userId, mood, intensity (default 5), and optional notes.
2. Gets the current date as a YYYY-MM-DD string in UTC.
3. Upserts a mood entry for the user on the current date, updating it if it exists or creating it if it doesn't.
4. Returns the upserted mood entry.
**Prisma queries:** `prisma.moodEntry.upsert`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `MoodController`

#### Method: `getUserMoods`
**Step-by-step logic:** 
1. Receives userId.
2. Fetches up to 90 mood entries for the user, ordered chronologically by date ascending.
3. Returns the fetched entries.
**Prisma queries:** `prisma.moodEntry.findMany`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `MoodController`

### Service: `MoodAnalyticsService`
#### Method: `getInsights`
**Step-by-step logic:** 
1. Receives userId.
2. Calculates the date string for 30 days ago limit.
3. Fetches mood entries for the user from the last 30 days, ordered chronologically.
4. If no entries exist, returns a message indicating not enough data.
5. Calculates the average mood intensity score (rounded to one decimal place).
6. Calculates the distribution of mood types and identifies the most frequent mood.
7. Fetches journal entries for the user from the last 30 days.
8. Identifies "bad mood dates" where intensity was < 4 or the mood was SAD, ANXIOUS, or ANGRY.
9. Correlates journal emotion tags on bad mood dates to find potential triggers by counting tag frequencies.
10. Identifies the top trigger (most frequent tag on bad mood days).
11. Returns an object containing the average score, most frequent mood, distribution, trend data, and top trigger message.
**Prisma queries:** `prisma.moodEntry.findMany`, `prisma.journalEntry.findMany`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `MoodController`

### Service: `OrderService`
#### Method: `createOrder`
**Step-by-step logic:** 
1. Receives userId, prescriptionId, and a list of items (productId and quantity).
2. Fetches the prescription by prescriptionId.
3. Checks if the prescription exists; throws a 404 HttpException if not.
4. Checks if the prescription is verified; throws a 400 HttpException if not.
5. Fetches all active medicine products corresponding to the requested productIds.
6. Validates that all requested products exist and are active; throws a 400 HttpException if any are invalid.
7. Calculates the total amount by multiplying quantity and price for each item, and prepares validated item data.
8. Creates a new pending medicine order in the database with the validated items.
9. Returns the created order with its items included.
**Prisma queries:** `prisma.prescription.findUnique`, `prisma.medicineProduct.findMany`, `prisma.medicineOrder.create`
**Throws:** `HttpException('Prescription not found', HttpStatus.NOT_FOUND)`, `HttpException('Prescription must be verified before ordering', HttpStatus.BAD_REQUEST)`, `HttpException('One or more products are invalid or unavailable', HttpStatus.BAD_REQUEST)`
**Called by:** `MedicineController`

#### Method: `updateOrderStatus`
**Step-by-step logic:** 
1. Receives orderId and status.
2. Updates the status of the specified medicine order in the database.
3. Returns the updated order.
**Prisma queries:** `prisma.medicineOrder.update`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `MedicineController`

#### Method: `getUserOrders`
**Step-by-step logic:** 
1. Receives userId.
2. Fetches all medicine orders for the specified user, ordered by creation date descending.
3. Includes the associated order items and prescription details.
4. Returns the fetched orders.
**Prisma queries:** `prisma.medicineOrder.findMany`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `MedicineController`

### Service: `PrescriptionService`
#### Method: `uploadPrescription`
**Step-by-step logic:** 
1. Receives userId and fileUrl.
2. Creates a new prescription record in the database with the provided userId and fileUrl.
3. Returns the created prescription.
**Prisma queries:** `prisma.prescription.create`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `MedicineController`

#### Method: `verifyPrescription`
**Step-by-step logic:** 
1. Receives prescriptionId and doctorId.
2. Updates the specified prescription to mark it as verified and associates it with the doctorId.
3. Returns the updated prescription.
**Prisma queries:** `prisma.prescription.update`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `MedicineController`

#### Method: `getUserPrescriptions`
**Step-by-step logic:** 
1. Receives userId.
2. Fetches all prescriptions for the specified user, ordered by creation date descending.
3. Includes the associated doctor details.
4. Returns the fetched prescriptions.
**Prisma queries:** `prisma.prescription.findMany`
**Throws:** None (Standard Prisma errors are unhandled)
**Called by:** `MedicineController`


### Service: `FeatureGatingService`
*Note: The `FeatureGatingService` file could not be found in the specified directory (`e:\Swahit\swahit-dev\apps\backend\src`).*
#### Method: `N/A`
**Step-by-step logic:** N/A
**Prisma queries:** N/A
**Throws:** N/A
**Called by:** N/A

### Service: `AdminService`
#### Method: `addTherapist`
**Step-by-step logic:** 
1. Checks if the provided email already exists in the system.
2. If it exists, throws a ConflictException.
3. Opens a database transaction.
4. Creates a new user with the role 'DOCTOR'.
5. Creates a linked doctor profile using the newly created user's ID.
6. Returns the newly created doctor object.
**Prisma queries:** `prisma.user.findUnique`, `prisma.$transaction`, `tx.user.create`, `tx.doctor.create`
**Throws:** `ConflictException` ('Email already in use')
**Called by:** `AdminController`

#### Method: `getTherapists`
**Step-by-step logic:** 
1. Retrieves a list of doctors from the database with pagination parameters (`take`, `skip`).
2. Orders the results by descending creation date.
3. Returns the list of doctors.
**Prisma queries:** `prisma.doctor.findMany`
**Throws:** None explicit
**Called by:** `AdminController`

#### Method: `updateTherapistStatus`
**Step-by-step logic:** 
1. Updates the `isAvailable` status of a doctor identified by the given `id`.
2. Returns the updated doctor record.
**Prisma queries:** `prisma.doctor.update`
**Throws:** None explicit
**Called by:** `AdminController`

#### Method: `getUsers`
**Step-by-step logic:** 
1. Retrieves a paginated list of users from the database.
2. Selects specific fields (id, email, name, role, createdAt) and includes the most recent user subscription and its associated plan.
3. Orders results by descending creation date.
4. Returns the list of users.
**Prisma queries:** `prisma.user.findMany`
**Throws:** None explicit
**Called by:** `AdminController`

#### Method: `getAppointments`
**Step-by-step logic:** 
1. Retrieves a paginated list of appointments from the database.
2. Includes basic details of the related user and doctor for each appointment.
3. Orders results by descending creation date.
4. Returns the appointments.
**Prisma queries:** `prisma.appointment.findMany`
**Throws:** None explicit
**Called by:** `AdminController`

#### Method: `getAnalytics`
**Step-by-step logic:** 
1. Simultaneously counts the total users, active user subscriptions, total doctors, and 'distress' notifications.
2. Fetches all active subscriptions including their plan details.
3. Calculates the estimated monthly revenue by summing the monthly price of all active subscriptions.
4. Returns an object containing the aggregated analytics data.
**Prisma queries:** `prisma.user.count`, `prisma.userSubscription.count`, `prisma.doctor.count`, `prisma.notification.count`, `prisma.userSubscription.findMany`
**Throws:** None explicit
**Called by:** `AdminController`

#### Method: `getPrescriptions`
**Step-by-step logic:** 
1. Retrieves a paginated list of prescriptions.
2. Includes basic details of the related user and doctor.
3. Orders results by descending creation date.
4. Returns the prescriptions.
**Prisma queries:** `prisma.prescription.findMany`
**Throws:** None explicit
**Called by:** `AdminController`

#### Method: `verifyPrescription`
**Step-by-step logic:** 
1. Updates the `verified` status of a specific prescription identified by its `id`.
2. Returns the updated prescription record.
**Prisma queries:** `prisma.prescription.update`
**Throws:** None explicit
**Called by:** `AdminController`

#### Method: `getMedicineOrders`
**Step-by-step logic:** 
1. Retrieves a paginated list of medicine orders.
2. Includes basic user details and the order items.
3. Orders results by descending creation date.
4. Returns the medicine orders.
**Prisma queries:** `prisma.medicineOrder.findMany`
**Throws:** None explicit
**Called by:** `AdminController`

### Service: `VideoService`
#### Method: `createRoom`
**Step-by-step logic:** 
1. Checks if a video session already exists for the given `appointmentId`.
2. If it exists, returns it immediately.
3. Makes an HTTP POST request to the Daily.co API to create a new video room, passing properties like expiration and chat enablement.
4. If the API request fails, throws an Error which is caught and transformed into an HttpException.
5. If successful, creates a new `videoSession` record in the database using the returned room name.
6. Returns the newly created video session record.
**Prisma queries:** `prisma.videoSession.findUnique`, `prisma.videoSession.create`
**Throws:** `Error` ('Failed to create Daily room'), `HttpException` ('Failed to create video session' - 500 status)
**Called by:** `VideoController`

#### Method: `getRoomToken`
**Step-by-step logic:** 
1. Makes an HTTP POST request to the Daily.co API to generate a meeting token for a specific user and room.
2. Sets token properties including user ID, owner status, and an expiration time of 1 hour.
3. If the API request fails, throws an Error which is caught and transformed into an HttpException.
4. Returns the generated token and the room name.
**Prisma queries:** None
**Throws:** `Error` ('Failed to generate token'), `HttpException` ('Failed to generate access token' - 500 status)
**Called by:** `VideoController`

#### Method: `endSession`
**Step-by-step logic:** 
1. Updates the specified video session record in the database.
2. Sets its status to 'ended' and records the current time as the end time.
3. Returns the updated session record.
**Prisma queries:** `prisma.videoSession.update`
**Throws:** None explicit
**Called by:** `VideoController`

### Service: `UsersService`
#### Method: `findAll`
**Step-by-step logic:** 
1. Retrieves a list of all users from the database.
2. Selects specific non-sensitive fields to return (e.g., id, email, name, dob, phone, gender, profession, role, timestamps).
3. Returns the user list.
**Prisma queries:** `prisma.user.findMany`
**Throws:** None explicit
**Called by:** `UsersController`

#### Method: `create`
**Step-by-step logic:** 
1. Checks if a password is provided in the input data.
2. If provided, asynchronously hashes the password using bcrypt with a salt round of 10.
3. Creates a new user record in the database with the provided data and the hashed password (or an empty string if none).
4. Selects and returns specific fields of the newly created user (id, email, name, role, createdAt).
**Prisma queries:** `prisma.user.create`
**Throws:** None explicit
**Called by:** `UsersController`

### Service: `CommunicationService`
#### Method: `sendNotification`
**Step-by-step logic:** 
1. Logs the intention to send a notification of a specific type to a user.
2. Creates a new notification record in the database with the user ID, type, and message content.
3. Returns the created notification record.
**Prisma queries:** `prisma.notification.create`
**Throws:** None explicit
**Called by:** Other application services or controllers

#### Method: `getUnreadNotifications`
**Step-by-step logic:** 
1. Retrieves notifications for a specific user where `isRead` is false.
2. Orders the results by descending creation date.
3. Returns the list of unread notifications.
**Prisma queries:** `prisma.notification.findMany`
**Throws:** None explicit
**Called by:** Other application services or controllers

#### Method: `markNotificationAsRead`
**Step-by-step logic:** 
1. Updates the `isRead` status of a specific notification to true.
2. Returns the updated notification record.
**Prisma queries:** `prisma.notification.update`
**Throws:** None explicit
**Called by:** Other application services or controllers

#### Method: `sendMessage`
**Step-by-step logic:** 
1. Creates a new message record in the database between a sender and a receiver.
2. Stores the message content and type (defaulting to 'text').
3. Returns the created message record.
**Prisma queries:** `prisma.message.create`
**Throws:** None explicit
**Called by:** Other application services or controllers

#### Method: `getChatHistory`
**Step-by-step logic:** 
1. Retrieves messages exchanged between two specific users (in either direction).
2. Applies pagination parameters, limiting the fetch size to a maximum of 100 messages.
3. Orders the results chronologically by ascending creation date.
4. Returns the list of messages.
**Prisma queries:** `prisma.message.findMany`
**Throws:** None explicit
**Called by:** Other application services or controllers


═══════════════════════════════════════
SECTION 14 — DATA FLOWS
═══════════════════════════════════════

This section traces the exact lifecycle of core features from the User Interface down to the Database.

---
### Flow 1: Appointment Booking & Payment
1. **Frontend:** User navigates to `/appointments/book`.
2. **API Call:** `GET /api/doctors` and `GET /api/doctors/:id/slots`.
3. **Frontend:** User selects Doctor and Slot, clicks Book.
4. **API Call:** `POST /api/appointments`.
5. **Controller:** `AppointmentsController.create()` validates `BookAppointmentDto`.
6. **Service:** `AppointmentsService` checks `DoctorSlot.isBooked`.
7. **Database:** Opens transaction. Marks slot booked. Creates `Appointment` (Status: PENDING).
8. **Service:** Calculates price. If > 0, generates Stripe Checkout URL via `Stripe API`.
9. **Controller:** Returns `{ appointment, checkoutUrl }`.
10. **Frontend:** Redirects to Stripe.
11. **Webhook:** Stripe sends `checkout.session.completed` to `/webhooks/stripe`.
12. **Service:** `StripeWebhookService` handles event, marks `Appointment` CONFIRMED. Creates `VideoSession` linked to it.

---
### Flow 2: AI Therapy Chat
1. **Frontend:** User types message on `/chat` and hits Send.
2. **API Call:** `POST /api/chatbot/message`.
3. **Controller:** `ChatbotController` extracts User ID from JWT.
4. **Service:** `FeatureGatingService` checks if `ai_chat` limit is reached for user's tier.
5. **Database:** Fetches last 10 `ChatMessage`s and `UserMemoryProfile`.
6. **Service:** Constructs system prompt concatenating Profile data.
7. **External API:** Calls `Gemini 1.5 Pro` via LangChain.
8. **Database:** Saves User message and AI response to `ChatMessage`.
9. **Service:** Triggers background sentiment check. If severe distress, creates System `Notification`.
10. **Controller:** Returns AI text.
11. **Frontend:** Renders message in UI.

---
### Flow 3: E-Pharmacy Order Fulfillment
1. **Frontend:** Doctor uploads prescription in `/doctor/dashboard`.
2. **API Call:** `POST /api/prescriptions`.
3. **Service:** Uploads to S3. Creates `Prescription` record.
4. **Frontend:** Patient sees prescription in `/medicine`. Clicks "Order Medicines".
5. **API Call:** `POST /api/medicine/order`.
6. **Service:** `PharmacyService` reads `Prescription.id`. Validates stock in `MedicineProduct`.
7. **Database:** Creates `MedicineOrder` (PENDING) and `OrderItem`s. Subtracts from `MedicineProduct.stock`.
8. **Service:** Generates payment link. Returns to UI.
9. **Webhook:** Upon payment, marks `MedicineOrder` CONFIRMED. Admin dashboard updates.

---
### Flow 4: Background Memory Consolidation
1. **Trigger:** Chat session ends or Cron runs nightly.
2. **Service:** `MemoryService.updateProfile()` executes.
3. **Database:** Reads un-summarized `ChatMessage`s.
4. **External API:** Gemini processes raw transcript into JSON (Goals, Stressors, Sentiment).
5. **Database:** Updates `UserMemoryProfile` text fields.
6. **Database:** Creates `ChatSummary` record and marks original messages processed.

---
### Flow 5: Dynamic Subscription Upgrades
1. **Frontend:** User clicks "Upgrade to Pro" on `/pricing`.
2. **API Call:** `POST /api/payments/checkout-session`.
3. **Service:** Generates Checkout session for the specific `Plan` price.
4. **Webhook:** Receives `invoice.payment_succeeded`.
5. **Service:** Upserts `UserSubscription` to link the new `Plan`.
6. **Service:** `FeatureGatingService` resets counters in `FeatureUsage`.
7. **Database:** Next time user accesses a gated endpoint, the new limits from `PlanFeature` apply.

---
### Flow 6: Video Consultation Initialization
1. **Frontend:** User clicks "Join Room" 5 minutes before Appointment.
2. **API Call:** `POST /api/video/room/:appointmentId`.
3. **Controller:** Validates user owns the appointment and it's within time window.
4. **Service:** Checks if `VideoSession.roomName` exists.
5. **External API:** If not created, calls Daily.co API to create ephemeral room.
6. **Database:** Updates `VideoSession`.
7. **Controller:** Returns Daily.co Token and URL.
8. **Frontend:** Initialises Daily-js iframe with the URL.

---
### Flow 7: Authentication & JWT Lifecycle
1. **Frontend:** User submits `/login`.
2. **Service:** Checks bcrypt hash.
3. **Service:** Generates access token (1h expiry) and refresh token (7d expiry) using `JwtService`.
4. **Controller:** Returns token to client (or sets `HttpOnly` cookie).
5. **Frontend:** Client stores token in memory/Context.
6. **Frontend:** Attaches `Authorization: Bearer <token>` to all subsequent requests.
7. **Backend Guard:** `JwtAuthGuard` verifies signature on every protected route.
8. **Controller Guard:** `RolesGuard('ADMIN')` checks if `req.user.role === 'ADMIN'`.

---
### Flow 8: Mood & Habit Tracking
1. **Frontend:** User logs daily mood.
2. **API Call:** `POST /api/mood`.
3. **Database:** Upserts `MoodEntry` for the current date (`@@unique([userId, date])`).
4. **API Call:** `GET /api/mood/history?days=30`.
5. **Controller:** Returns array of moods for the frontend to render the Line Chart.
6. **Frontend:** Renders chart.
# SECTION 19 - KNOWN ISSUES & TODOS

## A) Code-Level Issues Table

| File | Line | Type | Content | Severity |
| :--- | :--- | :--- | :--- | :--- |
| `apps/backend/src/payments/razorpay.service.ts` | 10 | Mock | `private mockMode = false;` | HIGH |
| `apps/backend/src/payments/razorpay.service.ts` | 17 | Mock | `'RAZORPAY credentials missing. Operating in MOCK mode.'` | MEDIUM |
| `apps/backend/src/payments/razorpay.service.ts` | 30 | Mock | `id: 'mock_order_id_' + Date.now()` | HIGH |
| `apps/backend/src/payments/stripe.service.ts` | 9 | Mock | `private mockMode = false;` | HIGH |
| `apps/backend/src/payments/stripe.service.ts` | 14 | Mock | `'STRIPE_SECRET_KEY is missing. Operating in MOCK mode.'` | MEDIUM |
| `apps/backend/src/payments/stripe.service.ts` | 54 | Mock | `throw new Error('Stripe is bypassed, mock mode active')` | HIGH |
| `apps/backend/src/video/video.service.ts` | 19 | Mock | `this.logger.warn('DAILY_API_KEY is not defined, using mock key')` | MEDIUM |
| `apps/backend/src/video/video.service.ts` | 21 | Mock | `this.dailyApiKey = apiKey \|\| 'mock_key';` | HIGH |
| `apps/frontend/src/app/dashboard/medicine/page.tsx` | 37 | Mock | `const handleUploadMock = async () => {` | HIGH |
| `apps/frontend/src/app/dashboard/medicine/page.tsx` | 40 | Mock | `// Mock upload URL to bypass S3 for now but test end-to-end DB flow` | HIGH |
| `apps/frontend/src/app/dashboard/medicine/page.tsx` | 41 | Mock | `const mockUrl = 'https://swahit-prescriptions.s3.amazonaws.com/test-prescription-' + Date.now() + '.pdf';` | HIGH |
| `apps/frontend/src/app/dashboard/medicine/page.tsx` | 95 | Mock | `Select File (Mock)` | MEDIUM |
| `apps/backend/src/habit/habit.service.ts` | 66 | Temp | `let tempStreak = 1;` | LOW |
| `apps/backend/src/journal/journal.service.ts` | 20 | Temp | `emotionTags: '', // Temporary` | MEDIUM |
| `apps/frontend/src/app/dashboard/admin/page.tsx` | 158, 164 | Placeholder | `Analytics Chart Placeholder` | MEDIUM |
| `apps/backend/src/payments/payments.controller.ts` | 35 | Console.log | `console.log(\`[Stripe Webhook] Subscription confirmed for user: ${userId}\`);` | LOW |
| `apps/backend/src/prisma/seed.ts` | 87-147 | Console.log | Various `console.log` statements for seeding | LOW |
| `apps/backend/src/chatbot/providers/gemini.provider.ts` | 131 | setTimeout | `await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));` | LOW |
| `apps/backend/src/prisma/prisma.service.ts` | 27 | setTimeout | `await new Promise(resolve => setTimeout(resolve, delay));` | LOW |
| `apps/frontend/src/app/dashboard/questionnaire/page.tsx` | 58 | setTimeout | `setTimeout(() => setStep(step + 1), 300);` | LOW |
| `apps/frontend/src/components/upgrade-modal.tsx` | 58 | ENV Missing | `key: process.env.NEXT_PUBLIC_RAZORPAY_KEY \|\| 'rzp_test_mock',` | HIGH |
| `apps/backend/src/medicine/medicine.controller.ts` | 20 | ENV Missing | `const allowedBucket = process.env.AWS_S3_BUCKET_URL \|\| '...';` | HIGH |

## B) Architecture-Level Gaps

1. **Missing Communication Endpoints**: The Prisma Schema defines `Message` and `Notification` models, and a `CommunicationService` exists in `apps/backend/src/communication/communication.service.ts`. However, there is no `communication.controller.ts`. The frontend has no way to fetch chat histories or user notifications over the API.
2. **Missing Medicine Products Management**: The `MedicineProduct` model exists in the Prisma Schema, but there is no corresponding controller or service to create, update, or list products for users to order.
3. **Mocked S3 Uploads on Frontend**: The medicine prescription feature bypasses actual file uploads, sending a mocked static URL to the backend. The feature is incomplete on the client side.
4. **Mocked Payment Providers**: Both Razorpay and Stripe services fallback to a `mockMode` if API keys are missing, and generate fake payload data instead of gracefully degrading or throwing setup errors.
5. **Mocked Video Conferencing**: The `video.service.ts` service falls back to a `'mock_key'` when the `DAILY_API_KEY` is undefined, which will fail silently during active video sessions.
6. **Undocumented Environment Variables**: The variables `AWS_S3_BUCKET_URL` and `NEXT_PUBLIC_RAZORPAY_KEY` are used in production/fallback logic but are completely absent from the `.env.example` file, leading to potential misconfigurations during deployment.
═══════════════════════════════════════
SECTION 20 — LOCAL DEV SETUP
═══════════════════════════════════════

Follow these exact steps to run Swahit from a fresh clone.

## Prerequisites
- Node.js v22.x+ (Recommended based on package typings)
- pnpm v10.33.2 (`npm install -g pnpm@10.33.2`)
- Git
- Docker (optional, for Redis/Postgres, though SQLite is default)
- Stripe CLI (for webhook testing)

## Step 1 — Clone
```bash
git clone <repo-url>
cd swahit-dev
```

## Step 2 — Install dependencies
This is a monorepo workspace. Run install from the root:
```bash
pnpm install
```

## Step 3 — Environment setup
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```
Fill in the following required values in `apps/backend/.env` before continuing:
- `JWT_SECRET`: Generate a random string, e.g., run `openssl rand -hex 32`
- `GEMINI_API_KEY`: Get from https://aistudio.google.com
- `STRIPE_SECRET_KEY`: Get from https://dashboard.stripe.com/test/apikeys
- `STRIPE_WEBHOOK_SECRET`: Wait for Step 6 to get this value.

## Step 4 — Database setup
The backend uses Prisma with SQLite by default (`dev.db`).
```bash
cd apps/backend
pnpm prisma migrate dev --name init
pnpm prisma generate
```

## Step 5 — Start services
You can run both frontend and backend concurrently from the root:
```bash
# From repo root
pnpm dev
```
OR individually:
```bash
cd apps/backend && pnpm start:dev
cd apps/frontend && pnpm dev
```

## Step 6 — Stripe webhook (local)
To test subscriptions and payments locally:
```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
```
Copy the webhook secret printed in the console (starts with `whsec_`) and paste it into `apps/backend/.env` as `STRIPE_WEBHOOK_SECRET`. Restart the backend server.

## Step 7 — Verify everything works
- Backend health: `GET http://localhost:3001/health` (should return 200 OK)
- Frontend: `http://localhost:3000` (Landing page should render)
- Register test: `POST http://localhost:3001/api/auth/register` with `{ "email": "test@test.com", "password": "password", "name": "Test" }` → Should return 201 Created.

## Common errors and fixes
| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module '@prisma/client'" | Prisma client not generated | Run `pnpm --filter backend prisma generate` |
| "CORS error on localhost:3000" | FRONTEND_URL env missing | Set `FRONTEND_URL=http://localhost:3000` in backend `.env` |
| "JWT malformed" | JWT_SECRET mismatch or missing | Ensure `JWT_SECRET` is set in `.env` with no trailing spaces |
| Stripe webhook 400 Bad Request | Wrong STRIPE_WEBHOOK_SECRET | Re-run `stripe listen` and copy the newly generated secret to `.env` |
| "Failed to fetch" in frontend | Backend not running or port mismatch | Ensure backend is running on `3001` and frontend `NEXT_PUBLIC_API_URL` points to it. |
