# FinTrack — พร้อม Deploy

เว็บแอปบันทึกรายรับ–รายจ่ายรายเดือน พร้อม Login และฐานข้อมูล Supabase

## 1) สร้างฐานข้อมูล
1. สร้างโปรเจกต์ใน Supabase
2. เปิด SQL Editor
3. วางโค้ดจาก `supabase.sql` แล้วกด Run

## 2) ตั้งค่าเว็บ
1. คัดลอก `src/config.example.js` เป็น `src/config.js`
2. ใส่ Supabase Project URL และ anon/publishable key
3. รัน:
   npm install
   npm run dev

## 3) Deploy
อัปโหลดโฟลเดอร์นี้เข้า GitHub แล้ว Import repository เข้า Vercel
Build command: `npm run build`
Output directory: `dist`

สำคัญ: ใช้เฉพาะ Supabase anon/publishable key ฝั่งเว็บ ห้ามใส่ service_role key
