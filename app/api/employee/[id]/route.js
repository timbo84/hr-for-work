import { NextResponse } from 'next/server';
import { getEmployee, formatIBMDate, maskSSN } from '../../../../lib/db';

export async function GET(request, { params }) {
  // AWAIT params in Next.js 15+
  const { id } = await params;

  // Validate employee ID
  if (!id || isNaN(id)) {
    return NextResponse.json(
      { error: 'Valid employee number required' },
      { status: 400 }
    );
  }

  try {
    const employee = await getEmployee(parseInt(id));

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Format the response with clean data
    const response = {
      employeeNumber: employee.EMEMP?.toString().trim(),
      employeeHiddenId: employee.EMQEM,
      name: {
        first: employee.EMFNM?.trim() || '',
        middle: employee.EMMNM?.trim() || '',
        last: employee.EMLNM?.trim() || '',
        full: `${employee.EMFNM?.trim()} ${employee.EMMNM?.trim()} ${employee.EMLNM?.trim()}`.replace(/\s+/g, ' ').trim()
      },
      department: employee.EMOFF?.trim() || '',
      position: employee.EMPOS?.trim() || '',
      hireDate: formatIBMDate(employee.EMDOH),
      dateOfBirth: formatIBMDate(employee.EMDOB),
      ssn: maskSSN(employee['EMSS#']?.toString()),
      address: {
        street: employee.EMSTR?.trim() || '',
        city: employee.EMCIT?.trim() || '',
        state: employee.EMST?.trim() || '',
        zip: employee.EMZP5?.toString().trim() || ''
      },
      employment: {
        type: employee.EMFULL === 'F' ? 'Full Time' : 'Part Time',
        status: employee.EMSTA === 1 ? 'Active' : 'Inactive',
        permanent: employee.EMPERM === 'P' ? 'Permanent' : 'Temporary'
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in employee API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee data' },
      { status: 500 }
    );
  }
}