# Machine Learning & AI Fundamentals

## Summary
Machine learning algorithms extract predictive statistical representations from data. Understanding training mechanics, loss functions, regularization, and model evaluation metrics is essential for modern AI engineering.

## Key Concepts
- **Learning Paradigms**: Supervised (regression, classification), Unsupervised (clustering, dimensionality reduction PCA), Reinforcement Learning.
- **Bias-Variance Tradeoff**: High bias = Underfitting (model too simple); High variance = Overfitting (model memorizes noise). Addressed with L1 (Lasso) / L2 (Ridge) regularization and cross-validation.
- **Optimization & Loss**: Gradient Descent, Stochastic Gradient Descent (SGD), Adam optimizer, Mean Squared Error (MSE), Cross-Entropy Loss.
- **Evaluation Metrics**: Precision, Recall, F1-score, ROC-AUC curve, Confusion Matrix, and Data Leakage prevention.

## Worked Example: Train-Validation Split and Pipeline with Scikit-Learn
```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

def train_baseline_classifier(X, y):
    # Prevent data leakage by fitting scaler only on training partition
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_scaled, y_train)

    predictions = model.predict(X_test_scaled)
    print(classification_report(y_test, predictions))
    return model, scaler
```

## Common Interview Questions
1. *What is the difference between Precision and Recall?* (Precision = True Positives / (True Positives + False Positives), measuring accuracy of positive predictions; Recall = True Positives / (True Positives + False Negatives), measuring coverage of actual positives).
2. *Why does L1 regularization create sparse weights while L2 shrinks them smoothly?* (L1 penalty is proportional to absolute weight $|w|$, whose diamond-shaped constraint boundary hits coordinate axes at zero; L2 penalty is proportional to $w^2$, whose spherical boundary pulls weights toward zero without setting them exactly to zero).
3. *What is Data Leakage and how do you prevent it?* (Data leakage occurs when information from outside the training dataset, such as test set statistics during scaling or future timestamps, inadvertently enters model training).

## Documentation & Official Resources
- [Scikit-Learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Deep Learning Book - Goodfellow, Bengio, Courville](https://www.deeplearningbook.org/)
