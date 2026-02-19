const API_URL = 'http://localhost:3001';

async function testbackend() {
    try {
        console.log('1. Testing Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: '123'
            })
        });

        if (loginRes.status === 401) {
            console.log('Login failed with 123 (expected if seed used 123456)');
        }
    } catch (e: any) {
        console.log('Login failed with 123 (network error or other):', e.message);
    }

    try {
        console.log('1. Testing Login with correct password...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: '123456'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed with status: ${loginRes.status}`);
        }

        const loginData: any = await loginRes.json();
        console.log('✅ Login SUCCESS!');

        // Check structure of login response
        if (!loginData.accessToken || !loginData.user) {
            throw new Error('Invalid login response structure: ' + JSON.stringify(loginData));
        }

        const token = loginData.accessToken;
        const storeId = loginData.user.storeId;
        console.log(`   Token received. Store ID: ${storeId}`);

        console.log('2. Testing Get Store Info...');
        const storeRes = await fetch(`${API_URL}/pos/store`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!storeRes.ok) {
            const err = await storeRes.text();
            throw new Error(`Get Store Failed: ${storeRes.status} - ${err}`);
        }

        const storeData: any = await storeRes.json();
        console.log('✅ Get Store SUCCESS:', storeData.name);

        console.log('3. Testing Get Products...');
        const prodRes = await fetch(`${API_URL}/pos/products`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!prodRes.ok) {
            throw new Error(`Get Products Failed: ${prodRes.status}`);
        }

        const prodData: any = await prodRes.json();
        console.log(`✅ Get Products SUCCESS. Count: ${prodData.length}`);

        console.log('4. Testing Report Data...');
        const reportRes = await fetch(`${API_URL}/pos/reports?month=1&year=2026&type=tax`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!reportRes.ok) {
            throw new Error(`Get Report Failed: ${reportRes.status}`);
        }
        console.log('✅ Get Report SUCCESS.');

    } catch (error: any) {
        console.error('❌ TEST FAILED:', error.message);
    }
}

testbackend();
