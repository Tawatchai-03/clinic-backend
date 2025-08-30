# 🌿 ClinicCare Backend

Backend ของระบบ **ClinicCare** สำหรับการจัดการนัดหมายคลินิก  
สร้างด้วย **Node.js + Express + MySQL2**  

---

## 👩‍⚕️ ฟีเจอร์ API หลัก

### 🔑 Authentication
- สมัครสมาชิก (Patient / Doctor)  
- เข้าสู่ระบบ (Login)  
- JWT Token สำหรับการยืนยันตัวตน  

### 🧑‍⚕️ Patient
- ค้นหาแพทย์ตามสาขา  
- จองนัด, เลื่อนนัด, ยกเลิกนัด  
- ดูรายการนัดของตนเอง  

### 👨‍⚕️ Doctor
- จัดการเวลาว่างของตนเอง  
- ดูนัดหมายของผู้ป่วยที่จองเข้ามา  

### 👤 Profile
- ดู / แก้ไขข้อมูลโปรไฟล์ (patient & doctor)  

---

## 📦 การติดตั้ง (Installation)

```bash
# 1. Clone โปรเจกต์
git clone https://github.com/Tawatchai-03/clinic-backend.git
cd clinic-backend

# 2. ติดตั้ง Dependencies
npm install

