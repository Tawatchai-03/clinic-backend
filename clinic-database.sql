-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: db.busitplus.com    Database: cliniccare
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `apt_date` date NOT NULL,
  `apt_time` time NOT NULL,
  `status` enum('booked','cancelled','done') NOT NULL DEFAULT 'booked',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_booking` (`doctor_id`,`apt_date`,`apt_time`),
  KEY `idx_patient` (`patient_id`,`apt_date`,`apt_time`),
  CONSTRAINT `fk_apt_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_apt_patient` FOREIGN KEY (`patient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (22,4,3,'2025-09-01','12:00:00','booked','2025-08-29 22:06:38'),(24,4,6,'2025-09-01','09:30:00','booked','2025-08-29 22:38:17'),(27,1,3,'2025-09-05','13:30:00','booked','2025-08-29 22:39:39'),(28,1,6,'2025-09-03','09:30:00','booked','2025-08-29 22:39:51'),(31,5,3,'2025-08-31','09:30:00','booked','2025-08-29 23:10:27');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_availability`
--

DROP TABLE IF EXISTS `doctor_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_availability` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `doctor_id` bigint unsigned NOT NULL,
  `slot_date` date NOT NULL,
  `slot_time` time NOT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_doc_date_time` (`doctor_id`,`slot_date`,`slot_time`),
  CONSTRAINT `fk_avail_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_availability`
--

LOCK TABLES `doctor_availability` WRITE;
/*!40000 ALTER TABLE `doctor_availability` DISABLE KEYS */;
INSERT INTO `doctor_availability` VALUES (7,3,'2025-08-31','09:30:00',0),(8,3,'2025-08-31','11:30:00',1),(9,3,'2025-08-31','13:30:00',1),(10,3,'2025-08-31','15:30:00',1),(11,6,'2025-08-30','09:00:00',1),(12,6,'2025-08-30','16:00:00',1),(13,6,'2025-08-30','13:30:00',1),(14,6,'2025-08-30','11:30:00',1),(37,3,'2025-09-01','09:00:00',1),(38,3,'2025-09-01','09:30:00',1),(39,3,'2025-09-01','10:00:00',1),(40,3,'2025-09-01','10:30:00',1),(41,3,'2025-09-01','11:00:00',1),(42,3,'2025-09-01','11:30:00',1),(43,3,'2025-09-01','12:00:00',0),(44,3,'2025-09-01','12:30:00',1),(45,3,'2025-09-02','10:30:00',1),(46,3,'2025-09-02','12:30:00',1),(47,3,'2025-09-02','14:30:00',1),(48,3,'2025-09-02','14:00:00',1),(49,3,'2025-09-02','12:00:00',1),(50,3,'2025-09-02','10:00:00',1),(51,3,'2025-09-03','10:00:00',1),(52,3,'2025-09-03','12:00:00',1),(53,3,'2025-09-03','14:00:00',1),(54,3,'2025-09-03','14:30:00',1),(55,3,'2025-09-03','12:30:00',1),(56,3,'2025-09-03','10:30:00',1),(57,3,'2025-09-04','10:00:00',1),(58,3,'2025-09-04','12:00:00',1),(59,3,'2025-09-04','14:00:00',1),(60,3,'2025-09-04','14:30:00',1),(61,3,'2025-09-04','12:30:00',1),(62,3,'2025-09-04','10:30:00',1),(63,3,'2025-09-04','09:30:00',1),(64,3,'2025-09-04','11:30:00',1),(65,3,'2025-09-04','13:30:00',1),(66,3,'2025-09-04','15:30:00',1),(67,3,'2025-09-04','16:00:00',1),(68,3,'2025-09-05','09:00:00',1),(69,3,'2025-09-05','09:30:00',1),(70,3,'2025-09-05','10:00:00',1),(71,3,'2025-09-05','10:30:00',1),(72,3,'2025-09-05','12:30:00',1),(73,3,'2025-09-05','12:00:00',1),(74,3,'2025-09-05','11:30:00',1),(75,3,'2025-09-05','11:00:00',1),(76,3,'2025-09-05','13:00:00',1),(77,3,'2025-09-05','13:30:00',0),(81,6,'2025-08-31','09:00:00',1),(82,6,'2025-08-31','09:30:00',1),(83,6,'2025-08-31','10:00:00',1),(84,6,'2025-08-31','10:30:00',1),(85,6,'2025-08-31','12:30:00',1),(86,6,'2025-08-31','12:00:00',1),(87,6,'2025-08-31','11:30:00',1),(88,6,'2025-08-31','11:00:00',1),(89,6,'2025-08-31','13:00:00',1),(90,6,'2025-08-31','13:30:00',1),(91,6,'2025-08-31','14:00:00',1),(92,6,'2025-08-31','14:30:00',1),(93,6,'2025-08-31','16:00:00',1),(94,6,'2025-08-31','15:30:00',1),(95,6,'2025-08-31','15:00:00',1),(96,6,'2025-09-01','09:00:00',1),(97,6,'2025-09-01','11:00:00',1),(98,6,'2025-09-01','15:00:00',1),(99,6,'2025-09-01','15:30:00',1),(100,6,'2025-09-01','13:30:00',1),(101,6,'2025-09-01','11:30:00',1),(102,6,'2025-09-01','09:30:00',0),(103,6,'2025-09-01','10:00:00',1),(104,6,'2025-09-01','12:00:00',1),(105,6,'2025-09-01','14:00:00',1),(106,6,'2025-09-01','16:00:00',1),(107,6,'2025-09-02','09:00:00',1),(108,6,'2025-09-02','11:00:00',1),(109,6,'2025-09-02','15:00:00',1),(110,6,'2025-09-02','16:00:00',1),(111,6,'2025-09-02','14:00:00',1),(112,6,'2025-09-02','12:00:00',1),(113,6,'2025-09-02','10:00:00',1),(121,6,'2025-09-05','09:00:00',1),(122,6,'2025-09-05','11:00:00',1),(123,6,'2025-09-05','13:00:00',1),(124,6,'2025-09-05','15:00:00',1),(125,6,'2025-09-05','15:30:00',1),(126,6,'2025-09-05','13:30:00',1),(127,6,'2025-09-05','11:30:00',1),(128,6,'2025-09-05','09:30:00',1),(129,6,'2025-09-05','10:00:00',1),(130,6,'2025-09-05','12:00:00',1),(131,6,'2025-09-05','14:00:00',1),(133,3,'2025-08-30','09:00:00',1),(134,3,'2025-08-30','09:30:00',1),(135,3,'2025-08-30','10:00:00',1),(136,3,'2025-08-30','10:30:00',1),(137,3,'2025-08-30','11:00:00',1),(138,3,'2025-08-30','11:30:00',1),(139,3,'2025-08-30','12:00:00',1),(140,3,'2025-08-30','13:00:00',1),(141,3,'2025-08-30','14:00:00',1),(142,3,'2025-08-30','14:30:00',1),(143,3,'2025-08-30','15:00:00',1),(144,3,'2025-08-30','15:30:00',1),(145,3,'2025-08-30','16:00:00',1),(146,3,'2025-08-30','13:30:00',1),(147,6,'2025-09-03','09:30:00',0),(148,6,'2025-09-03','10:00:00',1),(149,6,'2025-09-03','11:30:00',1),(150,6,'2025-09-03','12:00:00',1),(151,6,'2025-09-03','13:30:00',1),(152,6,'2025-09-03','14:00:00',1),(153,6,'2025-09-03','16:00:00',1),(154,6,'2025-09-03','15:30:00',1);
/*!40000 ALTER TABLE `doctor_availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctors`
--

DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctors` (
  `user_id` bigint unsigned NOT NULL,
  `specialty_id` smallint unsigned NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `fk_doctor_specialty` (`specialty_id`),
  CONSTRAINT `fk_doctor_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_doctor_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctors`
--

LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
INSERT INTO `doctors` VALUES (3,11),(6,15);
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_profiles`
--

DROP TABLE IF EXISTS `patient_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_profiles` (
  `user_id` bigint unsigned NOT NULL,
  `address1` varchar(255) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_patient_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_profiles`
--

LOCK TABLES `patient_profiles` WRITE;
/*!40000 ALTER TABLE `patient_profiles` DISABLE KEYS */;
INSERT INTO `patient_profiles` VALUES (1,'บ้านเลขที่278','ลาดพร้าว','กรุงเทพมหานคร','10230'),(4,'บ้านเลขที่278','ลาดพร้าว','กรุงเทพมหานคร','10230'),(5,'บ้านเลขที่278','ลาดพร้าว','กรุงเทพมหานคร','10230');
/*!40000 ALTER TABLE `patient_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialties`
--

DROP TABLE IF EXISTS `specialties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `specialties` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `name_th` varchar(100) NOT NULL,
  `name_en` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialties`
--

LOCK TABLES `specialties` WRITE;
/*!40000 ALTER TABLE `specialties` DISABLE KEYS */;
INSERT INTO `specialties` VALUES (1,'INTERNAL','อายุรกรรม','Internal Medicine'),(2,'SURGERY','ศัลยกรรม','Surgery'),(3,'PEDIATRICS','กุมารเวชกรรม','Pediatrics'),(4,'OBGYN','สูติ-นรีเวช','Obstetrics & Gynecology'),(5,'ENT','โสต นาสิก ลาริงซ์ (ENT)','Otolaryngology (ENT)'),(6,'OPHTH','จักษุ','Ophthalmology'),(7,'DERM','ผิวหนัง','Dermatology'),(8,'ORTHO','ออร์โธปิดิกส์','Orthopedics'),(9,'CARD','อายุรกรรมหัวใจ','Cardiology'),(10,'NEURO','อายุรกรรมประสาท','Neurology'),(11,'PSYCH','จิตเวช','Psychiatry'),(12,'FAMILY','เวชศาสตร์ครอบครัว','Family Medicine'),(13,'DENT','ทันตกรรม','Dentistry'),(14,'EMERGENCY','เวชศาสตร์ฉุกเฉิน','Emergency Medicine'),(15,'RADIOLOGY','รังสีวิทยา','Radiology'),(16,'ANES','วิสัญญีวิทยา','Anesthesiology');
/*!40000 ALTER TABLE `specialties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role` enum('patient','doctor') NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'patient','ทอดสอบ','ทดลอง','newggeasy@gmail.com','$2b$10$XsVUExc6kq8xBfSc44aBB.hvfJW4tXTbOE9/yH1n.qi1TpzVIDg9K','0880880388','2004-04-05','male','2025-08-29 08:12:38','2025-08-29 17:43:08'),(3,'doctor','ธวัชชัย','กรีเวก','newzakung0@gmail.com','$2b$10$VLRcDfDV.9gpieC65DaN6OzXDsxw4jVOOCH4l/YjdpBOGaLaTNLMS','0922732903',NULL,NULL,'2025-08-29 08:25:07','2025-08-29 12:23:31'),(4,'patient','ทดสอบ2','ทดลอง2','test@gmail.com','$2b$10$TQJkVo3aNm1E.D529/Mxf.NkKjstTp11gSJmtgQcQzRZJb3/oNJIC','0922562323','2004-04-05','female','2025-08-29 08:34:50','2025-08-29 08:34:50'),(5,'patient','ทดสอบ3','ทดลอง3','test02@gmail.com','$2b$10$eJITqZgmeZ8cBcLJP1O13eC2d1FUy1rHZkgwfqb0LGFuD4ZQJXDGa','0922562323','1996-07-09','male','2025-08-29 11:19:31','2025-08-29 11:19:31'),(6,'doctor','ทดสอบหมอ','ทดลองหมอ','doctor@gmail.com','$2b$10$ObXZcSiugvqjV61gpqGzKeTW8McruQouxZO8/1o4tYxZNjWrx.9nm','0922732908',NULL,NULL,'2025-08-29 19:25:53','2025-08-29 19:25:53');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-30 13:37:58
