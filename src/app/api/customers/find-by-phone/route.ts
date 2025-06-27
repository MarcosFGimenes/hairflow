// src/app/api/customers/find-by-phone/route.ts
import { db } from '@/lib/firebase'; // Sua inicialização do Firebase
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const salonId = searchParams.get('salonId'); // Importante para multi-tenant

  if (!phone || !salonId) {
    return new NextResponse('Número de celular e ID do salão são obrigatórios', { status: 400 });
  }

  const customerRef = db.collection('customers').doc(String(phone));
  const doc = await customerRef.get();

  if (!doc.exists || doc.data()?.salonId !== salonId) {
    return new NextResponse('Cliente não encontrado', { status: 404 });
  }

  return NextResponse.json(doc.data());
}