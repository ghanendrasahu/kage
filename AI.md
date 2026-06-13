# KAGE AI System

## Overview

KAGE uses a multi-agent AI architecture for research and outreach generation. Each agent has a specific role, structured input/output schemas, and validation.

## Agent Pipeline

```
User Input
    ↓
Research Planner (gpt-4o-mini)
    ↓
Researcher (gpt-4o)
    ↓
Signal Analyst (gpt-4o-mini)
    ↓
Personalization Agent (gpt-4o-mini)
    ↓
Outreach Writer (gpt-4o)
    ↓
Critic (gpt-4o)
    ↓
Compliance Review (gpt-4o-mini)
    ↓
Human Review
    ↓
Approved → Send
```

## Agents

### Research Planner

**Purpose**: Creates a research plan for investigating a target company.

**Input**:
- Company name
- Company domain (optional)
- Target persona (optional)
- Product/service (optional)

**Output**:
- Search queries
- Websites to check
- News topics
- Data points to collect

**Model**: gpt-4o-mini
**Temperature**: 0.3

### Researcher

**Purpose**: Analyzes raw research findings and extracts structured data.

**Input**:
- Research plan
- Raw content from sources

**Output**:
- Categorized findings with confidence scores

**Model**: gpt-4o
**Temperature**: 0.5

### Signal Analyst

**Purpose**: Identifies business signals and pain points.

**Input**:
- Raw findings
- Company name and industry

**Output**:
- Business signals (funding, hiring, expansion, etc.)
- Pain points
- Opportunities
- Personalization angles

**Model**: gpt-4o-mini
**Temperature**: 0.4

### Personalization Agent

**Purpose**: Scores the opportunity and determines personalization angles.

**Input**:
- Company and person information
- Signals, pain points, opportunities
- Product/service being sold

**Output**:
- Fit Score (0-100)
- Trigger Score (0-100)
- Personalization Score (0-100)
- Confidence Score (0-100)
- Overall Opportunity Score
- Reasoning

**Model**: gpt-4o-mini
**Temperature**: 0.5

### Outreach Writer

**Purpose**: Generates personalized email and LinkedIn messages.

**Input**:
- Company and person information
- Signals, pain points, opportunities
- Personalization angles
- Opportunity scores
- Product/service and sales context

**Output**:
- 5 email variants
- 5 LinkedIn message variants
- Follow-up sequence
- Warnings

**Model**: gpt-4o
**Temperature**: 0.7

### Critic

**Purpose**: Quality control for generated messages.

**Input**:
- Generated message
- Recipient information

**Output**:
- Scores (0-10) for: personalization, specificity, clarity, accuracy, value, tone, CTA quality, spamminess
- Overall score
- Feedback
- Warnings

**Model**: gpt-4o
**Temperature**: 0.3

### Compliance Review

**Purpose**: Ensures messages comply with legal and ethical standards.

**Input**:
- Generated message
- Recipient information

**Output**:
- Approved (boolean)
- Issues found
- Suggestions

**Model**: gpt-4o-mini
**Temperature**: 0.2

## Prompt Management

All prompts are versioned and stored in `packages/ai/src/prompts/manager.ts`.

Each prompt includes:
- Name
- Version
- Model
- Temperature
- System prompt

## Structured Output

All agents use Zod schemas for output validation. This ensures:
- Type safety
- Deterministic output format
- Easy debugging
- Reproducibility

## Security

### Prompt Injection Defense

Research content is treated as UNTRUSTED DATA:
- System instructions are never overridden
- Content is sanitized before AI processing
- Agents are instructed to ignore instructions in research data

### Token Budgets

Each agent has a token budget:
- Research Planner: 2000 tokens
- Researcher: 4000 tokens
- Signal Analyst: 3000 tokens
- Personalization: 2000 tokens
- Writer: 3000 tokens
- Critic: 2000 tokens
- Compliance: 1500 tokens

## Cost Control

AI usage is tracked per organization:
- Model used
- Input/output tokens
- Estimated cost
- Latency
- Success/failure

Usage limits are configurable per plan.

## Testing

### Prompt Regression Tests

- Test dataset with realistic fictional companies
- Automated quality scoring
- Regression detection on prompt changes

### Evaluation Metrics

- Factual accuracy
- Personalization quality
- Relevance
- Clarity
- Tone
- CTA effectiveness
- Spamminess
- Hallucination rate
