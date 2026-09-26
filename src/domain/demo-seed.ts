import type { Company, Evidence, Workspace } from './model';
import { newCompany } from './model';

/**
 * Demo seed: real companies with public, dated, verifiable statements (research pass 2026-09-26).
 * Generated from a manual research register (docs/demo-seed-register.md); every quote is a verbatim substring of `text`,
 * which reproduces the paragraph read on the source page (markdown formatting removed).
 *
 * - All evidence is `status: 'review'`: a human must validate each row (checks listed in the register) before it counts.
 * - `quality` is the operational rubric from src/server/providers.ts qualityRubric(sourceType, quoteValid, companyNamed, dateValid),
 *   written as a literal because the rubric lives in server code.
 * - `hash` is sha256(text) precomputed (the unit test recomputes it), so this module stays free of node:crypto.
 * - Companies are `identity: 'candidate'`; only AQUILA has a CUI shown on a page read (BVB filing) and can be resolved with `resolve`.
 * - Lufthansa Group / DHL Group reuse the reference-pack fixture ids ('lufthansa', 'dhl'): applyDemoSeed skips the company rows already present and only adds the sourced evidence (ids prefixed 'seed-').
 */
const RETRIEVED_AT = "2026-09-26T13:00:00.000Z";
const MODEL = 'human-research-2026-09-26';

export const demoSeedCompanies: Company[] = [
  newCompany({ id: "lufthansa", name: "Lufthansa Group", domain: "lufthansagroup.com", legalId: "", country: null, industry: "Aviation", employees: null, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["Deutsche Lufthansa AG"],
    firmographicsSource: "newsroom.lufthansagroup.com press release 2025-09-29 (industry only; alias from page keywords). Country/headcount/revenue not stated on the page read.", firmographicsAsOf: "2025-09-29" }),
  newCompany({ id: "dhl", name: "DHL Group", domain: "group.dhl.com", legalId: "", country: "Germany", industry: "Logistics", employees: null, revenue: 82900000000,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["DHL Supply Chain"],
    firmographicsSource: "group.dhl.com annual earnings release 2026-03-05: revenue EUR 82.9 bn FY2025; press contact address in Bonn, Germany.", firmographicsAsOf: "FY2025" }),
  newCompany({ id: "deer", name: "Distribuție Energie Electrică Romania", domain: "distributie-energie.ro", legalId: "", country: "Romania", industry: "Electricity distribution", employees: null, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["DEER","Grupul Electrica"],
    firmographicsSource: "forbes.ro 2026-07-13 (country, industry, parent Grupul Electrica). Headcount/revenue not stated.", firmographicsAsOf: "2026-07" }),
  newCompany({ id: "romgaz", name: "Romgaz", domain: "romgaz.ro", legalId: "", country: null, industry: "Gas and energy supply", employees: null, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: [],
    firmographicsSource: "energynomics.ro 2025-08-07 (industry only).", firmographicsAsOf: "2025-08" }),
  newCompany({ id: "cfr-calatori", name: "CFR Călători", domain: "", legalId: "", country: "Romania", industry: "Passenger rail transport", employees: null, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: [],
    firmographicsSource: "mobilitate.eu 2026-04-23 and 2026-09-15 (industry; 'transportul feroviar românesc').", firmographicsAsOf: "2026-09" }),
  newCompany({ id: "cfr-sa", name: "CFR SA", domain: "", legalId: "", country: null, industry: "Rail infrastructure", employees: null, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["CFR"],
    firmographicsSource: "mobilitate.eu 2026-07-15 (industry only). Distinct entity from CFR Călători.", firmographicsAsOf: "2026-07" }),
  newCompany({ id: "ce-oltenia", name: "Complexul Energetic Oltenia", domain: "ceoltenia.ro", legalId: "", country: null, industry: "Energy", employees: null, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["Societatea Complexul Energetic Oltenia"],
    firmographicsSource: "stirileprotv.ro 2025-12-27 (industry only).", firmographicsAsOf: "2025-12" }),
  newCompany({ id: "hidroelectrica", name: "Hidroelectrica", domain: "", legalId: "", country: "Romania", industry: "Electricity generation", employees: null, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: [],
    firmographicsSource: "profit.ro 2026-08-04 ('cel mai mare producător de energie electrică din România').", firmographicsAsOf: "2026-08" }),
  newCompany({ id: "univ-craiova", name: "Universitatea din Craiova", domain: "", legalId: "", country: null, industry: "Higher education and research", employees: null, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: [],
    firmographicsSource: "agerpres.ro 2026-04-30 (industry only).", firmographicsAsOf: "2026-04" }),
  newCompany({ id: "medlife", name: "MedLife", domain: "medlife.ro", legalId: "", country: "Romania", industry: "Private healthcare", employees: null, revenue: 630000000,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["Grupul MedLife"],
    firmographicsSource: "startupcafe.ro 2026-08-28: 'grupul medical românesc'; pro-forma consolidated turnover approx. EUR 630 m in 2025 (approximate, EUR).", firmographicsAsOf: "FY2025" }),
  newCompany({ id: "banca-transilvania", name: "Banca Transilvania", domain: "bancatransilvania.ro", legalId: "", country: "Romania", industry: "Banking", employees: 10000, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["BT"],
    firmographicsSource: "transilvaniabusiness.ro 2026-07-02: '10.000 de angajați', 23% market share in Romania.", firmographicsAsOf: "2026-07" }),
  newCompany({ id: "aquila", name: "AQUILA", domain: "aquila.ro", legalId: "6484554", country: "Romania", industry: "FMCG distribution and logistics", employees: 3500, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["Aquila Part Prod Com S.A."],
    firmographicsSource: "BVB issuer announcement 2026-02-11: CUI 6484554, 'peste 3.500 de angajați' (lower bound); 2024 revenue ~3 bn lei stated in RON, not converted.", firmographicsAsOf: "2026-02" }),
  newCompany({ id: "emag", name: "eMAG", domain: "emag.ro", legalId: "", country: "Romania", industry: "E-commerce", employees: 3100, revenue: null,
    identity: 'candidate', owner: 'Unassigned', relationship: 'unknown', synthetic: false, dataMode: 'live', tags: ['demo-seed'], aliases: ["Grupul eMAG","Dante International"],
    firmographicsSource: "playtech.ro 2026-04-02: Dante International had over 3,100 employees in 2024 (lower bound); retail-fmcg.ro 2026-05-20: group turnover 11.1 bn lei in 2025 (RON, not converted).", firmographicsAsOf: "2024" }),
];

export const demoSeedEvidence: Evidence[] = [
  {
    id: "seed-lufthansa-intelligent-automation-efficiency-programme", companyId: "lufthansa", serviceId: "intelligent-automation", questionId: "efficiency-programme",
    questionText: "Has the company announced a cost-reduction, operational-efficiency or automation programme?",
    answer: "yes",
    quote: "Reduction of 4,000 administrative jobs by 2030 through digitalization, automation, and process consolidation",
    text: "- New medium-term financial targets for 2028-2030:\n  - 8-10 percent Adjusted EBIT margin\n  - 15-20 percent Adjusted Return on Capital Employed\n  - Over 2.5 billion euros in Adjusted Free Cash Flow per year\n- Reduction of 4,000 administrative jobs by 2030 through digitalization, automation, and process consolidation",
    url: "https://newsroom.lufthansagroup.com/en/lufthansa-group-is-consistently-pursuing-its-strategy-and-aims-to-significantly-increase-profitability/",
    title: "Lufthansa Group is consistently pursuing its strategy and aims to significantly increase profitability", publisher: "Lufthansa Group Newsroom", sourceType: "newsroom", language: "en",
    eventDate: "2025-09-29", publishedAt: "2025-09-29", retrievedAt: RETRIEVED_AT,
    hash: "67bee6c8f025a117f567715cc0a9375aed30e62dc583cd05664b812fe17ea9e8", // sha256(text)
    eventKey: "lufthansa:cmd2025-4000-admin-jobs:2025-09-29",
    quality: 0.9, // qualityRubric("newsroom", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "strategic",
    reason: "Company newsroom states a dated, quantified administrative-job reduction via digitalisation, automation and process consolidation (Capital Markets Day 2025).",
    uncertainty: "Headline bullet; the body text says 'around 4,000 jobs worldwide'. Plan statement, not a procurement commitment; whether external automation services will be bought is not stated.",
  },
  {
    id: "seed-lufthansa-intelligent-automation-transformation-initiative", companyId: "lufthansa", serviceId: "intelligent-automation", questionId: "transformation-initiative",
    questionText: "Is there a digital-transformation initiative naming AI, RPA, Agentic AI or process mining?",
    answer: "yes",
    quote: "In particular, the profound changes brought about by digitalization and the increased use of artificial intelligence will lead to greater efficiency in many areas and processes.",
    text: "Integrated cooperation within the Lufthansa Group will lead to significant changes in the processes and structures governing cooperation between Group companies in the future. On this basis, the Lufthansa Group is reviewing which activities will no longer be necessary in the future, for example due to duplication of work. In particular, the profound changes brought about by digitalization and the increased use of artificial intelligence will lead to greater efficiency in many areas and processes. Due to these developments and structural adjustments, the Lufthansa Group plans to cut a total of around 4,000 jobs worldwide by 2030, the majority of which will be in Germany. This will be done in consultation with the social partners. The focus will be on administrative rather than operational roles.",
    url: "https://newsroom.lufthansagroup.com/en/lufthansa-group-is-consistently-pursuing-its-strategy-and-aims-to-significantly-increase-profitability/",
    title: "Lufthansa Group is consistently pursuing its strategy and aims to significantly increase profitability", publisher: "Lufthansa Group Newsroom", sourceType: "newsroom", language: "en",
    eventDate: "2025-09-29", publishedAt: "2025-09-29", retrievedAt: RETRIEVED_AT,
    hash: "01db8b3c5e0a481274d9ab4130369fc3476423adbd49dd0ca8a78443926741f9", // sha256(text)
    eventKey: "lufthansa:cmd2025-ai-efficiency:2025-09-29",
    quality: 0.9, // qualityRubric("newsroom", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "technology",
    reason: "Same press release names artificial intelligence and digitalisation as the efficiency driver behind the restructuring.",
    uncertainty: "Same source and day as the efficiency-programme row; not an independent confirmation. No specific AI/RPA programme name is given.",
  },
  {
    id: "seed-lufthansa-intelligent-automation-shared-services", companyId: "lufthansa", serviceId: "intelligent-automation", questionId: "shared-services",
    questionText: "Is there a shared-service centre, process-consolidation or centralisation initiative?",
    answer: "yes",
    quote: "By consolidating all IT functions in one Executive Board department and combining the digital units and competencies from the ‘Digital Hangar’ with the ‘Innovation & Tech Factory’ in a new central role, the aim is to significantly expand digital expertise.",
    text: "The Lufthansa Group will also drive forward its digital transformation in the coming years. By consolidating all IT functions in one Executive Board department and combining the digital units and competencies from the ‘Digital Hangar’ with the ‘Innovation & Tech Factory’ in a new central role, the aim is to significantly expand digital expertise.",
    url: "https://newsroom.lufthansagroup.com/en/lufthansa-group-is-consistently-pursuing-its-strategy-and-aims-to-significantly-increase-profitability/",
    title: "Lufthansa Group is consistently pursuing its strategy and aims to significantly increase profitability", publisher: "Lufthansa Group Newsroom", sourceType: "newsroom", language: "en",
    eventDate: "2025-09-29", publishedAt: "2025-09-29", retrievedAt: RETRIEVED_AT,
    hash: "587c8894762b630ebcd892e640123e1999711259f3a5eebcfc64f6630bdec9e7", // sha256(text)
    eventKey: "lufthansa:cmd2025-it-consolidation:2025-09-29",
    quality: 0.9, // qualityRubric("newsroom", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "organisational",
    reason: "Company states consolidation of all IT functions and digital units into a central role (centralisation initiative).",
    uncertainty: "Centralisation of IT/digital functions, not explicitly a shared-service centre for back-office processes; reviewer should decide whether it answers the shared-services question.",
  },
  {
    id: "seed-dhl-intelligent-automation-transformation-initiative", companyId: "dhl", serviceId: "intelligent-automation", questionId: "transformation-initiative",
    questionText: "Is there a digital-transformation initiative naming AI, RPA, Agentic AI or process mining?",
    answer: "yes",
    quote: "DHL Group is accelerating its enterprise-wide AI strategy through a new partnership between its contract logistics division, DHL Supply Chain, and the AI startup HappyRobot.",
    text: "**Bonn** \\- DHL Group is accelerating its enterprise-wide AI strategy through a new partnership between its contract logistics division, DHL Supply Chain, and the AI startup HappyRobot. The collaboration marks a significant step in deploying agentic AI to streamline operational communication and enhance both customer experience and employee engagement.",
    url: "https://group.dhl.com/en/media-relations/press-releases/2025/dhl-boosts-operational-efficiency-and-customer-communications-with-happyrobots-ai-agents.html",
    title: "DHL boosts operational efficiency and customer communications with HappyRobot’s AI Agents", publisher: "DHL Group Media Relations", sourceType: "newsroom", language: "en",
    eventDate: "2025-11-11", publishedAt: "2025-11-11", retrievedAt: RETRIEVED_AT,
    hash: "6ab7cd00627d824813ed6f350bedef1dbb7d1e1a4955301176ae01cbc6147736", // sha256(text)
    eventKey: "dhl:happyrobot-agentic-ai:2025-11-11",
    quality: 0.9, // qualityRubric("newsroom", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "technology",
    reason: "Group newsroom names an enterprise-wide AI strategy and agentic-AI deployment in DHL Supply Chain.",
    uncertainty: "The initiative is already partnered with HappyRobot (an AI-agent vendor); a reviewer should consider whether this is also a competitor-partnership signal for the automation offer. The same release cites existing RPA experience (possible internal capability). Scope: DHL Supply Chain division.",
  },
  {
    id: "seed-dhl-intelligent-automation-efficiency-programme", companyId: "dhl", serviceId: "intelligent-automation", questionId: "efficiency-programme",
    questionText: "Has the company announced a cost-reduction, operational-efficiency or automation programme?",
    answer: "yes",
    quote: "DHL Group will therefore continue to focus on efficiency improvements, active capacity management, and further implementation of the \"Fit for Growth\" cost program.",
    text: "In 2026, the Group expects geopolitical uncertainties to persist. DHL Group will therefore continue to focus on efficiency improvements, active capacity management, and further implementation of the \"Fit for Growth\" cost program. For the financial year 2026, the Group anticipates operating profit above EUR 6.2 billion and free cash flow (excluding M&A) of around EUR 3 billion. The Group expects operating profit over EUR 5.6 billion for DHL, over EUR 0.9 billion for Post & Parcel Germany, and around EUR -0.4 billion for Group Functions.",
    url: "https://group.dhl.com/en/media-relations/press-releases/2026/dhl-group-annual-earnings-2025.html",
    title: "DHL Group exceeds earnings guidance and increases dividend", publisher: "DHL Group Media Relations", sourceType: "newsroom", language: "en",
    eventDate: "2026-03-05", publishedAt: "2026-03-05", retrievedAt: RETRIEVED_AT,
    hash: "ece57fdb86a7e89168f9ddfc638bc0364dfc236c9965d6c835eda474872a74f7", // sha256(text)
    eventKey: "dhl:fy2025-fit-for-growth:2026-03-05",
    quality: 0.9, // qualityRubric("newsroom", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "strategic",
    reason: "Annual results release states a named, ongoing cost programme (\"Fit for Growth\") and efficiency focus for 2026.",
    uncertainty: "The release does not say the cost programme involves process automation specifically. Strategy 2030 itself was announced in September 2024 (outside the 18-month window) and is not used as evidence.",
  },
  {
    id: "deer-scut-nis2-it-investment", companyId: "deer", serviceId: "scut-nis2", questionId: "it-investment",
    questionText: "Has the company announced IT infrastructure investment or modernisation?",
    answer: "yes",
    quote: "Compania va continua și automatizarea rețelelor, digitalizarea proceselor operaționale și implementarea unor soluții avansate de securitate cibernetică.",
    text: "Printre principalele proiecte programate pentru 2026 se numără construirea unei noi stații electrice în județul Cluj, modernizarea infrastructurii din Buzău, Galați, Târgoviște, Oradea și Sibiu, înlocuirea a peste 600 de transformatoare în zonele cu mulți prosumatori, instalarea a 1,1 milioane de contoare inteligente și dezvoltarea unei platforme de tip Virtual Power Plant. Compania va continua și automatizarea rețelelor, digitalizarea proceselor operaționale și implementarea unor soluții avansate de securitate cibernetică.",
    url: "https://www.forbes.ro/cel-mai-mare-program-de-investitii-din-istoria-deer-148-miliarde-de-lei-pentru-digitalizarea-retelei-511384",
    title: "Cel mai mare program de investiții din istoria DEER: 1,48 miliarde de lei pentru digitalizarea rețelei", publisher: "Forbes România", sourceType: "news", language: "ro",
    eventDate: "2026-07-13", publishedAt: "2026-07-13", retrievedAt: RETRIEVED_AT,
    hash: "53e1a639e5553075df745f1a829ecde3918b8839a4191dba894cb5cb7e616d75", // sha256(text)
    eventKey: "deer:capex2026-digitalisation-cyber:2026-07-13",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "strategic",
    reason: "Business outlet reports DEER's 2026 CAPEX programme (1.48 bn lei) explicitly including advanced cybersecurity solutions and digitalisation of operational processes.",
    uncertainty: "Secondary source (Forbes România) citing the company; the cybersecurity share of the budget is not stated. DEER is a subsidiary of Grupul Electrica: confirm which legal entity buys.",
  },
  {
    id: "romgaz-intelligent-automation-budget-commitment", companyId: "romgaz", serviceId: "intelligent-automation", questionId: "budget-commitment",
    questionText: "Has the company committed a dated budget or issued a tender/RFQ for automation?",
    answer: "yes",
    quote: "By integrating with the existing Oracle ERP, Romgaz aims to automate processes, significantly reducing response time and administrative costs.",
    text: "Romgaz has awarded a contract worth almost 6 million lei (5.994 million lei plus VAT) for the development of a modern digital platform, through which it will become a direct gas and energy supplier, including for domestic customers. The winning consortium – led by Ringhel Team, in partnership with Cima Data Analytics and subcontractor ETA2U – has until the end of the year to deliver an integrated system to manage contracting, billing, online payments and the transmission of auto-quoted indexes, complying with ANRE and e-Factura requirements.\n\nThe consumer portal will provide access to invoices and payment history, real-time consumption data, the possibility of online payment and the management of complaints or legislative notifications. By integrating with the existing Oracle ERP, Romgaz aims to automate processes, significantly reducing response time and administrative costs.",
    url: "https://www.energynomics.ro/en/romgaz-has-chosen-who-will-deliver-its-digital-platform-for-supply-to-the-population-ringhel-team-cima-and-eta2u/",
    title: "Romgaz has chosen who will deliver its digital platform for supply to the population: Ringhel Team, CIMA and ETA2U", publisher: "energynomics.ro", sourceType: "news", language: "en",
    eventDate: "2025-08-07", publishedAt: "2025-08-07", retrievedAt: RETRIEVED_AT,
    hash: "31be06377c4f7495e5812c09b37309b21fda202d9378eecc788ad7789cfb4720", // sha256(text)
    eventKey: "romgaz:supply-platform-contract:2025-08-07",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "procurement",
    reason: "Trade outlet reports an awarded, priced contract whose stated aim is process automation integrated with the existing ERP.",
    uncertainty: "Contract already awarded to the Ringhel Team / CIMA / ETA2U consortium (August 2025): this is evidence of automation spending, not an open opportunity. Delivery deadline was end of 2025; check follow-on phases.",
  },
  {
    id: "cfr-calatori-scut-nis2-security-tender", companyId: "cfr-calatori", serviceId: "scut-nis2", questionId: "security-tender",
    questionText: "Has the company published a tender for cybersecurity or NIS2 services?",
    answer: "yes",
    quote: "CFR Călători a inițiat consultarea pieței pe SEAP pentru achiziția unei soluții integrate de securitate cibernetică menite să protejeze Platforma Digitală pentru Gestionarea Flotei (PSMF), sistemul informatic centralizat prin care compania monitorizează, operează și gestionează întreaga flotă de material rulant.",
    text: "CFR Călători a inițiat consultarea pieței pe SEAP pentru achiziția unei soluții integrate de securitate cibernetică menite să protejeze Platforma Digitală pentru Gestionarea Flotei (PSMF), sistemul informatic centralizat prin care compania monitorizează, operează și gestionează întreaga flotă de material rulant. Potrivit specificațiilor tehnice emise de Direcția Strategie-Dezvoltare, Oficiul Digitalizare și IT, sub numărul ODIT/2/751/09.09.2026 și aprobate de directorul Dorin Mitan, proiectul vizează construirea unui model de protecție pe mai multe niveluri, de la infrastructura de servere și comunicațiile de rețea, până la aplicații, interfețe API și mediile de testare și dezvoltare.",
    url: "https://mobilitate.eu/cfr-calatori-pregateste-91526/",
    title: "CFR Călători pregătește o soluție amplă de securitate cibernetică pentru Platforma Digitală de Gestionare a Flotei", publisher: "Mobilitate.eu", sourceType: "news", language: "ro",
    eventDate: "2026-09-15", publishedAt: "2026-09-15", retrievedAt: RETRIEVED_AT,
    hash: "3f8302fa9b560a955dbba16a8565d33c472439dd3eb3fc5bfdb47c0143833661", // sha256(text)
    eventKey: "cfr-calatori:psmf-cyber-market-consultation:2026-09-15",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "procurement",
    reason: "Rail-sector outlet reports a SEAP market consultation (notice linked on the page) for an integrated cybersecurity solution with 5-year support.",
    uncertainty: "Market consultation (pre-tender), not yet a contract notice; check SEAP notice 100169795 for the consultation deadline and whether a tender followed. Scope is product-heavy (server protection, NDR, sandbox, API/RASP); consultancy share unknown.",
  },
  {
    id: "cfr-calatori-cloud-modernisation-plan", companyId: "cfr-calatori", serviceId: "cloud", questionId: "modernisation-plan",
    questionText: "Has the company stated a cloud-migration or infrastructure-modernisation plan, ideally with an amount?",
    answer: "yes",
    quote: "CFR Călători a lansat o consultare de piață pentru achiziția unui sistem informatic integrat furnizat în regim SaaS, destinat colectării, agregării, corelării, validării și raportării datelor provenite din sistemele informatice utilizate în prezent de operatorul național feroviar.",
    text: "CFR Călători a lansat o consultare de piață pentru achiziția unui sistem informatic integrat furnizat în regim SaaS, destinat colectării, agregării, corelării, validării și raportării datelor provenite din sistemele informatice utilizate în prezent de operatorul național feroviar. Inițiativa urmărește evaluarea oportunității implementării unei soluții moderne care să permită gestionarea unitară și eficientă a datelor operaționale, comerciale și tehnice ale companiei.",
    url: "https://mobilitate.eu/cfr-calatori-lanseaza-consultarea/",
    title: "CFR Călători lansează consultarea pieței pentru un sistem informatic integrat de colectare și analiză a datelor operaționale", publisher: "Mobilitate.eu", sourceType: "news", language: "ro",
    eventDate: "2026-04-23", publishedAt: "2026-04-23", retrievedAt: RETRIEVED_AT,
    hash: "7d78451ae4165e6b15ab2303cebab294a41bbe29d82d7d0071dc01ad336cc2f0", // sha256(text)
    eventKey: "cfr-calatori:saas-data-platform-consultation:2026-04-23",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "strategic",
    reason: "Outlet reports a SEAP market consultation for a SaaS data platform, i.e. a stated move of an operational data system to a cloud-delivered model.",
    uncertainty: "Consultation closed 27 April 2026 per the article; check SEAP notice 100167412 for a follow-on tender. SaaS data platform, not infrastructure migration: reviewer should confirm it answers the modernisation-plan question.",
  },
  {
    id: "cfr-sa-scut-nis2-security-tender", companyId: "cfr-sa", serviceId: "scut-nis2", questionId: "security-tender",
    questionText: "Has the company published a tender for cybersecurity or NIS2 services?",
    answer: "yes",
    quote: "CFR SA a publicat în SEAP o licitație majoră pentru achiziția unei arhitecturi centrale de sisteme informatice și soluții de securitate cibernetică dedicate infrastructurii feroviare.",
    text: "CFR SA a publicat în SEAP o licitație majoră pentru achiziția unei arhitecturi centrale de sisteme informatice și soluții de securitate cibernetică dedicate infrastructurii feroviare. Valoarea totală estimată a contractului este de 110.552.200 lei fără TVA, achiziția vizând modernizarea profundă a platformelor IT care gestionează datele operaționale, monitorizarea circulației trenurilor și securitatea cibernetică a rețelei feroviare naționale.",
    url: "https://mobilitate.eu/cfr-sa-licitatia-71526a/",
    title: "CFR SA lansează licitația de 110,5 milioane lei pentru arhitectura centrală IT și securitate cibernetică a sistemului informatic feroviar", publisher: "Mobilitate.eu", sourceType: "news", language: "ro",
    eventDate: "2026-07-15", publishedAt: "2026-07-15", retrievedAt: RETRIEVED_AT,
    hash: "54833effc9403150ffe713703d68885106f1fe8d6d6c09813a54bad37825c460", // sha256(text)
    eventKey: "cfr-sa:central-it-cyber-tender-cn1094396:2026-07-15",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "procurement",
    reason: "Outlet reports a published SEAP open tender (CN1094396) including cybersecurity solutions, estimated 110.55 m lei excl. VAT.",
    uncertainty: "Bid deadline was 24 August 2026: the procedure is now in evaluation, so this is a signal of security spend and of a possible subcontracting/partnering route, not an open bid. Single lot, no lot split. Confirm the entity (national rail infrastructure company, not CFR Călători).",
  },
  {
    id: "cfr-sa-cloud-infra-tender", companyId: "cfr-sa", serviceId: "cloud", questionId: "infra-tender",
    questionText: "Has the company published a tender for servers, storage, virtualisation or cloud migration?",
    answer: "yes",
    quote: "Documentația precizează că achiziția include o arhitectură centrală de prelucrare și stocare, sisteme avansate de monitorizare, soluții de protecție cibernetică și un sistem dedicat monitorizării circulației trenurilor.",
    text: "Documentația precizează că achiziția include o arhitectură centrală de prelucrare și stocare, sisteme avansate de monitorizare, soluții de protecție cibernetică și un sistem dedicat monitorizării circulației trenurilor. Proiectul are rolul de a consolida infrastructura digitală a CFR, de a crește reziliența la atacuri cibernetice și de a asigura continuitatea operațiunilor feroviare în condiții de siguranță.",
    url: "https://mobilitate.eu/cfr-sa-licitatia-71526a/",
    title: "CFR SA lansează licitația de 110,5 milioane lei pentru arhitectura centrală IT și securitate cibernetică a sistemului informatic feroviar", publisher: "Mobilitate.eu", sourceType: "news", language: "ro",
    eventDate: "2026-07-15", publishedAt: "2026-07-15", retrievedAt: RETRIEVED_AT,
    hash: "9ef3ec16e4f859488cf30dcdd9d1d6e3019c7dd18ce29a35ce1e391f248fdcfd", // sha256(text)
    eventKey: "cfr-sa:central-it-cyber-tender-cn1094396:2026-07-15",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "procurement",
    reason: "Same published tender includes central processing and storage architecture (servers/storage), which answers the infrastructure-tender question.",
    uncertainty: "Same procedure as the security-tender row (different service, shared eventKey). Bid deadline 24 August 2026 has passed; check award status on SEAP.",
  },
  {
    id: "ce-oltenia-scut-nis2-public-incident", companyId: "ce-oltenia", serviceId: "scut-nis2", questionId: "public-incident",
    questionText: "Has a security incident been publicly reported for the company?",
    answer: "yes",
    quote: "În urma atacului, unele documente şi fişiere au fost criptate, iar mai multe aplicaţii informatice au devenit temporar indisponibile, inclusiv sisteme de tip ERP, aplicaţii de management al documentelor, serviciul de e-mail şi site-ul societăţii.",
    text: "”În data de 26 decembrie 2025, în jurul orei 01:40, a fost identificat un atac informatic de tip ransomware, denumit „Gentlemen”, care a afectat infrastructura IT de business a Societăţii Complexul Energetic Oltenia. În urma atacului, unele documente şi fişiere au fost criptate, iar mai multe aplicaţii informatice au devenit temporar indisponibile, inclusiv sisteme de tip ERP, aplicaţii de management al documentelor, serviciul de e-mail şi site-ul societăţii. Activitatea companiei a fost parţial afectată, fără a fi pusă în pericol funcţionarea Sistemului Energetic Naţional”, anunţă conpania.",
    url: "https://stirileprotv.ro/stiri/actualitate/atac-cibernetic-de-tip-ransomware-asupra-complexului-energetic-oltenia-activitatea-partial-afectata.html",
    title: "Atac cibernetic de tip ransomware asupra Complexului Energetic Oltenia. Activitatea, parțial afectată", publisher: "Știrile ProTV", sourceType: "news", language: "ro",
    eventDate: "2025-12-26", publishedAt: "2025-12-27", retrievedAt: RETRIEVED_AT,
    hash: "3bce42cd7d0a8b2b9f9cf81ea162e341dc7edc85d4e97bffb43fcde2bbe875a2", // sha256(text)
    eventKey: "ce-oltenia:gentlemen-ransomware:2025-12-26",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "risk_compliance",
    reason: "National broadcaster quotes the company's own statement confirming a ransomware incident affecting business IT (ERP, document management, e-mail, website).",
    uncertainty: "Event date 26 Dec 2025 is stated in the quoted company statement; article published 27 Dec 2025 (updated 11 Jan 2026). Data exfiltration was still under analysis at publication. Outreach must not reference the incident as a sales hook (draft rules).",
  },
  {
    id: "ce-oltenia-scut-nis2-it-investment", companyId: "ce-oltenia", serviceId: "scut-nis2", questionId: "it-investment",
    questionText: "Has the company announced IT infrastructure investment or modernisation?",
    answer: "yes",
    quote: "Încă de la momentul identificării atacului, specialiştii IT ai Complexului Energetic Oltenia au demarat procesul de reconstrucţie a sistemelor pe o infrastructură nouă, utilizând copiile de siguranţă existente.",
    text: "”Încă de la momentul identificării atacului, specialiştii IT ai Complexului Energetic Oltenia au demarat procesul de reconstrucţie a sistemelor pe o infrastructură nouă, utilizând copiile de siguranţă existente. În prezent, se află în curs de analiză amploarea exactă a incidentului, precum şi existenţa unei eventuale exfiltrări de date. Complexul Energetic Oltenia cooperează cu autorităţile competente şi depune toate eforturile necesare pentru restabilirea completă a sistemelor informatice în cel mai scurt timp posibil”, transmite compania.",
    url: "https://stirileprotv.ro/stiri/actualitate/atac-cibernetic-de-tip-ransomware-asupra-complexului-energetic-oltenia-activitatea-partial-afectata.html",
    title: "Atac cibernetic de tip ransomware asupra Complexului Energetic Oltenia. Activitatea, parțial afectată", publisher: "Știrile ProTV", sourceType: "news", language: "ro",
    eventDate: "2025-12-27", publishedAt: "2025-12-27", retrievedAt: RETRIEVED_AT,
    hash: "5fb2f87cd5e99b8f024fa87cfbf6bee270a7f10c3a61a4f3c5da1ca183e26308", // sha256(text)
    eventKey: "ce-oltenia:post-incident-rebuild:2025-12-27",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "strategic",
    reason: "Company statement says systems are being rebuilt on new infrastructure after the incident.",
    uncertainty: "Recovery work performed by the in-house IT team, not an announced investment programme or budget; same article as the incident row (not independent). Reviewer may prefer 'unknown'.",
  },
  {
    id: "hidroelectrica-cloud-erp-project", companyId: "hidroelectrica", serviceId: "cloud", questionId: "erp-project",
    questionText: "Has an ERP implementation or IT investment been announced by the CEO?",
    answer: "yes",
    quote: "Compania de stat Hidroelectrica, cel mai mare producător de energie electrică din România, a lansat pentru achiziționarea de servicii integrate destinate sistemului său informatic de bază, bazat pe platformele SAP S/4HANA și SAP IS-U.",
    text: "Compania de stat Hidroelectrica, cel mai mare producător de energie electrică din România, a lansat pentru achiziționarea de servicii integrate destinate sistemului său informatic de bază, bazat pe platformele SAP S/4HANA și SAP IS-U. Estimat la 125,3 milioane de lei, fără TVA, procedura de atribuire urmărește asigurarea continuității operațiunilor zilnice și modernizarea ecosistemului digital al companiei.",
    url: "https://www.profit.ro/povesti-cu-profit/energie/document-hidroelectrica-si-a-bugetat-peste-125-milioane-lei-pentru-mentenanta-aplicatiilor-sap-22573968",
    title: "DOCUMENT Hidroelectrica și-a bugetat peste 125 milioane lei pentru mentenanța aplicațiilor SAP", publisher: "Profit.ro", sourceType: "news", language: "ro",
    eventDate: "2026-08-04", publishedAt: "2026-08-04", retrievedAt: RETRIEVED_AT,
    hash: "0f8dc4b053e27ed4cd967c29231e6287405f2c058f982cbe640a953c4323216d", // sha256(text)
    eventKey: "hidroelectrica:sap-s4hana-services-tender:2026-08-04",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "strategic",
    reason: "Business outlet reports a launched procurement (125.3 m lei excl. VAT, 3 years) for SAP S/4HANA / IS-U subscriptions, support and development.",
    uncertainty: "Text captured via Firecrawl directQuote extraction; the lead paragraph matches the page's meta description verbatim. The source sentence is itself elliptical ('a lansat pentru'). Offers were due to open end of August 2026: check SEAP award status. This is ERP run/extend spend, not a new implementation announced by the CEO.",
  },
  {
    id: "univ-craiova-cloud-infra-tender", companyId: "univ-craiova", serviceId: "cloud", questionId: "infra-tender",
    questionText: "Has the company published a tender for servers, storage, virtualisation or cloud migration?",
    answer: "yes",
    quote: "Potrivit documentației publicate pe e-licitatie.ro, obiectivul principal al investiției îl reprezintă dezvoltarea unei infrastructuri moderne de tip cloud, cu facilități de virtualizare și inteligență artificială, destinată activităților de cercetare și inovare.",
    text: "Valoarea estimată a contractului este de 16.281.756,38 lei.\n\nPotrivit documentației publicate pe e-licitatie.ro, obiectivul principal al investiției îl reprezintă dezvoltarea unei infrastructuri moderne de tip cloud, cu facilități de virtualizare și inteligență artificială, destinată activităților de cercetare și inovare. Termenul-limită pentru depunerea ofertelor este 2 iunie 2026, ora 15:00.",
    url: "https://agerpres.ro/educatie-stiinta/2026/04/30/dolj-universitatea-din-craiova-scoate-la-licitatie-o-infrastructura-cloud-ai-de-peste-16-2-milioane---1551873",
    title: "Dolj: Universitatea din Craiova scoate la licitație o infrastructură cloud AI de peste 16,2 milioane lei", publisher: "AGERPRES", sourceType: "news", language: "ro",
    eventDate: "2026-04-30", publishedAt: "2026-04-30", retrievedAt: RETRIEVED_AT,
    hash: "c158a4924d392cde2097af3d2cd63430f3944d5c3d7c599517454c28a5b858e3", // sha256(text)
    eventKey: "univ-craiova:senthicom-ai-cloud-tender:2026-04-30",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "procurement",
    reason: "National news agency reports a published public tender (16.28 m lei, PNRR-funded) for cloud infrastructure with virtualisation and AI facilities.",
    uncertainty: "Agerpres body captured via Firecrawl directQuote extraction; the same sentence was also read verbatim on radiooltenia.ro (2026-05-04). Bid deadline 2 June 2026 has passed: check award on SEAP. Research-only infrastructure (project SENTHICOM_UCV).",
  },
  {
    id: "medlife-intelligent-automation-transformation-initiative", companyId: "medlife", serviceId: "intelligent-automation", questionId: "transformation-initiative",
    questionText: "Is there a digital-transformation initiative naming AI, RPA, Agentic AI or process mining?",
    answer: "yes",
    quote: "În perioada următoare, MedLife își va continua proiectele strategice, păstrând focusul pe inovație, AI, digitalizare și dezvoltarea unor soluții medicale adaptate nevoilor în continuă schimbare ale pacienților.",
    text: "În perioada următoare, MedLife își va continua proiectele strategice, păstrând focusul pe inovație, AI, digitalizare și dezvoltarea unor soluții medicale adaptate nevoilor în continuă schimbare ale pacienților.",
    url: "https://startupcafe.ro/medlife-investitii-tehnologii-avansate-inclusiv-inteligenta-artificiala-afaceri-1-7-miliarde-lei-prima-jumatate-an-105882",
    title: "MedLife continuă să investească în tehnologii avansate, inclusiv în inteligență artificială. Afaceri de 1,7 miliarde lei în prima jumătate a anului", publisher: "StartupCafe", sourceType: "news", language: "ro",
    eventDate: null, publishedAt: "2026-08-28", retrievedAt: RETRIEVED_AT,
    hash: "1513f44fa3985dd7747ff1d77df6e20c8323d490ecc314cc8211335e8cf730b1", // sha256(text)
    eventKey: "medlife:h1-2026-ai-digital-focus:unknown",
    quality: 0.7, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=false)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "technology",
    reason: "Outlet reproduces the company's H1 2026 results release naming AI and digitalisation as strategic focus for H2 2026.",
    uncertainty: "No publication date visible in the extracted body; publishedAt comes from the page's article:published_time metadata (2026-08-28), so eventDate is left null. The AI focus is patient-facing (app, personalised medicine), not stated as internal process automation.",
  },
  {
    id: "banca-transilvania-intelligent-automation-transformation-initiative", companyId: "banca-transilvania", serviceId: "intelligent-automation", questionId: "transformation-initiative",
    questionText: "Is there a digital-transformation initiative naming AI, RPA, Agentic AI or process mining?",
    answer: "yes",
    quote: "Banca Transilvania (BT) și Visa au finalizat prima plată inițiată de un agent de inteligență artificială (AI) în numele unui client, la Brick Depot – Magazin Certificat Lego, comerciant-partener BT.",
    text: "Banca Transilvania (BT) și Visa au finalizat prima plată inițiată de un agent de inteligență artificială (AI) în numele unui client, la Brick Depot – Magazin Certificat Lego, comerciant-partener BT.\n\nTranzacția marchează începutul unei etape pilot cu experiențe reale de comerț asistat de AI din Europa, iniţiativa fiind parte a programului Visa Agentic Ready.",
    url: "https://www.transilvaniabusiness.ro/2026/07/02/prima-plata-initiata-printr-un-agent-ai-la-banca-transilvania/",
    title: "Prima plată inițiată printr-un agent AI la Banca Transilvania", publisher: "Transilvania Business", sourceType: "news", language: "ro",
    eventDate: "2026-07-02", publishedAt: "2026-07-02", retrievedAt: RETRIEVED_AT,
    hash: "65efe14a81161377bb20866e82b45563c56d69776e9cbb6c58a2be67227e1c0d", // sha256(text)
    eventKey: "banca-transilvania:visa-agentic-payment-pilot:2026-07-02",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "technology",
    reason: "Regional business outlet reports BT completing an agentic-AI payment pilot with Visa.",
    uncertainty: "Customer-facing agentic-commerce pilot run with Visa, not an internal process-automation programme; weak fit for the automation offer. Regional outlet; BT newsroom version not located.",
  },
  {
    id: "banca-transilvania-scut-nis2-internal-soc", companyId: "banca-transilvania", serviceId: "scut-nis2", questionId: "internal-soc",
    questionText: "Does the company operate a certified internal SOC with a mature ISMS?",
    answer: "unknown",
    quote: "IT Security Operations team in Banca Transilvania is looking for a technical team lead focused on use case building while managing the SOC team and its activities.",
    text: "IT Security Operations team in Banca Transilvania is looking for a technical team lead focused on use case building while managing the SOC team and its activities. Our overall goal is to implement good security practices throughout the existing tooling and also to create security that lasts focusing on end result established in other (more agile) industries, in an integrated manner (partnering with both ICT operations and information security teams) and getting the most out of the available toolset. Our ambition is to become reference points in our area of security expertise for the Romanian banking sector.",
    url: "https://cariere.bancatransilvania.ro/joburi-disponibile/security-operations-center-technical-team-lead-3",
    title: "Security Operations Center Technical Team Lead - Cariere | Banca Transilvania", publisher: "Banca Transilvania Cariere", sourceType: "career_page", language: "en",
    eventDate: null, publishedAt: null, retrievedAt: RETRIEVED_AT,
    hash: "61205201328a0898c7bb9c41907570fc4e1fc30e4f3db2d2239665b0eb76ebed", // sha256(text)
    eventKey: "banca-transilvania:soc-team-lead-opening:unknown",
    quality: 0.75, // qualityRubric("career_page", quoteValid=true, companyNamed=true, dateValid=false)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "neutral", claimType: "fact", category: "technology",
    reason: "Own career page shows an in-house SOC team with 24/7 L1/L2 coverage. Certification and ISMS maturity are not stated, so the penalty question stays unknown (unknown is never negative).",
    uncertainty: "Posting has no date on the page; confirm it is still open. An internal SOC is a capability signal against outsourced SOC/NIS2 consultancy; a human must decide whether it answers the certified-SOC question.",
  },
  {
    id: "aquila-intelligent-automation-transformation-initiative", companyId: "aquila", serviceId: "intelligent-automation", questionId: "transformation-initiative",
    questionText: "Is there a digital-transformation initiative naming AI, RPA, Agentic AI or process mining?",
    answer: "yes",
    quote: "Un element-cheie al soluției îl reprezintă integrarea sistemelor de viziune bazate pe Inteligență Artificială, care permit identificarea produselor direct din imagini, fără a mai depinde de etichete sau scanări manuale, pe baza formei, culorii și caracteristicilor vizuale, inclusiv atunci când orientarea sau ambalajul prezintă diferențe minore.",
    text: "Prin acest proiect de automatizare, AQUILA vizează operațiuni logistice mai rapide și mai precise, care generează avantaje competitive pe termen mediu prin utilizarea mai eficientă a resurselor, reducerea muncii manuale și optimizarea spațiului de depozitare. Acuratețea proceselor de “picking” și livrare a crescut de la 92% la 99%, iar trasabilitatea produselor este asigurată pe întregul flux logistic. Un element-cheie al soluției îl reprezintă integrarea sistemelor de viziune bazate pe Inteligență Artificială, care permit identificarea produselor direct din imagini, fără a mai depinde de etichete sau scanări manuale, pe baza formei, culorii și caracteristicilor vizuale, inclusiv atunci când orientarea sau ambalajul prezintă diferențe minore. Soluția a fost livrată într-un sistem unitar, scalabil și orientat spre performanță pe termen lung.",
    url: "https://www.forbes.ro/aquila-a-investit-peste-5-milioane-de-euro-intr-o-solutie-de-automatizare-bazata-pe-inteligenta-artificiala-la-depozitul-din-dragomiresti-484816",
    title: "AQUILA a investit peste 5 milioane de euro într-o soluție de automatizare bazată pe Inteligență Artificială la depozitul din Dragomirești", publisher: "Forbes România", sourceType: "news", language: "ro",
    eventDate: "2026-01-26", publishedAt: "2026-01-26", retrievedAt: RETRIEVED_AT,
    hash: "1b8b4b0121b9578619f13da4cd503723ff955f3a5f1f18de1f0825761bcf2b2c", // sha256(text)
    eventKey: "aquila:dragomiresti-ai-warehouse-automation:2026-01-26",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "technology",
    reason: "Business outlet reports a completed 5 m EUR warehouse-automation investment using AI vision.",
    uncertainty: "Physical warehouse automation, already delivered (vendor not named); indicates automation appetite and maturity rather than an open RPA/process-automation need.",
  },
  {
    id: "aquila-intelligent-automation-shared-services", companyId: "aquila", serviceId: "intelligent-automation", questionId: "shared-services",
    questionText: "Is there a shared-service centre, process-consolidation or centralisation initiative?",
    answer: "yes",
    quote: "și-a consolidat cadrul de guvernanță internă prin implementarea soluției SincronHR, parte a programului de digitalizare a Grupului AQUILA, pentru standardizarea și digitalizarea proceselor de resurse umane la nivel de grup.",
    text: "Ploiești, 11 februarie 2026: AQUILA (simbol bursier AQ), lider în servicii integrate de distribuție și logistică pentru piața bunurilor de larg consum din România și regiune, cu peste 30 de ani de experiență în această industrie, și-a consolidat cadrul de guvernanță internă prin implementarea soluției SincronHR, parte a programului de digitalizare a Grupului AQUILA, pentru standardizarea și digitalizarea proceselor de resurse umane la nivel de grup.",
    url: "https://bvb.ro/infocont/infocont26/AQ_20260210214716_4-AQ-Anunt-Investitie-in-digitalizare-Sincron-11-02-2026.pdf",
    title: "AQUILA accelerează digitalizarea proceselor de resurse umane pentru a susține scalarea operațiunilor și integrarea post-achiziții", publisher: "Bursa de Valori București (issuer announcement)", sourceType: "newsroom", language: "ro",
    eventDate: "2026-02-11", publishedAt: "2026-02-11", retrievedAt: RETRIEVED_AT,
    hash: "a2b923eb22b5c31930d6a510fe4730966f1f3071cf8e220f4aa4d149d4d232d4", // sha256(text)
    eventKey: "aquila:sincronhr-group-hr-digitalisation:2026-02-11",
    quality: 0.9, // qualityRubric("newsroom", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "organisational",
    reason: "Issuer announcement on BVB states group-level standardisation of HR processes as part of a group digitalisation programme (post-acquisition integration).",
    uncertainty: "HR process standardisation on a named vendor platform (Sincron), not an explicit shared-service centre; investment (over 1.2 m lei) already implemented.",
  },
  {
    id: "aquila-intelligent-automation-efficiency-programme", companyId: "aquila", serviceId: "intelligent-automation", questionId: "efficiency-programme",
    questionText: "Has the company announced a cost-reduction, operational-efficiency or automation programme?",
    answer: "yes",
    quote: "standardizarea proceselor de resurse umane la nivel de grup, creșterea disciplinei operaționale și a capacității de raportare și susținerea scalării fără creșteri disproporționate de costuri administrative.",
    text: "AQUILA își consolidează astfel infrastructura internă de suport, esențială pentru integrarea eficientă a companiilor achiziționate, standardizarea proceselor de resurse umane la nivel de grup, creșterea disciplinei operaționale și a capacității de raportare și susținerea scalării fără creșteri disproporționate de costuri administrative.",
    url: "https://bvb.ro/infocont/infocont26/AQ_20260210214716_4-AQ-Anunt-Investitie-in-digitalizare-Sincron-11-02-2026.pdf",
    title: "AQUILA accelerează digitalizarea proceselor de resurse umane pentru a susține scalarea operațiunilor și integrarea post-achiziții", publisher: "Bursa de Valori București (issuer announcement)", sourceType: "newsroom", language: "ro",
    eventDate: "2026-02-11", publishedAt: "2026-02-11", retrievedAt: RETRIEVED_AT,
    hash: "7827124721c4d6a3881c19b573c3644ca327c051747d30095fa881cc403ca036", // sha256(text)
    eventKey: "aquila:sincronhr-group-hr-digitalisation:2026-02-11",
    quality: 0.9, // qualityRubric("newsroom", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "strategic",
    reason: "Same issuer announcement states the aim of scaling without disproportionate administrative cost growth; the same announcement ties this to its automation investments.",
    uncertainty: "Same document and eventKey as the shared-services row (one event, one contribution). An efficiency aim, not a quantified cost-reduction programme.",
  },
  {
    id: "emag-intelligent-automation-efficiency-programme", companyId: "emag", serviceId: "intelligent-automation", questionId: "efficiency-programme",
    questionText: "Has the company announced a cost-reduction, operational-efficiency or automation programme?",
    answer: "yes",
    quote: "Concret, această reorganizare presupune reducerea echipei cu un procent de aproximativ 3%, măsură care vizează roluri din mai multe departamente ale organizației.",
    text: "„Din acest motiv, am fost nevoiți să luăm decizia de a ne reorganiza intern. Concret, această reorganizare presupune reducerea echipei cu un procent de aproximativ 3%, măsură care vizează roluri din mai multe departamente ale organizației. Colegii afectați au tot sprijinul nostru în această perioadă.”",
    url: "https://playtech.ro/2026/emag-anunta-concedieri-dar-pariaza-pe-inteligenta-artificiala-am-fost-nevoiti-sa-ne-reorganizam/",
    title: "eMAG anunță concedieri, dar pariază pe inteligența artificială. „Am fost nevoiți să ne reorganizăm”", publisher: "Playtech.ro", sourceType: "news", language: "ro",
    eventDate: "2026-04-02", publishedAt: "2026-04-02", retrievedAt: RETRIEVED_AT,
    hash: "ea27cd2ac59dcf8995be9cefde6b490acc563da77e6f7d133ae3044330aeed55", // sha256(text)
    eventKey: "emag:reorganisation-3pct:2026-04-02",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "fact", category: "strategic",
    reason: "Outlet quotes the company's statement on an internal reorganisation reducing the team by about 3% for financial sustainability and efficiency.",
    uncertainty: "The company statement does not attribute the reduction to automation or AI; that link is the journalist's framing and must not be asserted. Consumer-tech outlet; prefer finding the same statement in ZF or Profit.ro.",
  },
  {
    id: "emag-intelligent-automation-transformation-initiative", companyId: "emag", serviceId: "intelligent-automation", questionId: "transformation-initiative",
    questionText: "Is there a digital-transformation initiative naming AI, RPA, Agentic AI or process mining?",
    answer: "yes",
    quote: "Investițiile vor merge predominant către infrastructura logistică și de livrare, AI și servicii financiare.",
    text: "Grupul eMAG continuă investițiile în tehnologie, logistică și servicii care susțin dezvoltarea economiei digitale și anunță un buget de 1,2 miliarde de lei pentru următorul an fiscal. Investițiile vor merge predominant către infrastructura logistică și de livrare, AI și servicii financiare. În 2025, Grupul eMAG a înregistrat o cifră de afaceri de 11,1 miliarde de lei și a plătit taxe de 1,3 miliarde de lei către statul român.",
    url: "https://www.retail-fmcg.ro/e-commerce-2/grupul-emag-investitii-2026.html",
    title: "Grupul eMAG anunță investiții de 1,2 miliarde de lei pentru următorul an fiscal și accelerează dezvoltarea comerțului online prin AI", publisher: "Retail-FMCG.ro", sourceType: "news", language: "ro",
    eventDate: "2026-05-20", publishedAt: "2026-05-20", retrievedAt: RETRIEVED_AT,
    hash: "c9762a90c5b78835a40a346724280e9f3720a6967bac43898ead8ed84650d0cd", // sha256(text)
    eventKey: "emag:fy-investment-1-2bn-ai:2026-05-20",
    quality: 0.8, // qualityRubric("news", quoteValid=true, companyNamed=true, dateValid=true)
    status: 'review', synthetic: false, model: MODEL, extractionVersion: 'manual', ruleVersion: 1,
    polarity: "positive", claimType: "plan", category: "technology",
    reason: "Trade outlet reports eMAG Group's 1.2 bn lei investment budget for the next fiscal year, naming AI among the main destinations.",
    uncertainty: "AI spend is mainly customer-facing (iZi shopping agent, marketplace listing tools) per the same article; eMAG builds AI in-house (possible internal-capability penalty). AI share of the budget not stated.",
  },
];

/** Appends demo-seed companies and evidence, skipping ids already present. Pure and idempotent; does not recalculate. */
export function applyDemoSeed(w: Workspace): Workspace {
  const companyIds = new Set(w.companies.map(c => c.id));
  const evidenceIds = new Set(w.evidence.map(e => e.id));
  return {
    ...w,
    companies: [...w.companies, ...demoSeedCompanies.filter(c => !companyIds.has(c.id)).map(c => structuredClone(c))],
    evidence: [...w.evidence, ...demoSeedEvidence.filter(e => !evidenceIds.has(e.id)).map(e => structuredClone(e))],
  };
}
