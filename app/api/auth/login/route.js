import { NextResponse } from 'next/server';
import { authenticateEmployee, getEmployee } from '../../../../lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeNumber, ssn } = body;

    console.log('🔍 Login attempt:', { employeeNumber, ssn }); // DEBUG

    // Validate inputs
    if (!employeeNumber || !ssn) {
      return NextResponse.json(
        { error: 'Employee number and SSN are required' },
        { status: 400 }
      );
    }

    // Validate employee number is a number
    if (isNaN(employeeNumber)) {
      return NextResponse.json(
        { error: 'Invalid employee number' },
        { status: 400 }
      );
    }

    console.log('🔍 Calling authenticateEmployee...'); // DEBUG

    // Authenticate
    const isValid = await authenticateEmployee(parseInt(employeeNumber), ssn);

    console.log('🔍 Authentication result:', isValid); // DEBUG

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your employee number and SSN.' },
        { status: 401 }
      );
    }

    // Get full employee data
    const employee = await getEmployee(parseInt(employeeNumber));

    console.log('🔍 Employee data:', employee); // DEBUG

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee data not found' },
        { status: 404 }
      );
    }

    // Return success with basic employee info
    return NextResponse.json({
      success: true,
      employee: {
        id: employee.IQEM?.toString().trim(),
        hiddenId: employee.IQEM,
        name: `${employee.IFNM?.trim()} ${employee.ILNM?.trim()}`,
        firstName: employee.IFNM?.trim(),
        position: employee.IPOS?.trim(),
        department: 'N/A' // INSWORKA doesn't have department
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'Server error during login. Please try again.' },
      { status: 500 }
    );
  }
}