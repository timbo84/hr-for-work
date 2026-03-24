const odbc = require('odbc');
const DEBUG = process.env.NODE_ENV === 'development';

// Connection configuration from environment variables
const config = {
  host: process.env.IBM_HOST,
  user: process.env.IBM_USER,
  password: process.env.IBM_PASSWORD,
  driver: process.env.IBM_DRIVER || 'Client Access ODBC Driver (32-bit)',
  employeeLibrary: process.env.IBM_LIBRARY_EMPLOYEE || 'PAYF',
  employeeTable: process.env.IBM_TABLE_EMPLOYEE || 'EMPMASZZ'
};

// Detect which database structure we're using
const isINSWORKA = config.employeeTable === 'INSWORKA';

// Connection pool
let employeePool;

/**
 * Get connection pool for employee library
 */
async function getConnection() {
  if (!employeePool) {
    const connectionString = `DRIVER={${config.driver}};SYSTEM=${config.host};UID=${config.user};PWD=${config.password};DBQ=${config.employeeLibrary};CMT=1;NAM=1`;
    employeePool = await odbc.pool(connectionString);
  }
  return employeePool;
}

/**
 * Get employee by employee number
 * @param {number|string} employeeNumber - Employee number
 * @returns {object|null} Employee data or null if not found
 */
export async function getEmployee(employeeNumber) {
  try {
    const pool = await getConnection();
    const table = `${config.employeeLibrary}.${config.employeeTable}`;

    let result;

    if (isINSWORKA) {
      // QS36F.INSWORKA structure (Luna County)
      result = await pool.query(`
        SELECT IQEM, ILNM, IFNM, IMNM, ISTR, ICIT, IST, IZP5, ISS#, IDOH, IDOB, IPOS
        FROM ${table}
        WHERE IQEM = ?
        FETCH FIRST 1 ROW ONLY
      `, [parseInt(employeeNumber)]);

      if (result.length === 0) return null;

      const emp = result[0];
      return {
        IQEM: emp.IQEM,
        ILNM: emp.ILNM,
        IFNM: emp.IFNM,
        IMNM: emp.IMNM,
        ISTR: emp.ISTR,
        ICIT: emp.ICIT,
        IST: emp.IST,
        IZP5: emp.IZP5,
        'ISS#': emp['ISS#'],
        IDOH: emp.IDOH,
        IDOB: emp.IDOB,
        IPOS: emp.IPOS
      };
    } else {
      // PAYF.EMPMASY structure (Lea County)
      result = await pool.query(`
        SELECT EMEMP, EMQEM, EMLNM, EMFNM, EMMNM, EMSTR, EMCIT, EMST, EMZP5,
               "EMSS#", EMDOH, EMDOB, EMPOS, EMOFF, EMLOC, EMDEP
        FROM ${table}
        WHERE TRIM(EMEMP) = ?
        FETCH FIRST 1 ROW ONLY
      `, [employeeNumber.toString()]);

      if (result.length === 0) return null;

      // Map to consistent field names for the app
      const emp = result[0];
      return {
        IQEM: emp.EMEMP?.trim(),
        EMQEM: emp.EMQEM,  // Hidden ID used for paystub lookups
        ILNM: emp.EMLNM,
        IFNM: emp.EMFNM,
        IMNM: emp.EMMNM,
        ISTR: emp.EMSTR,
        ICIT: emp.EMCIT,
        IST: emp.EMST,
        IZP5: emp.EMZP5,
        'ISS#': emp['EMSS#'],
        IDOH: emp.EMDOH,
        IDOB: emp.EMDOB,
        IPOS: emp.EMPOS,
        EMOFF: emp.EMOFF,
        EMLOC: emp.EMLOC,
        EMDEP: emp.EMDEP
      };
    }
  } catch (error) {
    console.error('Database error in getEmployee:', error);
    throw new Error('Failed to fetch employee data');
  }
}

/**
 * Authenticate employee using employee number and SSN
 * @param {number|string} employeeNumber - Employee number
 * @param {string} ssn - Social Security Number (full or last 4)
 * @returns {boolean} True if authentication successful
 */
export async function authenticateEmployee(employeeNumber, ssn) {
  try {
    const pool = await getConnection();
    const table = `${config.employeeLibrary}.${config.employeeTable}`;

    // Clean SSN - remove any non-digits
    const cleanSSN = ssn.replace(/\D/g, '');
    const last4 = cleanSSN.slice(-4).padStart(4, '0');

    if (DEBUG) console.log('🔍 Auth query params:', {
      employeeNumber,
      last4,
      table
    });

    let result;

    if (isINSWORKA) {
      // QS36F.INSWORKA structure - IQEM is numeric
      result = await pool.query(`
        SELECT IQEM, ILNM, IFNM
        FROM ${table}
        WHERE IQEM = ?
        AND MOD(ISS#, 10000) = ?
        FETCH FIRST 1 ROW ONLY
      `, [parseInt(employeeNumber), parseInt(last4)]);
    } else {
      // PAYF.EMPMASZZ structure - EMEMP is string with spaces
      result = await pool.query(`
        SELECT EMEMP, EMLNM, EMFNM
        FROM ${table}
        WHERE TRIM(EMEMP) = ?
        AND RIGHT(TRIM(CAST("EMSS#" AS VARCHAR(20))), 4) = ?
        FETCH FIRST 1 ROW ONLY
      `, [employeeNumber.toString(), last4]);
    }

    if (DEBUG) console.log('🔍 Query result count:', result.length);

    return result.length > 0;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

/**
 * Get pay stubs for an employee
 * Note: Pay stub data might be in PAYF21 or another location
 * This needs to be configured based on where your pay data actually is
 */
export async function getPayStubs(employeeHiddenId) {
  try {
    const pool = await getConnection();
    
    // Query without aliases - ODBC driver doesn't support them properly
    const result = await pool.query(`
      SELECT 
        HCCK#,
        HCCNT,
        HCCPY,
        HCCDD,
        HCDAY,
        HCBEG,
        HCEND,
        HCRUN,
        "HCBK#",
        HCOFF,
        HCPOS
      FROM PAYF.HISCTLZZ
      WHERE HCQEM = ?
      ORDER BY HCRUN DESC
      FETCH FIRST 100 ROWS ONLY
    `, [employeeHiddenId]);
    
    // Map to friendly names in JavaScript
    return result.map(row => ({
      checkNumber: row['HCCK#'],
      netPay: row.HCCNT,
      grossPay: row.HCCPY,
      deductions: row.HCCDD,
      payDate: row.HCDAY,
      periodStart: row.HCBEG,
      periodEnd: row.HCEND,
      runDate: row.HCRUN,
      bank: row['HCBK#'],
      department: row.HCOFF,
      position: row.HCPOS
    }));
  } catch (error) {
    console.error('Error fetching pay stubs:', error);
    throw new Error('Failed to fetch pay stub data');
  }
}


/**
 * Get the most recent payroll run date from PAYF.HISCTLZZ
 * @returns {string|null} HCRUN value as string (YYYYMMDD), or null on error
 */
export async function getLatestPayrollRunDate() {
  try {
    const pool = await getConnection();
    const result = await pool.query(`
      SELECT HCRUN
      FROM PAYF.HISCTLZZ
      ORDER BY HCRUN DESC
      FETCH FIRST 1 ROW ONLY
    `);
    if (result.length === 0) return null;
    return result[0].HCRUN?.toString() ?? null;
  } catch (error) {
    console.error('Error fetching latest payroll run date:', error);
    throw new Error('Failed to fetch latest payroll run date');
  }
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format IBM i date to MM/DD/YYYY
 * Handles both YYYYMMDD (PAYF) and MMDDYYYY (QS36F) formats
 * @param {number} ibmDate - IBM i date format
 * @returns {string|null} Formatted date or null
 */
export function formatIBMDate(ibmDate) {
  if (!ibmDate || ibmDate === 0) return null;

  const dateStr = ibmDate.toString().padStart(8, '0');

  // Check if it's YYYYMMDD format (year > 1900 in first 4 chars)
  const firstFour = parseInt(dateStr.substring(0, 4));

  if (firstFour > 1900) {
    // YYYYMMDD format
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${month}/${day}/${year}`;
  } else {
    // MMDDYYYY format
    const month = dateStr.substring(0, 2);
    const day = dateStr.substring(2, 4);
    const year = dateStr.substring(4, 8);
    return `${month}/${day}/${year}`;
  }
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

export async function getEmployeeForAuth(employeeNumber, last4SSN) {
  try {
    const pool = await getConnection();

    const result = await pool.query(`
      SELECT 
        EMEMP, EMQEM, EMLNM, EMFNM, EMMNM,
        EMSTR, EMCIT, EMST, EMZP5,
        "EMSS#", EMDOH, EMDOB,
        EMPOS, EMOFF, EMDEP
      FROM ${config.employeeLibrary}.${config.employeeTable}
      WHERE TRIM(EMEMP) = ?
      AND MOD("EMSS#", 10000) = ?
      FETCH FIRST 1 ROW ONLY
    `, [employeeNumber.toString(), parseInt(last4SSN)]);

    if (result.length === 0) return null;

    const emp = result[0];

    if (DEBUG) console.log('🔍 Raw employee fields:', {
      EMEMP: emp.EMEMP,
      EMFNM: emp.EMFNM,
      EMLNM: emp.EMLNM,
      EMQEM: emp.EMQEM,
      EMPOS: emp.EMPOS
    });

    return {
      IQEM: emp.EMEMP?.trim(),
      EMQEM: emp.EMQEM,
      // Map BOTH ways so auth route can find the name
      ILNM: emp.EMLNM,
      IFNM: emp.EMFNM,
      EMLNM: emp.EMLNM,
      EMFNM: emp.EMFNM,
      IMNM: emp.EMMNM,
      EMMNM: emp.EMMNM,
      ISTR: emp.EMSTR,
      ICIT: emp.EMCIT,
      IST: emp.EMST,
      IZP5: emp.EMZP5,
      'ISS#': emp['EMSS#'],
      IDOH: emp.EMDOH,
      IDOB: emp.EMDOB,
      IPOS: emp.EMPOS,
      EMPOS: emp.EMPOS,
      EMOFF: emp.EMOFF,
      EMDEP: emp.EMDEP
    };
  } catch (error) {
    console.error('Database error in getEmployeeForAuth:', error);
    throw new Error('Failed to authenticate employee');
  }
}

/**
 * Get W-2 data for an employee from EFW2 flat-file tables (W2REPORT21, W2REPORT22, etc.)
 * Probes for tables for the last several years and parses matching RW records.
 * @param {string|number} employeeNumber - Employee number
 * @returns {Array} Array of { taxYear, box1, box2, box3, box4, box5, box6, name }
 */
export async function getW2Data(employeeNumber) {
  try {
    const pool = await getConnection();

    // First get the employee's full SSN from IBM i
    const empTable = `${config.employeeLibrary}.${config.employeeTable}`;
    let empResult;
    if (isINSWORKA) {
      empResult = await pool.query(
        `SELECT "ISS#" FROM ${empTable} WHERE IQEM = ? FETCH FIRST 1 ROW ONLY`,
        [parseInt(employeeNumber)]
      );
    } else {
      empResult = await pool.query(
        `SELECT "EMSS#" FROM ${empTable} WHERE TRIM(EMEMP) = ? FETCH FIRST 1 ROW ONLY`,
        [employeeNumber.toString()]
      );
    }

    if (empResult.length === 0) return [];

    const rawSSN = (empResult[0]['ISS#'] ?? empResult[0]['EMSS#'] ?? '').toString().replace(/\D/g, '');
    if (!rawSSN || rawSSN.length < 9) return [];
    const ssnPadded = rawSSN.padStart(9, '0');

    // Probe for W2REPORT tables for recent years
    const currentYear = new Date().getFullYear();
    const w2Library = process.env.IBM_LIBRARY_W2 || config.employeeLibrary;
    const results = [];

    for (let yr = 2018; yr <= currentYear; yr++) {
      const suffix = yr.toString().slice(-2); // e.g. "21" for 2021
      const tableName = `${w2Library}.W2REPORT${suffix}`;
      try {
        const rows = await pool.query(
          `SELECT DATAD FROM ${tableName} WHERE SUBSTR(DATAD, 1, 2) = 'RW' FETCH FIRST 1000 ROWS ONLY`
        );
        if (rows.length === 0) continue;

        const parseCents = (str) => {
          const n = parseInt((str || '').trim(), 10);
          return isNaN(n) ? 0 : n / 100;
        };

        // Find this employee's RW record by SSN
        for (const row of rows) {
          const d = row.DATAD || '';
          const recSSN = d.substring(2, 11).replace(/\D/g, '').padStart(9, '0');
          if (recSSN !== ssnPadded) continue;

          const firstName = d.substring(11, 26).trim();
          const middleName = d.substring(26, 41).trim();
          const lastName = d.substring(41, 61).trim();
          const mi = middleName ? ` ${middleName[0]}.` : '';

          results.push({
            taxYear: yr,
            name: `${firstName}${mi} ${lastName}`,
            box1:  parseCents(d.substring(187, 198)),
            box2:  parseCents(d.substring(198, 209)),
            box3:  parseCents(d.substring(209, 220)),
            box4:  parseCents(d.substring(220, 231)),
            box5:  parseCents(d.substring(231, 242)),
            box6:  parseCents(d.substring(242, 253)),
          });
          break; // one record per year per employee
        }
      } catch {
        // Table doesn't exist for that year — skip
      }
    }

    return results.sort((a, b) => b.taxYear - a.taxYear);
  } catch (error) {
    console.error('Error fetching W-2 data:', error);
    throw new Error('Failed to fetch W-2 data');
  }
}

/**
 * Close all database connections (for cleanup)
 */
export async function closeConnections() {
  try {
    if (employeePool) await employeePool.close();
    employeePool = null;
  } catch (error) {
    console.error('Error closing connections:', error);
  }
}
