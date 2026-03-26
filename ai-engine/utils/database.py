import asyncpg, os
from typing import Optional
_pool: Optional[asyncpg.Pool] = None
async def init_db_pool():
    global _pool
    _pool = await asyncpg.create_pool(os.getenv("DATABASE_URL",""), min_size=2, max_size=10)
async def get_db():
    if not _pool: await init_db_pool()
    async with _pool.acquire() as conn: yield conn
