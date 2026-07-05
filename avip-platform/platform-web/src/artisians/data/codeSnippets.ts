export const codeSnippets: Record<string, string> = {
  curl: `<span class="tok-com"># Trigger an outbound call</span>
curl -X POST https://api.simform.ai/v1/calls \\
  -H <span class="tok-key">"Authorization"</span>: <span class="tok-str">"Bearer sk_live_***"</span> \\
  -H <span class="tok-key">"Content-Type"</span>: <span class="tok-str">"application/json"</span> \\
  -d '{
    <span class="tok-key">"agent_id"</span>: <span class="tok-str">"agt_outbound_42"</span>,
    <span class="tok-key">"to"</span>: <span class="tok-str">"+15550102938"</span>,
    <span class="tok-key">"variables"</span>: { <span class="tok-key">"first_name"</span>: <span class="tok-str">"Sarah"</span> }
  }'`,

  node: `<span class="tok-com">// Node.js — @simform/voice-sdk</span>
<span class="tok-key">import</span> { SimformVoice } <span class="tok-key">from</span> <span class="tok-str">'@simform/voice-sdk'</span>;

<span class="tok-key">const</span> client = <span class="tok-key">new</span> SimformVoice({ apiKey: <span class="tok-str">process.env.SIMFORM_KEY</span> });

<span class="tok-key">await</span> client.calls.create({
  agentId: <span class="tok-str">'agt_outbound_42'</span>,
  to: <span class="tok-str">'+15550102938'</span>,
  variables: { first_name: <span class="tok-str">'Sarah'</span> }
});`,

  python: `<span class="tok-com"># Python — simform-voice</span>
<span class="tok-key">from</span> simform_voice <span class="tok-key">import</span> Client

client = Client(api_key=<span class="tok-str">"sk_live_***"</span>)

client.calls.create(
    agent_id=<span class="tok-str">"agt_outbound_42"</span>,
    to=<span class="tok-str">"+15550102938"</span>,
    variables={<span class="tok-str">"first_name"</span>: <span class="tok-str">"Sarah"</span>}
)`,
};
