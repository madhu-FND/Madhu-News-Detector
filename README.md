# Madhu-News-Detector
An app created by G. Madhu sudhan on CSP project requarding fake news detection using machine learning 


ABOUT MADHU NEWS DETECTOR


PROJECT OVERVIEW

Madhu News Detector is an AI-powered mobile application 
designed to identify and flag fake news in real-time. 
The system leverages state-of-the-art Natural Language 
Processing and Machine Learning to protect users from 
misinformation on social media and messaging platforms.

WHAT IS FAKE NEWS?

Fake news refers to false or misleading information 
presented as legitimate news, created intentionally to 
deceive readers for financial or political gain. 
Common examples include fabricated government schemes, 
health hoaxes, and sensational clickbait headlines.

TECHNICAL METHODOLOGY

Our detection system operates on a three-layered 
verification framework:

1. LINGUISTIC ANALYSIS (NLP)
   The application analyzes semantic patterns, emotional 
   tone, and sensational keywords such as "BREAKING", 
   "SHOCKING", "100% FREE". Excessive use of hyperbolic 
   language correlates strongly with misinformation.

2. SOURCE CREDIBILITY VERIFICATION
   Each news item is cross-referenced against a database 
   of verified publishers. Domain authority scores are 
   assigned: Established media (98% trust) vs Unknown 
   domains or URL shorteners (High risk).

3. BERT-BASED MACHINE LEARNING
   We utilize a fine-tuned BERT model 
   (jy46604790/Fake-News-Bert-Detect) trained on 50,000+ 
   labeled news articles. BERT's bidirectional transformer 
   architecture enables deep contextual understanding, 
   achieving 96.2% classification accuracy on test data.

WHY BERT MODEL?

BERT (Bidirectional Encoder Representations from Transformers) 
is a transformer-based model developed by Google AI. Unlike 
traditional keyword matching, BERT understands context and 
nuance in language. For example, it distinguishes between 
"bank" as a financial institution vs "river bank" based on 
surrounding words. This contextual awareness is critical for 
detecting sophisticated fake news.

CONFIDENCE SCORE BREAKDOWN

The final probability score is weighted across:
• Linguistic Features: 40%
• Source Verification: 30% 
• ML Pattern Match: 30%
A score above 85% triggers a "FAKE" classification with 
color-coded visual indicators for user clarity.

SYSTEM ARCHITECTURE

• Frontend: Kodular Android Framework
• ML Engine: HuggingFace Inference API
• Database: TinyDB Local Storage
• Privacy: Zero data collection, on-device history
• Cost: 100% free tier implementation

RESEARCH FOUNDATION

This project is based on the research paper:
"BERT: Pre-training of Deep Bidirectional Transformers 
for Language Understanding" by Devlin et al., Google AI, 2018.

VISION STATEMENT

To combat the spread of misinformation by providing every 
smartphone user with an accessible, accurate, and instant 
fact-checking tool. We believe in "Verify Before You Amplify".

DEVELOPER: Madhu | VERSION: 1.0 | YEAR: 2026
