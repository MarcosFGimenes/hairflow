// src/app/api/customers/route.ts
import { db } from '@/lib/firebase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { phone, name, email, salonId } = body;

  if (!phone || !name || !salonId) {
     return new NextResponse('Dados incompletos para criar cliente', { status: 400 });
  }

  const customerRef = db.collection('customers').doc(phone);
  await customerRef.set({
    name,
    phone,
    email,
    salonId,
    createdAt: new Date(),
    tags: ['Cliente Novo'],
  });

  return NextResponse.json({ message: 'Cliente criado com sucesso' }, { status: 201 });
}