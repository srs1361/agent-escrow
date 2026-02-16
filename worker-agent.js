// examples/worker-agent.js
// Example: Agent B — listens for jobs, does work with AI, marks complete
// Run: node examples/worker-agent.js

import AgentEscrowClient from '../sdk/AgentEscrowClient.js';

const PRIVATE_KEY = process.env.WORKER_PRIVATE_KEY; // set in .env

// ── Simulated AI work function ─────────────────────────────────
// Replace this with your actual AI logic (OpenAI, Claude API, etc.)
async function doWork(description) {
  console.log(`\n🧠 Working on: "${description}"`);

  // TODO: Replace with real AI call e.g:
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [{ role: "user", content: description }]
  // });
  // return response.choices[0].message.content;

  // Simulated work delay
  await new Promise(r => setTimeout(r, 3000));
  return `Completed analysis for: ${description}`;
}

async function main() {
  console.log('🤖 Worker Agent starting...');
  console.log('Listening for new jobs on AgentEscrow...\n');

  const escrow = AgentEscrowClient.withPrivateKey(PRIVATE_KEY);

  // ── Listen for open jobs assigned to this worker ───────────────
  escrow.onJobCreated(async (job) => {
    const myAddress = process.env.WORKER_ADDRESS?.toLowerCase();

    // Only handle jobs assigned to us
    if (job.worker.toLowerCase() !== myAddress) return;

    console.log(`\n📋 New job received!`);
    console.log(`Job ID:      #${job.jobId}`);
    console.log(`Description: ${job.description}`);
    console.log(`Payment:     ${job.amount} ETH`);
    console.log(`Deadline:    ${job.deadline}`);

    try {
      // ── Do the actual work ───────────────────────────────────
      const result = await doWork(job.description);
      console.log(`\n✅ Work completed: ${result}`);

      // ── Mark job complete on-chain ───────────────────────────
      console.log('Marking job complete on-chain...');
      await escrow.markComplete(job.jobId);
      console.log(`✅ Job #${job.jobId} marked complete!`);
      console.log('Waiting for payer to release funds...');

    } catch (err) {
      console.error(`❌ Failed to complete job #${job.jobId}:`, err.message);
    }
  });

  // ── After funds released — withdraw ETH ───────────────────────
  // Poll for pending withdrawals every minute
  setInterval(async () => {
    const myAddress = process.env.WORKER_ADDRESS;
    const pending = await escrow.getPendingWithdrawal(myAddress);

    if (parseFloat(pending) > 0) {
      console.log(`\n💰 Pending withdrawal: ${pending} ETH`);
      await escrow.withdraw();
      console.log(`✅ Withdrew ${pending} ETH to wallet!`);
    }
  }, 60000);

  console.log('Worker agent running. Press Ctrl+C to stop.\n');
}

main().catch(console.error);
