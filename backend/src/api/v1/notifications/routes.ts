import { Router } from 'express';
import { db, paginatedQuery } from '../../../config/database';
import { requirePermission } from '../../../middleware/auth';
const router = Router();

router.get('/', requirePermission('notifications','read'), async (req, res) => {
  const { page=1, pageSize=20, unreadOnly } = req.query;
  const userId=req.user!.id, companyId=req.user!.companyId;
  let sql=`SELECT * FROM notifications WHERE company_id=$1 AND (user_id=$2 OR user_id IS NULL)`;
  const params: unknown[]=[companyId,userId];
  if (unreadOnly==='true') sql+=` AND is_read=false`;
  sql+=` ORDER BY created_at DESC`;
  res.json({ success:true, ...(await paginatedQuery(sql,params,Number(page),Number(pageSize))) });
});

router.get('/unread-count', requirePermission('notifications','read'), async (req, res) => {
  const r = await db.query(`SELECT COUNT(*) AS count FROM notifications
    WHERE (user_id=$1 OR user_id IS NULL) AND company_id=$2 AND is_read=false`,
    [req.user!.id, req.user!.companyId]);
  res.json({ success:true, count:parseInt(r.rows[0].count) });
});

router.patch('/:id/read', requirePermission('notifications','read'), async (req, res) => {
  await db.query('UPDATE notifications SET is_read=true,read_at=NOW() WHERE id=$1 AND company_id=$2',
    [req.params.id, req.user!.companyId]);
  res.json({ success:true });
});

router.patch('/read-all', requirePermission('notifications','read'), async (req, res) => {
  await db.query(`UPDATE notifications SET is_read=true,read_at=NOW()
    WHERE (user_id=$1 OR user_id IS NULL) AND company_id=$2 AND is_read=false`,
    [req.user!.id, req.user!.companyId]);
  res.json({ success:true });
});

export default router;
