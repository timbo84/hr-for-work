// MOCK VERSION FOR TESTING - NO ODBC NEEDED

/**
 * Get employee by employee number from payroll master
 * @param {number} employeeNumber - Employee number (EMEMP)
 * @returns {object|null} Employee data or null if not found
 */
export async function getEmployee(employeeNumber) {
  console.log('Mock getEmployee called with:', employeeNumber);
  
  // Return fake data
  return {
    EMEMP: employeeNumber,
    EMQEM: -999999900,
    EMLNM: 'SMITH',
    EMFNM: 'JOHN',
    EMMNM: 'V',
    EMSTR: 'WHOSIT ST, BOX 1',
    EMCIT: 'DEMING',
    EMST: 'NM',
    EMZP5: 88030,
    'EMSS#': '123456789',
    EMDOH: 19750201,
    EMDOB: 19551027,
    EMOFF: 'ASSESSOR',
    EMPOS: 'SEN APPRAISER',
    EMSTA: 1,
    EMFULL: 'F',
    EMPERM: 'P'
  };
}

/**
 * Authenticate employee using employee number and SSN
 * @param {number} employeeNumber - Employee number
 * @param {string} ssn - Social Security Number (full or last 4)
 * @returns {boolean} True if authentication successful
 */
export async function authenticateEmployee(employeeNumber, ssn) {
  console.log('Mock authenticateEmployee called');
  return true; // Always succeed for testing
}

/**
 * Get pay stubs for an employee
 * @param {number} employeeHiddenId - Employee hidden ID (EMQEM)
 * @returns {array} Array of pay stub records
 */
export async function getPayStubs(employeeHiddenId) {
  console.log('Mock getPayStubs called');
  return [
    {
      checkNumber: 1033678,
      netPay: 250000, // $2,500.00 in cents
      bank: '02',
      recordType: 'D',
      employeeId: employeeHiddenId
    },
    {
      checkNumber: 1033500,
      netPay: 250000,
      bank: '02',
      recordType: 'D',
      employeeId: employeeHiddenId
    }
  ];
}

/**
 * Format IBM i date (YYYYMMDD) to MM/DD/YYYY
 * @param {number} ibmDate - IBM i date format (e.g., 19750201)
 * @returns {string|null} Formatted date or null
 */
export function formatIBMDate(ibmDate) {
  if (!ibmDate || ibmDate === 0) return null;
  
  const dateStr = ibmDate.toString().padStart(8, '0');
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${month}/${day}/${year}`;
}

/**
 * Format amount from cents to dollars
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted currency string
 */
export function formatCurrency(cents) {
  if (cents === null || cents === undefined) return '$0.00';
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(dollars);
}

/**
 * Mask SSN to show only last 4 digits
 * @param {string} ssn - Full SSN
 * @returns {string} Masked SSN (XXX-XX-1234)
 */
export function maskSSN(ssn) {
  if (!ssn) return 'XXX-XX-XXXX';
  const clean = ssn.toString().replace(/\D/g, '');
  if (clean.length < 4) return 'XXX-XX-XXXX';
  return `XXX-XX-${clean.slice(-4)}`;
}

/**
 * Close all database connections (for cleanup)
 */
export async function closeConnections() {
  // No-op for mock version
  console.log('Mock closeConnections called');
}