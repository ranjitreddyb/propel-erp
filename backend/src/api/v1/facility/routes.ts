import { Router } from 'express';
import { requirePermission } from '../../../middleware/auth';
const router = Router();
router.get('/', requirePermission('facility', 'read'), async (req, res) => {
  res.json({ success: true, data: [], module: 'facility' });
});
export default router;
