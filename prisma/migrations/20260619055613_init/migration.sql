-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `zone` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `payment_status` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `amount` DECIMAL(10, 2) NOT NULL,
    `service_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,

    INDEX `bookings_start_time_end_time_idx`(`start_time`, `end_time`),
    INDEX `bookings_status_idx`(`status`),
    INDEX `bookings_payment_status_idx`(`payment_status`),
    INDEX `bookings_service_id_idx`(`service_id`),
    INDEX `bookings_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `method` ENUM('CASH', 'TRANSFER', 'YAPE', 'PLIN', 'CARD') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paid_at` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_booking_id_key`(`booking_id`),
    INDEX `payments_paid_at_idx`(`paid_at`),
    INDEX `payments_method_idx`(`method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
