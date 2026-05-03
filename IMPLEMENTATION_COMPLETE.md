# Swahit: Complete Implementation Inventory

This document provides a comprehensive summary of every system, feature, and technology implemented in the Swahit project to date.

---

## 🏗️ 1. Vision & Platform Identity
Swahit is a **Next-Gen Mental Wellness Platform** that bridges the gap between AI-driven emotional support and professional clinical therapy. It uses high-frequency engagement loops (Mood, Journal, Habits) to build a long-term wellness profile that informs both AI companions and human therapists.

---

## 🛠️ 2. Comprehensive Tech Stack

### 📱 Frontend (apps/frontend)
*   **Framework:** Next.js 16.2.4 (App Router)
*   **Core Logic:** React 19.2.4, TypeScript 5.x
*   **Styling:** Tailwind CSS 4.0.0 (Atomic Design)
*   **Animations:** Framer Motion 12.38.0
*   **Charts:** Recharts 3.8.1 (for Mood & Insight analytics)
*   **Components:** Radix UI primitives, shadcn/ui
*   **Forms:** React Hook Form 7.x + Zod 4.x validation
*   **State/UI:** Next-themes (Dark Mode), Sonner (Toasts)
*   **Real-time:** Daily.co React SDK (for Video Calls)

### ⚙️ Backend (apps/backend)
*   **Framework:** NestJS 11.0.1 (Modular Architecture)
*   **Language:** TypeScript 5.7.3
*   **ORM:** Prisma 7.8.0 (Type-safe Database access)
*   **Auth:** Passport.js + JWT (Stateless Authentication)
*   **Security:** Bcrypt (Hashing), class-validator, class-transformer
*   **Scheduling:** NestJS Schedule (Cron jobs for habit resets/reminders)
*   **Caching:** Cache-manager + Redis (optional local container)

---

## ☁️ 3. Cloud & Third-Party Infrastructure

*   **Database:** **LibSQL / Turso** (Edge-compatible SQLite with Prisma adapter)
*   **AI Engine:** **Google Gemini (Flash 2.5/3)** for chatbot, journal summarization, and distress detection.
*   **Video Infrastructure:** **Daily.co** for high-fidelity clinical video consultations.
*   **Payments:** Dual-provider integration with **Stripe** and **Razorpay**.
*   **Deployment (Infra):** 
    *   Docker & Docker Compose (Local DB/Redis management)
    *   Turso Cloud (Production Database)
    *   Vercel/DigitalOcean (Targeted deployment platforms)

---

## 🚀 4. Implemented Features & Functionality

### 🔐 Identity & Access
*   **Multi-Role Auth:** Supports `USER`, `ADMIN`, and `DOCTOR` roles.
*   **Legal Compliance:** Legal consent tracking (`legalConsentAt`) for clinical safety.
*   **Profile Management:** User onboarding (Gender, DOB, Profession, etc.).

### 🧠 The Swahit AI Companion (Chatbot)
*   **Stateful Memory Engine:** AI remembers user names, stressors, and goals via `UserMemoryProfile`.
*   **Passive Distress Detection:** Scans user messages for clinical distress signals and flags them for professional escalation.
*   **Asynchronous Memory Sync:** Background workers summarize long chat histories to keep AI context windows efficient.

### 📊 Wellness & Insights
*   **Mood Tracking:** Daily mood logging (Happy, Sad, Anxious, etc.) with 1-10 intensity.
*   **Analytical Dashboards:** Line and Bar charts visualizing mood trends and emotional distribution.
*   **Clinical Assessments:** Questionnaire engine with scoring logic and automated feedback.

### 🏥 Professional Clinical System
*   **Doctor Directory:** Specialty-based search (Therapists, Psychiatrists, etc.).
*   **Slot-Based Booking:** Real-time availability management for doctors.
*   **Appointment Lifecycle:** PENDING -> CONFIRMED -> COMPLETED flow.
*   **Video Consultations:** Built-in video calling using Daily.co rooms.
*   **Clinical Notes:** Doctors can write notes and prescriptions (linked to pharmacy system).

### 📝 Core Engagement Loop (V2)
*   **AI Journaling:** Smart journal entries that are automatically summarized by AI.
*   **Habit Tracker:** Category-based habit building (Sleep, Exercise) with daily logging and streak tracking.
*   **Medicine System:** Prescription verification and medicine ordering system.
*   **Notifications:** Multi-channel system for reminders (Appointments, Habits).

### 💎 Subscription & Entitlements
*   **Tiered Pricing:** FREE, SILVER, GOLD, PLATINUM plans.
*   **Dynamic Entitlements:** Feature-level toggles (e.g., `ai_chat_advanced`) and rate-limiting via usage counters.
*   **Webhook Pipeline:** Robust handling of Stripe/Razorpay events with logging.

---

## 🗄️ 5. Database Schema (Prisma)

The system uses a highly relational schema optimized for clinical data integrity:

| Table Category | Key Entities |
| :--- | :--- |
| **User Core** | `User`, `Subscription`, `UserMemoryProfile` |
| **Engagement** | `MoodEntry`, `JournalEntry`, `Habit`, `HabitLog` |
| **Clinical** | `Doctor`, `DoctorSlot`, `Appointment`, `Prescription` |
| **AI/Chat** | `ChatSession`, `ChatMessage`, `ChatSummary` |
| **Ecommerce** | `MedicineOrder`, `OrderItem` |
| **Monetization** | `Plan`, `Feature`, `PlanFeature`, `UserSubscription`, `FeatureUsage` |
| **System** | `Notification`, `Message`, `WebhookLog`, `VideoSession` |

---

## 🛠️ 6. Repository Structure (Monorepo)

```text
/
├── apps/
│   ├── frontend/        # Next.js Application
│   └── backend/         # NestJS REST API
├── infra/
│   └── docker/          # Docker Compose (Postgres/Redis)
├── package.json         # Pnpm Workspace Root
└── pnpm-workspace.yaml  # Workspace Definitions
```

---

## 🔒 7. Security & Engineering Standards
*   **Type Safety:** End-to-end TypeScript enforcement.
*   **Input Validation:** Global `ValidationPipe` with `Zod` and `class-validator`.
*   **Data Isolation:** Multi-tenant awareness in all user-facing services.
*   **Background Processing:** AI summarization and email hooks are processed off the main request thread.

---
*Documentation Version: 1.5.0 (Cumulative Update)*
*Generated on: 2026-05-03*
