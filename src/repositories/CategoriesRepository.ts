import { EntityRepository, Repository } from 'typeorm';

import Category from '../models/Category';

interface CheckByTitle {
  title: string;
}

@EntityRepository(Category)
class CategoriesRepository extends Repository<Category> {
  public async findOrCreateByTitle({ title }: CheckByTitle): Promise<Category> {
    const checkCategory = await this.findOne({
      where: { title },
    });

    if (!checkCategory) {
      const category = this.create({
        title,
      });

      await this.save(category);

      return category;
    }

    return checkCategory;
  }
}

export default CategoriesRepository;
