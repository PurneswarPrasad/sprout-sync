const axios = require('axios');

async function testPlantCreation() {
  try {
    // First, let's test the task templates endpoint
    console.log('Testing task templates endpoint...');
    const templatesResponse = await axios.get('http://localhost:3001/api/plants/task-templates', {
      withCredentials: true,
    });
    console.log('✅ Task templates response:', templatesResponse.data);

    // Test plant creation with care tasks
    console.log('\nTesting plant creation...');
    const plantData = {
      name: 'Test Plant',
      type: 'Succulent',
      acquisitionDate: '2025-01-27',
      city: 'Test City',
      careTasks: {
        watering: {
          frequency: 7,
          lastWatered: '2025-01-25'
        },
        fertilizing: {
          frequency: 30
        }
      }
    };

    const plantResponse = await axios.post('http://localhost:3001/api/plants', plantData, {
      withCredentials: true,
    });
    console.log('✅ Plant creation response:', plantResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPlantCreation();
