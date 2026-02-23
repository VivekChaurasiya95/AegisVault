import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote
} from '../controllers/note.controller';

const router = Router();

router.use(authenticateToken);

router.post('/', createNote);
router.get('/', getNotes);
router.get('/:id', getNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
