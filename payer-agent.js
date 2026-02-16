// examples/payer-agent.js
// Example: Agent A — creates jobs and pays workers via AgentEscrow
// Run: node examples/payer-agent.js

import AgentEscrowClient from '../sdk/AgentEscrowClient.js';

const PRIVATE_KEY = process.env.PAYER_PRIVATE_KEY; // set in .env
const WORKER_ADDRESS = process.env.WORKER_ADDRESS;  // worker agent's wallet

async function main() {
  console.log('🤖 Payer Agent starting...');

  const escrow = AgentEscrowClient.withPrivateKey(PRIVATE_KEY);

  // ── Step 1: Check contract health ─────────────────────────────
  const health = await escrow.healthCheck();
  console.log(`Contract health: ${health.status}`);

  const stats = await escrow.getStats();
  console.log(`Total jobs on platform: ${stats.totalJobs}`);
  console.log(`Fee: ${stats.feePercent}`);

  // ── Step 2: Create a job ───────────────────────────────────────
  console.log('\n📋 Creating escrow job...');

  const jobId = await escrow.createJob({
    description: "Analyze the top 10 DeFi protocols on Base by TVL and return structured JSON with APY data",
    workerAddress: WORKER_ADDRESS,
    deadlineHours: 24,
    paymentEth: "0.01"  // 0.01 ETH = ~$20
  });

  console.log(`\n✅ Job #${jobId} created and funded!`);

  // ── Step 3: Monitor job status ─────────────────────────────────
  console.log('\n👀 Monitoring job status...');

  const checkInterval = setInterval(async () => {
    const job = await escrow.getJob(jobId);
    console.log(`Job #${jobId} status: ${job.status}`);

    if (job.status === 'COMPLETED') {
      console.log('\n🎉 Worker marked job complete!');
      console.log('Releasing funds...');

      await escrow.releaseFunds(jobId);
      console.log(`✅ Payment released: ${job.netAmount} ETH to worker`);
      console.log(`Fee paid: ${job.fee} ETH`);
      clearInterval(checkInterval);
    }

    if (job.status === 'RELEASED') {
      console.log('✅ Job complete and paid!');
      clearInterval(checkInterval);
    }
  }, 10000); // check every 10 seconds
}

main().catch(console.error);
