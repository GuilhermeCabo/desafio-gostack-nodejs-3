import { diskStorage } from 'multer';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

export const directory = resolve(__dirname, '..', '..', 'tmp');

export default {
  storage: diskStorage({
    destination: directory,
    filename: (request, file, callback) => {
      const fileHash = randomBytes(10).toString('HEX');
      const filename = `${fileHash}-${file.originalname}`;

      return callback(null, filename);
    },
  }),
};
