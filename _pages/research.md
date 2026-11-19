---
layout: research
title: research
heading: Research
permalink: /research/
description: >-
  We use molecular simulation and physical theory to understand soft materials. Our research also examines how physical knowledge and representation influence machine learning.
nav: true
nav_order: 1
---

## Soft materials for energy dominance {#energy-dominance}

<figure class="research-figure"><img src="{{ '/assets/img/research/energy.jpg' | relative_url }}" alt="Polymer electrolyte between a lithium-metal anode and a layered cathode, with lithium ions and anions dispersed among the polymer chains" width="1440" height="960" loading="lazy"></figure>

Polymer electrolytes and membranes must support transport while maintaining mechanical integrity and stability. Their behavior depends on how mobile species interact with their surroundings and how the material reorganizes over time. Molecular interactions, chain motion, and the arrangement of different components influence these coupled properties.

We study the molecular origins of transport and material response. How do local interactions and polymer dynamics control the movement of ions and molecules? How does molecular organization affect mechanical behavior? What determines whether a material maintains its properties under operating conditions?

Molecular simulation and physical theory help resolve these relationships across different structures and conditions. The aim is to understand the physical factors that govern performance in energy storage and conversion.

## Soft materials for the circular economy {#circular-economy}

<figure class="research-figure"><img src="{{ '/assets/img/research/interface.jpg' | relative_url }}" alt="Two polymer layers peeling apart while diblock copolymer chains bridge the interface" width="1440" height="960" loading="lazy"></figure>

Keeping polymers in use requires understanding how their structure and properties change during recovery and reuse. Plastic waste contains mixtures of polymers, additives, and contaminants. Incompatible polymers can form weak interfaces, while heat and shear during reprocessing can change polymer chains. These effects influence the quality and possible uses of recovered materials.

We study how composition, molecular interactions, and processing history affect polymer behavior. What determines whether components mix or separate? How do interfaces influence the mechanical properties of a mixture? How do changes in chain structure affect flow and performance after reprocessing? These questions provide a physical basis for evaluating recovered polymers and understanding how to preserve their usefulness over successive cycles.

## Physics-informed machine learning {#physics-informed-ml}

<figure class="research-figure"><img src="{{ '/assets/img/research/piml.jpg' | relative_url }}" alt="Polymer architectures feed a neural network guided by physical knowledge, which predicts a trade-off between two properties" width="1440" height="960" loading="lazy"></figure>

Our research asks how physical knowledge should enter a learning model and how that choice depends on the representation of the system and the available data.

We investigate physics-informed surrogates and hybrid models, constraints on learned behavior, and physical relationships used as prior knowledge. These approaches introduce different assumptions. We examine which relationships should be imposed, which should be learned, and how much flexibility a model needs when the available physical description is incomplete.

Representation is central to this investigation. The variables and structural information used to describe a system determine which distinctions a model can make. We study what a representation preserves or omits, and how it interacts with physical constraints and priors.

We are particularly interested in low-data regimes, where measurements or simulations are expensive. The goal is to understand which combinations of representation and physical guidance improve learning, and when modeling assumptions limit it.
