const https = require('https');

const url = 'https://lppqlzrzmiyefcggnwlx.supabase.co/rest/v1/rpc/get_table_info'; // This might not exist, let's try raw SQL or just a test insert
// Actually, let's just try to insert a test 'adjustment' and see the error.

const options = {
    method: 'POST',
    hostname: 'lppqlzrzmiyefcggnwlx.supabase.co',
    path: '/rest/v1/stock_movements',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcHFsenJ6bWl5ZWZjZ2dud2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU0MTA5NywiZXhwIjoyMDg0MTE3MDk3fQ.ZFW9c1NdzMtCunY6bcfwwk5zZL_Z8Kd3aoICkjm1pv0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcHFsenJ6bWl5ZWZjZ2dud2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU0MTA5NywiZXhwIjoyMDg0MTE3MDk3fQ.ZFW9c1NdzMtCunY6bcfwwk5zZL_Z8Kd3aoICkjm1pv0',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', data);
    });
});

req.on('error', (err) => {
    console.log('ERROR:', err.message);
});

// Mock insert
req.write(JSON.stringify({
    product_id: '00000000-0000-0000-0000-000000000000', // Invalid ID but should trigger constraint error before FK error if type is invalid
    type: 'adjustment',
    qty: 1,
    stock_before: 0,
    stock_after: 1,
    description: 'Test'
}));
req.end();
