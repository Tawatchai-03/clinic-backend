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


⚙️ การตั้งค่า Environment
นำไฟล์ .env ที่ ที่แนบให้ใน Team ของ backend ไปใส่ในโฟลเดอร์ clinic-backend
พิม node .\server.js      เพื่อรันเซิฟ


  🗄️ Database Schema

ตารางหลักใน MySQL:

users – เก็บข้อมูลผู้ใช้ (patient, doctor)

patient_profiles – เก็บที่อยู่/ข้อมูลเพิ่มเติมของผู้ป่วย

doctors – เก็บข้อมูลแพทย์ + specialty

specialties – เก็บรายการสาขาแพทย์

appointments – เก็บข้อมูลการนัดหมาย

doctor_availability – เวลาว่างของแพทย์

🛠️ Import ไฟล์ DB.sql ที่เตรียมไว้ ลงใน MySQL-Workbench
