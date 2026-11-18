export interface Transaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  type: 'CREDIT' | 'DEBIT';
  amountPaise: number;
  balancePaise?: number;
}

export interface Statement {
  accountHolder: string;
  accountNumber: string;
  accountType: string;
  currency: 'INR';
  statementPeriod: {
    start: string;
    end: string;
  };
  openingBalancePaise: number;
  closingBalancePaise: number;
  transactions: Transaction[];
}
