# LeadRadar — scenariul prezentării (≈4 minute, 11 slide-uri)

Construit pe arcul „Deeptech Storytelling Canvas" 1 → 11. Fiecare beat = un slide. Textul este ceea ce spune vorbitorul, scris ca vorbire naturală, nu ca bullet-uri. Cifrele vin din whitepaper v7.1 și din landing page; tot ce este ipoteză de lucru este marcat ca atare și în vorbire.

Convenții pentru capturi de ecran:
- **[LP]** = landing page (artefactul „LeadRadar", tema dark, lățime 1440 px). Capturile din LP se fac cu tema **dark** (fundal `#040814`) — culorile verde `#5fdc8a` și portocaliu `#f7a24d` ies cel mai bine pe proiector.
- **[APP]** = aplicația reală (`/`, `/companies`, `/tenders`, `/builder`, `/actions`, `/metrics`, `/how-it-works`), tot pe dark, în **workspace-ul demo** cu companii fictive etichetate. Nu puneți companii reale cu semnale inventate.
- Un singur element grafic „mare" pe slide. Restul e text puțin și mare.

---

## LOGLINE (se spune la început și la sfârșit — testul „retell")

> „Ajutăm echipele de vânzări B2B să afle **care companii au nevoie acum de ce vând ele**, citind automat licitațiile, angajările și știrile publice și transformându-le într-un scor pe care îl poți verifica rând cu rând — ca vânzătorul să sune cu un motiv, nu cu o listă."

Versiunea scurtă, de reținut de un străin: **„Nu găsim lead-uri. Găsim motive de a suna."** (este și titlul din aplicație, ecranul Welcome / How it works.)

Eroul poveștii este **vânzătorul de la Orange Business** (și, în general, omul de vânzări dintr-un furnizor IT). Noi suntem ghidul. Nu vorbim despre cât de deștepți suntem noi, vorbim despre ce poate face el mâine dimineață.

---

## ACT I · PUNEM SCENA

### Slide 1 — Cârligul
**Titlu pe slide:** 25 de minute pe companie. 83 de ore pe lună. Și lista e deja veche când ai terminat-o.

**Ce spui (≈20 s):**
„Un om de vânzări bun evaluează o companie în cam 25 de minute: citește licitațiile, anunțurile de angajare, știrile, raportul anual. La 200 de conturi asta înseamnă 83 de ore pe lună — jumătate din luna de lucru a unui om — și când ajunge la ultima companie, primele semnale s-au învechit. LeadRadar face lectura asta pentru el, în fiecare zi, și îi dă înapoi orele pentru telefoane."

**Vizual:** cifra „83 h / lună" mare, pe fundal dark. Sub ea, în portocaliu, „~25 min / companie · lista îmbătrânește".
**Captură:** **[LP]** blocul „Today · manual" din secțiunea *Pilot & pricing* (cardul cu cele trei cifre portocalii: ~25 min, 83 h, „Once, then the list ages"). Tăiați doar cardul din stânga, fără cel verde — verdele îl păstrați pentru slide 5.

---

### Slide 2 — Problema
**Titlu pe slide:** Vânzările au date. Nu au context și moment.

**Ce spui (≈25 s):**
„Orange Systems vinde automatizare, securitate, cloud, pe mai multe piețe. Întrebarea nu e «ce companii există», ci «care companie, în ce piață, are nevoie de ce, și de ce acum». Azi răspunsul se construiește manual: Sales Navigator, Google News, site-ul companiei, eJobs, o fișă în Excel. Fiecare vânzător o face în felul lui, nimic nu se păstrează, și când un coleg preia contul, pornește de la zero. Informația publică există. Lipsește lanțul care o transformă în semnale de vânzare pe care le poți verifica."

**Vizual:** banda-pipeline cu cei 7 pași — ICP → Accounts → Public data → Signals → Interpretation → Score → Prioritised accounts. Este exact lanțul pe care azi îl face un om în cap.
**Captură:** **[LP]** secțiunea *The problem*, elementul `.pipe` (banda cu săgeți animate; pilulele verzi „Signals" și „Score", pilula portocalie „Prioritised accounts"). Captura se face cu banda întreagă pe un rând, 1440 px.

---

### Slide 3 — Pentru cine
**Titlu pe slide:** Eroul: omul de vânzări care trebuie să aleagă pe cine sună mâine.

**Ce spui (≈25 s):**
„Cine simte durerea: vânzătorul și presales-ul care pierd ziua citind. Cine plătește: directorul comercial al unui furnizor IT sau telecom cu portofoliu de mai multe servicii — care are nevoie ca acelașii proces să meargă pentru NIS2, pentru cloud, pentru IoT, nu doar pentru un produs. Primul nostru client real este **Orange Business Romania B2B**: piața România și Moldova, opt servicii din catalogul lor, două sute de conturi. Pentru hackathon construim pentru ei; produsul e făcut să funcționeze pentru orice furnizor B2B — îi dai linkul spre pagina serviciului și el propune profilul de client ideal."

**Vizual:** trei coloane simple: *Simte durerea* (Sales, Presales) · *Plătește* (Director comercial / Head of Sales) · *Primul client* (Orange Business Romania — 8 servicii, RO + MD).
**Captură:** **[LP]** globul din hero (canvas-ul centrat pe România și Moldova, cu etichetele verzi „sursă de date" și portocalii „companie scorată"). Faceți captura după ce s-a încărcat animația (~2 s), cu legenda de sub glob. E cel mai frumos element grafic al landing-ului — îl folosiți aici, o singură dată.

---

### Slide 4 — De ce acum
**Titlu pe slide:** De ce se poate rezolva azi și nu în 2021.

**Ce spui (≈25 s):**
„Trei lucruri s-au schimbat. Unu: modelele de limbaj citesc o pagină în română și scot **citatul exact**, cu dată și sursă — acum doi ani halucinau. Doi: datele publice s-au deschis — SEAP/SICAP, TED, MTender, ANAF, Termene, GDELT au API-uri sau fluxuri oficiale; nu mai depinzi de scraping pe LinkedIn, pe care nici nu-l folosim. Trei: reglementarea împinge piața spre noi — NIS2 în România prin OUG 155/2024, AI Act-ul cu obligații de transparență din august 2026; companiile trebuie să cumpere securitate și conformitate și lasă urme publice când o fac: angajează un CISO, publică o licitație. Semnalul există. Instrumentele de a-l citi există. Cumpărătorul e împins de lege. Asta e fereastra."

**Vizual:** trei pilule mari: „LLM citesc cu citat exact" · „Date publice cu API: SEAP · TED · MTender · ANAF" · „NIS2 + AI Act împing cumpărătorul".
**Captură:** **[LP]** coloana stângă din diagrama *How it works* — cele cinci noduri de intrare (SEAP/SICAP, TED · MTender, Termene.ro · ANAF, Career pages · job boards, News · GDELT · reports), cu iconițele verzi. Tăiați doar coloana surselor, nu întreaga diagramă (întreaga diagramă o folosiți pe slide 5).

---

## ACT II · O FACEM REALĂ

### Slide 5 — Soluția
**Titlu pe slide:** Sute de surse intră. Iese o listă de companii, fiecare cu dovada și motivul de a suna.

**Ce spui (≈35 s):**
„Ce devine posibil: fiecare companie din piața ta, recitită în fiecare zi, cu același standard de dovadă, și un vânzător care deschide dimineața un singur ecran — «Ce a găsit radarul», «Decizia ta», «Companii scorate» — și vede pentru fiecare cont **de ce** a urcat: citatul exact, sursa, data. Cum funcționează, în trei fraze: îi dai adresa paginii tale de serviciu și LeadRadar propune profilul de client ideal și întrebările de semnal — «angajează roluri GRC / NIS2?», «a publicat o licitație de securitate?». Apoi citește licitațiile, registrele, presa și joburile și transformă fiecare semnal într-o afirmație cu citat; dacă textul nu o spune, noi nu o pretindem. La final, o formulă deschisă calculează prioritatea, iar un om aprobă, editează sau respinge fiecare acțiune. Nimic nu pleacă fără el."

**Vizual:** ecranul principal al aplicației. Acesta e slide-ul cu cea mai mare captură.
**Captură:** **[APP]** ruta `/` (Radar), workspace demo: banda de pipeline de sus cu contoare (Public sources read → Evidence extracted → Companies scored → **Need your decision** [portocaliu] → In HubSpot) + blocurile numerotate „1 What the radar found", „2 Your decision", „3 Scored companies". Full-width, cu cel puțin 5–6 rânduri în tabelul de companii scorate. Dacă nu încape, două capturi: banda + blocul 1 și 2 pe slide 5, tabelul pe slide 6.
**Element grafic secundar (opțional, colț jos):** **[LP]** diagrama *How it works* cu „beams" animate (surse → nucleu → ieșiri: Evidence cards, Score & priority, Decision Case, HubSpot task, Presales brief). Dacă îl puneți, redus la 40% din lățime, în dreapta.

---

### Slide 6 — Dovada că funcționează
**Titlu pe slide:** Nu credeți scorul. Deschideți-l.

**Ce spui (≈35 s):**
„Asta e cardul unei companii. Scorul 82 e descompus: potrivire cu profilul, semnale, acoperire, penalizări. Sub el, fiecare dovadă are eticheta **Fapt** sau **Ipoteză**, citatul în limba sursei, sursa și data. Formula e publică: P = 0,35·F + 0,65·R − N. F este potrivirea cu profilul ideal; R este relevanța semnalelor, unde fiecare dovadă pierde din greutate cu timpul — un semnal de acum un an valorează jumătate; N sunt doar penalizările configurate explicit. Ce nu știm nu costă nimic: «necunoscut» nu e «negativ». Ce am verificat până acum: pipeline-ul merge cap-coadă pe cazuri de referință — 146 de teste unitare, 10 teste end-to-end, extractorul pe reguli a găsit 17 din 21 de semnale pe 18 pagini reale, și avem 36 de reguli de acceptare scrise înainte de cod. Ce nu pretindem: o probabilitate de cumpărare. Este o prioritate. Precizia pe primele 20 o măsurăm în pilot, cu un om care judecă, și o raportăm cu numitorul."

**Vizual:** cardul de companie, lângă formula.
**Captură 1:** **[APP]** *Company Intelligence Card* deschisă (side sheet din `/` sau `/companies`) pe o companie demo cu scor ≥ 70: meterul de scor cu Fit / Signals / Coverage / Penalties, două carduri de dovezi Fact/Hypothesis, „Internal context", „Recommended offer", butoanele Approve / Reject. Alternativ: **[LP]** cardul „Company intelligence card · demo — Danubia Energy SA (fictional), 82".
**Captură 2 (element grafic):** **[LP]** blocul formulei `P = clamp(0.35·F + 0.65·R − N, 0, 100)` cu meterul verde/portocaliu de sub el (secțiunea *AI & scoring*). Este cel mai „tech" element vizual al landing-ului și răspunde direct la criteriul AI/ML Innovation.
**Notă TECH pentru juriu:** spuneți explicit: „Schimbăm modelul de limbaj și scorul nu se mișcă — scorul e calculat în cod versionat, LLM-ul doar citește și citează." E propoziția care apără defensibilitatea.

---

### Slide 7 — Modelul de business
**Titlu pe slide:** Patru săptămâni. O piață. Un serviciu. O sută de conturi. Apoi decideți.

**Ce spui (≈25 s):**
„Vindem un pilot plătit de patru săptămâni — scop, catalog, identități în săptămâna 1; primul lot cercetat și revizuit în săptămâna 2; utilizare repetată și acțiuni CRM aprobate în 3; evaluare pe set ținut deoparte și decizie în 4. Apoi SaaS lunar, între 500 și 1.500 de euro pe organizație, scenariul central 1.000. Costul nostru de livrare: aproximativ 2,50 euro pe cont pe lună, cu tot cu review — deci marja e în software, nu în oameni. Un al treilea produs: pachete de rezultate verificate, de exemplu «NIS2 Opportunity Pack», 50 de conturi cu dovezi și recomandări, fără promisiune de întâlniri. Cifrele de timp — de la 25 la 8 minute pe companie — sunt ipoteza noastră de lucru și le măsurăm în pilot, nu le pretindem."

**Vizual:** cele două carduri față în față, „Today · manual" (portocaliu) vs „With LeadRadar" (verde).
**Captură:** **[LP]** secțiunea *Pilot & pricing*: cardurile `.vs` (manual vs LeadRadar) întregi. Sub ele, opțional, cele patru carduri de preț (Pilot · Starter · Growth · Enterprise) micșorate; cardul „Pilot · 4 weeks — Recommended" cu marginea verde iese în față.

---

## ACT III · RĂSPLATA

### Slide 8 — Oportunitatea
**Titlu pe slide:** O platformă, nu un produs: un serviciu nou e un șablon, nu un proiect.

**Ce spui (≈25 s):**
„Beachhead: furnizorii IT, integratorii și operatorii telecom/cloud din România și Moldova cu portofolii de mai multe servicii — sute de organizații care fac azi cercetare manuală de conturi. Pentru Orange, opt servicii din catalog vin deja ca șabloane: NIS2, MDR, cloud, conectivitate, IoT, analytics, consultanță IT, automatizare inteligentă. Ce deblocăm: înainte — un vânzător, o companie, o dată pe lună; după — toată piața, în fiecare zi, cu aceleași standarde, și un ciclu de învățare: fiecare accept și fiecare respingere cu motiv propune o pondere mai bună pentru versiunea următoare. Extinderea la o piață nouă înseamnă alte surse publice și altă limbă, nu alt produs. Extinderea la un serviciu nou înseamnă o pagină web și zece minute în Signal Builder."

**Vizual:** Signal Builder — asta arată juriului că „configurabilitate" nu e o promisiune.
**Captură:** **[APP]** ruta `/builder`: lista de întrebări de semnal cu ponderi High/Medium/Low, regulile negative, și panoul simulatorului live („Same companies, same evidence, same time — only the draft differs"). Ideal, o captură în care ați schimbat o pondere și se vede reordonarea. Alternativ **[LP]** cardul „Signal Builder · SCUT NIS2 formula v3" cu chip-urile verzi/portocalii.

---

### Slide 9 — Competiția
**Titlu pe slide:** Platformele mari găsesc companii. Noi găsim motivul, pentru produsul tău, în piața ta.

**Ce spui (≈25 s):**
„Alternativa numărul unu este «nu facem nimic»: Sales Navigator, Google și un Excel — asta bate azi 90% din piață. Apoi 6sense, Bombora, Demandbase, Apollo, Clay, Common Room: dovedesc categoria, sunt mai buni decât noi la date de contact și la intenție anonimă la scară globală, și o spunem deschis. Dar nu citesc SEAP, MTender sau Termene.ro, scorurile lor sunt cutii negre la nivel de persoană, iar maparea semnalului pe serviciul din catalog rămâne la client. Noi: evenimente publice, citabile; nivel de companie prin design; formulă deterministă pe care o poți contesta; context intern din CRM **și** contabilitate — un client existent primește altă acțiune decât un prospect. Ce e greu de copiat: sursele locale RO/MD ca surse de prim rang, șabloanele pe serviciu și bucla de învățare din deciziile clientului — ponderile devin ale lui, nu ale noastre."

**Vizual:** tabelul comparativ.
**Captură:** **[LP]** tabelul din secțiunea *Compared with the category* (Dimension · Category pattern · LeadRadar) — 8 rânduri. Dacă e prea dens pentru proiector, păstrați 4 rânduri: Where intent comes from · Level of identity · Scoring · Geography. Subtitlu pe slide, cu litere mici: „Where they are better and we say so: contact data, anonymous intent, years of outcome data."

---

### Slide 10 — Echipa & de ce noi
**Titlu pe slide:** Am construit întâi regulile, apoi codul.

**Ce spui (≈20 s):**
„Suntem patru: un product manager, doi dezvoltatori, un designer. Insight-ul nostru: încercările anterioare de «AI pentru lead-uri» au eșuat pentru că au lăsat modelul să decidă și pe om să creadă. Noi am făcut invers — am scris 36 de reguli de acceptare și un contract de scor înainte de prima linie de cod, iar modelul de limbaj nu are voie decât să citească și să citeze. Ce ne lipsește și știm: date de rezultate reale pentru calibrare — de asta pilotul e produsul — și consiliere juridică RO/MD pe fluxul de outreach, pe care o programăm înainte de primul client plătitor."

**Vizual:** patru nume + rol, o frază fiecare (cine a făcut ce în 48 de ore). Fără CV-uri.
**Captură:** niciuna mare. Opțional, **[APP]** `/metrics` — cardurile „Time saved", „Evidence verified", „Precision", „Weight proposals awaiting review" — pentru a arăta că măsurăm propriul progres. Sau logo-ul LeadRadar (marca L + hexagon din nav-ul landing-ului, SVG din `assets/logos/`).

---

### Slide 11 — Cererea, riscul & viziunea
**Titlu pe slide:** Cerem un pilot. Cel mai mare risc e încrederea. Planul nostru e să nu o cerem.

**Ce spui (≈30 s):**
„Cererea: un pilot de patru săptămâni cu Orange Business Romania pe un serviciu — NIS2 — și o sută de conturi, cu criterii de precizie agreate înainte. Dacă ratăm, păstrați dovezile și plecați. Riscul cel mai mare nu e tehnic, e de încredere: un vânzător care primește un lead greșit de două ori nu se mai întoarce, iar un mesaj trimis fără bază legală costă amenzi și reputație. Planul: fiecare scor deschis rând cu rând, identitatea companiei confirmată înainte de orice acțiune, un om care aprobă fiecare pas, o listă de suprimare verificată înainte să fie generat orice draft, și registrul complet de riscuri și GDPR în capitolul 15 al whitepaper-ului — nu spunem «conform», spunem «controale pe care le operăm». Viziunea: un sistem de operare pentru deciziile comerciale — orice furnizor B2B din Europa își pune linkul, își citește piața în fiecare dimineață și sună cu un motiv. Nu găsim lead-uri. Găsim motive de a suna."

**Vizual:** cele 8 trepte ale porții de conformitate — pentru juriu e dovada că „Business Impact" și „Technical Execution" au fost gândite până la capăt.
**Captură:** **[LP]** grila `.gate` cu cele 8 trepte (1 Signal + company → 2 Classify the contact → 3 Legal-basis check → 4 Suppression list [alb, STOP] → 5 AI draft with disclosure → 6 Human review → 7 CRM record with dossier → 8 Send from the CRM, then learn), fiecare cu eticheta legală mică (GDPR Art. 5/6/21/22, AI Act). Sub ea, principiul: **„LeadRadar prepares. A person sends."**
**Captură secundară (mică):** **[APP]** `/actions` — HubSpot preview cu butonul „Commit to HubSpot" și textul de draft — arată că aprobarea e reală, nu slide.

---

## Închiderea — testul „retell" (10 s)

„Dacă rețineți un singur lucru: LeadRadar citește piața publică în locul vânzătorului, îi arată dovada și motivul, și îl lasă pe el să decidă. Problema: 83 de ore pe lună de citit. Soluția: un radar cu formulă deschisă și un om la capăt. Impactul: toată piața, în fiecare zi, pentru prețul unei zile de analist."

---

## Anexă A · Harta capturilor (ce, de unde, unde)

| Slide | Sursă | Ce anume capturăm | Ce element grafic din landing reutilizăm |
|---|---|---|---|
| 1 | LP | cardul „Today · manual" (3 cifre portocalii) | cifrele `.pn.o` |
| 2 | LP | banda-pipeline `.pipe` (7 pași) | săgețile animate + pilulele verzi/portocalie |
| 3 | LP | globul din hero cu etichete + legendă | canvas-ul glob (o singură dată în deck) |
| 4 | LP | coloana celor 5 surse din *How it works* | nodurile `.node` cu iconițe verzi |
| 5 | APP `/` | Radar: banda de pipeline + blocurile 1-2-3 | (secundar) diagrama flux cu beams |
| 6 | APP card companie + LP | Company Intelligence Card; blocul formulei P | `.formula` + `.meter` verde/portocaliu |
| 7 | LP | cardurile manual vs LeadRadar; (opțional) prețuri | `.vs` + cardul „Pilot · Recommended" |
| 8 | APP `/builder` (sau LP card Signal Builder) | întrebări, ponderi, reguli negative, simulator | chip-urile `.chip.on` / `.chip.neg` |
| 9 | LP | tabelul comparativ (4–8 rânduri) | `.tbl` |
| 10 | APP `/metrics` sau logo | cardurile de metrici; marca L + hexagon | SVG logo din nav |
| 11 | LP + APP `/actions` | grila porții de conformitate cu 8 trepte; HubSpot preview | `.gate` + principiul „LeadRadar prepares. A person sends." |

## Anexă B · Reguli de stil pentru deck (din design system-ul „Lunaris")

- Fundal `#040814`, carduri `#1c2030`, text `#f4f4f8`. Font **Outfit** (300/400/500) — titluri la weight 400, nu bold.
- **Verde `#5fdc8a`** = o singură acțiune primară / cifra „bună" pe slide. **Portocaliu `#f7a24d`** = durere, „de ce acum", termene, ce așteaptă decizie. Portocaliul nu e niciodată buton principal.
- Un număr mare pe slide, o propoziție, o captură. Titlurile de slide de mai sus sunt propoziții întregi — păstrați-le așa, juriul le citește în 2 secunde.
- Fiecare captură din aplicație pe workspace demo: companiile sunt fictive și etichetate; nu afișați o companie reală ca „vulnerabilă" sau „atacată".
- Etichete oneste vizibile în captură când există: „Priority, not purchase probability", „uncalibrated estimate", „Fact / Hypothesis". Juriul le va vedea drept maturitate, nu slăbiciune.

## Anexă C · Cifrele folosite și de unde vin

- 25 min / companie; 83 h / lună la 200 de conturi; 25 → 8 min: ipoteza de lucru a echipei, measurabilă în pilot (whitepaper cap. 1 și 13; landing *Pilot & pricing*).
- P = clamp(0,35·F + 0,65·R − N, 0, 100); d = 2^(−age/half-life); benzi Hot ≥ 70 / Warm ≥ 40: contractul de scor, whitepaper cap. 6, Annex B.
- 500–1.500 EUR / lună, scenariu central 1.000; ≈2,50 EUR cost de livrare pe cont: whitepaper cap. 13 (ipoteze, nu preț).
- 8 șabloane de serviciu; 36 de reguli de acceptare (Annex A); 146 teste unitare + 10 e2e; extractor pe reguli 17/21 pe 18 pagini reale: CLAUDE.md și commit-ul din 26 sept.
- Fereastra de oportunitate 45–90 zile: estimare pe reguli, necalibrată (cap. 7).
- Registrul de riscuri, GDPR, AI Act: whitepaper v7.1 cap. 15 (adăugat azi).
- Criterii juriu: 25 / 20 / 20 / 15 / 10 / 10 — slide-urile 6 (Relevanță & AI), 8 (Configurabilitate), 5 (UX), 7–8 (Business), 11 (Execuție tehnică).
