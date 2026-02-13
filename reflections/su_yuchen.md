# Literature Notes

---

## 📄 Paper 1  
### *Audio–visual deepfake detection using articulatory representation learning*

**Full Citation**  
Wang, Y., & Huang, H. (2024). *Audio–visual deepfake detection using articulatory representation learning.*  
Computer Vision and Image Understanding, 248, 104133.  
https://doi.org/10.1016/j.cviu.2024.104133

---

### Summary

This paper addresses the challenge of detecting audio–visual deepfakes by modeling physiological correlations between speech articulation and lip movement. The authors propose ART-AVDF, a framework that learns articulatory representations through a self-supervised audio encoder and lip encoder. Rather than relying solely on unimodal inconsistencies, the method captures cross-modal articulatory correspondence as a detection signal. The model integrates articulatory embeddings into a multimodal fusion module to improve robustness against sophisticated manipulations. Experimental results across multiple benchmark datasets demonstrate improved performance over several existing baselines.

---

### Insights Learned

- Physiological-level representations can provide robust detection signals beyond surface artifacts  
- Cross-modal consistency modeling is critical for identifying increasingly realistic deepfakes  
- Representation learning plays a central role in improving generalization across manipulation types

---

### Limitations / Risks

- The approach remains inherently reactive, emphasizing post-generation detection rather than analyzing the mechanisms underlying misuse or adversarial strategies  
- Similar to much of the deepfake literature, this work primarily focuses on machine learning and deep learning-based detection models, offering limited discussion on structured knowledge systems, incident intelligence, or systematic modeling of exploitation behaviors

---

### Concrete Idea for Our Project

Rather than improving detection accuracy, our project can capture and systematize failure patterns, guardrail bypass techniques, and misuse strategies, addressing gaps beyond model-centric detection research.

---

---

## 📄 Paper 2  
### *Deepfake Detection: A Systematic Literature Review*

**Full Citation**  
Rana, M. S., Nobi, M. N., Murali, B., & Sung, A. H. (2022). *Deepfake Detection: A Systematic Literature Review.*  
IEEE Access, 10, 25494–25520.  
https://doi.org/10.1109/ACCESS.2022.3154404

---

### Summary

This paper presents a systematic literature review of deepfake detection methods, analyzing prior studies across multiple methodological categories. The authors classify detection techniques into deep learning-based, classical machine learning-based, statistical, and blockchain-based approaches. The review highlights the dominance of deep learning methods in achieving superior detection performance. It also surveys datasets, evaluation metrics, and research trends within the field. Overall, the study provides a structured overview of detection paradigms but primarily reflects model-centric mitigation perspectives.

---

### Insights Learned

- Deepfake research is heavily oriented toward detection performance and benchmarking  
- The field evolves through an adversarial arms race between generation and detection  
- Limited emphasis is placed on structured threat intelligence or systematic failure modeling

---

### Limitations / Risks

- The review centers on detection methodologies and performance comparisons, with limited attention to generative misuse strategies or exploitation workflows  
- Consistent with the surveyed literature, the paper reflects the field’s dominant focus on machine learning and deep learning-based detection models, leaving gaps in structured knowledge systems, vulnerability tracking, and systematic documentation of safety failures

---

### Concrete Idea for Our Project

Our project can complement detection research by functioning as intelligence infrastructure, capturing adversarial tactics, guardrail failures, and misuse patterns rather than classifier performance metrics.
