/**
 * Message Queue Module Tests
 */

const MessageQueue = require('./index');

async function runTests() {
  console.log('=== Running Message Queue Tests ===\n');
  
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: In-memory queue initialization
  try {
    console.log('Test 1: In-memory queue initialization...');
    const queue = new MessageQueue({ type: 'memory' });
    await queue.initialize();
    console.log('✅ Test 1 passed\n');
    passedTests++;
    await queue.close();
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message, '\n');
    failedTests++;
  }

  // Test 2: Register task handler
  try {
    console.log('Test 2: Register task handler...');
    const queue = new MessageQueue({ type: 'memory' });
    await queue.initialize();
    
    queue.registerHandler('test-task', async (payload) => {
      return { success: true, data: payload };
    });
    
    if (queue.taskHandlers.has('test-task')) {
      console.log('✅ Test 2 passed\n');
      passedTests++;
    } else {
      throw new Error('Handler not registered');
    }
    await queue.close();
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message, '\n');
    failedTests++;
  }

  // Test 3: Add task to queue
  try {
    console.log('Test 3: Add task to queue...');
    const queue = new MessageQueue({ type: 'memory' });
    await queue.initialize();
    
    queue.registerHandler('test-task', async (payload) => {
      return { success: true, data: payload };
    });
    
    const taskId = await queue.add('test-task', { message: 'test' });
    if (taskId && typeof taskId === 'string') {
      console.log('✅ Test 3 passed');
      console.log('   Task ID:', taskId, '\n');
      passedTests++;
    } else {
      throw new Error('Invalid task ID');
    }
    await queue.close();
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message, '\n');
    failedTests++;
  }

  // Test 4: Process task successfully
  try {
    console.log('Test 4: Process task successfully...');
    const queue = new MessageQueue({ type: 'memory' });
    await queue.initialize();
    
    let processed = false;
    queue.registerHandler('test-task', async (payload) => {
      processed = true;
      return { success: true, data: payload };
    });
    
    await queue.add('test-task', { message: 'test' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await queue.stop();
    
    if (processed) {
      console.log('✅ Test 4 passed\n');
      passedTests++;
    } else {
      throw new Error('Task not processed');
    }
    await queue.close();
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message, '\n');
    failedTests++;
  }

  // Test 5: Task retry on failure
  try {
    console.log('Test 5: Task retry on failure...');
    const queue = new MessageQueue({ type: 'memory', maxRetries: 2, retryDelay: 100 });
    await queue.initialize();
    
    let attempts = 0;
    queue.registerHandler('failing-task', async (payload) => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Simulated failure');
      }
      return { success: true, attempts };
    });
    
    await queue.add('failing-task', { message: 'test' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    await queue.stop();
    
    if (attempts === 2) {
      console.log('✅ Test 5 passed');
      console.log('   Task retried:', attempts, 'times\n');
      passedTests++;
    } else {
      throw new Error(`Expected 2 attempts, got ${attempts}`);
    }
    await queue.close();
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message, '\n');
    failedTests++;
  }

  // Test 6: Priority queue ordering
  try {
    console.log('Test 6: Priority queue ordering...');
    const queue = new MessageQueue({ type: 'memory' });
    await queue.initialize();
    
    let processedOrder = [];
    queue.registerHandler('priority-test', async (payload) => {
      processedOrder.push(payload.priority);
      return { success: true };
    });
    
    // Add tasks with different priorities
    await queue.add('priority-test', { priority: 'low' }, { priority: 'low' });
    await queue.add('priority-test', { priority: 'high' }, { priority: 'high' });
    await queue.add('priority-test', { priority: 'normal' }, { priority: 'normal' });
    await queue.add('priority-test', { priority: 'high' }, { priority: 'high' });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await queue.stop();
    
    // Check that high priority tasks are processed first
    if (processedOrder[0] === 'high' && processedOrder[1] === 'high') {
      console.log('✅ Test 6 passed');
      console.log('   Processing order:', processedOrder, '\n');
      passedTests++;
    } else {
      throw new Error('Priority ordering incorrect');
    }
    await queue.close();
  } catch (error) {
    console.error('❌ Test 6 failed:', error.message, '\n');
    failedTests++;
  }

  // Test 7: Get queue statistics
  try {
    console.log('Test 7: Get queue statistics...');
    const queue = new MessageQueue({ type: 'memory' });
    await queue.initialize();
    
    queue.registerHandler('stats-test', async (payload) => {
      return { success: true };
    });
    
    await queue.add('stats-test', {}, { priority: 'high' });
    await queue.add('stats-test', {}, { priority: 'normal' });
    await queue.add('stats-test', {}, { priority: 'low' });
    
    const stats = await queue.getStats();
    
    if (stats.type === 'memory' && stats.totalQueued >= 3) {
      console.log('✅ Test 7 passed');
      console.log('   Stats:', JSON.stringify(stats, null, 2), '\n');
      passedTests++;
    } else {
      throw new Error('Invalid statistics');
    }
    await queue.close();
  } catch (error) {
    console.error('❌ Test 7 failed:', error.message, '\n');
    failedTests++;
  }

  // Test 8: Clear queue
  try {
    console.log('Test 8: Clear queue...');
    const queue = new MessageQueue({ type: 'memory' });
    await queue.initialize();
    
    queue.registerHandler('clear-test', async (payload) => {
      return { success: true };
    });
    
    await queue.add('clear-test', {});
    await queue.add('clear-test', {});
    await queue.clear();
    
    const stats = await queue.getStats();
    
    if (stats.totalQueued === 0) {
      console.log('✅ Test 8 passed\n');
      passedTests++;
    } else {
      throw new Error('Queue not cleared');
    }
    await queue.close();
  } catch (error) {
    console.error('❌ Test 8 failed:', error.message, '\n');
    failedTests++;
  }

  // Print test summary
  console.log('=== Test Summary ===');
  console.log(`Total tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%\n`);

  return { passedTests, failedTests };
}

// Run tests
runTests().then(results => {
  process.exit(results.failedTests > 0 ? 1 : 0);
}).catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});