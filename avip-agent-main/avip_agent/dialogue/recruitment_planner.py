from __future__ import annotations

import json
import logging
import re
from avip_agent.openrouter import OpenRouterClient
from avip_agent.metadata import JobMetadata

logger = logging.getLogger(__name__)

def get_recruitment_system_prompt(meta: JobMetadata) -> str:
    candidate_name = meta.customer_name or "Saurabh"
    if meta.system_prompt and meta.system_prompt.strip():
        prompt = meta.system_prompt
        prompt = prompt.replace("[[customer_name]]", candidate_name)
        prompt = prompt.replace("[[candidate_name]]", candidate_name)
        if meta.custom_data:
            for k, v in meta.custom_data.items():
                prompt = prompt.replace(f"[[{k}]]", str(v))
        return prompt

    company_name = "Vedanova Solutions"
    job_title = "React & TypeScript Engineer"
    language = meta.language or "hi-IN"

    lang_instruction = ""
    if language.startswith("hi"):
        lang_instruction = (
            "IMPORTANT: The conversation language is Hindi/Hinglish (mix of Hindi and English). "
            "Please respond in warm, natural, and polite Hinglish or Hindi. "
            "For example: 'Hi Saurabh, main Meera baat kar rahi hoon Vedanova Solutions se. Kya yeh sahi samay hai baat karne ka?'"
        )
    else:
        lang_instruction = (
            "IMPORTANT: The conversation language is English. Please respond in warm, natural, and polite English."
        )

    return f"""You are **Meera**, an AI Recruitment Assistant calling on behalf of **{company_name}** regarding the candidate's application for the **{job_title}** position.

Your responsibility is to conduct an initial screening call, gather only job-related information, answer basic questions, and determine whether the candidate should move forward in the hiring process.

You are **not** the hiring manager and **do not make hiring decisions**.

Candidate Name: {candidate_name}
Company Name: {company_name}
Job Title: {job_title}

{lang_instruction}

# IMPORTANT: Handling STT Transcription Errors
The speech-to-text system may occasionally produce garbled, phonetic, or broken text (e.g. "Mayor speak", "haan ji", "theek hai", mixed scripts). 
- NEVER end the call because of garbled or unclear text.
- Try to interpret the candidate's intent from context. If unclear, politely ask them to repeat.
- Do NOT trigger LANGUAGE_CALLBACK based on garbled transcription.
- Only use LANGUAGE_CALLBACK if the candidate EXPLICITLY and CLEARLY asks to speak in a completely different language (e.g. "Please call me in Tamil" or "Can we speak in Gujarati?").

# Objectives
1. Confirm you are speaking with the correct candidate ({candidate_name}).
2. Check whether it is a convenient time to talk. If they are busy or not available, you must immediately stop the screening process, ask for their callback availability, ask if they have any quick questions about the role or process, and conclude.
3. If they are available, continue with the screening questions (experience, current role, notice period, location, compensation).
4. Capture screening information (experience, notice period, skills, location, compensation).
5. Answer basic hiring-process questions.
6. Record the outcome.
7. End professionally.

# Tone & Style
- Warm, polite, conversational, and human.
- Do NOT sound scripted. Keep responses short and conversational.
- Ask only one question at a time.
- Allow candidates to speak naturally. Never interrupt.
- If a response seems unclear or garbled, simply say: "Sorry, I didn't catch that clearly. Could you repeat that?"

# Conversation States & Outcomes
1. **Wrong Person**: If not speaking with the candidate, say: "Sorry for the inconvenience. Thank you for your time."
   Output call outcome as WRONG_NUMBER and set ready_to_close = true.
2. **Busy / Callback**: If the candidate says they are not available, busy, driving, or can't talk right now:
   - Ask: "Certainly. What would be a convenient date and time for me to call you back? Also, do you have any quick questions about the role or the process before we reschedule?"
   - Listen to their availability and note any questions they ask. Answer their questions briefly and politely.
   - Conclude by saying: "Perfect. I'll arrange for another call. Thank you and have a great day."
   - Output call outcome as CALLBACK_REQUESTED, set ready_to_close = true, and save the candidate's preferred callback time in callback_time.
3. **No Longer Interested**: If candidate is not interested or wants to withdraw:
   Say: "Thank you for letting me know. I appreciate your time. I'll update your application accordingly. Have a wonderful day."
   Output call outcome as WITHDRAWN and set ready_to_close = true.
4. **Different Language Request**: ONLY if the candidate explicitly and clearly asks to be called in a completely different language (e.g. Tamil, Gujarati, Marathi):
   Say: "Certainly. We can arrange another call in your preferred language. Which language would you prefer?"
   Output call outcome as LANGUAGE_CALLBACK and set ready_to_close = true.
   DO NOT use this outcome for Hindi/Hinglish responses, garbled text, or any unclear utterance.
5. **Screening Completed**: Once you have gone through the questions (experience, current role, skills, notice period, location/relocation, compensation, availability, candidate questions):
   Say: "Thank you for taking the time to speak with me today. Our recruitment team will review your information and contact you regarding the next steps. Have a great day."
   Output call outcome as SCREENING_COMPLETED and set ready_to_close = true.

# Compensation Rules
- Ask: "Would you mind sharing your current compensation?" and "What are your expectations?"
- Never negotiate. Never comment. Never promise.
- If candidate asks "What salary are you offering?", respond: "The recruiter will discuss compensation in detail during the next stage of the hiring process." Never mention numbers.

# Prohibited Topics
Never ask about age, gender, religion, marital status, children, pregnancy, political views, nationality, medical conditions, disability, caste, race, sexual orientation, or family planning.

# Output Format
You MUST respond in JSON format ONLY. Do not wrap your response in markdown code blocks.
Response JSON structure:
{{
  "reply": "your conversational response to the candidate",
  "ready_to_close": true/false,
  "outcome": "SCREENING_COMPLETED" | "CALLBACK_REQUESTED" | "WRONG_NUMBER" | "WITHDRAWN" | "LANGUAGE_CALLBACK" | null,
  "callback_time": "date/time string if outcome is CALLBACK_REQUESTED, otherwise null"
}}
"""

async def plan_recruitment_turn(
    llm: OpenRouterClient,
    chat_history: list[dict[str, str]],
    meta: JobMetadata,
) -> tuple[str, bool, str | None, str | None]:
    """
    Orchestrates turn-by-turn dialogue generation for the recruitment pre-screening scenario.
    Returns:
        reply (str): Response text to speak.
        ready_to_close (bool): True if call should end now.
        outcome (str | None): Outcome code (e.g. 'SCREENING_COMPLETED', 'CALLBACK_REQUESTED').
        callback_time (str | None): Inferred callback time.
    """
    system_prompt = get_recruitment_system_prompt(meta)

    # Ensure JSON formatting instructions are always appended if not present
    if "JSON" not in system_prompt or "Response JSON structure" not in system_prompt:
        system_prompt += "\n\n" + """# Output Format
You MUST respond in JSON format ONLY. Do not wrap your response in markdown code blocks.
Response JSON structure:
{
  "reply": "your conversational response to the candidate",
  "ready_to_close": true/false,
  "outcome": "SCREENING_COMPLETED" | "CALLBACK_REQUESTED" | "WRONG_NUMBER" | "WITHDRAWN" | "LANGUAGE_CALLBACK" | null,
  "callback_time": "date/time string if outcome is CALLBACK_REQUESTED, otherwise null"
}"""

    # Format transcript
    transcript_lines = []
    agent_name = meta.agent_name or "Meera"
    for msg in chat_history:
        role = agent_name if msg["role"] == "assistant" else "Candidate"
        transcript_lines.append(f"{role}: {msg['content']}")
    transcript_str = "\n".join(transcript_lines)

    user_prompt = (
        f"Conversation history:\n{transcript_str}\n\n"
        f"Generate the next response from {agent_name} in JSON format."
    )

    try:
        raw_response = await llm.chat(system_prompt, user_prompt)
        raw_response = raw_response.strip()
        logger.info("[agent] OpenRouter raw response: %r", raw_response)
        
        # Strip markdown json code blocks if present
        raw_response = re.sub(r"^```(?:json)?", "", raw_response).strip()
        raw_response = re.sub(r"```$", "", raw_response).strip()

        data = json.loads(raw_response)
        
        reply = str(data.get("reply") or "").strip()
        ready_to_close = bool(data.get("ready_to_close"))
        outcome = data.get("outcome")
        if outcome:
            outcome = str(outcome).strip()
        callback_time = data.get("callback_time")
        if callback_time:
            callback_time = str(callback_time).strip()

        logger.info("[agent] Parsed response reply=%r ready_to_close=%s outcome=%s", reply, ready_to_close, outcome)
        return reply, ready_to_close, outcome, callback_time
    except Exception as exc:
        logger.error("[agent] Error in plan_recruitment_turn: %s. Falling back to plain LLM. raw_response was: %r", exc, raw_response if 'raw_response' in locals() else None)
        # Fallback to plain text chat if JSON parsing fails
        try:
            raw_text = await llm.chat(
                system_prompt + "\n\nProvide plain text response only.",
                f"Conversation history:\n{transcript_str}\n\nNext response:"
            )
            # Simple heuristic checks
            ready_to_close = False
            outcome = None
            callback_time = None
            
            lower_raw = raw_text.lower()
            if any(h in lower_raw for h in ["have a great day", "thank you for your time", "recruitment team will review"]):
                ready_to_close = True
                outcome = "SCREENING_COMPLETED"
            elif "convenient date and time" in lower_raw or "call you back" in lower_raw:
                # In progress of scheduling callback, but not closed yet unless we have the time
                pass
            
            return raw_text.strip(), ready_to_close, outcome, callback_time
        except Exception as fallback_exc:
            logger.error("Fallback LLM chat failed: %s", fallback_exc)
            return "Sorry, can you repeat that?", False, None, None


async def extract_recruitment_details(
    llm: OpenRouterClient,
    chat_history: list[dict[str, str]],
    meta: JobMetadata,
    final_outcome: str | None = None,
    final_callback_time: str | None = None,
) -> str:
    """
    Extracts screening details from the conversation history and formats them as a JSON string
    matching the ATS/CRM expectations of the platform.
    """
    transcript_lines = []
    agent_name = meta.agent_name or "Meera"
    for msg in chat_history:
        role = agent_name if msg["role"] == "assistant" else "Candidate"
        transcript_lines.append(f"{role}: {msg['content']}")
    transcript_str = "\n".join(transcript_lines)

    system_prompt = (
        "You are an ATS database parser. Analyze the screening interview transcript and extract the candidate details.\n"
        "Return a JSON object containing the exact fields requested. "
        "Keep values concise and precise. If a field was not discussed or mentioned, set it to null."
    )

    user_prompt = f"""Conversation transcript:
{transcript_str}

Please extract candidate screening information into a JSON object with these exact keys:
- "candidate_name" (Candidate's name, e.g. Saurabh)
- "phone" (Candidate's phone number if mentioned)
- "email" (Candidate's email if mentioned)
- "years_of_experience" (Number of years, e.g. "5 years" or null)
- "current_company" (Name of current company or null)
- "current_role" (Current job title or null)
- "primary_skills" (List or description of skills, e.g. "React, TypeScript" or null)
- "current_location" (City/state or null)
- "relocation" ("Yes" or "No" or null)
- "notice_period" (Notice period duration, e.g. "30 days" or null)
- "current_compensation" (Current salary if mentioned or null)
- "expected_compensation" (Expected salary if mentioned or null)
- "interview_availability" (Availability for interview or null)
- "candidate_questions" (Key questions candidate asked or null)
- "call_outcome" (Overall call outcome, choose exactly one: "SCREENING_COMPLETED", "CALLBACK_REQUESTED", "WRONG_NUMBER", "WITHDRAWN", "LANGUAGE_CALLBACK", "CALL_DISCONNECTED", "FAILED")
- "callback_time" (Date/time provided by candidate if CALLBACK_REQUESTED, else null)
- "agent_notes" (A brief operational summary or evaluation of the candidate)
- "summary" (A concise 1-sentence summary of the conversation outcome)

Return ONLY valid JSON.
"""
    try:
        raw_response = await llm.chat(system_prompt, user_prompt)
        raw_response = raw_response.strip()
        raw_response = re.sub(r"^```(?:json)?", "", raw_response).strip()
        raw_response = re.sub(r"```$", "", raw_response).strip()
        
        # Verify it parses as JSON
        data = json.loads(raw_response)
        
        # Ensure outcome and callback_time match what was decided during the call if not already set
        if not data.get("call_outcome") and final_outcome:
            data["call_outcome"] = final_outcome
        if not data.get("callback_time") and final_callback_time:
            data["callback_time"] = final_callback_time
            
        # Re-serialize to clean JSON string
        return json.dumps(data)
    except Exception as exc:
        logger.error("Failed to extract recruitment details: %s", exc)
        # Manual fallback dictionary
        fallback_data = {
            "candidate_name": meta.customer_name or "Saurabh",
            "phone": None,
            "email": None,
            "years_of_experience": None,
            "current_company": None,
            "current_role": None,
            "primary_skills": None,
            "current_location": None,
            "relocation": None,
            "notice_period": None,
            "current_compensation": None,
            "expected_compensation": None,
            "interview_availability": None,
            "candidate_questions": None,
            "call_outcome": final_outcome or "SCREENING_COMPLETED",
            "callback_time": final_callback_time,
            "agent_notes": "Extraction failed, falling back to basic metadata.",
            "summary": "Screening completed. See transcript for details."
        }
        return json.dumps(fallback_data)
