import { NextResponse } from 'next/server';
import { getEmployee, formatIBMDate, maskSSN } from '../../../../lib/db';

export async function GET(request, { params }) {
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
      employeeNumber: employee.IQEM?.toString().trim(),
      employeeHiddenId: employee.EMQEM || employee.IQEM,
      name: {
        first: employee.IFNM?.trim() || '',
        middle: employee.IMNM?.trim() || '',
        last: employee.ILNM?.trim() || '',
        full: `${employee.IFNM?.trim()} ${employee.IMNM?.trim()} ${employee.ILNM?.trim()}`.replace(/\s+/g, ' ').trim()
      },
      department: 'Not Available', // INSWORKA doesn't have department field
      position: employee.IPOS?.trim() || 'Not Available',
      hireDate: formatIBMDate(employee.IDOH),
      dateOfBirth: formatIBMDate(employee.IDOB),
      ssn: maskSSN(employee['ISS#']?.toString()),
      address: {
        street: employee.ISTR?.trim() || '',
        city: employee.ICIT?.trim() || '',
        state: employee.IST?.trim() || '',
        zip: employee.IZP5?.toString().trim() || ''
      },
      employment: {
        type: 'Full Time', // Default since we don't have this field
        status: 'Active', // Default since we don't have this field
        permanent: 'Permanent' // Default since we don't have this field
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