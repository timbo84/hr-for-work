import { NextResponse } from 'next/server';
import { getEmployee, getPayStubs, formatCurrency, formatIBMDate } from '../../../../lib/db';

export async function GET(request, { params }) {
  const { id } = await params;

  if (!id || isNaN(id)) {
    return NextResponse.json(
      { error: 'Valid employee number required' },
      { status: 400 }
    );
  }

  try {
    // Get employee to get their EMQEM (hidden ID)
    const employee = await getEmployee(parseInt(id));

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get paystubs using the hidden ID
    const payStubs = await getPayStubs(employee.EMQEM);

    // Format the pay stubs
    const formattedStubs = payStubs.map(stub => ({
      checkNumber: stub.checkNumber,
      netPay: formatCurrency(stub.netPay),
      grossPay: formatCurrency(stub.grossPay),
      deductions: formatCurrency(stub.deductions),
      payDate: formatIBMDate(stub.payDate),
      periodStart: formatIBMDate(stub.periodStart),
      periodEnd: formatIBMDate(stub.periodEnd),
      bank: stub.bank?.trim() || '',
      department: stub.department?.trim() || '',
      position: stub.position?.trim() || ''
    }));

    return NextResponse.json({
      payStubs: formattedStubs,
      count: formattedStubs.length
    });
  } catch (error) {
    console.error('Error in paystubs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pay stub data' },
      { status: 500 }
    );
  }
}