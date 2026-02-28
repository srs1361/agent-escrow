// AgentEscrowClient.js — JavaScript SDK for AgentEscrow
// Agent #17852 on ERC-8004 | Base Sepolia
// Contract: 0x91E929EF86785005991eD49Dc449147CAD571D6d

import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x91E929EF86785005991eD49Dc449147CAD571D6d';
const CHAIN_ID = 84532; // Base Sepolia
const RPC_URL = 'https://sepolia.base.org';

const ABI = [
  // ── Write Functions ──────────────────────────────────────────
  {
    name: 'createJob',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'description', type: 'string' },
      { name: 'workerAddress', type: 'address' },
      { name: 'deadlineHours', type: 'uint256' }
    ],
    outputs: [{ name: 'jobId', type: 'uint256' }]
  },
  {
    name: 'assignWorker',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'worker', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'markComplete',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'releaseFunds',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'claimRefund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'raiseDispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  // ── Read Functions ───────────────────────────────────────────
  {
    name: 'getJob',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'payer', type: 'address' },
        { name: 'worker', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'fee', type: 'uint256' },
        { name: 'netAmount', type: 'uint256' },
        { name: 'description', type: 'string' },
        { name: 'status', type: 'uint8' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'completedAt', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'getStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: '_totalJobs', type: 'uint256' },
      { name: '_completedJobs', type: 'uint256' },
      { name: '_accumulatedFees', type: 'uint256' },
      { name: '_totalFeesEarned', type: 'uint256' },
      { name: '_totalEscrowedFunds', type: 'uint256' },
      { name: '_totalVolume', type: 'uint256' },
      { name: '_feePercent', type: 'uint256' },
      { name: '_paused', type: 'bool' },
      { name: '_contractBalance', type: 'uint256' }
    ]
  },
  {
    name: 'pendingWithdrawals',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'address', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'accountingHealthCheck',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'healthy', type: 'bool' },
      { name: 'status', type: 'string' }
    ]
  },
  // ── Events ───────────────────────────────────────────────────
  {
    name: 'JobCreated',
    type: 'event',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'worker', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
      { name: 'fee', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'deadline', type: 'uint256' }
    ]
  },
  {
    name: 'FundsReleased',
    type: 'event',
    inputs: [
      { name: 'jobId', type: 'uint256', indexed: true },
      { name: 'worker', type: 'address', indexed: true },
      { name: 'netAmount', type: 'uint256' },
      { name: 'fee', type: 'uint256' }
    ]
  }
];

// Job status enum mapping
export const JOB_STATUS = {
  0: 'OPEN',
  1: 'ACTIVE',
  2: 'COMPLETED',
  3: 'RELEASED',
  4: 'REFUNDED',
  5: 'DISPUTED'
};

export class AgentEscrowClient {
  constructor(signerOrProvider) {
    this.provider = signerOrProvider.provider || signerOrProvider;
    this.signer = signerOrProvider.signTransaction ? signerOrProvider : null;
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      signerOrProvider
    );
  }

  // ── Static factory ────────────────────────────────────────────

  static readOnly() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new AgentEscrowClient(provider);
  }

  static withPrivateKey(privateKey) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);
    return new AgentEscrowClient(signer);
  }

  // ── Core job functions ────────────────────────────────────────

  /**
   * Create a new escrow job and deposit ETH
   * @param {object} params
   * @param {string} params.description - Job description
   * @param {string} params.workerAddress - Worker agent address (or zero address for open)
   * @param {number} params.deadlineHours - Hours until auto-refund (1-720)
   * @param {string} params.paymentEth - Amount in ETH (e.g. "0.05")
   * @returns {number} jobId
   */
  async createJob({ description, workerAddress = ethers.ZeroAddress, deadlineHours = 24, paymentEth }) {
    this._requireSigner();
    const value = ethers.parseEther(paymentEth);
    const fee = (value * 150n) / 10000n;
    console.log(`Creating job: ${description}`);
    console.log(`Deposit: ${paymentEth} ETH | Fee: ${ethers.formatEther(fee)} ETH`);

    const tx = await this.contract.createJob(description, workerAddress, deadlineHours, { value });
    const receipt = await tx.wait();

    // Parse jobId from event
    const event = receipt.logs
      .map(log => { try { return this.contract.interface.parseLog(log); } catch { return null; } })
      .find(e => e?.name === 'JobCreated');

    const jobId = event?.args?.jobId?.toString();
    console.log(`✅ Job #${jobId} created! TX: ${receipt.hash}`);
    return Number(jobId);
  }

  /**
   * Assign a worker to an open job (called by payer)
   */
  async assignWorker(jobId, workerAddress) {
    this._requireSigner();
    const tx = await this.contract.assignWorker(jobId, workerAddress);
    await tx.wait();
    console.log(`✅ Worker assigned to Job #${jobId}`);
  }

  /**
   * Mark a job as complete (called by worker)
   */
  async markComplete(jobId) {
    this._requireSigner();
    const tx = await this.contract.markComplete(jobId);
    await tx.wait();
    console.log(`✅ Job #${jobId} marked complete. 24h dispute window started.`);
  }

  /**
   * Release funds to worker (called by payer)
   */
  async releaseFunds(jobId) {
    this._requireSigner();
    const tx = await this.contract.releaseFunds(jobId);
    await tx.wait();
    console.log(`✅ Funds released for Job #${jobId}`);
  }

  /**
   * Claim refund if job deadline passed (called by payer)
   */
  async claimRefund(jobId) {
    this._requireSigner();
    const tx = await this.contract.claimRefund(jobId);
    await tx.wait();
    console.log(`✅ Refund claimed for Job #${jobId}`);
  }

  /**
   * Raise a dispute on a job
   */
  async raiseDispute(jobId) {
    this._requireSigner();
    const tx = await this.contract.raiseDispute(jobId);
    await tx.wait();
    console.log(`⚔️ Dispute raised for Job #${jobId}`);
  }

  /**
   * Withdraw your pending ETH balance (called by worker after release)
   */
  async withdraw() {
    this._requireSigner();
    const address = await this.signer.getAddress();
    const pending = await this.contract.pendingWithdrawals(address);
    if (pending === 0n) {
      console.log('Nothing to withdraw.');
      return;
    }
    const tx = await this.contract.withdraw();
    await tx.wait();
    console.log(`✅ Withdrawn ${ethers.formatEther(pending)} ETH`);
  }

  // ── Read functions ────────────────────────────────────────────

  /**
   * Get full job details
   */
  async getJob(jobId) {
    const job = await this.contract.getJob(jobId);
    return {
      id: Number(job.id),
      payer: job.payer,
      worker: job.worker,
      amount: ethers.formatEther(job.amount),
      fee: ethers.formatEther(job.fee),
      netAmount: ethers.formatEther(job.netAmount),
      description: job.description,
      status: JOB_STATUS[job.status],
      createdAt: new Date(Number(job.createdAt) * 1000).toISOString(),
      deadline: new Date(Number(job.deadline) * 1000).toISOString(),
      completedAt: job.completedAt > 0n
        ? new Date(Number(job.completedAt) * 1000).toISOString()
        : null
    };
  }

  /**
   * Get contract statistics
   */
  async getStats() {
    const s = await this.contract.getStats();
    return {
      totalJobs: Number(s._totalJobs),
      completedJobs: Number(s._completedJobs),
      accumulatedFees: ethers.formatEther(s._accumulatedFees),
      totalFeesEarned: ethers.formatEther(s._totalFeesEarned),
      totalEscrowedFunds: ethers.formatEther(s._totalEscrowedFunds),
      totalVolume: ethers.formatEther(s._totalVolume),
      feePercent: `${Number(s._feePercent) / 100}%`,
      paused: s._paused,
      contractBalance: ethers.formatEther(s._contractBalance)
    };
  }

  /**
   * Get pending withdrawal balance for an address
   */
  async getPendingWithdrawal(address) {
    const amount = await this.contract.pendingWithdrawals(address);
    return ethers.formatEther(amount);
  }

  /**
   * Check contract accounting health
   */
  async healthCheck() {
    const [healthy, status] = await this.contract.accountingHealthCheck();
    return { healthy, status };
  }

  // ── Event listeners ───────────────────────────────────────────

  /**
   * Listen for new jobs being created
   */
  onJobCreated(callback) {
    this.contract.on('JobCreated', (jobId, payer, worker, amount, fee, description, deadline) => {
      callback({
        jobId: Number(jobId),
        payer,
        worker,
        amount: ethers.formatEther(amount),
        fee: ethers.formatEther(fee),
        description,
        deadline: new Date(Number(deadline) * 1000).toISOString()
      });
    });
  }

  /**
   * Listen for open jobs (no worker assigned)
   */
  onOpenJob(callback) {
    this.contract.on('JobCreated', (jobId, payer, worker, amount, fee, description, deadline) => {
      if (worker === ethers.ZeroAddress) {
        callback({ jobId: Number(jobId), payer, amount: ethers.formatEther(amount), description });
      }
    });
  }

  stopListening() {
    this.contract.removeAllListeners();
  }

  // ── Helpers ───────────────────────────────────────────────────

  _requireSigner() {
    if (!this.signer) throw new Error('Signer required for write operations. Use AgentEscrowClient.withPrivateKey()');
  }

  get address() { return CONTRACT_ADDRESS; }
  get chainId() { return CHAIN_ID; }
  get abi() { return ABI; }
}

export default AgentEscrowClient;
