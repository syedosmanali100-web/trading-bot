"""
Multi-model training system for trading bot
Uses walk-forward validation with time-based splits
"""
import pandas as pd
import numpy as np
from pathlib import Path
import logging
import joblib
import json
from datetime import datetime

# Set matplotlib backend before importing pyplot
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

# ML libraries
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score, roc_curve
)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import xgboost as xgb
import lightgbm as lgb

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


class ModelTrainer:
    """Train and evaluate trading models with walk-forward validation"""
    
    def __init__(self, data_path: str, models_dir: str = 'models'):
        self.data_path = Path(data_path)
        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        (self.models_dir / 'plots').mkdir(exist_ok=True)
        (self.models_dir / 'metrics').mkdir(exist_ok=True)
        
        self.df = None
        self.feature_cols = None
        self.results = {}
    
    def load_data(self):
        """Load training dataset"""
        logger.info("="*80)
        logger.info("LOADING TRAINING DATASET")
        logger.info("="*80)
        
        if not self.data_path.exists():
            raise FileNotFoundError(f"Dataset not found: {self.data_path}")
        
        logger.info(f"\nLoading: {self.data_path}")
        self.df = pd.read_parquet(self.data_path)
        
        # Ensure timestamp is datetime
        if not pd.api.types.is_datetime64_any_dtype(self.df['timestamp']):
            self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        
        # Sort by timestamp
        self.df = self.df.sort_values('timestamp').reset_index(drop=True)
        
        # Identify feature columns
        self.feature_cols = [col for col in self.df.columns 
                            if not col.startswith('label_') 
                            and col not in ['timestamp', 'symbol', 'timeframe']]
        
        logger.info(f"✓ Loaded: {len(self.df):,} rows")
        logger.info(f"  Features: {len(self.feature_cols)}")
        logger.info(f"  Date range: {self.df['timestamp'].min()} to {self.df['timestamp'].max()}")
        logger.info(f"  Labels: label_direction, label_volatility, label_no_trade")
    
    def create_time_splits(self):
        """
        Create time-based train/test splits for walk-forward validation
        
        Returns:
            List of (train_indices, test_indices) tuples
        """
        logger.info("\n" + "="*80)
        logger.info("CREATING TIME-BASED SPLITS")
        logger.info("="*80)
        
        # Extract year from timestamp
        self.df['year'] = self.df['timestamp'].dt.year
        
        # Define splits
        splits = [
            {
                'name': 'Split 1',
                'train_years': [2021, 2022],
                'test_years': [2023]
            },
            {
                'name': 'Split 2',
                'train_years': [2021, 2022, 2023],
                'test_years': [2024, 2025, 2026]  # Using available data
            }
        ]
        
        split_data = []
        
        for split_info in splits:
            train_mask = self.df['year'].isin(split_info['train_years'])
            test_mask = self.df['year'].isin(split_info['test_years'])
            
            train_idx = self.df[train_mask].index.tolist()
            test_idx = self.df[test_mask].index.tolist()
            
            if len(train_idx) > 0 and len(test_idx) > 0:
                split_data.append((train_idx, test_idx))
                
                logger.info(f"\n{split_info['name']}:")
                logger.info(f"  Train: {split_info['train_years']} → {len(train_idx):,} samples")
                logger.info(f"  Test:  {split_info['test_years']} → {len(test_idx):,} samples")
        
        if not split_data:
            logger.warning("\nNo valid splits found, using single 80/20 time-based split")
            split_point = int(len(self.df) * 0.8)
            train_idx = list(range(split_point))
            test_idx = list(range(split_point, len(self.df)))
            split_data = [(train_idx, test_idx)]
            
            logger.info(f"\nSingle Split:")
            logger.info(f"  Train: {len(train_idx):,} samples")
            logger.info(f"  Test:  {len(test_idx):,} samples")
        
        return split_data
    
    def train_direction_model(self, X_train, y_train, X_test, y_test, split_name):
        """
        MODEL 1: Direction Model (Gradient Boosting)
        Predicts probability of profit vs loss
        """
        logger.info("\n" + "="*80)
        logger.info(f"MODEL 1: DIRECTION MODEL ({split_name})")
        logger.info("="*80)
        logger.info("\nTarget: label_direction (0=loss first, 1=profit first)")
        logger.info("Algorithm: LightGBM Gradient Boosting")
        
        # Train LightGBM model
        logger.info("\nTraining LightGBM...")
        model = lgb.LGBMClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.05,
            num_leaves=31,
            min_child_samples=100,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbose=-1
        )
        
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        # Metrics
        metrics = self._calculate_metrics(y_test, y_pred, y_pred_proba, "Direction")
        
        # Feature importance
        self._plot_feature_importance(
            model, self.feature_cols, 
            f"Direction Model - Feature Importance ({split_name})",
            f"direction_importance_{split_name.replace(' ', '_')}.png"
        )
        
        # Confusion matrix
        self._plot_confusion_matrix(
            y_test, y_pred,
            f"Direction Model - Confusion Matrix ({split_name})",
            f"direction_confusion_{split_name.replace(' ', '_')}.png"
        )
        
        # ROC curve
        self._plot_roc_curve(
            y_test, y_pred_proba[:, 1],
            f"Direction Model - ROC Curve ({split_name})",
            f"direction_roc_{split_name.replace(' ', '_')}.png"
        )
        
        return model, metrics
    
    def train_volatility_model(self, X_train, y_train, X_test, y_test, split_name):
        """
        MODEL 2: Volatility Model (Random Forest)
        Predicts probability of volatility expansion
        """
        logger.info("\n" + "="*80)
        logger.info(f"MODEL 2: VOLATILITY MODEL ({split_name})")
        logger.info("="*80)
        logger.info("\nTarget: label_volatility (0=no expansion, 1=expansion)")
        logger.info("Algorithm: Random Forest")
        
        # Train Random Forest
        logger.info("\nTraining Random Forest...")
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=100,
            min_samples_leaf=50,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        # Metrics
        metrics = self._calculate_metrics(y_test, y_pred, y_pred_proba, "Volatility")
        
        # Feature importance
        self._plot_feature_importance(
            model, self.feature_cols,
            f"Volatility Model - Feature Importance ({split_name})",
            f"volatility_importance_{split_name.replace(' ', '_')}.png"
        )
        
        # Confusion matrix
        self._plot_confusion_matrix(
            y_test, y_pred,
            f"Volatility Model - Confusion Matrix ({split_name})",
            f"volatility_confusion_{split_name.replace(' ', '_')}.png"
        )
        
        return model, metrics
    
    def train_notrade_model(self, X_train, y_train, X_test, y_test, split_name):
        """
        MODEL 3: No-Trade Filter (Logistic Regression)
        Predicts probability of poor trading conditions
        """
        logger.info("\n" + "="*80)
        logger.info(f"MODEL 3: NO-TRADE FILTER ({split_name})")
        logger.info("="*80)
        logger.info("\nTarget: label_no_trade (0=trade OK, 1=no trade)")
        logger.info("Algorithm: Logistic Regression")
        
        # Train Logistic Regression
        logger.info("\nTraining Logistic Regression...")
        model = LogisticRegression(
            C=1.0,
            max_iter=1000,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        # Metrics
        metrics = self._calculate_metrics(y_test, y_pred, y_pred_proba, "No-Trade")
        
        # Feature importance (coefficients for logistic regression)
        self._plot_logistic_coefficients(
            model, self.feature_cols,
            f"No-Trade Filter - Feature Coefficients ({split_name})",
            f"notrade_coefficients_{split_name.replace(' ', '_')}.png"
        )
        
        # Confusion matrix
        self._plot_confusion_matrix(
            y_test, y_pred,
            f"No-Trade Filter - Confusion Matrix ({split_name})",
            f"notrade_confusion_{split_name.replace(' ', '_')}.png"
        )
        
        return model, metrics
    
    def _calculate_metrics(self, y_true, y_pred, y_pred_proba, model_name):
        """Calculate comprehensive metrics"""
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred, average='weighted', zero_division=0),
            'f1': f1_score(y_true, y_pred, average='weighted', zero_division=0)
        }
        
        # ROC AUC (if binary)
        if len(np.unique(y_true)) == 2:
            metrics['roc_auc'] = roc_auc_score(y_true, y_pred_proba[:, 1])
        
        # Print metrics
        logger.info(f"\n{model_name} Model Metrics:")
        logger.info(f"  Accuracy:  {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
        logger.info(f"  Precision: {metrics['precision']:.4f}")
        logger.info(f"  Recall:    {metrics['recall']:.4f}")
        logger.info(f"  F1 Score:  {metrics['f1']:.4f}")
        if 'roc_auc' in metrics:
            logger.info(f"  ROC AUC:   {metrics['roc_auc']:.4f}")
        
        # Classification report
        logger.info(f"\nClassification Report:")
        print(classification_report(y_true, y_pred, zero_division=0))
        
        return metrics
    
    def _plot_feature_importance(self, model, feature_names, title, filename):
        """Plot feature importance"""
        if hasattr(model, 'feature_importances_'):
            importance = model.feature_importances_
            
            # Get top 20 features
            indices = np.argsort(importance)[-20:]
            
            plt.figure(figsize=(10, 8))
            plt.barh(range(len(indices)), importance[indices])
            plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
            plt.xlabel('Importance')
            plt.title(title)
            plt.tight_layout()
            plt.savefig(self.models_dir / 'plots' / filename, dpi=150, bbox_inches='tight')
            plt.close()
            
            logger.info(f"\n  ✓ Feature importance plot saved: {filename}")
    
    def _plot_logistic_coefficients(self, model, feature_names, title, filename):
        """Plot logistic regression coefficients"""
        if hasattr(model, 'coef_'):
            coef = model.coef_[0]
            
            # Get top 20 by absolute value
            indices = np.argsort(np.abs(coef))[-20:]
            
            plt.figure(figsize=(10, 8))
            colors = ['red' if c < 0 else 'green' for c in coef[indices]]
            plt.barh(range(len(indices)), coef[indices], color=colors)
            plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
            plt.xlabel('Coefficient')
            plt.title(title)
            plt.axvline(x=0, color='black', linestyle='--', linewidth=0.5)
            plt.tight_layout()
            plt.savefig(self.models_dir / 'plots' / filename, dpi=150, bbox_inches='tight')
            plt.close()
            
            logger.info(f"\n  ✓ Coefficient plot saved: {filename}")
    
    def _plot_confusion_matrix(self, y_true, y_pred, title, filename):
        """Plot confusion matrix"""
        cm = confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plt.title(title)
        plt.tight_layout()
        plt.savefig(self.models_dir / 'plots' / filename, dpi=150, bbox_inches='tight')
        plt.close()
        
        logger.info(f"  ✓ Confusion matrix saved: {filename}")
    
    def _plot_roc_curve(self, y_true, y_pred_proba, title, filename):
        """Plot ROC curve"""
        fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
        auc = roc_auc_score(y_true, y_pred_proba)
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc:.3f})')
        plt.plot([0, 1], [0, 1], 'k--', label='Random')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(title)
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(self.models_dir / 'plots' / filename, dpi=150, bbox_inches='tight')
        plt.close()
        
        logger.info(f"  ✓ ROC curve saved: {filename}")
    
    def save_model(self, model, model_name, split_name, metrics):
        """Save trained model and metrics"""
        # Save model
        model_filename = f"{model_name}_{split_name.replace(' ', '_')}.pkl"
        model_path = self.models_dir / model_filename
        joblib.dump(model, model_path)
        logger.info(f"\n  ✓ Model saved: {model_filename}")
        
        # Save metrics
        metrics_filename = f"{model_name}_{split_name.replace(' ', '_')}_metrics.json"
        metrics_path = self.models_dir / 'metrics' / metrics_filename
        
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        logger.info(f"  ✓ Metrics saved: {metrics_filename}")
    
    def train_all_models(self):
        """Train all three models with walk-forward validation"""
        logger.info("\n" + "="*80)
        logger.info("MULTI-MODEL TRAINING SYSTEM")
        logger.info("="*80)
        
        # Load data
        self.load_data()
        
        # Create time splits
        splits = self.create_time_splits()
        
        # Train models for each split
        for split_idx, (train_idx, test_idx) in enumerate(splits, 1):
            split_name = f"Split_{split_idx}"
            
            logger.info("\n" + "="*80)
            logger.info(f"TRAINING ON {split_name.upper()}")
            logger.info("="*80)
            
            # Prepare data
            X_train = self.df.iloc[train_idx][self.feature_cols]
            X_test = self.df.iloc[test_idx][self.feature_cols]
            
            # Model 1: Direction
            y_train_dir = self.df.iloc[train_idx]['label_direction']
            y_test_dir = self.df.iloc[test_idx]['label_direction']
            
            model_dir, metrics_dir = self.train_direction_model(
                X_train, y_train_dir, X_test, y_test_dir, split_name
            )
            self.save_model(model_dir, 'direction_model', split_name, metrics_dir)
            
            # Model 2: Volatility
            y_train_vol = self.df.iloc[train_idx]['label_volatility']
            y_test_vol = self.df.iloc[test_idx]['label_volatility']
            
            model_vol, metrics_vol = self.train_volatility_model(
                X_train, y_train_vol, X_test, y_test_vol, split_name
            )
            self.save_model(model_vol, 'volatility_model', split_name, metrics_vol)
            
            # Model 3: No-Trade
            y_train_nt = self.df.iloc[train_idx]['label_no_trade']
            y_test_nt = self.df.iloc[test_idx]['label_no_trade']
            
            model_nt, metrics_nt = self.train_notrade_model(
                X_train, y_train_nt, X_test, y_test_nt, split_name
            )
            self.save_model(model_nt, 'notrade_model', split_name, metrics_nt)
            
            # Store results
            self.results[split_name] = {
                'direction': metrics_dir,
                'volatility': metrics_vol,
                'no_trade': metrics_nt
            }
        
        # Print final summary
        self._print_final_summary()
    
    def _print_final_summary(self):
        """Print comprehensive summary of all models"""
        logger.info("\n" + "="*80)
        logger.info("TRAINING COMPLETE - FINAL SUMMARY")
        logger.info("="*80)
        
        logger.info(f"\nModels trained: 3 models × {len(self.results)} splits = {len(self.results) * 3} total")
        logger.info(f"Models saved to: {self.models_dir}")
        logger.info(f"Plots saved to: {self.models_dir / 'plots'}")
        logger.info(f"Metrics saved to: {self.models_dir / 'metrics'}")
        
        # Summary table
        logger.info("\n" + "="*80)
        logger.info("MODEL PERFORMANCE SUMMARY")
        logger.info("="*80)
        
        for split_name, models in self.results.items():
            logger.info(f"\n{split_name}:")
            logger.info("-" * 80)
            
            for model_name, metrics in models.items():
                logger.info(f"\n  {model_name.upper()} Model:")
                logger.info(f"    Accuracy:  {metrics['accuracy']:.4f}")
                logger.info(f"    Precision: {metrics['precision']:.4f}")
                logger.info(f"    Recall:    {metrics['recall']:.4f}")
                logger.info(f"    F1 Score:  {metrics['f1']:.4f}")
                if 'roc_auc' in metrics:
                    logger.info(f"    ROC AUC:   {metrics['roc_auc']:.4f}")
        
        # Best models
        logger.info("\n" + "="*80)
        logger.info("BEST MODELS (by accuracy)")
        logger.info("="*80)
        
        for model_type in ['direction', 'volatility', 'no_trade']:
            best_split = max(self.results.items(), 
                           key=lambda x: x[1][model_type]['accuracy'])
            
            logger.info(f"\n{model_type.upper()}:")
            logger.info(f"  Best Split: {best_split[0]}")
            logger.info(f"  Accuracy: {best_split[1][model_type]['accuracy']:.4f}")
        
        logger.info("\n" + "="*80)
        logger.info("✓ ALL MODELS TRAINED SUCCESSFULLY!")
        logger.info("="*80)
        logger.info("\nNext steps:")
        logger.info("  1. Review plots in models/plots/")
        logger.info("  2. Check metrics in models/metrics/")
        logger.info("  3. Load models for prediction:")
        logger.info("     model = joblib.load('models/direction_model_Split_1.pkl')")
        logger.info("  4. Use models for live trading or backtesting")
        logger.info("="*80)


def main():
    """Main entry point"""
    # Setup paths
    data_dir = Path(__file__).parent.parent / 'data'
    training_file = data_dir / 'training_dataset.parquet'
    models_dir = Path(__file__).parent.parent / 'models'
    
    # Create trainer
    trainer = ModelTrainer(training_file, models_dir)
    
    # Train all models
    trainer.train_all_models()


if __name__ == '__main__':
    main()
