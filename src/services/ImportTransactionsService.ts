import { getRepository, In } from 'typeorm';
import parse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import { directory } from '../config/upload';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  filename: string;
}

interface CsvTransactions {
  title: string;
  value: number;
  category: string;
  type: 'income' | 'outcome';
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    const filepath = path.join(directory, filename);

    const readStram = fs.createReadStream(filepath);

    const parser = parse({
      from_line: 2,
    });

    const parsedCsv = readStram.pipe(parser);

    const csvCategories: string[] = [];
    const csvTransactions: CsvTransactions[] = [];

    parsedCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !category) return;

      csvCategories.push(category);
      csvTransactions.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => parsedCsv.on('end', resolve));

    const existingCategories = await categoriesRepository.find({
      where: { title: In(csvCategories) },
    });

    const existingCategoriesTitles = existingCategories.map(
      (category: Category) => category.title,
    );

    const categoriesToAdd = csvCategories
      .filter(category => !existingCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      categoriesToAdd.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...newCategories, ...existingCategories];

    const transactions = transactionsRepository.create(
      csvTransactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(transactions);

    await fs.promises.unlink(filepath);

    return transactions;
  }
}

export default ImportTransactionsService;
