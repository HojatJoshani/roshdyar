import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Wallet ledger service. All money movements MUST go through these
 * helpers so the ledger stays immutable and consistent. We use a Prisma
 * transaction to atomically update balance + append a transaction row
 * with a balanceAfter snapshot.
 *
 * All amounts are TOMAN integers (no floating point).
 */

export type TxDirection = "CREDIT" | "DEBIT";
export type TxType =
  | "DEPOSIT"
  | "ORDER_PAYMENT"
  | "REFUND"
  | "ADMIN_ADJUST";

export class InsufficientFundsError extends Error {
  constructor() {
    super("INSUFFICIENT_FUNDS");
  }
}

export class WalletConflictError extends Error {
  constructor() {
    super("WALLET_CONFLICT");
  }
}

interface AppendTxInput {
  userId: string;
  direction: TxDirection;
  amount: number;
  type: TxType;
  description: string;
  reference?: string;
  orderId?: string;
  paymentId?: string;
}

async function appendTx(tx: Prisma.TransactionClient, input: AppendTxInput) {
  const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
  if (!wallet) throw new WalletConflictError();

  const current = wallet.balance;
  const next =
    input.direction === "CREDIT" ? current + input.amount : current - input.amount;
  if (next < 0) throw new InsufficientFundsError();

  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: next },
  });

  const wt = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId: input.userId,
      direction: input.direction,
      amount: Math.abs(input.amount),
      balanceAfter: next,
      type: input.type,
      description: input.description,
      reference: input.reference,
      order: input.orderId ? { connect: { id: input.orderId } } : undefined,
      payment: input.paymentId ? { connect: { id: input.paymentId } } : undefined,
    },
  });

  return { txId: wt.id, balanceBefore: current, balanceAfter: next };
}

/** Credit the wallet (deposit / refund / admin add). */
export async function creditWallet(input: AppendTxInput) {
  return db.$transaction(async (tx) => {
    const res = await appendTx(tx, { ...input, direction: "CREDIT" });
    return res;
  });
}

/** Debit the wallet (order payment / admin deduction). Throws if insufficient. */
export async function debitWallet(input: AppendTxInput) {
  return db.$transaction(async (tx) => {
    const res = await appendTx(tx, { ...input, direction: "DEBIT" });
    return res;
  });
}

/**
 * Atomic wallet payment for an order. Idempotent: if the order already
 * has a walletTxId, returns it without debiting again.
 */
export async function payOrderFromWallet(params: {
  userId: string;
  orderId: string;
  amount: number;
  description: string;
}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      select: { walletTxId: true, status: true },
    });
    if (!order) throw new WalletConflictError();

    // Idempotent — if already paid, return existing tx.
    if (order.walletTxId) {
      return { txId: order.walletTxId, alreadyPaid: true };
    }

    const res = await appendTx(tx, {
      userId: params.userId,
      direction: "DEBIT",
      amount: params.amount,
      type: "ORDER_PAYMENT",
      description: params.description,
      reference: params.orderId,
      orderId: params.orderId,
    });

    await tx.order.update({
      where: { id: params.orderId },
      data: { walletTxId: res.txId },
    });

    return { txId: res.txId, alreadyPaid: false };
  });
}
