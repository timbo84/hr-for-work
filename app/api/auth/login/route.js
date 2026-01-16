import { NextResponse } from 'next/server';
import { authenticateEmployee, getEmployee } from '../../../../lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeNumber, ssn } = body;

    console.log('Login attempt:', { employeeNumber, ssn, typeEmp: typeof employeeNumber, typeSsn: typeof ssn });

    // Validate inputs
    if (!employeeNumber || !ssn) {
      return NextResponse.json(
        { error: 'Employee number and SSN are required' },
        { status: 400 }
      );
    }

    // Parse employee number to integer
    const empNum = parseInt(employeeNumber, 10);

    // Validate employee number is a number
    if (isNaN(empNum)) {
      return NextResponse.json(
        { error: 'Invalid employee number' },
        { status: 400 }
      );
    }

    // Authenticate
    const isValid = await authenticateEmployee(empNum, ssn);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your employee number and SSN.' },
        { status: 401 }
      );
    }

    // Get full employee data
    const employee = await getEmployee(empNum);

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
        id: employee.EMEMP?.toString().trim(),
        hiddenId: employee.EMQEM,
        name: `${employee.EMFNM?.trim()} ${employee.EMLNM?.trim()}`,
        firstName: employee.EMFNM?.trim(),
        position: employee.EMPOS?.trim(),
        department: employee.EMOFF?.trim()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error during login. Please try again.' },
      { status: 500 }
    );
  }
}