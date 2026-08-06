# Perancangan Arsitektur Sistem SIMON PST

## Tujuan

Dokumen ini menjelaskan rancangan arsitektur sistem SIMON PST berdasarkan struktur proyek saat ini. SIMON PST adalah aplikasi internal untuk monitoring kinerja harian petugas Pelayanan Statistik Terpadu dengan stack utama Next.js App Router, TypeScript, Prisma, PostgreSQL, NextAuth, dan pnpm.

## Ringkasan Arsitektur

Sistem memakai arsitektur web monolitik berbasis Next.js. Lapisan UI, routing halaman, API route handlers, autentikasi, logika bisnis, validasi, dan akses database berada dalam satu aplikasi. Database PostgreSQL menjadi penyimpanan utama, sedangkan Prisma dipakai sebagai ORM dan migration manager.

## Arsitektur Teknologi

Arsitektur teknologi SIMON PST terdiri atas lapisan antarmuka yang dibangun menggunakan Next.js, React, TypeScript, dan Tailwind CSS. Lapisan aplikasi menangani halaman dashboard, API internal, autentikasi pengguna, otorisasi berbasis role, validasi data, serta proses bisnis penilaian harian, dashboard, laporan, notifikasi, dan Evaluasi, Reward, dan Punishment.

Pada sisi data, Prisma ORM menjadi penghubung antara logika aplikasi dan PostgreSQL. Prisma juga dipakai untuk schema, migration, seed data awal, dan query database. Pengguna mengakses SIMON PST melalui peramban pada komputer yang terhubung ke server aplikasi internal. Server aplikasi menjalankan Next.js, membaca konfigurasi dari environment variable, lalu berkomunikasi dengan PostgreSQL sebagai penyimpanan utama.

```mermaid
flowchart TB
  subgraph Access["Akses Pengguna Internal"]
    Browser["Peramban Pengguna<br/>komputer jaringan internal"]
    Roles["Role Pengguna<br/>ADMIN, SUPERVISOR, PIMPINAN"]
  end

  subgraph Frontend["Lapisan Antarmuka"]
    NextPages["Next.js Pages<br/>halaman login dan dashboard"]
    ReactUI["React Components<br/>form, tabel, dialog, dan chart"]
    Styling["Tailwind CSS & UI Components"]
  end

  subgraph AppLayer["Lapisan Logika Aplikasi"]
    RouteHandlers["API Internal<br/>komunikasi data aplikasi"]
    NextAuth["NextAuth<br/>autentikasi pengguna"]
    RoleGuard["Role Guard<br/>ADMIN, SUPERVISOR, PIMPINAN"]
    Validation["Zod<br/>validasi data"]
    Services["Logika Bisnis<br/>penilaian, laporan, notifikasi, evaluasi/reward/punishment"]
    Export["Export Engine<br/>PDF dan Excel"]
  end

  subgraph DataAccess["Lapisan Akses Data"]
    Prisma["Prisma ORM<br/>schema, client, migrations, seed"]
  end

  subgraph Database["Lapisan Penyimpanan"]
    Postgres[("PostgreSQL<br/>database simon_pst")]
  end

  subgraph Runtime["Konfigurasi & Runtime"]
    Env["Konfigurasi Aplikasi<br/>database dan autentikasi"]
    Pnpm["Package Manager<br/>pnpm"]
  end

  Roles --> Browser
  Browser --> NextPages
  NextPages --> ReactUI
  ReactUI --> Styling
  ReactUI <--> RouteHandlers
  NextPages --> NextAuth
  RouteHandlers --> NextAuth
  NextAuth --> RoleGuard
  RouteHandlers --> RoleGuard
  RouteHandlers --> Validation
  RouteHandlers --> Services
  Services --> Export
  Services --> Prisma
  NextAuth --> Prisma
  Prisma --> Postgres
  Env --> NextAuth
  Env --> Prisma
  Pnpm --> NextPages
  Pnpm --> Prisma
```

## Diagram Arsitektur Sistem

```mermaid
flowchart TB
  subgraph UserLayer["Aktor Pengguna"]
    Admin["ADMIN"]
    Supervisor["SUPERVISOR"]
    Pimpinan["PIMPINAN"]
  end

  subgraph ClientLayer["Client Browser"]
    LoginPage["Halaman Login"]
    DashboardUI["Dashboard & Modul UI"]
    NotificationUI["Topbar Bell & Halaman Notifikasi"]
  end

  subgraph NextApp["Next.js App Router"]
    PageRoutes["Page Routes<br/>login dan dashboard"]
    ApiRoutes["API Routes<br/>endpoint internal aplikasi"]
    Middleware["Middleware<br/>proteksi akses awal"]
    ServerComponents["Server Components & Layout"]
  end

  subgraph CoreLayer["Application Core"]
    AuthGuard["Auth Guard<br/>requireAuth, requireApiAuth, requireApiRoles"]
    Validation["Zod Validation<br/>validasi data masuk"]
    BusinessServices["Business Services<br/>dashboard, assessments, reward-punishment, reports, notifications"]
    ExportServices["Export Services<br/>PDF & Excel"]
  end

  subgraph DataLayer["Data Layer"]
    PrismaClient["Prisma Client<br/>akses database"]
    PostgreSQL[("PostgreSQL<br/>simon_pst")]
  end

  Admin --> LoginPage
  Supervisor --> LoginPage
  Pimpinan --> LoginPage
  LoginPage --> DashboardUI
  DashboardUI --> PageRoutes
  NotificationUI --> PageRoutes
  PageRoutes --> ServerComponents
  DashboardUI --> ApiRoutes
  NotificationUI --> ApiRoutes
  Middleware --> PageRoutes
  ApiRoutes --> AuthGuard
  ServerComponents --> AuthGuard
  ApiRoutes --> Validation
  ApiRoutes --> BusinessServices
  BusinessServices --> ExportServices
  BusinessServices --> PrismaClient
  AuthGuard --> PrismaClient
  PrismaClient --> PostgreSQL
```

## Container dan Layer Sistem

```mermaid
flowchart LR
  subgraph Browser["Browser Pengguna"]
    UI["React UI<br/>Dashboard shell, tabel, form, dialog, chart"]
    SessionClient["Session Client<br/>NextAuth session"]
  end

  subgraph WebApp["SIMON PST - Next.js"]
    Auth["Autentikasi<br/>NextAuth Credentials + JWT"]
    Pages["Halaman Dashboard<br/>dashboard, officers, assessments, reward-punishment, reports, notifications, settings"]
    APIs["Route Handlers<br/>REST-style JSON endpoints"]
    Domain["Domain Logic<br/>layanan proses bisnis"]
    Schemas["Request Validation<br/>Zod schemas"]
    Reports["Report Export<br/>PDF dan Excel"]
  end

  subgraph Persistence["Persistensi"]
    ORM["Prisma ORM"]
    DB[("PostgreSQL")]
    Migrations["Prisma Migrations"]
    Seed["Seed Data<br/>admin, unit, criteria"]
  end

  UI <--> APIs
  UI --> Pages
  SessionClient <--> Auth
  Pages --> Auth
  APIs --> Auth
  APIs --> Schemas
  APIs --> Domain
  Domain --> Reports
  Domain --> ORM
  Auth --> ORM
  ORM <--> DB
  Migrations --> DB
  Seed --> DB
```

## Modul Utama

```mermaid
flowchart TB
  subgraph MasterData["Master Data"]
    Units["Unit"]
    Officers["Petugas PST"]
    Criteria["Kriteria Penilaian"]
    Users["User & Role"]
  end

  subgraph DailyOps["Operasional Harian"]
    Assessments["Penilaian Harian"]
    Scores["Skor per Kriteria"]
    Dashboard["Dashboard Monitoring"]
  end

  subgraph Evaluation["Evaluasi, Reward, dan Punishment"]
    RecommendationGenerator["Generate Rekomendasi"]
    RecommendationList["Daftar Rekomendasi"]
    Decision["Approval / Reject oleh PIMPINAN"]
  end

  subgraph Communication["Komunikasi Sistem"]
    Notifications["Notifikasi"]
    Audit["Audit Log"]
    Reports["Laporan PDF / Excel"]
  end

  Units --> Officers
  Officers --> Assessments
  Criteria --> Scores
  Assessments --> Scores
  Assessments --> Dashboard
  Assessments --> RecommendationGenerator
  RecommendationGenerator --> RecommendationList
  RecommendationList --> Decision
  RecommendationGenerator --> Notifications
  Decision --> Notifications
  Assessments --> Notifications
  Assessments --> Reports
  RecommendationList --> Reports
  Users --> Assessments
  Users --> Decision
  Users --> Audit
  Assessments --> Audit
  RecommendationList --> Audit
```

## Perancangan Use Case

Use case menggambarkan interaksi pengguna dengan fungsi utama aplikasi SIMON PST. Pada sistem ini, `ADMIN` berinteraksi dengan pengelolaan master data, pengaturan pengguna, input penilaian, pembuatan rekomendasi Evaluasi, Reward, dan Punishment, laporan, serta notifikasi. `SUPERVISOR` berfokus pada operasional penilaian petugas, pemantauan dashboard, pembuatan rekomendasi, laporan, dan notifikasi. `PIMPINAN` berinteraksi dengan dashboard monitoring, evaluasi rekomendasi, persetujuan atau penolakan rekomendasi, laporan, dan notifikasi.

```mermaid
%%{init: {"flowchart": {"curve": "basis"}} }%%
flowchart TB
  subgraph Actors["Aktor Pengguna"]
    Admin["ADMIN"]
    Supervisor["SUPERVISOR"]
    Pimpinan["PIMPINAN"]
  end

  subgraph Access["Akses Sistem"]
    Login["Login ke Sistem"]
    Logout["Logout dari Sistem"]
    Notifications["Melihat dan Membuka Notifikasi"]
  end

  subgraph MasterData["Master Data dan Pengaturan"]
    ManageUnits["Kelola Data Unit"]
    ManageOfficers["Kelola Data Petugas PST"]
    ManageCriteria["Kelola Kriteria Penilaian"]
    ManageUsers["Kelola Data Pengguna"]
    Settings["Akses Pengaturan Sistem"]
  end

  subgraph Assessment["Penilaian dan Monitoring"]
    DailyAssessment["Kelola Penilaian Harian"]
    ViewAssessmentHistory["Lihat Riwayat Penilaian"]
    Dashboard["Lihat Dashboard Monitoring"]
  end

  subgraph Evaluation["Evaluasi, Reward, dan Punishment"]
    GenerateEvaluation["Buat Rekomendasi"]
    ReviewRecommendation["Lihat Daftar Rekomendasi"]
    DecideRecommendation["Setujui atau Tolak Rekomendasi"]
  end

  subgraph ReportArea["Laporan"]
    ExportReports["Unduh Laporan PDF atau Excel"]
  end

  Admin --> Access
  Supervisor --> Access
  Pimpinan --> Access

  Admin --> MasterData
  Admin --> Assessment
  Admin --> Evaluation
  Admin --> ReportArea

  Supervisor --> Assessment
  Supervisor --> Evaluation
  Supervisor --> ReportArea

  Pimpinan --> Assessment
  Pimpinan --> Evaluation
  Pimpinan --> ReportArea

  Access --> Dashboard
  MasterData --> DailyAssessment
  DailyAssessment --> ViewAssessmentHistory
  ViewAssessmentHistory --> Dashboard
  Dashboard --> GenerateEvaluation
  GenerateEvaluation --> ReviewRecommendation
  ReviewRecommendation --> DecideRecommendation
  Dashboard --> ExportReports
  ReviewRecommendation --> ExportReports
  GenerateEvaluation --> Notifications
  DecideRecommendation --> Notifications

  classDef admin fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:2px
  classDef supervisor fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:2px
  classDef pimpinan fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:2px
  classDef access fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,stroke-width:2px
  classDef master fill:#ede9fe,stroke:#7c3aed,color:#4c1d95,stroke-width:2px
  classDef assessment fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:2px
  classDef evaluation fill:#fff7ed,stroke:#f97316,color:#7c2d12,stroke-width:2px
  classDef report fill:#ffe4e6,stroke:#e11d48,color:#881337,stroke-width:2px

  class Admin admin
  class Supervisor supervisor
  class Pimpinan pimpinan
  class Login,Logout,Notifications access
  class ManageUnits,ManageOfficers,ManageCriteria,ManageUsers,Settings master
  class DailyAssessment,ViewAssessmentHistory,Dashboard assessment
  class GenerateEvaluation,ReviewRecommendation,DecideRecommendation evaluation
  class ExportReports report

  linkStyle 0,3,4,5,6 stroke:#2563eb,stroke-width:2.5px
  linkStyle 1,7,8,9 stroke:#16a34a,stroke-width:2.5px
  linkStyle 2,10,11,12 stroke:#d97706,stroke-width:2.5px
  linkStyle 13,14,15,16,17,18,19,20,21,22,23 stroke:#64748b,stroke-width:2px
```

## Rincian Use Case

```mermaid
%%{init: {"flowchart": {"curve": "basis"}} }%%
flowchart TB
  Login["Login"]
  Logout["Logout"]

  Unit["Kelola Unit"]
  Officer["Kelola Petugas PST"]
  Criteria["Kelola Kriteria"]
  User["Kelola Pengguna"]

  InputAssessment["Input Penilaian Harian"]
  EditAssessment["Ubah Penilaian"]
  AssessmentHistory["Lihat Riwayat Penilaian"]

  Dashboard["Lihat Dashboard"]
  Generate["Generate Rekomendasi"]
  Approval["Approve / Reject Rekomendasi"]

  Report["Export Laporan"]
  Notification["Buka Notifikasi"]

  Login --> Dashboard
  Unit --> Officer
  Criteria --> InputAssessment
  Officer --> InputAssessment
  InputAssessment --> AssessmentHistory
  InputAssessment --> Dashboard
  AssessmentHistory --> Generate
  Generate --> Approval
  Dashboard --> Report
  Generate --> Report
  Generate --> Notification
  Approval --> Notification

  classDef auth fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,stroke-width:2px
  classDef master fill:#ede9fe,stroke:#7c3aed,color:#4c1d95,stroke-width:2px
  classDef assessment fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:2px
  classDef evaluation fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:2px
  classDef output fill:#ffe4e6,stroke:#e11d48,color:#881337,stroke-width:2px

  class Login,Logout auth
  class Unit,Officer,Criteria,User master
  class InputAssessment,EditAssessment,AssessmentHistory assessment
  class Dashboard,Generate,Approval evaluation
  class Report,Notification output

  linkStyle 0 stroke:#0284c7,stroke-width:2.5px
  linkStyle 1,2,3 stroke:#7c3aed,stroke-width:2.5px
  linkStyle 4,5,6 stroke:#16a34a,stroke-width:2.5px
  linkStyle 7,8,9 stroke:#d97706,stroke-width:2.5px
  linkStyle 10,11 stroke:#e11d48,stroke-width:2.5px
```

## Perancangan Activity Diagram

Activity diagram menggambarkan alur aktivitas pengguna dan sistem dalam menjalankan proses utama SIMON PST. Pada proyek ini, aktivitas utama meliputi proses penilaian harian petugas, pembaruan dashboard, pembuatan rekomendasi Evaluasi, Reward, dan Punishment, persetujuan rekomendasi oleh PIMPINAN, serta pengunduhan laporan.

## Activity Diagram Penilaian Harian

Proses penilaian menggambarkan alur mulai dari Pimpinan masuk ke aplikasi, membuka menu penilaian, memilih petugas, mengisi skor berdasarkan kriteria, melakukan validasi data, menyimpan penilaian, sampai sistem memperbarui riwayat penilaian dan rekap dashboard.

```mermaid
flowchart TB
  Start([Mulai])
  Login["Pimpinan masuk ke aplikasi"]
  AuthCheck{"Login valid?"}
  OpenDashboard["Sistem menampilkan dashboard"]
  OpenAssessment["Pimpinan membuka menu penilaian"]
  SelectOfficer["Pimpinan memilih petugas PST"]
  FillScores["Pimpinan mengisi skor penilaian"]
  FillNotes["Pimpinan mengisi catatan jika diperlukan"]
  Validate["Sistem melakukan validasi data"]
  ValidCheck{"Data valid?"}
  ShowError["Sistem menampilkan pesan kesalahan"]
  Calculate["Sistem menghitung nilai rata-rata"]
  SaveAssessment["Sistem menyimpan data penilaian"]
  UpdateRecap["Sistem memperbarui rekap penilaian"]
  UpdateDashboard["Sistem memperbarui dashboard"]
  Finish([Selesai])

  Start --> Login
  Login --> AuthCheck
  AuthCheck -- Tidak --> Login
  AuthCheck -- Ya --> OpenDashboard
  OpenDashboard --> OpenAssessment
  OpenAssessment --> SelectOfficer
  SelectOfficer --> FillScores
  FillScores --> FillNotes
  FillNotes --> Validate
  Validate --> ValidCheck
  ValidCheck -- Tidak --> ShowError
  ShowError --> FillScores
  ValidCheck -- Ya --> Calculate
  Calculate --> SaveAssessment
  SaveAssessment --> UpdateRecap
  UpdateRecap --> UpdateDashboard
  UpdateDashboard --> Finish
```

## Activity Diagram Evaluasi, Reward, dan Punishment

Proses Evaluasi, Reward, dan Punishment dimulai dari ADMIN atau SUPERVISOR memilih periode penilaian, sistem menghitung rata-rata penilaian petugas, menghasilkan rekomendasi, lalu PIMPINAN meninjau dan menentukan keputusan persetujuan atau penolakan.

```mermaid
flowchart LR
  Start([Mulai])
  Login["Login"]

  subgraph GenerateFlow["Generate Rekomendasi"]
    OpenModule["Buka menu evaluasi"]
    SelectPeriod["Pilih periode"]
    SelectMode["Pilih mode"]
    Aggregate["Agregasi penilaian"]
    CandidateCheck{"Ada kandidat?"}
    EmptyState["Tampilkan data kosong"]
    Generate["Buat rekomendasi"]
    SaveRecommendation["Simpan RECOMMENDED"]
    NotifyLeader["Notifikasi PIMPINAN"]
  end

  subgraph DecisionFlow["Keputusan PIMPINAN"]
    LeaderOpen["Buka daftar rekomendasi"]
    Review["Tinjau detail"]
    Decision{"Keputusan"}
    Approve["Setujui"]
    Reject["Tolak"]
    SaveDecision["Simpan keputusan"]
    NotifyResult["Notifikasi hasil"]
    UpdateList["Update daftar"]
  end

  Finish([Selesai])

  Start --> Login
  Login --> OpenModule
  OpenModule --> SelectPeriod
  SelectPeriod --> SelectMode
  SelectMode --> Aggregate
  Aggregate --> CandidateCheck
  CandidateCheck -- Tidak --> EmptyState
  EmptyState --> Finish
  CandidateCheck -- Ya --> Generate
  Generate --> SaveRecommendation
  SaveRecommendation --> NotifyLeader
  NotifyLeader --> LeaderOpen
  LeaderOpen --> Review
  Review --> Decision
  Decision -- Disetujui --> Approve
  Decision -- Ditolak --> Reject
  Approve --> SaveDecision
  Reject --> SaveDecision
  SaveDecision --> NotifyResult
  NotifyResult --> UpdateList
  UpdateList --> Finish
```

## Activity Diagram Laporan

Proses laporan digunakan untuk melihat dan mengunduh data penilaian maupun rekomendasi dalam bentuk PDF atau Excel berdasarkan filter periode, unit, petugas, status, atau jenis rekomendasi.

```mermaid
flowchart LR
  Start([Mulai])
  Login["Login"]
  OpenReport["Buka laporan"]
  SetFilter["Tentukan filter"]
  Preview["Pratinjau data"]
  DataCheck{"Data tersedia?"}
  Empty["Data kosong"]
  ChooseFormat["Pilih PDF/Excel"]
  GenerateFile["Generate file"]
  Download["Unduh laporan"]
  Finish([Selesai])

  Start --> Login
  Login --> OpenReport
  OpenReport --> SetFilter
  SetFilter --> Preview
  Preview --> DataCheck
  DataCheck -- Tidak --> Empty
  Empty --> SetFilter
  DataCheck -- Ya --> ChooseFormat
  ChooseFormat --> GenerateFile
  GenerateFile --> Download
  Download --> Finish
```

## Alur Autentikasi dan Otorisasi

```mermaid
sequenceDiagram
  autonumber
  actor User as Pengguna
  participant Browser as Browser
  participant Login as /login
  participant NextAuth as NextAuth Credentials
  participant Prisma as Prisma Client
  participant DB as PostgreSQL
  participant Guard as Auth Guard
  participant Page as Dashboard/API

  User->>Browser: Input email dan password
  Browser->>Login: Submit form login
  Login->>NextAuth: Kirim credentials
  NextAuth->>Prisma: Cari User by email
  Prisma->>DB: SELECT User
  DB-->>Prisma: Data user
  Prisma-->>NextAuth: User aktif + passwordHash
  NextAuth->>NextAuth: Verifikasi password bcrypt
  NextAuth-->>Browser: Buat JWT session jika valid
  Browser->>Page: Akses halaman/API terproteksi
  Page->>Guard: requireAuth / requireApiAuth / requireApiRoles
  Guard->>NextAuth: Baca server session
  NextAuth-->>Guard: Session + role
  Guard-->>Page: Izinkan, redirect, 401, atau 403
```

## Alur Penilaian Harian

```mermaid
sequenceDiagram
  autonumber
  actor Staff as ADMIN / SUPERVISOR
  participant UI as Assessment UI
  participant API as /api/assessments
  participant Guard as Auth Guard
  participant Zod as Zod Validation
  participant Service as Assessment Logic
  participant Prisma as Prisma Client
  participant DB as PostgreSQL
  participant Audit as Audit Log

  Staff->>UI: Isi penilaian petugas
  UI->>API: POST/PUT data assessment
  API->>Guard: Validasi session dan role
  Guard-->>API: Session valid
  API->>Zod: Validasi payload
  Zod-->>API: Payload valid
  API->>Service: Hitung averageScore dan aturan PRESENT/ABSENT
  Service->>Prisma: Simpan DailyAssessment
  Prisma->>DB: INSERT/UPDATE DailyAssessment
  Service->>Prisma: Simpan AssessmentScore jika PRESENT
  Prisma->>DB: INSERT/UPDATE AssessmentScore
  Service->>Audit: Catat perubahan penting
  Audit->>DB: INSERT AuditLog
  API-->>UI: Response JSON
```

## Alur Evaluasi, Reward, dan Punishment

```mermaid
sequenceDiagram
  autonumber
  actor Admin as ADMIN / SUPERVISOR
  actor Leader as PIMPINAN
  participant UI as Reward Punishment UI
  participant API as /api/reward-punishment
  participant Service as Reward Punishment Logic
  participant Notify as Notification Service
  participant Prisma as Prisma Client
  participant DB as PostgreSQL

  Admin->>UI: Pilih periode dan mode generate
  UI->>API: Generate rekomendasi
  API->>Service: Agregasi DailyAssessment PRESENT
  Service->>Prisma: Query rata-rata skor per petugas
  Prisma->>DB: SELECT DailyAssessment + Officer
  DB-->>Prisma: Data agregasi
  Service->>Service: Tentukan EVALUASI / REWARD / PUNISHMENT
  Service->>Prisma: Simpan RewardPunishment RECOMMENDED
  Prisma->>DB: INSERT RewardPunishment
  Service->>Notify: Buat notifikasi pending approval
  Notify->>DB: INSERT Notification untuk PIMPINAN
  Leader->>UI: Buka rekomendasi
  Leader->>API: Approve atau reject
  API->>Service: Update status keputusan
  Service->>Prisma: Simpan decidedById dan decidedAt
  Prisma->>DB: UPDATE RewardPunishment
  Service->>Notify: Buat notifikasi hasil keputusan
  Notify->>DB: INSERT Notification ke role terkait
```

## Alur Dashboard dan Laporan

```mermaid
flowchart LR
  Filters["Filter waktu, unit, petugas"] --> DashboardAPI["GET /api/dashboard/summary"]
  DashboardAPI --> DashboardService["getDashboardSummary"]
  DashboardService --> AssessmentData["DailyAssessment PRESENT/ABSENT"]
  DashboardService --> ScoreData["AssessmentScore per Criteria"]
  DashboardService --> OfficerData["Officer + Unit"]
  AssessmentData --> Aggregation["Agregasi statistik"]
  ScoreData --> Aggregation
  OfficerData --> Aggregation
  Aggregation --> Cards["Summary Cards"]
  Aggregation --> Ranking["Ranking Petugas"]
  Aggregation --> Trends["Tren Harian/Mingguan/Bulanan"]
  Aggregation --> Charts["Distribusi Kriteria & Perbandingan Unit"]

  ReportFilters["Filter laporan"] --> ReportAPI["/api/reports/export<br/>/api/reward-punishment/export"]
  ReportAPI --> ExportLib["Report Export Services"]
  ExportLib --> PDF["PDF"]
  ExportLib --> Excel["Excel"]
```

## Alur Notifikasi

```mermaid
flowchart TB
  Events["Event Bisnis"] --> EventTypes{"Jenis Event"}
  EventTypes --> Generated["Rekomendasi dibuat"]
  EventTypes --> Pending["Butuh persetujuan PIMPINAN"]
  EventTypes --> Approved["Rekomendasi disetujui"]
  EventTypes --> Rejected["Rekomendasi ditolak"]
  EventTypes --> Reminder["Penilaian harian belum lengkap"]

  Generated --> NotificationService["Notification Service"]
  Pending --> NotificationService
  Approved --> NotificationService
  Rejected --> NotificationService
  Reminder --> NotificationService

  NotificationService --> RoleTargeting["Target by Role<br/>ADMIN, SUPERVISOR, PIMPINAN"]
  RoleTargeting --> NotificationTable[("Notification")]
  NotificationTable --> APIList["GET /api/notifications"]
  NotificationTable --> APIMarkRead["PATCH /api/notifications/[id]/read"]
  NotificationTable --> APIReadAll["PATCH /api/notifications/read-all"]
  APIList --> Bell["Topbar Notification Bell"]
  APIList --> NotificationPage["Halaman Notifications"]
  APIMarkRead --> OpenRoute["/notifications/open/[id]"]
  OpenRoute --> TargetPage["Halaman tujuan sesuai metadata"]
```

## Entity Relationship Diagram SIMON Petugas PST

Entity Relationship Diagram SIMON Petugas PST menggambarkan hubungan data utama pada sistem, mulai dari pengguna aplikasi, unit kerja, petugas PST, kriteria penilaian, penilaian harian, skor per kriteria, rekomendasi Evaluasi, Reward, dan Punishment, audit log, hingga notifikasi.

```mermaid
erDiagram
  USER ||--o{ DAILY_ASSESSMENT : melakukan_penilaian
  USER ||--o{ REWARD_PUNISHMENT : memberi_keputusan
  USER ||--o{ AUDIT_LOG : menghasilkan
  USER ||--o{ NOTIFICATION : menerima

  UNIT ||--o{ OFFICER : menaungi
  OFFICER ||--o{ DAILY_ASSESSMENT : dinilai
  DAILY_ASSESSMENT ||--o{ ASSESSMENT_SCORE : memiliki
  CRITERIA ||--o{ ASSESSMENT_SCORE : digunakan_pada
  OFFICER ||--o{ REWARD_PUNISHMENT : mendapatkan

  USER {
    string id PK
    string name
    string email UK
    string passwordHash
    Role role
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  UNIT {
    string id PK
    string name
    string description
  }

  OFFICER {
    string id PK
    string nip UK
    string name
    string jabatan
    string unitId FK
    boolean isActive
    datetime createdAt
  }

  CRITERIA {
    string id PK
    string name
    string description
    int sortOrder
    boolean isActive
  }

  DAILY_ASSESSMENT {
    string id PK
    string officerId FK
    string assessorId FK
    date assessmentDate
    AttendanceStatus status
    float averageScore
    string notes
    datetime createdAt
    datetime updatedAt
  }

  ASSESSMENT_SCORE {
    string id PK
    string dailyAssessmentId FK
    string criteriaId FK
    float score
  }

  REWARD_PUNISHMENT {
    string id PK
    string officerId FK
    RewardPunishmentType type
    RewardPunishmentPeriodKind periodKind
    date referenceDate
    string category
    date periodStart
    date periodEnd
    float triggerScore
    RewardPunishmentStatus status
    string decidedById FK
    datetime decidedAt
    string notes
    datetime createdAt
  }

  AUDIT_LOG {
    string id PK
    string userId FK
    AuditAction action
    string entity
    string entityId
    json beforeData
    json afterData
    datetime createdAt
  }

  NOTIFICATION {
    string id PK
    string userId FK
    NotificationType type
    string title
    string message
    string href
    string entity
    string entityId
    boolean isRead
    datetime readAt
    json metadata
    datetime createdAt
  }
```

## ERD Database

```mermaid
erDiagram
  User ||--o{ DailyAssessment : assesses
  User ||--o{ RewardPunishment : decides
  User ||--o{ AuditLog : writes
  User ||--o{ Notification : receives
  Unit ||--o{ Officer : contains
  Officer ||--o{ DailyAssessment : has
  Officer ||--o{ RewardPunishment : receives
  DailyAssessment ||--o{ AssessmentScore : contains
  Criteria ||--o{ AssessmentScore : measured_by

  User {
    string id PK
    string name
    string email UK
    string passwordHash
    Role role
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  Unit {
    string id PK
    string name
    string description
  }

  Officer {
    string id PK
    string nip UK
    string name
    string jabatan
    string unitId FK
    boolean isActive
    datetime createdAt
  }

  Criteria {
    string id PK
    string name
    string description
    int sortOrder
    boolean isActive
  }

  DailyAssessment {
    string id PK
    string officerId FK
    string assessorId FK
    date assessmentDate
    AttendanceStatus status
    float averageScore
    string notes
    datetime createdAt
    datetime updatedAt
  }

  AssessmentScore {
    string id PK
    string dailyAssessmentId FK
    string criteriaId FK
    float score
  }

  RewardPunishment {
    string id PK
    string officerId FK
    RewardPunishmentType type
    RewardPunishmentPeriodKind periodKind
    date referenceDate
    string category
    date periodStart
    date periodEnd
    float triggerScore
    RewardPunishmentStatus status
    string decidedById FK
    datetime decidedAt
    string notes
    datetime createdAt
  }

  AuditLog {
    string id PK
    string userId FK
    AuditAction action
    string entity
    string entityId
    json beforeData
    json afterData
    datetime createdAt
  }

  Notification {
    string id PK
    string userId FK
    NotificationType type
    string title
    string message
    string href
    string entity
    string entityId
    boolean isRead
    datetime readAt
    json metadata
    datetime createdAt
  }
```

## Matriks Peran dan Akses

```mermaid
flowchart LR
  Admin["ADMIN"] --> ManageMaster["Kelola master data"]
  Admin --> DailyAssessment["Input dan koreksi penilaian"]
  Admin --> GenerateRecommendation["Generate evaluasi/reward/punishment"]
  Admin --> Reports["Export laporan"]
  Admin --> Notifications["Kelola notifikasi pribadi"]

  Supervisor["SUPERVISOR"] --> DailyAssessment
  Supervisor --> GenerateRecommendation
  Supervisor --> Reports
  Supervisor --> Notifications

  Pimpinan["PIMPINAN"] --> Dashboard["Monitoring dashboard"]
  Pimpinan --> Decision["Approve / reject rekomendasi"]
  Pimpinan --> Reports
  Pimpinan --> Notifications
```

## Deployment Internal

```mermaid
flowchart TB
  DevMachine["Developer / Admin Server"] --> PullCode["Update source code"]
  PullCode --> Install["pnpm install"]
  Install --> PrismaGenerate["pnpm prisma generate"]
  PrismaGenerate --> Migrate["pnpm prisma:deploy"]
  Migrate --> Seed["pnpm prisma:seed"]
  Seed --> Build["pnpm build"]
  Build --> Start["pnpm start / PM2"]
  Start --> LAN["Akses LAN<br/>http://IP-SERVER:3000"]
  Start --> DB[("PostgreSQL")]
```

## Catatan Desain

- Arsitektur saat ini cocok untuk deployment internal karena seluruh komponen aplikasi berjalan dalam satu Next.js app.
- Prisma menjadi batas utama antara application layer dan PostgreSQL.
- NextAuth Credentials dipakai untuk login internal berbasis email dan password hash bcrypt.
- Role utama adalah `ADMIN`, `SUPERVISOR`, dan `PIMPINAN`.
- Data histori seperti penilaian, keputusan evaluasi/reward/punishment, audit log, dan notifikasi dipertahankan di database.
- Notifikasi dibuat dari event bisnis dan diarahkan ke halaman tujuan melalui metadata.
- Export laporan dipisahkan sebagai service agar endpoint laporan tidak mencampur query, format, dan rendering dokumen secara berlebihan.
