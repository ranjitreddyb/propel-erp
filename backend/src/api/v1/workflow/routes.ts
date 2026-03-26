import { Router } from 'express';
import { requirePermission } from '../../../middleware/auth';
const router = Router();
router.get('/', requirePermission('workflow', 'read'), async (req, res) => {
  res.json({ success: true, data: [], module: 'workflow' });
});
export default router;
