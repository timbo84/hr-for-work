const DEBUG = process.env.NODE_ENV === 'development';
import { NextResponse } from 'next/server';
import { setPassword, validatePasswordStrength, resetFailedAttempts, createEmployeeSecurity, validateResetToken } from '../../../../lib/security-db';

export async function POST(request) {
  try {
    const { employeeNumber, newPassword, resetToken } = await request.json();

    if (!employeeNumber || !newPassword || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Verify the reset token — must have come from a successful verify-identity call
    const tokenValid = validateResetToken(employeeNumber, resetToken);
    if (!tokenValid) {
      return NextResponse.json(
        { error: 'Your reset session has expired. Please start over.' },
        { status: 401 }
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

    if (DEBUG) console.log(`✅ Password reset for employee: ${employeeNumber}`);

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