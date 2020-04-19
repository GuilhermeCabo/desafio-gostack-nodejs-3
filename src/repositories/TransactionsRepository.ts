import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const balance = { income: 0, outcome: 0, total: 0 };

    transactions.forEach(({ type, value }) => {
      switch (type) {
        case 'income':
          balance.income += value;
          balance.total += value;
          break;
        case 'outcome':
          balance.outcome += value;
          balance.total -= value;
          break;

        default:
      }
    });

    return balance;
  }
}

export default TransactionsRepository;
