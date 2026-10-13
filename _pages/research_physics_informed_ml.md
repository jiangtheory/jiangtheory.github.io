---
layout: research
title: Physics-informed machine learning
permalink: /research/physics-informed-ml/
description: Learning from data while using physical understanding to build useful and interpretable models.
nav: false
research_topic: true
research_label: Physics-informed ML
research_order: 3
research_sections:
  - title: Why it matters
    id: why-it-matters
  - title: What physics-informed means
    id: what-it-means
  - title: Our approach
    id: our-approach
  - title: What students learn
    id: student-learning
  - title: Published starting points
    id: published-work
---

## Why it matters {#why-it-matters}

Materials data can be expensive to obtain, and a model may be asked to make predictions for molecules or conditions it has not seen before. A good fit to existing data does not automatically make those predictions reliable.

We ask how **physical understanding can help machine learning describe materials and support design**. The goal is to connect predictive performance with a meaningful explanation of the system and a clear account of the model's limits.

## What physics-informed means {#what-it-means}

Physics can enter a model in several ways. It can guide how we represent a molecule, the relationships a model is built to respect, the quantities it learns, and the tests used to evaluate its predictions.

For example, a polymer's connectivity matters: molecules with similar composition can have different architectures and different behavior. Representing that structure gives a model information that a simple composition label may miss.

Physics-informed machine learning is a broad approach. It includes models guided by physical descriptors, molecular graphs, constraints, or known relationships; it is not limited to one neural-network method.

## Our approach {#our-approach}

Our published work connects **polymer physics, graph-based learning, generative models, and molecular simulation**. These tools help us study structure-property relationships and explore material choices.

We also pay attention to validation. Testing on genuinely different structures or conditions can reveal limitations that a random split of closely related samples would miss. Physical consistency, uncertainty, and comparison with simpler models help us judge whether a prediction is useful.

## What students learn {#student-learning}

Students learn to formulate a prediction task, represent molecular structure, build a baseline model, and design a meaningful validation strategy. You develop skills in **scientific programming, statistical learning, physical reasoning, and reproducible analysis**.

The most useful question is often: _What has the model learned, and what evidence would convince us that it can generalize?_ These habits support our work in [energy]({{ '/research/energy/' | relative_url }}), [sustainability]({{ '/research/sustainability/' | relative_url }}), and [manufacturing]({{ '/research/manufacturing/' | relative_url }}).

## Published starting points {#published-work}

<div class="research-reading" markdown="1">

[Physics-guided neural networks for transferable property prediction in architecturally diverse copolymers](https://doi.org/10.1021/acs.macromol.5c00720) · _Macromolecules_, 2025.

A published example of connecting polymer physics with machine learning for property prediction across molecular architectures.

</div>

<div class="research-reading" markdown="1">

[Accelerating multicomponent phase-coexistence calculations with physics-informed neural networks](https://doi.org/10.1039/D4ME00168K) · _Molecular Systems Design & Engineering_, 2025.

A study linking physical thermodynamic relationships with neural-network modeling of phase coexistence.

</div>
