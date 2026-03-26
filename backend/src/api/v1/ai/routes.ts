import { Router } from 'express';
import { requirePermission } from '../../../middleware/auth';
const router = Router();
router.get('/', requirePermission('ai', 'read'), async (req, res) => {
  res.json({ success: true, data: [], module: 'ai' });
});
export default router;
