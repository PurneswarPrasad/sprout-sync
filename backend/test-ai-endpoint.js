const axios = require('axios');

async function testAIEndpoint() {
  try {
    console.log('Testing AI identification endpoint...');
    
    // Test with a sample image URL (a common plant image)
    const testImageUrl = 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=400&h=400&fit=crop';
    
    const response = await axios.post('http://localhost:3001/api/ai/identify/url', {
      imageUrl: testImageUrl
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ AI identification successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ AI identification failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAIEndpoint();
