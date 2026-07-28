import 'reflect-metadata';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Merchant } from './merchants/merchant.entity';
import { ProgressUpdate } from './merchants/progress-update.entity';
import { Notification } from './notifications/notification.entity';

const members = [
  { name: 'Alfred Simanjuntak', email: 'alfred.chrisdianto@nicepay.co.id', role: 'lead integrasi', password: 'alfred123' },
  { name: 'Sonny Hutabarat', email: 'sonny.hutabarat@nicepay.co.id', role: 'staff integrasi', password: 'sonny123' },
  { name: 'Alamsyah Wijaya', email: 'alamsyah.wijaya@nicepay.co.id', role: 'staff integrasi', password: 'alamsyah123' },
  { name: 'Iqbal Nugroho', email: 'iqbal.nugroho@nicepay.co.id', role: 'staff integrasi', password: 'iqbal123' },
  { name: 'Arya Adhitama', email: 'arya.adhitama@nicepay.co.id', role: 'staff integrasi', password: 'arya123' },
  { name: 'Riko Adi Setiawan', email: 'riko.adi@nicepay.co.id', role: 'staff integrasi', password: 'riko123' },
  { name: 'Inka Fazarillah', email: 'inka.fazarillah@nicepay.co.id', role: 'staff integrasi', password: 'inka123' },
  { name: 'Harfa Thandila', email: 'harfa.thandila@nicepay.co.id', role: 'staff integrasi', password: 'harfa123' },
];

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/merchant_pulse',
  entities: [User, Merchant, ProgressUpdate, Notification],
  synchronize: true,
});

ds.initialize().then(async () => {
  const users = ds.getRepository(User);
  await users.delete({ email: 'lead@merchantpulse.dev' });
  for (const member of members) {
    const passwordHash = await bcrypt.hash(member.password, 12);
    const existing = await users.findOneBy({ email: member.email });
    await users.save(users.create({ ...existing, name: member.name, email: member.email, role: member.role, passwordHash }));
  }
  console.log(`Seed complete: ${members.length} integration members are ready.`);
  await ds.destroy();
});
