# Offline Evaluation Report

- **Date:** 2026-10-17
- **Jev Model Pinned:** `jev-1.13-20260917`
- **Execution Mode:** Deterministic Offline Cache
- **Total Queries:** 40 (30 Dev, 10 Held-out)
- **Fallback Rate:** 67.5% (27/40)
- **Latency (p50 / p95):** 25 ms / 147 ms
- **Inter-Rater Reliability (20% sample):** κ = 0.864 (percent agreement: 90.0%, n = 40)

---

## 1. Overall Performance Metrics

| Metric | Condition A (Baseline Stage 1) | Condition B (Treatment Stage 2) | Difference (B - A) [95% Bootstrap CI] |
| :--- | :--- | :--- | :--- |
| **NDCG@5** | 0.8853 | 0.8873 | **+0.0020** [0.0000, 0.0047] |
| **MRR@5** | 0.8000 | 0.8000 | **+0.0000** [0.0000, 0.0000] |
| **Recall@10** | 1.0000 | 1.0000 | — (Equal by construction) |

*(Queries excluded from NDCG@5 due to 0 relevant items: 1)*

---

## 2. Performance by Dataset Split

| Split | Count | NDCG@5 (A) | NDCG@5 (B) | NDCG@5 Δ [95% CI] | MRR@5 (A) | MRR@5 (B) | MRR@5 Δ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dev** | 30 | 0.8878 | 0.8904 | +0.0026 [0.0000, 0.0061] | 0.8167 | 0.8167 | +0.0000 |
| **Held-out** | 10 | 0.8771 | 0.8771 | +0.0000 [0.0000, 0.0000] | 0.7500 | 0.7500 | +0.0000 |

---

## 3. Performance by Query Type

| Query Type | Count | NDCG@5 (A) | NDCG@5 (B) | NDCG@5 Δ | MRR@5 (A) | MRR@5 (B) | MRR@5 Δ | Recall@10 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Direct Service** | 10 | 0.8379 | 0.8423 | +0.0044 | 0.9000 | 0.9000 | +0.0000 | 1.0000 |
| **Symptom First** | 10 | 0.8540 | 0.8540 | +0.0000 | 0.7500 | 0.7500 | +0.0000 | 1.0000 |
| **Constraint Heavy** | 10 | 0.9370 | 0.9370 | +0.0000 | 0.5500 | 0.5500 | +0.0000 | 1.0000 |
| **Specificity** | 10 | 0.9176 | 0.9210 | +0.0034 | 1.0000 | 1.0000 | +0.0000 | 1.0000 |

---

## 4. Production Decision Rule (PRD Section 17.6)

- Held-out NDCG@5 of B >= A: **YES**
- Fallback rate < 5%: **NO** (67.5%)
- Latency target p95 < 800ms: **YES** (147 ms)

**Conclusion:** Production criteria not fully satisfied. Keep RERANK_ENABLED=false by default.
