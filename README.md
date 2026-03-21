# PhuocDai BarberShop Frontend

Next.js 14 + Tailwind CSS + Framer Motion — Clean & Minimal UI.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS 3
- **Animation**: Framer Motion 11
- **State**: Zustand (auth + booking flow)
- **Server State**: TanStack Query v5
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios (auto token refresh)
- **UI**: Custom components (no external library)

## Setup

```bash
# 1. Install
npm install

# 2. Env
cp .env.local.example .env.local
# Sửa NEXT_PUBLIC_API_URL nếu backend chạy port khác

# 3. Run (đảm bảo backend đang chạy)
npm run dev
```

→ http://localhost:3001

## Cấu trúc trang

```
/                        Landing page (public)
/login                   Đăng nhập
/register                Đăng ký
/booking                 Đặt lịch 4 bước

/dashboard/customer      Customer: overview + cancel + review
/dashboard/barber        Barber: xác nhận booking + cập nhật status
/dashboard/barber/schedule  Barber: cài lịch làm việc
/dashboard/admin         Admin: KPI dashboard
/dashboard/admin/bookings   Admin: quản lý tất cả bookings
/dashboard/admin/services   Admin: CRUD dịch vụ
```

## Booking Flow (4 bước)

```
Chọn barber → Chọn dịch vụ → Chọn ngày & giờ → Xác nhận
```

State được quản lý bởi Zustand (`useBookingStore`), persist qua các bước.

## Tài khoản demo

| Role     | Email                      | Password      |
|----------|----------------------------|---------------|
| Admin    | admin@PhuocDai BarberShop.com       | Admin@123     |
| Barber   | barber1@PhuocDai BarberShop.com     | Barber@123    |
| Customer | customer@example.com       | Customer@123  |

## Các component chính

| Component              | Mô tả                          |
|------------------------|-------------------------------|
| `components/ui`        | Button, Input, Card, Modal, Avatar, Badge, Skeleton, StarRating |
| `components/layout/Navbar` | Responsive navbar + auth |
| `components/layout/DashboardLayout` | Sidebar layout cho 3 roles |
| `components/booking/StepBarber`     | Bước 1: chọn barber |
| `components/booking/StepService`    | Bước 2: chọn dịch vụ |
| `components/booking/StepDatetime`   | Bước 3: chọn ngày/giờ |
| `components/booking/StepConfirm`    | Bước 4: xác nhận |
| `components/dashboard/BookingCard`  | Card hiển thị booking |
| `store/auth.store.ts`  | Zustand auth (persist)        |
| `store/booking.store.ts` | Zustand booking multi-step |
| `lib/api.ts`           | Axios + auto refresh token    |
