const odbc = require('odbc');
require('dotenv').config({ path: '.env.local' });

// Load config from environment variables
const config = {
  host: process.env.IBM_HOST,
  user: process.env.IBM_USER,
  password: process.env.IBM_PASSWORD,
  driver: process.env.IBM_DRIVER || 'Client Access ODBC Driver (32-bit)',
  libraryEmployee: process.env.IBM_LIBRARY_EMPLOYEE || 'PAYF',
  tableEmployee: process.env.IBM_TABLE_EMPLOYEE || 'EMPMASY',
  libraryPayroll: process.env.IBM_LIBRARY_PAYROLL || 'PAYF21'
};

// Helper to build connection strings
function getConnectionString(library = null) {
  let connStr = `DRIVER={${config.driver}};SYSTEM=${config.host};UID=${config.user};PWD=${config.password};CMT=1;NAM=1`;
  if (library) {
    connStr += `;DBQ=${library}`;
  }
  return connStr;
}

console.log(`\n📡 Connecting to: ${config.host}\n`);

// ===========================================
// EMPLOYEE FUNCTIONS
// ===========================================

async function findCompleteEmployee() {
  try {
    console.log('🔍 Finding employees with most complete data...\n');
    const connection = await odbc.connect(getConnectionString(config.libraryEmployee));

    const result = await connection.query(`
      SELECT
        EMEMP, EMFNM, EMLNM, EMMNM,
        EMSTR, EMCIT, EMST, EMZP5,
        "EMSS#", EMDOH, EMDOB, EMPOS, EMOFF, EMLOC, EMDEP
      FROM ${config.libraryEmployee}.${config.tableEmployee}
      WHERE EMDLT <> 'D' AND EMDOT = 0
      FETCH FIRST 50 ROWS ONLY
    `);

    const hasData = (val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'string') return val.trim() !== '';
      if (typeof val === 'number') return val !== 0;
      return Boolean(val);
    };

    const scored = result.map(emp => {
      let score = 0;
      if (hasData(emp.EMFNM)) score++;
      if (hasData(emp.EMLNM)) score++;
      if (hasData(emp.EMSTR)) score++;
      if (hasData(emp.EMCIT)) score++;
      if (hasData(emp.EMST)) score++;
      if (hasData(emp.EMZP5)) score++;
      if (hasData(emp.EMDOH)) score++;
      if (hasData(emp.EMDOB)) score++;
      if (hasData(emp.EMPOS)) score++;
      if (hasData(emp.EMDEP)) score++;
      if (hasData(emp.EMLOC)) score++;
      if (hasData(emp.EMOFF)) score++;
      return { ...emp, score };
    });

    scored.sort((a, b) => b.score - a.score);

    console.log('Top 5 Most Complete Employee Records:');
    console.log('======================================\n');

    const display = (val) => {
      if (val === null || val === undefined) return '(empty)';
      if (typeof val === 'string') return val.trim() || '(empty)';
      if (typeof val === 'number') return val !== 0 ? val : '(empty)';
      return val || '(empty)';
    };

    scored.slice(0, 5).forEach((emp, i) => {
      const ssn = emp['EMSS#']?.toString() || '';
      const last4 = ssn.slice(-4).padStart(4, '0');
      const firstName = typeof emp.EMFNM === 'string' ? emp.EMFNM.trim() : emp.EMFNM;
      const lastName = typeof emp.EMLNM === 'string' ? emp.EMLNM.trim() : emp.EMLNM;
      const empNum = typeof emp.EMEMP === 'string' ? emp.EMEMP.trim() : emp.EMEMP;

      console.log(`${i + 1}. ${firstName} ${lastName} (Completeness: ${emp.score}/12)`);
      console.log(`   Employee #: ${empNum}`);
      console.log(`   Last 4 SSN: ${last4}`);
      console.log(`   Position: ${display(emp.EMPOS)}`);
      console.log(`   Department: ${display(emp.EMDEP)}`);
      console.log(`   Office: ${display(emp.EMOFF)}`);
      console.log(`   Address: ${display(emp.EMSTR)}, ${display(emp.EMCIT)}, ${display(emp.EMST)} ${display(emp.EMZP5)}`);
      console.log(`   Hire Date: ${display(emp.EMDOH)}`);
      console.log(`   Birth Date: ${display(emp.EMDOB)}`);
      console.log('');
    });

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function getTestLogins() {
  try {
    console.log('🔐 Getting test login credentials...\n');
    const connection = await odbc.connect(getConnectionString(config.libraryEmployee));

    const result = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#"
      FROM ${config.libraryEmployee}.${config.tableEmployee}
      WHERE EMDLT <> 'D' AND EMDOT = 0
      FETCH FIRST 10 ROWS ONLY
    `);

    console.log(`Found ${result.length} active employees\n`);
    console.log('Test Login Credentials:');
    console.log('========================\n');

    result.forEach((emp, i) => {
      const ssn = emp['EMSS#']?.toString() || '';
      const last4 = ssn.slice(-4).padStart(4, '0');
      const empNum = typeof emp.EMEMP === 'string' ? emp.EMEMP.trim() : emp.EMEMP;
      console.log(`${i + 1}. ${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()}`);
      console.log(`   Employee #: ${empNum}`);
      console.log(`   Last 4 SSN: ${last4}`);
      console.log('');
    });

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testAuth(empNum, last4) {
  try {
    console.log(`🔐 Testing auth for employee ${empNum} with last4 ${last4}...\n`);
    const connection = await odbc.connect(getConnectionString(config.libraryEmployee));

    // Get the employee to verify SSN
    const emp = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#"
      FROM ${config.libraryEmployee}.${config.tableEmployee}
      WHERE TRIM(EMEMP) = ?
      FETCH FIRST 1 ROW ONLY
    `, [empNum.toString()]);

    if (emp.length === 0) {
      console.log(`❌ Employee ${empNum} not found`);
      await connection.close();
      return;
    }

    console.log(`✅ Found: ${emp[0].EMFNM?.trim()} ${emp[0].EMLNM?.trim()}`);
    console.log(`   SSN in DB: ${emp[0]['EMSS#']}`);
    console.log(`   Last 4: ${emp[0]['EMSS#']?.toString().slice(-4)}`);
    console.log(`   You entered: ${last4}\n`);

    // Test auth query
    const authResult = await connection.query(`
      SELECT EMEMP FROM ${config.libraryEmployee}.${config.tableEmployee}
      WHERE TRIM(EMEMP) = ?
      AND MOD("EMSS#", 10000) = ?
      FETCH FIRST 1 ROW ONLY
    `, [empNum.toString(), parseInt(last4)]);

    if (authResult.length > 0) {
      console.log('✅ AUTH SUCCESS');
    } else {
      console.log('❌ AUTH FAILED');
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===========================================
// DATABASE EXPLORATION FUNCTIONS
// ===========================================

async function findEmployeeTables() {
  try {
    console.log('🔍 Searching for employee-related tables...\n');
    const connection = await odbc.connect(getConnectionString());

    const result = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TEXT
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME LIKE '%EMP%'
         OR TABLE_NAME LIKE '%WORKER%'
         OR TABLE_NAME LIKE '%INS%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    console.log(`Found ${result.length} employee-related tables:\n`);
    result.forEach(table => {
      console.log(`   ${table.TABLE_SCHEMA.padEnd(15)} ${table.TABLE_NAME.padEnd(25)} - ${table.TABLE_TEXT || ''}`);
    });

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function findPayrollTables() {
  try {
    console.log('🔍 Searching for payroll-related tables...\n');
    const connection = await odbc.connect(getConnectionString());

    const result = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TEXT
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME LIKE '%PAY%'
         OR TABLE_NAME LIKE '%CHECK%'
         OR TABLE_NAME LIKE '%STUB%'
         OR TABLE_NAME LIKE '%EARN%'
         OR TABLE_NAME LIKE '%WAGE%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    console.log(`Found ${result.length} payroll-related tables:\n`);
    result.forEach(table => {
      console.log(`   ${table.TABLE_SCHEMA.padEnd(15)} ${table.TABLE_NAME.padEnd(30)} - ${table.TABLE_TEXT || ''}`);
    });

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function findAllLibraries() {
  try {
    console.log('📋 Finding all accessible libraries...\n');
    const connection = await odbc.connect(getConnectionString());

    const schemas = await connection.query(`
      SELECT DISTINCT TABLE_SCHEMA
      FROM QSYS2.SYSTABLES
      ORDER BY TABLE_SCHEMA
    `);

    console.log(`Found ${schemas.length} accessible libraries:\n`);
    schemas.forEach(schema => {
      console.log(`   ${schema.TABLE_SCHEMA}`);
    });

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===========================================
// PAYROLL/PAYSTUB FUNCTIONS
// ===========================================

async function explorePaystubTable() {
  try {
    console.log('📋 Exploring paystub table structure...\n');
    const connection = await odbc.connect(getConnectionString(config.libraryPayroll));

    // Get columns
    console.log('Table columns:\n');
    const columns = await connection.columns(null, config.libraryPayroll, 'PAYNETZZ', null);
    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME.padEnd(20)} ${col.TYPE_NAME.padEnd(20)} Size: ${col.COLUMN_SIZE}`);
    });

    // Get sample record
    console.log('\n\nSample record:\n');
    const sample = await connection.query(`
      SELECT * FROM ${config.libraryPayroll}.PAYNETZZ
      FETCH FIRST 1 ROW ONLY
    `);

    if (sample.length > 0) {
      Object.keys(sample[0]).forEach(key => {
        console.log(`   ${key}: ${sample[0][key]}`);
      });
    }

    // Get count
    const count = await connection.query(`
      SELECT COUNT(*) as TOTAL FROM ${config.libraryPayroll}.PAYNETZZ
    `);
    console.log(`\n\nTotal records: ${count[0].TOTAL}`);

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function findPaystubsForEmployee(empNum) {
  try {
    console.log(`📋 Finding paystubs for employee ${empNum}...\n`);
    const connection = await odbc.connect(getConnectionString(config.libraryPayroll));

    // Try to find paystubs
    const result = await connection.query(`
      SELECT * FROM ${config.libraryPayroll}.PAYNETZZ
      WHERE PNQEM = ?
      ORDER BY PNCK# DESC
      FETCH FIRST 10 ROWS ONLY
    `, [empNum]);

    console.log(`Found ${result.length} paystubs\n`);

    if (result.length > 0) {
      result.forEach((stub, i) => {
        console.log(`${i + 1}. Check #${stub['PNCK#']}`);
        console.log(`   Net Pay: ${stub.PNNET}`);
        console.log(`   Bank: ${stub.PNBK}`);
        console.log('');
      });
    } else {
      console.log('No paystubs found. Try a different employee number.');
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function findAccessiblePayTables() {
  try {
    console.log('🔍 Finding accessible pay-related tables...\n');
    console.log(`Connected to: ${config.host}\n`);
    const connection = await odbc.connect(getConnectionString());

    // First, find all pay-related tables across all libraries
    console.log('Step 1: Finding all pay-related tables...\n');
    const allPayTables = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TEXT
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME LIKE '%PAY%'
         OR TABLE_NAME LIKE '%CHECK%'
         OR TABLE_NAME LIKE '%STUB%'
         OR TABLE_NAME LIKE '%EARN%'
         OR TABLE_NAME LIKE '%WAGE%'
         OR TABLE_NAME LIKE '%NET%'
         OR TABLE_NAME LIKE '%GROSS%'
         OR TABLE_NAME LIKE '%DED%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    console.log(`Found ${allPayTables.length} pay-related tables\n`);

    // Now test access to each one
    console.log('Step 2: Testing access to each table...\n');
    console.log('=' .repeat(80));
    console.log(`${'Library'.padEnd(15)} ${'Table'.padEnd(30)} ${'Records'.padEnd(12)} Status`);
    console.log('=' .repeat(80));

    const accessibleTables = [];

    for (const table of allPayTables) {
      try {
        const testConn = await odbc.connect(getConnectionString(table.TABLE_SCHEMA));
        const result = await testConn.query(`
          SELECT COUNT(*) as CNT FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}
        `);
        
        const recordCount = result[0].CNT;
        console.log(`${table.TABLE_SCHEMA.padEnd(15)} ${table.TABLE_NAME.padEnd(30)} ${recordCount.toString().padEnd(12)} ✅ Accessible`);
        
        accessibleTables.push({
          schema: table.TABLE_SCHEMA,
          table: table.TABLE_NAME,
          description: table.TABLE_TEXT,
          records: recordCount
        });
        
        await testConn.close();
      } catch (err) {
        console.log(`${table.TABLE_SCHEMA.padEnd(15)} ${table.TABLE_NAME.padEnd(30)} ${'N/A'.padEnd(12)} ❌ No access`);
      }
    }

    console.log('=' .repeat(80));
    console.log(`\n✅ Found ${accessibleTables.length} accessible pay-related tables\n`);

    // Show summary of accessible tables
    if (accessibleTables.length > 0) {
      console.log('📊 ACCESSIBLE TABLES SUMMARY:\n');
      accessibleTables.forEach((t, i) => {
        console.log(`${i + 1}. ${t.schema}.${t.table}`);
        console.log(`   Records: ${t.records}`);
        console.log(`   Description: ${t.description || 'No description'}`);
        console.log('');
      });

      // If we found accessible tables, explore the first one
      if (accessibleTables.length > 0 && accessibleTables[0].records > 0) {
        console.log('\n🔍 Exploring first accessible table with data...\n');
        const firstTable = accessibleTables.find(t => t.records > 0);
        
        if (firstTable) {
          const exploreConn = await odbc.connect(getConnectionString(firstTable.schema));
          
          // Get columns
          console.log(`Columns in ${firstTable.schema}.${firstTable.table}:\n`);
          const columns = await exploreConn.columns(null, firstTable.schema, firstTable.table, null);
          columns.forEach(col => {
            console.log(`   ${col.COLUMN_NAME.padEnd(20)} ${col.TYPE_NAME.padEnd(15)} (${col.COLUMN_SIZE})`);
          });

          // Get sample record
          console.log('\n\nSample record:\n');
          const sample = await exploreConn.query(`
            SELECT * FROM ${firstTable.schema}.${firstTable.table}
            FETCH FIRST 1 ROW ONLY
          `);

          if (sample.length > 0) {
            Object.keys(sample[0]).forEach(key => {
              const value = sample[0][key];
              if (value !== null && value !== '' && value !== 0) {
                console.log(`   ${key}: ${value}`);
              }
            });
          }

          await exploreConn.close();
        }
      }
    } else {
      console.log('❌ No accessible pay-related tables found.');
      console.log('\nThis means:');
      console.log('  1. The "web" user does not have access to PAYF21 or other payroll libraries');
      console.log('  2. You need to contact IT to grant SELECT permissions on payroll tables');
      console.log('  3. Pay stubs will need to show "Coming Soon" message until access is granted');
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testPaystubAccess() {
  try {
    console.log('🔍 Testing access to common paystub tables...\n');
    console.log(`Connected to: ${config.host}\n`);

    const commonPayTables = [
      { lib: 'PAYF21', table: 'PAYNETZZ', desc: 'Net pay records' },
      { lib: 'PAYF21', table: 'HISDEDZZ', desc: 'Deduction history' },
      { lib: 'PAYF21', table: 'PAYREGZZ', desc: 'Payroll register' },
      { lib: 'PAYF', table: 'PAYNETZZ', desc: 'Net pay (PAYF)' },
      { lib: 'PAYF', table: 'PAYNETZY', desc: 'Net pay current (PAYF)' },
      { lib: 'QS36F', table: 'PAYNETZZ', desc: 'Net pay (QS36F)' },
    ];

    console.log('Testing common paystub table locations:\n');
    console.log('=' .repeat(70));

    const accessibleTables = [];

    for (const t of commonPayTables) {
      try {
        const connection = await odbc.connect(getConnectionString(t.lib));
        const result = await connection.query(`
          SELECT COUNT(*) as CNT FROM ${t.lib}.${t.table}
        `);
        
        console.log(`✅ ${t.lib}.${t.table.padEnd(20)} - ${result[0].CNT} records (${t.desc})`);
        accessibleTables.push({ ...t, records: result[0].CNT });
        
        await connection.close();
      } catch (err) {
        console.log(`❌ ${t.lib}.${t.table.padEnd(20)} - No access (${t.desc})`);
      }
    }

    console.log('=' .repeat(70));

    if (accessibleTables.length > 0) {
      console.log(`\n✅ Found ${accessibleTables.length} accessible paystub table(s)!`);
      console.log('\nYou can use these for paystub data:');
      accessibleTables.forEach(t => {
        console.log(`  • ${t.lib}.${t.table} (${t.records} records)`);
      });
    } else {
      console.log('\n❌ No accessible paystub tables found.');
      console.log('Contact IT to grant access to PAYF21 or PAYF paystub tables.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function explorePayfPaynetzz() {
  try {
    console.log('📋 Exploring PAYF.PAYNETZZ table...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get columns
    console.log('Table Columns:\n');
    console.log('=' .repeat(80));
    const columns = await connection.columns(null, 'PAYF', 'PAYNETZZ', null);
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(20)} ${col.TYPE_NAME.padEnd(20)} Size: ${col.COLUMN_SIZE}`);
    });
    console.log('=' .repeat(80));

    // Get a sample record
    console.log('\n\nSample Paystub Record:\n');
    const sample = await connection.query(`
      SELECT * FROM PAYF.PAYNETZZ
      ORDER BY PNCK# DESC
      FETCH FIRST 1 ROW ONLY
    `);

    if (sample.length > 0) {
      Object.keys(sample[0]).forEach(key => {
        const value = sample[0][key];
        console.log(`${key.padEnd(20)} = ${value}`);
      });
    }

    // Check if we can link to employees
    console.log('\n\n🔍 Testing employee linkage...\n');
    
    // Try to find which field links to employee number
    console.log('Sample employee numbers from PAYNETZZ:');
    const empSample = await connection.query(`
      SELECT DISTINCT PNQEM
      FROM PAYF.PAYNETZZ
      FETCH FIRST 10 ROWS ONLY
    `);
    
    empSample.forEach(row => {
      console.log(`  PNQEM: ${row.PNQEM}`);
    });

    // Now check if these match employee numbers in EMPMASY
    console.log('\n\nChecking if PNQEM matches EMEMP in employee table...');
    const testEmpId = empSample[0].PNQEM;
    
    const empMatch = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM
      FROM PAYF.EMPMASY
      WHERE EMEMP = ?
      FETCH FIRST 1 ROW ONLY
    `, [testEmpId]);

    if (empMatch.length > 0) {
      console.log(`✅ MATCH FOUND!`);
      console.log(`  Employee #${testEmpId} = ${empMatch[0].EMFNM?.trim()} ${empMatch[0].EMLNM?.trim()}`);
      console.log(`\n  This means PNQEM links to EMEMP`);
    } else {
      console.log(`❌ No match found with EMEMP`);
      console.log(`  Need to find the correct linking field`);
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function findPaystubsForTestEmployee() {
  try {
    console.log('🔍 Finding paystubs for a test employee...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get an employee with complete data
    const emp = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#"
      FROM PAYF.EMPMASY
      WHERE EMDLT <> 'D' AND EMDOT = 0
      FETCH FIRST 1 ROW ONLY
    `);

    if (emp.length === 0) {
      console.log('❌ No employees found');
      await connection.close();
      return;
    }

    const empNum = typeof emp[0].EMEMP === 'string' ? emp[0].EMEMP.trim() : emp[0].EMEMP;
    console.log(`Testing with: ${emp[0].EMFNM?.trim()} ${emp[0].EMLNM?.trim()}`);
    console.log(`Employee #: ${empNum}\n`);

    // Try to find their paystubs
    console.log('Searching for paystubs...\n');
    const stubs = await connection.query(`
      SELECT 
        PNCK#,
        PNQEM,
        PNNET,
        PNBK,
        PNID
      FROM PAYF.PAYNETZZ
      WHERE PNQEM = ?
      ORDER BY PNCK# DESC
      FETCH FIRST 10 ROWS ONLY
    `, [empNum]);

    console.log(`Found ${stubs.length} paystubs:\n`);

    if (stubs.length > 0) {
      stubs.forEach((stub, i) => {
        console.log(`${i + 1}. Check #${stub['PNCK#']}`);
        console.log(`   Employee ID: ${stub.PNQEM}`);
        console.log(`   Net Pay: ${stub.PNNET}`);
        console.log(`   Bank: ${stub.PNBK}`);
        console.log(`   Type: ${stub.PNID}`);
        console.log('');
      });

      // Test formatting
      console.log('💰 Formatted Net Pay Examples:\n');
      stubs.slice(0, 3).forEach((stub, i) => {
        const netPay = stub.PNNET;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(netPay / 100);
        
        console.log(`${i + 1}. Check #${stub['PNCK#']}: ${formatted}`);
      });
    } else {
      console.log('No paystubs found for this employee.');
      console.log('Trying a different search...\n');

      // Show what employee IDs exist in paystubs
      const allIds = await connection.query(`
        SELECT DISTINCT PNQEM
        FROM PAYF.PAYNETZZ
        FETCH FIRST 20 ROWS ONLY
      `);
      
      console.log('Employee IDs found in PAYNETZZ:');
      allIds.forEach(row => {
        console.log(`  ${row.PNQEM}`);
      });
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function findHiddenIdMapping() {
  try {
    console.log('🔍 Finding employee ID mapping...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get employee table structure to find hidden ID field
    console.log('Employee table columns:\n');
    const empColumns = await connection.columns(null, 'PAYF', 'EMPMASY', null);
    empColumns.forEach(col => {
      if (col.COLUMN_NAME.includes('QEM') || col.COLUMN_NAME.includes('ID') || col.COLUMN_NAME.includes('HID')) {
        console.log(`  ⭐ ${col.COLUMN_NAME.padEnd(20)} ${col.TYPE_NAME.padEnd(20)} (likely ID field)`);
      } else {
        console.log(`     ${col.COLUMN_NAME.padEnd(20)} ${col.TYPE_NAME}`);
      }
    });

    // Get a sample employee record
    console.log('\n\nSample Employee Record (looking for hidden ID):\n');
    const emp = await connection.query(`
      SELECT * FROM PAYF.EMPMASY
      WHERE EMDLT <> 'D' AND EMDOT = 0
      FETCH FIRST 1 ROW ONLY
    `);

    if (emp.length > 0) {
      Object.keys(emp[0]).forEach(key => {
        const value = emp[0][key];
        if (key.includes('QEM') || (typeof value === 'number' && value < 0)) {
          console.log(`  ⭐ ${key.padEnd(20)} = ${value} (possible hidden ID)`);
        } else {
          console.log(`     ${key.padEnd(20)} = ${value}`);
        }
      });

      // Try to match this employee to paystubs
      console.log('\n\n🔗 Testing linkage with paystub table...\n');
      
      // Look for fields that might contain the hidden ID
      const empRecord = emp[0];
      const possibleIdFields = Object.keys(empRecord).filter(key => 
        key.includes('QEM') || (typeof empRecord[key] === 'number' && empRecord[key] < 0)
      );

      console.log(`Found ${possibleIdFields.length} possible ID fields: ${possibleIdFields.join(', ')}\n`);

      for (const field of possibleIdFields) {
        const hiddenId = empRecord[field];
        console.log(`Testing ${field} = ${hiddenId}...`);
        
        const stubs = await connection.query(`
          SELECT COUNT(*) as CNT FROM PAYF.PAYNETZZ
          WHERE PNQEM = ?
        `, [hiddenId]);

        if (stubs[0].CNT > 0) {
          console.log(`  ✅ MATCH! ${field} links to PNQEM (found ${stubs[0].CNT} paystubs)`);
          console.log(`\n  Employee: ${empRecord.EMFNM?.trim()} ${empRecord.EMLNM?.trim()}`);
          console.log(`  Employee #: ${empRecord.EMEMP}`);
          console.log(`  Hidden ID (${field}): ${hiddenId}`);
          
          // Get sample paystubs
          const sampleStubs = await connection.query(`
            SELECT PNCK#, PNNET, PNBK
            FROM PAYF.PAYNETZZ
            WHERE PNQEM = ?
            ORDER BY PNCK# DESC
            FETCH FIRST 3 ROWS ONLY
          `, [hiddenId]);

          console.log(`\n  Sample paystubs:`);
          sampleStubs.forEach((stub, i) => {
            const netPay = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(stub.PNNET / 100);
            console.log(`    ${i + 1}. Check #${stub['PNCK#']} - ${netPay}`);
          });
          
          break; // Found the match!
        } else {
          console.log(`  ❌ No match`);
        }
      }
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function getPaystubsForKnownEmployee(empNum) {
  try {
    console.log(`🔍 Getting paystubs for employee #${empNum}...\n`);
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // First get the employee and their hidden ID
    const emp = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, EMQEM
      FROM PAYF.EMPMASY
      WHERE TRIM(EMEMP) = ?
      FETCH FIRST 1 ROW ONLY
    `, [empNum.toString()]);

    if (emp.length === 0) {
      console.log('❌ Employee not found');
      await connection.close();
      return;
    }

    console.log(`Employee: ${emp[0].EMFNM?.trim()} ${emp[0].EMLNM?.trim()}`);
    console.log(`Employee #: ${emp[0].EMEMP}`);
    console.log(`Hidden ID (EMQEM): ${emp[0].EMQEM}\n`);

    // Get their paystubs using hidden ID
    const stubs = await connection.query(`
      SELECT 
        PNCK# as checkNumber,
        PNNET as netPay,
        PNBK as bank,
        PNID as recordType
      FROM PAYF.PAYNETZZ
      WHERE PNQEM = ?
      ORDER BY PNCK# DESC
      FETCH FIRST 10 ROWS ONLY
    `, [emp[0].EMQEM]);

    console.log(`Found ${stubs.length} paystubs:\n`);

    if (stubs.length > 0) {
      stubs.forEach((stub, i) => {
        const netPay = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(stub.netPay / 100);
        
        console.log(`${i + 1}. Check #${stub.checkNumber}`);
        console.log(`   Net Pay: ${netPay}`);
        console.log(`   Bank: ${stub.bank}`);
        console.log(`   Type: ${stub.recordType}`);
        console.log('');
      });
    } else {
      console.log('No paystubs found for this employee.');
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function verifyHiddenIdFormula() {
  try {
    console.log('🔍 Verifying Hidden ID Formula...\n');
    console.log('Formula: Hidden ID = -999999999 - Employee Number\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get a few test employees
    const employees = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, EMQEM
      FROM PAYF.EMPMASY
      WHERE EMDLT <> 'D' AND EMDOT = 0
      FETCH FIRST 5 ROWS ONLY
    `);

    console.log('Testing formula with sample employees:\n');
    console.log('=' .repeat(90));

    let allMatch = true;

    employees.forEach((emp, i) => {
      const empNum = typeof emp.EMEMP === 'string' ? parseInt(emp.EMEMP.trim()) : emp.EMEMP;
      const storedHiddenId = emp.EMQEM;
      const calculatedHiddenId = -999999999 - empNum;
      const match = storedHiddenId === calculatedHiddenId;

      console.log(`${i + 1}. ${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()}`);
      console.log(`   Employee #: ${empNum}`);
      console.log(`   Stored EMQEM: ${storedHiddenId}`);
      console.log(`   Calculated: -999999999 - ${empNum} = ${calculatedHiddenId}`);
      console.log(`   Match: ${match ? '✅' : '❌'}`);
      console.log('');

      if (!match) allMatch = false;
    });

    console.log('=' .repeat(90));

    if (allMatch) {
      console.log('\n✅ Formula confirmed! Hidden ID = -999999999 - Employee Number\n');
      
      // Now test with paystubs
      console.log('Testing paystub linkage...\n');
      const testEmp = employees[0];
      const empNum = typeof testEmp.EMEMP === 'string' ? parseInt(testEmp.EMEMP.trim()) : testEmp.EMEMP;
      const hiddenId = testEmp.EMQEM;

      const stubs = await connection.query(`
        SELECT 
          PNCK# as checkNumber,
          PNNET as netPay,
          PNBK as bank
        FROM PAYF.PAYNETZZ
        WHERE PNQEM = ?
        ORDER BY PNCK# DESC
        FETCH FIRST 5 ROWS ONLY
      `, [hiddenId]);

      console.log(`Employee #${empNum} (${testEmp.EMFNM?.trim()} ${testEmp.EMLNM?.trim()})`);
      console.log(`Hidden ID: ${hiddenId}`);
      console.log(`Found ${stubs.length} paystubs:\n`);

      if (stubs.length > 0) {
        stubs.forEach((stub, i) => {
          const netPay = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(stub.netPay / 100);
          
          console.log(`  ${i + 1}. Check #${stub.checkNumber} - ${netPay} (Bank: ${stub.bank})`);
        });

        console.log('\n✅ Paystub linkage confirmed!\n');
        console.log('📝 Summary:');
        console.log('   - Employee table: PAYF.EMPMASY');
        console.log('   - Paystub table: PAYF.PAYNETZZ');
        console.log('   - Link field: EMQEM (employee) → PNQEM (paystub)');
        console.log('   - Hidden ID: Use EMQEM directly from employee record');
        console.log('   - Net pay is stored in CENTS (divide by 100 for dollars)');
      } else {
        console.log('  ⚠️  No paystubs found for this employee');
        console.log('     (They may not have any pay history yet)');
      }
    } else {
      console.log('\n❌ Formula does not match - need different calculation\n');
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function reverseEngineerFormula() {
  try {
    console.log('🔍 Reverse Engineering the Hidden ID Formula...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    const employees = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, EMQEM
      FROM PAYF.EMPMASY
      WHERE EMDLT <> 'D' AND EMDOT = 0
      FETCH FIRST 10 ROWS ONLY
    `);

    console.log('Analyzing patterns:\n');
    console.log('=' .repeat(100));
    console.log('Employee #  | EMQEM        | Difference    | Pattern');
    console.log('=' .repeat(100));

    employees.forEach(emp => {
      const empNum = typeof emp.EMEMP === 'string' ? parseInt(emp.EMEMP.trim()) : emp.EMEMP;
      const hiddenId = emp.EMQEM;
      
      // Try different formulas
      const diff = empNum - hiddenId;
      const diff2 = hiddenId + empNum;
      const diff3 = -1000000000 - hiddenId;
      
      console.log(`${empNum.toString().padEnd(12)}| ${hiddenId.toString().padEnd(13)}| ${diff.toString().padEnd(14)}| -1000000000 - ${diff3}`);
    });

    console.log('=' .repeat(100));

    // Let's check if it's: EMQEM = Employee# - 1000000000
    console.log('\n\nTesting Formula: EMQEM = Employee# - 1000000000\n');

    let matches = 0;
    employees.forEach(emp => {
      const empNum = typeof emp.EMEMP === 'string' ? parseInt(emp.EMEMP.trim()) : emp.EMEMP;
      const storedHiddenId = emp.EMQEM;
      const calculated = empNum - 1000000000;
      const match = storedHiddenId === calculated;
      
      if (match) {
        matches++;
        console.log(`✅ ${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()}: ${empNum} - 1000000000 = ${calculated}`);
      } else {
        console.log(`❌ ${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()}: ${empNum} - 1000000000 = ${calculated} (stored: ${storedHiddenId})`);
      }
    });

    if (matches === employees.length) {
      console.log('\n✅ FORMULA FOUND! EMQEM = Employee# - 1000000000\n');
      
      // Test with paystubs
      console.log('Testing paystub linkage...\n');
      const testEmp = employees[0];
      const empNum = typeof testEmp.EMEMP === 'string' ? parseInt(testEmp.EMEMP.trim()) : testEmp.EMEMP;
      const hiddenId = testEmp.EMQEM;

      const stubs = await connection.query(`
        SELECT 
          PNCK# as checkNumber,
          PNNET as netPay,
          PNBK as bank
        FROM PAYF.PAYNETZZ
        WHERE PNQEM = ?
        ORDER BY PNCK# DESC
        FETCH FIRST 5 ROWS ONLY
      `, [hiddenId]);

      console.log(`Employee #${empNum} (${testEmp.EMFNM?.trim()} ${testEmp.EMLNM?.trim()})`);
      console.log(`Hidden ID: ${hiddenId}`);
      console.log(`Found ${stubs.length} paystubs:\n`);

      if (stubs.length > 0) {
        stubs.forEach((stub, i) => {
          // Check if netPay is in cents or dollars
          const netPayValue = stub.netPay;
          const asCents = netPayValue / 100;
          const asDollars = netPayValue;
          
          console.log(`  ${i + 1}. Check #${stub.checkNumber}`);
          console.log(`     Raw value: ${netPayValue}`);
          console.log(`     As cents: $${asCents.toFixed(2)}`);
          console.log(`     As dollars: $${asDollars.toFixed(2)}`);
          console.log(`     Bank: ${stub.bank}`);
          console.log('');
        });

        console.log('✅ SUCCESS! Ready to update lib/db.js\n');
        console.log('📝 Configuration:');
        console.log('   - Employee table: PAYF.EMPMASY');
        console.log('   - Paystub table: PAYF.PAYNETZZ');
        console.log('   - Link: EMQEM → PNQEM');
        console.log('   - Net pay: Check which format looks correct above');
      } else {
        console.log('  ⚠️  No paystubs found. Trying another employee...\n');
        
        // Try to find an employee WITH paystubs
        for (let i = 1; i < employees.length; i++) {
          const emp = employees[i];
          const testStubs = await connection.query(`
            SELECT COUNT(*) as CNT FROM PAYF.PAYNETZZ WHERE PNQEM = ?
          `, [emp.EMQEM]);
          
          if (testStubs[0].CNT > 0) {
            console.log(`Found employee with paystubs: ${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()} (${testStubs[0].CNT} stubs)`);
            
            const showStubs = await connection.query(`
              SELECT PNCK#, PNNET, PNBK FROM PAYF.PAYNETZZ 
              WHERE PNQEM = ? ORDER BY PNCK# DESC FETCH FIRST 3 ROWS ONLY
            `, [emp.EMQEM]);
            
            showStubs.forEach((stub, idx) => {
              console.log(`  ${idx + 1}. Check #${stub['PNCK#']} - Raw: ${stub.PNNET}, As cents: $${(stub.PNNET/100).toFixed(2)}, As dollars: $${stub.PNNET.toFixed(2)}`);
            });
            break;
          }
        }
      }
    } else {
      console.log('\n❌ Still not the right formula. Showing more analysis...\n');
      
      // Show the actual pattern
      employees.forEach(emp => {
        const empNum = typeof emp.EMEMP === 'string' ? parseInt(emp.EMEMP.trim()) : emp.EMEMP;
        const hiddenId = emp.EMQEM;
        const reverseCalc = 1000000000 + hiddenId; // If EMQEM = Employee - 1000000000, then Employee = 1000000000 + EMQEM
        
        console.log(`Emp #${empNum}: EMQEM=${hiddenId}, Reverse calc: ${reverseCalc}, Diff: ${empNum - reverseCalc}`);
      });
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testDirectEmqemLink() {
  try {
    console.log('🔍 Testing Direct EMQEM Link (no calculation needed)...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get employees and check if they have EMQEM field
    const employees = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, EMQEM
      FROM PAYF.EMPMASY
      WHERE EMDLT <> 'D' AND EMDOT = 0
      FETCH FIRST 20 ROWS ONLY
    `);

    console.log(`Testing ${employees.length} employees for paystub linkage...\n`);
    console.log('=' .repeat(90));

    let foundWithStubs = 0;

    for (const emp of employees) {
      const empNum = typeof emp.EMEMP === 'string' ? emp.EMEMP.trim() : emp.EMEMP;
      const hiddenId = emp.EMQEM;
      const name = `${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()}`;

      // Check for paystubs using EMQEM directly
      const stubs = await connection.query(`
        SELECT COUNT(*) as CNT FROM PAYF.PAYNETZZ
        WHERE PNQEM = ?
      `, [hiddenId]);

      const stubCount = stubs[0].CNT;

      if (stubCount > 0) {
        foundWithStubs++;
        console.log(`✅ Emp #${empNum.toString().padEnd(6)} ${name.padEnd(30)} EMQEM: ${hiddenId.toString().padEnd(12)} → ${stubCount} paystubs`);

        // Get sample paystub for first employee with stubs
        if (foundWithStubs === 1) {
          console.log('\n   📋 Sample paystubs:\n');
          const sampleStubs = await connection.query(`
            SELECT 
              PNCK# as checkNumber,
              PNNET as netPay,
              PNBK as bank,
              PNID as recordType
            FROM PAYF.PAYNETZZ
            WHERE PNQEM = ?
            ORDER BY PNCK# DESC
            FETCH FIRST 5 ROWS ONLY
          `, [hiddenId]);

          sampleStubs.forEach((stub, i) => {
            // Test both formats
            const asCents = stub.netPay / 100;
            const asDollars = stub.netPay;
            
            console.log(`   ${i + 1}. Check #${stub.checkNumber}`);
            console.log(`      Raw value: ${stub.netPay}`);
            console.log(`      If cents → $${asCents.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            console.log(`      If dollars → $${asDollars.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
            console.log(`      Bank: ${stub.bank}, Type: ${stub.recordType}`);
            console.log('');
          });
          console.log('   ⬆️  Which format looks correct? (cents is more common)\n');
        }
      } else {
        console.log(`   Emp #${empNum.toString().padEnd(6)} ${name.padEnd(30)} EMQEM: ${hiddenId.toString().padEnd(12)} → No paystubs`);
      }
    }

    console.log('=' .repeat(90));
    console.log(`\n✅ Found ${foundWithStubs} employees with paystubs out of ${employees.length} tested\n`);

    if (foundWithStubs > 0) {
      console.log('🎉 SUCCESS! Direct EMQEM link works!\n');
      console.log('📝 Configuration for lib/db.js:');
      console.log('   - Employee table: PAYF.EMPMASY');
      console.log('   - Paystub table: PAYF.PAYNETZZ');
      console.log('   - Employee ID field: EMEMP');
      console.log('   - Hidden ID field: EMQEM (use directly, no calculation)');
      console.log('   - Paystub link: WHERE PNQEM = employee.EMQEM');
      console.log('   - Net pay format: Check sample above - likely in cents (divide by 100)');
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function findEmployeesWithPaystubs() {
  try {
    console.log('🔍 Finding which employees actually have paystubs...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get unique employee IDs from paystub table
    console.log('Step 1: Getting unique PNQEM values from paystub table...\n');
    const paystubEmpIds = await connection.query(`
      SELECT DISTINCT PNQEM
      FROM PAYF.PAYNETZZ
      ORDER BY PNQEM DESC
      FETCH FIRST 20 ROWS ONLY
    `);

    console.log(`Found ${paystubEmpIds.length} unique employee IDs in paystub table:\n`);
    paystubEmpIds.forEach((row, i) => {
      console.log(`  ${i + 1}. PNQEM: ${row.PNQEM}`);
    });

    // Now try to match these to employee records
    console.log('\n\nStep 2: Matching to employee records...\n');
    console.log('=' .repeat(100));

    let matchCount = 0;

    for (const payId of paystubEmpIds) {
      const pnqem = payId.PNQEM;

      // Try to find matching employee by EMQEM
      const empByEmqem = await connection.query(`
        SELECT EMEMP, EMFNM, EMLNM, EMQEM
        FROM PAYF.EMPMASY
        WHERE EMQEM = ?
        FETCH FIRST 1 ROW ONLY
      `, [pnqem]);

      if (empByEmqem.length > 0) {
        matchCount++;
        const emp = empByEmqem[0];
        const empNum = typeof emp.EMEMP === 'string' ? emp.EMEMP.trim() : emp.EMEMP;
        console.log(`✅ PNQEM ${pnqem} → Emp #${empNum} (${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()})`);

        // Get sample paystubs for first match
        if (matchCount === 1) {
          console.log('\n   📋 Sample paystubs for this employee:\n');
          const stubs = await connection.query(`
            SELECT PNCK#, PNNET, PNBK, PNID
            FROM PAYF.PAYNETZZ
            WHERE PNQEM = ?
            ORDER BY PNCK# DESC
            FETCH FIRST 5 ROWS ONLY
          `, [pnqem]);

          stubs.forEach((stub, i) => {
            const asCents = stub.PNNET / 100;
            const asDollars = stub.PNNET;
            
            console.log(`   ${i + 1}. Check #${stub['PNCK#']}`);
            console.log(`      Raw: ${stub.PNNET}`);
            console.log(`      If cents: $${asCents.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
            console.log(`      If dollars: $${asDollars.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
            console.log(`      Bank: ${stub.PNBK}`);
          });
          console.log('\n   ^ Which format looks correct?\n');
        }
      } else {
        console.log(`❌ PNQEM ${pnqem} → No matching employee found`);
      }
    }

    console.log('=' .repeat(100));
    console.log(`\n✅ Matched ${matchCount} out of ${paystubEmpIds.length} paystub employee IDs\n`);

    if (matchCount > 0) {
      console.log('🎉 SUCCESS! We can link paystubs to employees!\n');
      console.log('📝 Configuration:');
      console.log('   - Use EMQEM from employee table directly');
      console.log('   - Query: WHERE PNQEM = employee.EMQEM');
      console.log('   - Net pay: Check sample above for correct format\n');
    } else {
      console.log('⚠️  No matches found. The paystub data might be for different employees');
      console.log('    or using a different linking mechanism.\n');
      
      // Try to see if there's a pattern
      console.log('Let\'s check if there\'s a calculation needed...\n');
      const samplePaystub = paystubEmpIds[0].PNQEM;
      console.log(`Sample PNQEM: ${samplePaystub}`);
      console.log(`Trying different calculations...`);
      
      const calculations = [
        { name: 'PNQEM + 1000000000', value: samplePaystub + 1000000000 },
        { name: 'PNQEM * -1', value: samplePaystub * -1 },
        { name: '1000000000 - PNQEM', value: 1000000000 - samplePaystub },
        { name: '-1000000000 - PNQEM', value: -1000000000 - samplePaystub },
      ];

      for (const calc of calculations) {
        const result = await connection.query(`
          SELECT EMEMP, EMFNM, EMLNM
          FROM PAYF.EMPMASY
          WHERE EMEMP = ?
          FETCH FIRST 1 ROW ONLY
        `, [calc.value]);

        if (result.length > 0) {
          console.log(`\n✅ FOUND IT! ${calc.name} = ${calc.value}`);
          console.log(`   Employee: ${result[0].EMFNM?.trim()} ${result[0].EMLNM?.trim()}`);
          break;
        } else {
          console.log(`   ${calc.name} = ${calc.value} → No match`);
        }
      }
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function getLoginForEmployee(empNum) {
  try {
    console.log(`🔐 Getting login credentials for employee #${empNum}...\n`);
    const connection = await odbc.connect(getConnectionString(config.libraryEmployee));

    const result = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#", EMQEM, EMDOB
      FROM ${config.libraryEmployee}.${config.tableEmployee}
      WHERE TRIM(EMEMP) = ?
      FETCH FIRST 1 ROW ONLY
    `, [empNum.toString()]);

    if (result.length === 0) {
      console.log('❌ Employee not found');
      await connection.close();
      return;
    }

    const emp = result[0];
    const ssn = emp['EMSS#']?.toString() || '';
    const last4 = ssn.slice(-4).padStart(4, '0');
    const empNumber = typeof emp.EMEMP === 'string' ? emp.EMEMP.trim() : emp.EMEMP;

    // Format EMDOB (YYYYMMDD) → MM/DD/YYYY for the reset form
    const dobRaw = emp.EMDOB?.toString().padStart(8, '0') || '00000000';
    const dobFormatted = dobRaw !== '00000000'
      ? `${dobRaw.slice(4, 6)}/${dobRaw.slice(6, 8)}/${dobRaw.slice(0, 4)}`
      : '(no DOB on file)';

    console.log('✅ Login Credentials:\n');
    console.log('═'.repeat(55));
    console.log(`  Name:          ${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()}`);
    console.log(`  Employee #:    ${empNumber}`);
    console.log(`  Last 4 SSN:    ${last4}`);
    console.log(`  Date of Birth: ${dobFormatted}  (raw: ${dobRaw})`);
    console.log(`  Hidden ID:     ${emp.EMQEM}`);
    console.log('═'.repeat(55));
    console.log('\n📋 Use these values to test the password reset flow:');
    console.log(`  /forgot-password → Employee #: ${empNumber}`);
    console.log(`                   → Last 4 SSN: ${last4}`);
    console.log(`                   → Date of Birth: ${dobFormatted}`);

    // Also check how many paystubs they have
    const stubCount = await connection.query(`
      SELECT COUNT(*) as CNT FROM PAYF.HISCTLZZ WHERE HCQEM = ?
    `, [emp.EMQEM]);

    console.log(`\n📄 Paystub count: ${stubCount[0].CNT}\n`);

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function exploreHisctlzz() {
  try {
    console.log('🔍 Exploring HISCTLZZ table (Paystub History)...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get table structure
    console.log('Table Columns:\n');
    console.log('=' .repeat(80));
    const columns = await connection.columns(null, 'PAYF', 'HISCTLZZ', null);
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME.padEnd(20)} ${col.TYPE_NAME.padEnd(20)} Size: ${col.COLUMN_SIZE}`);
    });
    console.log('=' .repeat(80));

    // Get total record count
    const count = await connection.query(`
      SELECT COUNT(*) as TOTAL FROM PAYF.HISCTLZZ
    `);
    console.log(`\n\nTotal records in HISCTLZZ: ${count[0].TOTAL}\n`);

    // Get a sample record
    console.log('Sample Record:\n');
    const sample = await connection.query(`
      SELECT * FROM PAYF.HISCTLZZ
      FETCH FIRST 1 ROW ONLY
    `);

    if (sample.length > 0) {
      Object.keys(sample[0]).forEach(key => {
        const value = sample[0][key];
        console.log(`${key.padEnd(20)} = ${value}`);
      });
    }

    // Try to find employee #2656 (we know they exist)
    console.log('\n\n🔍 Searching for employee #2656 records...\n');
    
    // Try different field names that might link to employee
    const possibleEmpFields = ['HCEM', 'HCQEM', 'HCEMP', 'HCEMPNO'];
    
    for (const field of possibleEmpFields) {
      try {
        const empRecords = await connection.query(`
          SELECT COUNT(*) as CNT FROM PAYF.HISCTLZZ
          WHERE ${field} = '2656'
        `);
        console.log(`  ${field}: ${empRecords[0].CNT} records`);
      } catch (err) {
        console.log(`  ${field}: Column doesn't exist`);
      }
    }

    // Also try with EMQEM (hidden ID)
    try {
      const empByHidden = await connection.query(`
        SELECT COUNT(*) as CNT FROM PAYF.HISCTLZZ
        WHERE HCQEM = -999992975
      `);
      console.log(`  HCQEM (hidden ID): ${empByHidden[0].CNT} records`);
    } catch (err) {
      console.log(`  HCQEM: Column doesn't exist or error`);
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function findPaystubsInHisctlzz(empNum) {
  try {
    console.log(`🔍 Finding paystubs in HISCTLZZ for employee #${empNum}...\n`);
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // First get employee's EMQEM
    const emp = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, EMQEM
      FROM PAYF.EMPMASZZ
      WHERE TRIM(EMEMP) = ?
    `, [empNum.toString()]);

    if (emp.length === 0) {
      console.log('❌ Employee not found');
      await connection.close();
      return;
    }

    const employee = emp[0];
    console.log(`Employee: ${employee.EMFNM?.trim()} ${employee.EMLNM?.trim()}`);
    console.log(`Employee #: ${employee.EMEMP}`);
    console.log(`Hidden ID: ${employee.EMQEM}\n`);

    // Now search HISCTLZZ - we'll try to find which field links
    console.log('Searching HISCTLZZ with different linking fields...\n');

    // Get a sample to see all column names
    const sample = await connection.query(`
      SELECT * FROM PAYF.HISCTLZZ FETCH FIRST 1 ROW ONLY
    `);

    if (sample.length > 0) {
      const columnNames = Object.keys(sample[0]);
      console.log('Available columns:', columnNames.join(', '), '\n');

      // Try each column that might contain employee ID
      for (const col of columnNames) {
        if (col.includes('EM') || col.includes('QEM')) {
          try {
            const result = await connection.query(`
              SELECT COUNT(*) as CNT FROM PAYF.HISCTLZZ
              WHERE ${col} = ?
            `, [employee.EMQEM]);

            if (result[0].CNT > 0) {
              console.log(`✅ Found ${result[0].CNT} records using ${col} = ${employee.EMQEM}`);
              
              // Get sample records
              const records = await connection.query(`
                SELECT * FROM PAYF.HISCTLZZ
                WHERE ${col} = ?
                ORDER BY HCRUN DESC
                FETCH FIRST 5 ROWS ONLY
              `, [employee.EMQEM]);

              console.log('\nSample records:\n');
              records.forEach((rec, i) => {
                console.log(`Record ${i + 1}:`);
                Object.keys(rec).forEach(key => {
                  if (rec[key] !== null && rec[key] !== '' && rec[key] !== 0) {
                    console.log(`  ${key}: ${rec[key]}`);
                  }
                });
                console.log('');
              });
              break;
            }
          } catch (err) {
            // Skip columns that cause errors
          }
        }
      }
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function getFullPaystubHistory() {
  try {
    console.log('🔍 Getting full paystub history for employee #2656...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get employee info
    const emp = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, EMQEM
      FROM PAYF.EMPMASZZ
      WHERE TRIM(EMEMP) = '2250'
    `);

    if (emp.length === 0) {
      console.log('❌ Employee not found');
      await connection.close();
      return;
    }

    const employee = emp[0];
    console.log(`Employee: ${employee.EMFNM?.trim()} ${employee.EMLNM?.trim()}`);
    console.log(`Employee #: ${employee.EMEMP}`);
    console.log(`Hidden ID (EMQEM): ${employee.EMQEM}\n`);

    // Get their paystub history
    const paystubs = await connection.query(`
      SELECT 
        HCCK# as checkNumber,
        HCCNT as netPay,
        HCCPY as grossPay,
        HCCDD as deductions,
        HCDAY as payDate,
        HCBEG as periodStart,
        HCEND as periodEnd,
        HCRUN as runDate,
        HCBK# as bank,
        HCOFF as office
      FROM PAYF.HISCTLZZ
      WHERE HCQEM = ?
      ORDER BY HCRUN DESC
    `, [employee.EMQEM]);

    console.log(`Found ${paystubs.length} paystubs:\n`);
    console.log('=' .repeat(100));

    paystubs.forEach((stub, i) => {
      const payDate = formatIBMDate(stub.payDate);
      const periodStart = formatIBMDate(stub.periodStart);
      const periodEnd = formatIBMDate(stub.periodEnd);
      const netPay = (stub.netPay / 100).toFixed(2);
      const grossPay = (stub.grossPay / 100).toFixed(2);
      const deductions = (stub.deductions / 100).toFixed(2);

      console.log(`${i + 1}. Check #${stub.checkNumber}`);
      console.log(`   Pay Date: ${payDate}`);
      console.log(`   Period: ${periodStart} - ${periodEnd}`);
      console.log(`   Gross Pay: $${grossPay}`);
      console.log(`   Deductions: $${deductions}`);
      console.log(`   Net Pay: $${netPay}`);
      console.log(`   Bank: ${stub.bank?.trim() || 'N/A'}`);
      console.log(`   Office: ${stub.office?.trim() || 'N/A'}`);
      console.log('');
    });

    console.log('=' .repeat(100));

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function formatIBMDate(ibmDate) {
  if (!ibmDate || ibmDate === 0) return 'N/A';
  const dateStr = ibmDate.toString().padStart(8, '0');
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${month}/${day}/${year}`;
}

async function debugPaystubData() {
  try {
    console.log('🔍 Debugging paystub data for employee #2656...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get employee info
    const emp = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, EMQEM
      FROM PAYF.EMPMASZZ
      WHERE TRIM(EMEMP) = '2656'
    `);

    const employee = emp[0];
    console.log(`Employee: ${employee.EMFNM?.trim()} ${employee.EMLNM?.trim()}`);
    console.log(`Employee #: ${employee.EMEMP}`);
    console.log(`Hidden ID (EMQEM): ${employee.EMQEM}\n`);

    // Get raw paystub data - ALL columns
    const paystubs = await connection.query(`
      SELECT *
      FROM PAYF.HISCTLZZ
      WHERE HCQEM = ?
      ORDER BY HCRUN DESC
      FETCH FIRST 3 ROWS ONLY
    `, [employee.EMQEM]);

    console.log(`Found ${paystubs.length} paystubs\n`);

    if (paystubs.length > 0) {
      console.log('RAW DATA FROM FIRST PAYSTUB:\n');
      console.log('=' .repeat(100));
      
      const firstStub = paystubs[0];
      
      // Show ALL fields with their actual values
      Object.keys(firstStub).forEach(key => {
        const value = firstStub[key];
        console.log(`${key.padEnd(20)} = ${value} (type: ${typeof value})`);
      });
      
      console.log('\n' + '=' .repeat(100));
      
      // Now show which fields have actual data
      console.log('\n\n📊 FIELDS WITH DATA:\n');
      Object.keys(firstStub).forEach(key => {
        const value = firstStub[key];
        if (value !== null && value !== '' && value !== 0 && value !== undefined) {
          console.log(`${key.padEnd(20)} = ${value}`);
        }
      });
    } else {
      console.log('❌ No paystubs found. Let me check if HCQEM is correct...\n');
      
      // Double-check what HCQEM values exist
      const sample = await connection.query(`
        SELECT DISTINCT HCQEM 
        FROM PAYF.HISCTLZZ 
        ORDER BY HCQEM DESC
        FETCH FIRST 10 ROWS ONLY
      `);
      
      console.log('Sample HCQEM values in HISCTLZZ:');
      sample.forEach(row => {
        console.log(`  ${row.HCQEM}`);
      });
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

async function getLoginFor2656() {
  try {
    console.log('🔐 Getting login for employee #2656...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    const result = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#", EMQEM
      FROM PAYF.EMPMASZZ
      WHERE TRIM(EMEMP) = '360'
    `);

    if (result.length === 0) {
      console.log('❌ Employee not found');
      await connection.close();
      return;
    }

    const emp = result[0];
    const ssn = emp['EMSS#']?.toString() || '';
    const last4 = ssn.slice(-4).padStart(4, '0');
    const empNum = typeof emp.EMEMP === 'string' ? emp.EMEMP.trim() : emp.EMEMP;

    console.log('✅ LOGIN CREDENTIALS:\n');
    console.log('═'.repeat(50));
    console.log(`Name: ${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()}`);
    console.log(`Employee Number: ${empNum}`);
    console.log(`Last 4 of SSN: ${last4}`);
    console.log(`Hidden ID: ${emp.EMQEM}`);
    console.log('═'.repeat(50));

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function debugLogin2656() {
  try {
    console.log('🔍 Debugging login for employee #2656...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get the employee record
    const emp = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#", EMQEM
      FROM PAYF.EMPMASZZ
      WHERE TRIM(EMEMP) = '2656'
    `);

    if (emp.length === 0) {
      console.log('❌ Employee not found');
      await connection.close();
      return;
    }

    const employee = emp[0];
    const ssn = employee['EMSS#'];
    const ssnString = ssn?.toString() || '';
    const last4 = ssnString.slice(-4);

    console.log('Employee Data:');
    console.log(`  Name: ${employee.EMFNM?.trim()} ${employee.EMLNM?.trim()}`);
    console.log(`  EMEMP (raw): "${employee.EMEMP}" (type: ${typeof employee.EMEMP})`);
    console.log(`  EMSS# (raw): ${ssn} (type: ${typeof ssn})`);
    console.log(`  SSN string: "${ssnString}"`);
    console.log(`  Last 4: "${last4}"`);
    console.log(`  EMQEM: ${employee.EMQEM}\n`);

    // Test the authentication query that's actually being used
    console.log('Testing authentication query...\n');
    
    const empNum = '2656';
    const testSSN = '1211';
    const cleanSSN = testSSN.replace(/\D/g, '');

    console.log(`Input values:`);
    console.log(`  Employee Number: "${empNum}"`);
    console.log(`  SSN entered: "${testSSN}"`);
    console.log(`  Clean SSN: "${cleanSSN}"`);
    console.log(`  parseInt(cleanSSN): ${parseInt(cleanSSN)}\n`);

    // Try the MOD approach (current implementation)
    console.log('Method 1: MOD approach');
    const modResult = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#"
      FROM PAYF.EMPMASZZ
      WHERE TRIM(EMEMP) = ?
      AND MOD("EMSS#", 10000) = ?
    `, [empNum, parseInt(cleanSSN)]);
    console.log(`  Result: ${modResult.length > 0 ? '✅ MATCH' : '❌ NO MATCH'}`);
    if (modResult.length > 0) {
      console.log(`  SSN in DB: ${modResult[0]['EMSS#']}, MOD result: ${modResult[0]['EMSS#'] % 10000}`);
    }

    // Try string comparison
    console.log('\nMethod 2: String RIGHT() approach');
    const rightResult = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#"
      FROM PAYF.EMPMASZZ
      WHERE TRIM(EMEMP) = ?
      AND RIGHT(CAST("EMSS#" AS CHAR(20)), 4) = ?
    `, [empNum, cleanSSN]);
    console.log(`  Result: ${rightResult.length > 0 ? '✅ MATCH' : '❌ NO MATCH'}`);

    // Try direct comparison with full SSN
    console.log('\nMethod 3: Try with full SSN if you know it');
    console.log(`  Full SSN in DB: ${ssn}`);
    console.log(`  To test full SSN auth, the database SSN is: ${ssnString}`);

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function compareEmployeeSSNs() {
  try {
    console.log('🔍 Comparing SSN data for working vs non-working employees...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get employee #2656 (not working)
    const emp2656 = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#", EMQEM
      FROM PAYF.EMPMASZZ
      WHERE TRIM(EMEMP) = '2656'
    `);

    // Get a few other employees (that work)
    const otherEmps = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, "EMSS#", EMQEM
      FROM PAYF.EMPMASZZ
      WHERE EMDLT <> 'D' AND EMDOT = 0
      AND TRIM(EMEMP) <> '2656'
      FETCH FIRST 5 ROWS ONLY
    `);

    console.log('Employee #2656 (NOT WORKING):');
    console.log('═'.repeat(80));
    if (emp2656.length > 0) {
      const e = emp2656[0];
      const ssn = e['EMSS#'];
      console.log(`  Employee #: ${e.EMEMP}`);
      console.log(`  Name: ${e.EMFNM?.trim()} ${e.EMLNM?.trim()}`);
      console.log(`  EMSS# (raw): ${ssn}`);
      console.log(`  EMSS# (type): ${typeof ssn}`);
      console.log(`  EMSS# (string): "${ssn?.toString()}"`);
      console.log(`  Length: ${ssn?.toString().length}`);
      console.log(`  Last 4: "${ssn?.toString().slice(-4)}"`);
      console.log(`  Is NULL: ${ssn === null}`);
      console.log(`  Is 0: ${ssn === 0}`);
      console.log(`  MOD 10000: ${ssn ? (ssn % 10000) : 'N/A'}`);
    }

    console.log('\n\nOther Employees (WORKING):');
    console.log('═'.repeat(80));
    otherEmps.forEach((e, i) => {
      const ssn = e['EMSS#'];
      const empNum = typeof e.EMEMP === 'string' ? e.EMEMP.trim() : e.EMEMP;
      console.log(`\n${i + 1}. Employee #${empNum}`);
      console.log(`  Name: ${e.EMFNM?.trim()} ${e.EMLNM?.trim()}`);
      console.log(`  EMSS# (raw): ${ssn}`);
      console.log(`  EMSS# (type): ${typeof ssn}`);
      console.log(`  Length: ${ssn?.toString().length}`);
      console.log(`  Last 4: "${ssn?.toString().slice(-4)}"`);
      console.log(`  MOD 10000: ${ssn ? (ssn % 10000) : 'N/A'}`);
    });

    console.log('\n\n🔍 Analysis:');
    console.log('═'.repeat(80));
    
    const ssn2656 = emp2656[0]?.[' EMSS#'];
    const workingSSN = otherEmps[0]?.['EMSS#'];
    
    if (ssn2656 === null || ssn2656 === 0) {
      console.log('❌ Employee #2656 has NULL or 0 SSN - cannot authenticate!');
      console.log('   Solution: Update their SSN in the database or contact HR');
    } else if (ssn2656?.toString().length !== 9) {
      console.log(`⚠️  Employee #2656 SSN length is ${ssn2656?.toString().length}, not 9 digits`);
      console.log('   This might cause authentication issues');
    } else {
      console.log('✅ Employee #2656 SSN appears valid');
      console.log('   The issue might be in the authentication code');
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testWithoutAliases() {
  try {
    console.log('🔍 Testing WITHOUT column aliases...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    const emp = await connection.query(`
      SELECT EMEMP, EMFNM, EMLNM, EMQEM
      FROM PAYF.EMPMASZZ
      WHERE EMDLT <> 'D' AND EMDOT = 0
      FETCH FIRST 1 ROW ONLY
    `);

    const employee = emp[0];
    const empNum = typeof employee.EMEMP === 'string' ? employee.EMEMP.trim() : employee.EMEMP;
    
    console.log(`Employee #: ${empNum}`);
    console.log(`Hidden ID: ${employee.EMQEM}\n`);

    // Query WITHOUT aliases - use raw column names
    const paystubs = await connection.query(`
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
      FETCH FIRST 5 ROWS ONLY
    `, [employee.EMQEM]);

    console.log(`Found ${paystubs.length} paystubs\n`);

    if (paystubs.length > 0) {
      console.log('RAW DATA (without aliases):\n');
      
      paystubs.forEach((stub, i) => {
        console.log(`\nPaystub ${i + 1}:`);
        console.log(`  HCCK#: ${stub['HCCK#']}`);
        console.log(`  HCCNT: ${stub.HCCNT}`);
        console.log(`  HCCPY: ${stub.HCCPY}`);
        console.log(`  HCCDD: ${stub.HCCDD}`);
        console.log(`  HCDAY: ${stub.HCDAY}`);
        console.log(`  HCBEG: ${stub.HCBEG}`);
        console.log(`  HCEND: ${stub.HCEND}`);
        console.log(`  HCBK#: "${stub['HCBK#']}"`);
        console.log(`  HCOFF: "${stub.HCOFF}"`);
      });
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===========================================
// W-2 EXPLORATION FUNCTIONS
// ===========================================

async function findW2Tables() {
  try {
    console.log('🔍 Searching for W-2 related tables across all accessible libraries...\n');
    const connection = await odbc.connect(getConnectionString());

    // Search QSYS2 catalog for anything W-2 related
    const result = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TEXT
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME LIKE '%W2%'
         OR TABLE_NAME LIKE '%TAX%'
         OR TABLE_NAME LIKE '%WAGE%'
         OR TABLE_NAME LIKE '%1099%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    console.log(`Found ${result.length} potential W-2 / tax tables in catalog:\n`);
    console.log('='.repeat(70));
    result.forEach(t => {
      console.log(`  ${t.TABLE_SCHEMA.padEnd(15)} ${t.TABLE_NAME.padEnd(25)} ${t.TABLE_TEXT || ''}`);
    });
    console.log('='.repeat(70));

    await connection.close();

    // Now probe the most common Triadic W-2 table names directly
    console.log('\n\n📋 Testing common Triadic W-2 table locations...\n');
    console.log('='.repeat(70));

    // Names confirmed via QSYS2.SYSTABLES catalog scan — W2ADJ* is the Triadic W-2 pattern
    const candidates = [
      { lib: 'PAYF',   table: 'W2ADJZZ',    desc: 'W-2 adjustment file (ZZ - primary)' },
      { lib: 'PAYF',   table: 'W2ADJA',     desc: 'W-2 adjustment by emp/code#' },
      { lib: 'PAYF',   table: 'W2ADJB',     desc: 'W-2 adjustment joined by employee' },
      { lib: 'PAYF',   table: 'W2REPORT',   desc: 'W-2 report/diskette file' },
      { lib: 'PAYF',   table: 'W2REPORT21', desc: 'W-2 report file (2021+)' },
      { lib: 'MHPAYF', table: 'W2ADJZZ',    desc: 'W-2 adjustment (MHPAYF)' },
      { lib: 'PAYF19', table: 'W2ADJZZ',    desc: 'W-2 adjustment (PAYF19)' },
      { lib: 'PAYF20', table: 'W2ADJZZ',    desc: 'W-2 adjustment (PAYF20)' },
      { lib: 'ENPAYF', table: 'W2ADJZZ',    desc: 'W-2 adjustment (ENPAYF)' },
    ];

    const found = [];

    for (const c of candidates) {
      try {
        const conn = await odbc.connect(getConnectionString(c.lib));
        const cnt = await conn.query(`SELECT COUNT(*) as CNT FROM ${c.lib}.${c.table}`);
        console.log(`✅ ${c.lib}.${c.table.padEnd(15)} ${cnt[0].CNT.toString().padEnd(10)} records  — ${c.desc}`);
        found.push({ ...c, records: cnt[0].CNT });
        await conn.close();
      } catch {
        console.log(`❌ ${c.lib}.${c.table.padEnd(15)} Not accessible`);
      }
    }

    console.log('='.repeat(70));

    if (found.length === 0) {
      console.log('\n⚠️  No W-2 tables found under common names.');
      console.log('   Run findW2Tables() to see the full catalog list above,');
      console.log('   then try exploreW2Table(\'LIBNAME\', \'TABLENAME\') with whatever was found.');
      return;
    }

    console.log(`\n✅ Found ${found.length} accessible W-2 table(s)!\n`);
    found.forEach(t => console.log(`   • ${t.lib}.${t.table} (${t.records} records) — ${t.desc}`));

    // Auto-explore the first one with data
    const withData = found.find(t => t.records > 0);
    if (withData) {
      console.log(`\n\n🔬 Auto-exploring ${withData.lib}.${withData.table}...\n`);
      await exploreW2Table(withData.lib, withData.table);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function exploreW2Table(library, tableName) {
  try {
    console.log(`📋 Exploring ${library}.${tableName}...\n`);
    const connection = await odbc.connect(getConnectionString(library));

    // Column list
    console.log('Columns:\n');
    console.log('='.repeat(60));
    const cols = await connection.columns(null, library, tableName, null);
    cols.forEach(col => {
      console.log(`  ${col.COLUMN_NAME.padEnd(20)} ${col.TYPE_NAME.padEnd(15)} (${col.COLUMN_SIZE})`);
    });
    console.log('='.repeat(60));

    // Sample record — all non-empty fields
    console.log('\n\nSample record (non-empty fields only):\n');
    const sample = await connection.query(`SELECT * FROM ${library}.${tableName} FETCH FIRST 1 ROW ONLY`);
    if (sample.length > 0) {
      Object.entries(sample[0]).forEach(([k, v]) => {
        if (v !== null && v !== '' && v !== 0) {
          console.log(`  ${k.padEnd(20)} = ${v}`);
        }
      });
    }

    // Look for year field and employee link field
    const colNames = cols.map(c => c.COLUMN_NAME);
    const yearFields = colNames.filter(c => c.includes('YR') || c.includes('YEAR') || c.includes('TAX'));
    const empFields  = colNames.filter(c => c.includes('QEM') || c.includes('EMP') || c.includes('SSN'));

    console.log('\n\n🔑 Key fields detected:');
    console.log(`  Year-related:     ${yearFields.length ? yearFields.join(', ') : '(none found)'}`);
    console.log(`  Employee-related: ${empFields.length  ? empFields.join(', ')  : '(none found)'}`);

    // If there's a QEM field, try to link to employee #360 as a test
    const qemField = colNames.find(c => c.includes('QEM'));
    if (qemField) {
      console.log(`\n\n🔗 Testing employee link via ${qemField} using emp #360...\n`);
      const empConn = await odbc.connect(getConnectionString(config.libraryEmployee));
      const empRow = await empConn.query(
        `SELECT EMQEM FROM ${config.libraryEmployee}.${config.tableEmployee} WHERE TRIM(EMEMP) = '360' FETCH FIRST 1 ROW ONLY`
      );
      await empConn.close();

      if (empRow.length > 0) {
        const emqem = empRow[0].EMQEM;
        const w2rows = await connection.query(
          `SELECT * FROM ${library}.${tableName} WHERE ${qemField} = ? FETCH FIRST 5 ROWS ONLY`,
          [emqem]
        );
        console.log(`  Employee #360 EMQEM: ${emqem}`);
        console.log(`  W-2 rows found:      ${w2rows.length}`);
        if (w2rows.length > 0) {
          console.log('\n  ✅ W-2 data linked successfully! First row:\n');
          Object.entries(w2rows[0]).forEach(([k, v]) => {
            if (v !== null && v !== '' && v !== 0) {
              console.log(`    ${k.padEnd(20)} = ${v}`);
            }
          });
        } else {
          console.log('  ⚠️  No W-2 rows for emp #360 (they may not have one yet — try another employee)');
        }
      }
    }

    // Show distinct years available
    const yearField = yearFields[0];
    if (yearField) {
      const years = await connection.query(
        `SELECT DISTINCT ${yearField} FROM ${library}.${tableName} ORDER BY ${yearField} DESC FETCH FIRST 10 ROWS ONLY`
      );
      console.log(`\n\n📅 Tax years available (${yearField}):`);
      years.forEach(r => console.log(`   ${r[yearField]}`));
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function scanPAYFW2Tables() {
  try {
    console.log('🔍 Scanning ALL W2* tables in PAYF library (Luna County only)...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    const result = await connection.query(`
      SELECT TABLE_NAME, TABLE_TEXT
      FROM QSYS2.SYSTABLES
      WHERE TABLE_SCHEMA = 'PAYF'
        AND TABLE_NAME LIKE '%W2%'
      ORDER BY TABLE_NAME
    `);

    console.log(`Found ${result.length} W2* table(s) in PAYF:\n`);
    console.log('='.repeat(60));
    result.forEach(t => console.log(`  ${t.TABLE_NAME.padEnd(25)} ${t.TABLE_TEXT || ''}`));
    console.log('='.repeat(60));

    // Check record count and tax year for each
    console.log('\n📋 Record counts and tax years:\n');
    for (const t of result) {
      try {
        const cnt = await connection.query(`SELECT COUNT(*) as CNT FROM PAYF.${t.TABLE_NAME}`);
        const total = cnt[0].CNT;
        if (total === 0) { console.log(`  ${t.TABLE_NAME.padEnd(25)} 0 records`); continue; }

        let yearInfo = '';
        try {
          const re = await connection.query(
            `SELECT DISTINCT SUBSTR(DATAD, 3, 4) AS YR FROM PAYF.${t.TABLE_NAME} WHERE SUBSTR(DATAD, 1, 2) = 'RE' FETCH FIRST 5 ROWS ONLY`
          );
          if (re.length > 0) yearInfo = `  tax years: ${re.map(r => r.YR).join(', ')}`;
        } catch { /* no DATAD column */ }

        console.log(`  ✅ ${t.TABLE_NAME.padEnd(25)} ${total.toString().padEnd(8)} records${yearInfo}`);
      } catch (e) {
        console.log(`  ❌ ${t.TABLE_NAME.padEnd(25)} error: ${e.message}`);
      }
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function scanLibraryW2Tables(library) {
  try {
    console.log(`🔍 Scanning ALL W2* tables in ${library}...\n`);
    const connection = await odbc.connect(getConnectionString(library));

    const result = await connection.query(`
      SELECT TABLE_NAME, TABLE_TEXT
      FROM QSYS2.SYSTABLES
      WHERE TABLE_SCHEMA = '${library}'
        AND TABLE_NAME LIKE '%W2%'
      ORDER BY TABLE_NAME
    `);

    console.log(`Found ${result.length} W2* table(s) in ${library}:\n`);
    console.log('='.repeat(60));
    result.forEach(t => console.log(`  ${t.TABLE_NAME.padEnd(25)} ${t.TABLE_TEXT || ''}`));
    console.log('='.repeat(60));

    console.log('\n📋 Record counts and tax years:\n');
    for (const t of result) {
      try {
        const cnt = await connection.query(`SELECT COUNT(*) as CNT FROM ${library}.${t.TABLE_NAME}`);
        const total = cnt[0].CNT;
        if (total === 0) { console.log(`  ${t.TABLE_NAME.padEnd(25)} 0 records`); continue; }

        let yearInfo = '';
        try {
          const re = await connection.query(
            `SELECT DISTINCT SUBSTR(DATAD, 3, 4) AS YR FROM ${library}.${t.TABLE_NAME} WHERE SUBSTR(DATAD, 1, 2) = 'RE' FETCH FIRST 5 ROWS ONLY`
          );
          if (re.length > 0) yearInfo = `  tax years: ${re.map(r => r.YR).join(', ')}`;
        } catch { /* no DATAD column */ }

        console.log(`  ✅ ${t.TABLE_NAME.padEnd(25)} ${total.toString().padEnd(8)} records${yearInfo}`);
      } catch (e) {
        console.log(`  ❌ ${t.TABLE_NAME.padEnd(25)} error: ${e.message}`);
      }
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function scanPAYF19W2Tables() {
  try {
    console.log('🔍 Scanning ALL W2* tables in PAYF19 library (Luna County archive)...\n');
    const connection = await odbc.connect(getConnectionString('PAYF19'));

    const result = await connection.query(`
      SELECT TABLE_NAME, TABLE_TEXT
      FROM QSYS2.SYSTABLES
      WHERE TABLE_SCHEMA = 'PAYF19'
        AND TABLE_NAME LIKE '%W2%'
      ORDER BY TABLE_NAME
    `);

    console.log(`Found ${result.length} W2* table(s) in PAYF19:\n`);
    console.log('='.repeat(60));
    result.forEach(t => console.log(`  ${t.TABLE_NAME.padEnd(25)} ${t.TABLE_TEXT || ''}`));
    console.log('='.repeat(60));

    console.log('\n📋 Record counts and tax years:\n');
    for (const t of result) {
      try {
        const cnt = await connection.query(`SELECT COUNT(*) as CNT FROM PAYF19.${t.TABLE_NAME}`);
        const total = cnt[0].CNT;
        if (total === 0) { console.log(`  ${t.TABLE_NAME.padEnd(25)} 0 records`); continue; }

        let yearInfo = '';
        try {
          const re = await connection.query(
            `SELECT DISTINCT SUBSTR(DATAD, 3, 4) AS YR FROM PAYF19.${t.TABLE_NAME} WHERE SUBSTR(DATAD, 1, 2) = 'RE' FETCH FIRST 5 ROWS ONLY`
          );
          if (re.length > 0) yearInfo = `  tax years: ${re.map(r => r.YR).join(', ')}`;
        } catch { /* no DATAD column */ }

        console.log(`  ✅ ${t.TABLE_NAME.padEnd(25)} ${total.toString().padEnd(8)} records${yearInfo}`);
      } catch (e) {
        console.log(`  ❌ ${t.TABLE_NAME.padEnd(25)} error: ${e.message}`);
      }
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function scanAllW2ReportTables() {
  try {
    console.log('🔍 Scanning QSYS2 catalog for ALL W2REPORT* tables across all libraries...\n');
    const connection = await odbc.connect(getConnectionString());

    const result = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TEXT
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME LIKE 'W2REPORT%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);

    console.log(`Found ${result.length} W2REPORT* table(s):\n`);
    console.log('='.repeat(70));
    result.forEach(t => {
      console.log(`  ${t.TABLE_SCHEMA.padEnd(15)} ${t.TABLE_NAME.padEnd(25)} ${t.TABLE_TEXT || ''}`);
    });
    console.log('='.repeat(70));
    await connection.close();

    // Probe each one for record count and tax year
    console.log('\n📋 Checking record counts and tax years...\n');
    for (const t of result) {
      try {
        const conn = await odbc.connect(getConnectionString(t.TABLE_SCHEMA));
        const cnt = await conn.query(`SELECT COUNT(*) as CNT FROM ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`);
        const total = cnt[0].CNT;

        // Check tax year from RE (employer) records
        let yearInfo = '';
        try {
          const re = await conn.query(
            `SELECT DISTINCT SUBSTR(DATAD, 3, 4) AS YR FROM ${t.TABLE_SCHEMA}.${t.TABLE_NAME} WHERE SUBSTR(DATAD, 1, 2) = 'RE' FETCH FIRST 10 ROWS ONLY`
          );
          if (re.length > 0) yearInfo = `  tax years: ${re.map(r => r.YR).join(', ')}`;
        } catch { /* no DATAD column */ }

        console.log(`  ✅ ${t.TABLE_SCHEMA}.${t.TABLE_NAME.padEnd(20)} ${total.toString().padEnd(8)} records${yearInfo}`);
        await conn.close();
      } catch {
        console.log(`  ❌ ${t.TABLE_SCHEMA}.${t.TABLE_NAME.padEnd(20)} not accessible`);
      }
    }

    console.log('\n💡 Use exploreW2Table(\'LIBRARY\', \'TABLENAME\') to inspect any of these.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function parseW2Table(library, tableName) {
  try {
    console.log(`📄 Parsing ${library}.${tableName} EFW2 records...\n`);
    const connection = await odbc.connect(getConnectionString(library));

    const all = await connection.query(`SELECT DATAD FROM ${library}.${tableName}`);
    console.log(`Total records: ${all.length}`);

    const typeCounts = {};
    all.forEach(r => {
      const t = (r.DATAD || '').substring(0, 2).trim();
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    console.log('Record types:');
    Object.entries(typeCounts).forEach(([t, n]) => console.log(`  ${t.padEnd(4)} = ${n}`));

    const rwRecords = all.filter(r => (r.DATAD || '').startsWith('RW'));
    console.log(`\n📋 Showing first 5 of ${rwRecords.length} employee (RW) records:\n`);

    const parseCents = (str) => {
      const n = parseInt((str || '').trim(), 10);
      return isNaN(n) ? 0 : n / 100;
    };
    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    rwRecords.slice(0, 5).forEach((r, i) => {
      const d = r.DATAD || '';
      const ssn   = d.substring(2, 11).trim();
      const first = d.substring(11, 26).trim();
      const middle = d.substring(26, 41).trim();
      const last  = d.substring(41, 61).trim();
      const mi    = middle ? ` ${middle[0]}.` : '';

      const box1 = parseCents(d.substring(187, 198));
      const box2 = parseCents(d.substring(198, 209));
      const box3 = parseCents(d.substring(209, 220));
      const box4 = parseCents(d.substring(220, 231));
      const box5 = parseCents(d.substring(231, 242));
      const box6 = parseCents(d.substring(242, 253));

      console.log(`\nRecord ${i + 1}: ${first}${mi} ${last}  (SSN last 4: ${ssn.slice(-4)})`);
      console.log(`  Box 1  Wages:               ${fmt(box1)}`);
      console.log(`  Box 2  Fed tax withheld:     ${fmt(box2)}`);
      console.log(`  Box 3  SS wages:             ${fmt(box3)}`);
      console.log(`  Box 4  SS tax:               ${fmt(box4)}`);
      console.log(`  Box 5  Medicare wages:       ${fmt(box5)}`);
      console.log(`  Box 6  Medicare tax:         ${fmt(box6)}`);
    });

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function parseW2Report21() {
  try {
    console.log('📄 Parsing W2REPORT21 EFW2 records...\n');
    const connection = await odbc.connect(getConnectionString('PAYF'));

    // Get all records
    const all = await connection.query(`SELECT DATAD FROM PAYF.W2REPORT21`);
    console.log(`Total records: ${all.length}\n`);

    // Tally record types
    const typeCounts = {};
    all.forEach(r => {
      const t = r.DATAD.substring(0, 2).trim();
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    console.log('Record types found:');
    Object.entries(typeCounts).forEach(([t, n]) => console.log(`  ${t.padEnd(4)} = ${n} records`));

    // Pull RW records (employee wage records)
    const rwRecords = all.filter(r => r.DATAD.startsWith('RW'));
    console.log(`\n\nEmployee (RW) records: ${rwRecords.length}\n`);

    if (rwRecords.length === 0) {
      console.log('No RW records found — W-2 employee data may use a different record code.');
      // Show first 5 non-RA records raw to identify the format
      const others = all.filter(r => !r.DATAD.startsWith('RA')).slice(0, 5);
      console.log('\nFirst 5 non-RA records (raw):\n');
      others.forEach((r, i) => console.log(`${i + 1}. [${r.DATAD.substring(0, 100)}...]`));
      await connection.close();
      return;
    }

    // Print first 3 RW records raw so we can identify field positions
    console.log('First 3 RW records (raw — 120 chars each):\n');
    rwRecords.slice(0, 3).forEach((r, i) => {
      console.log(`${i + 1}. [${r.DATAD.substring(0, 120)}]`);
    });

    // Try to parse using SSA EFW2 specification positions (1-indexed, converted to 0-indexed)
    // RW record layout (SSA Publication 42-007):
    //   1-2:   Record type "RW"
    //   3-11:  Employee SSN (9 digits)
    //   12-26: First name
    //   27:    Middle initial
    //   28-47: Last name (20 chars)
    //   Wage amounts are right-justified, zero-padded, in CENTS, 11 chars each:
    //   275-285: Box 1  - Wages, tips, other comp
    //   286-296: Box 2  - Federal income tax withheld
    //   297-307: Box 3  - Social Security wages
    //   308-318: Box 4  - Social Security tax withheld
    //   319-329: Box 5  - Medicare wages
    //   330-340: Box 6  - Medicare tax withheld
    //   389-399: Box 16 - State wages
    //   400-410: Box 17 - State income tax withheld
    // NOTE: these positions are approximations — the raw output above will help verify

    console.log('\n\n🔬 Attempting to parse wage fields (SSA EFW2 positions):\n');
    console.log('='.repeat(90));

    const parseCents = (str) => {
      const n = parseInt(str.trim(), 10);
      return isNaN(n) ? null : n / 100;
    };

    const fmt = (n) => n == null ? '(empty)' :
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    rwRecords.slice(0, 5).forEach((r, i) => {
      const d = r.DATAD;
      const ssn    = d.substring(2, 11).trim();
      const first  = d.substring(11, 26).trim();
      const middle = d.substring(26, 41).trim();   // 15-char middle name (EFW2 2016+)
      const last   = d.substring(41, 61).trim();   // 20-char last name

      // SSA EFW2 2021 wage field positions (0-indexed, 11 chars each, value in cents)
      // Reference: SSA Pub 42-007, RW record positions 188-253 (1-indexed)
      const box1  = parseCents(d.substring(187, 198));  // Wages, tips, other comp
      const box2  = parseCents(d.substring(198, 209));  // Federal income tax withheld
      const box3  = parseCents(d.substring(209, 220));  // Social Security wages
      const box4  = parseCents(d.substring(220, 231));  // Social Security tax
      const box5  = parseCents(d.substring(231, 242));  // Medicare wages
      const box6  = parseCents(d.substring(242, 253));  // Medicare tax withheld
      // Box 16/17 (state wages/tax) are in RS records, not RW — skipping for now

      const last4ssn = ssn.slice(-4);
      const mi = middle ? middle[0] + '.' : '';

      console.log(`\nRecord ${i + 1}: ${first} ${mi} ${last}  (SSN last 4: ${last4ssn})`);
      console.log(`  Box 1  Wages:               ${fmt(box1)}`);
      console.log(`  Box 2  Fed tax withheld:     ${fmt(box2)}`);
      console.log(`  Box 3  SS wages:             ${fmt(box3)}`);
      console.log(`  Box 4  SS tax:               ${fmt(box4)}`);
      console.log(`  Box 5  Medicare wages:       ${fmt(box5)}`);
      console.log(`  Box 6  Medicare tax:         ${fmt(box6)}`);
    });

    console.log('\n='.repeat(90));
    console.log('\n💡 If wage values look wrong (all $0 or garbage), the positions need adjusting.');
    console.log('   Check the raw records above and count character positions manually.');

    // Show distinct years from RE (employer) records
    const reRecords = all.filter(r => r.DATAD.startsWith('RE'));
    if (reRecords.length > 0) {
      console.log('\n\n📅 Tax years found in RE (employer) records:');
      reRecords.forEach(r => {
        const yr = r.DATAD.substring(2, 6).trim();
        console.log(`   ${yr}`);
      });
    }

    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function getW2ForEmployee(empNum, taxYear = null) {
  try {
    const yearLabel = taxYear ? `tax year ${taxYear}` : 'all years';
    console.log(`📄 Looking up W-2 data for employee #${empNum} (${yearLabel})...\n`);

    const connection = await odbc.connect(getConnectionString(config.libraryEmployee));

    // Get employee's hidden ID
    const empRow = await connection.query(
      `SELECT EMEMP, EMFNM, EMLNM, EMQEM FROM ${config.libraryEmployee}.${config.tableEmployee} WHERE TRIM(EMEMP) = ? FETCH FIRST 1 ROW ONLY`,
      [empNum.toString()]
    );
    await connection.close();

    if (empRow.length === 0) {
      console.log('❌ Employee not found');
      return;
    }

    const emp = empRow[0];
    console.log(`Employee: ${emp.EMFNM?.trim()} ${emp.EMLNM?.trim()}`);
    console.log(`Hidden ID (EMQEM): ${emp.EMQEM}\n`);

    // Try each known W-2 table location (confirmed from QSYS2 catalog)
    const candidates = [
      { lib: 'PAYF',   table: 'W2ADJZZ'    },
      { lib: 'PAYF',   table: 'W2ADJA'     },
      { lib: 'PAYF',   table: 'W2ADJB'     },
      { lib: 'PAYF',   table: 'W2REPORT'   },
      { lib: 'PAYF',   table: 'W2REPORT21' },
      { lib: 'MHPAYF', table: 'W2ADJZZ'   },
      { lib: 'ENPAYF', table: 'W2ADJZZ'   },
    ];

    let found = false;

    for (const c of candidates) {
      try {
        const w2Conn = await odbc.connect(getConnectionString(c.lib));

        // Figure out QEM field name for this table
        const cols = await w2Conn.columns(null, c.lib, c.table, null);
        const qemField = cols.map(col => col.COLUMN_NAME).find(n => n.includes('QEM'));

        if (!qemField) {
          await w2Conn.close();
          continue;
        }

        const yearField = cols.map(col => col.COLUMN_NAME).find(n => n.includes('YR') || n.includes('YEAR'));

        let query = `SELECT * FROM ${c.lib}.${c.table} WHERE ${qemField} = ?`;
        const params = [emp.EMQEM];

        if (taxYear && yearField) {
          query += ` AND ${yearField} = ?`;
          params.push(taxYear);
        }

        query += ` ORDER BY ${yearField || qemField} DESC FETCH FIRST 10 ROWS ONLY`;

        const rows = await w2Conn.query(query, params);
        await w2Conn.close();

        if (rows.length > 0) {
          found = true;
          console.log(`✅ Found ${rows.length} W-2 record(s) in ${c.lib}.${c.table}\n`);
          console.log('='.repeat(60));
          rows.forEach((row, i) => {
            console.log(`\nW-2 Record ${i + 1}:`);
            Object.entries(row).forEach(([k, v]) => {
              if (v !== null && v !== '' && v !== 0) {
                console.log(`  ${k.padEnd(20)} = ${v}`);
              }
            });
          });
          console.log('='.repeat(60));
          console.log(`\n📝 Table: ${c.lib}.${c.table}  |  Link field: ${qemField}  |  Year field: ${yearField || '(unknown)'}`);
          break;
        }
      } catch {
        // Table doesn't exist or no access — try next
      }
    }

    if (!found) {
      console.log('⚠️  No W-2 records found for this employee in any known table.');
      console.log('   Run findW2Tables() first to discover where W-2 data lives on this system.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// ===========================================
// MAIN - Choose what to run
// ===========================================

// Uncomment the function you want to run:

//findCompleteEmployee();           // Find employees with complete data
//getTestLogins();                // Get list of test login credentials
// testAuth(37, '9210');           // Test specific login credentials
// findEmployeeTables();           // Find all employee-related tables
// findPayrollTables();            // Find all payroll-related tables
// findAllLibraries();             // List all accessible libraries
// explorePaystubTable();          // Explore PAYNETZZ table structure
// findPaystubsForEmployee(37);    // Find paystubs for specific employee

// NEW PAYSTUB ACCESS FUNCTIONS:
//testPaystubAccess();                 // Quick test of common paystub tables
// findAccessiblePayTables();        // Comprehensive search for ALL accessible pay tables

//findHiddenIdMapping();              // Find how employee # maps to hidden ID
//explorePayfPaynetzz();              // Explore PAYF.PAYNETZZ structure
// findPaystubsForTestEmployee();   // Find paystubs for a test employee

//verifyHiddenIdFormula();            // Verify the hidden ID formula
//reverseEngineerFormula();           // Reverse engineer the formula

//testDirectEmqemLink();              // Test direct EMQEM → PNQEM link
//findEmployeesWithPaystubs();        // Find employees who have paystubs

getLoginForEmployee('360');         // Get login credentials for a specific employee

// W-2 FUNCTIONS:
//findW2Tables();                        // Discover W-2 tables — already confirmed accessible
//exploreW2Table('PAYF', 'W2REPORT21');  // raw column dump
//parseW2Report21();                     // parse EFW2 records — decode employee W-2 boxes
//exploreW2Table('PAYF', 'W2ADJZZ');    // W2ADJZZ = adjustments only (38 records)
//getW2ForEmployee('360');               // Get all W-2 records for employee #360
//getW2ForEmployee('360', 2024);         // Get W-2 for employee #360 for a specific tax year
//scanAllW2ReportTables();                // Find ALL W2REPORT* tables across ALL libraries
//exploreW2Table('PAYF27', 'W2REPORT');   // De Baca County — different county
//exploreW2Table('PAYF09', 'W2REPORT2');  // Colfax County (county code 09) — confirmed
//exploreW2Table('PAYF21', 'W2REPORTDK'); // 432 records — unknown
//scanPAYFW2Tables();                     // Find all W2 tables in PAYF library only (Luna County)
//scanPAYF19W2Tables();                   // Find all W2 tables in PAYF19 (Luna County archive)
//scanLibraryW2Tables('PAYF09');          // Scan Colfax County W2 tables
//parseW2Table('PAYF09', 'W2REPORT2');    // Parse Colfax County 2019 W2s — verified ✅
//scanLibraryW2Tables('PAYF05');            // Scan Curry County W2 tables

//exploreHisctlzz();                  // Explore HISCTLZZ structure
//findPaystubsInHisctlzz('2656');  // Find paystubs for employee #2656

//getFullPaystubHistory();            // Get full paystub history for #2656

//debugPaystubData();                // Debug paystub data for #2656
//getLoginFor2656();                // Get login credentials for employee #2656

//debugLogin2656();                // Debug login process for employee #2656
//compareEmployeeSSNs();            // Compare SSN data for working vs non-working employees
//testWithoutAliases();
