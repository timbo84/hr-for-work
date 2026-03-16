import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getEmployeeForAuth } from '../../../../lib/db';
import {
  createEmployeeSecurity,
  isLockedOut,
  recordFailedAttempt,
  recordSuccessfulLogin,
  verifyPassword,
  isFirstLogin
} from '../../../../lib/security-db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Employee Credentials',
      credentials: {
        employeeNumber: { label: 'Employee Number', type: 'text' },
        ssn: { label: 'Last 4 of SSN', type: 'password' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        try {
          const { employeeNumber, ssn, password } = credentials;
          const ipAddress = req?.headers?.['x-forwarded-for'] || 'unknown';

          console.log('=== LOGIN ATTEMPT ===');
          console.log('Employee:', employeeNumber);
          console.log('SSN provided:', ssn ? 'YES' : 'NO');

          if (!employeeNumber || !ssn) {
            console.log('❌ Missing credentials');
            throw new Error('Employee number and SSN are required');
          }

          const empNum = employeeNumber.trim();

          // ✅ Check lockout
          console.log('Checking lockout...');
          let lockout;
          try {
            lockout = isLockedOut(empNum);
            console.log('Lockout status:', lockout);
          } catch (lockoutErr) {
            console.error('❌ Lockout check failed:', lockoutErr.message);
            lockout = false;
          }

          if (lockout && lockout.locked) {
            throw new Error(`Account locked. Try again in ${lockout.minutesLeft} minutes`);
          }

          // ✅ Check IBM i database
          console.log('Checking IBM i database...');
          let employee;
          try {
            employee = await getEmployeeForAuth(empNum, ssn);
            console.log('Employee found:', employee ? 'YES' : 'NO');
          } catch (dbErr) {
            console.error('❌ IBM i database error:', dbErr.message);
            throw new Error('Database connection error. Please try again.');
          }

          if (!employee) {
            console.log('❌ Employee not found or SSN mismatch');

            try {
              const result = recordFailedAttempt(empNum, ipAddress);
              console.log('Failed attempt recorded:', result);

              if (result.locked) {
                throw new Error('Account locked for 30 minutes due to too many failed attempts');
              }

              throw new Error(`Invalid credentials. ${result.attemptsLeft} attempts remaining`);
            } catch (recordErr) {
              if (
                recordErr.message.includes('Invalid credentials') ||
                recordErr.message.includes('locked')
              ) {
                throw recordErr;
              }
              console.error('❌ Failed to record attempt:', recordErr.message);
              throw new Error('Invalid credentials. Please check your employee number and SSN.');
            }
          }

          // ✅ Employee found in IBM i
          console.log('✅ Employee validated against IBM i');

          // ✅ Security DB operations
          let firstLogin = true;
          try {
            createEmployeeSecurity(empNum);
            firstLogin = isFirstLogin(empNum);
            console.log('First login:', firstLogin);
          } catch (secErr) {
            console.error('❌ Security DB error (non-blocking):', secErr.message);
          }

          // ✅ If not first login, verify password
          if (!firstLogin && password) {
            console.log('Verifying password...');
            try {
              const passwordValid = verifyPassword(empNum, password);
              console.log('Password valid:', passwordValid);

              if (!passwordValid) {
                const result = recordFailedAttempt(empNum, ipAddress);
                if (result.locked) {
                  throw new Error('Account locked for 30 minutes due to too many failed attempts');
                }
                throw new Error(`Invalid password. ${result.attemptsLeft} attempts remaining`);
              }
            } catch (passErr) {
              if (
                passErr.message.includes('Invalid password') ||
                passErr.message.includes('locked')
              ) {
                throw passErr;
              }
              console.error('❌ Password verify error:', passErr.message);
            }
          }

          // ✅ Record successful login
          try {
            recordSuccessfulLogin(empNum, ipAddress);
            console.log('✅ Successful login recorded');
          } catch (recordErr) {
            console.error('❌ Failed to record success (non-blocking):', recordErr.message);
          }

          const returnUser = {
            id: empNum,
            employeeNumber: empNum,
            name: `${employee.IFNM?.trim()} ${employee.ILNM?.trim()}`,
            position: employee.IPOS?.trim() || '',
            isFirstLogin: firstLogin,
            emqem: employee.EMQEM
          };

          console.log('✅ Returning user:', returnUser);
          return returnUser;

        } catch (error) {
          console.error('=== AUTH FAILED ===');
          console.error('Error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.employeeNumber = user.employeeNumber;
        token.position = user.position;
        token.isFirstLogin = user.isFirstLogin;
        token.emqem = user.emqem;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.employeeNumber = token.employeeNumber;
        session.user.position = token.position;
        session.user.isFirstLogin = token.isFirstLogin;
        session.user.emqem = token.emqem;
      }
      return session;
    }
  },

  pages: {
    signIn: '/',
    error: '/'
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 60
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };