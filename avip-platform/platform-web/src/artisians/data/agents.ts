import type { Agent } from '../types';

export const initialAgents: Agent[] = [
  {
    id: 'agt_1',
    name: 'Recruitment Pre-Screening — Sales Roles',
    type: 'outbound',
    template: 'Recruitment Pre-Screening',
    status: 'Active',
    calls: 3,
    conv: 2,
    created: 'Jun 21, 2026',
    color: '#FF5C73',
    contactFields: [
      { key: 'name', label: 'Full name', placeholder: 'Priya Sharma' },
      { key: 'phone', label: 'Phone number', placeholder: '+1 (415) 555-0001' },
      { key: 'email', label: 'Email', placeholder: 'priya@email.com' },
      { key: 'experience', label: 'Experience', placeholder: '3 yrs' }
    ],
    callTasks: [
      {
        id: 't1_1',
        contactName: 'Aisha Patel',
        contactPhone: '+1 (415) 555-0211',
        status: 'Completed',
        transcript: [
          { role: 'agent', text: "Hi Aisha, I'm calling from Simform regarding your application for the Sales Associate position. Do you have a few minutes for a quick pre-screen call?" },
          { role: 'user', text: "Yes, I do! Thanks for calling." },
          { role: 'agent', text: "Great. Can you confirm your notice period and location details?" },
          { role: 'user', text: "I have a 30-day notice period and am happy to relocate." },
          { role: 'agent', text: "Perfect, and what are your CTC expectations?" },
          { role: 'user', text: "I'm looking for around $90k." }
        ],
        summary: "Candidate confirmed local residency and a 30-day notice period. CTC expectation is $90k/yr.",
        actionItem: "Schedule deep-dive interview with the VP of Sales.",
        escalationRequired: false,
        customData: { email: 'aisha@email.com', experience: '3 yrs' }
      },
      {
        id: 't1_2',
        contactName: 'Marcus Johnson',
        contactPhone: '+1 (650) 555-0342',
        status: 'Completed',
        transcript: [
          { role: 'agent', text: "Hi Marcus, I'm calling from Simform regarding your application for the Sales Associate position. Do you have a few minutes?" },
          { role: 'user', text: "Yes, but I actually received another offer yesterday and have accepted it." },
          { role: 'agent', text: "Understood, thank you for letting us know, and congratulations on the new role!" }
        ],
        summary: "Candidate withdrew from the application loop after accepting another job offer.",
        actionItem: "Mark requisition file as inactive / closed in ATS.",
        escalationRequired: true,
        customData: { email: 'marcus@email.com', experience: '5 yrs' }
      },
      {
        id: 't1_3',
        contactName: 'Divya Sharma',
        contactPhone: '+1 (212) 555-0183',
        status: 'Completed',
        transcript: [
          { role: 'agent', text: "Hi Divya, I'm calling from Simform regarding your application for the Sales Associate position. Do you have a few minutes?" },
          { role: 'user', text: "Hi, yes. I have about 2 years of B2B sales experience." },
          { role: 'agent', text: "Excellent, and what are your availability and salary expectations?" },
          { role: 'user', text: "I can start immediately and am looking for $85k." }
        ],
        summary: "Candidate has 2 years of B2B sales experience. Immediately available. Salary expectations are $85k.",
        actionItem: "Pass resume to sales team leader for review.",
        escalationRequired: false,
        customData: { email: 'divya@email.com', experience: '2 yrs' }
      }
    ]
  },
  {
    id: 'agt_2',
    name: 'NPS Feedback — Q2 Delivery',
    type: 'outbound',
    template: 'Customer Feedback / NPS (transaction-linked)',
    status: 'Active',
    calls: 2,
    conv: 2,
    created: 'Jun 12, 2026',
    color: '#5C2D91',
    contactFields: [
      { key: 'name', label: 'Customer name', placeholder: 'Aisha Patel' },
      { key: 'phone', label: 'Phone number', placeholder: '+1 (650) 555-0198' },
      { key: 'email', label: 'Email', placeholder: 'aisha@email.com' },
      { key: 'service', label: 'Recent service', placeholder: 'Order Delivery' }
    ],
    callTasks: [
      {
        id: 't2_1',
        contactName: 'Aisha Patel',
        contactPhone: '+1 (415) 555-0211',
        status: 'Completed',
        transcript: [
          { role: 'agent', text: "Hello Aisha, this is Aria calling on behalf of Simform. We're conducting a quick follow-up about your recent Order Delivery. Do you have a minute?" },
          { role: 'user', text: "Yes, sure." },
          { role: 'agent', text: "On a scale of 0 to 10, how likely are you to recommend us?" },
          { role: 'user', text: "I'd say a 10! The package arrived early and in perfect shape." }
        ],
        summary: "Customer gave a perfect 10/10 rating. Extremely satisfied with packaging and early delivery.",
        actionItem: "Log promoter status in feedback CRM.",
        escalationRequired: false,
        customData: { email: 'aisha@email.com', service: 'Order Delivery' }
      },
      {
        id: 't2_2',
        contactName: 'Marcus Johnson',
        contactPhone: '+1 (650) 555-0342',
        status: 'Completed',
        transcript: [
          { role: 'agent', text: "Hello Marcus, this is Aria calling on behalf of Simform. We're conducting a quick follow-up about your recent Order Delivery." },
          { role: 'user', text: "I would rate it an 8. Delivery was fine but tracking updates were a bit delayed." }
        ],
        summary: "Customer rated 8/10. Indicated minor delay in tracking status syncs.",
        actionItem: "Send passive score follow-up template.",
        escalationRequired: false,
        customData: { email: 'marcus@email.com', service: 'Order Delivery' }
      }
    ]
  },
  {
    id: 'agt_3',
    name: 'Support Line — Tier 1',
    type: 'inbound',
    template: 'Customer Support Line',
    status: 'Active',
    calls: 5432,
    conv: 0,
    created: 'May 30, 2026',
    color: '#3E136B'
  },
  {
    id: 'agt_4',
    name: 'BANT Lead Qualification — SaaS',
    type: 'outbound',
    template: 'Lead Qualification (BANT-lite, scripted)',
    status: 'Active',
    calls: 2,
    conv: 1,
    created: 'Jul 2, 2026',
    color: '#F5A623',
    contactFields: [
      { key: 'name', label: 'Lead name', placeholder: 'Marcus Johnson' },
      { key: 'phone', label: 'Phone number', placeholder: '+1 (212) 555-0167' },
      { key: 'company', label: 'Company name', placeholder: 'Acme Corp' },
      { key: 'role', label: 'Job role', placeholder: 'Product Manager' }
    ],
    callTasks: [
      {
        id: 't4_1',
        contactName: 'Marcus Johnson',
        contactPhone: '+1 (650) 555-0342',
        status: 'Completed',
        transcript: [
          { role: 'agent', text: "Hi Marcus, following up on your demo request for Simform Voice OS on behalf of Acme Corp. Is now a good time?" },
          { role: 'user', text: "Yes, it is. We are looking to deploy a voice agent system next quarter." },
          { role: 'agent', text: "What is the target size of your project and budget?" },
          { role: 'user', text: "We need to support 15 concurrent channels, and have about $15,000 allocated." }
        ],
        summary: "Lead qualified. Stated need for 15 channels next quarter. Confirmed BANT budget of $15k.",
        actionItem: "High-value SQL. Route directly to AE for booking calendar meeting.",
        escalationRequired: true,
        customData: { company: 'Acme Corp', role: 'CTO' }
      },
      {
        id: 't4_2',
        contactName: 'Divya Sharma',
        contactPhone: '+1 (212) 555-0183',
        status: 'Completed',
        transcript: [
          { role: 'agent', text: "Hi Divya, following up on your interest in Simform Voice OS." },
          { role: 'user', text: "Hi, actually we have no budget allocated for this this year. Just window shopping." }
        ],
        summary: "Lead disqualified due to lack of budget and immediate timeline.",
        actionItem: "Place in nurture email sequence.",
        escalationRequired: false,
        customData: { company: 'Initech', role: 'HR Manager' }
      }
    ]
  },
  {
    id: 'agt_5',
    name: 'Booking Assistant — Salons',
    type: 'inbound',
    template: 'Appointment Booking Assistant',
    status: 'Active',
    calls: 987,
    conv: 0,
    created: 'Jun 4, 2026',
    color: '#2ECC71'
  },
  {
    id: 'agt_6',
    name: 'Clinics Appointment Reminders',
    type: 'outbound',
    template: 'Appointment Reminders',
    status: 'Active',
    calls: 0,
    conv: 0,
    created: 'May 18, 2026',
    color: '#2ECC71'
  },
  {
    id: 'agt_7',
    name: 'Webinar Registrants RSVP Confirmation',
    type: 'outbound',
    template: 'Event / Webinar Confirmation',
    status: 'Scheduled',
    calls: 0,
    conv: 0,
    created: 'Jul 3, 2026',
    color: '#7B3FB5'
  },
];
