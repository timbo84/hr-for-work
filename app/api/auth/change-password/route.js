const DEBUG = process.env.NODE_ENV === 'development';
import { NextResponse } from 'next/server';
import { setPassword, validatePasswordStrength } from '../../../../lib/security-db';

export async function POST(request) {
  try {
    const { employeeNumber, newPassword } = await request.json();

    if (DEBUG) console.log('Change password request for:', employeeNumber);

    if (!employeeNumber || !newPassword) {
      return NextResponse.json(
        { error: 'Employee number and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      );
    }

    // Set the password
    setPassword(employeeNumber, newPassword);
    if (DEBUG) console.log('✅ Password set for employee:', employeeNumber);

    return NextResponse.json({
      success: true,
      message: 'Password set successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}