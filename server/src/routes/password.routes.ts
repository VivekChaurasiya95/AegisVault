import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createPassword,
  getPasswords,
  getPassword,
  updatePassword,
  deletePassword
} from '../controllers/password.controller';

const router = Router();

router.use(authenticateToken);

router.post('/', createPassword);
router.get('/', getPasswords);
router.get('/:id', getPassword);
router.put('/:id', updatePassword);
router.delete('/:id', deletePassword);

export default router;
