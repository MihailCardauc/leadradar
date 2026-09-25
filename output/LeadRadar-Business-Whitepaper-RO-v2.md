# LeadRadar
## Inteligență comercială conectată la afacerea ta

**Whitepaper de business v2 | Orange Systems / GigaHack 2026**

25 septembrie 2026 • Analiză competitivă, strategie de produs și integrări

### Propunerea de valoare

**LeadRadar transformă semnalele publice și contextul comercial propriu în oportunități pentru servicii IT, cu dovezi verificabile și acțiuni în sistemele folosite deja de echipă.**

Un semnal devine mai util atunci când știm dacă firma este deja client, ce servicii cumpără, cine gestionează relația și dacă există deja o oportunitate activă. De aceea, integrarea cu CRM-uri, baze de date, asistenți AI prin MCP și aplicații de contabilitate reprezintă o direcție centrală a produsului.

Viziunea este un traseu complet: **semnal public → context intern → serviciu relevant → acțiune în CRM → rezultat comercial observabil**. Utilizatorul poate verifica atât motivul recomandării, cât și sursele care au contribuit la aceasta.

### De ce această versiune este mai puternică

Analiza materialului competitor.md arată că platformele consacrate oferă deja semnale configurabile, cercetare AI, scoring și numeroase integrări. Clay și Common Room documentează inclusiv acces MCP. Diferențierea LeadRadar trebuie susținută printr-un flux specializat pentru servicii IT, care folosește inclusiv contextul contabil disponibil și livrează rapid o decizie utilă. Conectivitatea este infrastructura acestei promisiuni, nu o exclusivitate demonstrată.

### Ce propunem să demonstrăm

- Cercetare publică, dovezi și scoring configurabil pentru un serviciu Orange Systems.
- O integrare CRM reală, un import din PostgreSQL și acces MCP la aceleași rezultate.
- Context contabil într-un mediu de test sau printr-un import explicit etichetat, pentru recunoașterea clienților existenți și a serviciilor deja facturate.
- Un pas comercial aprobat de utilizator, înregistrat o singură dată în CRM.

**Echipa:** doi dezvoltatori backend/AI, un dezvoltator frontend și un product/project manager. **Statut:** strategie propusă; integrările și țintele descrise nu sunt prezentate ca deja implementate sau validate.

**Structură:** problema, soluția, piața, modelul comercial, concurența, funcțiile prioritare, CRM și baze de date, contabilitate, MCP, tehnologiile reutilizabile, diferențierea, echipa, pilotul și execuția.

<!-- PAGEBREAK -->

## 1. Problema: momentul potrivit este greu de identificat

Vânzarea unui serviciu IT complex presupune mai mult decât găsirea unei companii cu dimensiunea și industria potrivite. Echipa comercială trebuie să înțeleagă dacă există o nevoie actuală, ce schimbare a declanșat-o și cum se leagă aceasta de oferta furnizorului.

Conform brief-ului Orange Systems furnizat de echipă, acest proces implică astăzi cercetarea manuală a știrilor, site-urilor, anunțurilor de angajare, publicațiilor companiei și activității publice. Informația există în surse diferite, în formate și limbi diferite. Interpretarea și prioritizarea rămân în mare parte în sarcina oamenilor de vânzări.

### Cele patru dificultăți

| Dificultate | Efect asupra echipei comerciale |
| --- | --- |
| Informații dispersate | Același prospect necesită verificări în mai multe surse și actualizări repetate. |
| Context insuficient | O știre despre AI nu arată automat o nevoie de automatizare sau un buget disponibil. |
| Priorități inconsistente | Doi colegi pot evalua diferit aceeași companie, fără reguli comune și dovezi comparabile. |
| Moment comercial incert | O companie potrivită structural poate să nu aibă acum un motiv pentru o discuție. |

### Cine are problema și cine plătește

Utilizatorii sunt reprezentanții de dezvoltare comercială, account managerii și specialiștii care pregătesc cercetarea conturilor. Sponsorul intern poate fi directorul comercial sau responsabilul pentru operațiunile de vânzări. Cumpărătorul LeadRadar este organizația care vinde servicii IT.

Companiile monitorizate - de exemplu producători, retaileri sau organizații de servicii - sunt potențialii clienți ai acelui furnizor. Numărul lor nu trebuie confundat cu numărul de organizații care ar cumpăra LeadRadar.

### Informația internă poate schimba acțiunea

Un prospect aparent nou poate fi deja client în contabilitate, dar absent din lista comercială. Un serviciu propus poate fi deja cumpărat, iar o oportunitate poate avea un responsabil în CRM. Conectarea acestor informații reduce cercetarea duplicată și recomandările fără context. Datele provin din sistemele autorizate ale organizației care folosește LeadRadar, nu din contabilitatea privată a prospectului.

### Costul problemei: exemplu ilustrativ

La 200 de companii cercetate lunar și 25 de minute per companie, cercetarea consumă aproximativ 83,3 ore. Dacă un flux asistat reduce timpul la 8 minute, consumul devine 26,7 ore, iar diferența este de aproximativ **56,7 ore lunar**.

La o valoare internă ipotetică de 30 EUR/oră, capacitatea eliberată valorează aproximativ 1.700 EUR/lună. Acesta este un scenariu de productivitate, nu o economie de numerar demonstrată. Timpul inițial, timpul asistat și calitatea rezultatului trebuie măsurate într-un pilot. Mai multe mesaje trimise nu reprezintă singure dovada unui rezultat comercial mai bun.

<!-- PAGEBREAK -->

## 2. Soluția: cercetare care conduce la o decizie

LeadRadar propune un spațiu de lucru în care echipa definește ce caută, vede dovezile găsite și decide ce prospect merită abordat. Un serviciu are propriile întrebări și reguli; aceeași companie poate fi relevantă pentru securitate și irelevantă pentru automatizare.

### Fluxul principal

1. **Definirea profilului ideal:** piață, geografie, industrie, dimensiune și reguli de excludere.
2. **Configurarea serviciului:** întrebări în limbaj natural, ponderi și semnale negative. Exemplu: „Compania anunță inițiative de eficiență operațională?”
3. **Colectarea și conectarea:** surse publice plus informații autorizate din CRM, baze de date și contabilitate. Păstrăm separat proveniența publică și cea internă.
4. **Extragerea dovezilor:** răspuns structurat, fragment justificativ, adresă sursă, dată și asocierea corectă cu entitatea analizată.
5. **Prioritizarea:** reguli explicabile combină potrivirea cu profilul, actualitatea semnalelor și nivelul de acoperire a cercetării.
6. **Acțiunea și feedback-ul:** fișă explicată, recomandare de serviciu și sarcină aprobată în CRM. Rezultatul comercial revine în sistem pentru evaluare.

### Ce trebuie să vadă utilizatorul

| Element | Întrebarea la care răspunde |
| --- | --- |
| Potrivire cu profilul | Este compania în segmentul pe care îl putem servi? |
| Semnale recente | Ce s-a schimbat și de ce ar conta acum? |
| Dovezi și limite | Ce este confirmat, ce este dedus și ce nu știm încă? |
| Serviciu relevant | Ce parte din ofertă ar putea răspunde situației? |
| Următor pas | Ce ar trebui validat într-o conversație? |

### Exemplu ipotetic: automatizare și relația existentă

O companie publică un program de eficiență operațională și un anunț pentru un specialist în process excellence. LeadRadar le poate corela cu un serviciu de automatizare și poate recomanda o discuție despre procesele repetitive prioritare. Dacă CRM-ul arată un client existent și facturile confirmă servicii cloud, recomandarea este o discuție de extindere cu responsabilul contului. Dacă nu există asociere internă sigură, relația rămâne necunoscută. Semnalele nu demonstrează bugetul sau intenția de externalizare.

Răspunsurile pot fi „da”, „nu”, „necunoscut” sau „contradictoriu”. Lipsa unei informații nu devine automat un semnal negativ. Scorul indică prioritatea de cercetare și contactare; nu este prezentat drept probabilitate de cumpărare fără calibrare pe rezultate reale.

<!-- PAGEBREAK -->

## 3. Piața: oportunitate mare, segment inițial precis

„Semnale B2B” descrie o capacitate care apare în mai multe categorii: sales intelligence, intent data și platforme de vânzări și marketing. Sursele consultate nu oferă o măsurare separată, comparabilă, pentru exact nișa LeadRadar: semnale publice configurabile pentru vânzarea serviciilor IT.

Categoria sales intelligence oferă un reper de context. **Nu reprezintă automat piața accesibilă produsului.**

### Estimări externe pentru categoria globală

| Sursă | Estimare pentru 2025 | Prognoză publicată |
| --- | --- | --- |
| Grand View Research | 4,0 miliarde USD | 8,7 miliarde USD în 2033; CAGR de 10,1% pentru 2026-2033. |
| Fortune Business Insights | 4,85 miliarde USD | 12,45 miliarde USD în 2034; CAGR de 11,10% pentru 2026-2034. |

Surse: [Grand View Research - Sales Intelligence Market](https://www.grandviewresearch.com/industry-analysis/sales-intelligence-market), [Fortune Business Insights - Sales Intelligence Market](https://www.fortunebusinessinsights.com/sales-intelligence-market-109103). Consultate la 25 septembrie 2026. Valorile sunt estimările editorilor, iar cele viitoare sunt prognoze. Diferența dintre estimări reflectă metodologii și delimitări diferite; nu este un interval statistic de încredere.

### TAM, SAM și SOM fără a exagera oportunitatea

**TAM de categorie:** estimările de mai sus arată dimensiunea pieței înrudite. TAM-ul exact pentru nișa LeadRadar rămâne de stabilit prin definirea cumpărătorilor și validarea disponibilității de plată.

**SAM inițial, construit de jos în sus:** furnizori IT europeni care vând servicii complexe, au cercetare comercială recurentă și pot cumpăra un abonament. Următoarele valori sunt scenarii de planificare, nu un recensământ al pieței:

| Scenariu | Organizații eligibile × abonament anual | Valoare anuală ipotetică |
| --- | --- | --- |
| Restrâns | 500 × 6.000 EUR | 3 milioane EUR |
| De bază | 1.000 × 12.000 EUR | 12 milioane EUR |
| Extins | 2.000 × 18.000 EUR | 36 milioane EUR |

**SOM ca obiectiv operațional:** 20 de clienți activi la 12.000 EUR/an ar însemna 240.000 EUR venit anual recurent la sfârșitul unei perioade de 24 de luni. Acesta este un obiectiv condițional, nu o prognoză validată și nici venitul cumulat în cei doi ani.

Validarea cere o listă deduplicată de cumpărători eligibili, interviuri și teste de preț. Moneda USD a cercetării externe și scenariile în EUR sunt păstrate separat, fără conversii presupuse.

<!-- PAGEBREAK -->

## 4. Model comercial și intrare pe piață

Primul segment recomandat este format din furnizori de servicii IT cu mai multe oferte și o echipă care cercetează regulat conturi B2B. Alegerea pornește de la problema Orange Systems și permite folosirea unor șabloane comerciale repetabile: automatizare, securitate cibernetică și cloud.

### De la proiect demonstrativ la produs

Prima ofertă ar fi un pilot limitat la o piață, unul sau două servicii și un set agreat de companii. Partenerul pilot ar furniza criteriile comerciale și feedback-ul; echipa LeadRadar ar livra dovezi, prioritizare și măsurarea timpului de cercetare. Participarea la provocare nu reprezintă un acord comercial sau un parteneriat confirmat cu Orange.

Conectorii standard pot intra în abonament, iar integrările personalizate pot avea cost de configurare și suport separat. Nu promitem acces nelimitat la toate sistemele: fiecare conector are obiecte, operații și limite documentate.

După validare, același model poate fi propus integratorilor, furnizorilor de servicii administrate și consultanțelor IT care vând servicii comparabile. Extinderea către alte industrii de vânzători ar urma numai după demonstrarea unui proces de configurare repetabil.

### Ipoteză de monetizare

Abonament lunar per organizație, cu limite transparente pentru companii monitorizate, frecvența actualizărilor și consumul de cercetare. Un interval inițial de testare de **500-1.500 EUR/lună**, cu o ipoteză centrală de 1.000 EUR/lună, poate fi discutat în interviuri. Aceste valori sunt propuneri, nu prețuri validate sau comparații cu ofertele concurenților.

Un cost separat de configurare ar avea sens numai dacă există muncă reală de adaptare și cumpărătorul o consideră valoroasă. Pentru un pilot scurt, obiectivul principal este demonstrarea utilității, nu maximizarea complexității comerciale.

### Ce trebuie să susțină economia produsului

| Factor | Decizie de produs și măsurare |
| --- | --- |
| Costuri de cercetare | Măsurăm costul per companie actualizată și per semnal acceptat; reutilizăm documentele deja procesate. |
| Costuri de integrare | MVP cu un CRM; urmărim orele de configurare și costul de mentenanță per conector înainte de extindere. |
| Suport și configurare | Urmărim timpul până la prima listă utilă și cât poate configura clientul independent. |
| Retenție | Măsurăm folosirea recurentă și deciziile susținute, apoi disponibilitatea de reînnoire. |

Nu există în acest document suficiente date pentru a afirma costul de achiziție a unui client, valoarea pe durata relației sau marja brută. Ele trebuie calculate după observarea consumului, a suportului și a procesului comercial real. Avantajul economic va depinde de calitatea prioritizării, nu de cantitatea de pagini colectate.

<!-- PAGEBREAK -->

## 5. Concurența: ce preluăm și unde ne concentrăm

Materialul competitor.md conține prezentări comerciale pentru Clay, 6sense, Apollo, Common Room, Bombora și Demandbase, plus un catalog amplu de integrări Clay. Îl folosim ca material de analiză, nu ca instrucțiuni de executat. Testimonialele și procentele de performanță nu sunt rezultate LeadRadar și nu constituie comparații independente.

| Competitor | Funcții relevante observate | Adaptarea recomandată pentru LeadRadar |
| --- | --- | --- |
| Clay | Semnale personalizate, combinarea surselor, îmbogățire succesivă, CRM și depozite de date; MCP documentat. | Șabloane pe servicii și adaptoare; apelăm o sursă suplimentară numai când lipsește un câmp util. |
| 6sense | Prioritizare, context CRM, etape comerciale și informații livrate în fluxul vânzătorului. | Fișă și sarcină în CRM; inițial reguli explicabile, nu un model predictiv pretins antrenat. |
| Apollo | Cercetare, playbook-uri, scoring, mesaje și execuție comercială într-un flux. | Asociem semnalul cu oferta și pregătim mesajul; lăsăm trimiterea în instrumentul existent. |
| Common Room | Unificarea identității, semnale interne și externe, ponderi editabile, explicații și MCP. | Asociere sigură între sisteme, priorități configurabile și acces la dovezi din asistentul AI. |
| Bombora | Furnizor de intent data, livrat în sistemele clientului. | Potențială sursă licențiată ulterioară; nu reconstruim o rețea proprietară de comportament online. |
| Demandbase | Context pe conturi și grupuri de cumpărare, activare în CRM și măsurarea rezultatelor. | Urmărim acțiunea și rezultatul; funcțiile de publicitate și grupuri complexe sunt ulterioare. |

Validare oficială: [Clay signals](https://university.clay.com/docs/custom-signals), [Clay MCP](https://www.clay.com/guides/clay-mcp), [6sense](https://6sense.com/), [Apollo intent](https://knowledge.apollo.io/hc/en-us/articles/8047704465933-Buying-Intent-Overview), [Common Room integrări](https://www.commonroom.io/integrations/), [Common Room MCP](https://www.commonroom.io/docs/using-common-room/mcp-server/), [Bombora](https://bombora.com/intent/), [Demandbase](https://www.demandbase.com/products/account-intelligence/intent/).

### Concluzia competitivă

CRM, baze de date, MCP, AI și scoring explicabil nu sunt individual avantaje unice. Nu avem dovezi că toți concurenții ar fi incapabili să includă date contabile prin extensii. Ipoteza noastră este că un flux gata configurat pentru servicii IT, cu context comercial și contabil, poate necesita mai puțin efort și poate produce recomandări mai utile pentru acest segment.

O comparație corectă măsoară aceeași sarcină în LeadRadar, într-o configurație Clay sau Common Room și în procesul manual: timp de configurare, asocierea corectă a firmei, relevanța recomandării și timpul până la o acțiune acceptată. Funcțiile comerciale descrise aici inspiră cerințe; codul și datele proprietare nu sunt reutilizate fără drepturi.

<!-- PAGEBREAK -->

## 6. Funcțiile de adoptat, în ordinea valorii

Analiza concurenței indică o direcție: cercetarea devine utilă când poate fi configurată și urmată de o acțiune. Prioritizarea de mai jos transpune funcțiile observate în cerințe proprii LeadRadar.

| Funcție inspirată din piață | Implementare propusă | Etapă |
| --- | --- | --- |
| Semnale personalizate și combinate | Întrebări pe serviciu, ponderi, reguli negative și ferestre de actualitate. | MVP |
| Cercetare AI cu context | Extragere structurată din documente; fiecare afirmație are dovadă sau este marcată ca ipoteză. | MVP |
| Identitate unificată a companiei | Asociere între identificatori CRM, domeniu și identificator fiscal, cu verificarea țării și entității. | MVP limitat |
| Scoring explicabil | Potrivire, semnale recente și acoperire afișate separat; contribuția fiecărei reguli este vizibilă. | MVP |
| Acțiune în CRM | Citire de conturi și oportunități; notă sau sarcină cu surse, după verificarea utilizatorului. | MVP, un CRM |
| Context contabil | Client existent, servicii facturate și sumar autorizat; fără deducții despre contabilitatea privată a prospectului. | Import în MVP; API în pilot |
| Acces din asistenți AI | MCP pentru căutare de oportunități și explicarea unui cont. | MVP, citire |
| Îmbogățire succesivă | Surse apelate în ordine până se obțin câmpurile necesare sau se atinge bugetul. | Pilot |
| Învățare din rezultate | Acceptat, respins și motiv, apoi oportunități și rezultate CRM. | Pilot; ML după acumularea datelor |

### Ce amânăm

Dialer propriu, secvențe complete de e-mail, publicitate ABM, identificarea vizitatorilor anonimi și baze masive de contacte nu sunt necesare pentru prima demonstrație. Acestea sunt zone unde concurenții au deja produse și date. Integrăm un instrument existent atunci când un client are nevoie de el.

### Exemplu de regulă comercială

Un anunț de eficiență operațională plus recrutare în process excellence crește relevanța pentru automatizare. Dacă firma este client existent, acțiunea merge la account manager. Dacă există o oportunitate activă pentru același serviciu, atașăm dovada la aceasta în loc să creăm o oportunitate duplicată. Lipsa datelor contabile nu reduce automat relevanța prospectului.

Pentru alerte, folosim praguri, intervale de liniște și gruparea evenimentelor. Utilizatorul trebuie să primească o schimbare relevantă și verificabilă, nu o notificare pentru fiecare republicare a aceleiași știri.

<!-- PAGEBREAK -->

## 7. CRM-uri și baze de date: integrare cu limite clare

Obiectivul comercial este compatibilitatea cu platforme CRM importante. Lista de mai jos este o selecție de ținte, nu un clasament verificat al cotelor de piață și nici o listă de conectoare deja disponibile în LeadRadar.

| Sistem | Operații utile și tehnologie | Prioritate propusă |
| --- | --- | --- |
| HubSpot | Companii, oportunități și asocieri prin API; notă sau sarcină cu dovada și scorul. | Primul CRM demonstrat |
| Salesforce | Account, Opportunity și Task prin REST; mapare pentru câmpurile clientului. | Pilot dacă partenerul îl folosește |
| Microsoft Dynamics 365 Sales | Tabele și relații prin Dataverse Web API; autorizare în mediul clientului. | Alternativă enterprise pentru pilot |
| Pipedrive | Organizații, oportunități și activități prin API; reguli pentru proprietarul contului. | Extindere pentru echipe mici |
| Zoho CRM | Module și relații prin API; permisiuni și cote conform ediției. | Extindere după cerere |
| PostgreSQL | Citire din view-uri aprobate, interogări parametrizate și utilizator cu acces limitat. | Primul conector de date |
| SQL Server, MySQL | Adaptoare separate, maparea schemelor și acces de rețea agreat. | Ulterior |
| BigQuery, Snowflake | Import de seturi definite de client, cu control al costului interogărilor. | Ulterior |

Documentație: [HubSpot Companies](https://developers.hubspot.com/blog/a-developers-guide-to-hubspot-crm-objects-company-object), [Salesforce REST](https://developer.salesforce.com/docs/platform/api-rest/guide/resources-list.html), [Dataverse](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview), [Pipedrive](https://developers.pipedrive.com/docs/api/v1), [Zoho CRM](https://www.zoho.com/crm/developer/docs/api/v8/).

### Contractul de sincronizare

CRM-ul rămâne sursa pentru responsabilul contului și etapa oportunității. LeadRadar deține dovezile și versiunile scorului. Sistemul contabil deține facturile și starea încasărilor. Un conector documentează ce citește, ce scrie și ce câmpuri nu suprascrie.

Păstrăm tenantul, sistemul sursă, identificatorul extern, momentul actualizării și proveniența fiecărui câmp. Domeniul web singur nu este suficient pentru a uni filiale sau firme cu denumiri similare. Conflictele de identitate ajung într-o listă de verificare.

Pentru scrieri, folosim chei de idempotență și verificarea rezultatului în sistemul destinație. Pentru citiri, paginare și cursor de sincronizare; pentru evenimente, deduplicare și reconciliere periodică. Actualizările LeadRadar nu trebuie să declanșeze o buclă între webhook și propria sincronizare.

<!-- PAGEBREAK -->

## 8. Contabilitatea: context pentru relația comercială

Integrarea contabilă este utilă mai ales pentru recunoașterea clienților și extinderea relațiilor existente. Datele accesate aparțin organizației care autorizează LeadRadar. **Nu obținem prin această integrare acces la facturile, bugetele sau registrele private ale unui prospect extern.**

| Situație | Informație necesară | Decizie posibilă |
| --- | --- | --- |
| Client nerecunoscut în lista de prospectare | Identificator client și asociere confirmată cu firma. | Direcționare către responsabilul relației existente. |
| Posibilă vânzare complementară | Categorii de servicii facturate, mapate la catalogul furnizorului. | Propunem un serviciu complementar pentru validare. |
| Oportunitate fără rezultat financiar vizibil | Asociere oportunitate-comandă-factură, dacă există identificatori suficienți. | Raportăm separat vânzarea declarată și suma facturată. |
| Factură restantă | Stare verificată și politica comercială a clientului. | Revizuire internă înaintea extinderii; fără a deduce automat insolvența. |

### Conectoare contabile propuse

**QuickBooks Online:** candidat pentru primul adaptor internațional, folosind API-ul Accounting și un sandbox. Datele candidate sunt clienți, facturi și plăți, în limitele accesului acordat. [API Invoice](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice), [configurare QuickBooks Sandbox cu Nango](https://nango.dev/docs/api-integrations/quickbooks-sandbox).

**Xero:** alternativă pentru clienții care îl utilizează; verificăm obiectele, permisiunile și condițiile aplicației înainte de implementare. [Invoices](https://developer.xero.com/documentation/api/accounting/invoices), [Payments](https://developer.xero.com/documentation/api/accounting/payments).

**SmartBill:** țintă relevantă de facturare pentru România, cu documentație API oficială. Documentația publică accesibilă confirmă API-ul, dar nu am verificat un export complet al istoricului necesar acestui caz. Primul pas este validarea endpoint-urilor de citire; dacă nu acoperă cerința, folosim un export autorizat. Nu echivalăm facturarea cu întreaga contabilitate. [SmartBill API](https://api.smartbill.ro/).

**Odoo:** țintă ERP/contabilitate ulterioară; API-ul JSON-2 din Odoo 19 este documentat, iar accesul extern depinde de plan și instalare. [Odoo External API](https://www.odoo.com/documentation/19.0/developer/reference/external_api.html). Pentru SAGA sau alte aplicații locale, pornim de la exporturi disponibile; nu promitem un API neverificat.

MVP-ul citește sau importă date și nu emite facturi. Absența unei linii de factură nu dovedește absența unui contract. Reînnoirile necesită date contractuale explicite, iar facturat, încasat și venit recunoscut contabil sunt noțiuni diferite. Sumele în monede diferite nu se adună fără o politică explicită de conversie.

<!-- PAGEBREAK -->

## 9. MCP: aceleași dovezi în asistentul AI

MCP este o interfață standard pentru comunicarea dintre aplicații AI și instrumente sau surse. Nu înlocuiește API-urile CRM, modelul de date, autorizarea și procesele de sincronizare. LeadRadar va folosi același nucleu de servicii pentru dashboard, API și MCP.

### Două direcții distincte

**LeadRadar ca server MCP:** expune instrumente bine definite pentru un client AI compatibil. Primul set este de citire: „caută conturi prioritare” și „explică oportunitatea”, cu filtre pe serviciu, piață și actualitate. Fiecare răspuns include identificatori de dovezi, surse și limitele cercetării.

**LeadRadar ca client MCP:** poate apela ulterior servere aprobate pentru surse externe. Un server terț este o integrare care trebuie evaluată, nu o permisiune universală asupra datelor. Nu instalăm automat servere descoperite pe web.

| Instrument propus | Rezultat | Control |
| --- | --- | --- |
| search_accounts | Listă prioritizată cu paginare și filtrare pe serviciu. | Tenant și drepturi aplicate pe server, nu din instrucțiunea modelului. |
| explain_account | Scor, reguli, surse și context intern permis. | Aceeași versiune folosită în interfață. |
| propose_crm_action | Previzualizare a unei note sau sarcini. | Nu scrie și nu trimite mesaje. |
| commit_crm_action | Execută ulterior acțiunea validată. | Confirmare legată de conținutul exact, acces verificat și cheie de idempotență. |

Pentru hackathon implementăm primele două instrumente. Scrierea rămâne în interfața verificabilă; operațiile MCP de scriere sunt etapă ulterioară. Compatibilitatea cu un client AI se demonstrează printr-un test, nu se deduce doar din existența endpoint-ului.

### Tehnologie și securitatea contextului

SDK-ul oficial TypeScript oferă componente pentru server și client; alegem o versiune stabilă compatibilă și o fixăm în proiect. Transportul remote propus este Streamable HTTP. [SDK oficial](https://github.com/modelcontextprotocol/typescript-sdk), [documentație SDK](https://ts.sdk.modelcontextprotocol.io/).

Textele din website-uri și documentele importate sunt date neîncrezătoare. O frază dintr-un raport nu poate acorda drepturi, schimba regulile de scoring sau solicita exportul CRM-ului. Secretele rămân pe server; rezultatul MCP este filtrat după accesul utilizatorului. Permisiunile se verifică din nou la fiecare operație, inclusiv după revocarea conexiunii.

Clay și Common Room oferă deja MCP. Avantajul urmărit este accesul simplu la contextul LeadRadar pentru servicii IT și relații existente, nu protocolul în sine.

<!-- PAGEBREAK -->

## 10. Tehnologii reutilizabile și decizii de construcție

Nu putem deduce tehnologiile interne ale concurenților din textele lor comerciale. Tabelul propune instrumente publice cu care putem implementa rapid funcții comparabile, fără a pretinde că reprezintă stack-ul competitorilor.

| Componentă | Alegere propusă | Ce construim noi |
| --- | --- | --- |
| Interfață și API | TypeScript, React/Next.js. | Configurare pe servicii, conturi, dovezi și previzualizarea acțiunilor. |
| Date și procesare | PostgreSQL; pg-boss pentru sarcini de fundal. | Model comun, proveniență, scoring, deduplicare și reconciliere. |
| Colectare web | Firecrawl prin serviciul găzduit; Playwright doar unde este necesar și permis. | Alegerea surselor și validarea asocierii document-companie. |
| Extragere AI | Un furnizor LLM cu răspuns structurat; validare a schemei în cod. | Întrebări, dovezi, tratarea contradicțiilor și evaluare pe cazuri etichetate. |
| Conectoare | API direct pentru primul CRM; Nango evaluat pentru autorizare și sincronizări ulterioare. | Maparea obiectelor, operațiile acceptate și rezolvarea conflictelor. |
| MCP | SDK oficial TypeScript. | Instrumente limitate, reguli de acces și același model de dovezi ca în UI. |

Proiecte reutilizabile: [Next.js](https://github.com/vercel/next.js), [pg-boss](https://github.com/timgit/pg-boss), [Playwright](https://github.com/microsoft/playwright), [Firecrawl](https://github.com/firecrawl/firecrawl), [Nango](https://github.com/NangoHQ/nango), [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

### Cumpărăm infrastructura comună, construim logica distinctivă

Nango este candidat pentru gestionarea conexiunilor și funcții de sincronizare în TypeScript. Suportul pentru autentificarea unui furnizor nu înseamnă automat că toate obiectele contabile sau CRM cerute sunt deja implementate. Verificăm fiecare operație, planul comercial și licența versiunii alese. [Catalog Nango](https://nango.dev/api-integrations).

n8n poate accelera un flux intern sau un pilot, dar nu îl presupunem gratuit pentru includere într-un SaaS care folosește acreditările clienților. Modelul de utilizare trebuie verificat înainte de adoptare. [Licența n8n](https://docs.n8n.io/sustainable-use-license/). Firecrawl găzduit și codul pentru self-hosting au condiții distincte; nu presupunem că publicarea pe GitHub permite orice reutilizare comercială.

### Contract minim pentru orice conector

Conectorul declară autentificarea, obiectele și câmpurile suportate, direcția transferului, cotele și strategia de reluare. Are jurnal fără secrete, stare vizibilă, test de revocare și teste pentru duplicate și erori. Un adaptor generic HTTP sau MCP accelerează transportul; nu elimină munca de mapare a sensului datelor.

Pentru prima versiune păstrăm o singură bază de date și un singur mecanism de joburi. Bibliotecile și serviciile se fixează la versiuni verificate la începutul implementării. Nu instalăm toate opțiunile din tabel doar pentru a crește numărul de tehnologii din prezentare.

<!-- PAGEBREAK -->

## 11. Diferențierea: integrarea trebuie să schimbe decizia

**Poziționare:** LeadRadar este platforma de semnale B2B pentru furnizori IT care conectează dovezile publice cu relația comercială existentă și le transformă în acțiuni trasabile în CRM și asistenți AI.

Nu concurăm inițial prin cel mai mare catalog de contacte sau cele mai multe conectoare. Prioritatea este un rezultat complet, configurabil și ușor de verificat pentru o echipă care vinde servicii complexe.

| Pilon | Valoare urmărită | Cum îl demonstrăm |
| --- | --- | --- |
| Semnal + serviciu | Același eveniment este evaluat diferit pentru automatizare, securitate sau cloud. | Schimbarea serviciului schimbă explicația și prioritatea, conform regulilor. |
| Context comercial și contabil | Separăm prospectarea nouă de extinderea unei relații existente. | O asociere confirmată cu un client schimbă responsabilul și tipul acțiunii. |
| Dovezi în sistemele existente | Utilizatorul poate acționa din CRM sau dintr-un asistent MCP. | Aceeași versiune de scor și aceleași surse apar pe toate canalele. |
| Conectare controlată | Integrarea nu introduce dubluri sau suprascrieri neclare. | Repetarea evenimentului nu creează o a doua sarcină; jurnalul arată modificarea. |
| Configurare pe servicii | Echipa ajustează întrebările și regulile fără dezvoltare nouă. | Un utilizator configurează și verifică un nou set de semnale. |

### Ce poate deveni avantaj durabil

Valoarea greu de replicat poate veni din biblioteca de servicii și reguli validate, calitatea asocierii între firme și rezultatele măsurate ale recomandărilor. Conectorii întreținuți, cu obiecte și comportamente documentate, pot reduce costul de adoptare. Aceste avantaje trebuie construite și testate; simpla folosire a MCP nu creează o barieră competitivă.

Rezultatele CRM ajută la evaluare. Facturile și încasările pot completa ulterior observarea valorii comerciale, dar nu dovedesc că LeadRadar a cauzat vânzarea. Asocierea cu o recomandare este un indicator de contribuție; impactul incremental cere un grup de comparație și o perioadă adecvată.

Portofoliul Orange România furnizat de echipă poate inspira șabloane. Serviciile efectiv oferite de Orange Systems, piețele prioritare și sistemele interne disponibile trebuie confirmate cu responsabilul pilotului. Datele fiecărui client rămân separate; feedback-ul confidențial nu este presupus reutilizabil pentru alt client.

<!-- PAGEBREAK -->

## 12. Echipa: patru roluri pentru un flux complet

Echipa are **doi dezvoltatori backend/AI, un dezvoltator frontend și un product/project manager**, conform structurii confirmate. Împărțirea de mai jos este propusă pentru execuție. Nu presupune biografii, certificări sau proiecte anterioare care nu au fost furnizate.

| Rol | Responsabilitate principală | Livrabil demonstrabil |
| --- | --- | --- |
| Dezvoltator backend/AI 1 | Colectare, conector CRM, import contabil, identificarea companiei și sincronizare. | Documente și evenimente trasabile, asociate companiei corecte. |
| Dezvoltator backend/AI 2 | Extragere, dovezi, scoring, evaluare și server MCP peste API-ul comun. | Semnale explicate și scor recalculabil pe un set de test. |
| Dezvoltator frontend | Configurarea serviciilor și conexiunilor, dovezi și previzualizarea acțiunilor CRM. | Un flux pe care utilizatorul îl poate parcurge fără asistență tehnică. |
| Product/project manager | Definirea cazului comercial, prioritizare, criterii de acceptare, pilot și prezentare. | Un demo coerent și un raport care leagă funcțiile de rezultate măsurabile. |

### De ce suntem potriviți

Problema necesită simultan integrarea surselor, raționament pe text, o interfață clară și înțelegerea procesului de vânzare. Structura echipei acoperă explicit toate cele patru componente. Doi dezvoltatori backend/AI permit împărțirea colectării și interpretării; frontend-ul face rezultatul accesibil, iar PM-ul păstrează legătura cu decizia comercială și criteriile juriului.

O echipă de patru persoane poate scurta coordonarea și menține responsabilități clare. Pentru ca acest avantaj să existe în practică, stabilim de la început schema datelor și un singur flux demonstrativ comun. Integrarea zilnică și verificarea cap-coadă sunt mai importante decât dezvoltarea multor funcții izolate.

### Cum susținem afirmația „cea mai bună alegere”

Nu avem suficiente informații pentru a afirma superioritatea echipei față de toți participanții. Putem însă susține o promisiune precisă: **o echipă care acoperă întregul traseu de la sursa publică la decizia comercială și își verifică rezultatul pe criterii vizibile.**

În prezentare, această promisiune trebuie dovedită prin trei lucruri: o sursă reală care susține un semnal, o regulă schimbată live care explică reordonarea și un utilizator care poate decide următorul pas fără să interpreteze singur documentele brute.

Pentru versiunea nominală a documentului, pot fi adăugate numele și câte un proiect relevant verificabil pentru fiecare membru. Până atunci, credibilitatea se bazează pe responsabilități și livrabile, nu pe experiență presupusă.

<!-- PAGEBREAK -->

## 13. Pilotul: cum demonstrăm valoarea

Propunem un pilot de patru săptămâni, după hackathon, condiționat de acordul unui partener. Alegem o piață, unul sau două servicii și aproximativ 100 de companii. Un subset separat este folosit pentru reglarea regulilor; rezultatele finale sunt evaluate pe companii nefolosite la reglare.

### Indicatori și praguri propuse

| Indicator | Cum îl măsurăm | Țintă inițială de testare |
| --- | --- | --- |
| Precizia prioritizării | Din primele 20 de conturi, câte sunt considerate relevante pentru serviciu pe baza dovezilor? | Cel puțin 80%; prag orientativ, de agreat cu evaluatorii. |
| Trasabilitate | Câte afirmații comerciale afișate au sursă accesibilă și justificare fidelă? | 100% dintre afirmațiile prezentate ca fapte. |
| Timp de cercetare | Timp median pentru aceeași sarcină, manual și asistat, cu verificare inclusă. | Reducere de cel puțin 50%, fără degradarea calității. |
| Configurabilitate | Un utilizator schimbă o întrebare, o pondere și o regulă, apoi înțelege rezultatul. | Finalizare fără modificarea codului. |
| Utilitate comercială | Conturi acceptate pentru contactare, conversații și oportunități confirmate. | Raportare separată; fără promisiune inițială de conversie. |

Țintele nu sunt rezultate obținute. Precision@20 măsoară acordul asupra prioritizării, nu probabilitatea de cumpărare. Un eșantion mic poate avea variație mare, iar lipsa unei liste complete de oportunități reale limitează măsurarea ratelor de omisiune.

### Protocol de evaluare

Doi evaluatori comerciali folosesc o rubrică comună: compania se încadrează, semnalul este corect, este suficient de recent și justifică serviciul propus. Dezacordurile se discută și se păstrează în raport. Ordinea cazurilor manuale și asistate se alternează pentru a reduce efectul familiarizării.

Înregistrăm separat erorile de identitate, știrile duplicate, informațiile expirate și inferențele prea puternice. Nu ajustăm pragurile pe lotul final și nu alegem doar companiile cu semnale evidente pentru prezentarea preciziei.

### Verificarea integrărilor

Testăm asocierea firmei între CRM și contabilitate, izolarea datelor între clienți, tokenul revocat, răspunsul 429, evenimentele duplicate și reluarea după eroare. O potrivire incertă nu declanșează automat o scriere. Verificăm că utilizatorul MCP primește doar datele pentru care are acces și că două cereri identice produc o singură acțiune CRM.

### Criteriul de continuare

Trecerea la un abonament este justificată dacă utilizatorii acceptă prioritizarea, economisesc timp verificabil și doresc să repete procesul. Dacă semnalele sunt corecte, dar nu influențează deciziile, trebuie ajustat cazul de utilizare. Dacă sursele nu oferă suficiente date, restrângem segmentul sau adăugăm surse permise înainte de extindere.

<!-- PAGEBREAK -->

## 14. Planul de execuție și demonstrația

Viziunea include CRM-uri importante, baze de date, contabilitate și MCP. Pentru patru persoane, o implementare simultană a întregului catalog ar pune în pericol demonstrația. Livrăm un traseu reprezentativ și extindem numai după validare.

### Ordinea de livrare în hackathon

1. **Contract comun de date:** companie, document, semnal, scor și acțiune; alegerea unui serviciu și a firmelor pentru demo.
2. **Traseul principal:** sursă publică → dovadă → evaluare → listă explicată. Frontend-ul și backend-ul lucrează pe aceeași schemă.
3. **Integrare reală:** HubSpot într-un cont de test, citirea companiilor și oportunităților și crearea unei note sau sarcini după confirmare.
4. **Context intern:** PostgreSQL și date contabile de test importate; opțional QuickBooks Sandbox dacă accesul este pregătit. Un import nu este prezentat ca integrare API live.
5. **MCP:** două instrumente de citire care folosesc aceleași servicii interne și aceleași reguli de acces ca dashboard-ul.
6. **Verificare și rezervă:** caz ambiguu, eveniment repetat, eroare de sincronizare și o înregistrare a demo-ului etichetată ca rezervă.

### Scenariu de prezentare în cinci minute

Utilizatorul alege automatizarea și o întrebare personalizată. O companie are un semnal public recent; sistemul deschide dovada. Contextul intern confirmă că este client existent, iar istoricul facturat arată un alt serviciu. LeadRadar propune o discuție de extindere cu responsabilul contului. Utilizatorul verifică și creează sarcina în CRM. Un asistent MCP explică aceeași recomandare. O a doua trimitere nu dublează sarcina.

### După hackathon

Pilotul de patru săptămâni validează utilitatea și un flux CRM plus contabilitate ales de partener. În următoarele 90 de zile, condiționat de rezultate, adăugăm un al doilea CRM și un conector contabil live, mapare reutilizabilă, monitorizarea sincronizărilor și măsurarea costurilor. Catalogul extins rămâne dependent de cerere și accesul API.

### De ce noi

**Echipa noastră acoperă datele și integrările, AI-ul, interfața și produsul. Construim un flux în care fiecare recomandare are o dovadă, ține cont de relația comercială existentă și ajunge în sistemul în care echipa poate acționa. Pentru Orange Systems, promisiunea este mai puțină cercetare repetată și o prioritizare verificabilă, adaptată serviciului vândut.**

Prioritățile urmează brief-ul: acuratețe 25%, AI/ML 20%, configurabilitate 20%, UX 15%, impact și scalabilitate 10%, execuție 10%. Propunem un pilot cu criterii comune, nu presupunem un parteneriat confirmat. Contextul evenimentului: [GigaHack](https://gigahack.md/).
