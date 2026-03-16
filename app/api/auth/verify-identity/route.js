import { NextResponse } from 'next/server';
import { getEmployeeForAuth } from '../../../../lib/db';

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
    const [month, day, year] = dob.split('/');
    const enteredDOB = `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;
    const storedDOB = (employee.IDOB || employee.EMDOB)?.toString() || '';

    if (enteredDOB !== storedDOB) {
      return NextResponse.json(
        { error: 'Date of birth does not match our records' },
        { status: 401 }
      );
    }

    // Identity verified
    return NextResponse.json({
      success: true,
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