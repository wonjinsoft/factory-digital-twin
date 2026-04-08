"""
파일: api/db/session.py
역할: AsyncSession 의존성 주입
"""
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from db.base import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
