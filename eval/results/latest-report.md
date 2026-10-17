# Offline Evaluation Report

- **Date:** 2026-10-17
- **Jev Model Pinned:** `jev-1.13-20260917`
- **Execution Mode:** Deterministic Offline Cache
- **Total Queries:** 40 (30 Dev, 10 Held-out)
- **Fallback Rate:** 0.0% (0/40)
- **Latency (p50 / p95):** 18 ms / 98 ms
- **Inter-Rater Reliability (20% sample):** κ = 0.864 (percent agreement: 90.0%, n = 40)

---

## 1. Overall Performance Metrics

| Metric | Condition A (Baseline Stage 1) | Condition B (Treatment Stage 2) | Difference (B - A) [95% Bootstrap CI] |
| :--- | :--- | :--- | :--- |
| **NDCG@5** | 0.9493 | 1.0000 | **+0.0507** [0.0258, 0.0819] |
| **MRR@5** | 0.8187 | 0.8500 | **+0.0313** [0.0000, 0.0813] |
| **Recall@10** | 1.0000 | 1.0000 | — (Equal by construction) |

*(Queries excluded from NDCG@5 due to 0 relevant items: 1)*

---

## 2. Performance by Dataset Split

| Split | Count | NDCG@5 (A) | NDCG@5 (B) | NDCG@5 Δ [95% CI] | MRR@5 (A) | MRR@5 (B) | MRR@5 Δ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dev** | 30 | 0.9542 | 1.0000 | +0.0458 [0.0215, 0.0773] | 0.8417 | 0.8667 | +0.0250 |
| **Held-out** | 10 | 0.9330 | 1.0000 | +0.0670 [0.0118, 0.1473] | 0.7500 | 0.8000 | +0.0500 |

---

## 3. Performance by Query Type

| Query Type | Count | NDCG@5 (A) | NDCG@5 (B) | NDCG@5 Δ | MRR@5 (A) | MRR@5 (B) | MRR@5 Δ | Recall@10 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Direct Service** | 10 | 0.9323 | 1.0000 | +0.0677 | 0.9250 | 1.0000 | +0.0750 | 1.0000 |
| **Symptom First** | 10 | 0.9214 | 1.0000 | +0.0786 | 0.7500 | 0.8000 | +0.0500 | 1.0000 |
| **Constraint Heavy** | 10 | 0.9759 | 1.0000 | +0.0241 | 0.6000 | 0.6000 | +0.0000 | 1.0000 |
| **Specificity** | 10 | 0.9702 | 1.0000 | +0.0298 | 1.0000 | 1.0000 | +0.0000 | 1.0000 |

---

## 4. Production Decision Rule (PRD Section 17.6)

- Held-out NDCG@5 of B >= A: **YES**
- Fallback rate < 5%: **YES** (0.0%)
- Latency target p95 < 800ms: **YES** (98 ms)

**Conclusion:** Criteria satisfied for production Stage 2 deployment.
