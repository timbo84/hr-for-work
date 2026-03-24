import { NextResponse } from 'next/server';
import { getEmployeeForAuth } from '../../../../lib/db';
import { createResetToken } from '../../../../lib/security-db';

export async function POST(request) {
  try {
    const { employeeNumber, ssn, dob } = await request.json();

    if (!employeeNumber || !ssn || !dob) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const empNum = employeeNumber.trim();

    // Verify employee exists with SSN
    const employee = await getEmployeeForAuth(empNum, ssn);

    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid employee information' },
        { status: 401 }
      );
    }

    // Verify date of birth
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob.trim())) {
      return NextResponse.json(
        { error: 'Date of birth must be in MM/DD/YYYY format' },
        { status: 400 }
      );
    }
    const [month, day, year] = dob.trim().split('/');
    const enteredDOB = `${year}${month}${day}`;
    const storedDOB = (employee.IDOB || employee.EMDOB)?.toString() || '';

    if (enteredDOB !== storedDOB) {
      return NextResponse.json(
        { error: 'Date of birth does not match our records' },
        { status: 401 }
      );
    }

    // Identity verified — issue a one-time reset token (expires in 15 min)
    const resetToken = createResetToken(empNum);

    return NextResponse.json({
      success: true,
      resetToken,
      name: `${(employee.EMFNM || employee.IFNM || '').trim()} ${(employee.EMLNM || employee.ILNM || '').trim()}`.trim()
    });

  } catch (error) {
    console.error('Verify identity error:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}