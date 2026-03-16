import { NextResponse } from 'next/server';
import { setPassword, validatePasswordStrength, resetFailedAttempts, createEmployeeSecurity } from '../../../../lib/security-db';

export async function POST(request) {
  try {
    const { employeeNumber, newPassword } = await request.json();

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

    // Ensure security record exists (setPassword does UPDATE, not upsert)
    createEmployeeSecurity(employeeNumber);

    // Set new password and clear any lockouts
    setPassword(employeeNumber, newPassword);
    resetFailedAttempts(employeeNumber);

    console.log(`✅ Password reset for employee: ${employeeNumber}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}