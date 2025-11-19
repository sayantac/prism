"""
Feature Engineering Service for ML Models.
Handles RFM features, interaction matrices, and reorder features.
"""
import logging
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix

from app.services.ml.base_ml_service import BaseMLService

logger = logging.getLogger(__name__)


class MLFeatureService(BaseMLService):
    """Service for creating features for ML models."""
    
    def calculate_rfm_features(self, interactions_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate RFM (Recency, Frequency, Monetary) features for users.
        
        Args:
            interactions_df: DataFrame with user interactions
            
        Returns:
            DataFrame with RFM features per user
        """
        try:
            # Convert interaction_date to datetime
            interactions_df["interaction_date"] = pd.to_datetime(
                interactions_df["interaction_date"]
            )
            current_date = interactions_df["interaction_date"].max()

            # Calculate RFM metrics
            rfm = (
                interactions_df.groupby("user_id")
                .agg(
                    {
                        "interaction_date": [
                            lambda x: (current_date - x.max()).days,  # Recency
                            "count",  # Frequency
                        ],
                        "unit_price": ["sum", "mean"],  # Monetary
                        "product_id": "nunique",  # Unique products
                        "quantity": "sum",  # Total quantity
                    }
                )
                .round(2)
            )

            # Flatten column names
            rfm.columns = [
                "recency",
                "frequency",
                "monetary",
                "avg_order_value",
                "unique_products",
                "total_quantity",
            ]
            rfm = rfm.reset_index()

            # Calculate additional features
            user_orders = (
                interactions_df.groupby("user_id")["interaction_date"]
                .apply(list)
                .reset_index()
            )
            user_orders["days_between_orders"] = user_orders["interaction_date"].apply(
                lambda dates: [
                    (dates[i] - dates[i - 1]).days for i in range(1, len(dates))
                ]
                if len(dates) > 1
                else [0]
            )

            user_orders["avg_days_between_orders"] = user_orders[
                "days_between_orders"
            ].apply(lambda x: np.mean(x) if x else 0)
            user_orders["std_days_between_orders"] = user_orders[
                "days_between_orders"
            ].apply(lambda x: np.std(x) if len(x) > 1 else 0)

            # Merge additional features
            rfm = rfm.merge(
                user_orders[
                    ["user_id", "avg_days_between_orders", "std_days_between_orders"]
                ],
                on="user_id",
                how="left",
            )

            self.logger.info(f"Calculated RFM features for {len(rfm)} users")
            return rfm

        except Exception as e:
            self.logger.error(f"Error calculating RFM features: {e}")
            return pd.DataFrame()

    def create_reorder_features(
        self, interactions_df: pd.DataFrame, rfm_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Create features for reorder prediction.
        
        Args:
            interactions_df: DataFrame with user interactions
            rfm_df: DataFrame with RFM features
            
        Returns:
            DataFrame with reorder prediction features
        """
        try:
            # Get user-product combinations
            user_products = (
                interactions_df.groupby(["user_id", "product_id"])
                .agg(
                    {
                        "interaction_date": ["count", "max"],
                        "quantity": "sum",
                        "unit_price": "mean",
                    }
                )
                .reset_index()
            )

            user_products.columns = [
                "user_id",
                "product_id",
                "purchase_frequency",
                "last_purchase",
                "total_quantity",
                "avg_price",
            ]

            # Calculate days since last purchase
            current_date = interactions_df["interaction_date"].max()
            user_products["days_since_last_purchase"] = (
                current_date - user_products["last_purchase"]
            ).dt.days

            # Merge with RFM features
            reorder_df = user_products.merge(
                rfm_df[
                    ["user_id", "avg_days_between_orders", "std_days_between_orders"]
                ],
                on="user_id",
                how="left",
            )

            # Create target variable (will reorder)
            # Simple heuristic: users who purchased the product more than once are likely to reorder
            reorder_df["will_reorder"] = (reorder_df["purchase_frequency"] > 1).astype(
                int
            )

            self.logger.info(f"Created reorder features for {len(reorder_df)} user-product pairs")
            return reorder_df

        except Exception as e:
            self.logger.error(f"Error creating reorder features: {e}")
            return pd.DataFrame()

    def create_interaction_matrix(
        self, interactions_df: pd.DataFrame
    ) -> Tuple[coo_matrix, Dict[int, int], Dict[int, int]]:
        """
        Create sparse user-item interaction matrix.
        
        Args:
            interactions_df: DataFrame with user-product interactions
            
        Returns:
            Tuple of (interaction_matrix, user_mapping, item_mapping)
        """
        try:
            # Create mappings
            unique_users = interactions_df["user_id"].unique()
            unique_items = interactions_df["product_id"].unique()

            user_mapping = {user_id: idx for idx, user_id in enumerate(unique_users)}
            item_mapping = {item_id: idx for idx, item_id in enumerate(unique_items)}

            # Map to indices
            user_indices = interactions_df["user_id"].map(user_mapping)
            item_indices = interactions_df["product_id"].map(item_mapping)

            # Create interaction values (can be implicit or explicit)
            # Use quantity as interaction strength
            values = interactions_df["quantity"].fillna(1).astype(float)

            # Create sparse matrix
            interaction_matrix = coo_matrix(
                (values, (user_indices, item_indices)),
                shape=(len(unique_users), len(unique_items)),
            )

            self.logger.info(
                f"Created interaction matrix: {interaction_matrix.shape} "
                f"with {interaction_matrix.nnz} interactions"
            )

            return interaction_matrix, user_mapping, item_mapping

        except Exception as e:
            self.logger.error(f"Error creating interaction matrix: {e}")
            raise
