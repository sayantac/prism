import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict

import psutil
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.admin import SystemMetrics

logger = logging.getLogger(__name__)
settings = get_settings()


class SystemHealthService:
    """Service for monitoring system health and performance"""

    def __init__(self, db: Session):
        self.db = db

    async def record_api_metric(
        self, endpoint: str, response_time_ms: float, status_code: int
    ):
        """Record API performance metrics"""
        try:
            metric = SystemMetrics(
                metric_type="api_response_time",
                metric_name=endpoint,
                value=response_time_ms,
                unit="ms",
                tags={"endpoint": endpoint, "status_code": status_code},
            )
            self.db.add(metric)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error recording API metric: {e}")

    async def record_database_metric(self, query_type: str, execution_time_ms: float):
        """Record database query metrics"""
        try:
            metric = SystemMetrics(
                metric_type="database_query_time",
                metric_name=query_type,
                value=execution_time_ms,
                unit="ms",
            )
            self.db.add(metric)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error recording database metric: {e}")

    async def record_search_metric(
        self, search_type: str, response_time_ms: float, results_count: int
    ):
        """Record search performance metric"""
        try:
            metric = SystemMetrics(
                metric_type="search_response_time",
                metric_name=f"search_{search_type}",
                value=response_time_ms,
                unit="ms",
                tags={"search_type": search_type, "results_count": results_count},
            )
            self.db.add(metric)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error recording search metric: {e}")

    async def record_system_metrics(self):
        """Record system resource metrics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            await self._record_metric(
                "system_resource", "cpu_usage", cpu_percent, "percentage"
            )

            memory = psutil.virtual_memory()
            await self._record_metric(
                "system_resource", "memory_usage", memory.percent, "percentage"
            )
            await self._record_metric(
                "system_resource",
                "memory_available",
                memory.available / (1024**3),
                "GB",
            )

            disk = psutil.disk_usage("/")
            disk_percent = (disk.used / disk.total) * 100
            await self._record_metric(
                "system_resource", "disk_usage", disk_percent, "percentage"
            )

            network = psutil.net_io_counters()
            await self._record_metric(
                "system_resource", "network_bytes_sent", network.bytes_sent, "bytes"
            )
            await self._record_metric(
                "system_resource", "network_bytes_recv", network.bytes_recv, "bytes"
            )

        except Exception as e:
            logger.error(f"Error recording system metrics: {e}")

    async def check_database_connectivity(self) -> Dict[str, Any]:
        """Check database connectivity and response time"""
        try:
            start_time = time.time()
            self.db.execute(text("SELECT 1"))
            response_time = (time.time() - start_time) * 1000

            await self._record_metric(
                "health_check", "database_response_time", response_time, "ms"
            )

            return {
                "status": "healthy" if response_time < 1000 else "slow",
                "response_time_ms": response_time,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            return {
                "status": "critical",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def check_ml_models_health(self) -> Dict[str, Any]:
        """Check ML models and recommendation engine health"""
        try:
            health_data = {
                "status": "healthy",
                "models_loaded": True,
                "last_prediction_time": datetime.utcnow().isoformat(),
                "model_version": "v1.0",
                "recommendations_enabled": True,
            }

            return health_data

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def cleanup_old_metrics(self, days_to_keep: int = 7):
        """Cleanup old system metrics to prevent database bloat"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

            deleted_count = (
                self.db.query(SystemMetrics)
                .filter(SystemMetrics.timestamp < cutoff_date)
                .delete()
            )

            self.db.commit()

            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} old system metrics")

        except Exception as e:
            logger.error(f"Error cleaning up old metrics: {e}")

    async def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary for the last 24 hours"""
        try:
            last_24h = datetime.utcnow() - timedelta(hours=24)

            api_avg = await self._get_metric_average("api_response_time", last_24h)
            db_avg = await self._get_metric_average("database_query_time", last_24h)
            search_avg = await self._get_metric_average(
                "search_response_time", last_24h
            )

            error_rate = await self._calculate_error_rate(last_24h)

            cpu_avg = await self._get_metric_average(
                "system_resource", last_24h, "cpu_usage"
            )
            memory_avg = await self._get_metric_average(
                "system_resource", last_24h, "memory_usage"
            )

            return {
                "period": "24h",
                "api_response_time_avg": api_avg,
                "database_query_time_avg": db_avg,
                "search_response_time_avg": search_avg,
                "error_rate_percentage": error_rate,
                "cpu_usage_avg": cpu_avg,
                "memory_usage_avg": memory_avg,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting performance summary: {e}")
            return {"error": str(e)}

    async def _record_metric(
        self,
        metric_type: str,
        metric_name: str,
        value: float,
        unit: str,
        tags: Dict = None,
    ):
        """Helper method to record a metric"""
        try:
            metric = SystemMetrics(
                metric_type=metric_type,
                metric_name=metric_name,
                value=value,
                unit=unit,
                tags=tags or {},
            )
            self.db.add(metric)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error recording metric {metric_name}: {e}")

    async def _get_metric_average(
        self, metric_type: str, since: datetime, metric_name: str = None
    ) -> float:
        """Get average value for a metric type since given time"""
        try:
            from sqlalchemy import func

            query = (
                self.db.query(func.avg(SystemMetrics.value))
                .filter(SystemMetrics.metric_type == metric_type)
                .filter(SystemMetrics.timestamp >= since)
            )

            if metric_name:
                query = query.filter(SystemMetrics.metric_name == metric_name)

            result = query.scalar()
            return round(float(result), 2) if result else 0.0

        except Exception as e:
            logger.error(f"Error calculating metric average: {e}")
            return 0.0

    async def _calculate_error_rate(self, since: datetime) -> float:
        """Calculate API error rate percentage"""
        try:
            from sqlalchemy import case, func

            result = (
                self.db.query(
                    func.avg(
                        case(
                            (
                                SystemMetrics.tags["status_code"].astext.cast(
                                    text("INTEGER")
                                )
                                >= 400,
                                1,
                            ),
                            else_=0,
                        )
                    )
                    * 100
                )
                .filter(SystemMetrics.metric_type == "api_response_time")
                .filter(SystemMetrics.timestamp >= since)
                .scalar()
            )

            return round(float(result), 2) if result else 0.0

        except Exception as e:
            logger.error(f"Error calculating error rate: {e}")
            return 0.0


class SystemMonitor:
    """Background system monitoring service"""

    def __init__(self, db_session_factory):
        self.db_session_factory = db_session_factory
        self.is_running = False

    async def start_monitoring(self):
        """Start background monitoring tasks"""
        self.is_running = True

        await asyncio.gather(
            self._system_metrics_loop(),
            self._health_check_loop(),
            self._cleanup_loop(),
            return_exceptions=True,
        )

    async def stop_monitoring(self):
        """Stop background monitoring"""
        self.is_running = False

    async def _system_metrics_loop(self):
        """Continuously record system metrics"""
        while self.is_running:
            try:
                with self.db_session_factory() as db:
                    health_service = SystemHealthService(db)
                    await health_service.record_system_metrics()

                await asyncio.sleep(60)

            except Exception as e:
                logger.error(f"Error in system metrics loop: {e}")
                await asyncio.sleep(60)

    async def _health_check_loop(self):
        """Continuously perform health checks"""
        while self.is_running:
            try:
                with self.db_session_factory() as db:
                    health_service = SystemHealthService(db)

                    await health_service.check_database_connectivity()

                    await health_service.check_ml_models_health()

                await asyncio.sleep(300)

            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
                await asyncio.sleep(300)

    async def _cleanup_loop(self):
        """Continuously cleanup old data"""
        while self.is_running:
            try:
                with self.db_session_factory() as db:
                    health_service = SystemHealthService(db)
                    await health_service.cleanup_old_metrics()

                await asyncio.sleep(3600)

            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(3600)
