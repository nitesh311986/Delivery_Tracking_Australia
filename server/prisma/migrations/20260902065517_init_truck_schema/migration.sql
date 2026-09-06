-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LegType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "subcontractor_name" TEXT,
    "business_name" TEXT DEFAULT 'Velocity Taxi Trucks',
    "rego" TEXT,
    "yard_location" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DRIVER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runsheets" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "shift_date" DATE NOT NULL,
    "odometer_start" DECIMAL(10,2) NOT NULL,
    "odometer_finish" DECIMAL(10,2),
    "total_distance" DECIMAL(10,2),
    "origin_yard" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT,
    "depot_end_location" TEXT,
    "first_arrival" TEXT,
    "final_depart" TEXT,
    "return_time" TEXT,
    "break_1" TEXT,
    "break_2" TEXT,
    "break_3" TEXT,
    "break_4" TEXT,
    "comments" TEXT,
    "signature_url" TEXT,
    "status" "ShiftStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runsheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runsheet_legs" (
    "id" TEXT NOT NULL,
    "runsheet_id" TEXT NOT NULL,
    "leg_order" INTEGER NOT NULL,
    "type" "LegType" NOT NULL,
    "company_name" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "arrival_time" TEXT NOT NULL,
    "departure_time" TEXT NOT NULL,
    "authorised_person" TEXT,
    "item_count" INTEGER NOT NULL DEFAULT 1,
    "item_description" TEXT,
    "toll_used" BOOLEAN NOT NULL DEFAULT false,
    "toll_amount" DECIMAL(8,2) DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runsheet_legs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "payload" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "runsheets_driver_id_shift_date_idx" ON "runsheets"("driver_id", "shift_date");

-- CreateIndex
CREATE INDEX "runsheets_status_idx" ON "runsheets"("status");

-- CreateIndex
CREATE INDEX "runsheet_legs_runsheet_id_idx" ON "runsheet_legs"("runsheet_id");

-- CreateIndex
CREATE INDEX "runsheet_legs_company_name_idx" ON "runsheet_legs"("company_name");

-- AddForeignKey
ALTER TABLE "runsheets" ADD CONSTRAINT "runsheets_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runsheet_legs" ADD CONSTRAINT "runsheet_legs_runsheet_id_fkey" FOREIGN KEY ("runsheet_id") REFERENCES "runsheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
