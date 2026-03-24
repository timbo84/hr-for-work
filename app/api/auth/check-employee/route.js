const DEBUG = process.env.NODE_ENV === 'development';
import { NextResponse } from 'next/server';
import { getEmployeeForAuth } from '../../../../lib/db';
import { isFirstLogin, isLockedOut, recordFailedAttempt } from '../../../../lib/security-db';

export async function POST(request) {
  try {
    const { employeeNumber, ssn, dob } = await request.json();

    if (!employeeNumber || !ssn) {
      return NextResponse.json(
        { error: 'Employee number and SSN are required' },
        { status: 400 }
      );
    }

    const empNum = employeeNumber.trim();

    // Check lockout first
    const lockout = isLockedOut(empNum);
    if (lockout && lockout.locked) {
      return NextResponse.json(
        { error: `Account locked. Try again in ${lockout.minutesLeft} minutes` },
        { status: 401 }
      );
    }

    // Validate against IBM i
    const employee = await getEmployeeForAuth(empNum, ssn);

    if (!employee) {
      recordFailedAttempt(empNum);
      return NextResponse.json(
        { error: 'Invalid employee number or SSN' },
        { status: 401 }
      );
    }

    // Check if first login
    const firstLogin = isFirstLogin(empNum);

    // If first login, require DOB verification
    if (firstLogin && dob) {
      // EMDOB is stored as YYYYMMDD number in database
      // User enters MM/DD/YYYY so we convert
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob.trim())) {
        return NextResponse.json(
          { error: 'Date of birth must be in MM/DD/YYYY format' },
          { status: 400 }
        );
      }
      const [month, day, year] = dob.trim().split('/');
      const enteredDOB = `${year}${month}${day}`;
      const storedDOB = (employee.IDOB || employee.EMDOB)?.toString() || '';

      if (DEBUG) console.log('DOB check - Entered:', enteredDOB, 'Stored:', storedDOB);

      if (enteredDOB !== storedDOB) {
        recordFailedAttempt(empNum);
        return NextResponse.json(
          { error: 'Date of birth does not match our records' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      name: `${(employee.EMFNM || employee.IFNM || '').trim()} ${(employee.EMLNM || employee.ILNM || '').trim()}`.trim(),
      isFirstLogin: firstLogin,
      requiresDOB: firstLogin && !dob // Tell frontend if DOB is still needed
    });

  } catch (error) {
    console.error('Check employee error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}