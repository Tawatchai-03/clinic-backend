// server.js
const express = require('express');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = require('./Server_Services/databaseClient'); // <-- pool/promise client

const app = express();
const isProduction = process.env.ENV_MODE === "1";

// -------- Middlewares --------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ เปิด CORS ให้เว็บ (Vite ปกติคือ http://localhost:5173)
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  })
);

// -------- Swagger (เหมือนเดิม) --------
const swaggerDocument = YAML.load('./swagger.yaml');
if (isProduction) {
  app.use('/api-docs', (req, res) => {
    res.status(403).json({ message: 'Swagger UI is disabled in production' });
  });
} else {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));
}

// -------- Health --------
app.get('/api/health', (req, res) => {
  res.json({ message: "Server is Running.", status: true });
});

// -------- API: สาขาแพทย์ --------
// ใช้ execute แทน query เพื่อให้เข้ากับ pool.promise() แน่ๆ
app.get('/api/specialties', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, code, name_th, name_en
       FROM specialties
       ORDER BY id ASC`
    );
    res.json(rows); // ส่งเป็น array ตรงๆ ให้ฝั่งเว็บ map ได้เลย
  } catch (err) {
    console.error('GET /api/specialties error:', err);
    res.status(500).json({ message: 'Failed to load specialties' });
  }
});

// -------- API: สมัครสมาชิก --------
app.post('/api/register', async (req, res) => {
  try {
    const {
      role, firstName, lastName, email, password, phone, birthDate, gender, address, specialtyId
    } = req.body;

    if (!role || !['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ message: 'role ไม่ถูกต้อง' });
    }
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ (firstName, lastName, email, password)' });
    }
    if (role === 'doctor' && !specialtyId) {
      return res.status(400).json({ message: 'กรุณาเลือกสาขาของแพทย์ (specialtyId)' });
    }

    const hash = await bcrypt.hash(password, 10);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1) users
      const [u] = await conn.execute(
        `INSERT INTO users
           (role, first_name, last_name, email, password_hash, phone, birth_date, gender)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          role,
          firstName,
          lastName,
          email,
          hash,
          phone || null,
          role === 'patient' ? (birthDate || null) : null,
          role === 'patient' ? (gender || null) : null
        ]
      );
      const userId = u.insertId;

      // 2) role-specific
      if (role === 'patient') {
        const a = address || {};
        await conn.execute(
          `INSERT INTO patient_profiles 
             (user_id, address1, district, province, postal_code)
           VALUES (?,?,?,?,?)`,
          [
            userId,
            a.line1 || null,
            a.district || null,
            a.province || null,
            a.postalCode || null
          ]
        );
      } else {
        await conn.execute(
          `INSERT INTO doctors (user_id, specialty_id) VALUES (?,?)`,
          [userId, specialtyId]
        );
      }

      await conn.commit();
      res.status(201).json({ id: userId, role, message: 'สมัครสมาชิกสำเร็จ' });
    } catch (err) {
      await conn.rollback();
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
      }
      console.error('POST /api/register error:', err);
      res.status(500).json({ message: 'สมัครสมาชิกไม่สำเร็จ' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('POST /api/register outer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// ====== LOGIN ======
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'กรอกอีเมลและรหัสผ่าน' });
    }

    // หา user ตามอีเมล
    const [rows] = await db.execute(
      `SELECT id, role, first_name, last_name, email, password_hash
       FROM users
       WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = rows?.[0];
    if (!user) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // ตรวจรหัสผ่าน
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    return res.json({
      id: user.id,
      role: user.role,                 // 'patient' | 'doctor'
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      message: 'เข้าสู่ระบบสำเร็จ'
    });
  } catch (err) {
    console.error('POST /api/login error:', err);
    res.status(500).json({ message: 'เข้าสู่ระบบไม่สำเร็จ' });
  }
});

// ============ PROFILE APIs ============

// ---------- PROFILE: GET /api/users/:id ----------
// (เหลือแค่บล็อกเดียวเท่านั้น — ส่ง birthDate เป็น "YYYY-MM-DD" ตรงจาก DB)
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ message: 'invalid id' });

    const [urows] = await db.execute(
      `SELECT id, role, first_name, last_name, email, phone,
              DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date,
              gender
       FROM users WHERE id=? LIMIT 1`,
      [userId]
    );
    const u = urows?.[0];
    if (!u) return res.status(404).json({ message: 'not found' });

    if (u.role === 'patient') {
      const [prows] = await db.execute(
        `SELECT address1 AS line1, district, province, postal_code AS postalCode
         FROM patient_profiles WHERE user_id=? LIMIT 1`,
        [userId]
      );
      const addr = prows?.[0] || { line1: '', district: '', province: '', postalCode: '' };

      return res.json({
        id: u.id,
        role: u.role,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone,
        birthDate: u.birth_date, // <-- "YYYY-MM-DD" ตรงจากเบส
        gender: u.gender,
        address: addr
      });
    } else {
      const [drows] = await db.execute(
        `SELECT specialty_id AS specialtyId FROM doctors WHERE user_id=? LIMIT 1`,
        [userId]
      );
      const d = drows?.[0] || { specialtyId: null };

      return res.json({
        id: u.id,
        role: u.role,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone,
        specialtyId: d.specialtyId
      });
    }
  } catch (err) {
    console.error('GET /api/users/:id', err);
    res.status(500).json({ message: 'failed to load profile' });
  }
});

// ---------- PROFILE: GET /api/users/by-email ----------
// (ส่ง birthDate เป็น "YYYY-MM-DD" ตรงจาก DB)
app.get('/api/users/by-email', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim();
    if (!email) return res.status(400).json({ message: 'email required' });

    const [urows] = await db.execute(
      `SELECT id, role, first_name, last_name, email, phone,
              DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date,
              gender
       FROM users WHERE email=? LIMIT 1`,
      [email]
    );
    const u = urows?.[0];
    if (!u) return res.status(404).json({ message: 'not found' });

    if (u.role === 'patient') {
      const [prows] = await db.execute(
        `SELECT address1 AS line1, district, province, postal_code AS postalCode
         FROM patient_profiles WHERE user_id=? LIMIT 1`,
        [u.id]
      );
      const addr = prows?.[0] || { line1: '', district: '', province: '', postalCode: '' };

      return res.json({
        id: u.id,
        role: u.role,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone,
        birthDate: u.birth_date, // <-- "YYYY-MM-DD" ตรงจากเบส
        gender: u.gender,
        address: addr
      });
    } else {
      const [drows] = await db.execute(
        `SELECT specialty_id AS specialtyId FROM doctors WHERE user_id=? LIMIT 1`,
        [u.id]
      );
      const d = drows?.[0] || { specialtyId: null };

      return res.json({
        id: u.id,
        role: u.role,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone,
        specialtyId: d.specialtyId
      });
    }
  } catch (err) {
    console.error('GET /api/users/by-email', err);
    res.status(500).json({ message: 'failed to load profile' });
  }
});

// ---------- PROFILE: PUT /api/users/:id/password ----------
// ขอ currentPassword และ newPassword เพื่อตรวจสอบและอัปเดต
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { currentPassword, newPassword } = req.body || {};

    if (!userId) return res.status(400).json({ message: 'invalid id' });
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ (currentPassword, newPassword)' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร' });
    }

    // 1) ดึง password_hash เดิม
    const [rows] = await db.execute(
      `SELECT password_hash FROM users WHERE id=? LIMIT 1`,
      [userId]
    );
    const user = rows?.[0];
    if (!user) return res.status(404).json({ message: 'not found' });

    // 2) ตรวจ currentPassword ให้ตรงกับ hash เดิม
    const ok = await bcrypt.compare(currentPassword, user.password_hash || '');
    if (!ok) return res.status(401).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });

    // 3) hash รหัสใหม่แล้วอัปเดต
    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute(`UPDATE users SET password_hash=? WHERE id=?`, [hash, userId]);

    res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อย' });
  } catch (err) {
    console.error('PUT /api/users/:id/password error:', err);
    res.status(500).json({ message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
  }
});

// ---------- PROFILE: PUT /api/users/:id ----------
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return res.status(400).json({ message: 'invalid id' });

    const { role, firstName, lastName, phone, address, specialtyId } = req.body || {};
    if (!role || !['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ message: 'role ไม่ถูกต้อง' });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'กรุณาระบุ firstName และ lastName' });
    }
    if (role === 'doctor' && !specialtyId) {
      return res.status(400).json({ message: 'กรุณาเลือกสาขาของแพทย์ (specialtyId)' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1) มีผู้ใช้นี้จริงไหม
      const [urows] = await conn.execute(
        `SELECT id, role FROM users WHERE id=? LIMIT 1`,
        [userId]
      );
      const u = urows?.[0];
      if (!u) {
        await conn.rollback();
        return res.status(404).json({ message: 'not found' });
      }
      // ถ้าอยากเข้มขึ้น: เช็ค role mismatch => 409

      // 2) อัปเดต users (ชื่อ, นามสกุล, เบอร์)
      await conn.execute(
        `UPDATE users SET first_name=?, last_name=?, phone=? WHERE id=?`,
        [firstName, lastName, phone || null, userId]
      );

      if (role === 'patient') {
        // 3) อัปเดต/สร้างแถวที่อยู่ของคนไข้
        const a = address || {};
        await conn.execute(
          `INSERT INTO patient_profiles (user_id, address1, district, province, postal_code)
           VALUES (?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             address1=VALUES(address1),
             district=VALUES(district),
             province=VALUES(province),
             postal_code=VALUES(postal_code)`,
          [
            userId,
            a.line1 || null,
            a.district || null,
            a.province || null,
            a.postalCode || null
          ]
        );
      } else {
        // 3) อัปเดต/สร้าง specialty ของแพทย์
        await conn.execute(
          `INSERT INTO doctors (user_id, specialty_id)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE specialty_id=VALUES(specialty_id)`,
          [userId, Number(specialtyId)]
        );
      }

      await conn.commit();
      res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });
    } catch (err) {
      await conn.rollback();
      console.error('PUT /api/users/:id error:', err);
      res.status(500).json({ message: 'อัปเดตโปรไฟล์ไม่สำเร็จ' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('PUT /api/users/:id outer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/doctors?q=...&specialtyId=...
app.get('/api/doctors', async (req, res) => {
  try {
    const { q = "", specialtyId = "" } = req.query;

    const where = [`u.role = 'doctor'`];
    const params = [];

    if (q && String(q).trim()) {
      where.push(`(CONCAT(u.first_name, ' ', u.last_name) LIKE ?)`); // ชื่อ-สกุล
      params.push(`%${String(q).trim()}%`);
    }
    if (specialtyId) {
      where.push(`d.specialty_id = ?`);
      params.push(Number(specialtyId));
    }

    const [rows] = await db.execute(
      `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) AS name,
        s.name_th AS specialty_name,
        s.code AS specialty_code,
        (
          SELECT CONCAT(da.slot_date, ' ', da.slot_time)
          FROM doctor_availability da
          WHERE da.doctor_id = u.id 
            AND da.is_open = 1
            AND CONCAT(da.slot_date, ' ', da.slot_time) > NOW()
          ORDER BY da.slot_date ASC, da.slot_time ASC
          LIMIT 1
        ) AS next_available
      FROM users u
      JOIN doctors d ON d.user_id = u.id
      JOIN specialties s ON s.id = d.specialty_id
      WHERE ${where.join(' AND ')}
      ORDER BY u.first_name, u.last_name
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/doctors error:', err);
    res.status(500).json({ message: 'Failed to load doctors' });
  }
});

// ------------- Doctor Availability APIs -------------
app.get('/api/doctor/availability', async (req, res) => {
  try {
    const doctorId = Number(req.query.doctorId);
    const date = String(req.query.date || '').trim();
    const from = String(req.query.from || '').trim();
    const to   = String(req.query.to   || '').trim();

    if (!doctorId) return res.status(400).json({ message: 'doctorId required' });

    let sql, params;
    if (date) {
      sql = `SELECT id, slot_date, slot_time, is_open
               FROM doctor_availability
              WHERE doctor_id=? AND slot_date=?
              ORDER BY slot_time`;
      params = [doctorId, date];
    } else if (from && to) {
      sql = `SELECT id, slot_date, slot_time, is_open
               FROM doctor_availability
              WHERE doctor_id=? AND slot_date BETWEEN ? AND ?
              ORDER BY slot_date, slot_time`;
      params = [doctorId, from, to];
    } else {
      return res.status(400).json({ message: 'date หรือ from/to อย่างใดอย่างหนึ่ง' });
    }

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/doctor/availability error:', err);
    res.status(500).json({ message: 'Failed to load availability' });
  }
});

app.put('/api/doctor/availability', async (req, res) => {
  try {
    const { doctorId, date, slots } = req.body || {};
    if (!doctorId || !date || !Array.isArray(slots)) {
      return res.status(400).json({ message: 'doctorId, date, slots[] required' });
    }
    const toSec = (t) => {
      const s = String(t).slice(0,5);             // "HH:MM"
      return /^\d{2}:\d{2}$/.test(s) ? `${s}:00` : null;
    };
    const times = [...new Set(slots.map(toSec).filter(Boolean))];

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `DELETE FROM doctor_availability WHERE doctor_id=? AND slot_date=?`,
        [Number(doctorId), date]
      );

      if (times.length > 0) {
        const values = times.map(t => [Number(doctorId), date, t, 1]);
        await conn.query(
          `INSERT INTO doctor_availability (doctor_id, slot_date, slot_time, is_open)
           VALUES ?
           ON DUPLICATE KEY UPDATE is_open=VALUES(is_open)`,
          [values]
        );
      }

      await conn.commit();
      res.json({ ok: true, message: 'saved', count: times.length });
    } catch (err) {
      await conn.rollback();
      console.error('PUT /api/doctor/availability error:', err);
      res.status(500).json({ message: 'Failed to save availability' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('PUT /api/doctor/availability outer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// ============ APPOINTMENTS ============
app.post('/api/appointments', async (req, res) => {
  try {
    const { patientId, doctorId, date, time, replaceCancelledId } = req.body || {};
    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ message: 'กรุณากรอก patientId, doctorId, date, time' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [avail] = await conn.execute(
        `SELECT id FROM doctor_availability 
          WHERE doctor_id=? AND slot_date=? AND slot_time=? AND is_open=1
          LIMIT 1`,
        [doctorId, date, time]
      );
      if (!avail.length) {
        await conn.rollback();
        return res.status(409).json({ message: 'ช่วงเวลานี้ถูกจองไปแล้ว' });
      }
      if (replaceCancelledId) {
        const [rows] = await conn.execute(
          `SELECT id, patient_id, doctor_id, status 
             FROM appointments
            WHERE id=? FOR UPDATE`,
          [replaceCancelledId]
        );
        const old = rows?.[0];
        if (old 
            && old.status === 'cancelled' 
            && Number(old.patient_id) === Number(patientId) 
            && Number(old.doctor_id) === Number(doctorId)) {
          await conn.execute(
            `UPDATE appointments SET status='replaced' WHERE id=?`,
            [replaceCancelledId]
          );
        }
      }

      // 3) จองใหม่
      await conn.execute(
        `INSERT INTO appointments (patient_id, doctor_id, apt_date, apt_time, status)
         VALUES (?,?,?,?, 'booked')`,
        [patientId, doctorId, date, time]
      );

      // 4) ปิดช่องเวลา
      await conn.execute(
        `UPDATE doctor_availability 
            SET is_open=0 
          WHERE doctor_id=? AND slot_date=? AND slot_time=?`,
        [doctorId, date, time]
      );

      await conn.commit();
      res.status(201).json({ ok: true, message: 'จองนัดสำเร็จ' });
    } catch (err) {
      await conn.rollback();
      console.error('POST /api/appointments error:', err);
      res.status(500).json({ message: 'จองไม่สำเร็จ' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('POST /api/appointments outer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// ==================== Appointments: list by patient ====================
app.get('/api/appointments', async (req, res) => {
  try {
    const patientId = Number(req.query.patientId);
    if (!patientId) return res.status(400).json({ message: 'patientId required' });

    const [rows] = await db.query(
      `SELECT
         a.id,
         a.status,
         a.apt_date,
         a.apt_time,
         a.doctor_id,       
         u.first_name,
         u.last_name,
         s.name_th AS specialty
       FROM appointments a
       JOIN users u            ON u.id = a.doctor_id
       LEFT JOIN doctors d     ON d.user_id = u.id
       LEFT JOIN specialties s ON s.id = d.specialty_id
       WHERE a.patient_id = ?
       ORDER BY a.apt_date ASC, a.apt_time ASC`,
      [patientId]
    );
    const data = rows.map(r => ({
      id: r.id,
      status: r.status,                 
      date: r.apt_date,                     
      time: r.apt_time,                     
      doctorId: r.doctor_id,                
      doctorName: `${r.first_name} ${r.last_name}`,
      specialty: r.specialty || '-',
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed to load appointments' });
  }
});
// ==================== Appointments: cancel (reopen slot) ====================
app.put('/api/appointments/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'invalid id' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT doctor_id, apt_date, apt_time, status
         FROM appointments
        WHERE id=? FOR UPDATE`,
      [id]
    );
    const appt = rows?.[0];
    if (!appt) {
      await conn.rollback();
      return res.status(404).json({ message: 'ไม่พบรายการนัดนี้' });
    }

    if (appt.status !== 'booked') {
      await conn.rollback();
      return res.status(400).json({ message: 'ไม่สามารถยกเลิกนัดนี้ได้ (สถานะไม่ถูกต้อง)' });
    }
    await conn.execute(
      `INSERT INTO doctor_availability (doctor_id, slot_date, slot_time, is_open)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE is_open=1`,
      [appt.doctor_id, appt.apt_date, appt.apt_time]
    );
    await conn.execute(
      `DELETE FROM appointments WHERE id=?`,
      [id]
    );
    await conn.commit();
    res.json({
      ok: true,
      message: 'ลบนัดเรียบร้อยแล้ว ช่องเวลาได้ถูกเปิดให้จองใหม่',
      deletedAppointment: {
        id,
        doctorId: appt.doctor_id,
        date: appt.apt_date,
        time: appt.apt_time
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error('PUT /api/appointments/:id/cancel error:', err);
    res.status(500).json({ message: 'ลบนัดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' });
  } finally {
    conn.release();
  }
});
// ==================== เพิ่ม API สำหรับตรวจสอบ slot availability ====================
app.get('/api/appointments/check-slot', async (req, res) => {
  try {
    const { doctorId, date, time } = req.query;
    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: 'doctorId, date, time required' });
    }
    const [rows] = await db.execute(
      `SELECT is_open 
       FROM doctor_availability 
       WHERE doctor_id=? AND slot_date=? AND slot_time=? LIMIT 1`,
      [doctorId, date, time]
    );
    const available = rows.length > 0 && rows[0].is_open === 1;
    res.json({ 
      available,
      message: available ? 'ช่วงเวลานี้ว่าง' : 'ช่วงเวลานี้ไม่ว่าง'
    });
  } catch (err) {
    console.error('GET /api/appointments/check-slot error:', err);
    res.status(500).json({ message: 'ตรวจสอบช่วงเวลาไม่สำเร็จ' });
  }
});
// ========= เลื่อนนัด (แก้ไขนัดเดิม) =========
app.put('/api/appointments/:id/reschedule', async (req, res) => {
  const id = Number(req.params.id);
  const { patientId, doctorId, date, time } = req.body || {};
  if (!id || !patientId || !doctorId || !date || !time) {
    return res.status(400).json({ message: 'กรอกให้ครบ (patientId, doctorId, date, time)' });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT patient_id, doctor_id, apt_date, apt_time, status
         FROM appointments
        WHERE id=? FOR UPDATE`,
      [id]
    );
    const appt = rows?.[0];
    if (!appt) {
      await conn.rollback();
      return res.status(404).json({ message: 'ไม่พบนัดนี้' });
    }
    if (Number(appt.patient_id) !== Number(patientId) || Number(appt.doctor_id) !== Number(doctorId)) {
      await conn.rollback();
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เลื่อนนัดนี้' });
    }
    if (appt.status !== 'booked') {
      await conn.rollback();
      return res.status(400).json({ message: 'เลื่อนนัดได้เฉพาะนัดสถานะ booked เท่านั้น' });
    }
    const [avail] = await conn.execute(
      `SELECT id FROM doctor_availability
        WHERE doctor_id=? AND slot_date=? AND slot_time=? AND is_open=1
        LIMIT 1`,
      [doctorId, date, time]
    );
    if (!avail.length) {
      await conn.rollback();
      return res.status(409).json({ message: 'ช่วงเวลาที่เลือกไม่ว่างแล้ว' });
    }
    await conn.execute(
      `INSERT INTO doctor_availability (doctor_id, slot_date, slot_time, is_open)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE is_open=1`,
      [doctorId, appt.apt_date, appt.apt_time]
    );
    await conn.execute(
      `UPDATE appointments SET apt_date=?, apt_time=? WHERE id=?`,
      [date, time, id]
    );
    await conn.execute(
      `UPDATE doctor_availability
          SET is_open=0
        WHERE doctor_id=? AND slot_date=? AND slot_time=?`,
      [doctorId, date, time]
    );

    await conn.commit();
    res.json({ ok: true, message: 'เลื่อนนัดเรียบร้อย' });
  } catch (err) {
    await conn.rollback();
    console.error('PUT /api/appointments/:id/reschedule error:', err);
    res.status(500).json({ message: 'เลื่อนนัดไม่สำเร็จ' });
  } finally {
    conn.release();
  }
});
// GET /api/appointments/doctor?doctorId=XXX[&date=YYYY-MM-DD]
app.get('/api/appointments/doctor', async (req, res) => {
  try {
    const doctorId = Number(req.query.doctorId);
    const date = String(req.query.date || '').trim();
    if (!doctorId) return res.status(400).json({ message: 'doctorId required' });

    let sql = `
      SELECT
        a.id,
        a.patient_id,
        a.apt_date,
        a.apt_time,
        a.status,
        u.first_name AS patient_first_name,
        u.last_name  AS patient_last_name
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      WHERE a.doctor_id = ?
        AND a.status <> 'cancelled'
    `;
    const params = [doctorId];

    if (date) {
      sql += ` AND a.apt_date = ?`;
      params.push(date);
    }

    sql += ` ORDER BY a.apt_date ASC, a.apt_time ASC`;

    const [rows] = await db.execute(sql, params);

    res.json(rows.map(r => ({
      id: r.id,
      apt_date: r.apt_date,                         // DATE
      apt_time: r.apt_time,                         // TIME
      patient_first_name: r.patient_first_name || '',
      patient_last_name:  r.patient_last_name  || '',
      status: r.status
    })));
  } catch (err) {
    console.error('GET /api/appointments/doctor error:', err);
    res.status(500).json({ message: 'failed to load appointments' });
  }
});
// -------- Listen --------
app.listen(process.env.SERVER_PORT, () => {
  console.log(`API running on :${process.env.SERVER_PORT}`);
});
