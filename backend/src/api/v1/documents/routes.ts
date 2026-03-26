import { Router } from 'express';
import { requirePermission } from '../../../middleware/auth';
const router = Router();
router.get('/', requirePermission('documents', 'read'), async (req, res) => {
  res.json({ success: true, data: [], module: 'documents' });
});
export default router;
