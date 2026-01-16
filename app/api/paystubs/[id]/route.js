import { NextResponse } from 'next/server';
import { getPayStubs, formatCurrency } from '../../../../lib/db';

export async function GET(request, { params }) {
  // AWAIT params in Next.js 15+
  const { id } = await params;

  if (!id || isNaN(id)) {
    return NextResponse.json(
      { error: 'Valid employee ID required' },
      { status: 400 }
    );
  }

  try {
    const payStubs = await getPayStubs(parseInt(id));

    const formatted = payStubs.map(stub => ({
      checkNumber: stub.checkNumber,
      netPay: formatCurrency(stub.netPay),
      netPayRaw: stub.netPay,
      bank: stub.bank,
      recordType: stub.recordType
    }));

    return NextResponse.json({
      payStubs: formatted,
      count: formatted.length
    });
  } catch (error) {
    console.error('Error in paystubs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pay stub data' },
      { status: 500 }
    );
  }
}