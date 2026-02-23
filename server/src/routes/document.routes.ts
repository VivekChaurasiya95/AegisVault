import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createDocument,
  getDocuments,
  getDocument,
  deleteDocument
} from '../controllers/document.controller';

const router = Router();

router.use(authenticateToken);

router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

export default router;
